import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  getSession,
  getAllSessions,
  deleteSession,
  broadcastToSession,
  generateRoomCode,
  type PlaybackSession,
} from './session-store';

function makeSession(overrides: Partial<PlaybackSession> = {}): PlaybackSession {
  return {
    id: overrides.id ?? 'TEST01',
    name: 'Test Session',
    passwordHash: null,
    hostId: 'host-1',
    setlistId: 'sl-1',
    setlistTitle: 'Test Setlist',
    setlistSongIds: ['song-1'],
    songs: [],
    currentSongIndex: 0,
    arrangementIndex: 0,
    transposeByIndex: [0],
    position: { state: 'stopped', sectionIndex: 0, beat: 0, timestamp: Date.now() },
    clients: new Set(),
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('session-store', () => {
  beforeEach(() => {
    // Clean up any existing sessions
    for (const s of getAllSessions()) {
      deleteSession(s.id);
    }
  });

  it('creates and retrieves a session', () => {
    const session = makeSession({ id: 'ABC123' });
    createSession(session);
    expect(getSession('ABC123')).toBe(session);
  });

  it('lists all sessions', () => {
    createSession(makeSession({ id: 'S1' }));
    createSession(makeSession({ id: 'S2' }));
    expect(getAllSessions().length).toBe(2);
  });

  it('deletes a session', () => {
    createSession(makeSession({ id: 'DEL1' }));
    expect(getSession('DEL1')).toBeDefined();
    deleteSession('DEL1');
    expect(getSession('DEL1')).toBeUndefined();
  });

  it('returns undefined for non-existent session', () => {
    expect(getSession('NOPE')).toBeUndefined();
  });

  it('generates unique room codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBe(50);
  });

  it('room codes are 6 chars alphanumeric', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z2-9]+$/);
    }
  });

  it('broadcasts to session clients', () => {
    const session = makeSession({ id: 'BC1' });
    const chunks: Uint8Array[] = [];
    const mockController = {
      enqueue: (chunk: Uint8Array) => chunks.push(chunk),
      close: () => {},
    } as unknown as ReadableStreamDefaultController;
    session.clients.add(mockController);
    createSession(session);

    broadcastToSession('BC1', {
      type: 'position',
      data: { state: 'playing', sectionIndex: 1, beat: 3, timestamp: 123 },
    });

    expect(chunks.length).toBe(1);
    const text = new TextDecoder().decode(chunks[0]);
    expect(text).toContain('"type":"position"');
    expect(text).toContain('"sectionIndex":1');
  });

  it('removes dead clients on broadcast', () => {
    const session = makeSession({ id: 'DC1' });
    const badController = {
      enqueue: () => { throw new Error('dead'); },
      close: () => {},
    } as unknown as ReadableStreamDefaultController;
    session.clients.add(badController);
    createSession(session);

    broadcastToSession('DC1', {
      type: 'position',
      data: { state: 'stopped', sectionIndex: 0, beat: 0, timestamp: 0 },
    });

    expect(session.clients.size).toBe(0);
  });
});
