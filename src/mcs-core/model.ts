
// Modern Chord Specification (MCS) - TypeScript Model

// -- Content Model --

export interface Arrangement {
  name: string;
  order: string[]; // List of Section IDs by reference
}

export interface Song {
  schema_version: string;
  metadata: SongMetadata;
  options?: SongOptions;
  definitions?: ChordDefinition[];
  sections: Section[];
  arrangements?: Arrangement[];
}

export interface SongMetadata {
  title: string;
  artist: string;
  key?: string;
  tempo?: number;
  time_signature?: string;
  themes?: string[];
  copyright?: string;
  ccli?: string;
  [key: string]: any; // Allow extensibility
}

export interface SongOptions {
  transpose?: number;
}

export interface ChordDefinition {
  name: string;
  base_fret?: number;
  frets: (number | "x" | -1)[]; // 6 strings, Low E to High E. -1 or 'x' is mute.
  fingers?: number[]; // 1=Index, 4=Pinky, 0=Open
}

export type SectionType = "verse" | "chorus" | "bridge" | "tag" | "intro" | "outro" | "hook" | "instrumental" | "grid" | "other";

export interface Section {
  id: string;
  type: SectionType;
  label: string;
  subtitle?: string;
  bars?: number;
  lines: (Line | string)[]; // Can be strict Line objects or compact strings
}

// Strict Mode Line
export interface Line {
  content: LineSegment[];
}

export interface LineSegment {
  lyric: string;
  chord?: string; // Chord plays ON this syllable/segment
}

// -- Style/Theme Model --

export type NotationSystem = "western" | "nashville" | "roman" | "solfege";

export interface Theme {
  name: string;
  colors: {
    background: string;
    text_primary: string;
    text_secondary: string;
    chord: string;
    section_header: string;
    highlight: string;
  };
  typography: {
    font_family_lyrics: string;
    font_family_chords: string;
    size_lyrics: number;
    size_chords: number;
    weight_chords: string;
    line_height: number;
  };
  layout: {
    show_diagrams: boolean;
    diagram_position?: "top" | "inline";
    diagram_size?: "small" | "medium" | "large";
    two_column: boolean;
    chord_position: "above" | "inline";
    notation_system: NotationSystem;
  };
}
