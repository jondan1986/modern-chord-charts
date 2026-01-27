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
  const theme = useAppStore((state) => state.theme);

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
    }
  }, [activeYaml]);

  const handleOpenEditor = () => {
    router.push("/editor");
  };

  const handleCreateNew = () => {
    useAppStore.getState().resetSong();
    router.push("/editor");
  }

  return (
    <div className="flex flex-col gap-8 p-8 h-full overflow-y-auto" style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.text_primary
    }}>
      <div className="flex justify-between items-center bg-gray-100 p-6 rounded-lg dark:bg-gray-800" style={{
        borderColor: theme.colors.section_header,
      }}>
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Modern Chord Charts</h1>
          <p className="text-gray-600 dark:text-gray-400">View, Edit, and Manage your song library with ease.</p>
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={handleOpenEditor} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-500 transition-colors font-medium">
            Edit Current Song
          </button>
          <button onClick={handleCreateNew} className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-500 transition-colors font-medium">
            + Create New Song
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
      <div className="border rounded-xl shadow-sm overflow-hidden" style={{ borderColor: theme.colors.section_header }}>
        <SongViewer song={parsedSong} theme={theme} />
      </div>
    </div>
  );
}
