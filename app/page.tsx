"use client";

import React, { useState } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes"; // Need to export these
import Head from "next/head";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";

const Themes = {
  "Light Mode": DEFAULT_THEME,
  "Dark Mode": DARK_THEME,
};

export default function Home() {
  const router = useRouter();
  const activeYaml = useAppStore((state) => state.activeYaml);
  const setActiveYaml = useAppStore((state) => state.setActiveYaml);

  const [selectedThemeName, setSelectedThemeName] = useState<keyof typeof Themes>("Light Mode");
  const [parsedSong, setParsedSong] = useState(MCSParser.parse(activeYaml)); // Initial state
  const [parseError, setParseError] = useState<string | null>(null);

  // Sync with store and handle errors gracefully
  React.useEffect(() => {
    try {
      const song = MCSParser.parse(activeYaml);
      setParsedSong(song);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
      // Fallback: We don't update parsedSong, so it keeps the last valid version (if any)
      // or we could show an error state.
    }
  }, [activeYaml]);

  const handleOpenEditor = () => {
    // No need to setActiveYaml(sample) anymore, as the store IS the source of truth.
    router.push("/editor");
  };

  const handleCreateNew = () => {
    setActiveYaml(`schema_version: "1.0.0"
metadata:
  title: "New Song"
  artist: "Unknown"
sections:
  - id: "s1"
    type: "verse"
    lines:
      - "Start [C]typing here..."
`);
    router.push("/editor");
  }

  return (
    <div className="flex flex-col gap-8 p-8 min-h-screen" style={{
      backgroundColor: Themes[selectedThemeName].colors.background
    }}>
      <div className="flex justify-between items-center border-b pb-4 mb-4" style={{
        borderColor: Themes[selectedThemeName].colors.section_header,
        color: Themes[selectedThemeName].colors.text_primary
      }}>
        <h1 className="text-2xl font-bold">MCS Viewer</h1>

        <div className="flex gap-4 items-center">
          {/* Theme Selector */}
          <select
            value={selectedThemeName}
            onChange={(e) => setSelectedThemeName(e.target.value as any)}
            className="px-3 py-2 rounded border bg-white text-black text-sm"
          >
            {Object.keys(Themes).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <button onClick={handleOpenEditor} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
            Edit Song
          </button>
          <button onClick={handleCreateNew} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
            New Song
          </button>
        </div>
      </div>

      {parseError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error loading song: </strong>
          <span className="block sm:inline">{parseError}</span>
        </div>
      )}

      {/* Single Viewer */}
      <SongViewer song={parsedSong} theme={Themes[selectedThemeName]} />
    </div>
  );
}
