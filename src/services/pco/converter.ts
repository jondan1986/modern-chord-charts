// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import type { SectionType } from '@/src/mcs-core/model';
import { ChordProConverter } from '@/src/services/import/chordpro';
import type { PCOArrangement, PCOSection, PCOSong } from './types';

export type PCOFormatType = 'chordpro' | 'lyrics_only' | 'hybrid' | 'empty';

export function sanitize(content: string): string {
  return content
    .replace(/<[^>]+>/g, '')
    .replace(/^PAGE_BREAK$/gm, '')
    .replace(/^COLUMN_BREAK$/gm, '')
    .replace(/\[\[/g, '[')
    .replace(/\]\]/g, ']')
    .replace(/\b([A-G](?:#|b)?)min7\b/g, '$1m7')
    .replace(/\b([A-G](?:#|b)?)min\b/g, '$1m')
    .replace(/\n\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

export function detectFormat(arrangement: PCOArrangement): PCOFormatType {
  if (!arrangement.chord_chart && !arrangement.lyrics) return 'empty';
  if (
    arrangement.has_chords &&
    arrangement.chord_chart?.includes('IMPORTED FROM SONGSELECT')
  ) {
    return 'hybrid';
  }
  if (arrangement.has_chords) return 'chordpro';
  return 'lyrics_only';
}

const SECTION_LABEL_MAP: Record<string, SectionType> = {
  verse: 'verse',
  chorus: 'chorus',
  bridge: 'bridge',
  intro: 'intro',
  outro: 'outro',
  ending: 'outro',
  tag: 'tag',
  interlude: 'instrumental',
  instrumental: 'instrumental',
  'pre-chorus': 'other',
  misc: 'other',
};

export function mapSectionLabel(label: string): { type: SectionType; label: string } {
  const lower = label.toLowerCase().replace(/\s*\d+$/, '').trim();
  const type = SECTION_LABEL_MAP[lower] ?? 'other';
  return { type, label };
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"');
}

export function buildMetadataYaml(
  song: PCOSong,
  arrangement: PCOArrangement,
  keyName?: string
): string {
  let yaml = `schema_version: "1.0"\nmetadata:\n`;
  yaml += `  title: "${escapeYaml(song.title)}"\n`;
  yaml += `  artist: "${escapeYaml(song.author)}"\n`;
  if (keyName) yaml += `  key: "${keyName}"\n`;
  else if (arrangement.chord_chart_key) yaml += `  key: "${arrangement.chord_chart_key}"\n`;
  if (song.ccli_number) yaml += `  ccli: "${song.ccli_number}"\n`;
  if (song.copyright) yaml += `  copyright: "${escapeYaml(song.copyright)}"\n`;
  if (song.themes) {
    const themeList = song.themes.split(',').map(t => t.trim()).filter(Boolean);
    if (themeList.length > 0) {
      yaml += `  themes:\n`;
      for (const theme of themeList) {
        yaml += `    - "${escapeYaml(theme)}"\n`;
      }
    }
  }
  yaml += `  pco_song_id: "${song.id}"\n`;
  yaml += `  pco_arrangement_id: "${arrangement.id}"\n`;
  yaml += `  pco_arrangement_name: "${escapeYaml(arrangement.name)}"\n`;
  return yaml;
}

export function generateMetadataOnlyMCS(
  song: PCOSong,
  arrangement: PCOArrangement,
  keyName?: string
): string {
  let yaml = buildMetadataYaml(song, arrangement, keyName);
  yaml += `\nsections:\n`;
  yaml += `  - id: "${crypto.randomUUID()}"\n`;
  yaml += `    label: "Verse 1"\n`;
  yaml += `    type: "verse"\n`;
  yaml += `    lines: []\n`;
  return yaml;
}

export function generateLyricsOnlyMCS(
  song: PCOSong,
  arrangement: PCOArrangement,
  sections: PCOSection[],
  keyName?: string
): string {
  let yaml = buildMetadataYaml(song, arrangement, keyName);
  yaml += `\nsections:\n`;

  if (sections.length === 0) {
    yaml += `  - id: "${crypto.randomUUID()}"\n`;
    yaml += `    label: "Verse 1"\n`;
    yaml += `    type: "verse"\n`;
    yaml += `    lines: []\n`;
    return yaml;
  }

  for (const section of sections) {
    const mapped = mapSectionLabel(section.label);
    yaml += `  - id: "${crypto.randomUUID()}"\n`;
    yaml += `    label: "${escapeYaml(mapped.label)}"\n`;
    yaml += `    type: "${mapped.type}"\n`;
    yaml += `    lines:\n`;

    const lyrics = section.lyrics
      .replace(/\n\r/g, '\n')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter(l => l.trim());

    for (const line of lyrics) {
      yaml += `      - "${escapeYaml(line.trim())}"\n`;
    }
  }

  return yaml;
}

function spliceMetadataIntoChordProYaml(
  chordProYaml: string,
  song: PCOSong,
  arrangement: PCOArrangement,
  keyName?: string
): string {
  // Replace metadata block from ChordProConverter output with our richer metadata
  const sectionsIndex = chordProYaml.indexOf('\nsections:');
  if (sectionsIndex === -1) return chordProYaml;

  const sectionsBlock = chordProYaml.slice(sectionsIndex);
  return buildMetadataYaml(song, arrangement, keyName) + sectionsBlock;
}

export function convertPCOToMCS(
  arrangement: PCOArrangement,
  song: PCOSong,
  keyName?: string,
  sections?: PCOSection[]
): string {
  const format = detectFormat(arrangement);

  if (format === 'empty') {
    return generateMetadataOnlyMCS(song, arrangement, keyName);
  }

  if (format === 'lyrics_only') {
    return generateLyricsOnlyMCS(song, arrangement, sections ?? [], keyName);
  }

  let content = arrangement.chord_chart ?? '';

  if (format === 'hybrid') {
    const parts = content.split('IMPORTED FROM SONGSELECT');
    content = parts[parts.length - 1].trim();
  }

  content = sanitize(content);
  const chordProYaml = ChordProConverter.convert(content);
  return spliceMetadataIntoChordProYaml(chordProYaml, song, arrangement, keyName);
}
