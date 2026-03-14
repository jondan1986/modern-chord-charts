
import React from "react";
import { StoredSong } from "@/src/services/storage";
import { Theme } from "@/src/mcs-core/model";
import { formatChordForDisplay } from "@/src/utils/chord-display";

export interface EnrichedSong extends StoredSong {
    key?: string;
    tempo?: number;
    themes?: string[];
}

interface Props {
    songs: EnrichedSong[];
    theme: Theme;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
    searchQuery?: string;
    isFiltered?: boolean;
    onClearFilters?: () => void;
}

function highlightText(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-yellow-200 dark:bg-yellow-700 dark:text-yellow-100 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export const SongList: React.FC<Props> = ({ songs, theme, selectedId, onSelect, onOpen, searchQuery = "", isFiltered, onClearFilters }) => {
    if (songs.length === 0) {
        if (isFiltered) {
            return (
                <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                    <p className="text-xl font-medium">No songs match your search.</p>
                    <p className="mt-2 text-sm">Try a different query or clear your filters.</p>
                    {onClearFilters && (
                        <button onClick={onClearFilters} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Clear all filters
                        </button>
                    )}
                </div>
            );
        }
        return (
            <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                <p className="text-xl font-medium">Your library is empty.</p>
                <p className="mt-2 text-sm">Create a new song using the &quot;New Song&quot; button or import a backup.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {songs.map(song => (
                <div key={song.id}
                    className={`border p-4 rounded-lg flex justify-between items-center transition shadow-sm bg-white dark:bg-gray-900 cursor-pointer ${selectedId === song.id ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ borderColor: theme.colors.section_header }}
                    onClick={() => onSelect(song.id)}
                    onDoubleClick={() => onOpen(song.id)}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {highlightText(song.title, searchQuery)}
                            </h2>
                            {song.key && (
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                    {highlightText(formatChordForDisplay(song.key), searchQuery)}
                                </span>
                            )}
                            {song.tempo && (
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    {song.tempo} bpm
                                </span>
                            )}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            {highlightText(song.artist, searchQuery)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {song.themes && song.themes.length > 0 && song.themes.map(t => (
                                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border dark:border-gray-700">
                                    {highlightText(t, searchQuery)}
                                </span>
                            ))}
                            <span className="text-xs text-gray-400">
                                {new Date(song.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
