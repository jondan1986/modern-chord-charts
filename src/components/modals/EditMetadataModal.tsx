import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { SongMetadata } from '@/src/mcs-core/model';
import { MetadataSchema } from '@/src/mcs-core/validator';
import { z } from 'zod';

interface EditMetadataModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMetadata?: SongMetadata;
    onSave: (metadata: SongMetadata) => void;
}

const KNOWN_METADATA_KEYS = new Set(['title', 'artist', 'key', 'tempo', 'time_signature', 'year', 'themes', 'copyright', 'ccli']);

export function EditMetadataModal({ isOpen, onClose, initialMetadata, onSave }: EditMetadataModalProps) {
    const [formData, setFormData] = useState<Partial<SongMetadata>>({
        title: '',
        artist: '',
        key: '',
        tempo: undefined,
        time_signature: '',
        year: undefined,
    });
    const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

    // Reset form when modal opens with new data
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (isOpen && initialMetadata) {
            setFormData({
                title: initialMetadata.title || '',
                artist: initialMetadata.artist || '',
                key: initialMetadata.key || '',
                tempo: initialMetadata.tempo,
                time_signature: initialMetadata.time_signature || '',
                year: initialMetadata.year,
            });
            // Extract custom fields
            const custom = Object.entries(initialMetadata)
                .filter(([k]) => !KNOWN_METADATA_KEYS.has(k))
                .map(([key, value]) => ({ key, value: String(value ?? '') }));
            setCustomFields(custom);
        } else if (isOpen) {
            setCustomFields([]);
        }
    }, [isOpen, initialMetadata]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        // We only validate fields we are editing for now, or construct a full object?
        // The Schema requires title/artist.
        // We should merge with existing metadata to ensure we don't lose other fields? 
        // For now, let's assume we are editing these specific fields.

        const payload: Record<string, any> = {
            ...initialMetadata,
            ...formData,
        };

        // Merge custom fields
        // First remove any old custom keys that were removed
        if (initialMetadata) {
            Object.keys(initialMetadata)
                .filter(k => !KNOWN_METADATA_KEYS.has(k))
                .forEach(k => delete payload[k]);
        }
        // Then add current custom fields
        customFields.forEach(({ key, value }) => {
            if (key.trim()) payload[key.trim()] = value;
        });

        // Zod Validation
        const result = MetadataSchema.safeParse(payload);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) {
                    fieldErrors[issue.path[0].toString()] = issue.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        onSave(result.data as SongMetadata);
        onClose();
    };

    const handleChange = (field: keyof SongMetadata, value: string | number | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error
        if (errors[field as string]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field as string];
                return newErrors;
            });
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Metadata">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`w-full rounded-md border ${errors.title ? 'border-red-500' : 'border-gray-300'} dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100`}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="artist" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artist</label>
                        <input
                            id="artist"
                            type="text"
                            value={formData.artist}
                            onChange={(e) => handleChange('artist', e.target.value)}
                            className={`w-full rounded-md border ${errors.artist ? 'border-red-500' : 'border-gray-300'} dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100`}
                        />
                        {errors.artist && <p className="text-red-500 text-xs mt-1">{errors.artist}</p>}
                    </div>

                    <div>
                        <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key</label>
                        <input
                            id="key"
                            type="text"
                            value={formData.key || ''}
                            onChange={(e) => handleChange('key', e.target.value)}
                            placeholder="e.g. C"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="time_signature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Sig</label>
                        <input
                            id="time_signature"
                            type="text"
                            value={formData.time_signature || ''}
                            onChange={(e) => handleChange('time_signature', e.target.value)}
                            placeholder="e.g. 4/4"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="tempo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tempo (BPM)</label>
                        <input
                            id="tempo"
                            type="number"
                            value={formData.tempo || ''}
                            onChange={(e) => handleChange('tempo', parseInt(e.target.value) || undefined)}
                            placeholder="e.g. 120"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                        {errors.tempo && <p className="text-red-500 text-xs mt-1">{errors.tempo}</p>}
                    </div>

                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                        <input
                            id="year"
                            type="number"
                            value={formData.year || ''}
                            onChange={(e) => handleChange('year', parseInt(e.target.value) || undefined)}
                            placeholder="e.g. 1972"
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                        {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                    </div>
                </div>

                {/* Custom Fields */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Fields</label>
                        <button
                            type="button"
                            onClick={() => setCustomFields(prev => [...prev, { key: '', value: '' }])}
                            className="text-xs px-2 py-1 text-blue-600 hover:text-blue-500 border border-blue-200 dark:border-blue-900 rounded"
                        >
                            + Add Field
                        </button>
                    </div>
                    {customFields.map((field, idx) => (
                        <div key={idx} className="flex gap-2 mb-2 items-center">
                            <input
                                type="text"
                                value={field.key}
                                onChange={(e) => {
                                    const updated = [...customFields];
                                    updated[idx] = { ...updated[idx], key: e.target.value };
                                    setCustomFields(updated);
                                }}
                                placeholder="Key"
                                className="w-1/3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                            />
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => {
                                    const updated = [...customFields];
                                    updated[idx] = { ...updated[idx], value: e.target.value };
                                    setCustomFields(updated);
                                }}
                                placeholder="Value"
                                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setCustomFields(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 text-sm px-1"
                                title="Remove field"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    {customFields.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No custom fields. Click &quot;+ Add Field&quot; to add one.</p>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mr-2 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        Save Metadata
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// Fix for parseInt returning NaN which might upset type usage if not handled
// logic above: parseInt(e.target.value) || undefined . If NaN, it becomes undefined.
