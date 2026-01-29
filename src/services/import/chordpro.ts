import { JSDOM } from 'jsdom';

export class ChordProConverter {
    static convert(chordPro: string): string {
        const lines = chordPro.split(/\r?\n/);
        const metadata: Record<string, any> = {};
        const sections: any[] = [];
        let currentSection: any = null;

        // Helper to start a new section
        const startSection = (label: string = "Other", type: string = "other") => {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                label: label,
                type: type.toLowerCase(),
                lines: []
            };
        };

        const processLine = (line: string) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Directives
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                const content = trimmed.slice(1, -1);
                const parts = content.split(":");
                const key = parts[0].toLowerCase().trim();
                const value = parts.slice(1).join(":").trim();

                switch (key) {
                    case "title":
                    case "t":
                        metadata.title = value;
                        break;
                    case "subtitle":
                    case "st":
                    case "artist":
                        metadata.artist = value;
                        break;
                    case "key":
                        metadata.key = value;
                        break;
                    case "time":
                        metadata.time_signature = value;
                        break;
                    case "tempo":
                        metadata.tempo = parseInt(value, 10);
                        break;
                    // Sections
                    case "c":
                    case "comment":
                    case "soc":
                    case "start_of_chorus":
                        startSection("Chorus", "chorus");
                        if (key === "c" || key === "comment") {
                            // usually {c: Chorus} acts as label implies next block is chorus
                            // but sometimes it is just a comment. 
                            // For our purposes, if it starts a section, we use the value as label.
                            if (value) currentSection.label = value;
                        }
                        break;
                    case "sov":
                    case "start_of_verse":
                        startSection("Verse", "verse");
                        break;
                    case "eoc":
                    case "end_of_chorus":
                    case "eov":
                    case "end_of_verse":
                        // Maybe handle explicitly, but startSection logic handles implicit closing.
                        break;
                    default:
                        // Treat as comment or unknown directive. 
                        // Could insert into current section as comment line?
                        break;
                }
                return;
            }

            // Check for section headers like "Chorus:" or "[Verse 1]" commonly found in raw text too
            if (trimmed.endsWith(":") && trimmed.length < 20) {
                const label = trimmed.slice(0, -1);
                startSection(label, label.toLowerCase().includes("chorus") ? "chorus" : "verse");
                return;
            }

            // Standard line
            // If no section, make one
            if (!currentSection) {
                startSection("Verse 1", "verse");
            }

            currentSection.lines.push(trimmed);
        };

        lines.forEach(processLine);

        // Push final section
        if (currentSection) {
            sections.push(currentSection);
        }

        // Default Metadata
        if (!metadata.title) metadata.title = "Untitled Song";
        if (!metadata.artist) metadata.artist = "Unknown Artist";

        // Format to YAML
        // using manual string construction to ensure control over "Compact" format
        let yaml = `schema_version: "1.0"\n`;
        yaml += "metadata:\n";
        yaml += `  title: "${metadata.title}"\n`;
        yaml += `  artist: "${metadata.artist}"\n`;
        if (metadata.key) yaml += `  key: "${metadata.key}"\n`;
        if (metadata.tempo) yaml += `  tempo: ${metadata.tempo}\n`;
        if (metadata.time_signature) yaml += `  time_signature: "${metadata.time_signature}"\n`;

        yaml += "\nsections:\n";
        sections.forEach((sec: any) => {
            // Generate a unique ID if not present (which it won't be from ChordPro)
            const id = crypto.randomUUID();
            yaml += `  - id: "${id}"\n`;
            yaml += `    label: "${sec.label}"\n`;
            // try to map type if standard
            let type = "other";
            const l = sec.label.toLowerCase();
            if (l.includes("chorus")) type = "chorus";
            else if (l.includes("verse")) type = "verse";
            else if (l.includes("bridge")) type = "bridge";
            else if (l.includes("intro")) type = "intro";
            else if (l.includes("outro")) type = "outro";
            else if (l.includes("tag")) type = "tag";
            else if (l.includes("instrumental")) type = "instrumental";
            else if (l.includes("hook")) type = "hook";

            yaml += `    type: "${type}"\n`;
            yaml += `    lines:\n`;
            sec.lines.forEach((line: string) => {
                // Escape double quotes in line
                const escaped = line.replace(/"/g, '\\"');
                yaml += `      - "${escaped}"\n`;
            });
        });

        return yaml;
    }
}
