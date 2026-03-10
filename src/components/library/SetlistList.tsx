
import React from "react";
import { StoredSetlist } from "@/src/services/storage";
import { Theme } from "@/src/mcs-core/model";
import { Plus } from "lucide-react";

interface Props {
    setlists: StoredSetlist[];
    theme: Theme;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
    onCreate: () => void;
}

export const SetlistList: React.FC<Props> = ({ setlists, theme, selectedId, onSelect, onOpen, onCreate }) => {
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
                            className={`border p-4 rounded-lg flex justify-between items-center transition shadow-sm bg-white dark:bg-gray-900 cursor-pointer ${selectedId === setlist.id ? 'ring-2 ring-blue-500' : ''}`}
                            style={{ borderColor: theme.colors.section_header }}
                            onClick={() => onSelect(setlist.id)}
                            onDoubleClick={() => onOpen(setlist.id)}
                        >
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{setlist.title}</h3>
                                <div className="text-xs mt-1 text-gray-400">
                                    {setlist.songs.length} song{setlist.songs.length !== 1 ? 's' : ''} • Last Updated: {new Date(setlist.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
