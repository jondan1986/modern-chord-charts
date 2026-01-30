import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { SectionType } from '@/src/mcs-core/model';
import { v4 as uuidv4 } from 'uuid';

interface InsertSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (sectionSnippet: string) => void;
    initialLines?: string;
}

const SECTION_TYPES: { type: SectionType; label: string }[] = [
    { type: 'verse', label: 'Verse' },
    { type: 'chorus', label: 'Chorus' },
    { type: 'bridge', label: 'Bridge' },
    { type: 'intro', label: 'Intro' },
    { type: 'outro', label: 'Outro' },
    { type: 'instrumental', label: 'Instrumental' },
    { type: 'tag', label: 'Tag' },
    { type: 'hook', label: 'Hook' },
    { type: 'other', label: 'Custom' },
];

export function InsertSectionModal({ isOpen, onClose, onInsert, initialLines }: InsertSectionModalProps) {
    const [type, setType] = useState<SectionType>('verse');
    const [sectionLabel, setSectionLabel] = useState('Verse');
    const [lines, setLines] = useState('');

    // When type changes, default the label to the type's name, unless type is 'other' (empty default?)
    // Actually, user wants to specify label like "Verse 1".
    // If I switch to Chorus, I probably want "Chorus" as a start.
    React.useEffect(() => {
        const typeLabel = SECTION_TYPES.find(t => t.type === type)?.label || 'Section';
        setSectionLabel(typeLabel);
    }, [type]);

    React.useEffect(() => {
        if (isOpen && initialLines) {
            // Clean up the initial lines: remove YAML list markers, quotes, and indentation
            const cleaned = initialLines
                .split('\n')
                .map(line => {
                    let text = line.trim();
                    // Remove leading dash and optional whitespace
                    text = text.replace(/^-\s*/, '');
                    // Remove surrounding double quotes if present
                    if (text.startsWith('"') && text.endsWith('"')) {
                        text = text.slice(1, -1);
                    }
                    // Remove surrounding single quotes if present
                    else if (text.startsWith("'") && text.endsWith("'")) {
                        text = text.slice(1, -1);
                    }
                    return text;
                })
                .filter(l => l.trim().length > 0) // Remove empty lines
                .join('\n');

            setLines(cleaned);
        } else if (isOpen && !initialLines) {
            setLines('');
        }
    }, [isOpen, initialLines]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const id = uuidv4().slice(0, 8); // Short UUID for cleaner YAML
        const label = sectionLabel || (type.charAt(0).toUpperCase() + type.slice(1));

        // Construct YAML snippet
        let snippet = `  - id: "${id}"\n`;
        snippet += `    type: "${type}"\n`;
        snippet += `    label: "${label}"\n`;
        snippet += `    lines:\n`;

        const lineArray = lines.split('\n').map(l => l.trim()).filter(l => l !== '');
        if (lineArray.length === 0) {
            snippet += `      - " "\n`;
        } else {
            lineArray.forEach(line => {
                snippet += `      - "${line}"\n`;
            });
        }

        onInsert(snippet);
        onClose();
        // Reset state
        setType('verse');
        setSectionLabel('Verse');
        setLines('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Section">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="section-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Section Type
                    </label>
                    <select
                        id="section-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as SectionType)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                    >
                        {SECTION_TYPES.map((t) => (
                            <option key={t.type} value={t.type}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="section-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Section Label
                    </label>
                    <input
                        id="section-label"
                        type="text"
                        value={sectionLabel}
                        onChange={(e) => setSectionLabel(e.target.value)}
                        placeholder="e.g., Verse 1, Bridge 2"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label htmlFor="section-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Content (Lines)
                    </label>
                    <textarea
                        id="section-content"
                        value={lines}
                        onChange={(e) => setLines(e.target.value)}
                        rows={4}
                        placeholder="Type lyrics or chords here...&#10;One line per row."
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono text-gray-900 dark:text-gray-100"
                    />
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
                        Insert Section
                    </button>
                </div>
            </form>
        </Modal>
    );
}
