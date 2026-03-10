// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ChordProExporter } from './chordpro';
import { Song } from '@/mcs-core/model';

function makeSong(overrides: Partial<Song> = {}): Song {
  return {
    schema_version: '1.0',
    metadata: { title: 'Test Song', artist: 'Test Artist' },
    sections: [],
    ...overrides,
  };
}

describe('ChordProExporter', () => {
  it('exports basic metadata', () => {
    const result = ChordProExporter.export(makeSong({
      metadata: {
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        tempo: 80,
        time_signature: '3/4',
      },
    }));

    expect(result).toContain('{title: Amazing Grace}');
    expect(result).toContain('{artist: John Newton}');
    expect(result).toContain('{key: G}');
    expect(result).toContain('{tempo: 80}');
    expect(result).toContain('{time: 3/4}');
  });

  it('exports verse sections with start/end directives', () => {
    const result = ChordProExporter.export(makeSong({
      sections: [{
        id: '1',
        type: 'verse',
        label: 'Verse 1',
        lines: [
          { content: [{ chord: 'G', lyric: 'Amazing ' }, { chord: 'C', lyric: 'grace' }] },
        ],
      }],
    }));

    expect(result).toContain('{start_of_verse: Verse 1}');
    expect(result).toContain('[G]Amazing [C]grace');
    expect(result).toContain('{end_of_verse}');
  });

  it('exports chorus sections', () => {
    const result = ChordProExporter.export(makeSong({
      sections: [{
        id: '1',
        type: 'chorus',
        label: 'Chorus',
        lines: [{ content: [{ chord: 'D', lyric: 'Hallelujah' }] }],
      }],
    }));

    expect(result).toContain('{start_of_chorus}');
    expect(result).toContain('[D]Hallelujah');
    expect(result).toContain('{end_of_chorus}');
  });

  it('exports bridge sections', () => {
    const result = ChordProExporter.export(makeSong({
      sections: [{
        id: '1',
        type: 'bridge',
        label: 'Bridge',
        lines: [{ content: [{ lyric: 'instrumental' }] }],
      }],
    }));

    expect(result).toContain('{start_of_bridge}');
    expect(result).toContain('{end_of_bridge}');
  });

  it('exports unknown section types as comments', () => {
    const result = ChordProExporter.export(makeSong({
      sections: [{
        id: '1',
        type: 'grid',
        label: 'Chord Grid',
        lines: ['| C | G | Am | F |'],
      }],
    }));

    expect(result).toContain('{comment: Chord Grid}');
    expect(result).toContain('| C | G | Am | F |');
  });

  it('exports section subtitles as comments', () => {
    const result = ChordProExporter.export(makeSong({
      sections: [{
        id: '1',
        type: 'verse',
        label: 'Verse',
        subtitle: 'Softly',
        lines: [],
      }],
    }));

    expect(result).toContain('{comment: Softly}');
  });

  it('exports lyrics without chords correctly', () => {
    const result = ChordProExporter.export(makeSong({
      sections: [{
        id: '1',
        type: 'verse',
        label: 'Verse',
        lines: [
          { content: [{ lyric: 'Just lyrics no chords' }] },
        ],
      }],
    }));

    expect(result).toContain('Just lyrics no chords');
  });
});
