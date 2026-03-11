import { describe, it, expect } from 'vitest';
import { ChordService } from './chord-db';

describe('ChordService.getChord', () => {
    describe('guitar lookups', () => {
        it('finds C major chord', () => {
            const chord = ChordService.getChord('guitar', 'C');
            expect(chord).not.toBeNull();
            expect(chord!.key).toBe('C');
            expect(chord!.suffix).toBe('major');
            expect(chord!.positions.length).toBeGreaterThan(0);
        });

        it('finds Am (minor) chord', () => {
            const chord = ChordService.getChord('guitar', 'Am');
            expect(chord).not.toBeNull();
            expect(chord!.key).toBe('A');
            expect(chord!.suffix).toBe('minor');
        });

        it('finds G7 chord', () => {
            const chord = ChordService.getChord('guitar', 'G7');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('7');
        });

        it('finds Ebm (Eb exists in DB)', () => {
            const chord = ChordService.getChord('guitar', 'Ebm');
            expect(chord).not.toBeNull();
            expect(chord!.key).toBe('Eb');
            expect(chord!.suffix).toBe('minor');
        });

        it('normalizes D# to Eb for lookup', () => {
            const chord = ChordService.getChord('guitar', 'D#');
            expect(chord).not.toBeNull();
            expect(chord!.key).toBe('Eb');
            expect(chord!.suffix).toBe('major');
        });

        it('normalizes A# to Bb for lookup', () => {
            const chord = ChordService.getChord('guitar', 'A#m');
            expect(chord).not.toBeNull();
            expect(chord!.key).toBe('Bb');
            expect(chord!.suffix).toBe('minor');
        });
    });

    describe('suffix mapping', () => {
        it('maps "Cmaj" to major', () => {
            const chord = ChordService.getChord('guitar', 'Cmaj');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('major');
        });

        it('maps "Cmin" to minor', () => {
            const chord = ChordService.getChord('guitar', 'Cmin');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('minor');
        });

        it('maps "C-" to minor', () => {
            const chord = ChordService.getChord('guitar', 'C-');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('minor');
        });

        it('maps "CM" to major', () => {
            const chord = ChordService.getChord('guitar', 'CM');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('major');
        });
    });

    describe('ukulele lookups', () => {
        it('finds C major on ukulele', () => {
            const chord = ChordService.getChord('ukulele', 'C');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('major');
        });

        it('finds Am on ukulele', () => {
            const chord = ChordService.getChord('ukulele', 'Am');
            expect(chord).not.toBeNull();
            expect(chord!.suffix).toBe('minor');
        });
    });

    describe('edge cases', () => {
        it('returns null for piano instrument', () => {
            expect(ChordService.getChord('piano', 'C')).toBeNull();
        });

        it('returns null for invalid chord name', () => {
            expect(ChordService.getChord('guitar', 'XYZ')).toBeNull();
        });

        it('returns null for empty string', () => {
            expect(ChordService.getChord('guitar', '')).toBeNull();
        });
    });
});
