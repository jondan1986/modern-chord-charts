// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { convertPraiseChartsToMCS } from './converter';
import type { PraiseChartsChordChart } from './types';

// Helper to extract a value from the YAML output
const getYamlValue = (yaml: string, key: string): string | undefined => {
    const match = yaml.match(new RegExp(`${key}:\\s*"?([^"\\n]+)"?`));
    return match?.[1];
};

// Helper to extract all sections as simple objects
const getSections = (yaml: string) => {
    const sections: { label: string; type: string; lines: string[] }[] = [];
    const sectionBlocks = yaml.split(/  - id: "/);
    for (let i = 1; i < sectionBlocks.length; i++) {
        const block = sectionBlocks[i];
        const label = block.match(/label: "([^"]+)"/)?.[1] ?? '';
        const type = block.match(/type: "([^"]+)"/)?.[1] ?? '';
        const lineMatches = [...block.matchAll(/      - "([^"]*)"/g)];
        const lines = lineMatches.map(m => m[1]);
        sections.push({ label, type, lines });
    }
    return sections;
};

describe('convertPraiseChartsToMCS', () => {
    it('converts a complete chart with metadata', () => {
        const chart: PraiseChartsChordChart = {
            id: 'pc-123',
            songId: 'song-456',
            title: 'Amazing Grace',
            artist: 'John Newton',
            key: 'G',
            copyright: '2024 Publisher',
            ccli: '12345',
            sections: [
                {
                    label: 'Verse 1',
                    type: 'verse',
                    lines: [
                        { chords: ['G', 'C'], lyrics: 'Amazing grace how sweet' },
                        { chords: ['G', 'D'], lyrics: 'That saved a wretch' },
                    ],
                },
                {
                    label: 'Chorus',
                    type: 'chorus',
                    lines: [
                        { chords: ['C', 'G'], lyrics: 'I once was lost' },
                    ],
                },
            ],
        };

        const yaml = convertPraiseChartsToMCS(chart);

        expect(getYamlValue(yaml, 'title')).toBe('Amazing Grace');
        expect(getYamlValue(yaml, 'artist')).toBe('John Newton');
        expect(getYamlValue(yaml, 'key')).toBe('G');
        expect(yaml).toContain('ccli: "12345"');
        expect(yaml).toContain('copyright: "2024 Publisher"');
        expect(yaml).toContain('praisecharts_id: "pc-123"');

        const sections = getSections(yaml);
        expect(sections).toHaveLength(2);
        expect(sections[0].type).toBe('verse');
        expect(sections[0].label).toBe('Verse 1');
        expect(sections[1].type).toBe('chorus');
        expect(sections[1].label).toBe('Chorus');
    });

    it('maps section types correctly', () => {
        const chart: PraiseChartsChordChart = {
            id: 'pc-1',
            songId: 's-1',
            title: 'Test',
            artist: 'Artist',
            key: 'C',
            sections: [
                { label: 'Intro', type: 'intro', lines: [{ chords: ['C'], lyrics: '' }] },
                { label: 'Verse', type: 'verse', lines: [{ chords: ['G'], lyrics: 'Hello' }] },
                { label: 'Pre-Chorus', type: 'pre-chorus', lines: [{ chords: ['Am'], lyrics: 'Ooh' }] },
                { label: 'Chorus', type: 'chorus', lines: [{ chords: ['F'], lyrics: 'Yeah' }] },
                { label: 'Bridge', type: 'bridge', lines: [{ chords: ['Dm'], lyrics: 'Whoa' }] },
                { label: 'Tag', type: 'tag', lines: [{ chords: ['C'], lyrics: 'End' }] },
                { label: 'Outro', type: 'outro', lines: [{ chords: ['C'], lyrics: '' }] },
            ],
        };

        const yaml = convertPraiseChartsToMCS(chart);
        const sections = getSections(yaml);

        expect(sections.map(s => s.type)).toEqual([
            'intro', 'verse', 'other', 'chorus', 'bridge', 'tag', 'outro',
        ]);
    });

    it('produces compact chord format in lines', () => {
        const chart: PraiseChartsChordChart = {
            id: 'pc-1',
            songId: 's-1',
            title: 'Test',
            artist: 'Artist',
            key: 'C',
            sections: [
                {
                    label: 'Verse',
                    type: 'verse',
                    lines: [
                        { chords: ['G', 'C', 'D'], lyrics: 'Hello beautiful world' },
                    ],
                },
            ],
        };

        const yaml = convertPraiseChartsToMCS(chart);
        const sections = getSections(yaml);

        // Each word should get a chord prefix
        expect(sections[0].lines[0]).toContain('[G]');
        expect(sections[0].lines[0]).toContain('[C]');
        expect(sections[0].lines[0]).toContain('[D]');
    });

    it('handles chords-only lines (no lyrics)', () => {
        const chart: PraiseChartsChordChart = {
            id: 'pc-1',
            songId: 's-1',
            title: 'Test',
            artist: 'Artist',
            key: 'C',
            sections: [
                {
                    label: 'Intro',
                    type: 'intro',
                    lines: [
                        { chords: ['C', 'G', 'Am', 'F'], lyrics: '' },
                    ],
                },
            ],
        };

        const yaml = convertPraiseChartsToMCS(chart);
        const sections = getSections(yaml);

        expect(sections[0].lines[0]).toBe('[C] [G] [Am] [F]');
    });

    it('handles empty chart gracefully', () => {
        const chart: PraiseChartsChordChart = {
            id: 'pc-1',
            songId: 's-1',
            title: 'Empty Song',
            artist: 'Nobody',
            key: 'C',
            sections: [],
        };

        const yaml = convertPraiseChartsToMCS(chart);
        expect(yaml).toContain('schema_version');
        expect(yaml).toContain('sections:');
        expect(getYamlValue(yaml, 'title')).toBe('Empty Song');
    });

    it('escapes quotes in metadata', () => {
        const chart: PraiseChartsChordChart = {
            id: 'pc-1',
            songId: 's-1',
            title: 'He Said "Yes"',
            artist: 'The "Band"',
            key: 'C',
            sections: [
                { label: 'Verse', type: 'verse', lines: [{ chords: ['C'], lyrics: 'Hello' }] },
            ],
        };

        const yaml = convertPraiseChartsToMCS(chart);
        expect(yaml).toContain('He Said \\"Yes\\"');
        expect(yaml).toContain('The \\"Band\\"');
    });
});
