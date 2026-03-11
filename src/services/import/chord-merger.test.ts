// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { mergeChords } from './chord-merger';

describe('mergeChords', () => {
    const lyricsOnlyYaml = `schema_version: "1.0"
metadata:
  title: "Amazing Grace"
  artist: "John Newton"
  pco_song_id: "12345"
  pco_arrangement_id: "67890"

sections:
  - id: "sec-1"
    label: "Verse 1"
    type: "verse"
    lines:
      - "Amazing grace how sweet the sound"
      - "That saved a wretch like me"
  - id: "sec-2"
    label: "Chorus"
    type: "chorus"
    lines:
      - "I once was lost but now am found"`;

    const chordsSourceYaml = `schema_version: "1.0"
metadata:
  title: "Amazing Grace"
  artist: "John Newton"

sections:
  - id: "src-1"
    label: "Verse 1"
    type: "verse"
    lines:
      - "[G]Amazing [C]grace [G]how [D]sweet the sound"
      - "[G]That [Em]saved a [D]wretch like me"
  - id: "src-2"
    label: "Chorus"
    type: "chorus"
    lines:
      - "[C]I [G]once was [D]lost but [G]now am found"`;

    it('merges chords from source into lyrics-only target', () => {
        const merged = mergeChords(lyricsOnlyYaml, chordsSourceYaml);

        // Should preserve target metadata
        expect(merged).toContain('pco_song_id: "12345"');
        expect(merged).toContain('pco_arrangement_id: "67890"');

        // Should have chords in the output
        expect(merged).toContain('[G]');
        expect(merged).toContain('[C]');

        // Should preserve section structure
        expect(merged).toContain('id: "sec-1"');
        expect(merged).toContain('id: "sec-2"');
    });

    it('preserves lines that already have chords', () => {
        const targetWithSomeChords = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "sec-1"
    label: "Verse"
    type: "verse"
    lines:
      - "[Am]Already has chords"
      - "Needs chords"`;

        const source = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "src-1"
    label: "Verse"
    type: "verse"
    lines:
      - "[C]Different chords"
      - "[G]Source chords"`;

        const merged = mergeChords(targetWithSomeChords, source);

        // Line with existing chords should be unchanged
        expect(merged).toContain('[Am]Already has chords');
        // Line without chords should get source chords
        expect(merged).toContain('[G]');
    });

    it('matches sections by type when labels differ', () => {
        const target = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "sec-1"
    label: "V1"
    type: "verse"
    lines:
      - "Hello world"`;

        const source = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "src-1"
    label: "Verse 1"
    type: "verse"
    lines:
      - "[G]Hello [C]world"`;

        const merged = mergeChords(target, source);
        expect(merged).toContain('[G]');
        expect(merged).toContain('[C]');
    });

    it('handles empty source gracefully', () => {
        const emptySource = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:`;

        const merged = mergeChords(lyricsOnlyYaml, emptySource);
        expect(merged).toContain('Amazing grace how sweet the sound');
        expect(merged).toContain('pco_song_id');
    });

    it('handles source with more lines than target', () => {
        const target = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "sec-1"
    label: "Verse"
    type: "verse"
    lines:
      - "One line"`;

        const source = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "src-1"
    label: "Verse"
    type: "verse"
    lines:
      - "[G]One line"
      - "[C]Extra line from source"`;

        const merged = mergeChords(target, source);
        // Should include the extra line from source
        expect(merged).toContain('[C]Extra line from source');
    });

    it('handles target sections with no match in source', () => {
        const target = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "sec-1"
    label: "Verse"
    type: "verse"
    lines:
      - "Has match"
  - id: "sec-2"
    label: "Bridge"
    type: "bridge"
    lines:
      - "No match in source"`;

        const source = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "src-1"
    label: "Verse"
    type: "verse"
    lines:
      - "[G]Has match"`;

        const merged = mergeChords(target, source);
        expect(merged).toContain('[G]');
        expect(merged).toContain('No match in source');
    });

    it('preserves subtitle field', () => {
        const target = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "sec-1"
    label: "Verse"
    type: "verse"
    subtitle: "Play softly"
    lines:
      - "Hello"`;

        const source = `schema_version: "1.0"
metadata:
  title: "Test"
  artist: "Test"

sections:
  - id: "src-1"
    label: "Verse"
    type: "verse"
    lines:
      - "[G]Hello"`;

        const merged = mergeChords(target, source);
        expect(merged).toContain('subtitle: "Play softly"');
    });
});
