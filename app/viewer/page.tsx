"use client";

import React, { useState } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes"; // Need to export these
import Head from "next/head";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";
import { EditMetadataModal } from "@/src/components/modals/EditMetadataModal";
import { parseDocument } from "yaml";

const Themes = {
  "Light Mode": DEFAULT_THEME,
  "Dark Mode": DARK_THEME,
};

export default function Home() {
  const router = useRouter();
  const activeYaml = useAppStore((state) => state.activeYaml);
  const setActiveYaml = useAppStore((state) => state.setActiveYaml);
  const theme = useAppStore((state) => state.theme);

  const activeSetlistId = useAppStore((state) => state.activeSetlistId);
  const activeSetlistSongs = useAppStore((state) => state.activeSetlistSongs);
  const currentSetlistIndex = useAppStore((state) => state.currentSetlistIndex);
  const nextSetlistSong = useAppStore((state) => state.nextSetlistSong);
  const prevSetlistSong = useAppStore((state) => state.prevSetlistSong);

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

  // Keyboard Shortcuts for Setlist Navigation
  React.useEffect(() => {
    if (!activeSetlistId) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSetlistSong();
      } else if (e.key === "ArrowLeft") {
        prevSetlistSong();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeSetlistId, nextSetlistSong, prevSetlistSong]);

  // Metadata Editing
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

  const handleMetadataSave = (newMetadata: any) => {
    try {
      // We need to update the YAML with the new metadata
      // Since we don't have the "parseDocument" from 'yaml' here easily without importing it,
      // and we want to keep logic consistent.

      // Let's import 'yaml' dynamically or at top level.
      // For now, I'll use the store's activeYaml.

      const doc = parseDocument(activeYaml);
      if (!doc.has("metadata")) {
        doc.set("metadata", {});
      }

      // Update fields
      Object.keys(newMetadata).forEach(key => {
        const val = newMetadata[key];
        if (val !== undefined && val !== "") {
          doc.setIn(["metadata", key], val);
        } else {
          if (val === undefined) {
            doc.deleteIn(["metadata", key]);
          } else {
            doc.setIn(["metadata", key], val);
          }
        }
      });

      const newYaml = doc.toString();
      // Update Store (which updates activeYaml -> triggers useEffect -> updates parsedSong)
      setActiveYaml(newYaml);
      // Also save to IDB if we have an active song ID
      // useAppStore.getState().saveCurrentSong(); // Optional: Auto-save? user might want to explicitly save. 
      // Editors usually auto-update state but manual save to disk.

    } catch (e: any) {
      console.error("Failed to update metadata", e);
      alert("Failed to update metadata");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 h-full overflow-y-auto relative" style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.text_primary
    }}>

      {/* Setlist Controls Overlay */}
      {activeSetlistId && (
        <>
          {/* Prev Arrow */}
          <button
            onClick={prevSetlistSong}
            disabled={currentSetlistIndex <= 0}
            className="fixed left-4 top-1/2 transform -translate-y-1/2 p-4 bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full backdrop-blur-sm transition disabled:opacity-0 z-50 group"
            title="Previous Song (Left Arrow)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          {/* Next Arrow */}
          <button
            onClick={nextSetlistSong}
            disabled={currentSetlistIndex >= activeSetlistSongs.length - 1}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 p-4 bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full backdrop-blur-sm transition disabled:opacity-0 z-50 group"
            title="Next Song (Right Arrow)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          {/* Setlist Progress Info */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-xs backdrop-blur-md z-50">
            Setlist: {currentSetlistIndex + 1} / {activeSetlistSongs.length}
          </div>
        </>
      )}


      {parseError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error loading song: </strong>
          <span className="block sm:inline">{parseError}</span>
        </div>
      )}

      {/* Single Viewer */}
      <div className="border rounded-xl shadow-sm overflow-hidden min-h-[500px]" style={{ borderColor: theme.colors.section_header }}>
        <SongViewer
          song={parsedSong}
          theme={theme}
          onEditMetadata={() => setIsMetadataModalOpen(true)}
        />
      </div>

      {/* Edit Metadata Modal */}
      <EditMetadataModal
        isOpen={isMetadataModalOpen}
        onClose={() => setIsMetadataModalOpen(false)}
        initialMetadata={parsedSong?.metadata}
        onSave={handleMetadataSave}
      />
    </div>
  );
}
