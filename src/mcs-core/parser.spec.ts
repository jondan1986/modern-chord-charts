
import { describe, it, expect } from 'vitest';
import { MCSParser } from './parser';

describe('MCSParser', () => {
    describe('parseCompactLine', () => {
        it('parses a simple line without chords', () => {
            const result = MCSParser.parseCompactLine("Hello World");
            expect(result.content).toEqual([
                { lyric: "Hello World" }
            ]);
        });

        it('parses a line starting with a chord', () => {
            const result = MCSParser.parseCompactLine("[G]Hello");
            expect(result.content).toEqual([
                { chord: "G", lyric: "Hello" }
            ]);
        });

        it('parses a line with inline chords', () => {
            const result = MCSParser.parseCompactLine("A[G]mazing");
            expect(result.content).toEqual([
                { lyric: "A" },
                { chord: "G", lyric: "mazing" }
            ]);
        });

        it('parses multiple chords', () => {
            const result = MCSParser.parseCompactLine("[G]Hello [C]World");
            expect(result.content).toEqual([
                { chord: "G", lyric: "Hello " },
                { chord: "C", lyric: "World" }
            ]);
        });
    });

    describe('parse', () => {
        it('parses a full YAML song', () => {
            const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Test Song"
  artist: "Test Artist"
sections:
  - id: "v1"
    type: "verse"
    label: "Verse 1"
    lines:
      - "Line [A]One"
`;
            const song = MCSParser.parse(yaml);
            expect(song.metadata.title).toBe("Test Song");
            expect(song.sections[0].lines[0]).toEqual({
                content: [
                    { lyric: "Line " },
                    { chord: "A", lyric: "One" }
                ]
            });
        });

        it('parses section bar counts', () => {
            const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Bars Test"
  artist: "Artist"
sections:
  - id: "v1"
    type: "verse"
    bars: 4
    lines:
      - "Test"
`;
            const song = MCSParser.parse(yaml);
            expect(song.sections[0].bars).toBe(4);
        });

        it('throws error on invalid YAML', () => {
            const yaml = `
schema_version: "1.0.0"
metadata:
  title: "Broken"
sections:
  - id: "v1"
    type: "verse"
    lines:
      - [Invalid YAML here
`;
            expect(() => MCSParser.parse(yaml)).toThrow();
        });
    });
});
