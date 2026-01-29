
import React from "react";
import { StoredSetlist } from "@/src/services/storage";
import { Theme } from "@/src/mcs-core/model";
import { Plus } from "lucide-react";

interface Props {
    setlists: StoredSetlist[];
    theme: Theme;
    onOpen: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}

export const SetlistList: React.FC<Props> = ({ setlists, theme, onOpen, onEdit, onDelete, onCreate }) => {
    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 shadow-sm"
                >
                    <Plus size={18} /> New Setlist
                </button>
            </div>

            {setlists.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed dark:border-gray-700">
                    <p className="text-xl font-medium">No setlists found.</p>
                    <p className="mt-2 text-sm">Create a setlist to organize your songs.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {setlists.map(setlist => (
                        <div key={setlist.id}
                            className="border p-4 rounded-lg flex justify-between items-center transition shadow-sm bg-white dark:bg-gray-900 group"
                            style={{ borderColor: theme.colors.section_header }}
                        >
                            <div className="flex-1 cursor-pointer" onClick={() => onOpen(setlist.id)}>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{setlist.title}</h3>
                                <div className="text-xs mt-1 text-gray-400">
                                    {setlist.songs.length} song{setlist.songs.length !== 1 ? 's' : ''} • Last Updated: {new Date(setlist.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onOpen(setlist.id)} className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium transition-colors">
                                    📂 Open
                                </button>
                                <button onClick={() => onDelete(setlist.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-sm font-medium">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
