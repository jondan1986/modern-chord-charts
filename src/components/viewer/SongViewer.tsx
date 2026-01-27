
import { Song } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { SectionRenderer } from "./SectionRenderer";
import { DEFAULT_THEME } from "./themes";

interface Props {
    song: Song;
    theme?: Theme;
}

export const SongViewer: React.FC<Props> = ({ song, theme = DEFAULT_THEME }) => {

    // Main Container Style
    const containerStyle: React.CSSProperties = {
        backgroundColor: theme.colors.background,
        color: theme.colors.text_primary,
        fontFamily: theme.typography.font_family_lyrics,
        minHeight: "100vh",
        padding: "2rem",
    };

    const titleStyle: React.CSSProperties = {
        fontSize: "2em",
        fontWeight: "bold",
        marginBottom: "0.25em",
    };

    const metaStyle: React.CSSProperties = {
        color: theme.colors.text_secondary,
        marginBottom: "2rem",
    };

    const bodyStyle: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: theme.layout.two_column ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr",
        gap: "2rem",
    };

    return (
        <div style={containerStyle} className="song-viewer">
            {/* Header */}
            <div className="mb-8 border-b pb-4" style={{ borderColor: theme.colors.section_header }}>
                <h1 style={titleStyle}>{song.metadata.title}</h1>
                <div style={metaStyle}>
                    {song.metadata.artist} • Key: {song.metadata.key || "N/A"} • Tempo: {song.metadata.tempo || "N/A"}
                </div>
            </div>

            {/* Sections */}
            <div style={bodyStyle}>
                {song.sections.map((section) => (
                    <SectionRenderer key={section.id} section={section} theme={theme} />
                ))}
            </div>
        </div>
    );
};
