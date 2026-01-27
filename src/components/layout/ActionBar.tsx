"use client";

import { useAppStore } from "@/src/state/store";
import { usePathname, useRouter } from "next/navigation";
import { songStorage } from "@/src/services/storage";
import Link from "next/link";
import { useRef } from "react";

export default function ActionBar() {
    const theme = useAppStore((state) => state.theme);
    const resetSong = useAppStore((state) => state.resetSong);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);
    const activeYaml = useAppStore((state) => state.activeYaml);
    const lastSavedYaml = useAppStore((state) => state.lastSavedYaml);

    const router = useRouter();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDirty = activeYaml !== lastSavedYaml;

    const handleNewSong = () => {
        resetSong();
        router.push("/editor");
    };

    const handleSave = async () => {
        await saveCurrentSong();
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            try {
                // Basic detection: JSON vs YAML
                if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                    await songStorage.importLibrary(content);
                    alert("Library Imported Successfully!");
                } else {
                    // Assume single YAML file
                    await songStorage.saveSong(content);
                    alert("Song Imported Successfully!");
                }
                // Refresh logic? If we are on library page, we might want to refresh the list.
                // The LibraryPage uses 'useEffect' which won't auto-trigger.
                // A full page reload is a safe brute-force way, or we could add a 'version' to store to trigger refetch.
                window.location.reload();
            } catch (err) {
                alert("Failed to import: " + err);
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExportLibrary = async () => {
        const json = await songStorage.exportLibrary();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mcs_library_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Render content based on path
    const renderContent = () => {
        if (pathname === '/viewer') {
            return (
                <>
                    <Link href="/editor" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition shadow-sm font-medium text-sm">
                        ✏️ Edit Song
                    </Link>
                    <button onClick={handleNewSong} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition shadow-sm font-medium text-sm">
                        📄 New Song
                    </button>
                </>
            );
        }

        if (pathname === '/') {
            return (
                <>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json,.mcs,.yaml,.yml" onChange={handleImport} />
                    <button onClick={handleExportLibrary} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition shadow-sm font-medium text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        📤 Export Library
                    </button>
                    <button onClick={triggerImport} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition shadow-sm font-medium text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        📥 Import
                    </button>
                    <button onClick={handleNewSong} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition shadow-sm font-medium text-sm">
                        📄 New Song
                    </button>
                </>
            );
        }

        if (pathname === '/editor') {
            return (
                <>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-4 py-2 rounded transition shadow-sm font-medium text-sm ${isDirty ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        {isDirty ? "💾 Save (Unsaved)" : "💾 Save"}
                    </button>
                    <button onClick={handleNewSong} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition shadow-sm font-medium text-sm">
                        📄 New
                    </button>
                    <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition shadow-sm font-medium text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        ❌ Cancel
                    </Link>
                </>
            );
        }

        return null;
    };

    return (
        <div className="h-14 flex items-center justify-end px-6 border-b shrink-0 gap-3 transition-colors duration-300"
            style={{
                backgroundColor: theme.colors.background, // Match header or maybe slightly different?
                borderColor: theme.colors.section_header,
            }}>
            {renderContent()}
        </div>
    );
}
