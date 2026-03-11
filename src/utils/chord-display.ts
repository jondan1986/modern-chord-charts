// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

/**
 * Converts ASCII sharp/flat notation to Unicode musical symbols for display.
 * Only applied at render time — internal storage remains ASCII.
 */
export function formatChordForDisplay(chord: string): string {
  // '#' always becomes '♯'
  let result = chord.replace(/#/g, '♯');
  // 'b' becomes '♭' only when preceded by a note letter (A-G)
  // This correctly handles Bb→B♭, Ab→A♭ without affecting B, Bm, etc.
  result = result.replace(/([A-G])b/g, '$1♭');
  return result;
}
