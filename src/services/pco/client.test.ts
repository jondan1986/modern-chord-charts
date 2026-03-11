// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PCOClient } from './client';
import type { PCOJsonApiResponse, PCOResource } from './types';
import planItemsResponse from './__fixtures__/plan-items-response.json';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: any, status = 200, headers?: Record<string, string>) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe('PCOClient', () => {
  const client = new PCOClient('test-app-id', 'test-secret');

  describe('authentication', () => {
    it('sends Basic Auth header with base64-encoded credentials', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));
      await client.get('/test');

      const headers = mockFetch.mock.calls[0][1].headers;
      const expected = Buffer.from('test-app-id:test-secret').toString('base64');
      expect(headers['Authorization']).toBe(`Basic ${expected}`);
    });

    it('sends User-Agent header', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ data: [] }));
      await client.get('/test');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['User-Agent']).toBe('ModernChordCharts/1.0');
    });
  });

  describe('error handling', () => {
    it('throws PCOError on non-2xx response', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({}, 401));

      await expect(client.get('/test')).rejects.toThrow();
    });

    it('retries on 429 with exponential backoff', async () => {
      mockFetch
        .mockReturnValueOnce(jsonResponse({}, 429, { 'Retry-After': '1' }))
        .mockReturnValueOnce(jsonResponse({ data: 'ok' }));

      const result = await client.get('/test');
      expect(result).toEqual({ data: 'ok' });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries on persistent 429', async () => {
      mockFetch
        .mockReturnValue(jsonResponse({}, 429));

      await expect(client.get('/test')).rejects.toThrow('Rate limited');
    }, 15000);
  });

  describe('resolveIncludes', () => {
    it('resolves song and arrangement relationships from included array', () => {
      const items = PCOClient.resolveIncludes(planItemsResponse as any);

      // Should have all 6 items
      expect(items).toHaveLength(6);

      // Header item — no song/arrangement
      const header = items[0];
      expect(header.item_type).toBe('header');
      expect(header.song).toBeUndefined();

      // Song items should have resolved relationships
      const songItem = items[1];
      expect(songItem.item_type).toBe('song');
      expect(songItem.title).toBe('Amazing Grace');
      expect(songItem.key_name).toBe('G');
      expect(songItem.song).toBeDefined();
      expect(songItem.song!.title).toBe('Amazing Grace');
      expect(songItem.song!.author).toBe('John Newton');
      expect(songItem.song!.ccli_number).toBe(4755360);
      expect(songItem.arrangement).toBeDefined();
      expect(songItem.arrangement!.has_chords).toBe(true);
      expect(songItem.arrangement!.chord_chart_key).toBe('G');
    });

    it('handles items without relationships', () => {
      const items = PCOClient.resolveIncludes(planItemsResponse as any);
      const announcementItem = items[4];
      expect(announcementItem.item_type).toBe('item');
      expect(announcementItem.song).toBeUndefined();
      expect(announcementItem.arrangement).toBeUndefined();
    });

    it('resolves empty arrangement correctly', () => {
      const items = PCOClient.resolveIncludes(planItemsResponse as any);
      const emptyItem = items[5];
      expect(emptyItem.arrangement).toBeDefined();
      expect(emptyItem.arrangement!.chord_chart).toBeNull();
      expect(emptyItem.arrangement!.has_chords).toBe(false);
      expect(emptyItem.arrangement!.lyrics).toBe('');
    });
  });

  describe('pagination', () => {
    it('follows links.next for multi-page results', async () => {
      mockFetch
        .mockReturnValueOnce(jsonResponse({
          data: [{ id: '1' }, { id: '2' }],
          links: { next: 'https://api.planningcenteronline.com/services/v2/songs?per_page=2&offset=2' },
        }))
        .mockReturnValueOnce(jsonResponse({
          data: [{ id: '3' }],
          links: {},
        }));

      const results = await client.getAll('/songs', 2);
      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('stops when no links.next is present', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({
        data: [{ id: '1' }],
        links: {},
      }));

      const results = await client.getAll('/songs', 25);
      expect(results).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('high-level methods', () => {
    it('fetchServiceTypes maps response to PCOServiceType[]', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({
        data: [
          { type: 'ServiceType', id: '1', attributes: { name: 'Sunday Morning', frequency: 'Every 1 weeks' } },
          { type: 'ServiceType', id: '2', attributes: { name: 'Wednesday Night', frequency: 'Every 1 weeks' } },
        ],
      }));

      const types = await client.fetchServiceTypes();
      expect(types).toHaveLength(2);
      expect(types[0]).toEqual({ id: '1', name: 'Sunday Morning', frequency: 'Every 1 weeks' });
    });

    it('fetchPlans maps response to PCOPlan[]', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({
        data: [{
          type: 'Plan', id: '100',
          attributes: {
            title: null,
            dates: 'March 15, 2026',
            short_dates: 'Mar 15',
            sort_date: '2026-03-15T00:00:00Z',
            items_count: 21,
            series_title: null,
          },
        }],
      }));

      const plans = await client.fetchPlans('1', 'future');
      expect(plans).toHaveLength(1);
      expect(plans[0].dates).toBe('March 15, 2026');
      expect(plans[0].items_count).toBe(21);
    });
  });
});
