import { NextRequest, NextResponse } from 'next/server';
import { getSession, broadcastToSession } from '@/src/services/playback/session-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, type } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (type === 'position') {
      session.position = body.position;
      broadcastToSession(sessionId, { type: 'position', data: body.position });
    } else if (type === 'song_change') {
      session.currentSongIndex = body.songIndex;
      session.arrangementIndex = body.arrangementIndex;
      broadcastToSession(sessionId, {
        type: 'song_change',
        data: {
          songIndex: body.songIndex,
          song: body.song,
          arrangementIndex: body.arrangementIndex,
          transposeSteps: body.transposeSteps ?? 0,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
