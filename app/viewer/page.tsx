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

  return (
    <div className="flex flex-col gap-8 p-8 h-full overflow-y-auto" style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.text_primary
    }}>


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
