
import React from "react";
import { StoredSong } from "@/src/services/storage";
import { Theme } from "@/src/mcs-core/model";

interface Props {
    songs: StoredSong[];
    theme: Theme;
    onOpen: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export const SongList: React.FC<Props> = ({ songs, theme, onOpen, onEdit, onDelete }) => {
    if (songs.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                <p className="text-xl font-medium">Your library is empty.</p>
                <p className="mt-2 text-sm">Create a new song using the "New Song" button or import a backup.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {songs.map(song => (
                <div key={song.id}
                    className="border p-4 rounded-lg flex justify-between items-center transition shadow-sm bg-white dark:bg-gray-900 group"
                    style={{ borderColor: theme.colors.section_header }}
                >
                    <div className="flex-1 cursor-pointer" onClick={() => onOpen(song.id)}>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{song.title}</h3>
                        <div className="text-gray-600 dark:text-gray-400">{song.artist}</div>
                        <div className="text-xs mt-1 text-gray-400">
                            Last Updated: {new Date(song.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onOpen(song.id)} className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors">
                            📂 Open
                        </button>
                        <button onClick={() => {
                            const blob = new Blob([song.yaml], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}.mcs`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }} className="px-3 py-1.5 border border-gray-400 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium" title="Export Song">
                            📤
                        </button>
                        <button onClick={() => onEdit(song.id)} className="px-3 py-1.5 border border-gray-400 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
                            ✏️ Edit
                        </button>
                        <button onClick={() => onDelete(song.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-sm font-medium">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
