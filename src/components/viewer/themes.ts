
import { Theme } from "@/mcs-core/model";

export const DEFAULT_THEME: Theme = {
    name: "Light Mode",
    colors: {
        background: "#ffffff",
        text_primary: "#1f2937", // gray-800
        text_secondary: "#6b7280", // gray-500
        chord: "#2563eb", // blue-600
        section_header: "#9ca3af", // gray-400
        highlight: "rgba(37, 99, 235, 0.1)",
    },
    typography: {
        font_family_lyrics: "Inter, sans-serif",
        font_family_chords: "Roboto Mono, monospace",
        size_lyrics: 18,
        size_chords: 18,
        weight_chords: "700",
        line_height: 1.6,
    },
    layout: {
        show_diagrams: true,
        two_column: true,
        chord_position: "above",
        notation_system: "western",
    },
};

export const DARK_THEME: Theme = {
    name: "Dark Mode",
    colors: {
        background: "#111827", // gray-900
        text_primary: "#f9fafb", // gray-50
        text_secondary: "#9ca3af", // gray-400
        chord: "#facc15", // yellow-400
        section_header: "#4b5563", // gray-600
        highlight: "rgba(250, 204, 21, 0.1)",
    },
    typography: {
        font_family_lyrics: "Inter, sans-serif",
        font_family_chords: "Roboto Mono, monospace",
        size_lyrics: 18,
        size_chords: 18, // slightly smaller
        weight_chords: "700",
        line_height: 1.6,
    },
    layout: {
        show_diagrams: false,
        two_column: true,
        chord_position: "above",
        notation_system: "western",
    },
};

export const HIGH_CONTRAST_THEME: Theme = {
    name: "High Contrast",
    colors: {
        background: "#000000",
        text_primary: "#ffffff",
        text_secondary: "#cccccc",
        chord: "#00ff00",
        section_header: "#ffffff",
        highlight: "#ffff00",
    },
    typography: {
        font_family_lyrics: "Arial, sans-serif",
        font_family_chords: "Arial, sans-serif",
        size_lyrics: 16,
        size_chords: 14,
        weight_chords: "700",
        line_height: 1.8,
    },
    layout: {
        show_diagrams: true,
        two_column: false,
        chord_position: "above",
        notation_system: "western",
    },
};

export const PROJECTION_THEME: Theme = {
    name: "Projection",
    colors: {
        background: "#000000",
        text_primary: "#ffffff",
        text_secondary: "#aaaaaa",
        chord: "#fbbf24",
        section_header: "#fbbf24",
        highlight: "#fbbf24",
    },
    typography: {
        font_family_lyrics: "Arial, sans-serif",
        font_family_chords: "Arial, sans-serif",
        size_lyrics: 28,
        size_chords: 26,
        weight_chords: "700",
        line_height: 2.0,
    },
    layout: {
        show_diagrams: false,
        two_column: false,
        chord_position: "above",
        notation_system: "western",
    },
};

export const ALL_THEMES: Theme[] = [DEFAULT_THEME, DARK_THEME, HIGH_CONTRAST_THEME, PROJECTION_THEME];
