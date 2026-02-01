
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map keys to preferred accidentals (simplistic approach)
const KEY_PREFERENCE: { [key: string]: 'sharp' | 'flat' } = {
    'C': 'sharp', 'G': 'sharp', 'D': 'sharp', 'A': 'sharp', 'E': 'sharp', 'B': 'sharp', 'F#': 'sharp',
    'F': 'flat', 'Bb': 'flat', 'Eb': 'flat', 'Ab': 'flat', 'Db': 'flat', 'Gb': 'flat', 'Cb': 'flat',
    'Am': 'sharp', 'Em': 'sharp', 'Bm': 'sharp', 'F#m': 'sharp', 'C#m': 'sharp', 'G#m': 'sharp', 'D#m': 'sharp',
    'Dm': 'flat', 'Gm': 'flat', 'Cm': 'flat', 'Fm': 'flat', 'Bbm': 'flat', 'Ebm': 'flat', 'Abm': 'flat'
};

function getNoteIndex(note: string): number {
    const n = note.toUpperCase();
    let idx = NOTES_SHARP.indexOf(n);
    if (idx !== -1) return idx;
    return NOTES_FLAT.indexOf(n);
}

function normalizeKey(key: string): string {
    // e.g. "C#m" -> "C#" (we only care about root for accidentals usually, but minor matters for relative major)
    return key;
}

export function transposeNote(note: string, steps: number, targetKeyPreference: 'sharp' | 'flat' = 'sharp'): string {
    const idx = getNoteIndex(note);
    if (idx === -1) return note; // Return explicit if not found (e.g. 'N.C.')

    let newIdx = (idx + steps) % 12;
    if (newIdx < 0) newIdx += 12;

    return targetKeyPreference === 'sharp' ? NOTES_SHARP[newIdx] : NOTES_FLAT[newIdx];
}

export function transposeChord(chord: string, steps: number, targetKeyPreference: 'sharp' | 'flat' = 'sharp'): string {
    if (!chord) return chord;

    // Regex to split Root + Quality + /Bass
    // complex regex to match Root: [A-G](?:\#|b)? 
    // Quality: everything else until slash
    // Bass: slash then Root

    const rootRegex = /^([A-G](?:#|b)?)(.*?)(\/([A-G](?:#|b)?))?$/;
    const match = chord.match(rootRegex);

    if (!match) return chord; // fallback

    const [_, root, quality, slashGroup, bass] = match;

    const newRoot = transposeNote(root, steps, targetKeyPreference);
    let newBass = "";

    if (bass) {
        newBass = "/" + transposeNote(bass, steps, targetKeyPreference);
    }

    return `${newRoot}${quality}${newBass}`;
}

export function getTargetKey(originalKey: string, steps: number): string {
    // Guess preference
    const root = originalKey.match(/^([A-G](?:#|b)?)/)?.[1] || "C";
    const isMinor = originalKey.includes("m");

    // Transpose the root
    // We default to sharp for the calculation, then check preference of result?
    // This is circular.
    // Heuristic: If we are adding steps to a Sharp key, we likely stay sharp.
    // If we transpose C to C#, it's C#. C to Db is Db.
    // Let's just use the basic transposeNote which respects preference.

    // Determining preference for the Resulting Key:
    // If I transpose C up 1, I get C# or Db.
    // Usually C# is preferred for major keys, Db is fine too.
    // Let's rely on the NOTES_SHARP/FLAT array.

    const idx = getNoteIndex(root);
    if (idx === -1) return originalKey;

    let newIdx = (idx + steps) % 12;
    if (newIdx < 0) newIdx += 12;

    // Which name to pick? C# or Db?
    // Use the one that is in "Common Keys" if possible.
    const sharpCandidate = NOTES_SHARP[newIdx];
    const flatCandidate = NOTES_FLAT[newIdx];

    // List of "Standard" keys
    const COMMON_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
    const COMMON_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

    const candidateName = (isMinor ? sharpCandidate + 'm' : sharpCandidate);
    if (isMinor) {
        if (COMMON_MINOR.includes(flatCandidate + 'm')) return flatCandidate + (originalKey.includes('m') ? 'm' : '');
    } else {
        if (COMMON_KEYS.includes(flatCandidate)) return flatCandidate;
    }

    return sharpCandidate + (originalKey.includes('m') ? 'm' : '');
}

export function getKeyPreference(key: string): 'sharp' | 'flat' {
    // Strip minor
    const root = key.replace(/m$/, '');
    if (KEY_PREFERENCE[root]) return KEY_PREFERENCE[root];
    if (KEY_PREFERENCE[key]) return KEY_PREFERENCE[key];

    // Fallback: Flats are common in F, Bb, Eb... Sharps in G, D, A...
    // If key has 'b', flat. If '#', sharp.
    if (key.includes('b')) return 'flat';
    return 'sharp';
}
