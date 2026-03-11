// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import {
    ChordProParser,
    UltimateGuitarParser,
    ChordsOverWordsParser,
    Song as CSSong,
    Line as CSLine,
} from 'chordsheetjs';

export type ImportFormat = 'auto' | 'chordpro' | 'ultimate_guitar' | 'chords_over_lyrics';

interface ImportOptions {
    format?: ImportFormat;
    title?: string;
    artist?: string;
}

/**
 * Detects the most likely format of the input text.
 */
export function detectFormat(text: string): Exclude<ImportFormat, 'auto'> {
    const trimmed = text.trim();

    // ChordPro: has directives like {title:...}, {soc}, {start_of_verse}, etc.
    if (/\{(title|t|artist|st|subtitle|key|tempo|capo|soc|eoc|sov|eov|sob|eob|start_of_|end_of_)/im.test(trimmed)) {
        return 'chordpro';
    }

    // Ultimate Guitar: has section headers like [Verse], [Chorus], [Intro] on their own line
    if (/^\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo|Instrumental).*\]\s*$/im.test(trimmed)) {
        return 'ultimate_guitar';
    }

    // Chords over lyrics: alternating lines where one is mostly chords and next is lyrics
    const lines = trimmed.split(/\r?\n/);
    let chordLineCount = 0;
    for (const line of lines) {
        if (isChordLine(line)) chordLineCount++;
    }
    if (chordLineCount >= 2) {
        return 'chords_over_lyrics';
    }

    // Default to chordpro (most forgiving parser)
    return 'chordpro';
}

/**
 * Checks if a line consists primarily of chord names with spacing.
 */
function isChordLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 1) return false;

    // A chord line is mostly whitespace + chord tokens
    // Remove all chord-like tokens and see if only whitespace remains
    const withoutChords = trimmed.replace(/[A-G][#b]?(?:m|min|maj|dim|aug|sus|add)?[0-9]?(?:\/[A-G][#b]?)?/g, '');
    const remaining = withoutChords.trim();

    // If removing chords leaves very little, it's a chord line
    return remaining.length < trimmed.length * 0.3 && trimmed.length > 0;
}

/**
 * Maps ChordSheetJS paragraph types to MCS section types.
 */
function mapSectionType(type: string): string {
    switch (type) {
        case 'verse': return 'verse';
        case 'chorus': return 'chorus';
        case 'bridge': return 'bridge';
        case 'tab': return 'instrumental';
        case 'part': return 'other';
        default: return 'verse';
    }
}

/**
 * Maps ChordSheetJS paragraph types to display labels.
 */
function mapSectionLabel(type: string, index: number): string {
    switch (type) {
        case 'verse': return `Verse ${index + 1}`;
        case 'chorus': return 'Chorus';
        case 'bridge': return 'Bridge';
        case 'tab': return 'Instrumental';
        case 'part': return 'Part';
        default: return `Section ${index + 1}`;
    }
}

/**
 * Converts input text in various formats to MCS YAML.
 */
export function convertToMCS(text: string, options: ImportOptions = {}): string {
    const format = options.format === 'auto' || !options.format
        ? detectFormat(text)
        : options.format;

    let parser: ChordProParser | UltimateGuitarParser | ChordsOverWordsParser;

    switch (format) {
        case 'chordpro':
            parser = new ChordProParser();
            break;
        case 'ultimate_guitar':
            parser = new UltimateGuitarParser();
            break;
        case 'chords_over_lyrics':
            parser = new ChordsOverWordsParser();
            break;
    }

    const song = parser.parse(text);
    return songToMCSYaml(song, options);
}

/**
 * Converts a ChordSheetJS Song object to MCS YAML string.
 */
function songToMCSYaml(song: CSSong, options: ImportOptions): string {
    const rawTitle = options.title || song.title || 'Untitled Song';
    const rawArtist = options.artist || song.artist || 'Unknown Artist';
    const title = escapeYaml(Array.isArray(rawTitle) ? rawTitle[0] : rawTitle);
    const artist = escapeYaml(Array.isArray(rawArtist) ? rawArtist[0] : rawArtist);
    const toStr = (v: string | string[] | null | undefined): string | undefined =>
        v == null ? undefined : Array.isArray(v) ? v[0] : v;
    const key = toStr(song.key);
    const tempo = toStr(song.metadata.get('tempo'));
    const capo = toStr(song.metadata.get('capo'));
    const time = toStr(song.metadata.get('time'));
    const copyright = toStr(song.metadata.get('copyright'));

    let yaml = `schema_version: "1.0"\n`;
    yaml += `metadata:\n`;
    yaml += `  title: "${title}"\n`;
    yaml += `  artist: "${artist}"\n`;
    if (key) yaml += `  key: "${escapeYaml(key)}"\n`;
    if (tempo) yaml += `  tempo: ${parseInt(tempo, 10) || `"${escapeYaml(tempo)}"`}\n`;
    if (time) yaml += `  time_signature: "${escapeYaml(time)}"\n`;
    if (capo) yaml += `  capo: ${parseInt(capo, 10) || `"${escapeYaml(capo)}"`}\n`;
    if (copyright) yaml += `  copyright: "${escapeYaml(copyright)}"\n`;

    yaml += `\nsections:\n`;

    // Track section type counts for labeling (Verse 1, Verse 2, etc.)
    const typeCounts: Record<string, number> = {};

    // Filter out empty/metadata-only paragraphs
    const contentParagraphs = song.paragraphs.filter(p => {
        return p.lines.some(l =>
            l.items.some(item => {
                if ('chords' in item && 'lyrics' in item) {
                    return (item.chords && item.chords.trim()) || (item.lyrics && item.lyrics.trim());
                }
                return false;
            })
        );
    });

    if (contentParagraphs.length === 0) {
        // No content - add a single empty section
        const id = crypto.randomUUID();
        yaml += `  - id: "${id}"\n`;
        yaml += `    label: "Verse 1"\n`;
        yaml += `    type: "verse"\n`;
        yaml += `    lines:\n`;
        yaml += `      - ""\n`;
        return yaml;
    }

    contentParagraphs.forEach((paragraph) => {
        const sectionType = mapSectionType(paragraph.type);
        const typeKey = paragraph.type || 'none';
        typeCounts[typeKey] = (typeCounts[typeKey] || 0) + 1;

        let label: string;
        if (paragraph.type === 'verse' || paragraph.type === 'none' || paragraph.type === 'indeterminate') {
            label = `Verse ${typeCounts[typeKey]}`;
        } else {
            label = mapSectionLabel(paragraph.type, typeCounts[typeKey] - 1);
            if (typeCounts[typeKey] > 1 && paragraph.type !== 'chorus') {
                label = `${label} ${typeCounts[typeKey]}`;
            }
        }

        const id = crypto.randomUUID();
        yaml += `  - id: "${id}"\n`;
        yaml += `    label: "${escapeYaml(label)}"\n`;
        yaml += `    type: "${sectionType}"\n`;
        yaml += `    lines:\n`;

        for (const line of paragraph.lines) {
            const compactLine = lineToCompact(line);
            if (compactLine !== null) {
                yaml += `      - "${escapeYaml(compactLine)}"\n`;
            }
        }
    });

    return yaml;
}

/**
 * Converts a ChordSheetJS Line to MCS compact format: "[C]lyrics [G]more lyrics"
 */
function lineToCompact(line: CSLine): string | null {
    let result = '';
    let hasContent = false;

    for (const item of line.items) {
        if ('chords' in item && 'lyrics' in item) {
            const chord = (item.chords || '').trim();
            const lyrics = item.lyrics || '';

            if (chord) {
                result += `[${chord}]`;
                hasContent = true;
            }
            if (lyrics) {
                result += lyrics;
                hasContent = true;
            }
        }
    }

    if (!hasContent) return null;
    return result;
}

/**
 * Escapes a string for safe inclusion in YAML double-quoted strings.
 */
function escapeYaml(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
