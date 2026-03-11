"use client";

import React from "react";
import { useAppStore } from "@/src/state/store";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import ThemeEditor from "@/src/components/viewer/ThemeEditor";
import { ALL_THEMES } from "@/src/components/viewer/themes";
import { Theme } from "@/src/mcs-core/model";

export default function ThemesPage() {
    const activeYaml = useAppStore((state) => state.activeYaml);
    const theme = useAppStore((state) => state.theme);
    const setTheme = useAppStore((state) => state.setTheme);
    const customThemes = useAppStore((state) => state.customThemes);
    const saveCustomTheme = useAppStore((state) => state.saveCustomTheme);
    const deleteCustomTheme = useAppStore((state) => state.deleteCustomTheme);

    // Parse active song for preview
    const parsedSong = React.useMemo(() => {
        try {
            return MCSParser.parse(activeYaml);
        } catch {
            return null;
        }
    }, [activeYaml]);

    const siteTheme = useAppStore((state) => state.theme);
    const isDark = siteTheme.name === "Dark Mode";

    return (
        <div className={`h-full overflow-y-auto ${isDark ? "bg-gray-900 text-gray-50" : "bg-gray-50 text-gray-900"}`}>
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <h1 className="text-2xl font-bold mb-6">Song Themes</h1>

                {/* Preset Theme Quick Select */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 mb-3">Presets</h2>
                    <div className="flex gap-3 flex-wrap">
                        {ALL_THEMES.map((t) => (
                            <button
                                key={t.name}
                                onClick={() => setTheme(t)}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${theme.name === t.name
                                    ? "ring-2 ring-blue-500 border-blue-500"
                                    : isDark ? "border-gray-700 hover:border-gray-500" : "border-gray-300 hover:border-gray-500"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: t.colors.chord, borderColor: t.colors.text_secondary }}
                                    />
                                    {t.name}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Themes */}
                {customThemes.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 mb-3">Custom Themes</h2>
                        <div className="flex gap-3 flex-wrap">
                            {customThemes.map((t: Theme) => (
                                <div key={t.name} className="flex items-center gap-1">
                                    <button
                                        onClick={() => setTheme(t)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${theme.name === t.name
                                            ? "ring-2 ring-blue-500 border-blue-500"
                                            : isDark ? "border-gray-700 hover:border-gray-500" : "border-gray-300 hover:border-gray-500"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: t.colors.chord, borderColor: t.colors.text_secondary }}
                                            />
                                            {t.name}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete "${t.name}"?`)) deleteCustomTheme(t.name);
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700 transition"
                                        title="Delete theme"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Editor + Preview Split */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Theme Editor */}
                    <div className="lg:w-96 shrink-0">
                        <ThemeEditor
                            theme={theme}
                            onThemeChange={setTheme}
                            onSaveCustomTheme={saveCustomTheme}
                            inline
                        />
                    </div>

                    {/* Live Preview */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60 mb-3">Live Preview</h2>
                        <div className="rounded-lg border overflow-hidden" style={{ borderColor: isDark ? "#374151" : "#d1d5db" }}>
                            {parsedSong ? (
                                <SongViewer song={parsedSong} theme={theme} />
                            ) : (
                                <div className="p-10 text-center opacity-50">
                                    No song loaded. Open a song from the Library first to preview themes.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
