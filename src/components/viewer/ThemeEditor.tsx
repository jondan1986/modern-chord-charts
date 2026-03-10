"use client";

import React, { useState } from "react";
import { Theme } from "@/src/mcs-core/model";

const FONT_OPTIONS = [
    "Arial, sans-serif",
    "Georgia, serif",
    "'Courier New', monospace",
    "Verdana, sans-serif",
    "'Times New Roman', serif",
    "Inter, sans-serif",
    "Roboto Mono, monospace",
];

const WEIGHT_OPTIONS = ["400", "500", "600", "700", "800"];

const COLOR_FIELDS: { key: keyof Theme["colors"]; label: string }[] = [
    { key: "background", label: "Background" },
    { key: "text_primary", label: "Text Primary" },
    { key: "text_secondary", label: "Text Secondary" },
    { key: "chord", label: "Chord" },
    { key: "section_header", label: "Section Header" },
    { key: "highlight", label: "Highlight" },
];

interface ThemeEditorProps {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    onSaveCustomTheme: (theme: Theme) => void;
    onClose: () => void;
}

export default function ThemeEditor({ theme, onThemeChange, onSaveCustomTheme, onClose }: ThemeEditorProps) {
    const [originalTheme] = useState<Theme>(() => JSON.parse(JSON.stringify(theme)));

    const isDark = theme.colors.background < "#888888";

    const panelBg = isDark ? "#1f2937" : "#ffffff";
    const panelText = isDark ? "#f9fafb" : "#1f2937";
    const panelBorder = isDark ? "#374151" : "#e5e7eb";
    const inputBg = isDark ? "#111827" : "#f9fafb";
    const sectionBg = isDark ? "#111827" : "#f3f4f6";

    const updateColors = (key: keyof Theme["colors"], value: string) => {
        onThemeChange({
            ...theme,
            colors: { ...theme.colors, [key]: value },
        });
    };

    const updateTypography = <K extends keyof Theme["typography"]>(key: K, value: Theme["typography"][K]) => {
        onThemeChange({
            ...theme,
            typography: { ...theme.typography, [key]: value },
        });
    };

    const updateLayout = <K extends keyof Theme["layout"]>(key: K, value: Theme["layout"][K]) => {
        onThemeChange({
            ...theme,
            layout: { ...theme.layout, [key]: value },
        });
    };

    const handleReset = () => {
        onThemeChange(JSON.parse(JSON.stringify(originalTheme)));
    };

    const handleSaveCustom = () => {
        const name = prompt("Enter a name for your custom theme:");
        if (name && name.trim()) {
            onSaveCustomTheme({ ...theme, name: name.trim() });
        }
    };

    // Normalize color values for the color picker (must be 7-char hex)
    const toHex = (color: string): string => {
        if (color.startsWith("#") && color.length === 7) return color;
        if (color.startsWith("#") && color.length === 4) {
            return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        }
        // For rgba or named colors, return a fallback
        return "#000000";
    };

    return (
        <div
            className="fixed top-0 right-0 h-full w-80 md:w-96 shadow-2xl z-[100] flex flex-col overflow-hidden no-print"
            style={{ backgroundColor: panelBg, color: panelText, borderLeft: `1px solid ${panelBorder}` }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                style={{ borderColor: panelBorder }}
            >
                <h2 className="text-lg font-bold">Theme Editor</h2>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:opacity-70 transition-opacity"
                    title="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

                {/* Colors Section */}
                <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-70">Colors</h3>
                    <div className="space-y-2 p-3 rounded-lg" style={{ backgroundColor: sectionBg }}>
                        {COLOR_FIELDS.map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                                <label className="text-sm">{label}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={toHex(theme.colors[key])}
                                        onChange={(e) => updateColors(key, e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={theme.colors[key]}
                                        onChange={(e) => updateColors(key, e.target.value)}
                                        className="w-24 text-xs px-2 py-1 rounded border"
                                        style={{ backgroundColor: inputBg, borderColor: panelBorder, color: panelText }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Typography Section */}
                <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-70">Typography</h3>
                    <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: sectionBg }}>
                        {/* Lyrics Font */}
                        <div>
                            <label className="text-xs block mb-1">Lyrics Font</label>
                            <select
                                value={theme.typography.font_family_lyrics}
                                onChange={(e) => updateTypography("font_family_lyrics", e.target.value)}
                                className="w-full text-sm px-2 py-1.5 rounded border"
                                style={{ backgroundColor: inputBg, borderColor: panelBorder, color: panelText }}
                            >
                                {FONT_OPTIONS.map((f) => (
                                    <option key={f} value={f}>{f.split(",")[0].replace(/'/g, "")}</option>
                                ))}
                            </select>
                        </div>

                        {/* Chords Font */}
                        <div>
                            <label className="text-xs block mb-1">Chords Font</label>
                            <select
                                value={theme.typography.font_family_chords}
                                onChange={(e) => updateTypography("font_family_chords", e.target.value)}
                                className="w-full text-sm px-2 py-1.5 rounded border"
                                style={{ backgroundColor: inputBg, borderColor: panelBorder, color: panelText }}
                            >
                                {FONT_OPTIONS.map((f) => (
                                    <option key={f} value={f}>{f.split(",")[0].replace(/'/g, "")}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lyrics Size */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs">Lyrics Size</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={10}
                                    max={48}
                                    value={theme.typography.size_lyrics}
                                    onChange={(e) => updateTypography("size_lyrics", Number(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-xs w-8 text-right">{theme.typography.size_lyrics}px</span>
                            </div>
                        </div>

                        {/* Chords Size */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs">Chords Size</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={10}
                                    max={48}
                                    value={theme.typography.size_chords}
                                    onChange={(e) => updateTypography("size_chords", Number(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-xs w-8 text-right">{theme.typography.size_chords}px</span>
                            </div>
                        </div>

                        {/* Line Height */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs">Line Height</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={1.0}
                                    max={3.0}
                                    step={0.1}
                                    value={theme.typography.line_height}
                                    onChange={(e) => updateTypography("line_height", Number(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-xs w-8 text-right">{theme.typography.line_height.toFixed(1)}</span>
                            </div>
                        </div>

                        {/* Chord Weight */}
                        <div>
                            <label className="text-xs block mb-1">Chord Weight</label>
                            <select
                                value={theme.typography.weight_chords}
                                onChange={(e) => updateTypography("weight_chords", e.target.value)}
                                className="w-full text-sm px-2 py-1.5 rounded border"
                                style={{ backgroundColor: inputBg, borderColor: panelBorder, color: panelText }}
                            >
                                {WEIGHT_OPTIONS.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Layout Section */}
                <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-70">Layout</h3>
                    <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: sectionBg }}>
                        {/* Chord Position */}
                        <div>
                            <label className="text-xs block mb-1">Chord Position</label>
                            <select
                                value={theme.layout.chord_position}
                                onChange={(e) => updateLayout("chord_position", e.target.value as "above" | "inline")}
                                className="w-full text-sm px-2 py-1.5 rounded border"
                                style={{ backgroundColor: inputBg, borderColor: panelBorder, color: panelText }}
                            >
                                <option value="above">Above Lyrics</option>
                                <option value="inline">Inline</option>
                            </select>
                        </div>

                        {/* Two Column */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={theme.layout.two_column}
                                onChange={(e) => updateLayout("two_column", e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">Two Column Layout</span>
                        </label>

                        {/* Show Diagrams */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={theme.layout.show_diagrams}
                                onChange={(e) => updateLayout("show_diagrams", e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm">Show Chord Diagrams</span>
                        </label>
                    </div>
                </section>
            </div>

            {/* Footer Actions */}
            <div
                className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
                style={{ borderColor: panelBorder }}
            >
                <button
                    onClick={handleReset}
                    className="flex-1 px-3 py-2 text-sm rounded border hover:opacity-80 transition-opacity"
                    style={{ borderColor: panelBorder }}
                >
                    Reset
                </button>
                <button
                    onClick={handleSaveCustom}
                    className="flex-1 px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                    Save as Custom
                </button>
            </div>
        </div>
    );
}
