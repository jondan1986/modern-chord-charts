// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  sanitize,
  detectFormat,
  mapSectionLabel,
  convertPCOToMCS,
  generateMetadataOnlyMCS,
  generateLyricsOnlyMCS,
} from './converter';
import type { PCOArrangement, PCOSong, PCOSection } from './types';

const makeSong = (overrides?: Partial<PCOSong>): PCOSong => ({
  id: '5001',
  title: 'Test Song',
  author: 'Test Artist',
  ccli_number: 12345,
  copyright: '2024 Test Publisher',
  themes: 'worship, praise',
  ...overrides,
});

const makeArrangement = (overrides?: Partial<PCOArrangement>): PCOArrangement => ({
  id: '6001',
  name: 'Original',
  chord_chart: null,
  chord_chart_key: 'G',
  has_chords: false,
  lyrics: '',
  sequence: [],
  ...overrides,
});

// Helper to extract a value from YAML output
const getYamlValue = (yaml: string, key: string): string | undefined => {
  const match = yaml.match(new RegExp(`${key}:\\s*"?([^"\\n]+)"?`));
  return match?.[1];
};

describe('sanitize', () => {
  it('strips HTML tags', () => {
    expect(sanitize('<b>Chorus 1</b>')).toBe('Chorus 1');
    expect(sanitize('<b>Espanol</b> text')).toBe('Espanol text');
  });

  it('strips PAGE_BREAK markers', () => {
    expect(sanitize('Line 1\nPAGE_BREAK\nLine 2')).toBe('Line 1\n\nLine 2');
  });

  it('strips COLUMN_BREAK markers', () => {
    expect(sanitize('Line 1\nCOLUMN_BREAK\nLine 2')).toBe('Line 1\n\nLine 2');
  });

  it('fixes double open brackets', () => {
    expect(sanitize('[[Gsus]')).toBe('[Gsus]');
  });

  it('fixes double close brackets', () => {
    expect(sanitize('[Amin]]')).toBe('[Am]');
  });

  it('normalizes long-form minor chords', () => {
    expect(sanitize('[Amin]')).toBe('[Am]');
    expect(sanitize('[Dmin7]')).toBe('[Dm7]');
    expect(sanitize('[Bbmin]')).toBe('[Bbm]');
    expect(sanitize('[F#min7]')).toBe('[F#m7]');
  });

  it('normalizes \\n\\r line endings', () => {
    expect(sanitize('line1\n\rline2')).toBe('line1\nline2');
  });

  it('normalizes \\r\\n line endings', () => {
    expect(sanitize('line1\r\nline2')).toBe('line1\nline2');
  });

  it('collapses triple+ newlines', () => {
    expect(sanitize('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('preserves parenthetical annotations', () => {
    expect(sanitize('(To Int.)')).toBe('(To Int.)');
    expect(sanitize('(VOICES)')).toBe('(VOICES)');
  });
});

describe('detectFormat', () => {
  it('returns empty when chord_chart and lyrics are falsy', () => {
    expect(detectFormat(makeArrangement({ chord_chart: null, lyrics: '' }))).toBe('empty');
  });

  it('returns hybrid when has_chords and contains IMPORTED FROM SONGSELECT', () => {
    expect(detectFormat(makeArrangement({
      has_chords: true,
      chord_chart: 'Verse 1\nsome text\nIMPORTED FROM SONGSELECT\n[C]chord line',
    }))).toBe('hybrid');
  });

  it('returns chordpro when has_chords is true', () => {
    expect(detectFormat(makeArrangement({
      has_chords: true,
      chord_chart: '[G]Amazing [C]Grace',
    }))).toBe('chordpro');
  });

  it('returns lyrics_only when has_chords is false but content exists', () => {
    expect(detectFormat(makeArrangement({
      has_chords: false,
      chord_chart: 'Some lyrics',
      lyrics: 'Some lyrics',
    }))).toBe('lyrics_only');
  });
});

describe('mapSectionLabel', () => {
  const cases: [string, string][] = [
    ['Verse 1', 'verse'],
    ['Verse 2', 'verse'],
    ['Chorus 1', 'chorus'],
    ['Chorus', 'chorus'],
    ['Bridge', 'bridge'],
    ['Intro', 'intro'],
    ['Outro', 'outro'],
    ['Ending', 'outro'],
    ['Interlude', 'instrumental'],
    ['Tag', 'tag'],
    ['Misc 1', 'other'],
    ['Pre-Chorus', 'other'],
  ];

  it.each(cases)('maps "%s" to type "%s"', (label, expectedType) => {
    const result = mapSectionLabel(label);
    expect(result.type).toBe(expectedType);
    expect(result.label).toBe(label);
  });
});

describe('generateMetadataOnlyMCS', () => {
  it('produces valid YAML with metadata and empty section', () => {
    const yaml = generateMetadataOnlyMCS(makeSong(), makeArrangement());
    expect(getYamlValue(yaml, 'title')).toBe('Test Song');
    expect(getYamlValue(yaml, 'artist')).toBe('Test Artist');
    expect(getYamlValue(yaml, 'pco_song_id')).toBe('5001');
    expect(getYamlValue(yaml, 'pco_arrangement_id')).toBe('6001');
    expect(yaml).toContain('sections:');
    expect(yaml).toContain('lines: []');
  });

  it('uses keyName when provided over chord_chart_key', () => {
    const yaml = generateMetadataOnlyMCS(makeSong(), makeArrangement(), 'E');
    expect(getYamlValue(yaml, 'key')).toBe('E');
  });
});

describe('generateLyricsOnlyMCS', () => {
  it('generates sections from PCO sections data', () => {
    const sections: PCOSection[] = [
      { id: '1', label: 'Verse 1', lyrics: 'Line one\n\rLine two' },
      { id: '2', label: 'Chorus 1', lyrics: 'Chorus line' },
    ];
    const yaml = generateLyricsOnlyMCS(makeSong(), makeArrangement(), sections);
    expect(yaml).toContain('type: "verse"');
    expect(yaml).toContain('type: "chorus"');
    expect(yaml).toContain('- "Line one"');
    expect(yaml).toContain('- "Line two"');
    expect(yaml).toContain('- "Chorus line"');
  });

  it('normalizes \\n\\r line endings in lyrics', () => {
    const sections: PCOSection[] = [
      { id: '1', label: 'Verse 1', lyrics: 'A\n\rB\n\rC' },
    ];
    const yaml = generateLyricsOnlyMCS(makeSong(), makeArrangement(), sections);
    expect(yaml).toContain('- "A"');
    expect(yaml).toContain('- "B"');
    expect(yaml).toContain('- "C"');
  });

  it('handles empty sections array', () => {
    const yaml = generateLyricsOnlyMCS(makeSong(), makeArrangement(), []);
    expect(yaml).toContain('lines: []');
  });
});

describe('convertPCOToMCS', () => {
  it('converts ChordPro format with PCO metadata', () => {
    const arrangement = makeArrangement({
      has_chords: true,
      chord_chart: 'Verse 1:\n[G]Amazing [C]Grace how sweet the sound',
    });
    const yaml = convertPCOToMCS(arrangement, makeSong(), 'G');
    expect(getYamlValue(yaml, 'title')).toBe('Test Song');
    expect(getYamlValue(yaml, 'pco_song_id')).toBe('5001');
    expect(yaml).toContain('[G]Amazing [C]Grace how sweet the sound');
  });

  it('converts hybrid format using ChordPro portion', () => {
    const arrangement = makeArrangement({
      has_chords: true,
      chord_chart: 'Verse 1\nPlain text\n\nIMPORTED FROM SONGSELECT\nVerse 1:\n[D]God when I in [G]awesome wonder',
    });
    const yaml = convertPCOToMCS(arrangement, makeSong(), 'D');
    expect(yaml).toContain('[D]God when I in [G]awesome wonder');
    expect(yaml).not.toContain('IMPORTED FROM SONGSELECT');
    expect(yaml).not.toContain('Plain text');
  });

  it('converts lyrics-only format with sections', () => {
    const arrangement = makeArrangement({
      has_chords: false,
      lyrics: 'Some lyrics here',
    });
    const sections: PCOSection[] = [
      { id: '1', label: 'Verse 1', lyrics: 'First verse line' },
    ];
    const yaml = convertPCOToMCS(arrangement, makeSong(), 'E', sections);
    expect(yaml).toContain('type: "verse"');
    expect(yaml).toContain('- "First verse line"');
    expect(getYamlValue(yaml, 'pco_song_id')).toBe('5001');
  });

  it('converts empty format to metadata-only', () => {
    const arrangement = makeArrangement({
      chord_chart: null,
      lyrics: '',
    });
    const yaml = convertPCOToMCS(arrangement, makeSong());
    expect(getYamlValue(yaml, 'title')).toBe('Test Song');
    expect(yaml).toContain('lines: []');
  });

  it('sanitizes content before conversion', () => {
    const arrangement = makeArrangement({
      has_chords: true,
      chord_chart: 'Verse 1:\n[[Amin]Amazing <b>Grace</b>',
    });
    const yaml = convertPCOToMCS(arrangement, makeSong());
    expect(yaml).toContain('[Am]Amazing Grace');
    expect(yaml).not.toContain('<b>');
    expect(yaml).not.toContain('[[');
  });

  it('preserves ccli number in metadata', () => {
    const yaml = convertPCOToMCS(
      makeArrangement({ has_chords: true, chord_chart: 'Verse 1:\n[C]Hello' }),
      makeSong({ ccli_number: 7654321 })
    );
    expect(getYamlValue(yaml, 'ccli')).toBe('7654321');
  });

  it('preserves themes as list', () => {
    const yaml = convertPCOToMCS(
      makeArrangement({ has_chords: true, chord_chart: 'Verse 1:\n[C]Hello' }),
      makeSong({ themes: 'worship, praise, joy' })
    );
    expect(yaml).toContain('- "worship"');
    expect(yaml).toContain('- "praise"');
    expect(yaml).toContain('- "joy"');
  });
});
