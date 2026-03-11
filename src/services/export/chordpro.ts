// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import { Song, Section, Line, SectionType } from '@/mcs-core/model';

const SECTION_TYPE_TO_DIRECTIVE: Record<string, { start: string; end: string }> = {
  verse: { start: 'start_of_verse', end: 'end_of_verse' },
  chorus: { start: 'start_of_chorus', end: 'end_of_chorus' },
  bridge: { start: 'start_of_bridge', end: 'end_of_bridge' },
  tab: { start: 'start_of_tab', end: 'end_of_tab' },
};

export class ChordProExporter {
  static export(song: Song): string {
    const lines: string[] = [];

    // Metadata directives
    lines.push(`{title: ${song.metadata.title}}`);
    lines.push(`{artist: ${song.metadata.artist}}`);
    if (song.metadata.key) lines.push(`{key: ${song.metadata.key}}`);
    if (song.metadata.tempo) lines.push(`{tempo: ${song.metadata.tempo}}`);
    if (song.metadata.time_signature) lines.push(`{time: ${song.metadata.time_signature}}`);
    if (song.metadata.copyright) lines.push(`{copyright: ${song.metadata.copyright}}`);
    if (song.metadata.year) lines.push(`{year: ${song.metadata.year}}`);

    // Custom metadata
    const knownKeys = new Set(['title', 'artist', 'key', 'tempo', 'time_signature', 'year', 'themes', 'copyright', 'ccli']);
    Object.entries(song.metadata)
      .filter(([k]) => !knownKeys.has(k))
      .forEach(([k, v]) => {
        lines.push(`{${k}: ${v}}`);
      });

    lines.push('');

    // Sections
    song.sections.forEach((section) => {
      const directive = SECTION_TYPE_TO_DIRECTIVE[section.type];

      if (directive) {
        const label = section.label !== defaultLabel(section.type) ? `: ${section.label}` : '';
        lines.push(`{${directive.start}${label}}`);
      } else {
        lines.push(`{comment: ${section.label}}`);
      }

      if (section.subtitle) {
        lines.push(`{comment: ${section.subtitle}}`);
      }

      section.lines.forEach((line) => {
        if (typeof line === 'string') {
          // Grid or raw string — output as-is
          lines.push(line);
        } else {
          // Strict Line object — reconstruct inline chord format
          lines.push(lineToChordPro(line));
        }
      });

      if (directive) {
        lines.push(`{${directive.end}}`);
      }
      lines.push('');
    });

    return lines.join('\n').trimEnd() + '\n';
  }
}

function lineToChordPro(line: Line): string {
  let result = '';
  for (const segment of line.content) {
    if (segment.chord) {
      result += `[${segment.chord}]`;
    }
    result += segment.lyric;
  }
  return result;
}

function defaultLabel(type: SectionType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
