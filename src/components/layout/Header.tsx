"use client";

import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ALL_THEMES } from "@/src/components/viewer/themes";
import ThemeEditor from "@/src/components/viewer/ThemeEditor";

export default function Header() {
    const theme = useAppStore((state) => state.theme);
    const setTheme = useAppStore((state) => state.setTheme);
    const customThemes = useAppStore((state) => state.customThemes);
    const saveCustomTheme = useAppStore((state) => state.saveCustomTheme);
    const deleteCustomTheme = useAppStore((state) => state.deleteCustomTheme);
    const activeYaml = useAppStore((state) => state.activeYaml);
    const lastSavedYaml = useAppStore((state) => state.lastSavedYaml);
    const pathname = usePathname();

    const [showThemeDropdown, setShowThemeDropdown] = useState(false);
    const [showThemeEditor, setShowThemeEditor] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isDirty = activeYaml !== lastSavedYaml;
    const isActive = (path: string) => pathname === path;

    useEffect(() => {
        const isDarkBg = theme.colors.background < "#888888";
        if (isDarkBg) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme.colors.background]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!showThemeDropdown) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowThemeDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showThemeDropdown]);

    const allAvailableThemes = [...ALL_THEMES, ...customThemes];

    return (
        <>
            <header className="header h-14 md:h-16 flex items-center justify-between px-3 md:px-6 border-b shrink-0 transition-colors duration-300 z-50 relative"
                style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.section_header,
                    color: theme.colors.text_primary
                }}>

                <div className="flex items-center gap-3 md:gap-8">
                    <Link href="/" className="text-base md:text-xl font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
                        🎸 <span className="hidden sm:inline">Modern </span>Chord Charts
                    </Link>

                    <nav className="flex gap-1 md:gap-2 text-xs md:text-sm font-medium">
                        <Link
                            href="/"
                            className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`}
                        >
                            Library
                        </Link>

                        <Link
                            href="/viewer"
                            className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/viewer') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`}
                        >
                            Viewer
                        </Link>

                        <Link
                            href="/editor"
                            className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/editor') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`}
                        >
                            {isDirty && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                            Editor
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                            className="px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded hover:opacity-75 transition-opacity flex items-center gap-1.5"
                            style={{ borderColor: theme.colors.text_secondary }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                            <span className="hidden sm:inline">{theme.name}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {showThemeDropdown && (
                            <div
                                className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-xl border overflow-hidden"
                                style={{
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.section_header,
                                    color: theme.colors.text_primary,
                                    zIndex: 60,
                                }}
                            >
                                {/* Preset Themes */}
                                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold opacity-50">
                                    Preset Themes
                                </div>
                                {ALL_THEMES.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => {
                                            setTheme(t);
                                            setShowThemeDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity flex items-center justify-between"
                                        style={{
                                            backgroundColor: theme.name === t.name ? theme.colors.highlight : "transparent",
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: t.colors.chord, borderColor: t.colors.text_secondary }}
                                            />
                                            {t.name}
                                        </div>
                                        {theme.name === t.name && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}

                                {/* Custom Themes */}
                                {customThemes.length > 0 && (
                                    <>
                                        <div className="border-t" style={{ borderColor: theme.colors.section_header }} />
                                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold opacity-50">
                                            Custom Themes
                                        </div>
                                        {customThemes.map((t) => (
                                            <div
                                                key={t.name}
                                                className="flex items-center justify-between px-3 py-2 hover:opacity-80 transition-opacity"
                                                style={{
                                                    backgroundColor: theme.name === t.name ? theme.colors.highlight : "transparent",
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setTheme(t);
                                                        setShowThemeDropdown(false);
                                                    }}
                                                    className="flex items-center gap-2 text-sm flex-1 text-left"
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full border"
                                                        style={{ backgroundColor: t.colors.chord, borderColor: t.colors.text_secondary }}
                                                    />
                                                    {t.name}
                                                    {theme.name === t.name && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Delete custom theme "${t.name}"?`)) {
                                                            deleteCustomTheme(t.name);
                                                        }
                                                    }}
                                                    className="p-1 hover:opacity-60 transition-opacity ml-1"
                                                    title="Delete theme"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Customize Option */}
                                <div className="border-t" style={{ borderColor: theme.colors.section_header }} />
                                <button
                                    onClick={() => {
                                        setShowThemeEditor(true);
                                        setShowThemeDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                    Customize...
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Theme Editor Panel */}
            {showThemeEditor && (
                <ThemeEditor
                    theme={theme}
                    onThemeChange={setTheme}
                    onSaveCustomTheme={saveCustomTheme}
                    onClose={() => setShowThemeEditor(false)}
                />
            )}
        </>
    );
}
