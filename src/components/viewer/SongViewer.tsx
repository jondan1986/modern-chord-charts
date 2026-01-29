
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
    const [activeArrangementIdx, setActiveArrangementIdx] = React.useState<number | null>(null);

    // Reset arrangement selection if song changes
    React.useEffect(() => {
        setActiveArrangementIdx(null);
    }, [song]);

    // Determine sections to display
    const visibleSections = React.useMemo(() => {
        if (activeArrangementIdx !== null && song.arrangements && song.arrangements[activeArrangementIdx]) {
            const arrangement = song.arrangements[activeArrangementIdx];
            return arrangement.order.map((sectionId, index) => {
                const section = song.sections.find(s => s.id === sectionId);
                // If section not found (broken link), distinct handling or skip? 
                // We'll return it if found, or create a placeholder error section to be helpful.
                return section ? { ...section, uniqueKey: `${section.id}-${index}` } : null;
            }).filter(Boolean) as (typeof song.sections[0] & { uniqueKey: string })[];
        }
        return song.sections.map(s => ({ ...s, uniqueKey: s.id }));
    }, [song, activeArrangementIdx]);

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
                <div className="flex justify-between items-start">
                    <div>
                        <h1 style={titleStyle}>{song.metadata.title}</h1>
                        <div style={metaStyle}>
                            {song.metadata.artist} • Key: {song.metadata.key || "N/A"} • Tempo: {song.metadata.tempo || "N/A"}
                        </div>
                    </div>

                    {/* Arrangement Selector */}
                    {song.arrangements && song.arrangements.length > 0 && (
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-xs font-semibold opacity-70">ARRANGEMENT</span>
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveArrangementIdx(null)}
                                    className={`px-3 py-1 text-sm rounded-md transition ${activeArrangementIdx === null
                                        ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Default
                                </button>
                                {song.arrangements.map((arr, idx) => (
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
            <div style={bodyStyle}>
                {visibleSections.map((section) => (
                    <SectionRenderer key={section.uniqueKey} section={section} theme={theme} />
                ))}
            </div>
        </div>
    );
};
