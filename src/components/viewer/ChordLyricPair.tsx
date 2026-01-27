
import { LineSegment } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";

interface Props {
    segment: LineSegment;
    theme: Theme;
}

export const ChordLyricPair: React.FC<Props> = ({ segment, theme }) => {
    const { chord, lyric } = segment;

    // CSS for positioning chord above lyric
    // We use flex-col for 'above' positioning

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
        whiteSpace: "pre-wrap", // Preserve spaces!
    };

    return (
        <div className="flex flex-col items-start leading-none relative group">
            {/* Chord */}
            {chord && (
                <div style={chordStyle} className="select-none">
                    {chord}
                </div>
            )}

            {/* Lyric */}
            <div style={lyricStyle}>
                {lyric}
            </div>
        </div>
    );
};
