import { NextResponse } from 'next/server';
import { getAllSessions } from '@/src/services/playback/session-store';

export async function GET() {
  const sessions = getAllSessions();

  const publicList = sessions.map(s => ({
    id: s.id,
    name: s.name,
    setlistTitle: s.setlistTitle,
    hasPassword: s.passwordHash !== null,
    playerCount: s.clients.size,
    songCount: s.songs.length,
    currentSongIndex: s.currentSongIndex,
  }));

  return NextResponse.json(publicList);
}
