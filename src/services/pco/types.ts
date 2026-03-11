// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

// PCO Services API Types (JSON:API format)

export class PCOError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'PCOError';
    this.status = status;
  }
}

export interface PCOJsonApiResponse<T> {
  data: T;
  included?: PCOResource[];
  links?: { self?: string; next?: string };
  meta?: { total_count?: number; count?: number };
}

export interface PCOResource {
  type: string;
  id: string;
  attributes: Record<string, any>;
  relationships?: Record<string, { data: { type: string; id: string } | null }>;
}

export interface PCOServiceType {
  id: string;
  name: string;
  frequency: string;
}

export interface PCOPlan {
  id: string;
  title: string | null;
  dates: string;
  short_dates: string;
  sort_date: string;
  items_count: number;
  series_title: string | null;
}

export interface PCOItem {
  id: string;
  item_type: 'song' | 'header' | 'item';
  title: string;
  key_name: string | null;
  sequence: number;
  song?: PCOSong;
  arrangement?: PCOArrangement;
}

export interface PCOSong {
  id: string;
  title: string;
  author: string;
  ccli_number: number | null;
  copyright: string | null;
  themes: string | null;
}

export interface PCOArrangement {
  id: string;
  name: string;
  chord_chart: string | null;
  chord_chart_key: string | null;
  has_chords: boolean;
  lyrics: string;
  sequence: string[];
}

export interface PCOSection {
  id: string;
  label: string;
  lyrics: string;
}

export interface ImportSongResult {
  title: string;
  localId: string;
  status: 'imported' | 'lyrics_only' | 'empty' | 'error';
  error?: string;
}

export interface ImportResult {
  songs: ImportSongResult[];
  setlistId?: string;
}

export interface ExportResult {
  success: boolean;
  attachmentId?: string;
  error?: string;
}
