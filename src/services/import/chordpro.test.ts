// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ChordProConverter } from './chordpro';

// Helper to extract a value from the YAML output
const getYamlValue = (yaml: string, key: string): string | undefined => {
    const match = yaml.match(new RegExp(`${key}:\\s*"?([^"\\n]+)"?`));
    return match?.[1];
};

// Helper to extract all sections as simple objects
const getSections = (yaml: string) => {
    const sections: { label: string; type: string; subtitle?: string; lines: string[] }[] = [];
    const sectionBlocks = yaml.split(/  - id: "/);
    // Skip the first block (metadata)
    for (let i = 1; i < sectionBlocks.length; i++) {
        const block = sectionBlocks[i];
        const label = block.match(/label: "([^"]+)"/)?.[1] ?? '';
        const type = block.match(/type: "([^"]+)"/)?.[1] ?? '';
        const subtitle = block.match(/subtitle: "([^"]+)"/)?.[1];
        const lineMatches = [...block.matchAll(/      - "([^"]+)"/g)];
        const lines = lineMatches.map(m => m[1]);
        sections.push({ label, type, subtitle, ...(subtitle ? { subtitle } : {}), lines });
    }
    return sections;
};

describe('ChordProConverter', () => {
    describe('basic metadata parsing', () => {
        it('parses title and artist', () => {
            const input = `{title: Amazing Grace}
{artist: John Newton}`;
            const yaml = ChordProConverter.convert(input);
            expect(getYamlValue(yaml, 'title')).toBe('Amazing Grace');
            expect(getYamlValue(yaml, 'artist')).toBe('John Newton');
        });

        it('parses short-form title and subtitle', () => {
            const input = `{t: My Song}
{st: The Artist}`;
            const yaml = ChordProConverter.convert(input);
            expect(getYamlValue(yaml, 'title')).toBe('My Song');
            expect(getYamlValue(yaml, 'artist')).toBe('The Artist');
        });

        it('parses key and tempo', () => {
            const input = `{title: Test}
{key: G}
{tempo: 120}`;
            const yaml = ChordProConverter.convert(input);
            expect(getYamlValue(yaml, 'key')).toBe('G');
            expect(yaml).toContain('tempo: 120');
        });

        it('defaults title and artist when not provided', () => {
            const yaml = ChordProConverter.convert('[C]Hello');
            expect(getYamlValue(yaml, 'title')).toBe('Untitled Song');
            expect(getYamlValue(yaml, 'artist')).toBe('Unknown Artist');
        });
    });

    describe('capo and copyright directives', () => {
        it('parses capo directive', () => {
            const input = `{title: Test}
{capo: 3}
{sov}
[G]Hello
{eov}`;
            const yaml = ChordProConverter.convert(input);
            expect(yaml).toContain('capo: 3');
        });

        it('parses copyright directive', () => {
            const input = `{title: Test}
{copyright: 2024 Some Publisher}`;
            const yaml = ChordProConverter.convert(input);
            expect(yaml).toContain('copyright: "2024 Some Publisher"');
        });
    });

    describe('section creation via start/end directives', () => {
        it('creates verse section with {sov}/{eov}', () => {
            const input = `{sov}
[G]Amazing [C]Grace
{eov}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(1);
            expect(sections[0].label).toBe('Verse');
            expect(sections[0].type).toBe('verse');
        });

        it('creates chorus section with {soc}/{eoc}', () => {
            const input = `{soc}
[C]Hallelujah
{eoc}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(1);
            expect(sections[0].label).toBe('Chorus');
            expect(sections[0].type).toBe('chorus');
        });

        it('creates bridge section with {sob}/{eob}', () => {
            const input = `{sob}
[Am]Bridge line
{eob}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(1);
            expect(sections[0].label).toBe('Bridge');
            expect(sections[0].type).toBe('bridge');
        });

        it('creates tab/instrumental section with {sot}/{eot}', () => {
            const input = `{sot}
e|---0---
{eot}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(1);
            expect(sections[0].label).toBe('Tab');
            expect(sections[0].type).toBe('instrumental');
        });
    });

    describe('comment directive does NOT create a chorus', () => {
        it('{comment:} adds subtitle to current section, not a new chorus', () => {
            const input = `{sov}
{c: Play softly}
[G]Line one
{eov}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(1);
            expect(sections[0].type).toBe('verse');
            expect(sections[0].subtitle).toBe('Play softly');
        });

        it('{c:} without a current section does not create a chorus', () => {
            const input = `{title: Test}
{c: Some comment}
{sov}
[G]Line
{eov}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            // The comment is ignored since there's no current section
            // Only the verse section should exist
            expect(sections).toHaveLength(1);
            expect(sections[0].type).toBe('verse');
        });
    });

    describe('section types are preserved correctly (not re-inferred from label)', () => {
        it('preserves type even when label does not match type', () => {
            // A tab section has label "Tab" but type "instrumental"
            const input = `{sot}
e|---0---
{eot}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections[0].type).toBe('instrumental');
            // Before the fix, this would have been "other" because "Tab" doesn't match any re-inference keyword
        });

        it('uses explicit type from startSection, not label-based inference', () => {
            const input = `{sob}
[Em]Something
{eob}
{soc}
[C]Chorus line
{eoc}`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections[0].type).toBe('bridge');
            expect(sections[1].type).toBe('chorus');
        });
    });

    describe('orphan lines before any section create a default verse', () => {
        it('creates a default "Verse 1" section for orphan lines', () => {
            const input = `{title: Test}
[C]Orphan line before any section`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(1);
            expect(sections[0].label).toBe('Verse 1');
            expect(sections[0].type).toBe('verse');
            expect(sections[0].lines).toHaveLength(1);
        });
    });

    describe('end_of_* directives close sections properly', () => {
        it('orphan content after {eov} creates a new section', () => {
            const input = `{sov}
[G]Verse line
{eov}
[C]Orphan line`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(2);
            expect(sections[0].type).toBe('verse');
            expect(sections[1].label).toBe('Verse 1');
        });

        it('orphan content after {eoc} creates a new section', () => {
            const input = `{soc}
[G]Chorus line
{eoc}
[C]Another line`;
            const yaml = ChordProConverter.convert(input);
            const sections = getSections(yaml);
            expect(sections).toHaveLength(2);
            expect(sections[0].type).toBe('chorus');
        });
    });
});
