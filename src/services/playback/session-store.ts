// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

/**
 * Server-side in-memory session store for playback sync.
 * Stores active PlaybackSessions keyed by room code.
 */

import { Song } from '@/mcs-core/model';

export interface PlaybackPosition {
  state: 'stopped' | 'playing' | 'paused';
  sectionIndex: number;
  beat: number;
  timestamp: number;
}

export interface PlaybackSession {
  id: string;
  name: string;
  passwordHash: string | null;
  hostId: string;
  setlistId: string;
  setlistTitle: string;
  setlistSongIds: string[];
  songs: Song[];
  currentSongIndex: number;
  arrangementIndex: number;
  transposeByIndex: number[];
  position: PlaybackPosition;
  clients: Set<ReadableStreamDefaultController>;
  createdAt: number;
}

export type SSEEvent =
  | { type: 'position'; data: PlaybackPosition }
  | { type: 'song_change'; data: { songIndex: number; song: Song; arrangementIndex: number; transposeSteps: number } }
  | { type: 'key_change'; data: { songIndex: number; transposeSteps: number } };

// Global singleton (survives HMR in dev via globalThis)
declare global {
  var __playbackSessions: Map<string, PlaybackSession> | undefined;
}

const sessions: Map<string, PlaybackSession> =
  globalThis.__playbackSessions ??= new Map();

export function getAllSessions(): PlaybackSession[] {
  // Clean expired sessions (4 hour TTL)
  const now = Date.now();
  const TTL = 4 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL) {
      // Close all client connections
      for (const controller of session.clients) {
        try { controller.close(); } catch { /* ignore */ }
      }
      sessions.delete(id);
    }
  }
  return Array.from(sessions.values());
}

export function getSession(id: string): PlaybackSession | undefined {
  return sessions.get(id);
}

export function createSession(session: PlaybackSession): void {
  sessions.set(session.id, session);
}

export function deleteSession(id: string): void {
  const session = sessions.get(id);
  if (session) {
    for (const controller of session.clients) {
      try { controller.close(); } catch { /* ignore */ }
    }
    sessions.delete(id);
  }
}

export function broadcastToSession(sessionId: string, event: SSEEvent): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const data = `data: ${JSON.stringify(event)}\n\n`;
  const deadClients: ReadableStreamDefaultController[] = [];

  for (const controller of session.clients) {
    try {
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      deadClients.push(controller);
    }
  }

  // Remove dead clients
  for (const dead of deadClients) {
    session.clients.delete(dead);
  }
}

function generateRoomCode(): string {
  // 6-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  // Ensure unique
  if (sessions.has(code)) return generateRoomCode();
  return code;
}

export { generateRoomCode };
