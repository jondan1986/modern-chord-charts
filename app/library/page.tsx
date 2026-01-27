
"use client";

import React, { useEffect, useState } from "react";
import { songStorage } from "@/src/services/storage";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";

// Define simpler type manually to avoid complex imports if not needed, 
// or import from service if exported
interface StoredSong {
    id: string;
    title: string;
    artist: string;
    updatedAt: number;
}

export default function LibraryPage() {
    const [songs, setSongs] = useState<StoredSong[]>([]);
    const loadSong = useAppStore((state) => state.loadSong);
    const router = useRouter();

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        const all = await songStorage.getAllSongs();
        // Sort by updated descending
        setSongs(all.sort((a, b) => b.updatedAt - a.updatedAt));
    };

    const handleOpen = async (id: string) => {
        await loadSong(id);
        router.push("/"); // Go to viewer
    };

    const handleEdit = async (id: string) => {
        await loadSong(id);
        router.push("/editor");
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this song?")) {
            await songStorage.deleteSong(id);
            loadLibrary();
        }
    };

    const handleExportAll = async () => {
        const json = await songStorage.exportLibrary();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mcs_library_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
                loadLibrary();
            } catch (err) {
                alert("Failed to import: " + err);
            }
        };
        reader.readAsText(file);
    };

    const theme = useAppStore((state) => state.theme);

    return (
        <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text_primary }}>
            <div className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: theme.colors.section_header }}>
                <h1 className="text-3xl font-bold">📚 Song Library</h1>
                {/* Actions are now in the Header Nav, but we'll keep list-specific ones like bulk export if we had them or filter inputs here later */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {songs.length} song{songs.length !== 1 ? 's' : ''}
                </div>
            </div>

            {songs.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                    <p className="text-xl font-medium">Your library is empty.</p>
                    <p className="mt-2 text-sm">Create a new song using the "New Song" menu or import a backup.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {songs.map(song => (
                        <div key={song.id}
                            className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm bg-white dark:bg-gray-900"
                            style={{ borderColor: theme.colors.section_header }}
                        >
                            <div className="flex-1 cursor-pointer" onClick={() => handleOpen(song.id)}>
                                <h3 className="font-bold text-lg" style={{ color: theme.colors.text_primary }}>{song.title}</h3>
                                <div style={{ color: theme.colors.text_secondary }}>{song.artist}</div>
                                <div className="text-xs mt-1 opacity-60">
                                    Last Updated: {new Date(song.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpen(song.id)} className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium">
                                    👁️ Open
                                </button>
                                <button onClick={() => handleEdit(song.id)} className="px-3 py-1.5 border border-gray-400 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
                                    ✏️ Edit
                                </button>
                                <button onClick={() => handleDelete(song.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-sm font-medium">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
