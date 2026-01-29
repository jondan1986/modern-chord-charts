
import { Song } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { SectionRenderer } from "./SectionRenderer";
import { DEFAULT_THEME } from "./themes";

interface Props {
    song: Song;
    theme?: Theme;
    onEditMetadata?: () => void;
}

export const SongViewer: React.FC<Props> = ({ song, theme = DEFAULT_THEME, onEditMetadata }) => {
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
        lineHeight: "1.2",
    };

    const metaStyle: React.CSSProperties = {
        color: theme.colors.text_secondary,
        marginBottom: "1.5rem",
        fontSize: "0.9em",
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
                    <div className="flex-1">
                        <div className="flex items-center gap-3 group">
                            <h1 style={titleStyle}>{song.metadata.title}</h1>
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

                        <div style={metaStyle} className="space-y-1">
                            <div className="text-lg font-medium">{song.metadata.artist}</div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 opacity-80">
                                {song.metadata.key && <span><span className="opacity-60">Key:</span> {song.metadata.key}</span>}
                                {song.metadata.tempo && <span><span className="opacity-60">Tempo:</span> {song.metadata.tempo} bpm</span>}
                                {song.metadata.time_signature && <span><span className="opacity-60">Time:</span> {song.metadata.time_signature}</span>}
                            </div>

                            {(song.metadata.ccli || song.metadata.copyright) && (
                                <div className="text-xs opacity-60 mt-1">
                                    {song.metadata.ccli && <span className="mr-3">CCLI: {song.metadata.ccli}</span>}
                                    {song.metadata.copyright && <span>© {song.metadata.copyright}</span>}
                                </div>
                            )}

                            {song.metadata.themes && song.metadata.themes.length > 0 && (
                                <div className="flex gap-2 mt-1">
                                    {song.metadata.themes.map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs border dark:border-gray-700">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
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
