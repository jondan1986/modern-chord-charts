"use client";

import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Header() {
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const activeYaml = useAppStore((state) => state.activeYaml);
    const lastSavedYaml = useAppStore((state) => state.lastSavedYaml);
    const hydrateFromStorage = useAppStore((state) => state.hydrateFromStorage);
    const pathname = usePathname();

    const isDirty = activeYaml !== lastSavedYaml;

    const isActive = (path: string) => pathname === path;

    useEffect(() => {
        hydrateFromStorage();
    }, [hydrateFromStorage]);

    useEffect(() => {
        if (theme.name === 'Dark Mode') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme.name]);

    return (
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

                    <Link
                        href="/themes"
                        className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/themes') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`}
                    >
                        Themes
                    </Link>

                    <Link
                        href="/playback"
                        className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/playback') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`}
                    >
                        Playback
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded hover:opacity-75 transition-opacity"
                    style={{ borderColor: theme.colors.text_secondary }}
                >
                    {theme.name === "Light Mode" ? "Dark" : "Light"}
                </button>
            </div>
        </header>
    );
}
