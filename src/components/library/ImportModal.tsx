"use client";

import React, { useRef, useState } from 'react';
import { TabbedModal } from '@/src/components/ui/TabbedModal';
import { songStorage } from '@/src/services/storage';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/src/state/store';
import type { ImportFormat } from '@/src/services/import/multi-format';

const FORMAT_OPTIONS: { value: ImportFormat; label: string; description: string }[] = [
    { value: 'auto', label: 'Auto-detect', description: 'Automatically detect the format' },
    { value: 'chordpro', label: 'ChordPro', description: 'Standard ChordPro (.cho, .pro) format' },
    { value: 'ultimate_guitar', label: 'Ultimate Guitar', description: 'Tab/chord format from UG' },
    { value: 'chords_over_lyrics', label: 'Chords Over Lyrics', description: 'Plain text with chords above lyrics' },
];

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
}

export function ImportModal({ isOpen, onClose, onImported }: ImportModalProps) {
    const router = useRouter();
    const loadSong = useAppStore((state) => state.loadSong);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chordProInputRef = useRef<HTMLInputElement>(null);

    // Paste tab state
    const [pasteText, setPasteText] = useState('');
    const [pasteFormat, setPasteFormat] = useState<ImportFormat>('auto');
    const [pasteTitle, setPasteTitle] = useState('');
    const [pasteArtist, setPasteArtist] = useState('');
    const [pasteError, setPasteError] = useState<string | null>(null);
    const [pasteImporting, setPasteImporting] = useState(false);

    const handleClose = () => {
        setPasteText('');
        setPasteFormat('auto');
        setPasteTitle('');
        setPasteArtist('');
        setPasteError(null);
        setPasteImporting(false);
        onClose();
    };

    const handleLibraryImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            try {
                if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                    await songStorage.importLibrary(content);
                    alert("Library Imported Successfully!");
                } else {
                    await songStorage.saveSong(content);
                    alert("Song Imported Successfully!");
                }
                onImported();
                handleClose();
                window.location.reload();
            } catch (err) {
                alert("Failed to import: " + err);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleChordProImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
            const { ChordProConverter } = await import("@/src/services/import/chordpro");
            const mcsYaml = ChordProConverter.convert(text);
            const id = await songStorage.saveSong(mcsYaml);
            await loadSong(id);
            handleClose();
            router.push("/editor");
        } catch (err) {
            console.error(err);
            alert("Failed to import ChordPro file.");
        }
        if (chordProInputRef.current) chordProInputRef.current.value = '';
    };

    const handlePasteImport = async () => {
        if (!pasteText.trim()) {
            setPasteError('Please paste some chord chart content.');
            return;
        }
        setPasteError(null);
        setPasteImporting(true);
        try {
            const { convertToMCS } = await import('@/src/services/import/multi-format');
            const yaml = convertToMCS(pasteText, {
                format: pasteFormat,
                title: pasteTitle.trim() || undefined,
                artist: pasteArtist.trim() || undefined,
            });
            const id = await songStorage.saveSong(yaml);
            await loadSong(id);
            handleClose();
            router.push("/editor");
        } catch (err) {
            console.error('Import failed:', err);
            setPasteError(err instanceof Error ? err.message : 'Failed to convert chart. Check the format and try again.');
        } finally {
            setPasteImporting(false);
        }
    };

    const tabs = [
        {
            id: 'library',
            label: 'Library',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Import a library backup (.json) or a single song (.mcs/.yaml) file.
                    </p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json,.mcs,.yaml,.yml" onChange={handleLibraryImport} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
                    >
                        Choose File (.json, .mcs, .yaml)
                    </button>
                </div>
            ),
        },
        {
            id: 'chordpro',
            label: 'ChordPro',
            content: (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Import a ChordPro file and convert it to MCS format.
                    </p>
                    <input type="file" ref={chordProInputRef} className="hidden" accept=".pro,.cho,.txt,.chordpro" onChange={handleChordProImport} />
                    <button
                        onClick={() => chordProInputRef.current?.click()}
                        className="w-full px-4 py-3 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition"
                    >
                        Choose File (.pro, .cho, .txt, .chordpro)
                    </button>
                </div>
            ),
        },
        {
            id: 'paste',
            label: 'Paste',
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                        <select
                            value={pasteFormat}
                            onChange={(e) => setPasteFormat(e.target.value as ImportFormat)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        >
                            {FORMAT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label} — {opt.description}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Content</label>
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Paste your chord chart here..."
                            className="w-full h-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y"
                            spellCheck={false}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title (optional)</label>
                            <input
                                type="text"
                                value={pasteTitle}
                                onChange={(e) => setPasteTitle(e.target.value)}
                                placeholder="Override detected title"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artist (optional)</label>
                            <input
                                type="text"
                                value={pasteArtist}
                                onChange={(e) => setPasteArtist(e.target.value)}
                                placeholder="Override detected artist"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            />
                        </div>
                    </div>
                    {pasteError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {pasteError}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            onClick={handlePasteImport}
                            disabled={pasteImporting || !pasteText.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {pasteImporting ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </div>
            ),
        },
    ];

    return <TabbedModal isOpen={isOpen} onClose={handleClose} title="Import" tabs={tabs} />;
}
