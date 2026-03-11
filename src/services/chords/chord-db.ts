// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import guitar from '@tombatossals/chords-db/lib/guitar.json';
import ukulele from '@tombatossals/chords-db/lib/ukulele.json';

// Type definitions based on the JSON structure
export interface ChordPosition {
    frets: number[];
    fingers: number[];
    baseFret: number;
    barres: number[];
    midi: number[];
    capo?: boolean;
}

export interface ChordDef {
    key: string;
    suffix: string;
    positions: ChordPosition[];
}

export type Instrument = 'guitar' | 'ukulele' | 'piano';

const DB: Record<string, any> = {
    guitar,
    ukulele
};

const SUFFIX_MAPPING: Record<string, string> = {
    "": "major",
    "m": "minor",
    "min": "minor",
    "-": "minor",
    "M": "major",
    "maj": "major",
    "Δ": "maj7",
    "+": "aug",
    "o": "dim",
    "ø": "m7b5",
    "5": "5" // Power chord, check if in DB? DB has '5'? No saw '5' in list? List was truncated?
    // Add more as needed based on DB suffixes inspection
};

export class ChordService {
    static getChord(instrument: Instrument, chordName: string): ChordDef | null {
        if (instrument === 'piano') return null; // TODO: Implement piano

        const db = DB[instrument];
        if (!db) return null;

        const { key, suffix } = this.parseChordName(chordName);
        if (!key) return null;

        // map suffix
        const mappedSuffix = SUFFIX_MAPPING[suffix] || suffix;

        // Look up in main chords list (organized by Key -> Array of ChordDefs)
        // Wait, structure was: guitar.chords['C'] -> Array of { suffix: "major", ... }, { suffix: "minor", ... }

        // Handle sharp/flat canonicalization if needed
        // DB keys: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
        const canonicalKey = this.normalizeKey(key);

        const chordsForKey = db.chords[canonicalKey];
        if (!chordsForKey) return null;

        // Find the specific suffix
        const chordDef = chordsForKey.find((c: any) => c.suffix === mappedSuffix);

        // Fallback: try to find 'major' if suffix is empty and not found (already handled by mapping "" -> "major")

        return chordDef || null;
    }

    private static parseChordName(name: string): { key: string, suffix: string } {
        // Regex to split Key and Suffix
        // Key: [A-G] followed by optional # or b
        const match = name.match(/^([A-G][#b]?)(.*)$/);
        if (!match) return { key: "", suffix: "" };

        return {
            key: match[1],
            suffix: match[2]
        };
    }

    private static normalizeKey(key: string): string {
        // DB uses: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
        // Need to map non-standard sharps/flats (e.g. Db -> C#, D# -> Eb? OR does DB use flats: Eb, Ab, Bb. It uses sharps: C#, F#.
        // DB Keys: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B

        const mapping: Record<string, string> = {
            "Db": "C#", // wait, DB has C#? Yes.
            "D#": "Eb", // DB has Eb.
            "Gb": "F#", // DB has F#.
            "G#": "Ab", // DB has Ab.
            "A#": "Bb", // DB has Bb.
            // What about Cb (B), E# (F), Fb (E), B# (C)?
            "Cb": "B",
            "E#": "F",
            "Fb": "E",
            "B#": "C"
        };

        // Wait, let's verify DB keys again from my inspection logs.
        // Keys list: [ 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B' ]
        // So it mixes sharps and flats.
        // C# (not Db)
        // Eb (not D#)
        // F# (not Gb)
        // Ab (not G#)
        // Bb (not A#)

        // My mapping covers:
        // Db -> C# (Correct)
        // D# -> Eb (Correct)
        // Gb -> F# (Correct)
        // G# -> Ab (Correct)
        // A# -> Bb (Correct)

        return mapping[key] || key;
    }
}
