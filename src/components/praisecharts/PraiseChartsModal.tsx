"use client";

import React from 'react';
import { TabbedModal } from '@/src/components/ui/TabbedModal';
import { PraiseChartsSearchContent } from '@/src/components/praisecharts/PraiseChartsSearchModal';
import { PraiseChartsSettingsPanel } from '@/src/components/praisecharts/PraiseChartsSettingsPanel';

interface PraiseChartsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: (localId: string) => void;
    defaultTab?: string;
}

export function PraiseChartsModal({ isOpen, onClose, onImported, defaultTab }: PraiseChartsModalProps) {
    const tabs = [
        {
            id: 'search',
            label: 'Search',
            content: (
                <PraiseChartsSearchContent
                    isOpen={isOpen}
                    onClose={onClose}
                    onImported={onImported}
                />
            ),
        },
        {
            id: 'settings',
            label: 'Settings',
            content: <PraiseChartsSettingsPanel />,
        },
    ];

    return <TabbedModal isOpen={isOpen} onClose={onClose} title="PraiseCharts" tabs={tabs} defaultTab={defaultTab} />;
}
