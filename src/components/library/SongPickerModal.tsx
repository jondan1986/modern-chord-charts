
import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { StoredSong, songStorage } from '@/src/services/storage';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (songId: string) => void;
}

export function SongPickerModal({ isOpen, onClose, onSelect }: Props) {
    const [songs, setSongs] = useState<StoredSong[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            songStorage.getAllSongs().then(setSongs);
        }
    }, [isOpen]);

    const filtered = songs.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Song to Setlist">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search songs..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
                {filtered.map(song => (
                    <button
                        key={song.id}
                        onClick={() => onSelect(song.id)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex justify-between items-center group"
                    >
                        <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{song.title}</div>
                            <div className="text-xs text-gray-500">{song.artist}</div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-blue-600 text-sm font-medium">Add</span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">No songs found.</div>
                )}
            </div>
        </Modal>
    );
}
