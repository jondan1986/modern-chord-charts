'use client';

import { usePlaybackStore } from '@/src/state/playback-store';
import { useAppStore } from '@/src/state/store';
import TransportControls from './TransportControls';
import ArrangementScrubber from './ArrangementScrubber';
import { SongViewer } from '@/src/components/viewer/SongViewer';
import { getTargetKey } from '@/src/mcs-core/transpose';

export default function MasterView() {
  const roomCode = usePlaybackStore(s => s.roomCode);
  const playbackSong = usePlaybackStore(s => s.playbackSong);
  const currentSectionIndex = usePlaybackStore(s => s.currentSectionIndex);
  const currentSongIndex = usePlaybackStore(s => s.currentSongIndex);
  const setlistSongs = usePlaybackStore(s => s.setlistSongs);
  const jumpToSong = usePlaybackStore(s => s.jumpToSong);
  const leaveSession = usePlaybackStore(s => s.leaveSession);
  const playerCount = usePlaybackStore(s => s.playerCount);
  const transposeCurrentSong = usePlaybackStore(s => s.transposeCurrentSong);
  const currentTransposeSteps = usePlaybackStore(s => s.currentTransposeSteps);
  const theme = useAppStore(s => s.theme);

  if (!playbackSong) return null;

  const originalKey = playbackSong.metadata.key || 'C';
  const displayKey = currentTransposeSteps !== 0
    ? `${originalKey} → ${getTargetKey(originalKey, currentTransposeSteps)}`
    : originalKey;

  return (
    <div className="flex h-full">
      {/* Sidebar: Setlist songs */}
      <div className="w-56 shrink-0 border-r dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-3 border-b dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Room Code</div>
          <div className="text-2xl font-mono font-bold tracking-widest text-blue-600">{roomCode}</div>
          <div className="text-xs text-gray-500 mt-1">{playerCount} player{playerCount !== 1 ? 's' : ''} connected</div>
        </div>
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1">Setlist</div>
          {setlistSongs.map((song, idx) => (
            <button
              key={idx}
              onClick={() => jumpToSong(idx)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                idx === currentSongIndex
                  ? 'bg-blue-600 text-white font-medium'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-xs opacity-60 mr-1.5">{idx + 1}.</span>
              {song.metadata.title}
            </button>
          ))}
        </div>
        <div className="p-3 border-t dark:border-gray-700">
          <button
            onClick={leaveSession}
            className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Transport + controls header */}
        <div className="p-4 border-b dark:border-gray-700 space-y-3 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <TransportControls />
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-gray-500">Key:</span>
              <button onClick={() => transposeCurrentSong(-1)} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-bold">-</button>
              <span className="font-semibold text-sm min-w-[60px] text-center">{displayKey}</span>
              <button onClick={() => transposeCurrentSong(1)} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-bold">+</button>
            </div>
          </div>
          <ArrangementScrubber />
        </div>

        {/* Song viewer */}
        <div className="flex-1 overflow-y-auto">
          <SongViewer
            song={playbackSong}
            theme={theme}
            highlightedSectionIndex={currentSectionIndex}
            externalTransposeSteps={currentTransposeSteps}
            forceSingleColumn
          />
        </div>
      </div>
    </div>
  );
}
