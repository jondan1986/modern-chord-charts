import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SongViewer } from './SongViewer';
import { DEFAULT_THEME } from './themes';
import { Song } from '@/mcs-core/model';

const makeSong = (overrides: Partial<Song> = {}): Song => ({
    schema_version: '1.0.0',
    metadata: {
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        tempo: 80,
        time_signature: '3/4',
    },
    sections: [
        {
            id: 'v1',
            type: 'verse',
            label: 'Verse 1',
            lines: [{ content: [{ chord: 'G', lyric: 'Amazing ' }, { chord: 'C', lyric: 'grace' }] }],
        },
        {
            id: 'c1',
            type: 'chorus',
            label: 'Chorus',
            lines: [{ content: [{ chord: 'D', lyric: 'How sweet' }] }],
        },
    ],
    ...overrides,
});

describe('SongViewer', () => {
    it('renders song title', () => {
        render(<SongViewer song={makeSong()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('Amazing Grace')).toBeDefined();
    });

    it('renders artist name', () => {
        render(<SongViewer song={makeSong()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('John Newton')).toBeDefined();
    });

    it('renders tempo', () => {
        render(<SongViewer song={makeSong()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('80 bpm')).toBeDefined();
    });

    it('renders time signature', () => {
        render(<SongViewer song={makeSong()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('3/4')).toBeDefined();
    });

    it('renders all sections when no arrangements', () => {
        render(<SongViewer song={makeSong()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('Verse 1')).toBeDefined();
        expect(screen.getByText('Chorus')).toBeDefined();
    });

    it('uses first arrangement by default when arrangements exist', () => {
        const song = makeSong({
            arrangements: [
                { name: 'Short', order: ['c1'] },
                { name: 'Full', order: ['v1', 'c1'] },
            ],
        });
        render(<SongViewer song={song} theme={DEFAULT_THEME} />);
        // Short arrangement only has chorus
        expect(screen.getByText('Chorus')).toBeDefined();
        expect(screen.queryByText('Verse 1')).toBeNull();
    });

    it('shows arrangement selector only with 2+ arrangements', () => {
        const song = makeSong({
            arrangements: [
                { name: 'Short', order: ['c1'] },
                { name: 'Full', order: ['v1', 'c1'] },
            ],
        });
        render(<SongViewer song={song} theme={DEFAULT_THEME} />);
        expect(screen.getByText('Short')).toBeDefined();
        expect(screen.getByText('Full')).toBeDefined();
        expect(screen.getByText('ARRANGEMENT')).toBeDefined();
    });

    it('hides arrangement selector with only 1 arrangement', () => {
        const song = makeSong({
            arrangements: [{ name: 'Only', order: ['v1'] }],
        });
        render(<SongViewer song={song} theme={DEFAULT_THEME} />);
        expect(screen.queryByText('ARRANGEMENT')).toBeNull();
    });

    it('applies forceSingleColumn (no md:columns-2 class)', () => {
        const theme = { ...DEFAULT_THEME, layout: { ...DEFAULT_THEME.layout, two_column: true } };
        const { container } = render(
            <SongViewer song={makeSong()} theme={theme} forceSingleColumn />
        );
        const sectionsDiv = container.querySelector('.gap-6');
        expect(sectionsDiv?.className).toContain('columns-1');
        expect(sectionsDiv?.className).not.toContain('md:columns-2');
    });

    it('allows two-column when forceSingleColumn is not set', () => {
        const theme = { ...DEFAULT_THEME, layout: { ...DEFAULT_THEME.layout, two_column: true } };
        const { container } = render(
            <SongViewer song={makeSong()} theme={theme} />
        );
        const sectionsDiv = container.querySelector('.gap-6');
        expect(sectionsDiv?.className).toContain('md:columns-2');
    });

    it('renders custom metadata fields', () => {
        const song = makeSong();
        song.metadata.mood = 'joyful';
        render(<SongViewer song={song} theme={DEFAULT_THEME} />);
        expect(screen.getByText(/mood/i)).toBeDefined();
        expect(screen.getByText(/joyful/i)).toBeDefined();
    });
});
