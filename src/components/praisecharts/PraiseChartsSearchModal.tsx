// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use client";

import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import {
    searchPraiseCharts,
    fetchAndConvertChart,
    checkPraiseChartsAccess,
} from '@/src/actions/praisecharts';
import type { PraiseChartsSearchResult } from '@/src/services/praisecharts/types';

type Step = 'search' | 'results' | 'importing' | 'done';

interface PraiseChartsSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: (localId: string) => void;
    /** Pre-fill search with song title */
    initialQuery?: string;
    /** Pre-fill CCLI lookup */
    initialCCLI?: string;
}

export function PraiseChartsSearchContent({
    isOpen,
    onClose,
    onImported,
    initialQuery = '',
    initialCCLI = '',
}: PraiseChartsSearchModalProps) {
    const [step, setStep] = useState<Step>('search');
    const [query, setQuery] = useState(initialQuery);
    const [ccli, setCcli] = useState(initialCCLI);
    const [results, setResults] = useState<PraiseChartsSearchResult[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importingId, setImportingId] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim() && !ccli.trim()) {
            setError('Enter a song title or CCLI number.');
            return;
        }
        setSearching(true);
        setError(null);

        try {
            const res = await searchPraiseCharts(query.trim(), {
                ccli: ccli.trim() || undefined,
            });
            setResults(res.results);
            setTotalResults(res.total);
            setStep('results');
        } catch (err: any) {
            setError(err.message ?? 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleImport = async (song: PraiseChartsSearchResult) => {
        setImportingId(song.id);
        setError(null);

        try {
            // Check access first
            const access = await checkPraiseChartsAccess(song.id);
            if (!access.hasAccess) {
                const purchaseMsg = access.purchaseUrl
                    ? `This chart requires purchase. Visit: ${access.purchaseUrl}`
                    : 'This chart requires purchase from PraiseCharts.';
                setError(purchaseMsg);
                setImportingId(null);
                return;
            }

            setStep('importing');
            const { localId } = await fetchAndConvertChart(song.id, song.key);
            setStep('done');
            onImported(localId);
        } catch (err: any) {
            setError(err.message ?? 'Import failed');
            setStep('results');
        } finally {
            setImportingId(null);
        }
    };

    const handleClose = () => {
        setStep('search');
        setQuery(initialQuery);
        setCcli(initialCCLI);
        setResults([]);
        setError(null);
        setImportingId(null);
        onClose();
    };

    const handleBack = () => {
        setStep('search');
        setError(null);
    };

    return (
        <div className="space-y-4">
            {step === 'search' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Song Title
                        </label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by song title..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            CCLI Number (optional)
                        </label>
                        <input
                            type="text"
                            value={ccli}
                            onChange={(e) => setCcli(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="e.g., 1234567"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={searching || (!query.trim() && !ccli.trim())}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </>
            )}

            {step === 'results' && (
                <>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {totalResults} result{totalResults !== 1 ? 's' : ''} found
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {results.length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                                No charts found. Try a different search.
                            </div>
                        )}
                        {results.map((song) => (
                            <div
                                key={song.id}
                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                        {song.title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {song.artist}
                                        {song.key && <span className="ml-2">Key: {song.key}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleImport(song)}
                                    disabled={importingId !== null}
                                    className="ml-2 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded transition whitespace-nowrap"
                                >
                                    {importingId === song.id ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between pt-2">
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            Done
                        </button>
                    </div>
                </>
            )}

            {step === 'importing' && (
                <div className="text-center py-8">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Importing chart...
                    </div>
                </div>
            )}

            {step === 'done' && (
                <div className="text-center py-8">
                    <div className="text-green-600 dark:text-green-400 font-medium">
                        Chart imported successfully!
                    </div>
                    <button
                        onClick={handleClose}
                        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}

export function PraiseChartsSearchModal({
    isOpen,
    onClose,
    onImported,
    initialQuery = '',
    initialCCLI = '',
}: PraiseChartsSearchModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Search PraiseCharts">
            <PraiseChartsSearchContent isOpen={isOpen} onClose={onClose} onImported={onImported} initialQuery={initialQuery} initialCCLI={initialCCLI} />
        </Modal>
    );
}
