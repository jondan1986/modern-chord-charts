
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface StoredSong {
    id: string;
    title: string;
    artist: string;
    yaml: string;
    updatedAt: number;
}

export interface StoredSetlist {
    id: string;
    title: string;
    songs: string[]; // List of Song IDs
    updatedAt: number;
}

interface MCSRepo extends DBSchema {
    songs: {
        key: string;
        value: StoredSong;
        indexes: { 'by-title': string; 'by-updated': number };
    };
    setlists: {
        key: string;
        value: StoredSetlist;
        indexes: { 'by-updated': number };
    };
}

const DB_NAME = 'mcs-library';
const STORE_SONGS = 'songs';
const STORE_SETLISTS = 'setlists';

class StorageService {
    private _dbPromise: Promise<IDBPDatabase<MCSRepo>> | undefined;

    private async getDB() {
        if (typeof window === 'undefined') {
            throw new Error("Cannot access IndexedDB on the server.");
        }

        if (!this._dbPromise) {
            this._dbPromise = openDB<MCSRepo>(DB_NAME, 2, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    // Version 1: Songs
                    if (oldVersion < 1) {
                        const songStore = db.createObjectStore(STORE_SONGS, {
                            keyPath: 'id',
                        });
                        songStore.createIndex('by-title', 'title');
                        songStore.createIndex('by-updated', 'updatedAt');
                    }

                    // Version 2: Setlists
                    if (oldVersion < 2) {
                        const setlistStore = db.createObjectStore(STORE_SETLISTS, {
                            keyPath: 'id',
                        });
                        setlistStore.createIndex('by-updated', 'updatedAt');
                    }
                },
            });
        }
        return this._dbPromise;
    }

    // --- Songs ---
    async saveSong(yaml: string, existingId?: string): Promise<string> {
        const db = await this.getDB();

        // Quick parse to extract metadata (title/artist) for indexing
        const titleMatch = yaml.match(/title:\s*"([^"]+)"/);
        const artistMatch = yaml.match(/artist:\s*"([^"]+)"/);

        const title = titleMatch ? titleMatch[1] : 'Untitled';
        const artist = artistMatch ? artistMatch[1] : 'Unknown';
        const id = existingId || uuidv4();

        const record: StoredSong = {
            id,
            title,
            artist,
            yaml,
            updatedAt: Date.now()
        };

        await db.put(STORE_SONGS, record);
        return id;
    }

    async getSong(id: string): Promise<StoredSong | undefined> {
        const db = await this.getDB();
        return db.get(STORE_SONGS, id);
    }

    async getAllSongs(): Promise<StoredSong[]> {
        const db = await this.getDB();
        return db.getAllFromIndex(STORE_SONGS, 'by-updated');
    }

    async deleteSong(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORE_SONGS, id);
    }

    // --- Setlists ---
    async saveSetlist(setlist: Partial<StoredSetlist>): Promise<string> {
        const db = await this.getDB();
        const id = setlist.id || uuidv4();

        const record: StoredSetlist = {
            id,
            title: setlist.title || 'Untitled Setlist',
            songs: setlist.songs || [],
            updatedAt: Date.now()
        };

        await db.put(STORE_SETLISTS, record);
        return id;
    }

    async getSetlist(id: string): Promise<StoredSetlist | undefined> {
        const db = await this.getDB();
        return db.get(STORE_SETLISTS, id);
    }

    async getAllSetlists(): Promise<StoredSetlist[]> {
        const db = await this.getDB();
        return db.getAllFromIndex(STORE_SETLISTS, 'by-updated');
    }

    async deleteSetlist(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORE_SETLISTS, id);
    }


    // Backup/Restore
    async exportLibrary(): Promise<string> {
        const songs = await this.getAllSongs();
        const setlists = await this.getAllSetlists();
        // Wrap in object for V2 export
        return JSON.stringify({ version: 2, songs, setlists }, null, 2);
    }

    async importLibrary(json: string): Promise<void> {
        const db = await this.getDB();
        const data = JSON.parse(json);

        // Handle legacy backup (array of songs only) or V2 object
        const songs = Array.isArray(data) ? data : data.songs || [];
        const setlists = Array.isArray(data) ? [] : data.setlists || [];

        const tx = db.transaction([STORE_SONGS, STORE_SETLISTS], 'readwrite');

        const promises = [];
        for (const s of songs) promises.push(tx.objectStore(STORE_SONGS).put(s));
        for (const s of setlists) promises.push(tx.objectStore(STORE_SETLISTS).put(s));

        await Promise.all([...promises, tx.done]);
    }
}

export const songStorage = new StorageService();
