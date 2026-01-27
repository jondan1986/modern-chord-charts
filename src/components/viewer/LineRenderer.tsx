
import { Line } from "@/mcs-core/model";
import { Theme } from "@/mcs-core/model";
import React from "react";
import { ChordLyricPair } from "./ChordLyricPair";

interface Props {
    line: Line;
    theme: Theme;
}

export const LineRenderer: React.FC<Props> = ({ line, theme }) => {
    return (
        <div className="flex flex-wrap items-end my-2">
            {/* items-end aligns lyrics to baseline, chords stack up */}
            {line.content.map((segment, idx) => (
                <ChordLyricPair key={idx} segment={segment} theme={theme} />
            ))}
        </div>
    );
};
