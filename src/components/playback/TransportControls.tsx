'use client';

import { usePlaybackStore } from '@/src/state/playback-store';

export default function TransportControls() {
  const playbackState = usePlaybackStore(s => s.playbackState);
  const play = usePlaybackStore(s => s.play);
  const pause = usePlaybackStore(s => s.pause);
  const stop = usePlaybackStore(s => s.stop);
  const tempo = usePlaybackStore(s => s.tempo);
  const setTempo = usePlaybackStore(s => s.setTempo);
  const clickEnabled = usePlaybackStore(s => s.clickEnabled);
  const toggleClick = usePlaybackStore(s => s.toggleClick);
  const announceSections = usePlaybackStore(s => s.announceSections);
  const toggleAnnounce = usePlaybackStore(s => s.toggleAnnounce);
  const currentBeat = usePlaybackStore(s => s.currentBeat);
  const totalBeatsInSection = usePlaybackStore(s => s.totalBeatsInSection);
  const currentSectionIndex = usePlaybackStore(s => s.currentSectionIndex);
  const resolvedSections = usePlaybackStore(s => s.resolvedSections);
  const beatsPerMeasure = usePlaybackStore(s => s.beatsPerMeasure);

  const currentMeasureInSection = Math.ceil(currentBeat / beatsPerMeasure) || 0;
  const totalMeasures = Math.ceil(totalBeatsInSection / beatsPerMeasure) || 0;
  const beatInMeasure = currentBeat > 0 ? ((currentBeat - 1) % beatsPerMeasure) + 1 : 0;

  const btnBase = 'px-4 py-2 rounded-lg font-bold text-sm transition-colors';

  return (
    <div className="flex flex-col gap-3">
      {/* Main transport buttons */}
      <div className="flex items-center gap-3">
        {playbackState === 'playing' ? (
          <button onClick={pause} className={`${btnBase} bg-yellow-500 hover:bg-yellow-400 text-white`}>
            Pause
          </button>
        ) : (
          <button onClick={play} className={`${btnBase} bg-green-600 hover:bg-green-500 text-white`}>
            {playbackState === 'paused' ? 'Resume' : 'Play'}
          </button>
        )}
        <button
          onClick={stop}
          className={`${btnBase} bg-red-600 hover:bg-red-500 text-white`}
          disabled={playbackState === 'stopped'}
        >
          Stop
        </button>

        {/* Beat counter */}
        <div className="ml-4 px-3 py-1.5 bg-gray-900 text-green-400 font-mono text-sm rounded-lg min-w-[200px] text-center">
          Section {currentSectionIndex + 1}/{resolvedSections.length}
          {' | '}
          Bar {currentMeasureInSection}/{totalMeasures}
          {' | '}
          Beat {beatInMeasure}/{beatsPerMeasure}
        </div>
      </div>

      {/* Settings row */}
      <div className="flex items-center gap-4 text-sm">
        {/* Tempo */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Tempo:</span>
          <button onClick={() => setTempo(Math.max(40, tempo - 5))} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">-</button>
          <span className="font-mono font-bold w-12 text-center">{tempo}</span>
          <button onClick={() => setTempo(Math.min(300, tempo + 5))} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
          <span className="text-gray-400">bpm</span>
        </div>

        {/* Click toggle */}
        <button
          onClick={toggleClick}
          className={`px-3 py-1 rounded-lg text-sm font-medium ${clickEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
        >
          Click {clickEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Announce toggle */}
        <button
          onClick={toggleAnnounce}
          className={`px-3 py-1 rounded-lg text-sm font-medium ${announceSections ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
        >
          Announce {announceSections ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
