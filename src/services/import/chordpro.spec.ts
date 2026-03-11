import { describe, it, expect } from 'vitest';
import { ChordProConverter } from './chordpro';

describe('ChordProConverter', () => {
    it('converts basic ChordPro format', () => {
        const input = `
{title: Amazing Grace}
{artist: John Newton}
{key: G}

{c: Verse 1}
[G]Amazing [C]Grace, how [G]sweet the sound
That [G]saved a wretch like [D]me

{c: Chorus}
[G]I once was lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see
`;
        const result = ChordProConverter.convert(input);

        expect(result).toContain('title: "Amazing Grace"');
        expect(result).toContain('artist: "John Newton"');
        expect(result).toContain('key: "G"');

        expect(result).toContain('label: "Verse 1"');
        expect(result).toContain('type: "verse"');
        expect(result).toContain('- "[G]Amazing [C]Grace, how [G]sweet the sound"');

        // {c: Chorus} is a comment directive — it becomes a subtitle on the current section
        expect(result).toContain('subtitle: "Chorus"');
    });

    it('handles start_of_chorus directive', () => {
        const input = `
{t: Test Song}
{st: Test Artist}

{soc}
[C]This is the chorus
{eoc}
`;
        const result = ChordProConverter.convert(input);
        expect(result).toContain('label: "Chorus"');
        expect(result).toContain('type: "chorus"');
        expect(result).toContain('- "[C]This is the chorus"');
    });

    it('infers section from name', () => {
        const input = `
{t: Test}
Chorus:
[C]Valid line
`;
        const result = ChordProConverter.convert(input);
        expect(result).toContain('label: "Chorus"');
        expect(result).toContain('type: "chorus"');
    });
});
