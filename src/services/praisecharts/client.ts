// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import { createHmac, randomBytes } from 'crypto';
import {
    PraiseChartsError,
    PraiseChartsCredentials,
    PraiseChartsSearchResult,
    PraiseChartsSearchResponse,
    PraiseChartsChordChart,
} from './types';

const PC_BASE = 'https://api.praisecharts.com/v1.0';
const MAX_RETRIES = 3;

export class PraiseChartsClient {
    private credentials: PraiseChartsCredentials;

    constructor(credentials: PraiseChartsCredentials) {
        this.credentials = credentials;
    }

    /**
     * Generate OAuth 1.0a Authorization header for a request.
     */
    private oauthHeader(method: string, url: string, params: Record<string, string> = {}): string {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = randomBytes(16).toString('hex');

        const oauthParams: Record<string, string> = {
            oauth_consumer_key: this.credentials.consumerKey,
            oauth_token: this.credentials.accessToken,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: timestamp,
            oauth_nonce: nonce,
            oauth_version: '1.0',
        };

        // Combine all params for signature base
        const allParams = { ...oauthParams, ...params };
        const sortedKeys = Object.keys(allParams).sort();
        const paramString = sortedKeys
            .map(k => `${encodeRFC3986(k)}=${encodeRFC3986(allParams[k])}`)
            .join('&');

        const signatureBase = [
            method.toUpperCase(),
            encodeRFC3986(url),
            encodeRFC3986(paramString),
        ].join('&');

        const signingKey = `${encodeRFC3986(this.credentials.consumerSecret)}&${encodeRFC3986(this.credentials.accessTokenSecret)}`;
        const signature = createHmac('sha1', signingKey)
            .update(signatureBase)
            .digest('base64');

        oauthParams['oauth_signature'] = signature;

        const headerParts = Object.entries(oauthParams)
            .map(([k, v]) => `${encodeRFC3986(k)}="${encodeRFC3986(v)}"`)
            .join(', ');

        return `OAuth ${headerParts}`;
    }

    private headers(method: string, url: string, params: Record<string, string> = {}): Record<string, string> {
        return {
            'Authorization': this.oauthHeader(method, url, params),
            'Accept': 'application/json',
            'User-Agent': 'ModernChordCharts/1.0',
        };
    }

    private async requestWithRetry<T>(method: string, path: string, queryParams: Record<string, string> = {}): Promise<T> {
        const url = `${PC_BASE}${path}`;
        const queryString = Object.entries(queryParams)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        let lastError: PraiseChartsError | null = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const res = await fetch(fullUrl, {
                method,
                headers: this.headers(method, url, queryParams),
            });

            if (res.status === 429) {
                const retryAfter = res.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
                lastError = new PraiseChartsError(429, 'Rate limited');
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!res.ok) {
                throw new PraiseChartsError(res.status, await res.text());
            }

            return res.json();
        }
        throw lastError ?? new PraiseChartsError(429, 'Rate limited after max retries');
    }

    /**
     * Search for songs by title or CCLI number.
     */
    async search(query: string, options: { ccli?: string; key?: string; page?: number; perPage?: number } = {}): Promise<PraiseChartsSearchResponse> {
        const params: Record<string, string> = { q: query };
        if (options.ccli) params.ccli = options.ccli;
        if (options.key) params.key = options.key;
        if (options.page) params.page = options.page.toString();
        if (options.perPage) params.per_page = options.perPage.toString();

        const res = await this.requestWithRetry<any>('GET', '/songs', params);
        return mapSearchResponse(res);
    }

    /**
     * Get a chord chart for a purchased song.
     */
    async getChordChart(songId: string, key?: string): Promise<PraiseChartsChordChart> {
        const params: Record<string, string> = {};
        if (key) params.key = key;

        const res = await this.requestWithRetry<any>('GET', `/songs/${songId}/chart`, params);
        return mapChordChart(res);
    }

    /**
     * Check if the user has access to a specific chart.
     */
    async checkAccess(songId: string): Promise<{ hasAccess: boolean; purchaseUrl?: string }> {
        try {
            const res = await this.requestWithRetry<any>('GET', `/songs/${songId}/access`);
            return {
                hasAccess: res.has_access ?? false,
                purchaseUrl: res.purchase_url,
            };
        } catch (err) {
            if (err instanceof PraiseChartsError && err.status === 403) {
                return { hasAccess: false };
            }
            throw err;
        }
    }

    /**
     * Test the connection by fetching account info.
     */
    async testConnection(): Promise<{ ok: boolean; error?: string }> {
        try {
            await this.requestWithRetry<any>('GET', '/account');
            return { ok: true };
        } catch (err: any) {
            return { ok: false, error: err.message ?? 'Connection failed' };
        }
    }
}

// --- Mapping helpers ---

function mapSearchResponse(raw: any): PraiseChartsSearchResponse {
    const results: PraiseChartsSearchResult[] = (raw.data ?? raw.results ?? []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? item.name ?? '',
        artist: item.artist ?? item.author ?? '',
        key: item.key ?? undefined,
        hasChordChart: item.has_chord_chart ?? item.has_chart ?? true,
        previewUrl: item.preview_url ?? undefined,
        purchaseUrl: item.purchase_url ?? item.url ?? undefined,
    }));

    return {
        results,
        total: raw.total ?? raw.meta?.total ?? results.length,
        page: raw.page ?? raw.meta?.page ?? 1,
        perPage: raw.per_page ?? raw.meta?.per_page ?? 20,
    };
}

function mapChordChart(raw: any): PraiseChartsChordChart {
    const data = raw.data ?? raw;
    return {
        id: String(data.id),
        songId: String(data.song_id ?? data.id),
        title: data.title ?? '',
        artist: data.artist ?? '',
        key: data.key ?? '',
        sections: (data.sections ?? []).map((sec: any) => ({
            label: sec.label ?? sec.name ?? '',
            type: sec.type ?? 'other',
            lines: (sec.lines ?? []).map((line: any) => ({
                chords: line.chords ?? [],
                lyrics: line.lyrics ?? '',
            })),
        })),
        copyright: data.copyright ?? undefined,
        ccli: data.ccli ?? data.ccli_number ? String(data.ccli ?? data.ccli_number) : undefined,
    };
}

/**
 * RFC 3986 percent-encoding (required by OAuth 1.0a).
 */
function encodeRFC3986(str: string): string {
    return encodeURIComponent(str).replace(/[!'()*]/g, c =>
        `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
}
