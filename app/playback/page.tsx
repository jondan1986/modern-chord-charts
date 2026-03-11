'use client';

import { useState } from 'react';
import { usePlaybackStore } from '@/src/state/playback-store';
import MasterView from '@/src/components/playback/MasterView';
import PlayerView from '@/src/components/playback/PlayerView';
import SessionSetupDialog from '@/src/components/playback/SessionSetupDialog';
import ActiveSessionsList from '@/src/components/playback/ActiveSessionsList';

export default function PlaybackPage() {
  const mode = usePlaybackStore(s => s.mode);
  const joinSession = usePlaybackStore(s => s.joinSession);
  const [selectedMode, setSelectedMode] = useState<'master' | 'player' | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Active session — show the appropriate view
  if (mode === 'master') return <MasterView />;
  if (mode === 'player') return <PlayerView />;

  async function handleJoin(roomCode: string, password?: string) {
    setJoinError(null);
    const success = await joinSession(roomCode, password);
    if (!success) {
      setJoinError('Failed to join session. Check the room code and password.');
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Playback Sync</h1>

      {!selectedMode ? (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            Sync your band with a shared click track and live section highlighting.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedMode('master')}
              className="p-6 border-2 border-dashed rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition group"
            >
              <div className="text-3xl mb-2">🎛️</div>
              <div className="font-bold text-lg">Start as Master</div>
              <div className="text-sm text-gray-500 mt-1">Run the click track and control navigation</div>
            </button>

            <button
              onClick={() => setSelectedMode('player')}
              className="p-6 border-2 border-dashed rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
            >
              <div className="text-3xl mb-2">🎸</div>
              <div className="font-bold text-lg">Join as Player</div>
              <div className="text-sm text-gray-500 mt-1">Follow along with highlighted sections</div>
            </button>
          </div>
        </div>
      ) : selectedMode === 'master' ? (
        <div>
          <button
            onClick={() => setSelectedMode(null)}
            className="text-sm text-blue-600 hover:text-blue-500 mb-4"
          >
            ← Back
          </button>
          <SessionSetupDialog />
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedMode(null)}
            className="text-sm text-blue-600 hover:text-blue-500 mb-4"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold mb-4">Join a Session</h2>
          {joinError && <p className="text-red-500 text-sm mb-3">{joinError}</p>}
          <ActiveSessionsList onJoin={handleJoin} />
        </div>
      )}
    </div>
  );
}
