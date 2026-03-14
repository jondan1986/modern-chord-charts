import React from "react";
import { Theme } from "@/mcs-core/model";

const ALL_KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

const TEMPO_RANGES: { label: string; range: [number, number] | null }[] = [
    { label: "All Tempos", range: null },
    { label: "Slow (< 80)", range: [0, 79] },
    { label: "Medium (80\u2013120)", range: [80, 120] },
    { label: "Fast (> 120)", range: [121, 999] },
];

interface Props {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterKey: string | null;
    onFilterKeyChange: (key: string | null) => void;
    filterTempoRange: [number, number] | null;
    onFilterTempoRangeChange: (range: [number, number] | null) => void;
    filteredCount: number;
    totalCount: number;
    theme: Theme;
}

export const SearchBar: React.FC<Props> = ({
    searchQuery, onSearchChange,
    filterKey, onFilterKeyChange,
    filterTempoRange, onFilterTempoRangeChange,
    filteredCount, totalCount, theme,
}) => {
    const hasFilters = searchQuery || filterKey || filterTempoRange;
    const isDark = theme.name === "Dark Mode";

    const selectClass = `text-sm px-2 py-1.5 rounded-md border ${isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300 text-gray-700"}`;

    return (
        <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border ${isDark ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                />
            </div>

            {/* Key filter */}
            <select
                value={filterKey ?? ""}
                onChange={e => onFilterKeyChange(e.target.value || null)}
                className={selectClass}
            >
                <option value="">All Keys</option>
                {ALL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>

            {/* Tempo filter */}
            <select
                value={filterTempoRange ? `${filterTempoRange[0]}-${filterTempoRange[1]}` : ""}
                onChange={e => {
                    const preset = TEMPO_RANGES.find(t => t.range ? `${t.range[0]}-${t.range[1]}` === e.target.value : e.target.value === "");
                    onFilterTempoRangeChange(preset?.range ?? null);
                }}
                className={selectClass}
            >
                {TEMPO_RANGES.map(t => (
                    <option key={t.label} value={t.range ? `${t.range[0]}-${t.range[1]}` : ""}>{t.label}</option>
                ))}
            </select>

            {/* Clear + count */}
            <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                {hasFilters && (
                    <>
                        <span>{filteredCount} of {totalCount}</span>
                        <button
                            onClick={() => { onSearchChange(""); onFilterKeyChange(null); onFilterTempoRangeChange(null); }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
