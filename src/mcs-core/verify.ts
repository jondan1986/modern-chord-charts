// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

import { MCSParser } from "./parser";
import { Song, LineSegment } from "./model";

const sampleYaml = `
schema_version: "1.0.0"
metadata:
  title: "Amazing Grace"
  artist: "John Newton"
sections:
  - id: "v1"
    type: "verse"
    lines:
      - "A[G]mazing grace! How [C]sweet the [G]sound"
      - { content: [{ lyric: "That "}, { chord: "D", lyric: "saved a wretch" }] }
`;

try {
    console.log("Parsing Sample MCS...");
    const song = MCSParser.parse(sampleYaml);

    console.log("\n--- Parsed Song Output ---");
    console.log(JSON.stringify(song, null, 2));

    // Validation Checks
    const firstLine = song.sections[0].lines[0] as any; // Cast check
    const segments = firstLine.content as LineSegment[];

    if (segments[0].lyric === "A" && segments[1].chord === "G" && segments[1].lyric === "mazing") {
        console.log("\n[PASS] Compact Line Expansion: 'A[G]mazing' parsed correctly.");
    } else {
        console.error("\n[FAIL] Compact Line Expansion failed.", segments);
    }

} catch (error) {
    console.error("Parsing Failed:", error);
}
