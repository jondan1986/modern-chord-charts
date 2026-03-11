'use client';

import { usePlaybackStore } from '@/src/state/playback-store';

export default function ArrangementScrubber() {
  const resolvedSections = usePlaybackStore(s => s.resolvedSections);
  const currentSectionIndex = usePlaybackStore(s => s.currentSectionIndex);
  const currentBeat = usePlaybackStore(s => s.currentBeat);
  const beatsPerMeasure = usePlaybackStore(s => s.beatsPerMeasure);
  const jumpToSection = usePlaybackStore(s => s.jumpToSection);
  const _getBarsForSection = usePlaybackStore(s => s._getBarsForSection);
  const mode = usePlaybackStore(s => s.mode);

  if (resolvedSections.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {resolvedSections.map((section, idx) => {
        const isActive = idx === currentSectionIndex;
        const totalBeats = _getBarsForSection(section) * beatsPerMeasure;
        const progress = isActive ? Math.min(currentBeat / totalBeats, 1) : idx < currentSectionIndex ? 1 : 0;

        return (
          <button
            key={`${section.id}-${idx}`}
            onClick={() => mode === 'master' && jumpToSection(idx)}
            className={`relative px-3 py-2 rounded-lg text-xs font-semibold uppercase overflow-hidden transition-all ${
              isActive
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : idx < currentSectionIndex
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${mode === 'master' ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={mode !== 'master'}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-0 bg-blue-200 dark:bg-blue-800/40 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
            <span className="relative z-10">{section.label}</span>
            {section.bars && (
              <span className="relative z-10 ml-1 opacity-60">{section.bars}b</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
