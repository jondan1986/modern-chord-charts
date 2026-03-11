// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import { LineSegment } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { formatChordForDisplay } from "@/src/utils/chord-display";

interface Props {
    segment: LineSegment;
    theme: Theme;
}

export const ChordLyricPair: React.FC<Props> = ({ segment, theme }) => {
    const { chord, lyric } = segment;

    const hasChordNoLyric = !!chord && (!lyric || lyric.trim() === '');

    const chordStyle: React.CSSProperties = {
        color: theme.colors.chord,
        fontFamily: theme.typography.font_family_chords,
        fontSize: theme.typography.size_chords,
        fontWeight: theme.typography.weight_chords,
        minHeight: theme.layout.chord_position === "above" ? "1.5em" : "auto",
        lineHeight: 1,
        marginBottom: "0.1em"
    };

    const lyricStyle: React.CSSProperties = {
        color: theme.colors.text_primary,
        fontFamily: theme.typography.font_family_lyrics,
        fontSize: theme.typography.size_lyrics,
        lineHeight: theme.typography.line_height,
        whiteSpace: "pre-wrap",
    };

    return (
        <div
            className="flex flex-col items-start leading-none relative group"
            style={{ minWidth: hasChordNoLyric ? '2.5em' : undefined }}
        >
            {/* Chord */}
            {chord && (
                <div style={chordStyle} className="select-none">
                    {formatChordForDisplay(chord)}
                </div>
            )}

            {/* Lyric */}
            <div style={lyricStyle}>
                {lyric}
            </div>
        </div>
    );
};
