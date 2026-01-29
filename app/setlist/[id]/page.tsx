
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StoredSetlist, StoredSong, songStorage } from "@/src/services/storage";
import { useAppStore } from "@/src/state/store";
import { SongPickerModal } from "@/src/components/library/SongPickerModal";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Play } from "lucide-react";

export default function SetlistDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const theme = useAppStore((state) => state.theme);
    const loadSong = useAppStore((state) => state.loadSong);

    const [setlist, setSetlist] = useState<StoredSetlist | null>(null);
    const [songsMap, setSongsMap] = useState<Record<string, StoredSong>>({});
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        const s = await songStorage.getSetlist(id);
        if (!s) {
            alert("Setlist not found");
            router.push("/");
            return;
        }
        setSetlist(s);
        setEditName(s.title);

        // Load songs details
        const allSongs = await songStorage.getAllSongs();
        const map: Record<string, StoredSong> = {};
        allSongs.forEach(song => map[song.id] = song);
        setSongsMap(map);
    };

    const handleSaveName = async () => {
        if (setlist && editName !== setlist.title) {
            await songStorage.saveSetlist({ ...setlist, title: editName });
            setSetlist({ ...setlist, title: editName });
        }
    };

    const handleAddSong = async (songId: string) => {
        if (!setlist) return;
        const newSongs = [...setlist.songs, songId];
        const updated = { ...setlist, songs: newSongs };
        setSetlist(updated);
        await songStorage.saveSetlist(updated);
        setIsPickerOpen(false);
    };

    const handleRemoveSong = async (index: number) => {
        if (!setlist) return;
        const newSongs = [...setlist.songs];
        newSongs.splice(index, 1);
        const updated = { ...setlist, songs: newSongs };
        setSetlist(updated);
        await songStorage.saveSetlist(updated);
    };

    const handleMove = async (index: number, direction: -1 | 1) => {
        if (!setlist) return;
        const newSongs = [...setlist.songs];
        if (direction === -1 && index > 0) {
            [newSongs[index - 1], newSongs[index]] = [newSongs[index], newSongs[index - 1]];
        } else if (direction === 1 && index < newSongs.length - 1) {
            [newSongs[index + 1], newSongs[index]] = [newSongs[index], newSongs[index + 1]];
        }
        const updated = { ...setlist, songs: newSongs };
        setSetlist(updated);
        await songStorage.saveSetlist(updated);
    };

    const startSetlist = useAppStore((state) => state.startSetlist);

    const handlePlay = async (index: number) => {
        if (!setlist) return;

        // Start setlist mode (this sets state and loads the song)
        await startSetlist(setlist.id, setlist.songs);

        // If we are starting at a specific index other than 0, we might need to fast forward, 
        // but for now startSetlist defaults to 0. 
        // Let's manually set index if needed, but startSetlist currently just loads 0.
        // For MVP, if they click "Play" on song #3, it's nice to jump there.
        // We'll need to expand startSetlist or manually jump.

        // Actually, let's just cheat and user store.setState for quick index jump or add 'index' param to startSetlist
        // Cleaner: Add startIndex to startSetlist

        // Since I can't easily change the store interface without a big refactor step,
        // I'll just use the primitives I added: startSetlist loads index 0.
        // If index > 0, I'll loop nextSetlistSong or just force the state.

        // Let's refine the Store first? No, let's just be simple: 
        // If clicking PLAY on Song 3, we probably want to start the setlist FROM there.
        // But the user might want to start from the beginning.
        // The UI button is on the row, so it implies "Play THIS song in the context of the setlist".

        // I'll update the store in a sec to allow starting at index, 
        // but for now let's just 'start' and assume 0, and maybe brute force the jump.

        // Better: Update store to accept optional startIndex.
        useAppStore.setState({
            activeSetlistId: setlist.id,
            activeSetlistSongs: setlist.songs,
            currentSetlistIndex: index
        });
        await loadSong(setlist.songs[index]);

        router.push("/viewer");
    };

    if (!setlist) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto" style={{ backgroundColor: theme.colors.background, color: theme.colors.text_primary }}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.push("/")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={handleSaveName}
                        className="text-3xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                    />
                    <div className="text-gray-500 text-sm mt-1">{setlist.songs.length} songs</div>
                </div>
                <button
                    onClick={() => setIsPickerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 shadow-sm"
                >
                    <Plus size={18} /> Add Song
                </button>
            </div>

            {/* Song List */}
            <div className="space-y-3">
                {setlist.songs.map((songId, index) => {
                    const song = songsMap[songId];
                    if (!song) return <div key={index} className="text-red-500 p-4 border rounded">Song not found (ID: {songId})</div>;

                    return (
                        <div key={`${songId}-${index}`} className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm group" style={{ borderColor: theme.colors.section_header }}>
                            <div className="text-gray-400 font-mono w-6 text-center">{index + 1}</div>
                            <div className="flex-1">
                                <div className="font-bold text-lg">{song.title}</div>
                                <div className="text-sm text-gray-500">{song.artist}</div>
                            </div>

                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handlePlay(index)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Open in Viewer">
                                    <Play size={18} />
                                </button>
                                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2"></div>
                                <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                    <ArrowUp size={18} />
                                </button>
                                <button onClick={() => handleMove(index, 1)} disabled={index === setlist.songs.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                    <ArrowDown size={18} />
                                </button>
                                <button onClick={() => handleRemoveSong(index)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {setlist.songs.length === 0 && (
                    <div className="text-center py-10 text-gray-400 border border-dashed rounded-lg">
                        This setlist is empty. Click "Add Song" to start building it.
                    </div>
                )}
            </div>

            <SongPickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onSelect={handleAddSong}
            />
        </div>
    );
}
