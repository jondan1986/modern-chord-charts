
"use client";

import React, { useState, useEffect } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes";
import { Song, Theme } from "@/src/mcs-core/model";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";

export default function EditorPage() {
    // Global Store
    const activeYaml = useAppStore((state) => state.activeYaml);
    const setActiveYaml = useAppStore((state) => state.setActiveYaml);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);
    const resetSong = useAppStore((state) => state.resetSong);
    const router = useRouter();

    // Local State
    const [parsedSong, setParsedSong] = useState<Song | null>(null);
    const [error, setError] = useState<string | null>(null);
    const theme = useAppStore((state) => state.theme);

    // Initial Load from Store
    useEffect(() => {
        // Attempt to parse the starting YAML immediately
        try {
            const song = MCSParser.parse(activeYaml);
            setParsedSong(song);
        } catch (err) {
            // If initial store is invalid, that's okay, just don't crash
        }
    }, []);

    // Handle Input Changes
    const handleYamlChange = (newYaml: string) => {
        setActiveYaml(newYaml); // Update global store

        try {
            const song = MCSParser.parse(newYaml);
            setParsedSong(song);
            setError(null); // Clear error on success
        } catch (err: any) {
            setError(err.message);
            // Important: We DO NOT clear parsedSong here. 
            // We keep the last valid render to prevent flickering.
        }
    };



    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Pane (Left) */}
                <div className="w-1/2 flex flex-col border-r relative" style={{ borderColor: theme.colors.section_header }}>
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-2 text-xs font-mono border-b border-red-200">
                            Syntax Error: {error.split('\n')[0]}
                        </div>
                    )}
                    <textarea
                        className="flex-1 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none leading-6 dark:bg-gray-900"
                        style={{
                            backgroundColor: theme.name === 'Dark Mode' ? '#1a1a1a' : '#f9fafb',
                            color: theme.colors.text_primary
                        }}
                        value={activeYaml}
                        onChange={(e) => handleYamlChange(e.target.value)}
                        spellCheck={false}
                    />
                </div>

                {/* Preview Pane (Right) */}
                <div className="w-1/2 overflow-y-auto relative" style={{ backgroundColor: theme.colors.background }}>
                    {parsedSong ? (
                        <div className="transform scale-90 origin-top-left p-4">
                            <SongViewer song={parsedSong} theme={theme} />
                        </div>
                    ) : (
                        <div className="p-10 text-gray-400 text-center">
                            {/* Fallback if no song is parsed yet */}
                            Start typing to see the Chart...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
