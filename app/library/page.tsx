
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

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-white text-gray-900">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold">Song Library</h1>
                <div className="flex gap-4">
                    <label className="px-4 py-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300">
                        Import
                        <input type="file" className="hidden" accept=".json,.mcs,.yaml,.yml" onChange={handleImport} />
                    </label>
                    <button onClick={handleExportAll} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                        Backup Library
                    </button>
                    <Link href="/editor" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500">
                        + New Song
                    </Link>
                    <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
                        Back to Viewer
                    </Link>
                </div>
            </div>

            {songs.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">Your library is empty.</p>
                    <p className="mt-2">Create a new song or import a backup.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {songs.map(song => (
                        <div key={song.id} className="border p-4 rounded flex justify-between items-center hover:bg-gray-50 transition">
                            <div>
                                <h3 className="font-bold text-lg">{song.title}</h3>
                                <div className="text-gray-600">{song.artist}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Updated: {new Date(song.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpen(song.id)} className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                                    Open
                                </button>
                                <button onClick={() => handleEdit(song.id)} className="px-3 py-1 border border-gray-400 text-gray-600 rounded hover:bg-gray-100">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(song.id)} className="px-3 py-1 text-red-600 hover:bg-red-50 rounded">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
