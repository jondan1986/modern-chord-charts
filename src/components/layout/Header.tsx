"use client";

import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { songStorage } from "@/src/services/storage";

export default function Header() {
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const resetSong = useAppStore((state) => state.resetSong);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);
    const activeYaml = useAppStore((state) => state.activeYaml);
    const lastSavedYaml = useAppStore((state) => state.lastSavedYaml);

    const router = useRouter();
    const pathname = usePathname();

    const isDirty = activeYaml !== lastSavedYaml;

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = (name: string) => {
        setOpenDropdown(prev => prev === name ? null : name);
    };

    const handleNewSong = () => {
        resetSong();
        router.push("/editor");
        setOpenDropdown(null);
    };

    const handleSave = async () => {
        await saveCurrentSong();
        setOpenDropdown(null);
    };

    // Import trigger logic needs a hidden input, or we can just redirect to library where import lives
    // For now, let's keep Import in Library only or add a global import modal?
    // User requested "Import" under Library nav.

    // Helper for dropdown items
    const DropdownItem = ({ onClick, children, href }: { onClick?: () => void, children: React.ReactNode, href?: string }) => {
        const className = "block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer w-full text-left whitespace-nowrap";

        if (href) {
            return (
                <Link href={href} className={className} onClick={() => setOpenDropdown(null)}>
                    {children}
                </Link>
            );
        }
        return (
            <button onClick={onClick} className={className}>
                {children}
            </button>
        );
    };

    const isActive = (path: string) => pathname === path;

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b shrink-0 transition-colors duration-300 z-50 relative"
            style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.section_header,
                color: theme.colors.text_primary
            }}>

            <div className="flex items-center gap-8" ref={dropdownRef}>
                <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
                    🎸 Modern Chord Charts
                </Link>

                <nav className="flex gap-2 text-sm font-medium">
                    {/* Viewer Nav */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('viewer')}
                            className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/') || openDropdown === 'viewer' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            👁️ Viewer ▾
                        </button>
                        {openDropdown === 'viewer' && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg overflow-hidden z-50"
                                style={{ borderColor: theme.colors.section_header, color: theme.colors.text_primary }}>
                                <DropdownItem href="/">👁️ View Current</DropdownItem>
                                <DropdownItem href="/editor">✏️ Edit Current</DropdownItem>
                                <DropdownItem onClick={handleNewSong}>📄 New Song</DropdownItem>
                            </div>
                        )}
                    </div>

                    {/* Library Nav */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('library')}
                            className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/library') || openDropdown === 'library' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            📚 Library ▾
                        </button>
                        {openDropdown === 'library' && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg overflow-hidden z-50"
                                style={{ borderColor: theme.colors.section_header, color: theme.colors.text_primary }}>
                                <DropdownItem href="/library">📚 View Library</DropdownItem>
                                <DropdownItem onClick={handleNewSong}>📄 New Song</DropdownItem>
                                {/* Import is a file input, tricky to do in dropdown without ref. 
                                    Simpler to link to library page or have a hidden input here. 
                                    Linking to library for robust import for now. 
                                */}
                            </div>
                        )}
                    </div>

                    {/* Editor Nav */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('editor')}
                            className={`px-3 py-2 rounded transition-colors flex items-center gap-1 ${isActive('/editor') || openDropdown === 'editor' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            {isDirty && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                            📝 Editor ▾
                        </button>
                        {openDropdown === 'editor' && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg overflow-hidden z-50"
                                style={{ borderColor: theme.colors.section_header, color: theme.colors.text_primary }}>
                                <DropdownItem href="/editor">📝 Go to Editor</DropdownItem>
                                <div className="border-t my-1 opacity-50"></div>
                                <DropdownItem onClick={handleSave}>
                                    {isDirty ? "🔴 Save (Unsaved)" : "💾 Save"}
                                </DropdownItem>
                                <DropdownItem onClick={handleNewSong}>📄 New Song</DropdownItem>
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded hover:opacity-75 transition-opacity"
                    style={{ borderColor: theme.colors.text_secondary }}
                >
                    {theme.name === "Light Mode" ? "🌙 Dark" : "☀️ Light"}
                </button>
            </div>
        </header>
    );
}
