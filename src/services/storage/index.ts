import {
  listSongs,
  getSongFile,
  saveSongFile,
  deleteSongFile,
  listSetlists,
  getSetlistFile,
  saveSetlistFile,
  deleteSetlistFile,
  FileSong,
} from '@/src/actions/file-storage';
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
  songs: string[];
  updatedAt: number;
}

function toStoredSong(f: FileSong): StoredSong {
  return { id: f.id, title: f.title, artist: f.artist, yaml: f.yaml, updatedAt: f.updatedAt };
}

class FileStorageService {

  // --- Songs ---

  async saveSong(yaml: string, existingId?: string): Promise<string> {
    return saveSongFile(yaml, existingId);
  }

  async getSong(id: string): Promise<StoredSong | undefined> {
    const song = await getSongFile(id);
    return song ? toStoredSong(song) : undefined;
  }

  async getAllSongs(): Promise<StoredSong[]> {
    const songs = await listSongs();
    return songs.map(toStoredSong);
  }

  async deleteSong(id: string): Promise<void> {
    return deleteSongFile(id);
  }

  // --- Setlists ---

  async saveSetlist(setlist: Partial<StoredSetlist>): Promise<string> {
    const id = setlist.id ?? uuidv4();
    const name = setlist.title ?? 'Untitled Setlist';
    const songIds = setlist.songs ?? [];
    return saveSetlistFile(id, name, songIds);
  }

  async getSetlist(id: string): Promise<StoredSetlist | undefined> {
    const s = await getSetlistFile(id);
    if (!s) return undefined;
    return { id: s.id, title: s.name, songs: s.songIds, updatedAt: s.updatedAt };
  }

  async getAllSetlists(): Promise<StoredSetlist[]> {
    const setlists = await listSetlists();
    return setlists.map(s => ({ id: s.id, title: s.name, songs: s.songIds, updatedAt: s.updatedAt }));
  }

  async deleteSetlist(id: string): Promise<void> {
    return deleteSetlistFile(id);
  }

  // Backup/Restore
  async exportLibrary(): Promise<string> {
    return "";
  }

  async importLibrary(_json: string): Promise<void> {
    // no-op
  }
}

export const songStorage = new FileStorageService();
