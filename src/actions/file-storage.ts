"use server";

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SONGS_DIR = path.join(process.cwd(), 'songs');

// Ensure directory exists
const initDir = async () => {
    try {
        await fs.access(SONGS_DIR);
    } catch {
        await fs.mkdir(SONGS_DIR, { recursive: true });
    }
};

export interface FileSong {
    id: string; // filename without extension
    title: string;
    artist: string;
    yaml: string;
    updatedAt: number;
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
}

// Extract minimal metadata for listing without full parsing overhead if possible,
// but for now we read full file.
// Ideally usage of 'yaml' lib to parse safely.
// We'll regex for speed on listing.

export async function listSongs(): Promise<FileSong[]> {
    await initDir();
    const files = await fs.readdir(SONGS_DIR);
    const mcsFiles = files.filter(f => f.endsWith('.mcs'));

    const songs: FileSong[] = [];

    for (const file of mcsFiles) {
        try {
            const filePath = path.join(SONGS_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const stats = await fs.stat(filePath);

            // parse metadata
            const titleMatch = content.match(/title:\s*"([^"]+)"/);
            const artistMatch = content.match(/artist:\s*"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : file.replace('.mcs', '');
            const artist = artistMatch ? artistMatch[1] : 'Unknown';

            songs.push({
                id: file, // Use filename as ID
                title,
                artist,
                yaml: content,
                updatedAt: stats.mtimeMs
            });
        } catch (err) {
            console.error(`Error reading song file ${file}:`, err);
        }
    }

    // Sort by updated descending
    return songs.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveSongFile(yaml: string, originalFilename?: string): Promise<string> {
    await initDir();

    const titleMatch = yaml.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    const safeTitle = sanitizeFilename(title) || 'Untitled';
    const targetBaseName = safeTitle;
    let targetFilename = `${targetBaseName}.mcs`;

    // 1. Calculate the intended filename.
    // If collision with DIFFERENT file, find a unique name.

    // We need to know if targetFilename exists.
    let finalTarget = targetFilename;

    // Helper to check existence
    const exists = async (f: string) => {
        try {
            await fs.access(path.join(SONGS_DIR, f));
            return true;
        } catch {
            return false;
        }
    };

    if (originalFilename) {
        // CASE: UPDATING EXISTING SONG
        if (originalFilename === targetFilename) {
            // Title matches filename. Simple overwrite.
            finalTarget = originalFilename;
        } else {
            // Title changed? Or just different filename?
            // User wants filename to reflect title.
            // Try to use targetFilename.

            // Check if targetFilename exists.
            if (await exists(targetFilename)) {
                // Collision!
                // If the collision IS the original file (unlikely if strictly inequal strings, unless case sensitivity issue on Windows),
                // handled by strict inequality check above.
                // So it's a diff file. We must rename with suffix.
                let suffix = 1;
                while (true) {
                    const candidate = `${targetBaseName}_${suffix}.mcs`;
                    if (candidate === originalFilename) {
                        // We bumped into ourselves? Then keep it.
                        finalTarget = candidate;
                        break;
                    }
                    if (!await exists(candidate)) {
                        finalTarget = candidate;
                        break;
                    }
                    suffix++;
                }
            }

            // Now finalTarget is unique (or is us).
            // If finalTarget != originalFilename, we are renaming.
        }

    } else {
        // CASE: NEW SONG
        // Avoid collision
        if (await exists(targetFilename)) {
            let suffix = 1;
            while (true) {
                const candidate = `${targetBaseName}_${suffix}.mcs`;
                if (!await exists(candidate)) {
                    targetFilename = candidate;
                    break;
                }
                suffix++;
            }
        }
        finalTarget = targetFilename;
    }

    // Write the file to finalTarget
    await fs.writeFile(path.join(SONGS_DIR, finalTarget), yaml, 'utf-8');

    // If we renamed (original existed and was different), delete the old one.
    if (originalFilename && originalFilename !== finalTarget) {
        try {
            await fs.unlink(path.join(SONGS_DIR, originalFilename));
        } catch (e) {
            console.warn(`Failed to delete old file ${originalFilename} during rename:`, e);
            // Non-critical, but messy.
        }
    }

    return finalTarget;
}

export async function deleteSongFile(filename: string): Promise<void> {
    await initDir();
    const filePath = path.join(SONGS_DIR, filename);
    await fs.unlink(filePath);
}
