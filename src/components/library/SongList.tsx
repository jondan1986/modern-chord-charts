
import React from "react";
import { StoredSong } from "@/src/services/storage";
import { Theme } from "@/src/mcs-core/model";

interface Props {
    songs: StoredSong[];
    theme: Theme;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
}

export const SongList: React.FC<Props> = ({ songs, theme, selectedId, onSelect, onOpen }) => {
    if (songs.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                <p className="text-xl font-medium">Your library is empty.</p>
                <p className="mt-2 text-sm">Create a new song using the &quot;New Song&quot; button or import a backup.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {songs.map(song => (
                <div key={song.id}
                    className={`border p-4 rounded-lg flex justify-between items-center transition shadow-sm bg-white dark:bg-gray-900 cursor-pointer ${selectedId === song.id ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ borderColor: theme.colors.section_header }}
                    onClick={() => onSelect(song.id)}
                    onDoubleClick={() => onOpen(song.id)}
                >
                    <div className="flex-1">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">{song.title}</h2>
                        <div className="text-gray-600 dark:text-gray-400">{song.artist}</div>
                        <div className="text-xs mt-1 text-gray-400">
                            Last Updated: {new Date(song.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
