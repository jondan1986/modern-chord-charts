import React from 'react';
import { ChordPosition } from '@/src/services/chords/chord-db';
import { Theme } from '@/mcs-core/model';

interface Props {
    position: ChordPosition;
    instrument: 'guitar' | 'ukulele';
    theme: Theme;
    className?: string;
}

export const ChordDiagram: React.FC<Props> = ({ position, instrument, theme, className }) => {
    const numStrings = instrument === 'guitar' ? 6 : 4;
    const numFrets = 5; // Standard window size

    // Dimensions
    const width = 100;
    const height = 120;
    const paddingX = 15;
    const paddingY = 20;
    const stringSpacing = (width - 2 * paddingX) / (numStrings - 1);
    const fretSpacing = (height - 2 * paddingY) / numFrets;
    const dotRadius = Math.min(stringSpacing, fretSpacing) * 0.35;

    // Colors
    const stringColor = theme.colors.text_primary;
    const fretColor = theme.colors.text_primary;
    const dotColor = theme.colors.chord;
    const dotTextColor = theme.colors.background; // Contrast for text inside dot
    const nutHeight = 4;

    const { frets, fingers, baseFret, barres, capo } = position;

    // Helper to get X coordinate for a string index (0-based from left)
    const getStringX = (stringIdx: number) => paddingX + stringIdx * stringSpacing;
    // Helper to get Y coordinate for a fret index (1-based relative to view)
    const getFretY = (fretIdx: number) => paddingY + (fretIdx - 0.5) * fretSpacing;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={`select-none w-full h-auto max-w-[120px] ${className || ''}`}
        >
            {/* Frets (Horizontal lines) */}
            {Array.from({ length: numFrets + 1 }).map((_, i) => (
                <line
                    key={`fret-${i}`}
                    x1={paddingX}
                    y1={paddingY + i * fretSpacing}
                    x2={width - paddingX}
                    y2={paddingY + i * fretSpacing}
                    stroke={fretColor}
                    strokeWidth={1}
                    opacity={0.5}
                />
            ))}

            {/* Nut (Thick top line if baseFret is 1) */}
            {baseFret === 1 && (
                <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={width - paddingX}
                    y2={paddingY}
                    stroke={fretColor}
                    strokeWidth={nutHeight}
                />
            )}

            {/* Strings (Vertical lines) */}
            {Array.from({ length: numStrings }).map((_, i) => (
                <line
                    key={`string-${i}`}
                    x1={getStringX(i)}
                    y1={paddingY}
                    x2={getStringX(i)}
                    y2={height - paddingY}
                    stroke={stringColor}
                    strokeWidth={1}
                />
            ))}

            {/* Barres */}
            {barres && barres.map((fret) => {
                const relFret = fret - (baseFret - 1); // relative to view
                if (relFret < 1 || relFret > numFrets) return null;

                // Find start and end string for barre
                // Usually barre covers all strings that are pressed at this fret?
                // The DB `barres` is just an array of fret numbers.
                // We need to infer which strings are covered.
                // We look at `frets` array. `frets` has length = numStrings.
                // values are fret numbers. -1 for mute, 0 for open.

                // Find the range of strings designated to this barre fret
                // Actually `barres` in JSON is just [1] (fret number).
                // It doesn't say which strings. Standard convention is "all strings under fingers at this fret".

                const stringsAtFret = frets.map((f, i) => f === fret ? i : -1).filter(i => i !== -1);
                if (stringsAtFret.length < 2) return null; // Not a barre if less than 2 strings?

                const firstString = Math.min(...stringsAtFret);
                const lastString = Math.max(...stringsAtFret);

                return (
                    <rect
                        key={`barre-${fret}`}
                        x={getStringX(firstString) - dotRadius}
                        y={getFretY(relFret) - dotRadius}
                        width={getStringX(lastString) - getStringX(firstString) + 2 * dotRadius}
                        height={2 * dotRadius}
                        rx={dotRadius}
                        fill={dotColor}
                    />
                );
            })}

            {/* Dots / Fingers */}
            {frets.map((fret, stringIdx) => {
                if (fret === -1) {
                    // Mute (X above nut)
                    const x = getStringX(stringIdx);
                    const y = paddingY - 8;
                    const size = 3;
                    return (
                        <g key={`mute-${stringIdx}`} stroke={stringColor} strokeWidth={1}>
                            <line x1={x - size} y1={y - size} x2={x + size} y2={y + size} />
                            <line x1={x + size} y1={y - size} x2={x - size} y2={y + size} />
                        </g>
                    );
                } else if (fret === 0) {
                    // Open (Circle above nut)
                    return (
                        <circle
                            key={`open-${stringIdx}`}
                            cx={getStringX(stringIdx)}
                            cy={paddingY - 8}
                            r={3}
                            fill="none"
                            stroke={stringColor}
                            strokeWidth={1}
                        />
                    );
                } else {
                    // Fretted
                    // If covered by barre, don't draw individual dot?
                    // Actually standard diagrams often draw dots on top of barre or just the barre.
                    // Let's check overlap.
                    const isBarre = barres && barres.includes(fret);
                    // For now, let's just draw dots. If barre exists, it's drawn behind.

                    const relFret = fret - (baseFret - 1);
                    if (relFret < 1 || relFret > numFrets) return null;

                    return (
                        <g key={`dot-${stringIdx}`}>
                            {/* Only draw circle if not part of barre, OR if we want to show finger number on top of barre? */}
                            {/* If barre, we drew a rect. */}

                            <circle
                                cx={getStringX(stringIdx)}
                                cy={getFretY(relFret)}
                                r={dotRadius}
                                fill={dotColor}
                            />
                            {/* Finger Number */}
                            {fingers && fingers[stringIdx] > 0 && (
                                <text
                                    x={getStringX(stringIdx)}
                                    y={getFretY(relFret)}
                                    dy="0.35em"
                                    textAnchor="middle"
                                    fill={dotTextColor}
                                    fontSize={dotRadius * 1.2}
                                    className="font-bold"
                                >
                                    {fingers[stringIdx]}
                                </text>
                            )}
                        </g>
                    );
                }
            })}

            {/* Base Fret Label */}
            {baseFret > 1 && (
                <text
                    x={paddingX - 8}
                    y={getFretY(1)}
                    dy="0.35em"
                    textAnchor="end"
                    fill={stringColor}
                    fontSize="10"
                    className="font-medium"
                >
                    {baseFret}fr
                </text>
            )}
        </svg>
    );
};
