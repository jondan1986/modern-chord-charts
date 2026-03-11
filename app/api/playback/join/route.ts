import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/src/services/playback/session-store';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, password } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate password
    if (session.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 401 });
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      if (hash !== session.passwordHash) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    const currentSong = session.songs[session.currentSongIndex];

    return NextResponse.json({
      setlistId: session.setlistId,
      setlistTitle: session.setlistTitle,
      setlistSongIds: session.setlistSongIds,
      songs: session.songs,
      currentSongIndex: session.currentSongIndex,
      currentSong,
      arrangementIndex: session.arrangementIndex,
      position: session.position,
      transposeSteps: session.transposeByIndex[session.currentSongIndex] || 0,
      transposeByIndex: session.transposeByIndex,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
