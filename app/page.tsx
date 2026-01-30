
"use client";

import React, { useEffect, useState } from "react";
import { songStorage, StoredSong, StoredSetlist } from "@/src/services/storage";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";
import { SongList } from "@/src/components/library/SongList";
import { SetlistList } from "@/src/components/library/SetlistList";

export default function LibraryPage() {
    const [songs, setSongs] = useState<StoredSong[]>([]);
    const [setlists, setSetlists] = useState<StoredSetlist[]>([]);
    const [activeTab, setActiveTab] = useState<'songs' | 'setlists'>('songs');

    const loadSong = useAppStore((state) => state.loadSong);
    const theme = useAppStore((state) => state.theme);
    const router = useRouter();

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        const allSongs = await songStorage.getAllSongs();
        setSongs(allSongs.sort((a, b) => b.updatedAt - a.updatedAt));

        const allSetlists = await songStorage.getAllSetlists();
        setSetlists(allSetlists.sort((a, b) => b.updatedAt - a.updatedAt));
    };

    // --- Song Handlers ---
    const handleOpenSong = async (id: string) => {
        await loadSong(id);
        router.push("/viewer");
    };

    const handleEditSong = async (id: string) => {
        await loadSong(id);
        router.push("/editor");
    };

    const handleDeleteSong = async (id: string) => {
        if (confirm("Are you sure you want to delete this song?")) {
            await songStorage.deleteSong(id);
            loadLibrary();
        }
    };

    // --- Setlist Handlers ---
    const handleCreateSetlist = async () => {
        const name = prompt("Enter setlist name:"); // Simple prompt for now
        if (name) {
            await songStorage.saveSetlist({ title: name });
            loadLibrary();
        }
    };

    const handleOpenSetlist = (id: string) => {
        router.push(`/setlist/${id}`);
    };

    const handleDeleteSetlist = async (id: string) => {
        if (confirm("Are you sure you want to delete this setlist?")) {
            await songStorage.deleteSetlist(id);
            loadLibrary();
        }
    };


    const pageStyle = { backgroundColor: theme.colors.background, color: theme.colors.text_primary };
    const headerStyle = { borderColor: theme.colors.section_header };

    return (
        <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto" style={pageStyle}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4" style={headerStyle}>
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">📚 Library</h1>
                    <div className="flex gap-1 ml-4">
                        <button
                            onClick={async () => {
                                const json = await songStorage.exportLibrary();
                                const blob = new Blob([json], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `mcs-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                            title="Backup Library"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        </button>
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'application/json';
                                input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    const text = await file.text();
                                    try {
                                        await songStorage.importLibrary(text);
                                        loadLibrary();
                                        alert("Library imported successfully.");
                                    } catch (err) {
                                        console.error(err);
                                        alert("Failed to import library.");
                                    }
                                };
                                input.click();
                            }}
                            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                            title="Restore Library"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        </button>
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pro,.cho,.txt,.chordpro';
                                input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    const text = await file.text();
                                    try {
                                        const { ChordProConverter } = await import("@/src/services/import/chordpro");
                                        const mcsYaml = ChordProConverter.convert(text);
                                        const id = await songStorage.saveSong(mcsYaml);
                                        await loadSong(id);
                                        router.push("/editor");
                                    } catch (err) {
                                        console.error(err);
                                        alert("Failed to import ChordPro file.");
                                    }
                                };
                                input.click();
                            }}
                            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
                            title="Import ChordPro File"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('songs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'songs' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                        Songs ({songs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('setlists')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'setlists' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                        Setlists ({setlists.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'songs' ? (
                <SongList
                    songs={songs}
                    theme={theme}
                    onOpen={handleOpenSong}
                    onEdit={handleEditSong}
                    onDelete={handleDeleteSong}
                />
            ) : (
                <SetlistList
                    setlists={setlists}
                    theme={theme}
                    onOpen={handleOpenSetlist}
                    onEdit={handleOpenSetlist}
                    onDelete={handleDeleteSetlist}
                    onCreate={handleCreateSetlist}
                />
            )}
        </div>
    );
}
