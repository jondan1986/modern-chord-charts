import { describe, it, expect } from 'vitest';
import { MCSParser } from './parser';

describe('MCSParser.parseCompactLine edge cases', () => {
    it('handles empty string', () => {
        const result = MCSParser.parseCompactLine('');
        expect(result.content).toEqual([{ lyric: '' }]);
    });

    it('handles chord-only line with no lyrics', () => {
        const result = MCSParser.parseCompactLine('[G]');
        expect(result.content).toEqual([{ chord: 'G', lyric: '' }]);
    });

    it('handles consecutive chords (last chord wins for segment)', () => {
        const result = MCSParser.parseCompactLine('[G][C]text');
        // Parser filters empty segments — [G] produces no lyric and gets collapsed
        expect(result.content).toEqual([
            { chord: 'C', lyric: 'text' },
        ]);
    });

    it('handles complex chord names', () => {
        const result = MCSParser.parseCompactLine('[Cmaj7]rest');
        expect(result.content).toEqual([{ chord: 'Cmaj7', lyric: 'rest' }]);
    });

    it('handles slash chords in brackets', () => {
        const result = MCSParser.parseCompactLine('[G/B]walking');
        expect(result.content).toEqual([{ chord: 'G/B', lyric: 'walking' }]);
    });

    it('handles multiple words between chords', () => {
        const result = MCSParser.parseCompactLine('[D]this is a [G]test line');
        expect(result.content).toEqual([
            { chord: 'D', lyric: 'this is a ' },
            { chord: 'G', lyric: 'test line' },
        ]);
    });
});

describe('MCSParser.parse integration', () => {
    const baseSong = (extras: string = '') => `
schema_version: "1.0.0"
metadata:
  title: "Test Song"
  artist: "Test Artist"
  key: "G"
${extras}
sections:
  - id: "v1"
    type: "verse"
    label: "Verse 1"
    lines:
      - "[G]Amazing [C]grace"
  - id: "c1"
    type: "chorus"
    label: "Chorus"
    lines:
      - "[D]How sweet [G]the sound"
`;

    it('parses song with arrangements', () => {
        const yaml = baseSong() + `
arrangements:
  - name: "Short"
    order: ["c1"]
  - name: "Full"
    order: ["v1", "c1", "v1", "c1"]
`;
        const song = MCSParser.parse(yaml);
        expect(song.arrangements).toHaveLength(2);
        expect(song.arrangements![0].name).toBe('Short');
        expect(song.arrangements![0].order).toEqual(['c1']);
        expect(song.arrangements![1].order).toHaveLength(4);
    });

    it('parses song with subtitle', () => {
        const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test"
  artist: "Artist"
sections:
  - id: "v1"
    type: "verse"
    label: "Verse 1"
    subtitle: "(softly)"
    lines:
      - "Hello"
`;
        const song = MCSParser.parse(yaml);
        expect(song.sections[0].subtitle).toBe('(softly)');
    });

    it('parses song with bar counts', () => {
        const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test"
  artist: "Artist"
sections:
  - id: "intro"
    type: "intro"
    bars: 4
    lines:
      - "[G]    [C]    [G]    [D]"
`;
        const song = MCSParser.parse(yaml);
        expect(song.sections[0].bars).toBe(4);
    });

    it('preserves custom metadata fields', () => {
        const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test"
  artist: "Artist"
  mood: "joyful"
  difficulty: "easy"
sections:
  - id: "v1"
    type: "verse"
    lines:
      - "Hello"
`;
        const song = MCSParser.parse(yaml);
        expect(song.metadata.mood).toBe('joyful');
        expect(song.metadata.difficulty).toBe('easy');
    });

    it('parses song with chord definitions', () => {
        const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test"
  artist: "Artist"
definitions:
  - name: "Csus4"
    frets: [-1, 3, 3, 0, 1, 1]
sections:
  - id: "v1"
    type: "verse"
    lines:
      - "[Csus4]Hello"
`;
        const song = MCSParser.parse(yaml);
        expect(song.definitions).toHaveLength(1);
        expect(song.definitions![0].name).toBe('Csus4');
        expect(song.definitions![0].frets).toEqual([-1, 3, 3, 0, 1, 1]);
    });

    it('throws on missing artist', () => {
        const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test"
sections:
  - id: "v1"
    type: "verse"
    lines:
      - "Hello"
`;
        expect(() => MCSParser.parse(yaml)).toThrow();
    });

    it('throws on invalid YAML syntax', () => {
        expect(() => MCSParser.parse('{{invalid yaml')).toThrow();
    });

    it('parses multiple section types', () => {
        const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test"
  artist: "Artist"
sections:
  - id: "intro"
    type: "intro"
    lines: ["[G]"]
  - id: "v1"
    type: "verse"
    lines: ["[G]Verse"]
  - id: "c1"
    type: "chorus"
    lines: ["[C]Chorus"]
  - id: "br1"
    type: "bridge"
    lines: ["[Am]Bridge"]
  - id: "outro"
    type: "outro"
    lines: ["[G]"]
`;
        const song = MCSParser.parse(yaml);
        expect(song.sections).toHaveLength(5);
        expect(song.sections.map(s => s.type)).toEqual([
            'intro', 'verse', 'chorus', 'bridge', 'outro'
        ]);
    });

    it('expands all compact lines to strict Line objects', () => {
        const yaml = baseSong();
        const song = MCSParser.parse(yaml);
        for (const section of song.sections) {
            for (const line of section.lines) {
                expect(typeof line).not.toBe('string');
                expect(line).toHaveProperty('content');
            }
        }
    });
});
