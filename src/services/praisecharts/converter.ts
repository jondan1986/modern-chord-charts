// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import type { PraiseChartsChordChart, PraiseChartsSection } from './types';

/**
 * Maps PraiseCharts section types to MCS section types.
 */
function mapSectionType(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('verse')) return 'verse';
    if (lower.includes('pre-chorus') || lower.includes('prechorus')) return 'other';
    if (lower.includes('chorus')) return 'chorus';
    if (lower.includes('bridge')) return 'bridge';
    if (lower.includes('intro')) return 'intro';
    if (lower.includes('outro') || lower.includes('ending')) return 'outro';
    if (lower.includes('tag')) return 'tag';
    if (lower.includes('interlude') || lower.includes('instrumental')) return 'instrumental';
    if (lower.includes('hook')) return 'hook';
    return 'other';
}

/**
 * Escapes a string for safe inclusion in YAML double-quoted strings.
 */
function escapeYaml(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Converts a PraiseCharts line with separate chords array and lyrics string
 * into MCS compact format: "[C]lyrics [G]more lyrics"
 */
function convertLine(chords: string[], lyrics: string): string {
    if (!chords.length) return lyrics;
    if (!lyrics) return chords.map(c => `[${c}]`).join(' ');

    // Simple approach: interleave chords at word boundaries
    // PraiseCharts typically provides chord positions aligned to lyrics
    const words = lyrics.split(/(\s+)/);
    let result = '';
    let chordIdx = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        // Place chord before non-whitespace words
        if (chordIdx < chords.length && word.trim()) {
            result += `[${chords[chordIdx]}]`;
            chordIdx++;
        }
        result += word;
    }

    // Append remaining chords at the end
    while (chordIdx < chords.length) {
        result += ` [${chords[chordIdx]}]`;
        chordIdx++;
    }

    return result;
}

/**
 * Converts a PraiseCharts section to lines in MCS compact format.
 */
function convertSection(section: PraiseChartsSection): string[] {
    return section.lines.map(line => convertLine(line.chords, line.lyrics));
}

/**
 * Converts a PraiseCharts chord chart to MCS YAML.
 */
export function convertPraiseChartsToMCS(chart: PraiseChartsChordChart): string {
    const title = escapeYaml(chart.title || 'Untitled Song');
    const artist = escapeYaml(chart.artist || 'Unknown Artist');

    let yaml = `schema_version: "1.0"\n`;
    yaml += `metadata:\n`;
    yaml += `  title: "${title}"\n`;
    yaml += `  artist: "${artist}"\n`;
    if (chart.key) yaml += `  key: "${escapeYaml(chart.key)}"\n`;
    if (chart.ccli) yaml += `  ccli: "${escapeYaml(chart.ccli)}"\n`;
    if (chart.copyright) yaml += `  copyright: "${escapeYaml(chart.copyright)}"\n`;
    yaml += `  praisecharts_id: "${escapeYaml(chart.id)}"\n`;

    yaml += `\nsections:\n`;

    if (chart.sections.length === 0) {
        const id = crypto.randomUUID();
        yaml += `  - id: "${id}"\n`;
        yaml += `    label: "Verse 1"\n`;
        yaml += `    type: "verse"\n`;
        yaml += `    lines:\n`;
        yaml += `      - ""\n`;
        return yaml;
    }

    for (const section of chart.sections) {
        const id = crypto.randomUUID();
        const sectionType = mapSectionType(section.type || section.label);
        const label = escapeYaml(section.label || section.type || 'Section');

        yaml += `  - id: "${id}"\n`;
        yaml += `    label: "${label}"\n`;
        yaml += `    type: "${sectionType}"\n`;
        yaml += `    lines:\n`;

        const lines = convertSection(section);
        if (lines.length === 0) {
            yaml += `      - ""\n`;
        } else {
            for (const line of lines) {
                yaml += `      - "${escapeYaml(line)}"\n`;
            }
        }
    }

    return yaml;
}
