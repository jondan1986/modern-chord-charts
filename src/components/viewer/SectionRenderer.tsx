
import { Section } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { LineRenderer } from "./LineRenderer";
import { Line } from "@/mcs-core/model";
import { GridRenderer } from "./GridRenderer";

interface Props {
    section: Section;
    theme: Theme;
}

export const SectionRenderer: React.FC<Props> = ({ section, theme }) => {
    if (section.type === 'grid') {
        return <GridRenderer section={section} theme={theme} />;
    }

    // Section Header Style
    return (
        <div className="mb-6 break-inside-avoid">
            {/* Section Label */}
            <div
                className={`font-bold uppercase text-sm mb-1 mt-4 ${theme.name === "Dark Mode" ? "text-gray-600" : "text-gray-400"
                    }`}
            >
                {section.label}
                {section.bars && (
                    <span
                        className={`ml-2 px-1.5 py-0.5 text-[0.7em] border rounded opacity-70 ${theme.name === "Dark Mode" ? "border-gray-600" : "border-gray-400"
                            }`}
                    >
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
