import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface TabDefinition {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface TabbedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tabs: TabDefinition[];
    defaultTab?: string;
}

export function TabbedModal({ isOpen, onClose, title, tabs, defaultTab }: TabbedModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab ?? tabs[0]?.id ?? '');
        }
    }, [isOpen, defaultTab, tabs]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const activeContent = tabs.find(t => t.id === activeTab)?.content;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                ref={overlayRef}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>
                {tabs.length > 1 && (
                    <div className="flex border-b border-gray-200 dark:border-gray-800 px-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
                <div className="p-4">
                    {activeContent}
                </div>
            </div>
        </div>,
        document.body
    );
}
