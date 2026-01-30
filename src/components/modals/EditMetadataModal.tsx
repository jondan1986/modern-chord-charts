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

export function EditMetadataModal({ isOpen, onClose, initialMetadata, onSave }: EditMetadataModalProps) {
    const [formData, setFormData] = useState<Partial<SongMetadata>>({
        title: '',
        artist: '',
        key: '',
        tempo: undefined,
        time_signature: '',
    });

    // Reset form when modal opens with new data
    useEffect(() => {
        if (isOpen && initialMetadata) {
            setFormData({
                title: initialMetadata.title || '',
                artist: initialMetadata.artist || '',
                key: initialMetadata.key || '',
                tempo: initialMetadata.tempo,
                time_signature: initialMetadata.time_signature || '',
                // Add others as needed
            });
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

        const payload = {
            ...initialMetadata,
            ...formData,
            // Clean up empty strings to undefined if optional?
            // Schema has specific requirements.
            // If tempo is NaN, it might be an issue.
        };

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
