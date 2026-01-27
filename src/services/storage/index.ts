
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

interface StoredSong {
    id: string;
    title: string;
    artist: string;
    yaml: string;
    updatedAt: number;
}

interface MCSRepo extends DBSchema {
    songs: {
        key: string;
        value: StoredSong;
        indexes: { 'by-title': string; 'by-updated': number };
    };
}

const DB_NAME = 'mcs-library';
const STORE_NAME = 'songs';

class StorageService {
    private _dbPromise: Promise<IDBPDatabase<MCSRepo>> | undefined;

    private async getDB() {
        if (typeof window === 'undefined') {
            throw new Error("Cannot access IndexedDB on the server.");
        }

        if (!this._dbPromise) {
            this._dbPromise = openDB<MCSRepo>(DB_NAME, 1, {
                upgrade(db) {
                    const store = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                    });
                    store.createIndex('by-title', 'title');
                    store.createIndex('by-updated', 'updatedAt');
                },
            });
        }
        return this._dbPromise;
    }

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

        await db.put(STORE_NAME, record);
        return id;
    }

    async getSong(id: string): Promise<StoredSong | undefined> {
        const db = await this.getDB();
        return db.get(STORE_NAME, id);
    }

    async getAllSongs(): Promise<StoredSong[]> {
        const db = await this.getDB();
        return db.getAllFromIndex(STORE_NAME, 'by-updated');
    }

    async deleteSong(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORE_NAME, id);
    }

    // Backup/Restore
    async exportLibrary(): Promise<string> {
        const all = await this.getAllSongs();
        return JSON.stringify(all, null, 2);
    }

    async importLibrary(json: string): Promise<void> {
        const db = await this.getDB();
        const records = JSON.parse(json) as StoredSong[];
        const tx = db.transaction(STORE_NAME, 'readwrite');
        await Promise.all([
            ...records.map(r => tx.store.put(r)),
            tx.done
        ]);
    }
}

export const songStorage = new StorageService();
