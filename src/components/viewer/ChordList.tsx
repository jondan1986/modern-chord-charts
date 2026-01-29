import React, { useState } from 'react';
import { Song, Theme } from '@/mcs-core/model';
import { ChordService, Instrument } from '@/src/services/chords/chord-db';
import { ChordDiagram } from './ChordDiagram';

interface Props {
    song: Song;
    theme: Theme;
}

export const ChordList: React.FC<Props> = ({ song, theme }) => {
    const [instrument, setInstrument] = useState<Instrument>('guitar');
    const [isOpen, setIsOpen] = useState(true);

    // Extract unique chords
    const chords = React.useMemo(() => {
        const set = new Set<string>();
        song.sections.forEach(section => {
            section.lines.forEach(line => {
                // Determine if line is object (strict Line) or string (compact)
                // Parser usually returns object for segments, but check type
                if (typeof line === 'object' && line.content) {
                    line.content.forEach(segment => {
                        if (segment.chord) {
                            set.add(segment.chord);
                        }
                    });
                }
            });
        });
        return Array.from(set).sort();
    }, [song]);

    if (chords.length === 0) return null;

    return (
        <div className="mb-8 p-4 rounded-xl border bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-sm" style={{ borderColor: theme.colors.section_header }}>
            <div className="flex justify-between items-center mb-4">
                <div
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">Chords</h3>
                    <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''} opacity-50 text-xs`}>
                        ▼
                    </span>
                </div>

                <div className="flex gap-2">
                    {(['guitar', 'ukulele'] as Instrument[]).map(inst => (
                        <button
                            key={inst}
                            onClick={() => setInstrument(inst)}
                            className={`px-2 py-1 text-xs rounded border transition capitalize ${instrument === inst
                                ? 'bg-white dark:bg-gray-700 shadow-sm font-medium'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent'
                                }`}
                            style={{
                                color: instrument === inst ? theme.colors.chord : undefined,
                                borderColor: instrument === inst ? theme.colors.section_header : undefined
                            }}
                        >
                            {inst}
                        </button>
                    ))}
                    {/* Piano placeholder */}
                    <button
                        className="px-2 py-1 text-xs rounded border border-transparent text-gray-300 dark:text-gray-700 cursor-not-allowed"
                        title="Piano chords coming soon"
                    >
                        Piano
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="flex flex-wrap gap-6">
                    {chords.map(chordName => {
                        const def = ChordService.getChord(instrument, chordName);
                        // Use first position for now
                        const position = def?.positions[0];

                        return (
                            <div key={chordName} className="flex flex-col items-center gap-2">
                                <div className="font-bold text-sm">{chordName}</div>
                                {position ? (
                                    <ChordDiagram
                                        position={position}
                                        instrument={instrument === 'piano' ? 'guitar' : instrument} // Fallback type safety
                                        theme={theme}
                                        className="w-20"
                                    />
                                ) : (
                                    <div className="w-20 h-24 flex items-center justify-center text-xs opacity-40 border border-dashed rounded">
                                        ?
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
