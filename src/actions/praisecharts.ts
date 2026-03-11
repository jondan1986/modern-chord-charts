// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use server";

import db from '@/src/lib/db';
import { PraiseChartsClient } from '@/src/services/praisecharts/client';
import { convertPraiseChartsToMCS } from '@/src/services/praisecharts/converter';
import { saveSongFile } from '@/src/actions/file-storage';
import type {
    PraiseChartsCredentials,
    PraiseChartsSearchResponse,
} from '@/src/services/praisecharts/types';

function ensurePraiseChartsSettingsTable(): void {
    db.exec('CREATE TABLE IF NOT EXISTS praisecharts_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
}

function getCredentials(): PraiseChartsCredentials | null {
    // Check environment variables first
    const envConsumerKey = process.env.PRAISECHARTS_CONSUMER_KEY;
    const envConsumerSecret = process.env.PRAISECHARTS_CONSUMER_SECRET;
    const envAccessToken = process.env.PRAISECHARTS_ACCESS_TOKEN;
    const envAccessTokenSecret = process.env.PRAISECHARTS_ACCESS_TOKEN_SECRET;

    if (envConsumerKey && envConsumerSecret && envAccessToken && envAccessTokenSecret) {
        return {
            consumerKey: envConsumerKey,
            consumerSecret: envConsumerSecret,
            accessToken: envAccessToken,
            accessTokenSecret: envAccessTokenSecret,
        };
    }

    // Fall back to database
    try {
        ensurePraiseChartsSettingsTable();
        const getSetting = (key: string) =>
            (db.prepare("SELECT value FROM praisecharts_settings WHERE key = ?").get(key) as { value: string } | undefined)?.value;

        const consumerKey = getSetting('consumer_key');
        const consumerSecret = getSetting('consumer_secret');
        const accessToken = getSetting('access_token');
        const accessTokenSecret = getSetting('access_token_secret');

        if (consumerKey && consumerSecret && accessToken && accessTokenSecret) {
            return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
        }
    } catch {
        // Table doesn't exist yet
    }

    return null;
}

function getClient(): PraiseChartsClient {
    const creds = getCredentials();
    if (!creds) throw new Error('PraiseCharts credentials not configured');
    return new PraiseChartsClient(creds);
}

export async function getPraiseChartsCredentials(): Promise<{ configured: boolean }> {
    return { configured: getCredentials() !== null };
}

export async function savePraiseChartsCredentials(
    consumerKey: string,
    consumerSecret: string,
    accessToken: string,
    accessTokenSecret: string
): Promise<void> {
    ensurePraiseChartsSettingsTable();
    const set = (key: string, value: string) =>
        db.prepare("INSERT OR REPLACE INTO praisecharts_settings (key, value) VALUES (?, ?)").run(key, value);

    set('consumer_key', consumerKey);
    set('consumer_secret', consumerSecret);
    set('access_token', accessToken);
    set('access_token_secret', accessTokenSecret);
}

export async function testPraiseChartsConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
        const client = getClient();
        return client.testConnection();
    } catch (err: any) {
        return { ok: false, error: err.message ?? 'Unknown error' };
    }
}

export async function searchPraiseCharts(
    query: string,
    options: { ccli?: string; key?: string; page?: number } = {}
): Promise<PraiseChartsSearchResponse> {
    const client = getClient();
    return client.search(query, options);
}

export async function fetchAndConvertChart(
    songId: string,
    key?: string
): Promise<{ yaml: string; localId: string }> {
    const client = getClient();
    const chart = await client.getChordChart(songId, key);
    const yaml = convertPraiseChartsToMCS(chart);
    const localId = await saveSongFile(yaml);
    return { yaml, localId };
}

export async function checkPraiseChartsAccess(
    songId: string
): Promise<{ hasAccess: boolean; purchaseUrl?: string }> {
    const client = getClient();
    return client.checkAccess(songId);
}

export async function lookupByCCLI(
    ccliNumber: string
): Promise<PraiseChartsSearchResponse> {
    const client = getClient();
    return client.search('', { ccli: ccliNumber });
}
