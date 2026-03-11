'use client';

import { useRef, useEffect } from 'react';
import { usePlaybackStore } from '@/src/state/playback-store';
import { useAppStore } from '@/src/state/store';
import { SongViewer } from '@/src/components/viewer/SongViewer';
import { getTargetKey } from '@/src/mcs-core/transpose';

export default function PlayerView() {
  const roomCode = usePlaybackStore(s => s.roomCode);
  const playbackSong = usePlaybackStore(s => s.playbackSong);
  const currentSectionIndex = usePlaybackStore(s => s.currentSectionIndex);
  const currentSongIndex = usePlaybackStore(s => s.currentSongIndex);
  const setlistSongs = usePlaybackStore(s => s.setlistSongs);
  const playbackState = usePlaybackStore(s => s.playbackState);
  const leaveSession = usePlaybackStore(s => s.leaveSession);
  const currentTransposeSteps = usePlaybackStore(s => s.currentTransposeSteps);
  const theme = useAppStore(s => s.theme);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSectionRef = useRef(currentSectionIndex);

  // Auto-scroll when section changes
  useEffect(() => {
    if (currentSectionIndex !== lastSectionRef.current) {
      lastSectionRef.current = currentSectionIndex;
      // Find the highlighted section element and scroll to it
      const container = scrollContainerRef.current;
      if (container) {
        const sections = container.querySelectorAll('[data-section-index]');
        const target = sections[currentSectionIndex];
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentSectionIndex]);

  if (!playbackSong) return null;

  const originalKey = playbackSong.metadata.key || 'C';
  const displayKey = currentTransposeSteps !== 0
    ? `${originalKey} → ${getTargetKey(originalKey, currentTransposeSteps)}`
    : originalKey;

  const stateLabel = playbackState === 'playing' ? 'Playing' : playbackState === 'paused' ? 'Paused' : 'Stopped';
  const stateColor = playbackState === 'playing' ? 'text-green-500' : playbackState === 'paused' ? 'text-yellow-500' : 'text-gray-500';

  return (
    <div className="flex flex-col h-full">
      {/* Player header */}
      <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Room: <span className="font-mono font-bold">{roomCode}</span></span>
          <span className={`text-xs font-bold uppercase ${stateColor}`}>{stateLabel}</span>
          <span className="text-xs text-gray-500">
            Song {currentSongIndex + 1}/{setlistSongs.length}: <span className="font-medium">{playbackSong.metadata.title}</span>
          </span>
          <span className="text-xs text-gray-500">Key: <span className="font-medium">{displayKey}</span></span>
        </div>
        <button
          onClick={leaveSession}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Leave
        </button>
      </div>

      {/* Song viewer with auto-scroll */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <SongViewer
          song={playbackSong}
          theme={theme}
          highlightedSectionIndex={currentSectionIndex}
          externalTransposeSteps={currentTransposeSteps}
          forceSingleColumn
        />
      </div>
    </div>
  );
}
