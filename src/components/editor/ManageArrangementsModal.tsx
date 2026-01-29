import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { Arrangement, Section } from '@/src/mcs-core/model';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';

interface ManageArrangementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sections: Section[];
    existingArrangements: Arrangement[];
    onSave: (arrangements: Arrangement[]) => void;
}

export function ManageArrangementsModal({ isOpen, onClose, sections, existingArrangements, onSave }: ManageArrangementsModalProps) {
    const [arrangements, setArrangements] = useState<Arrangement[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null); // null means viewing list, number means editing specific one

    // Edit State
    const [editName, setEditName] = useState('');
    const [editOrder, setEditOrder] = useState<string[]>([]); // List of Section IDs

    useEffect(() => {
        if (isOpen) {
            setArrangements(existingArrangements || []);
            setEditingIndex(null);
        }
    }, [isOpen, existingArrangements]);

    const handleCreateNew = () => {
        setEditName('New Arrangement');
        setEditOrder([]);
        setEditingIndex(-1); // -1 indicates new
    };

    const handleEdit = (index: number) => {
        setEditName(arrangements[index].name);
        setEditOrder([...arrangements[index].order]);
        setEditingIndex(index);
    };

    const handleDelete = (index: number) => {
        const newArrangements = [...arrangements];
        newArrangements.splice(index, 1);
        setArrangements(newArrangements);
    };

    const handleSaveEdit = () => {
        const newArr: Arrangement = {
            name: editName,
            order: editOrder
        };

        const newList = [...arrangements];
        if (editingIndex === -1) {
            newList.push(newArr);
        } else if (editingIndex !== null) {
            newList[editingIndex] = newArr;
        }

        setArrangements(newList);
        setEditingIndex(null);
    };

    // Helper to get section label
    const getSectionLabel = (id: string) => {
        const section = sections.find(s => s.id === id);
        if (!section) return id;
        return section.label || `${section.type} ${id}`;
    };

    // Editor Actions
    const addToOrder = (id: string) => {
        setEditOrder([...editOrder, id]);
    };

    const removeFromOrder = (idx: number) => {
        const newOrder = [...editOrder];
        newOrder.splice(idx, 1);
        setEditOrder(newOrder);
    };

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const newOrder = [...editOrder];
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        setEditOrder(newOrder);
    };

    const moveDown = (idx: number) => {
        if (idx === editOrder.length - 1) return;
        const newOrder = [...editOrder];
        [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
        setEditOrder(newOrder);
    };

    const handleFinalSave = () => {
        onSave(arrangements);
        onClose();
    };

    const isEditing = editingIndex !== null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? (editingIndex === -1 ? 'New Arrangement' : 'Edit Arrangement') : 'Manage Arrangements'}
        >
            {!isEditing ? (
                // List View
                <div className="space-y-4">
                    {arrangements.length === 0 && (
                        <p className="text-gray-500 text-center py-4 italic">No arrangements found.</p>
                    )}

                    <div className="space-y-2">
                        {arrangements.map((arr, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100 block">{arr.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{arr.order.length} sections</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(idx)}
                                        className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(idx)}
                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex justify-between">
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <Plus size={16} /> Create New
                        </button>

                        <button
                            onClick={handleFinalSave}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-500"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            ) : (
                // Edit View
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-64">
                        {/* Available Sections */}
                        <div className="border dark:border-gray-700 rounded-md flex flex-col overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-500 uppercase border-b dark:border-gray-700">
                                Available Sections
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {sections.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => addToOrder(s.id)}
                                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                                    >
                                        <Plus size={12} className="inline mr-1 opacity-50" /> {s.label} <span className='text-xs text-gray-400'>({s.id})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Order */}
                        <div className="border dark:border-gray-700 rounded-md flex flex-col overflow-hidden">
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-500 uppercase border-b dark:border-gray-700">
                                Arrangement Order
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {editOrder.length === 0 && <span className="text-xs text-gray-400 italic p-2">Empty</span>}
                                {editOrder.map((sid, idx) => (
                                    <div key={idx} className="flex items-center gap-1 group">
                                        <div className="flex-1 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded truncate">
                                            {getSectionLabel(sid)}
                                        </div>
                                        <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                            <ArrowUp size={12} />
                                        </button>
                                        <button onClick={() => moveDown(idx)} disabled={idx === editOrder.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                            <ArrowDown size={12} />
                                        </button>
                                        <button onClick={() => removeFromOrder(idx)} className="p-1 text-red-400 hover:text-red-600">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                        <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Back to List
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={!editName}
                            className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-500 disabled:opacity-50"
                        >
                            Save Arrangement
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

