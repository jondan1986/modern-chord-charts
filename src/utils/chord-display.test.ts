// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { formatChordForDisplay } from './chord-display';

describe('formatChordForDisplay', () => {
  it('converts # to ♯', () => {
    expect(formatChordForDisplay('C#')).toBe('C♯');
    expect(formatChordForDisplay('F#m')).toBe('F♯m');
    expect(formatChordForDisplay('G#dim')).toBe('G♯dim');
  });

  it('converts flat b to ♭ after note letters', () => {
    expect(formatChordForDisplay('Bb')).toBe('B♭');
    expect(formatChordForDisplay('Eb')).toBe('E♭');
    expect(formatChordForDisplay('Ab')).toBe('A♭');
    expect(formatChordForDisplay('Db')).toBe('D♭');
    expect(formatChordForDisplay('Gb')).toBe('G♭');
  });

  it('does not convert B or Bm (no flat indicator)', () => {
    expect(formatChordForDisplay('B')).toBe('B');
    expect(formatChordForDisplay('Bm')).toBe('Bm');
    expect(formatChordForDisplay('B7')).toBe('B7');
  });

  it('handles flat minor chords', () => {
    expect(formatChordForDisplay('Bbm')).toBe('B♭m');
    expect(formatChordForDisplay('Ebm7')).toBe('E♭m7');
  });

  it('handles slash chords with flats', () => {
    expect(formatChordForDisplay('Ab/Bb')).toBe('A♭/B♭');
    expect(formatChordForDisplay('C/Eb')).toBe('C/E♭');
  });

  it('handles combined sharp and flat in slash chord', () => {
    expect(formatChordForDisplay('C#/Ab')).toBe('C♯/A♭');
  });

  it('passes through plain chords unchanged', () => {
    expect(formatChordForDisplay('C')).toBe('C');
    expect(formatChordForDisplay('Am')).toBe('Am');
    expect(formatChordForDisplay('G7')).toBe('G7');
    expect(formatChordForDisplay('Dm')).toBe('Dm');
  });
});
