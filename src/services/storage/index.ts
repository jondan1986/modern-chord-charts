import { listSongs, saveSongFile, deleteSongFile, FileSong } from '@/src/actions/file-storage';

export interface StoredSong {
    id: string; // filename
    title: string; // display title
    artist: string;
    yaml: string; // full content
    updatedAt: number;
}

export interface StoredSetlist {
    id: string;
    title: string;
    songs: string[];
    updatedAt: number;
}

// Re-export interface to match expected types locally if needed,
// but we updated index.ts so we are editing strict place.
// The previous interface was:
// export interface StoredSong { id, title, artist, yaml, updatedAt }
// Our new FileSong matches this signature.

class FileStorageService {

    // --- Songs ---

    async saveSong(yaml: string, existingId?: string): Promise<string> {
        // existingId is the filename
        return await saveSongFile(yaml, existingId);
    }

    async getSong(id: string): Promise<StoredSong | undefined> {
        // We can just fetch all and find, or implement single read action.
        // For efficiency, let's just fetch all for now or add getFile action later.
        // Given local fs, reading all headers isn't too expensive for small libraries.
        // But better: use listSongs() which reads all.
        // To optimize, we should add `getSongFile` action.
        // For now, reuse listSongs.
        const songs = await listSongs();
        return songs.find(s => s.id === id);
    }

    async getAllSongs(): Promise<StoredSong[]> {
        return await listSongs();
    }

    async deleteSong(id: string): Promise<void> {
        return await deleteSongFile(id);
    }

    // --- Setlists ---
    // (Stubbed for now, as file-system setlists are a new req if we strictly follow file structure.
    // We could store setlists as .json files in /setlists folder?)

    async saveSetlist(setlist: Partial<StoredSetlist>): Promise<string> {
        console.warn("Setlist storage not yet implemented for File System mode.");
        return "mock-id";
    }

    async getSetlist(id: string): Promise<StoredSetlist | undefined> {
        return undefined;
    }

    async getAllSetlists(): Promise<StoredSetlist[]> {
        return [];
    }

    async deleteSetlist(id: string): Promise<void> {
        // no-op
    }

    // Backup/Restore
    async exportLibrary(): Promise<string> {
        return "";
    }

    async importLibrary(json: string): Promise<void> {
        // no-op
    }
}

export const songStorage = new FileStorageService();
