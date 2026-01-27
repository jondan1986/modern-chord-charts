
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
