
import { create } from 'zustand';

import { songStorage } from '@/src/services/storage';

interface AppState {
  activeYaml: string;
  activeSongId: string | undefined; // Undefined = New/Unsaved
  setActiveYaml: (yaml: string) => void;
  loadSong: (id: string) => Promise<void>;
  saveCurrentSong: () => Promise<void>;
  resetSong: () => void;
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
  setActiveYaml: (yaml) => set({ activeYaml: yaml }),

  loadSong: async (id) => {
    const record = await songStorage.getSong(id);
    if (record) {
      set({ activeYaml: record.yaml, activeSongId: record.id });
    } else {
      console.error("Song not found:", id);
    }
  },

  saveCurrentSong: async () => {
    const { activeYaml, activeSongId } = get();
    const newId = await songStorage.saveSong(activeYaml, activeSongId);
    set({ activeSongId: newId });
  },

  resetSong: () => {
    set({
      activeYaml: `schema_version: "1.0.0"
metadata:
  title: "New Song"
  artist: "Unknown"
sections:
  - id: "s1"
    type: "verse"
    lines:
      - "Start [C]typing here..."
`,
      activeSongId: undefined
    });
  }
}));
