// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

export class PraiseChartsError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'PraiseChartsError';
        this.status = status;
    }
}

export interface PraiseChartsCredentials {
    consumerKey: string;
    consumerSecret: string;
    accessToken: string;
    accessTokenSecret: string;
}

export interface PraiseChartsSearchResult {
    id: string;
    title: string;
    artist: string;
    key?: string;
    hasChordChart: boolean;
    previewUrl?: string;
    purchaseUrl?: string;
}

export interface PraiseChartsSearchResponse {
    results: PraiseChartsSearchResult[];
    total: number;
    page: number;
    perPage: number;
}

export interface PraiseChartsChordChart {
    id: string;
    songId: string;
    title: string;
    artist: string;
    key: string;
    sections: PraiseChartsSection[];
    copyright?: string;
    ccli?: string;
}

export interface PraiseChartsSection {
    label: string;
    type: string;
    lines: PraiseChartsLine[];
}

export interface PraiseChartsLine {
    chords: string[];
    lyrics: string;
}
