// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use client";

import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import type { ImportSongResult } from '@/src/services/pco/types';

type EnhanceMethod = 'paste' | 'skip';

interface SongEnhanceState {
    song: ImportSongResult;
    method: EnhanceMethod;
    pastedText: string;
    format: 'auto' | 'chordpro' | 'ultimate_guitar' | 'chords_over_lyrics';
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
}

interface ChordEnhanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: ImportSongResult[];
    onEnhanced: () => void;
}

export function ChordEnhanceModal({ isOpen, onClose, songs, onEnhanced }: ChordEnhanceModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [states, setStates] = useState<SongEnhanceState[]>(() =>
        songs.map(song => ({
            song,
            method: 'paste',
            pastedText: '',
            format: 'auto' as const,
            status: 'pending' as const,
        }))
    );
    const [processing, setProcessing] = useState(false);

    const current = states[currentIndex];
    const hasMore = currentIndex < states.length - 1;

    const updateCurrent = (updates: Partial<SongEnhanceState>) => {
        setStates(prev => {
            const next = [...prev];
            next[currentIndex] = { ...next[currentIndex], ...updates };
            return next;
        });
    };

    const handleEnhance = async () => {
        if (!current.pastedText.trim()) {
            updateCurrent({ error: 'Please paste chord chart content.' });
            return;
        }

        setProcessing(true);
        updateCurrent({ status: 'processing', error: undefined });

        try {
            const { convertToMCS } = await import('@/src/services/import/multi-format');
            const { mergeChords } = await import('@/src/services/import/chord-merger');
            const { songStorage } = await import('@/src/services/storage');

            // Convert pasted content to MCS YAML
            const sourceYaml = convertToMCS(current.pastedText, { format: current.format });

            // Get the existing song
            const existingSong = await songStorage.getSong(current.song.localId);
            if (!existingSong) throw new Error('Song not found in library');

            // Merge chords into existing lyrics
            const mergedYaml = mergeChords(existingSong.yaml, sourceYaml);

            // Save back
            await songStorage.saveSong(mergedYaml, current.song.localId);

            updateCurrent({ status: 'done' });

            if (hasMore) {
                setCurrentIndex(prev => prev + 1);
            }
        } catch (err: any) {
            updateCurrent({ status: 'error', error: err.message ?? 'Failed to enhance' });
        } finally {
            setProcessing(false);
        }
    };

    const handleSkip = () => {
        updateCurrent({ method: 'skip', status: 'done' });
        if (hasMore) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const allDone = states.every(s => s.status === 'done');

    const handleClose = () => {
        if (states.some(s => s.status === 'done' && s.method !== 'skip')) {
            onEnhanced();
        }
        setCurrentIndex(0);
        setStates(songs.map(song => ({
            song,
            method: 'paste' as const,
            pastedText: '',
            format: 'auto' as const,
            status: 'pending' as const,
        })));
        onClose();
    };

    if (!current) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Enhance with Chords">
            <div className="space-y-4">
                {/* Progress indicator */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Song {currentIndex + 1} of {states.length}
                </div>

                {!allDone ? (
                    <>
                        {/* Current song info */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {current.song.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {current.song.status === 'lyrics_only' ? 'Has lyrics but no chords' : 'Metadata only'}
                            </div>
                        </div>

                        {/* Paste area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Paste chord chart
                            </label>
                            <textarea
                                value={current.pastedText}
                                onChange={(e) => updateCurrent({ pastedText: e.target.value, error: undefined })}
                                placeholder="Paste ChordPro, Ultimate Guitar, or chords-over-lyrics text..."
                                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y"
                                spellCheck={false}
                            />
                        </div>

                        {/* Format selector */}
                        <select
                            value={current.format}
                            onChange={(e) => updateCurrent({ format: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        >
                            <option value="auto">Auto-detect format</option>
                            <option value="chordpro">ChordPro</option>
                            <option value="ultimate_guitar">Ultimate Guitar</option>
                            <option value="chords_over_lyrics">Chords Over Lyrics</option>
                        </select>

                        {current.error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {current.error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between pt-2">
                            <button
                                onClick={handleSkip}
                                disabled={processing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleEnhance}
                                disabled={processing || !current.pastedText.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                {processing ? 'Enhancing...' : 'Enhance'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Summary */}
                        <div className="space-y-1">
                            {states.map((s, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm"
                                >
                                    {s.method === 'skip' ? (
                                        <span className="text-gray-400">&#8212;</span>
                                    ) : s.status === 'done' ? (
                                        <span className="text-green-500">&#10003;</span>
                                    ) : (
                                        <span className="text-red-500">&#10007;</span>
                                    )}
                                    <span>{s.song.title}</span>
                                    <span className="text-gray-400 ml-auto text-xs">
                                        {s.method === 'skip' ? 'skipped' : s.status === 'done' ? 'enhanced' : 'failed'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                                Done
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
