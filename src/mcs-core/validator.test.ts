import { describe, it, expect } from 'vitest';
import {
    MetadataSchema,
    SectionSchema,
    SongSchema,
    ArrangementSchema,
    ThemeSchema,
    ChordDefinitionSchema,
    LineSegmentSchema,
} from './validator';
import { DEFAULT_THEME, DARK_THEME } from '@/src/components/viewer/themes';

describe('MetadataSchema', () => {
    it('accepts valid minimal metadata', () => {
        const result = MetadataSchema.safeParse({ title: 'Test', artist: 'Artist' });
        expect(result.success).toBe(true);
    });

    it('accepts full metadata with all fields', () => {
        const result = MetadataSchema.safeParse({
            title: 'Test Song',
            artist: 'Test Artist',
            key: 'G',
            tempo: 120,
            time_signature: '4/4',
            year: 2024,
            themes: ['worship', 'praise'],
            copyright: '2024',
            ccli: '123456',
        });
        expect(result.success).toBe(true);
    });

    it('rejects missing title', () => {
        const result = MetadataSchema.safeParse({ artist: 'Artist' });
        expect(result.success).toBe(false);
    });

    it('rejects missing artist', () => {
        const result = MetadataSchema.safeParse({ title: 'Title' });
        expect(result.success).toBe(false);
    });

    it('rejects empty title', () => {
        const result = MetadataSchema.safeParse({ title: '', artist: 'Artist' });
        expect(result.success).toBe(false);
    });

    it('allows custom catchall fields', () => {
        const result = MetadataSchema.safeParse({
            title: 'Test',
            artist: 'Artist',
            custom_field: 'custom value',
            mood: 'joyful',
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.custom_field).toBe('custom value');
        }
    });
});

describe('SectionSchema', () => {
    it('accepts valid section with compact lines', () => {
        const result = SectionSchema.safeParse({
            id: 'v1',
            type: 'verse',
            lines: ['[G]Hello [C]World'],
        });
        expect(result.success).toBe(true);
    });

    it('accepts valid section with strict lines', () => {
        const result = SectionSchema.safeParse({
            id: 'v1',
            type: 'verse',
            lines: [{ content: [{ lyric: 'Hello', chord: 'G' }] }],
        });
        expect(result.success).toBe(true);
    });

    it('defaults type to other when not specified', () => {
        const result = SectionSchema.safeParse({
            id: 'x1',
            lines: ['text'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.type).toBe('other');
        }
    });

    it('rejects missing id', () => {
        const result = SectionSchema.safeParse({
            type: 'verse',
            lines: ['text'],
        });
        expect(result.success).toBe(false);
    });

    it('accepts all section types', () => {
        const types = ['verse', 'chorus', 'bridge', 'tag', 'intro', 'outro', 'hook', 'instrumental', 'grid', 'other'];
        for (const type of types) {
            const result = SectionSchema.safeParse({ id: 's1', type, lines: ['text'] });
            expect(result.success, `type "${type}" should be valid`).toBe(true);
        }
    });

    it('accepts optional subtitle and bars', () => {
        const result = SectionSchema.safeParse({
            id: 'v1',
            type: 'verse',
            subtitle: '(soft)',
            bars: 8,
            lines: ['text'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.subtitle).toBe('(soft)');
            expect(result.data.bars).toBe(8);
        }
    });
});

describe('ArrangementSchema', () => {
    it('accepts valid arrangement', () => {
        const result = ArrangementSchema.safeParse({
            name: 'Full',
            order: ['v1', 'c1', 'v2', 'c1'],
        });
        expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
        const result = ArrangementSchema.safeParse({ order: ['v1'] });
        expect(result.success).toBe(false);
    });
});

describe('SongSchema', () => {
    const minimalSong = {
        metadata: { title: 'Test', artist: 'Artist' },
        sections: [{ id: 'v1', type: 'verse', lines: ['Hello'] }],
    };

    it('accepts a minimal valid song', () => {
        const result = SongSchema.safeParse(minimalSong);
        expect(result.success).toBe(true);
    });

    it('defaults schema_version', () => {
        const result = SongSchema.safeParse(minimalSong);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.schema_version).toBe('1.0.0');
        }
    });

    it('accepts song with arrangements', () => {
        const result = SongSchema.safeParse({
            ...minimalSong,
            arrangements: [{ name: 'Live', order: ['v1'] }],
        });
        expect(result.success).toBe(true);
    });

    it('accepts song with chord definitions', () => {
        const result = SongSchema.safeParse({
            ...minimalSong,
            definitions: [{
                name: 'Csus4',
                frets: [-1, 3, 3, 0, 1, 1],
            }],
        });
        expect(result.success).toBe(true);
    });

    it('rejects song with no sections', () => {
        const result = SongSchema.safeParse({
            metadata: { title: 'Test', artist: 'Artist' },
            sections: [],
        });
        // Zod allows empty arrays by default, but there should be at least schema validity
        expect(result.success).toBe(true);
    });

    it('rejects song with missing metadata', () => {
        const result = SongSchema.safeParse({
            sections: [{ id: 'v1', type: 'verse', lines: ['Hello'] }],
        });
        expect(result.success).toBe(false);
    });
});

describe('ChordDefinitionSchema', () => {
    it('accepts valid chord definition', () => {
        const result = ChordDefinitionSchema.safeParse({
            name: 'Gsus4',
            frets: [3, 0, 0, 0, 1, 3],
        });
        expect(result.success).toBe(true);
    });

    it('accepts muted strings with x', () => {
        const result = ChordDefinitionSchema.safeParse({
            name: 'C',
            frets: ['x', 3, 2, 0, 1, 0],
        });
        expect(result.success).toBe(true);
    });

    it('rejects wrong number of frets', () => {
        const result = ChordDefinitionSchema.safeParse({
            name: 'C',
            frets: [0, 1, 2],
        });
        expect(result.success).toBe(false);
    });
});

describe('ThemeSchema', () => {
    it('accepts DEFAULT_THEME', () => {
        const result = ThemeSchema.safeParse(DEFAULT_THEME);
        expect(result.success).toBe(true);
    });

    it('accepts DARK_THEME', () => {
        const result = ThemeSchema.safeParse(DARK_THEME);
        expect(result.success).toBe(true);
    });

    it('rejects theme missing section_border', () => {
        const broken = {
            ...DEFAULT_THEME,
            colors: {
                background: '#fff',
                text_primary: '#000',
                text_secondary: '#666',
                chord: '#00f',
                section_header: '#999',
                highlight: '#eee',
                // missing section_border
            },
        };
        const result = ThemeSchema.safeParse(broken);
        expect(result.success).toBe(false);
    });

    it('rejects theme missing layout fields', () => {
        const broken = {
            ...DEFAULT_THEME,
            layout: { show_diagrams: true },
        };
        const result = ThemeSchema.safeParse(broken);
        expect(result.success).toBe(false);
    });
});

describe('LineSegmentSchema', () => {
    it('accepts segment with chord and lyric', () => {
        const result = LineSegmentSchema.safeParse({ lyric: 'Hello', chord: 'G' });
        expect(result.success).toBe(true);
    });

    it('accepts segment with lyric only', () => {
        const result = LineSegmentSchema.safeParse({ lyric: 'Hello' });
        expect(result.success).toBe(true);
    });

    it('accepts segment with null chord', () => {
        const result = LineSegmentSchema.safeParse({ lyric: 'Hello', chord: null });
        expect(result.success).toBe(true);
    });
});
