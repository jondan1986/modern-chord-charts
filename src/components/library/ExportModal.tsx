"use client";

import React, { useEffect, useState } from 'react';
import { TabbedModal } from '@/src/components/ui/TabbedModal';
import { songStorage, StoredSong } from '@/src/services/storage';
import { MCSParser } from '@/src/mcs-core/parser';
import { ChordProExporter } from '@/src/services/export/chordpro';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function SongSelector({ onExport, exportLabel }: { onExport: (song: StoredSong) => void; exportLabel: string }) {
    const [songs, setSongs] = useState<StoredSong[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        songStorage.getAllSongs().then(all => {
            setSongs(all.sort((a, b) => b.updatedAt - a.updatedAt));
            setLoading(false);
        });
    }, []);

    const selected = songs.find(s => s.id === selectedId);

    if (loading) return <p className="text-sm text-gray-400">Loading songs...</p>;
    if (songs.length === 0) return <p className="text-sm text-gray-400">No songs in library.</p>;

    return (
        <div className="space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-1">
                {songs.map(song => (
                    <button
                        key={song.id}
                        onClick={() => setSelectedId(song.id)}
                        className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${
                            selectedId === song.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        <span className="font-medium">{song.title}</span>
                        {song.artist && <span className="text-gray-400 ml-2">— {song.artist}</span>}
                    </button>
                ))}
            </div>
            <div className="flex justify-end">
                <button
                    onClick={() => selected && onExport(selected)}
                    disabled={!selected}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {exportLabel}
                </button>
            </div>
        </div>
    );
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
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

    const handleExportMCS = (song: StoredSong) => {
        const blob = new Blob([song.yaml], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}.mcs`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportChordPro = (song: StoredSong) => {
        try {
            const parsed = MCSParser.parse(song.yaml);
            const chordPro = ChordProExporter.export(parsed);
            const blob = new Blob([chordPro], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${parsed.metadata.title || 'song'}.cho`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Failed to export: could not parse song.');
        }
    };

    const tabs = [
        {
            id: 'library',
            label: 'Library',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Export your entire library as a JSON backup file.
                    </p>
                    <button
                        onClick={handleExportLibrary}
                        className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        Export Library Backup
                    </button>
                </div>
            ),
        },
        {
            id: 'mcs',
            label: 'MCS',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Export a song as an MCS (.mcs) file.
                    </p>
                    <SongSelector onExport={handleExportMCS} exportLabel="Export MCS" />
                </div>
            ),
        },
        {
            id: 'chordpro',
            label: 'ChordPro',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Export a song as a ChordPro (.cho) file.
                    </p>
                    <SongSelector onExport={handleExportChordPro} exportLabel="Export ChordPro" />
                </div>
            ),
        },
    ];

    return <TabbedModal isOpen={isOpen} onClose={onClose} title="Export" tabs={tabs} />;
}
