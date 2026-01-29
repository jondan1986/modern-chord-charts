
import { create } from 'zustand';

import { songStorage } from '@/src/services/storage';
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes";
import { Theme } from "@/src/mcs-core/model";

interface AppState {
  activeYaml: string;
  activeSongId: string | undefined; // Undefined = New/Unsaved
  theme: Theme;
  lastSavedYaml: string;

  // Setlist Mode
  activeSetlistId: string | null;
  activeSetlistSongs: string[]; // List of song IDs in order
  currentSetlistIndex: number;

  setActiveYaml: (yaml: string) => void;
  loadSong: (id: string) => Promise<void>;
  saveCurrentSong: () => Promise<void>;
  resetSong: () => void;
  toggleTheme: () => void;

  // Setlist Actions
  startSetlist: (id: string, songIds: string[]) => Promise<void>;
  nextSetlistSong: () => Promise<void>;
  prevSetlistSong: () => Promise<void>;
  exitSetlist: () => void;
}

const DEFAULT_YAML = `schema_version: "1.0.0"
metadata:
  title: "Amazing Grace"
  artist: "John Newton"
  key: "G"
  tempo: 60
sections:
  - id: "v1"
    type: "verse"
    label: "Verse 1"
    lines:
      - "A[G]mazing grace! How [C]sweet the [G]sound"
      - "That [G]saved a wretch like [D]me!"
      - "I [G]once was lost, but [C]now am [G]found;"
      - "Was [Em]blind, but [D]now I [G]see."
  - id: "c1"
    type: "chorus"
    label: "Chorus"
    lines:
      - "My [G]chains are gone, I've [C]been set [G]free"
      - "My [G]God, my Savior has [D]ransomed me"
      - "And [G]like a flood His [C]mercy [G]reigns"
      - "Un[Em]ending [D]love, A[G]mazing grace"
`;

export const useAppStore = create<AppState>((set, get) => ({
  activeYaml: DEFAULT_YAML,
  activeSongId: undefined,
  theme: DEFAULT_THEME,
  lastSavedYaml: DEFAULT_YAML,
  activeSetlistId: null,
  activeSetlistSongs: [],
  currentSetlistIndex: -1,

  setActiveYaml: (yaml) => set({ activeYaml: yaml }),

  toggleTheme: () => {
    const current = get().theme;
    set({ theme: current.name === "Dark Mode" ? DEFAULT_THEME : DARK_THEME });
  },

  loadSong: async (id) => {
    const record = await songStorage.getSong(id);
    if (record) {
      set({ activeYaml: record.yaml, activeSongId: record.id, lastSavedYaml: record.yaml });
    } else {
      // If we fail to load a song in setlist mode, we might want to handle it, but for now just error
      console.error("Song not found:", id);
    }
  },

  saveCurrentSong: async () => {
    const { activeYaml, activeSongId } = get();
    const newId = await songStorage.saveSong(activeYaml, activeSongId);
    set({ activeSongId: newId, lastSavedYaml: activeYaml });
  },

  resetSong: () => {
    const defaultYaml = `schema_version: "1.0.0"
metadata:
  title: "New Song"
  artist: "Unknown"
sections:
  - id: "s1"
    type: "verse"
    lines:
      - "Start [C]typing here..."
`;
    set({
      activeYaml: defaultYaml,
      activeSongId: undefined,
      lastSavedYaml: defaultYaml,
      activeSetlistId: null, // Reset exits setlist mode
      activeSetlistSongs: [],
      currentSetlistIndex: -1
    });
  },

  startSetlist: async (id, songIds) => {
    if (songIds.length === 0) return;
    set({ activeSetlistId: id, activeSetlistSongs: songIds, currentSetlistIndex: 0 });
    // Load first song
    await get().loadSong(songIds[0]);
  },

  nextSetlistSong: async () => {
    const { activeSetlistSongs, currentSetlistIndex, loadSong } = get();
    if (currentSetlistIndex < activeSetlistSongs.length - 1) {
      const nextIndex = currentSetlistIndex + 1;
      set({ currentSetlistIndex: nextIndex });
      await loadSong(activeSetlistSongs[nextIndex]);
    }
  },

  prevSetlistSong: async () => {
    const { activeSetlistSongs, currentSetlistIndex, loadSong } = get();
    if (currentSetlistIndex > 0) {
      const prevIndex = currentSetlistIndex - 1;
      set({ currentSetlistIndex: prevIndex });
      await loadSong(activeSetlistSongs[prevIndex]);
    }
  },

  exitSetlist: () => {
    set({ activeSetlistId: null, activeSetlistSongs: [], currentSetlistIndex: -1 });
  }
}));
