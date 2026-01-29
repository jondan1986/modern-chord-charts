
import { Section } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { LineRenderer } from "./LineRenderer";
import { Line } from "@/mcs-core/model";

interface Props {
    section: Section;
    theme: Theme;
}

export const SectionRenderer: React.FC<Props> = ({ section, theme }) => {
    // Section Header Style
    const headerStyle: React.CSSProperties = {
        color: theme.colors.section_header,
        fontWeight: "bold",
        textTransform: "uppercase",
        fontSize: "0.85em",
        marginBottom: "0.25em",
        marginTop: "1em",
    };

    return (
        <div className="mb-6 break-inside-avoid">
            {/* Section Label */}
            <div style={headerStyle}>
                {section.label}
                {section.bars && (
                    <span className="ml-2 px-1.5 py-0.5 text-[0.7em] border rounded opacity-70" style={{ borderColor: theme.colors.section_header }}>
                        {section.bars} bars
                    </span>
                )}
            </div>

            {/* Lines */}
            <div>
                {section.lines.map((line, idx) => {
                    // Runtime check if line is object or string (even though parser ensures objects, typescript might be wary)
                    // The parser ensures all lines are Line objects in strict mode.
                    if (typeof line === 'string') return null;
                    return <LineRenderer key={idx} line={line as Line} theme={theme} />;
                })}
            </div>
        </div>
    );
};
