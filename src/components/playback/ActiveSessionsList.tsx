'use client';

import { useState, useEffect } from 'react';

interface SessionInfo {
  id: string;
  name: string;
  setlistTitle: string;
  hasPassword: boolean;
  playerCount: number;
  songCount: number;
}

interface Props {
  onJoin: (roomCode: string, password?: string) => void;
}

export default function ActiveSessionsList({ onJoin }: Props) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordPrompt, setPasswordPrompt] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  async function fetchSessions() {
    try {
      const res = await fetch('/api/playback/sessions');
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleJoinClick(session: SessionInfo) {
    if (session.hasPassword) {
      setPasswordPrompt(session.id);
      setPassword('');
      setError(null);
    } else {
      onJoin(session.id);
    }
  }

  function handlePasswordSubmit() {
    if (passwordPrompt) {
      onJoin(passwordPrompt, password);
      setPasswordPrompt(null);
    }
  }

  function handleManualJoin() {
    const code = manualCode.trim().toUpperCase();
    if (code.length >= 4) {
      onJoin(code);
    }
  }

  return (
    <div className="space-y-4">
      {/* Manual room code entry */}
      <div className="flex gap-2">
        <input
          type="text"
          value={manualCode}
          onChange={e => setManualCode(e.target.value.toUpperCase())}
          placeholder="Enter room code..."
          className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono uppercase dark:bg-gray-800 dark:border-gray-600"
          maxLength={6}
        />
        <button
          onClick={handleManualJoin}
          disabled={manualCode.trim().length < 4}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
        >
          Join
        </button>
      </div>

      {/* Active sessions list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Active Sessions</h3>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No active sessions. Ask the worship leader to start one.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <div className="font-medium text-sm">{session.name}</div>
                  <div className="text-xs text-gray-500">
                    {session.setlistTitle} - {session.songCount} songs - {session.playerCount} connected
                    {session.hasPassword && ' - Password required'}
                  </div>
                </div>
                <button
                  onClick={() => handleJoinClick(session)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-500"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password dialog */}
      {passwordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-3">Enter Password</h3>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-3 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Session password"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPasswordPrompt(null)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
