// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use server";

import db from '@/src/lib/db';

export interface FileSong {
  id: string;
  title: string;
  artist: string;
  yaml: string;
  updatedAt: number;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
}

export async function listSongs(): Promise<FileSong[]> {
  const rows = db.prepare(
    'SELECT id, title, artist, yaml, updated_at FROM songs ORDER BY updated_at DESC'
  ).all() as { id: string; title: string; artist: string; yaml: string; updated_at: number }[];

  return rows.map(r => ({
    id: r.id,
    title: r.title,
    artist: r.artist ?? 'Unknown',
    yaml: r.yaml,
    updatedAt: r.updated_at * 1000,
  }));
}

export async function getSongFile(id: string): Promise<FileSong | undefined> {
  const row = db.prepare(
    'SELECT id, title, artist, yaml, updated_at FROM songs WHERE id = ?'
  ).get(id) as { id: string; title: string; artist: string; yaml: string; updated_at: number } | undefined;

  if (!row) return undefined;
  return {
    id: row.id,
    title: row.title,
    artist: row.artist ?? 'Unknown',
    yaml: row.yaml,
    updatedAt: row.updated_at * 1000,
  };
}

export async function saveSongFile(yaml: string, originalId?: string): Promise<string> {
  const title = yaml.match(/title:\s*"([^"]+)"/)?.[1] ?? 'Untitled';
  const artist = yaml.match(/artist:\s*"([^"]+)"/)?.[1] ?? 'Unknown';
  const safeTitle = sanitizeFilename(title) || 'Untitled';

  let newId = `${safeTitle}.mcs`;

  // Resolve collisions only when the id would change
  if (newId !== originalId) {
    let candidate = newId;
    let suffix = 1;
    while (db.prepare('SELECT id FROM songs WHERE id = ?').get(candidate)) {
      candidate = `${safeTitle}_${suffix}.mcs`;
      suffix++;
    }
    newId = candidate;
  }

  const now = Math.floor(Date.now() / 1000);

  if (originalId && originalId !== newId) {
    // Title changed — remove old row and insert fresh
    db.prepare('DELETE FROM songs WHERE id = ?').run(originalId);
  }

  db.prepare(
    'INSERT OR REPLACE INTO songs (id, title, artist, yaml, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(newId, title, artist, yaml, now);

  return newId;
}

export async function deleteSongFile(id: string): Promise<void> {
  db.prepare('DELETE FROM songs WHERE id = ?').run(id);
}

// --- Setlists ---

export interface FileSetlist {
  id: string;
  name: string;
  songIds: string[];
  updatedAt: number;
}

export async function listSetlists(): Promise<FileSetlist[]> {
  const rows = db.prepare(
    'SELECT id, name, song_ids, updated_at FROM setlists ORDER BY updated_at DESC'
  ).all() as { id: string; name: string; song_ids: string; updated_at: number }[];

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    songIds: JSON.parse(r.song_ids) as string[],
    updatedAt: r.updated_at * 1000,
  }));
}

export async function getSetlistFile(id: string): Promise<FileSetlist | undefined> {
  const row = db.prepare(
    'SELECT id, name, song_ids, updated_at FROM setlists WHERE id = ?'
  ).get(id) as { id: string; name: string; song_ids: string; updated_at: number } | undefined;

  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    songIds: JSON.parse(row.song_ids) as string[],
    updatedAt: row.updated_at * 1000,
  };
}

export async function saveSetlistFile(
  id: string,
  name: string,
  songIds: string[]
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    'INSERT OR REPLACE INTO setlists (id, name, song_ids, updated_at) VALUES (?, ?, ?, ?)'
  ).run(id, name, JSON.stringify(songIds), now);
  return id;
}

export async function deleteSetlistFile(id: string): Promise<void> {
  db.prepare('DELETE FROM setlists WHERE id = ?').run(id);
}
