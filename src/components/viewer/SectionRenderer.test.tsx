import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionRenderer } from './SectionRenderer';
import { DEFAULT_THEME } from './themes';
import { Section } from '@/mcs-core/model';

const makeSection = (overrides: Partial<Section> = {}): Section => ({
    id: 'v1',
    type: 'verse',
    label: 'Verse 1',
    lines: [
        { content: [{ lyric: 'Hello', chord: 'G' }, { lyric: ' world' }] },
    ],
    ...overrides,
});

describe('SectionRenderer', () => {
    it('renders section label', () => {
        render(<SectionRenderer section={makeSection()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('Verse 1')).toBeDefined();
    });

    it('renders subtitle when present', () => {
        render(<SectionRenderer section={makeSection({ subtitle: '(softly)' })} theme={DEFAULT_THEME} />);
        expect(screen.getByText('(softly)')).toBeDefined();
    });

    it('does not render subtitle when absent', () => {
        render(<SectionRenderer section={makeSection()} theme={DEFAULT_THEME} />);
        expect(screen.queryByText('(softly)')).toBeNull();
    });

    it('renders bar count badge', () => {
        render(<SectionRenderer section={makeSection({ bars: 8 })} theme={DEFAULT_THEME} />);
        expect(screen.getByText('8 bars')).toBeDefined();
    });

    it('does not render bar count when absent', () => {
        render(<SectionRenderer section={makeSection()} theme={DEFAULT_THEME} />);
        expect(screen.queryByText(/bars/)).toBeNull();
    });

    it('applies section_border color from theme', () => {
        const { container } = render(
            <SectionRenderer section={makeSection()} theme={DEFAULT_THEME} />
        );
        const wrapper = container.firstChild as HTMLElement;
        // jsdom converts hex to rgb, so check the style attribute directly
        expect(wrapper.getAttribute('style')).toContain('border-color');
    });

    it('renders chord text from line segments', () => {
        render(<SectionRenderer section={makeSection()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('G')).toBeDefined();
    });

    it('renders lyric text from line segments', () => {
        render(<SectionRenderer section={makeSection()} theme={DEFAULT_THEME} />);
        expect(screen.getByText('Hello')).toBeDefined();
    });
});
