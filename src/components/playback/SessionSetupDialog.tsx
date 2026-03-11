'use client';

import { useState, useEffect } from 'react';
import { songStorage, StoredSetlist, StoredSong } from '@/src/services/storage';
import { MCSParser } from '@/src/mcs-core/parser';
import { usePlaybackStore } from '@/src/state/playback-store';

export default function SessionSetupDialog() {
  const [setlists, setSetlists] = useState<StoredSetlist[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<StoredSetlist | null>(null);
  const [songs, setSongs] = useState<StoredSong[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initMaster = usePlaybackStore(s => s.initMaster);

  async function loadSetlists() {
    try {
      const list = await songStorage.getAllSetlists();
      setSetlists(list);
      if (list.length > 0) {
        selectSetlist(list[0]);
      }
    } catch {
      setError('Failed to load setlists');
    }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSetlists(); }, []);

  async function selectSetlist(setlist: StoredSetlist) {
    setSelectedSetlist(setlist);
    setSessionName(setlist.title);
    // Load songs
    const songList: StoredSong[] = [];
    for (const songId of setlist.songs) {
      const song = await songStorage.getSong(songId);
      if (song) songList.push(song);
    }
    setSongs(songList);
  }

  async function handleStart() {
    if (!selectedSetlist || songs.length === 0) return;
    setStarting(true);
    setError(null);

    try {
      const parsedSongs = songs.map(s => MCSParser.parse(s.yaml));
      await initMaster(
        selectedSetlist.id,
        selectedSetlist.title,
        selectedSetlist.songs,
        parsedSongs,
        sessionName || selectedSetlist.title,
        password
      );
    } catch (err) {
      setError('Failed to start session: ' + (err instanceof Error ? err.message : String(err)));
      setStarting(false);
    }
  }

  if (loading) return <p className="text-gray-400">Loading setlists...</p>;

  return (
    <div className="space-y-5 max-w-lg">
      <h2 className="text-xl font-bold">Start Playback Session</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {setlists.length === 0 ? (
        <p className="text-gray-500">No setlists found. Create a setlist in the Library first.</p>
      ) : (
        <>
          {/* Setlist selector */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Setlist</label>
            <select
              value={selectedSetlist?.id || ''}
              onChange={e => {
                const s = setlists.find(sl => sl.id === e.target.value);
                if (s) selectSetlist(s);
              }}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              {setlists.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.songs.length} songs)</option>
              ))}
            </select>
          </div>

          {/* Song list preview */}
          {songs.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Songs in setlist</label>
              <div className="border rounded-lg dark:border-gray-700 divide-y dark:divide-gray-700 max-h-48 overflow-y-auto">
                {songs.map((song, idx) => (
                  <div key={song.id} className="px-3 py-2 text-sm flex items-center gap-2">
                    <span className="text-gray-400 w-6 text-right">{idx + 1}.</span>
                    <span className="font-medium">{song.title}</span>
                    <span className="text-gray-500">- {song.artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Session Name</label>
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="e.g. Sunday Worship"
            />
          </div>

          {/* Password (optional) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">Password (optional)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              placeholder="Leave empty for open session"
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={starting || songs.length === 0}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-500 disabled:opacity-50 transition"
          >
            {starting ? 'Starting...' : 'Start Session'}
          </button>
        </>
      )}
    </div>
  );
}
