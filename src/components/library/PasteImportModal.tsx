// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

'use client';

import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import type { ImportFormat } from '@/src/services/import/multi-format';

interface PasteImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (yaml: string) => void;
}

const FORMAT_OPTIONS: { value: ImportFormat; label: string; description: string }[] = [
    { value: 'auto', label: 'Auto-detect', description: 'Automatically detect the format' },
    { value: 'chordpro', label: 'ChordPro', description: 'Standard ChordPro (.cho, .pro) format' },
    { value: 'ultimate_guitar', label: 'Ultimate Guitar', description: 'Tab/chord format from UG' },
    { value: 'chords_over_lyrics', label: 'Chords Over Lyrics', description: 'Plain text with chords above lyrics' },
];

export function PasteImportModal({ isOpen, onClose, onImport }: PasteImportModalProps) {
    const [text, setText] = useState('');
    const [format, setFormat] = useState<ImportFormat>('auto');
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const handleImport = async () => {
        if (!text.trim()) {
            setError('Please paste some chord chart content.');
            return;
        }

        setError(null);
        setImporting(true);

        try {
            const { convertToMCS } = await import('@/src/services/import/multi-format');
            const yaml = convertToMCS(text, {
                format,
                title: title.trim() || undefined,
                artist: artist.trim() || undefined,
            });
            onImport(yaml);
            handleClose();
        } catch (err) {
            console.error('Import failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to convert chart. Check the format and try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setText('');
        setFormat('auto');
        setTitle('');
        setArtist('');
        setError(null);
        setImporting(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Paste Chord Chart">
            <div className="space-y-4">
                {/* Format selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Format
                    </label>
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as ImportFormat)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    >
                        {FORMAT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label} — {opt.description}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Paste area */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chart Content
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Paste your chord chart here...\n\nExamples:\n  ChordPro: {title: Amazing Grace}\\n{sov}\\n[G]Amazing grace...\n  UG: [Verse]\\n G    C\\nAmazing grace...\n  Plain: G    C\\nAmazing grace...`}
                        className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y"
                        spellCheck={false}
                    />
                </div>

                {/* Optional metadata overrides */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title (optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Override detected title"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Artist (optional)
                        </label>
                        <input
                            type="text"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="Override detected artist"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing || !text.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                    >
                        {importing ? 'Importing...' : 'Import'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
