// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use server";

import db from '@/src/lib/db';
import { PCOClient } from '@/src/services/pco/client';
import { convertPCOToMCS, detectFormat } from '@/src/services/pco/converter';
import { saveSongFile, saveSetlistFile } from '@/src/actions/file-storage';
import type {
  PCOServiceType,
  PCOPlan,
  PCOItem,
  PCOSong,
  PCOArrangement,
  PCOSection,
  ImportResult,
  ImportSongResult,
  ExportResult,
} from '@/src/services/pco/types';

function ensurePCOSettingsTable(): void {
  db.exec('CREATE TABLE IF NOT EXISTS pco_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
}

function getCredentials(): { appId: string; secret: string } | null {
  const envAppId = process.env.PCO_APP_ID;
  const envSecret = process.env.PCO_SECRET;
  if (envAppId && envSecret) {
    return { appId: envAppId, secret: envSecret };
  }

  try {
    ensurePCOSettingsTable();
    const dbAppId = (db.prepare("SELECT value FROM pco_settings WHERE key = 'pco_app_id'").get() as { value: string } | undefined)?.value;
    const dbSecret = (db.prepare("SELECT value FROM pco_settings WHERE key = 'pco_secret'").get() as { value: string } | undefined)?.value;
    if (dbAppId && dbSecret) {
      return { appId: dbAppId, secret: dbSecret };
    }
  } catch {
    // Table doesn't exist yet — that's fine, no DB credentials
  }

  return null;
}

function getClient(): PCOClient {
  const creds = getCredentials();
  if (!creds) throw new Error('PCO credentials not configured');
  return new PCOClient(creds.appId, creds.secret);
}

export async function getPCOCredentials(): Promise<{ configured: boolean }> {
  return { configured: getCredentials() !== null };
}

export async function savePCOCredentials(appId: string, secret: string): Promise<void> {
  ensurePCOSettingsTable();
  db.prepare(
    "INSERT OR REPLACE INTO pco_settings (key, value) VALUES ('pco_app_id', ?)"
  ).run(appId);
  db.prepare(
    "INSERT OR REPLACE INTO pco_settings (key, value) VALUES ('pco_secret', ?)"
  ).run(secret);
}

export async function testPCOConnection(): Promise<{ ok: boolean; songCount?: number; error?: string }> {
  try {
    const client = getClient();
    const result = await client.fetchSongs(0, 1);
    return { ok: true, songCount: result.total };
  } catch (err: any) {
    return { ok: false, error: err.message ?? 'Unknown error' };
  }
}

export async function fetchServiceTypes(): Promise<PCOServiceType[]> {
  const client = getClient();
  return client.fetchServiceTypes();
}

export async function fetchPlans(
  serviceTypeId: string,
  filter: 'future' | 'past' = 'future'
): Promise<PCOPlan[]> {
  const client = getClient();
  return client.fetchPlans(serviceTypeId, filter);
}

export async function fetchPlanItems(
  serviceTypeId: string,
  planId: string
): Promise<PCOItem[]> {
  const client = getClient();
  return client.fetchPlanItems(serviceTypeId, planId);
}

export async function fetchSongs(
  offset = 0,
  perPage = 25
): Promise<{ songs: PCOSong[]; total: number }> {
  const client = getClient();
  return client.fetchSongs(offset, perPage);
}

export async function fetchArrangements(songId: string): Promise<PCOArrangement[]> {
  const client = getClient();
  return client.fetchArrangements(songId);
}

export async function fetchArrangementSections(
  songId: string,
  arrangementId: string
): Promise<PCOSection[]> {
  const client = getClient();
  return client.fetchArrangementSections(songId, arrangementId);
}

async function convertAndSaveSong(
  item: PCOItem,
  client: PCOClient
): Promise<ImportSongResult> {
  const { song, arrangement } = item;
  if (!song || !arrangement) {
    return { title: item.title, localId: '', status: 'error', error: 'Missing song or arrangement data' };
  }

  try {
    const format = detectFormat(arrangement);
    let sections: PCOSection[] | undefined;

    if (format === 'lyrics_only') {
      sections = await client.fetchArrangementSections(song.id, arrangement.id);
    }

    const yaml = convertPCOToMCS(arrangement, song, item.key_name ?? undefined, sections);
    const localId = await saveSongFile(yaml);

    const status = format === 'empty' ? 'empty' : format === 'lyrics_only' ? 'lyrics_only' : 'imported';
    return { title: song.title, localId, status };
  } catch (err: any) {
    return { title: song.title, localId: '', status: 'error', error: err.message };
  }
}

export async function importSingleSong(
  songId: string,
  arrangementId: string,
  keyName?: string
): Promise<{ localId: string; status: string }> {
  const client = getClient();
  const arrangements = await client.fetchArrangements(songId);
  const arrangement = arrangements.find(a => a.id === arrangementId);
  if (!arrangement) throw new Error(`Arrangement ${arrangementId} not found`);

  const { songs } = await client.fetchSongs(0, 1);
  // Fetch the specific song — use the songs endpoint with the arrangement's parent
  const songsRes = await client.get<any>(`/songs/${songId}`);
  const songAttrs = songsRes.data.attributes;
  const song: PCOSong = {
    id: songId,
    title: songAttrs.title,
    author: songAttrs.author,
    ccli_number: songAttrs.ccli_number ?? null,
    copyright: songAttrs.copyright ?? null,
    themes: songAttrs.themes ?? null,
  };

  const format = detectFormat(arrangement);
  let sections: PCOSection[] | undefined;
  if (format === 'lyrics_only') {
    sections = await client.fetchArrangementSections(songId, arrangementId);
  }

  const yaml = convertPCOToMCS(arrangement, song, keyName, sections);
  const localId = await saveSongFile(yaml);

  const status = format === 'empty' ? 'empty' : format === 'lyrics_only' ? 'lyrics_only' : 'imported';
  return { localId, status };
}

export async function importPlan(
  serviceTypeId: string,
  planId: string,
  createSetlist: boolean = true,
  planName?: string
): Promise<ImportResult> {
  const client = getClient();
  const items = await client.fetchPlanItems(serviceTypeId, planId);
  const songItems = items.filter(i => i.item_type === 'song');

  const results: ImportSongResult[] = [];
  for (const item of songItems) {
    const result = await convertAndSaveSong(item, client);
    results.push(result);
  }

  let setlistId: string | undefined;
  if (createSetlist) {
    const songIds = results
      .filter(r => r.status !== 'error')
      .map(r => r.localId);

    if (songIds.length > 0) {
      setlistId = `pco-${planId}`;
      const name = planName ?? `PCO Plan ${planId}`;
      await saveSetlistFile(setlistId, name, songIds);
    }
  }

  return { songs: results, setlistId };
}

export async function checkPCOLink(
  localSongYaml: string
): Promise<{ linked: boolean; songId?: string; arrangementId?: string; arrangementName?: string }> {
  const songId = localSongYaml.match(/pco_song_id:\s*"([^"]+)"/)?.[1];
  const arrangementId = localSongYaml.match(/pco_arrangement_id:\s*"([^"]+)"/)?.[1];
  const arrangementName = localSongYaml.match(/pco_arrangement_name:\s*"([^"]+)"/)?.[1];

  if (songId && arrangementId) {
    return { linked: true, songId, arrangementId, arrangementName };
  }
  return { linked: false };
}

export async function exportAsMCSAttachment(
  yaml: string,
  filename: string,
  pcoSongId: string,
  pcoArrangementId: string
): Promise<ExportResult> {
  try {
    const client = getClient();
    const uploadId = await client.uploadFile(yaml, filename);
    const attachmentId = await client.createAttachment(
      pcoSongId,
      pcoArrangementId,
      filename,
      uploadId
    );
    return { success: true, attachmentId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function exportAsChordChart(
  chordProContent: string,
  pcoSongId: string,
  pcoArrangementId: string
): Promise<ExportResult> {
  try {
    const client = getClient();
    await client.updateChordChart(pcoSongId, pcoArrangementId, chordProContent);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
