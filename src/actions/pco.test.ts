// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db before importing the module under test
vi.mock('@/src/lib/db', () => ({
  default: { prepare: vi.fn() },
}));

// Mock file-storage actions
vi.mock('@/src/actions/file-storage', () => ({
  saveSongFile: vi.fn(),
  saveSetlistFile: vi.fn(),
}));

import db from '@/src/lib/db';
import { saveSongFile, saveSetlistFile } from '@/src/actions/file-storage';

const mockPrepare = vi.mocked(db.prepare);
const mockSaveSongFile = vi.mocked(saveSongFile);
const mockSaveSetlistFile = vi.mocked(saveSetlistFile);

// Mock fetch for PCOClient
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

import {
  checkPCOLink,
  getPCOCredentials,
  savePCOCredentials,
  testPCOConnection,
  importPlan,
} from './pco';

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.PCO_APP_ID;
  delete process.env.PCO_SECRET;
});

describe('checkPCOLink', () => {
  it('returns linked when pco_song_id and pco_arrangement_id are present', async () => {
    const yaml = `metadata:
  title: "Test"
  artist: "Artist"
  pco_song_id: "5001"
  pco_arrangement_id: "6001"
  pco_arrangement_name: "Original"`;

    const result = await checkPCOLink(yaml);
    expect(result.linked).toBe(true);
    expect(result.songId).toBe('5001');
    expect(result.arrangementId).toBe('6001');
    expect(result.arrangementName).toBe('Original');
  });

  it('returns not linked when PCO metadata is missing', async () => {
    const yaml = `metadata:
  title: "Test"
  artist: "Artist"`;

    const result = await checkPCOLink(yaml);
    expect(result.linked).toBe(false);
    expect(result.songId).toBeUndefined();
  });

  it('returns not linked when only song_id is present without arrangement_id', async () => {
    const yaml = `metadata:
  title: "Test"
  pco_song_id: "5001"`;

    const result = await checkPCOLink(yaml);
    expect(result.linked).toBe(false);
  });
});

describe('getPCOCredentials', () => {
  it('returns configured: true when env vars are set', async () => {
    process.env.PCO_APP_ID = 'env-app-id';
    process.env.PCO_SECRET = 'env-secret';

    const result = await getPCOCredentials();
    expect(result.configured).toBe(true);
  });

  it('returns configured: true when DB has credentials', async () => {
    mockPrepare.mockImplementation((sql: string) => ({
      get: () => {
        if (sql.includes('pco_app_id')) return { value: 'db-app-id' };
        if (sql.includes('pco_secret')) return { value: 'db-secret' };
        return undefined;
      },
    }));

    const result = await getPCOCredentials();
    expect(result.configured).toBe(true);
  });

  it('returns configured: false when no credentials exist', async () => {
    mockPrepare.mockImplementation(() => ({
      get: () => undefined,
    }));

    const result = await getPCOCredentials();
    expect(result.configured).toBe(false);
  });
});

describe('savePCOCredentials', () => {
  it('upserts app_id and secret into pco_settings', async () => {
    const mockRun = vi.fn();
    mockPrepare.mockReturnValue({ run: mockRun });

    await savePCOCredentials('my-app-id', 'my-secret');

    expect(mockPrepare).toHaveBeenCalledTimes(2);
    expect(mockRun).toHaveBeenCalledWith('my-app-id');
    expect(mockRun).toHaveBeenCalledWith('my-secret');
  });
});

describe('testPCOConnection', () => {
  it('returns ok with song count on success', async () => {
    process.env.PCO_APP_ID = 'app-id';
    process.env.PCO_SECRET = 'secret';

    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [{ type: 'Song', id: '1', attributes: { title: 'Test' } }],
      meta: { total_count: 349 },
    }));

    const result = await testPCOConnection();
    expect(result.ok).toBe(true);
    expect(result.songCount).toBe(349);
  });

  it('returns error when credentials not configured', async () => {
    mockPrepare.mockImplementation(() => ({
      get: () => undefined,
    }));

    const result = await testPCOConnection();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not configured');
  });
});

describe('importPlan', () => {
  it('imports song items and creates setlist', async () => {
    process.env.PCO_APP_ID = 'app-id';
    process.env.PCO_SECRET = 'secret';

    // Mock fetchPlanItems response
    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [
        {
          type: 'Item', id: '1001',
          attributes: { item_type: 'header', title: 'Worship', key_name: null, sequence: 1 },
          relationships: {},
        },
        {
          type: 'Item', id: '1002',
          attributes: { item_type: 'song', title: 'Amazing Grace', key_name: 'G', sequence: 2 },
          relationships: {
            song: { data: { type: 'Song', id: '5001' } },
            arrangement: { data: { type: 'Arrangement', id: '6001' } },
          },
        },
      ],
      included: [
        {
          type: 'Song', id: '5001',
          attributes: { title: 'Amazing Grace', author: 'John Newton', ccli_number: 12345, copyright: 'PD', themes: null },
        },
        {
          type: 'Arrangement', id: '6001',
          attributes: {
            name: 'Original',
            chord_chart: 'Verse 1:\n[G]Amazing [C]Grace',
            chord_chart_key: 'G',
            has_chords: true,
            lyrics: 'Amazing Grace',
            sequence: ['Verse 1'],
          },
        },
      ],
    }));

    mockSaveSongFile.mockResolvedValueOnce('Amazing Grace.mcs');
    mockSaveSetlistFile.mockResolvedValueOnce('pco-100');

    const result = await importPlan('1', '100', true, 'Mar 15');

    // Should only import song items, not headers
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].title).toBe('Amazing Grace');
    expect(result.songs[0].status).toBe('imported');
    expect(result.songs[0].localId).toBe('Amazing Grace.mcs');

    // Should create setlist
    expect(result.setlistId).toBe('pco-100');
    expect(mockSaveSetlistFile).toHaveBeenCalledWith('pco-100', 'Mar 15', ['Amazing Grace.mcs']);
  });

  it('skips setlist creation when createSetlist is false', async () => {
    process.env.PCO_APP_ID = 'app-id';
    process.env.PCO_SECRET = 'secret';

    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [{
        type: 'Item', id: '1',
        attributes: { item_type: 'song', title: 'Song', key_name: 'C', sequence: 1 },
        relationships: {
          song: { data: { type: 'Song', id: '5001' } },
          arrangement: { data: { type: 'Arrangement', id: '6001' } },
        },
      }],
      included: [
        { type: 'Song', id: '5001', attributes: { title: 'Song', author: 'A', ccli_number: null, copyright: null, themes: null } },
        { type: 'Arrangement', id: '6001', attributes: { name: 'O', chord_chart: '[C]Hello', chord_chart_key: 'C', has_chords: true, lyrics: 'Hello', sequence: [] } },
      ],
    }));

    mockSaveSongFile.mockResolvedValueOnce('Song.mcs');

    const result = await importPlan('1', '100', false);
    expect(result.setlistId).toBeUndefined();
    expect(mockSaveSetlistFile).not.toHaveBeenCalled();
  });

  it('handles items with missing song/arrangement data', async () => {
    process.env.PCO_APP_ID = 'app-id';
    process.env.PCO_SECRET = 'secret';

    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [{
        type: 'Item', id: '1',
        attributes: { item_type: 'song', title: 'Broken Song', key_name: 'C', sequence: 1 },
        relationships: {
          song: { data: { type: 'Song', id: '9999' } },
          arrangement: { data: { type: 'Arrangement', id: '9999' } },
        },
      }],
      included: [],
    }));

    const result = await importPlan('1', '100', false);
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].status).toBe('error');
    expect(result.songs[0].error).toContain('Missing song or arrangement data');
  });

  it('reports empty format songs with status empty', async () => {
    process.env.PCO_APP_ID = 'app-id';
    process.env.PCO_SECRET = 'secret';

    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [{
        type: 'Item', id: '1',
        attributes: { item_type: 'song', title: 'Empty', key_name: 'C', sequence: 1 },
        relationships: {
          song: { data: { type: 'Song', id: '5001' } },
          arrangement: { data: { type: 'Arrangement', id: '6001' } },
        },
      }],
      included: [
        { type: 'Song', id: '5001', attributes: { title: 'Empty', author: 'A', ccli_number: null, copyright: null, themes: null } },
        { type: 'Arrangement', id: '6001', attributes: { name: 'O', chord_chart: null, chord_chart_key: 'C', has_chords: false, lyrics: '', sequence: [] } },
      ],
    }));

    mockSaveSongFile.mockResolvedValueOnce('Empty.mcs');

    const result = await importPlan('1', '100', false);
    expect(result.songs[0].status).toBe('empty');
  });

  it('fetches sections for lyrics-only songs', async () => {
    process.env.PCO_APP_ID = 'app-id';
    process.env.PCO_SECRET = 'secret';

    // First call: fetchPlanItems
    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [{
        type: 'Item', id: '1',
        attributes: { item_type: 'song', title: 'Lyrics Only', key_name: 'E', sequence: 1 },
        relationships: {
          song: { data: { type: 'Song', id: '5002' } },
          arrangement: { data: { type: 'Arrangement', id: '6002' } },
        },
      }],
      included: [
        { type: 'Song', id: '5002', attributes: { title: 'Lyrics Only', author: 'A', ccli_number: null, copyright: null, themes: null } },
        { type: 'Arrangement', id: '6002', attributes: { name: 'O', chord_chart: 'Verse 1\nSome lyrics', chord_chart_key: 'E', has_chords: false, lyrics: 'Some lyrics', sequence: ['Verse 1'] } },
      ],
    }));

    // Second call: fetchArrangementSections (for lyrics-only)
    mockFetch.mockReturnValueOnce(jsonResponse({
      data: [
        { type: 'ArrangementSection', id: '201', attributes: { label: 'Verse 1', lyrics: 'Some lyrics line' } },
      ],
    }));

    mockSaveSongFile.mockResolvedValueOnce('Lyrics Only.mcs');

    const result = await importPlan('1', '100', false);
    expect(result.songs[0].status).toBe('lyrics_only');

    // Should have made 2 fetch calls: plan items + sections
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
