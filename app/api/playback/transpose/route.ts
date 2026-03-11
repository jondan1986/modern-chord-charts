import { NextRequest, NextResponse } from 'next/server';
import { getSession, broadcastToSession } from '@/src/services/playback/session-store';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, songIndex, transposeSteps } = await request.json();

    if (!sessionId || songIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session state
    session.transposeByIndex[songIndex] = transposeSteps;

    // Broadcast to all players
    broadcastToSession(sessionId, {
      type: 'key_change',
      data: { songIndex, transposeSteps },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
