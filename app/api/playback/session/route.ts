import { NextRequest, NextResponse } from 'next/server';
import { createSession, generateRoomCode } from '@/src/services/playback/session-store';
import type { PlaybackSession } from '@/src/services/playback/session-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password, hostId, setlistId, setlistTitle, setlistSongIds, songs } = body;

    if (!name || !hostId || !setlistId || !songs?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomCode = generateRoomCode();

    // Simple hash for password (not crypto-grade, just basic protection)
    let passwordHash: string | null = null;
    if (password) {
      // Use a simple hash since this is ephemeral session data
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const session: PlaybackSession = {
      id: roomCode,
      name,
      passwordHash,
      hostId,
      setlistId,
      setlistTitle: setlistTitle || name,
      setlistSongIds,
      songs,
      currentSongIndex: 0,
      arrangementIndex: 0,
      transposeByIndex: songs.map(() => 0),
      position: {
        state: 'stopped',
        sectionIndex: 0,
        beat: 0,
        timestamp: Date.now(),
      },
      clients: new Set(),
      createdAt: Date.now(),
    };

    createSession(session);

    return NextResponse.json({ roomCode });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
