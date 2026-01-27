
"use client";

import React, { useState, useEffect } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes";
import { Song, Theme } from "@/src/mcs-core/model";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";

export default function EditorPage() {
    // Global Store
    const activeYaml = useAppStore((state) => state.activeYaml);
    const setActiveYaml = useAppStore((state) => state.setActiveYaml);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);

    // Local State
    const [parsedSong, setParsedSong] = useState<Song | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

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

    const toggleTheme = () => {
        setTheme(prev => prev.name === "Dark Mode" ? DEFAULT_THEME : DARK_THEME);
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                <div className="font-bold text-xl">MCS Editor</div>
                <div className="flex gap-4 items-center">
                    {error && (
                        <div className="text-red-400 text-sm font-mono px-2 animate-pulse">
                            Syntax Error: {error.split('\n')[0]}
                        </div>
                    )}
                    <Link href="/library" className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-500 text-sm">
                        Library
                    </Link>
                    <button onClick={() => saveCurrentSong()} className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 text-sm font-bold">
                        {activeSongId ? "Save" : "Save As..."}
                    </button>

                    <button onClick={toggleTheme} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 border border-gray-600 text-sm">
                        Theme: {theme.name}
                    </button>
                    <Link href="/" className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 text-sm">
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Pane (Left) */}
                <div className="w-1/2 flex flex-col border-r border-gray-300 relative">
                    <textarea
                        className="flex-1 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-gray-50 text-gray-900 leading-6"
                        value={activeYaml}
                        onChange={(e) => handleYamlChange(e.target.value)}
                        spellCheck={false}
                    />
                </div>

                {/* Preview Pane (Right) */}
                <div className="w-1/2 overflow-y-auto bg-white relative">
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
