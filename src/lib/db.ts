import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'songs.db');

function createDb(): Database.Database {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const instance = new Database(DB_PATH);
  instance.pragma('journal_mode = WAL');

  instance.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      artist     TEXT,
      yaml       TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS setlists (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      song_ids   TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Seed from .mcs files if DB is empty
  const { count } = instance.prepare('SELECT COUNT(*) as count FROM songs').get() as { count: number };
  if (count === 0) {
    const songsDir = path.join(process.cwd(), 'songs');
    if (fs.existsSync(songsDir)) {
      const files = fs.readdirSync(songsDir).filter(f => f.endsWith('.mcs'));
      if (files.length > 0) {
        const insert = instance.prepare(
          'INSERT OR IGNORE INTO songs (id, title, artist, yaml, updated_at) VALUES (?, ?, ?, ?, ?)'
        );
        const insertMany = instance.transaction((rows: Parameters<typeof insert.run>[]) => {
          for (const row of rows) insert.run(...row);
        });

        const rows: Parameters<typeof insert.run>[] = [];
        for (const file of files) {
          try {
            const yaml = fs.readFileSync(path.join(songsDir, file), 'utf-8');
            const stats = fs.statSync(path.join(songsDir, file));
            const title = yaml.match(/title:\s*"([^"]+)"/)?.[1] ?? file.replace('.mcs', '');
            const artist = yaml.match(/artist:\s*"([^"]+)"/)?.[1] ?? 'Unknown';
            rows.push([file, title, artist, yaml, Math.floor(stats.mtimeMs / 1000)]);
          } catch (err) {
            console.error(`DB seed: failed to import ${file}:`, err);
          }
        }
        insertMany(rows);
        console.log(`DB: seeded ${rows.length} songs from songs/ directory`);
      }
    }
  }

  // Seed default setlist if setlists table is empty
  const { count: setlistCount } = instance.prepare('SELECT COUNT(*) as count FROM setlists').get() as { count: number };
  if (setlistCount === 0) {
    // Find seed songs by title (IDs depend on filename casing)
    const amazingGrace = instance.prepare("SELECT id FROM songs WHERE title LIKE '%Amazing Grace%'").get() as { id: string } | undefined;
    const itIsWell = instance.prepare("SELECT id FROM songs WHERE title LIKE '%It Is Well%'").get() as { id: string } | undefined;
    const seedSongIds = [amazingGrace?.id, itIsWell?.id].filter(Boolean) as string[];
    if (seedSongIds.length > 0) {
      instance.prepare(
        'INSERT OR IGNORE INTO setlists (id, name, song_ids, updated_at) VALUES (?, ?, ?, ?)'
      ).run('default-hymns', 'Public Domain Hymns', JSON.stringify(seedSongIds), Math.floor(Date.now() / 1000));
      console.log('DB: seeded default setlist "Public Domain Hymns"');
    }
  }

  return instance;
}

declare global {
  var __db: Database.Database | undefined;
}

const db: Database.Database =
  process.env.NODE_ENV === 'production'
    ? createDb()
    : (globalThis.__db ??= createDb());

export default db;
