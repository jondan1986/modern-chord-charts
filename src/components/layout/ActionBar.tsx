// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use client";

import { useAppStore } from "@/src/state/store";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MCSParser } from "@/src/mcs-core/parser";
import { ChordProExporter } from "@/src/services/export/chordpro";
import { songStorage } from "@/src/services/storage";
import {
    Plus, Download, Upload, CloudDownload, Search, Music,
    Eye, Pencil, FileDown, FileOutput, Trash2,
    Printer, Save, X,
} from "lucide-react";

export default function ActionBar() {
    const theme = useAppStore((state) => state.theme);
    const resetSong = useAppStore((state) => state.resetSong);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeYaml = useAppStore((state) => state.activeYaml);
    const lastSavedYaml = useAppStore((state) => state.lastSavedYaml);
    const loadSong = useAppStore((state) => state.loadSong);

    const selectedSongId = useAppStore((state) => state.selectedSongId);
    const selectedSetlistId = useAppStore((state) => state.selectedSetlistId);
    const setSelectedSongId = useAppStore((state) => state.setSelectedSongId);
    const setSelectedSetlistId = useAppStore((state) => state.setSelectedSetlistId);

    const setShowImportModal = useAppStore((state) => state.setShowImportModal);
    const setShowExportModal = useAppStore((state) => state.setShowExportModal);
    const setShowPlanningCenterModal = useAppStore((state) => state.setShowPlanningCenterModal);
    const setShowPraiseChartsModal = useAppStore((state) => state.setShowPraiseChartsModal);
    const setShowSongSelectModal = useAppStore((state) => state.setShowSongSelectModal);

    const router = useRouter();
    const pathname = usePathname();

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
            const id = selectedSetlistId;
            setSelectedSetlistId(null);
            router.push(`/setlist/${id}`);
        }
    };

    const btnBase = "flex items-center gap-1.5 px-3 py-2 rounded transition shadow-sm font-medium text-sm";
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
                        <Printer size={16} /> Print
                    </button>
                    <button onClick={handleExportChordPro} className={btnGray}>
                        <FileOutput size={16} /> ChordPro
                    </button>
                    <Link href="/editor" className={btnBlue}>
                        <Pencil size={16} /> Edit Song
                    </Link>
                    <button onClick={handleNewSong} className={btnGreen}>
                        <Plus size={16} /> New Song
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
                            <Eye size={16} /> Open
                        </button>
                        <button onClick={handleSelectedEdit} className={btnGray}>
                            <Pencil size={16} /> Edit
                        </button>
                        <button onClick={handleSelectedExportMCS} className={btnGray}>
                            <FileDown size={16} /> Export MCS
                        </button>
                        <button onClick={handleSelectedExportChordPro} className={btnGray}>
                            <FileOutput size={16} /> Export ChordPro
                        </button>
                        <button onClick={handleSelectedDelete} className={btnRed}>
                            <Trash2 size={16} /> Delete
                        </button>
                    </>
                );
            }

            if (selectedSetlistId) {
                return (
                    <>
                        <button onClick={handleSelectedOpenSetlist} className={btnBlue}>
                            <Eye size={16} /> Open
                        </button>
                        <button onClick={handleSelectedDelete} className={btnRed}>
                            <Trash2 size={16} /> Delete
                        </button>
                    </>
                );
            }

            // Default: nothing selected — 6 consolidated buttons
            return (
                <>
                    <button onClick={handleNewSong} className={btnGreen}>
                        <Plus size={16} /> New Song
                    </button>
                    <button onClick={() => setShowImportModal(true)} className={btnGray}>
                        <Upload size={16} /> Import
                    </button>
                    <button onClick={() => setShowExportModal(true)} className={btnGray}>
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => setShowPlanningCenterModal(true)} className={btnGray}>
                        <CloudDownload size={16} /> Planning Center
                    </button>
                    <button onClick={() => setShowPraiseChartsModal(true)} className={btnGray}>
                        <Search size={16} /> PraiseCharts
                    </button>
                    <button onClick={() => setShowSongSelectModal(true)} className={btnGray}>
                        <Music size={16} /> SongSelect
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
                        <Save size={16} /> {isDirty ? "Save (Unsaved)" : "Save"}
                    </button>
                    <button onClick={handleNewSong} className={btnGreen}>
                        <Plus size={16} /> New
                    </button>
                    <Link href="/" className={btnGray}>
                        <X size={16} /> Cancel
                    </Link>
                </>
            );
        }

        if (pathname === '/playback') {
            return null;
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
