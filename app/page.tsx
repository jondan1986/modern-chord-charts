
"use client";

import React, { useEffect, useState } from "react";
import { songStorage, StoredSong, StoredSetlist } from "@/src/services/storage";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";
import { SongList } from "@/src/components/library/SongList";
import { SetlistList } from "@/src/components/library/SetlistList";
import { ImportModal } from "@/src/components/library/ImportModal";
import { ExportModal } from "@/src/components/library/ExportModal";
import { SongSelectModal } from "@/src/components/library/SongSelectModal";
import { PlanningCenterModal } from "@/src/components/pco/PlanningCenterModal";
import { PraiseChartsModal } from "@/src/components/praisecharts/PraiseChartsModal";

export default function LibraryPage() {
    const [songs, setSongs] = useState<StoredSong[]>([]);
    const [setlists, setSetlists] = useState<StoredSetlist[]>([]);
    const [activeTab, setActiveTab] = useState<'songs' | 'setlists'>('songs');

    const loadSong = useAppStore((state) => state.loadSong);
    const theme = useAppStore((state) => state.theme);
    const selectedSongId = useAppStore((state) => state.selectedSongId);
    const selectedSetlistId = useAppStore((state) => state.selectedSetlistId);
    const setSelectedSongId = useAppStore((state) => state.setSelectedSongId);
    const setSelectedSetlistId = useAppStore((state) => state.setSelectedSetlistId);

    const showImportModal = useAppStore((state) => state.showImportModal);
    const showExportModal = useAppStore((state) => state.showExportModal);
    const showPlanningCenterModal = useAppStore((state) => state.showPlanningCenterModal);
    const showPlanningCenterDefaultTab = useAppStore((state) => state.showPlanningCenterDefaultTab);
    const showPraiseChartsModal = useAppStore((state) => state.showPraiseChartsModal);
    const showPraiseChartsDefaultTab = useAppStore((state) => state.showPraiseChartsDefaultTab);
    const showSongSelectModal = useAppStore((state) => state.showSongSelectModal);
    const setShowImportModal = useAppStore((state) => state.setShowImportModal);
    const setShowExportModal = useAppStore((state) => state.setShowExportModal);
    const setShowPlanningCenterModal = useAppStore((state) => state.setShowPlanningCenterModal);
    const setShowPraiseChartsModal = useAppStore((state) => state.setShowPraiseChartsModal);
    const setShowSongSelectModal = useAppStore((state) => state.setShowSongSelectModal);

    const router = useRouter();

    const loadLibrary = async () => {
        const allSongs = await songStorage.getAllSongs();
        setSongs(allSongs.sort((a, b) => b.updatedAt - a.updatedAt));

        const allSetlists = await songStorage.getAllSetlists();
        setSetlists(allSetlists.sort((a, b) => b.updatedAt - a.updatedAt));
    };

    useEffect(() => {
        loadLibrary();
    }, []);

    // --- Song Handlers ---
    const handleOpenSong = async (id: string) => {
        await loadSong(id);
        router.push("/viewer");
    };

    // --- Setlist Handlers ---
    const handleCreateSetlist = async () => {
        const name = prompt("Enter setlist name:");
        if (name) {
            await songStorage.saveSetlist({ title: name });
            loadLibrary();
        }
    };

    const handleOpenSetlist = (id: string) => {
        router.push(`/setlist/${id}`);
    };

    const handleSwitchTab = (tab: 'songs' | 'setlists') => {
        setActiveTab(tab);
        setSelectedSongId(null);
        setSelectedSetlistId(null);
    };

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setSelectedSongId(null);
            setSelectedSetlistId(null);
        }
    };

    const pageStyle = { backgroundColor: theme.colors.background, color: theme.colors.text_primary };
    const headerStyle = { borderColor: theme.colors.section_header };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full overflow-y-auto" style={pageStyle} onClick={handleContainerClick}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4" style={headerStyle}>
                <h1 className="text-3xl font-bold">Library</h1>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSwitchTab('songs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'songs' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                        Songs ({songs.length})
                    </button>
                    <button
                        onClick={() => handleSwitchTab('setlists')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'setlists' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                        Setlists ({setlists.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'songs' ? (
                <SongList
                    songs={songs}
                    theme={theme}
                    selectedId={selectedSongId}
                    onSelect={setSelectedSongId}
                    onOpen={handleOpenSong}
                />
            ) : (
                <SetlistList
                    setlists={setlists}
                    theme={theme}
                    selectedId={selectedSetlistId}
                    onSelect={setSelectedSetlistId}
                    onOpen={handleOpenSetlist}
                    onCreate={handleCreateSetlist}
                />
            )}

            {/* Consolidated Modals */}
            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImported={loadLibrary}
            />
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />
            <PlanningCenterModal
                isOpen={showPlanningCenterModal}
                onClose={() => setShowPlanningCenterModal(false)}
                onImported={loadLibrary}
                onOpenSetlist={(id) => router.push(`/setlist/${id}`)}
                defaultTab={showPlanningCenterDefaultTab}
            />
            <PraiseChartsModal
                isOpen={showPraiseChartsModal}
                onClose={() => setShowPraiseChartsModal(false)}
                onImported={async (localId) => {
                    await loadSong(localId);
                    router.push("/editor");
                }}
                defaultTab={showPraiseChartsDefaultTab}
            />
            <SongSelectModal
                isOpen={showSongSelectModal}
                onClose={() => setShowSongSelectModal(false)}
            />
        </div>
    );
}
