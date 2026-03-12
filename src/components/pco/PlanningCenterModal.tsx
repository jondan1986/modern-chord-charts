"use client";

import React from 'react';
import { TabbedModal } from '@/src/components/ui/TabbedModal';
import { PCOImportContent } from '@/src/components/pco/PCOImportModal';
import { PCOSettingsPanel } from '@/src/components/pco/PCOSettingsPanel';

interface PlanningCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
    onOpenSetlist?: (id: string) => void;
    defaultTab?: string;
}

export function PlanningCenterModal({ isOpen, onClose, onImported, onOpenSetlist, defaultTab }: PlanningCenterModalProps) {
    const tabs = [
        {
            id: 'import',
            label: 'Import',
            content: (
                <PCOImportContent
                    isOpen={isOpen}
                    onClose={onClose}
                    onImported={onImported}
                    onOpenSetlist={onOpenSetlist}
                />
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
            content: <PCOSettingsPanel />,
        },
    ];

    return <TabbedModal isOpen={isOpen} onClose={onClose} title="Planning Center" tabs={tabs} defaultTab={defaultTab} />;
}
