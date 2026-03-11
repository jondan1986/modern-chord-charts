
import { z } from "zod";

// -- Validator Schemas --

export const MetadataSchema = z.object({
    title: z.string().min(1, "Title is required"),
    artist: z.string().min(1, "Artist is required"),
    key: z.string().optional(),
    tempo: z.number().optional(),
    time_signature: z.string().optional(),
    year: z.number().int().positive().optional(),
    themes: z.array(z.string()).optional(),
    copyright: z.string().optional(),
    ccli: z.string().optional(),
}).catchall(z.any());

export const OptionsSchema = z.object({
    transpose: z.number().default(0),
});

export const ChordDefinitionSchema = z.object({
    name: z.string(),
    base_fret: z.number().default(1),
    frets: z.array(z.union([z.number(), z.literal("x"), z.literal(-1)])).length(6),
    fingers: z.array(z.number()).optional(),
});

export const LineSegmentSchema = z.object({
    lyric: z.string(),
    chord: z.string().optional().nullable(),
});

export const LineSchema = z.object({
    content: z.array(LineSegmentSchema),
});

export const SectionSchema = z.object({
    id: z.string(),
    type: z.enum(["verse", "chorus", "bridge", "tag", "intro", "outro", "hook", "instrumental", "grid", "other"]).default("other"),
    label: z.string().optional(),
    subtitle: z.string().optional(),
    bars: z.number().int().positive().optional(),
    lines: z.array(z.union([z.string(), LineSchema])), // Supports both Compact (string) and Strict (object)
});

export const ArrangementSchema = z.object({
    name: z.string(),
    order: z.array(z.string()),
});

export const SongSchema = z.object({
    schema_version: z.string().default("1.0.0"),
    metadata: MetadataSchema,
    options: OptionsSchema.optional(),
    definitions: z.array(ChordDefinitionSchema).optional(),
    sections: z.array(SectionSchema),
    arrangements: z.array(ArrangementSchema).optional(),
});

// Style Schema
export const ThemeSchema = z.object({
    name: z.string(),
    colors: z.object({
        background: z.string(),
        text_primary: z.string(),
        text_secondary: z.string(),
        chord: z.string(),
        section_header: z.string(),
        section_border: z.string(),
        highlight: z.string(),
    }),
    typography: z.object({
        font_family_lyrics: z.string(),
        font_family_chords: z.string(),
        size_lyrics: z.number(),
        size_chords: z.number(),
        weight_chords: z.string(),
        line_height: z.number(),
    }),
    layout: z.object({
        show_diagrams: z.boolean(),
        diagram_position: z.enum(["top", "inline"]).optional(),
        diagram_size: z.enum(["small", "medium", "large"]).optional(),
        two_column: z.boolean(),
        chord_position: z.enum(["above", "inline"]),
        notation_system: z.enum(["western", "nashville", "roman", "solfege"]),
    }),
});
