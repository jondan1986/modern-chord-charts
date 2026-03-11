// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use client";

import { useAppStore } from "@/src/state/store";
import { usePathname, useRouter } from "next/navigation";
import { songStorage } from "@/src/services/storage";
import Link from "next/link";
import { useRef } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { ChordProExporter } from "@/src/services/export/chordpro";

export default function ActionBar() {
    const theme = useAppStore((state) => state.theme);
    const resetSong = useAppStore((state) => state.resetSong);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);
    const activeYaml = useAppStore((state) => state.activeYaml);
    const lastSavedYaml = useAppStore((state) => state.lastSavedYaml);
    const loadSong = useAppStore((state) => state.loadSong);

    const selectedSongId = useAppStore((state) => state.selectedSongId);
    const selectedSetlistId = useAppStore((state) => state.selectedSetlistId);
    const setSelectedSongId = useAppStore((state) => state.setSelectedSongId);
    const setSelectedSetlistId = useAppStore((state) => state.setSelectedSetlistId);

    const router = useRouter();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDirty = activeYaml !== lastSavedYaml;

    const handleNewSong = () => {
        resetSong();
        router.push("/editor");
    };

    const handleExportChordPro = () => {
        try {
            const song = MCSParser.parse(activeYaml);
            const chordPro = ChordProExporter.export(song);
            const blob = new Blob([chordPro], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${song.metadata.title || 'song'}.cho`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Failed to export: could not parse current song.');
        }
    };

    const handleSave = async () => {
        await saveCurrentSong();
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            try {
                // Basic detection: JSON vs YAML
                if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                    await songStorage.importLibrary(content);
                    alert("Library Imported Successfully!");
                } else {
                    // Assume single YAML file
                    await songStorage.saveSong(content);
                    alert("Song Imported Successfully!");
                }
                window.location.reload();
            } catch (err) {
                alert("Failed to import: " + err);
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExportLibrary = async () => {
        const json = await songStorage.exportLibrary();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mcs_library_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Selection-based handlers for library page ---
    const handleSelectedOpen = async () => {
        if (selectedSongId) {
            await loadSong(selectedSongId);
            setSelectedSongId(null);
            router.push("/viewer");
        }
    };

    const handleSelectedEdit = async () => {
        if (selectedSongId) {
            await loadSong(selectedSongId);
            setSelectedSongId(null);
            router.push("/editor");
        }
    };

    const handleSelectedDelete = async () => {
        if (selectedSongId) {
            if (confirm("Are you sure you want to delete this song?")) {
                await songStorage.deleteSong(selectedSongId);
                setSelectedSongId(null);
                window.location.reload();
            }
        } else if (selectedSetlistId) {
            if (confirm("Are you sure you want to delete this setlist?")) {
                await songStorage.deleteSetlist(selectedSetlistId);
                setSelectedSetlistId(null);
                window.location.reload();
            }
        }
    };

    const handleSelectedExportMCS = async () => {
        if (!selectedSongId) return;
        const record = await songStorage.getSong(selectedSongId);
        if (!record) return;
        const blob = new Blob([record.yaml], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${record.title.replace(/[^a-z0-9]/gi, '_')}.mcs`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSelectedExportChordPro = async () => {
        if (!selectedSongId) return;
        const record = await songStorage.getSong(selectedSongId);
        if (!record) return;
        try {
            const song = MCSParser.parse(record.yaml);
            const chordPro = ChordProExporter.export(song);
            const blob = new Blob([chordPro], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${song.metadata.title || 'song'}.cho`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Failed to export: could not parse song.');
        }
    };

    const handleSelectedOpenSetlist = () => {
        if (selectedSetlistId) {
            setSelectedSetlistId(null);
            router.push(`/setlist/${selectedSetlistId}`);
        }
    };

    const btnBase = "flex items-center gap-2 px-4 py-2 rounded transition shadow-sm font-medium text-sm";
    const btnGray = `${btnBase} bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600`;
    const btnGreen = `${btnBase} bg-green-600 text-white hover:bg-green-500`;
    const btnBlue = `${btnBase} bg-blue-600 text-white hover:bg-blue-500`;
    const btnRed = `${btnBase} bg-red-600 text-white hover:bg-red-500`;

    // Render content based on path
    const renderContent = () => {
        if (pathname === '/viewer') {
            return (
                <>
                    <button onClick={() => window.print()} className={btnGray}>
                        Print
                    </button>
                    <button onClick={handleExportChordPro} className={btnGray}>
                        ChordPro
                    </button>
                    <Link href="/editor" className={btnBlue}>
                        Edit Song
                    </Link>
                    <button onClick={handleNewSong} className={btnGreen}>
                        New Song
                    </button>
                </>
            );
        }

        if (pathname === '/') {
            // Selection-based actions
            if (selectedSongId) {
                return (
                    <>
                        <button onClick={handleSelectedOpen} className={btnBlue}>
                            Open
                        </button>
                        <button onClick={handleSelectedEdit} className={btnGray}>
                            Edit
                        </button>
                        <button onClick={handleSelectedExportMCS} className={btnGray}>
                            Export MCS
                        </button>
                        <button onClick={handleSelectedExportChordPro} className={btnGray}>
                            Export ChordPro
                        </button>
                        <button onClick={handleSelectedDelete} className={btnRed}>
                            Delete
                        </button>
                    </>
                );
            }

            if (selectedSetlistId) {
                return (
                    <>
                        <button onClick={handleSelectedOpenSetlist} className={btnBlue}>
                            Open
                        </button>
                        <button onClick={handleSelectedDelete} className={btnRed}>
                            Delete
                        </button>
                    </>
                );
            }

            // Default: nothing selected
            return (
                <>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json,.mcs,.yaml,.yml" onChange={handleImport} />
                    <button onClick={handleExportLibrary} className={btnGray}>
                        Export Library
                    </button>
                    <button onClick={triggerImport} className={btnGray}>
                        Import
                    </button>
                    <button onClick={handleNewSong} className={btnGreen}>
                        New Song
                    </button>
                </>
            );
        }

        if (pathname === '/editor') {
            return (
                <>
                    <button
                        onClick={handleSave}
                        className={`${btnBase} ${isDirty ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        {isDirty ? "Save (Unsaved)" : "Save"}
                    </button>
                    <button onClick={handleNewSong} className={btnGreen}>
                        New
                    </button>
                    <Link href="/" className={btnGray}>
                        Cancel
                    </Link>
                </>
            );
        }

        if (pathname === '/playback') {
            return null; // Playback page manages its own controls
        }

        return null;
    };

    return (
        <div className="action-bar h-12 md:h-14 flex items-center justify-end px-3 md:px-6 border-b shrink-0 gap-2 md:gap-3 flex-wrap transition-colors duration-300"
            style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.section_header,
            }}>
            {renderContent()}
        </div>
    );
}
