"use client";

import React from 'react';
import { TabbedModal } from '@/src/components/ui/TabbedModal';

interface SongSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SongSelectModal({ isOpen, onClose }: SongSelectModalProps) {
    const tabs = [
        {
            id: 'search',
            label: 'Search',
            content: (
                <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    SongSelect integration coming soon.
                </div>
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
            content: (
                <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    SongSelect settings coming soon.
                </div>
            ),
        },
    ];

    return <TabbedModal isOpen={isOpen} onClose={onClose} title="SongSelect" tabs={tabs} />;
}
