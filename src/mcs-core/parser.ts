
import YAML from "yaml";
import { Song, Section, Line, LineSegment } from "./model";
import { SongSchema } from "./validator";

export class MCSParser {
  /**
   * Parses a raw MCS YAML string into a strict Song object.
   * Expands "Compact Mode" strings (Bracket Chords) into "Strict Mode" Line objects.
   */
  static parse(yamlContent: string): Song {
    // 1. Parse YAML
    const rawData = YAML.parse(yamlContent);

    // 2. Validate basic structure using Zod (before expansion)
    // We parse strict vs compact loosely at this stage to allow Zod to pass valid strings
    // But actual SongSchema expects 'lines' to be flexible.
    const validation = SongSchema.safeParse(rawData);

    if (!validation.success) {
      console.error("Validation Error:", validation.error.format());
      throw new Error(`Invalid MCS Format: ${validation.error.message}`);
    }

    const song = validation.data as Song;

    // 3. Post-Process: Expand Compact Lines to Strict Lines
    song.sections = song.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => {
        if (typeof line === "string") {
          return MCSParser.parseCompactLine(line);
        }
        return line as Line; // Already strictly parsed
      }),
    }));

    return song;
  }

  /**
   * Converts a compact string like "A[G]mazing" into a strict Line object.
   * Logic:
   * "A[G]mazing" -> [ { lyric: "A" }, { chord: "G", lyric: "mazing" } ]
   * "[C]Hello"   -> [ { chord: "C", lyric: "Hello" } ]
   */
  static parseCompactLine(text: string): Line {
    const segments: LineSegment[] = [];
    
    // Regex to capture [Chord] blocks and surrounding text
    // Matches either a chord block `[...]` or any text that isn't `[`
    const tokens = text.split(/(\[.*?\])/g);

    let currentLyric = "";
    let currentChord: string | null = null;
    let isFirst = true;

    for (const token of tokens) {
      if (!token) continue; // Skip empty splits

      if (token.startsWith("[") && token.endsWith("]")) {
        // It's a chord.
        // If we have accumulated lyrics for a previous segment (no chord), push it.
        // OR if this is a chord that splits a word, we start a new segment.
        
        if (currentLyric || isFirst) {
           if (currentLyric || (isFirst && !currentChord && !currentLyric)) {
             // Push previous segment
             segments.push({
               lyric: currentLyric,
               chord: currentChord || undefined, // undefined if null
             });
           }
        }
        
        // Start new segment
        // Extract chord content (remove brackets)
        currentChord = token.slice(1, -1);
        currentLyric = ""; // Reset lyric for this new chord
        isFirst = false;

      } else {
        // It's text
        currentLyric += token;
      }
    }

    // Push final segment
    segments.push({
      lyric: currentLyric,
      chord: currentChord || undefined,
    });
    
    // Filter out initial empty segment if it was just a placeholder
    // (Optimization: clean up empty segments that aren't meaningful)
    const cleanedSegments = segments.filter(seg => seg.lyric !== "" || seg.chord !== undefined);

    return {
      content: cleanedSegments.length > 0 ? cleanedSegments : [{ lyric: "" }]
    };
  }
}
