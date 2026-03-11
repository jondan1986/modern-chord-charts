// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import React from 'react';
import { Section, Theme } from '@/mcs-core/model';
import { clsx } from 'clsx';
import { formatChordForDisplay } from '@/src/utils/chord-display';

interface Props {
    section: Section;
    theme: Theme;
}

export const GridRenderer: React.FC<Props> = ({ section, theme }) => {
    return (
        <div
            className="mb-6 break-inside-avoid rounded-lg border p-4"
            style={{ borderColor: theme.colors.section_border }}
        >
            {/* Header (Same as SectionRenderer) */}
            <div
                className={`font-bold uppercase text-sm mb-2 mt-4 ${theme.name === "Dark Mode" ? "text-gray-600" : "text-gray-400"
                    }`}
            >
                {section.label}
                {section.bars && (
                    <span
                        className={`ml-2 px-1.5 py-0.5 text-[0.7em] border rounded opacity-70 ${theme.name === "Dark Mode" ? "border-gray-600" : "border-gray-400"
                            }`}
                    >
                        {section.bars} bars
                    </span>
                )}
                {section.subtitle && (
                    <span
                        className={`ml-3 text-xs italic opacity-80 normal-case ${theme.name === "Dark Mode" ? "text-gray-500" : "text-gray-500"}`}
                    >
                        {section.subtitle}
                    </span>
                )}
            </div>

            {/* Grid Content */}
            <div className="flex flex-col gap-2">
                {section.lines.map((line, idx) => {
                    // Extract text content whether it's a Line object or string
                    let text = "";
                    if (typeof line === 'string') {
                        text = line;
                    } else if (line.content) {
                        // Reconstruct raw text from LineSegment if parsed
                        // OR just use the lyric part if that's where the pipe text ended up
                        text = line.content.map(s => s.lyric + (s.chord ? `[${s.chord}]` : "")).join("");
                    }

                    // Parse bars: | C | G | -> [" C ", " G "]
                    const bars = text.split('|').map(b => b.trim()).filter(b => b.length > 0);

                    if (bars.length === 0) return null;

                    return (
                        <div key={idx} className="flex flex-wrap gap-2">
                            {bars.map((bar, barIdx) => (
                                <div
                                    key={barIdx}
                                    className={clsx(
                                        "flex-1 min-w-[60px] h-12 flex items-center justify-center border rounded font-bold text-lg",
                                        theme.name === "Dark Mode"
                                            ? "border-gray-700 bg-gray-800 text-blue-400"
                                            : "border-gray-300 bg-gray-50 text-blue-600"
                                    )}
                                >
                                    {formatChordForDisplay(bar)}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
