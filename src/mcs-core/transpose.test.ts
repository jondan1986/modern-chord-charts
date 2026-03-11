import { describe, it, expect } from 'vitest';
import { transposeNote, transposeChord, getTargetKey, getKeyPreference } from './transpose';

describe('transposeNote', () => {
    it('transposes up with sharp preference', () => {
        expect(transposeNote('C', 2, 'sharp')).toBe('D');
        expect(transposeNote('C', 1, 'sharp')).toBe('C#');
        expect(transposeNote('A', 3, 'sharp')).toBe('C');
    });

    it('transposes up with flat preference', () => {
        expect(transposeNote('C', 1, 'flat')).toBe('Db');
        expect(transposeNote('D', 1, 'flat')).toBe('Eb');
        expect(transposeNote('G', 1, 'flat')).toBe('Ab');
    });

    it('transposes down (negative steps)', () => {
        expect(transposeNote('D', -2, 'sharp')).toBe('C');
        expect(transposeNote('C', -1, 'flat')).toBe('B');
        expect(transposeNote('E', -1, 'sharp')).toBe('D#');
    });

    it('wraps around the octave', () => {
        expect(transposeNote('B', 1, 'sharp')).toBe('C');
        expect(transposeNote('C', 12, 'sharp')).toBe('C');
        expect(transposeNote('G', -12, 'sharp')).toBe('G');
    });

    it('returns unknown notes as-is', () => {
        expect(transposeNote('N.C.', 3, 'sharp')).toBe('N.C.');
        expect(transposeNote('X', 1, 'sharp')).toBe('X');
    });

    it('defaults to sharp preference', () => {
        expect(transposeNote('C', 1)).toBe('C#');
    });
});

describe('transposeChord', () => {
    it('transposes simple major chords', () => {
        expect(transposeChord('G', 2, 'sharp')).toBe('A');
        expect(transposeChord('C', 5, 'flat')).toBe('F');
    });

    it('transposes minor chords preserving quality', () => {
        expect(transposeChord('Am', 3, 'flat')).toBe('Cm');
        expect(transposeChord('Em', 2, 'sharp')).toBe('F#m');
    });

    it('transposes complex chord qualities', () => {
        expect(transposeChord('Cmaj7', 5, 'flat')).toBe('Fmaj7');
        expect(transposeChord('G7', 2, 'sharp')).toBe('A7');
        expect(transposeChord('Dm7b5', 2, 'flat')).toBe('Em7b5');
    });

    it('transposes slash chords (root and bass)', () => {
        expect(transposeChord('C/E', 2, 'sharp')).toBe('D/F#');
        expect(transposeChord('G/B', 3, 'flat')).toBe('Bb/D');
    });

    it('returns empty/null chords as-is', () => {
        expect(transposeChord('', 3, 'sharp')).toBe('');
    });

    it('returns non-chord strings as-is', () => {
        expect(transposeChord('N.C.', 2, 'sharp')).toBe('N.C.');
    });
});

describe('getTargetKey', () => {
    it('returns common key names', () => {
        expect(getTargetKey('C', 5)).toBe('F');
        expect(getTargetKey('C', 7)).toBe('G');
        expect(getTargetKey('G', 5)).toBe('C');
    });

    it('prefers flat names for common flat keys', () => {
        expect(getTargetKey('C', 1)).toBe('Db');
        expect(getTargetKey('C', 3)).toBe('Eb');
        expect(getTargetKey('C', 10)).toBe('Bb');
    });

    it('handles minor keys', () => {
        expect(getTargetKey('Am', 3)).toBe('Cm');
        expect(getTargetKey('Am', 5)).toBe('Dm');
    });

    it('returns original key when transposing by 0', () => {
        expect(getTargetKey('C', 0)).toBe('C');
        expect(getTargetKey('G', 0)).toBe('G');
    });

    it('falls back to C for unrecognized root', () => {
        // 'X' doesn't match /^([A-G]...)/ so root defaults to "C"
        // Transposing C by 3 = Eb
        expect(getTargetKey('X', 3)).toBe('Eb');
    });
});

describe('getKeyPreference', () => {
    it('returns sharp for sharp keys', () => {
        expect(getKeyPreference('C')).toBe('sharp');
        expect(getKeyPreference('G')).toBe('sharp');
        expect(getKeyPreference('D')).toBe('sharp');
        expect(getKeyPreference('A')).toBe('sharp');
    });

    it('returns flat for flat keys', () => {
        expect(getKeyPreference('F')).toBe('flat');
        expect(getKeyPreference('Bb')).toBe('flat');
        expect(getKeyPreference('Eb')).toBe('flat');
    });

    it('handles minor keys', () => {
        // Function strips 'm' first, looks up root in KEY_PREFERENCE
        // 'Am' -> strips to 'A' -> not in KEY_PREFERENCE as root, then checks 'Am' -> sharp
        // 'Dm' -> strips to 'D' -> KEY_PREFERENCE['D'] = sharp
        // 'Em' -> strips to 'E' -> KEY_PREFERENCE['E'] = sharp
        expect(getKeyPreference('Am')).toBe('sharp');
        expect(getKeyPreference('Dm')).toBe('sharp');
        expect(getKeyPreference('Em')).toBe('sharp');
        // Flat minor keys
        expect(getKeyPreference('Bbm')).toBe('flat');
        expect(getKeyPreference('Ebm')).toBe('flat');
    });

    it('falls back based on accidental in key name', () => {
        expect(getKeyPreference('Xb')).toBe('flat');
        expect(getKeyPreference('X#')).toBe('sharp');
        expect(getKeyPreference('Z')).toBe('sharp');
    });
});
