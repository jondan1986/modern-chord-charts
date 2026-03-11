// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import {
  PCOError,
  PCOJsonApiResponse,
  PCOResource,
  PCOServiceType,
  PCOPlan,
  PCOItem,
  PCOSong,
  PCOArrangement,
  PCOSection,
} from './types';

const PCO_BASE = 'https://api.planningcenteronline.com/services/v2';
const PCO_UPLOAD = 'https://upload.planningcenteronline.com/v2/files';
const MAX_RETRIES = 3;

export class PCOClient {
  private appId: string;
  private secret: string;

  constructor(appId: string, secret: string) {
    this.appId = appId;
    this.secret = secret;
  }

  private authHeader(): string {
    const encoded = Buffer.from(`${this.appId}:${this.secret}`).toString('base64');
    return `Basic ${encoded}`;
  }

  private headers(): Record<string, string> {
    return {
      'Authorization': this.authHeader(),
      'User-Agent': 'ModernChordCharts/1.0',
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string): Promise<T> {
    return this.requestWithRetry('GET', path);
  }

  async post<T>(path: string, body: object): Promise<T> {
    return this.requestWithRetry('POST', path, body);
  }

  async patch<T>(path: string, body: object): Promise<T> {
    return this.requestWithRetry('PATCH', path, body);
  }

  async del(path: string): Promise<void> {
    const res = await fetch(`${PCO_BASE}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new PCOError(res.status, await res.text());
    }
  }

  async uploadFile(content: string, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([content], { type: 'text/yaml' }), filename);

    const res = await fetch(PCO_UPLOAD, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader(),
        'User-Agent': 'ModernChordCharts/1.0',
      },
      body: formData,
    });
    if (!res.ok) {
      throw new PCOError(res.status, await res.text());
    }
    const json = await res.json();
    return json.data.id;
  }

  async getAll<T>(path: string, perPage = 25): Promise<T[]> {
    let offset = 0;
    const all: T[] = [];
    const separator = path.includes('?') ? '&' : '?';
    while (true) {
      const res = await this.get<PCOJsonApiResponse<T[]>>(
        `${path}${separator}per_page=${perPage}&offset=${offset}`
      );
      all.push(...res.data);
      if (!res.links?.next) break;
      offset += perPage;
    }
    return all;
  }

  private async requestWithRetry<T>(method: string, path: string, body?: object): Promise<T> {
    let lastError: PCOError | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const res = await fetch(`${PCO_BASE}${path}`, {
        method,
        headers: this.headers(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        lastError = new PCOError(429, 'Rate limited');
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!res.ok) {
        throw new PCOError(res.status, await res.text());
      }

      return res.json();
    }
    throw lastError ?? new PCOError(429, 'Rate limited after max retries');
  }

  // Resolve JSON:API `included` resources into item relationships
  static resolveIncludes(
    response: PCOJsonApiResponse<PCOResource[]>
  ): PCOItem[] {
    const included = response.included ?? [];
    const indexedIncludes = new Map<string, PCOResource>();
    for (const inc of included) {
      indexedIncludes.set(`${inc.type}:${inc.id}`, inc);
    }

    return response.data.map((item) => {
      const attrs = item.attributes;
      const result: PCOItem = {
        id: item.id,
        item_type: attrs.item_type,
        title: attrs.title,
        key_name: attrs.key_name ?? null,
        sequence: attrs.sequence,
      };

      const songRel = item.relationships?.song?.data;
      if (songRel) {
        const songRes = indexedIncludes.get(`${songRel.type}:${songRel.id}`);
        if (songRes) {
          result.song = {
            id: songRes.id,
            title: songRes.attributes.title,
            author: songRes.attributes.author,
            ccli_number: songRes.attributes.ccli_number ?? null,
            copyright: songRes.attributes.copyright ?? null,
            themes: songRes.attributes.themes ?? null,
          };
        }
      }

      const arrRel = item.relationships?.arrangement?.data;
      if (arrRel) {
        const arrRes = indexedIncludes.get(`${arrRel.type}:${arrRel.id}`);
        if (arrRes) {
          result.arrangement = {
            id: arrRes.id,
            name: arrRes.attributes.name,
            chord_chart: arrRes.attributes.chord_chart ?? null,
            chord_chart_key: arrRes.attributes.chord_chart_key ?? null,
            has_chords: arrRes.attributes.has_chords ?? false,
            lyrics: arrRes.attributes.lyrics ?? '',
            sequence: arrRes.attributes.sequence ?? [],
          };
        }
      }

      return result;
    });
  }

  // High-level API methods

  async fetchServiceTypes(): Promise<PCOServiceType[]> {
    const res = await this.get<PCOJsonApiResponse<PCOResource[]>>('/service_types');
    return res.data.map(r => ({
      id: r.id,
      name: r.attributes.name,
      frequency: r.attributes.frequency,
    }));
  }

  async fetchPlans(serviceTypeId: string, filter: 'future' | 'past' = 'future'): Promise<PCOPlan[]> {
    const res = await this.get<PCOJsonApiResponse<PCOResource[]>>(
      `/service_types/${serviceTypeId}/plans?filter=${filter}&order=-sort_date&per_page=10`
    );
    return res.data.map(r => ({
      id: r.id,
      title: r.attributes.title ?? null,
      dates: r.attributes.dates,
      short_dates: r.attributes.short_dates,
      sort_date: r.attributes.sort_date,
      items_count: r.attributes.items_count,
      series_title: r.attributes.series_title ?? null,
    }));
  }

  async fetchPlanItems(serviceTypeId: string, planId: string): Promise<PCOItem[]> {
    const res = await this.get<PCOJsonApiResponse<PCOResource[]>>(
      `/service_types/${serviceTypeId}/plans/${planId}/items?include=song,arrangement,key`
    );
    return PCOClient.resolveIncludes(res);
  }

  async fetchSongs(offset = 0, perPage = 25): Promise<{ songs: PCOSong[]; total: number }> {
    const res = await this.get<PCOJsonApiResponse<PCOResource[]>>(
      `/songs?per_page=${perPage}&offset=${offset}`
    );
    return {
      songs: res.data.map(r => ({
        id: r.id,
        title: r.attributes.title,
        author: r.attributes.author,
        ccli_number: r.attributes.ccli_number ?? null,
        copyright: r.attributes.copyright ?? null,
        themes: r.attributes.themes ?? null,
      })),
      total: res.meta?.total_count ?? res.data.length,
    };
  }

  async fetchArrangements(songId: string): Promise<PCOArrangement[]> {
    const res = await this.get<PCOJsonApiResponse<PCOResource[]>>(
      `/songs/${songId}/arrangements`
    );
    return res.data.map(r => ({
      id: r.id,
      name: r.attributes.name,
      chord_chart: r.attributes.chord_chart ?? null,
      chord_chart_key: r.attributes.chord_chart_key ?? null,
      has_chords: r.attributes.has_chords ?? false,
      lyrics: r.attributes.lyrics ?? '',
      sequence: r.attributes.sequence ?? [],
    }));
  }

  async fetchArrangementSections(songId: string, arrangementId: string): Promise<PCOSection[]> {
    const res = await this.get<PCOJsonApiResponse<PCOResource[]>>(
      `/songs/${songId}/arrangements/${arrangementId}/sections`
    );
    return res.data.map(r => ({
      id: r.id,
      label: r.attributes.label,
      lyrics: r.attributes.lyrics,
    }));
  }

  async createAttachment(
    songId: string,
    arrangementId: string,
    filename: string,
    uploadId: string
  ): Promise<string> {
    const res = await this.post<PCOJsonApiResponse<PCOResource>>(
      `/songs/${songId}/arrangements/${arrangementId}/attachments`,
      {
        data: {
          type: 'Attachment',
          attributes: {
            filename,
            file_upload_identifier: uploadId,
          },
        },
      }
    );
    return (res.data as any).id;
  }

  async updateChordChart(songId: string, arrangementId: string, chordChart: string): Promise<void> {
    await this.patch(
      `/songs/${songId}/arrangements/${arrangementId}`,
      {
        data: {
          type: 'Arrangement',
          attributes: { chord_chart: chordChart },
        },
      }
    );
  }
}
