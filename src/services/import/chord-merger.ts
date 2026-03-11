// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

/**
 * Merges chord data from an external source into an existing lyrics-only MCS YAML.
 *
 * Strategy:
 * 1. Parse both YAML strings to extract sections
 * 2. Match sections by type and label (fuzzy)
 * 3. For matched sections, overlay chords from source onto target lyrics
 * 4. Preserve target metadata (including PCO IDs)
 */

interface ParsedSection {
    id: string;
    label: string;
    type: string;
    subtitle?: string;
    lines: string[];
}

/**
 * Extract sections from MCS YAML using regex (avoids YAML parser dependency).
 */
function extractSections(yaml: string): ParsedSection[] {
    const sections: ParsedSection[] = [];
    const sectionBlocks = yaml.split(/  - id: "/);

    for (let i = 1; i < sectionBlocks.length; i++) {
        const block = sectionBlocks[i];
        const id = block.match(/^([^"]+)"/)?.[1] ?? crypto.randomUUID();
        const label = block.match(/label: "([^"]+)"/)?.[1] ?? '';
        const type = block.match(/type: "([^"]+)"/)?.[1] ?? 'verse';
        const subtitle = block.match(/subtitle: "([^"]+)"/)?.[1];
        const lineMatches = [...block.matchAll(/      - "([^"]*)"/g)];
        const lines = lineMatches.map(m => m[1]);
        sections.push({ id, label, type, subtitle, lines });
    }

    return sections;
}

/**
 * Extract the metadata block (everything before "sections:") from MCS YAML.
 */
function extractMetadataBlock(yaml: string): string {
    const sectionsIndex = yaml.indexOf('\nsections:');
    if (sectionsIndex === -1) return yaml;
    return yaml.substring(0, sectionsIndex);
}

/**
 * Normalize a section label for matching (lowercase, strip numbers and spaces).
 */
function normalizeLabel(label: string): string {
    return label.toLowerCase().replace(/\s*\d+\s*$/, '').trim();
}

/**
 * Match source sections to target sections by type and label.
 * Returns a Map from target section index to source section index.
 */
function matchSections(
    targetSections: ParsedSection[],
    sourceSections: ParsedSection[]
): Map<number, number> {
    const matches = new Map<number, number>();
    const usedSource = new Set<number>();

    // First pass: exact type + label match
    for (let ti = 0; ti < targetSections.length; ti++) {
        const target = targetSections[ti];
        for (let si = 0; si < sourceSections.length; si++) {
            if (usedSource.has(si)) continue;
            const source = sourceSections[si];
            if (
                target.type === source.type &&
                normalizeLabel(target.label) === normalizeLabel(source.label)
            ) {
                matches.set(ti, si);
                usedSource.add(si);
                break;
            }
        }
    }

    // Second pass: type-only match for unmatched sections
    for (let ti = 0; ti < targetSections.length; ti++) {
        if (matches.has(ti)) continue;
        const target = targetSections[ti];
        for (let si = 0; si < sourceSections.length; si++) {
            if (usedSource.has(si)) continue;
            const source = sourceSections[si];
            if (target.type === source.type) {
                matches.set(ti, si);
                usedSource.add(si);
                break;
            }
        }
    }

    // Third pass: sequential match for remaining unmatched
    for (let ti = 0; ti < targetSections.length; ti++) {
        if (matches.has(ti)) continue;
        for (let si = 0; si < sourceSections.length; si++) {
            if (usedSource.has(si)) continue;
            matches.set(ti, si);
            usedSource.add(si);
            break;
        }
    }

    return matches;
}

/**
 * Extract just the chord annotations from a compact MCS line.
 * "[C]Hello [G]world" → ["C", "G"]
 */
function extractChords(line: string): string[] {
    const matches = [...line.matchAll(/\[([^\]]+)\]/g)];
    return matches.map(m => m[1]);
}

/**
 * Check if a line has chord annotations.
 */
function hasChords(line: string): boolean {
    return /\[[A-G][^\]]*\]/.test(line);
}

/**
 * Strip chord annotations from a line, returning lyrics only.
 */
function stripChords(line: string): string {
    return line.replace(/\[[^\]]+\]/g, '').trim();
}

/**
 * Merge chords from a source line onto a target lyrics line.
 * Distributes source chords across target lyrics at word boundaries.
 */
function mergeLineChords(targetLine: string, sourceLine: string): string {
    const sourceChords = extractChords(sourceLine);
    if (sourceChords.length === 0) return targetLine;

    // If target already has chords, keep them
    if (hasChords(targetLine)) return targetLine;

    const lyrics = stripChords(targetLine) || targetLine;
    if (!lyrics.trim()) {
        // No lyrics, just return chords
        return sourceChords.map(c => `[${c}]`).join(' ');
    }

    // Distribute chords at word boundaries
    const words = lyrics.split(/(\s+)/);
    const nonSpaceWords = words.filter(w => w.trim());
    let result = '';
    let chordIdx = 0;

    for (const word of words) {
        if (word.trim() && chordIdx < sourceChords.length) {
            result += `[${sourceChords[chordIdx]}]`;
            chordIdx++;
        }
        result += word;
    }

    // Append remaining chords
    while (chordIdx < sourceChords.length) {
        result += ` [${sourceChords[chordIdx]}]`;
        chordIdx++;
    }

    return result;
}

/**
 * Escape a string for safe YAML double-quoted string.
 */
function escapeYaml(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Merge chord data from a source MCS YAML into a target (lyrics-only) MCS YAML.
 * Preserves all target metadata and section structure.
 */
export function mergeChords(targetYaml: string, sourceYaml: string): string {
    const targetMeta = extractMetadataBlock(targetYaml);
    const targetSections = extractSections(targetYaml);
    const sourceSections = extractSections(sourceYaml);

    if (sourceSections.length === 0) return targetYaml;

    const sectionMatches = matchSections(targetSections, sourceSections);

    // Build merged sections
    let yaml = targetMeta + '\n\nsections:\n';

    for (let ti = 0; ti < targetSections.length; ti++) {
        const target = targetSections[ti];
        const si = sectionMatches.get(ti);
        const source = si !== undefined ? sourceSections[si] : undefined;

        yaml += `  - id: "${target.id}"\n`;
        yaml += `    label: "${escapeYaml(target.label)}"\n`;
        yaml += `    type: "${target.type}"\n`;
        if (target.subtitle) {
            yaml += `    subtitle: "${escapeYaml(target.subtitle)}"\n`;
        }
        yaml += `    lines:\n`;

        if (source) {
            // Merge chords from source into target lines
            const maxLines = Math.max(target.lines.length, source.lines.length);
            for (let li = 0; li < maxLines; li++) {
                const targetLine = li < target.lines.length ? target.lines[li] : '';
                const sourceLine = li < source.lines.length ? source.lines[li] : '';

                // If target has no line here, use the source line as-is (it has both chords and lyrics)
                const merged = !targetLine && sourceLine ? sourceLine : mergeLineChords(targetLine, sourceLine);
                yaml += `      - "${escapeYaml(merged)}"\n`;
            }
        } else {
            // No matching source section, keep target lines as-is
            for (const line of target.lines) {
                yaml += `      - "${escapeYaml(line)}"\n`;
            }
        }
    }

    return yaml;
}
