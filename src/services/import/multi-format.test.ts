// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectFormat, convertToMCS } from './multi-format';

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

describe('detectFormat', () => {
    it('detects ChordPro by directives', () => {
        expect(detectFormat('{title: Test}\n{sov}\n[G]Hello\n{eov}')).toBe('chordpro');
    });

    it('detects Ultimate Guitar by section headers', () => {
        expect(detectFormat('[Verse]\n G        C\nHello world\n\n[Chorus]\n Am    F\nGoodbye')).toBe('ultimate_guitar');
    });

    it('detects chords over lyrics format', () => {
        expect(detectFormat('G        C      G\nAmazing grace how sweet\n G     Em    D\nThat saved a wretch')).toBe('chords_over_lyrics');
    });

    it('defaults to chordpro for ambiguous input', () => {
        expect(detectFormat('Just some text with no chords')).toBe('chordpro');
    });
});

describe('convertToMCS', () => {
    describe('ChordPro format', () => {
        it('converts ChordPro with metadata and sections', () => {
            const input = `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 80}

{start_of_verse: Verse 1}
[G]Amazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
{end_of_verse}

{start_of_chorus}
[G]I once was [G/B]lost but [C]now am [G]found
{end_of_chorus}`;

            const yaml = convertToMCS(input, { format: 'chordpro' });
            expect(getYamlValue(yaml, 'title')).toBe('Amazing Grace');
            expect(getYamlValue(yaml, 'artist')).toBe('John Newton');
            expect(getYamlValue(yaml, 'key')).toBe('G');
            expect(yaml).toContain('tempo: 80');

            const sections = getSections(yaml);
            expect(sections.length).toBeGreaterThanOrEqual(2);

            // Find verse and chorus sections
            const verse = sections.find(s => s.type === 'verse');
            const chorus = sections.find(s => s.type === 'chorus');
            expect(verse).toBeDefined();
            expect(chorus).toBeDefined();

            // Verify compact chord format in lines
            expect(verse!.lines[0]).toContain('[G]');
            expect(chorus!.lines[0]).toContain('[G]');
        });

        it('handles ChordPro with capo and copyright', () => {
            const input = `{title: Test}
{capo: 3}
{copyright: 2024 Publisher}

{sov}
[G]Hello
{eov}`;

            const yaml = convertToMCS(input, { format: 'chordpro' });
            expect(yaml).toContain('capo: 3');
            expect(yaml).toContain('copyright:');
        });

        it('defaults title and artist when not provided', () => {
            const yaml = convertToMCS('[G]Hello world', { format: 'chordpro' });
            expect(getYamlValue(yaml, 'title')).toBe('Untitled Song');
            expect(getYamlValue(yaml, 'artist')).toBe('Unknown Artist');
        });

        it('uses override title and artist', () => {
            const yaml = convertToMCS('[G]Hello world', {
                format: 'chordpro',
                title: 'My Song',
                artist: 'My Artist',
            });
            expect(getYamlValue(yaml, 'title')).toBe('My Song');
            expect(getYamlValue(yaml, 'artist')).toBe('My Artist');
        });
    });

    describe('Ultimate Guitar format', () => {
        it('converts UG format with section headers and chords over lyrics', () => {
            const input = `[Verse]
 G        C      G
Amazing grace how sweet the sound
 G     Em    D
That saved a wretch like me

[Chorus]
 G        C      G
I once was lost but now am found`;

            const yaml = convertToMCS(input, { format: 'ultimate_guitar' });
            const sections = getSections(yaml);

            expect(sections.length).toBeGreaterThanOrEqual(2);

            const verse = sections.find(s => s.type === 'verse');
            const chorus = sections.find(s => s.type === 'chorus');
            expect(verse).toBeDefined();
            expect(chorus).toBeDefined();

            // Should have chord annotations in compact format
            expect(verse!.lines.some(l => l.includes('[G]'))).toBe(true);
            expect(chorus!.lines.some(l => l.includes('[G]'))).toBe(true);
        });
    });

    describe('Chords over lyrics format', () => {
        it('converts plain chords-over-lyrics text', () => {
            const input = ` G        C      G
Amazing grace how sweet the sound
 G     Em    D
That saved a wretch like me`;

            const yaml = convertToMCS(input, { format: 'chords_over_lyrics' });

            expect(yaml).toContain('schema_version');
            expect(yaml).toContain('sections:');

            const sections = getSections(yaml);
            expect(sections.length).toBeGreaterThanOrEqual(1);
            // Should have chord content
            expect(sections.some(s => s.lines.some(l => l.includes('[')))).toBe(true);
        });
    });

    describe('auto-detection', () => {
        it('auto-detects ChordPro', () => {
            const input = '{title: Test}\n{sov}\n[G]Hello\n{eov}';
            const yaml = convertToMCS(input);
            expect(getYamlValue(yaml, 'title')).toBe('Test');
        });

        it('auto-detects Ultimate Guitar', () => {
            const input = `[Verse]
 G     C
Hello world`;
            const yaml = convertToMCS(input);
            const sections = getSections(yaml);
            expect(sections.some(s => s.type === 'verse')).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('handles empty input gracefully', () => {
            const yaml = convertToMCS('');
            expect(yaml).toContain('schema_version');
            expect(yaml).toContain('sections:');
        });

        it('escapes quotes in content', () => {
            const yaml = convertToMCS('{title: He said "hello"}\n{sov}\n[G]She said "goodbye"\n{eov}', { format: 'chordpro' });
            expect(yaml).toContain('He said \\"hello\\"');
        });

        it('produces valid MCS with schema_version and metadata', () => {
            const yaml = convertToMCS('[G]Simple line', { format: 'chordpro' });
            expect(yaml).toMatch(/^schema_version: "1\.0"/);
            expect(yaml).toContain('metadata:');
            expect(yaml).toContain('sections:');
        });
    });
});
