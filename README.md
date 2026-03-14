# Modern Chord Charts

Modern Chord Charts is a self-hosted web application for creating, managing, and performing musical chord charts. Songs are written in a custom YAML-based format called **MCS** (Modern Chord Specification), which separates musical content from presentation — enabling dynamic transposition, custom themes, and flexible layouts.

Built with Next.js, it runs as a lightweight Docker container on your local network, making it ideal for worship teams, bands, and any group that needs shared chord charts on stage.

## Features

- **YAML-Based Chord Charts** — Write songs in the MCS format with inline chord notation (`[C]Amazing [G]Grace`) and structured sections (verse, chorus, bridge, etc.)
- **Chord Grids** — Visualize instrumentals and intros with pipe-delimited grids (`| C . . . | G . . . |`)
- **Live Editor** — Split-pane Monaco editor with real-time preview; see changes as you type
- **Transposition** — Transpose any song to a different key on the fly from the viewer
- **Capo Support** — Per-player capo control that adjusts chord shapes without changing the sounding key
- **Arrangements** — Define multiple structures for a single song (e.g., "Full", "Radio Edit", "Live") and switch between them
- **Setlists** — Group songs into ordered setlists for gigs and services
- **Themes** — Built-in light/dark themes plus a full theme editor for custom colors, fonts, and layout options
- **Chord Diagrams** — Auto-generated guitar chord diagrams displayed alongside charts
- **ChordPro Import/Export** — Import existing `.chopro`/`.chordpro` files and export back to ChordPro format
- **Playback Sync** — Master/player mode with a Web Audio click track and live section highlighting across devices on the same network
- **PWA** — Installable as a Progressive Web App with offline support via service worker
- **SQLite Storage** — Songs and setlists stored in a single SQLite database file, auto-seeded from `.mcs` files on first run

## Quick Start

```bash
git clone https://github.com/jondan1986/modern-chord-charts.git
cd modern-chord-charts
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For Docker deployment, see the [Deployment Guide](docs/DEPLOYMENT.md).

## Documentation

- **[Development Guide](docs/DEVELOPMENT.md)** — Local setup, dev commands, testing, building from source
- **[Deployment Guide](docs/DEPLOYMENT.md)** — Docker, Docker Compose, Raspberry Pi, LAN access, data backups
- **[MCS Format Guide](docs/MCS_FORMAT_GUIDE.md)** — Learn how to write `.mcs` files with lyrics, chords, grids, and arrangements

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              #   Library (song/setlist browser)
  editor/page.tsx       #   Split-pane YAML editor + live preview
  viewer/page.tsx       #   Read-only song display
  themes/page.tsx       #   Theme browser and editor
  playback/page.tsx     #   Playback sync (master/player)
  setlist/[id]/page.tsx #   Setlist playback view
src/
  mcs-core/             # Parser, validator, transposer, data model
  state/                # Zustand stores (app state, playback state)
  components/           # React components (viewer, editor, library, playback)
  services/             # Storage, chord DB, ChordPro import/export, playback engine
  actions/              # Next.js Server Actions (file I/O)
  lib/                  # SQLite database setup
songs/                  # Seed .mcs files (imported on first run)
docs/                   # Documentation
```

## Tech Stack

- **Next.js 16** (App Router, Server Actions, standalone output)
- **React 19** with TypeScript
- **Tailwind CSS 4**
- **Zustand 5** for client-side state
- **Monaco Editor** for YAML editing
- **SQLite** (via better-sqlite3) for server-side storage
- **Web Audio API** for click track playback
- **Vitest** for testing

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE). See the [LICENSE](LICENSE) file for details.
