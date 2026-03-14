// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import { Song } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { SectionRenderer } from "./SectionRenderer";
import { DEFAULT_THEME } from "./themes";
import { ChordList } from "./ChordList";

interface Props {
    song: Song;
    theme?: Theme;
    onEditMetadata?: () => void;
    forceSingleColumn?: boolean;
    highlightedSectionIndex?: number;
    externalTransposeSteps?: number;
}

import { transposeChord, getTargetKey, getKeyPreference } from "@/src/mcs-core/transpose";
import { formatChordForDisplay } from "@/src/utils/chord-display";

export const SongViewer: React.FC<Props> = ({ song, theme = DEFAULT_THEME, onEditMetadata, forceSingleColumn, highlightedSectionIndex, externalTransposeSteps }) => {
    const hasArrangements = song.arrangements && song.arrangements.length > 0;
    const [activeArrangementIdx, setActiveArrangementIdx] = React.useState<number | null>(hasArrangements ? 0 : null);
    const [internalTransposeSteps, setInternalTransposeSteps] = React.useState(0);
    const transposeSteps = externalTransposeSteps !== undefined ? externalTransposeSteps : internalTransposeSteps;
    const setTransposeSteps = (v: React.SetStateAction<number>) => {
        if (externalTransposeSteps === undefined) setInternalTransposeSteps(v);
    };
    const [capoFret, setCapoFret] = React.useState(0);
    const sectionRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    // Reset arrangement, transpose, and capo if song changes
    React.useEffect(() => {
        const hasArr = song.arrangements && song.arrangements.length > 0;
        setActiveArrangementIdx(hasArr ? 0 : null);
        setTransposeSteps(0);
        setCapoFret(0);
    }, [song.metadata.title, song.metadata.artist, song.arrangements]);

    // Transpose + Capo Logic
    // transposeSteps changes the sounding key (for all players)
    // capoFret offsets chord shapes locally (effectiveTranspose = transposeSteps - capoFret)
    const effectiveTranspose = transposeSteps - capoFret;

    const displayedSong = React.useMemo(() => {
        if (transposeSteps === 0 && effectiveTranspose === 0) return song;

        const originalKey = song.metadata.key || "C";
        // Metadata key = sounding key (transpose only, no capo offset)
        const soundingKey = transposeSteps !== 0 ? getTargetKey(originalKey, transposeSteps) : originalKey;
        // Chord shapes use effectiveTranspose (transpose - capo)
        const shapeKey = effectiveTranspose !== 0 ? getTargetKey(originalKey, effectiveTranspose) : originalKey;
        const pref = getKeyPreference(shapeKey);

        const newSong = { ...song };
        newSong.metadata = { ...song.metadata, key: soundingKey };

        if (effectiveTranspose === 0) return newSong;

        newSong.sections = song.sections.map(section => {
            const newSection = { ...section };
            newSection.lines = section.lines.map(line => {
                if (typeof line === 'string') {
                    // Handle Grid Strings or raw text
                    if (section.type === 'grid') {
                        // Regex matches Chords (simple check)
                        return line.replace(/\b([A-G](?:#|b)?(?:[a-zA-Z0-9]*)?(?:\/[A-G](?:#|b)?)?)\b/g, (match) => {
                            // verify it looks like a chord? Basic check:
                            if (!match.match(/^[A-G]/)) return match;
                            return transposeChord(match, effectiveTranspose, pref);
                        });
                    }
                    return line;
                } else {
                    // Handle Strict Line
                    const newLine = { ...line };
                    newLine.content = line.content.map(seg => {
                        if (!seg.chord) return seg;
                        return { ...seg, chord: transposeChord(seg.chord, effectiveTranspose, pref) };
                    });
                    return newLine;
                }
            });
            return newSection;
        });

        return newSong;
    }, [song, transposeSteps, effectiveTranspose]);

    // Determine sections to display
    const visibleSections = React.useMemo(() => {
        if (activeArrangementIdx !== null && displayedSong.arrangements && displayedSong.arrangements[activeArrangementIdx]) {
            const arrangement = displayedSong.arrangements[activeArrangementIdx];
            return arrangement.order.map((sectionId, index) => {
                const section = displayedSong.sections.find(s => s.id === sectionId);
                return section ? { ...section, uniqueKey: `${section.id}-${index}` } : null;
            }).filter(Boolean) as (typeof displayedSong.sections[0] & { uniqueKey: string })[];
        }
        return displayedSong.sections.map(s => ({ ...s, uniqueKey: s.id }));
    }, [displayedSong, activeArrangementIdx]);

    return (
        <div
            className={`song-viewer min-h-screen p-4 md:p-8 transition-colors duration-200 font-sans ${theme.name === "Dark Mode" ? "bg-gray-900 text-gray-50" : "bg-white text-gray-800"
                }`}
        >
            {/* Header */}
            <div
                className={`mb-8 border-b pb-4 ${theme.name === "Dark Mode" ? "border-gray-600" : "border-gray-400"
                    }`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 group">
                            <h1 className="text-3xl font-bold mb-1 leading-tight">
                                {displayedSong.metadata.title}
                            </h1>
                            {onEditMetadata && (
                                <button
                                    onClick={onEditMetadata}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600"
                                    title="Edit Metadata"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                </button>
                            )}
                        </div>

                        <div
                            className={`text-base space-y-1 mb-6 flex items-center justify-between ${theme.name === "Dark Mode" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            <div className="flex flex-col">
                                <div className="text-lg font-medium">{displayedSong.metadata.artist}</div>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 opacity-80 items-center mt-1">
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                        <button
                                            onClick={() => setTransposeSteps(s => s - 1)}
                                            className="no-print hover:text-blue-500 px-1 font-bold"
                                        >-</button>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            Key: {formatChordForDisplay(displayedSong.metadata.key || "?")}
                                        </span>
                                        <button
                                            onClick={() => setTransposeSteps(s => s + 1)}
                                            className="no-print hover:text-blue-500 px-1 font-bold"
                                        >+</button>
                                    </div>

                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                        <button
                                            onClick={() => setCapoFret(f => Math.max(0, f - 1))}
                                            className="no-print hover:text-blue-500 px-1 font-bold"
                                        >-</button>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                            Capo: {capoFret}
                                        </span>
                                        <button
                                            onClick={() => setCapoFret(f => Math.min(12, f + 1))}
                                            className="no-print hover:text-blue-500 px-1 font-bold"
                                        >+</button>
                                        {capoFret > 0 && (
                                            <span className="text-xs opacity-70">
                                                ({formatChordForDisplay(getTargetKey(displayedSong.metadata.key || "C", -capoFret))} shapes)
                                            </span>
                                        )}
                                    </div>

                                    {displayedSong.metadata.tempo && <span><span className="opacity-60">Tempo:</span> {displayedSong.metadata.tempo} bpm</span>}
                                    {displayedSong.metadata.time_signature && <span><span className="opacity-60">Time:</span> {displayedSong.metadata.time_signature}</span>}
                                </div>
                            </div>
                        </div>

                        {(displayedSong.metadata.ccli || displayedSong.metadata.copyright || (displayedSong.metadata.themes && displayedSong.metadata.themes.length > 0)) && (
                            <div className={`text-xs opacity-60 mt-1 ${theme.name === "Dark Mode" ? "text-gray-400" : "text-gray-500"}`}>
                                {displayedSong.metadata.ccli && <span className="mr-3">CCLI: {displayedSong.metadata.ccli}</span>}
                                {displayedSong.metadata.copyright && <span className="mr-3">© {displayedSong.metadata.copyright}</span>}
                                {displayedSong.metadata.themes && displayedSong.metadata.themes.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 mr-1">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Custom metadata fields */}
                        {(() => {
                            const knownKeys = new Set(['title', 'artist', 'key', 'tempo', 'time_signature', 'year', 'themes', 'copyright', 'ccli']);
                            const customEntries = Object.entries(displayedSong.metadata).filter(([k]) => !knownKeys.has(k));
                            if (customEntries.length === 0) return null;
                            return (
                                <div className={`text-xs opacity-60 mt-1 flex flex-wrap gap-x-3 ${theme.name === "Dark Mode" ? "text-gray-400" : "text-gray-500"}`}>
                                    {customEntries.map(([k, v]) => (
                                        <span key={k} className="capitalize">{k}: {String(v)}</span>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Arrangement Selector — only shown when 2+ arrangements exist */}
                    {displayedSong.arrangements && displayedSong.arrangements.length > 1 && (
                        <div className="no-print flex flex-col items-end gap-2">
                            <span className="text-xs font-semibold opacity-70">ARRANGEMENT</span>
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                {displayedSong.arrangements.map((arr, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveArrangementIdx(idx)}
                                        className={`px-3 py-1 text-sm rounded-md transition ${activeArrangementIdx === idx
                                            ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {arr.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sections */}
            <div
                className={`gap-6 ${theme.layout.two_column && !forceSingleColumn
                    ? "columns-1 md:columns-2"
                    : "columns-1"
                    }`}
            >
                {visibleSections.map((section, idx) => {
                    const isHighlighted = highlightedSectionIndex !== undefined && idx === highlightedSectionIndex;
                    return (
                        <div
                            key={section.uniqueKey}
                            ref={el => { sectionRefs.current[idx] = el; }}
                            data-section-index={idx}
                            className={`break-inside-avoid mb-6 transition-all duration-300 ${isHighlighted ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20 pl-2 rounded-r-lg' : ''}`}
                        >
                            <SectionRenderer section={section} theme={theme} />
                        </div>
                    );
                })}
            </div>

            {/* Chord Diagrams - use original or transposed? Transposed ideally. */}
            <div className="mt-12 break-inside-avoid">
                <ChordList song={displayedSong} theme={theme} />
            </div>
        </div>
    );
};
