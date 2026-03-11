# Modern Chord Charts

Modern Chord Charts is a self-hosted web application for creating, managing, and performing musical chord charts. Songs are written in a custom YAML-based format called **MCS** (Modern Chord Specification), which separates musical content from presentation — enabling dynamic transposition, custom themes, and flexible layouts.

Built with Next.js, it runs as a lightweight Docker container on your local network, making it ideal for worship teams, bands, and any group that needs shared chord charts on stage.

## Features

- **YAML-Based Chord Charts** — Write songs in the MCS format with inline chord notation (`[C]Amazing [G]Grace`) and structured sections (verse, chorus, bridge, etc.)
- **Chord Grids** — Visualize instrumentals and intros with pipe-delimited grids (`| C . . . | G . . . |`)
- **Live Editor** — Split-pane Monaco editor with real-time preview; see changes as you type
- **Transposition** — Transpose any song to a different key on the fly from the viewer
- **Arrangements** — Define multiple structures for a single song (e.g., "Full", "Radio Edit", "Live") and switch between them
- **Setlists** — Group songs into ordered setlists for gigs and services
- **Themes** — Built-in light/dark themes plus a full theme editor for custom colors, fonts, and layout options
- **Chord Diagrams** — Auto-generated guitar chord diagrams displayed alongside charts
- **ChordPro Import/Export** — Import existing `.chopro`/`.chordpro` files and export back to ChordPro format
- **Playback Sync** — Master/player mode with a Web Audio click track and live section highlighting across devices on the same network
- **PWA** — Installable as a Progressive Web App with offline support via service worker
- **SQLite Storage** — Songs and setlists stored in a single SQLite database file, auto-seeded from `.mcs` files on first run

## Getting Started

### Prerequisites

- **Node.js 20+** and npm, or
- **Docker** (recommended for deployment)

### Development

```bash
git clone https://github.com/jondan1986/modern-chord-charts.git
cd modern-chord-charts
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once (CI) |

## Docker Deployment (LAN)

The recommended way to run Modern Chord Charts on your local network is with Docker. The pre-built image is hosted on GitHub Container Registry (GHCR) — no need to clone the repo or build anything. Docker bundles everything (Node.js, the app, and SQLite) so there are no external dependencies.

### Quick Start

Pull and run the container in one command:

```bash
docker run -d \
  --name chord-charts \
  -p 3000:3000 \
  -v chord_data:/app/data \
  --restart unless-stopped \
  ghcr.io/jondan1986/modern-chord-charts:latest
```

Open [http://localhost:3000](http://localhost:3000) in your browser. That's it.

> **Important:** The `-p 3000:3000` flag is required — it maps the container's port to your machine. Without it, the app won't be accessible.

### Using Docker Compose

For easier management, create a file called `docker-compose.yml` anywhere on your machine:

```yaml
services:
  chord-charts:
    image: ghcr.io/jondan1986/modern-chord-charts:latest
    ports:
      - "3000:3000"
    volumes:
      - chord_data:/app/data
    restart: unless-stopped

volumes:
  chord_data:
```

Then run from the same directory:

```bash
docker compose up -d
```

> **Note:** `docker compose` looks for `docker-compose.yml` in your current directory. You can run from a different directory with `docker compose -f /path/to/docker-compose.yml up -d`.

To update to a new version:

```bash
docker compose pull
docker compose down && docker compose up -d
```

### Accessing from Other Devices on Your Network

Once the container is running, any device on your local network can access the app:

1. Find the host machine's local IP address:
   ```bash
   # Linux / macOS
   hostname -I

   # Windows (run in PowerShell or Command Prompt)
   ipconfig
   ```
   Look for an address like `192.168.x.x` or `10.0.x.x`.

2. From any phone, tablet, or laptop on the same Wi-Fi/network, open:
   ```
   http://<host-ip>:3000
   ```
   For example: `http://192.168.1.50:3000`

3. On mobile devices, tap the browser's **"Add to Home Screen"** option to install it as a PWA for a full-screen, app-like experience.

### Customizing the Port

To run on a different port (e.g., 8080), change the first number in the port mapping:

```bash
docker run -d -p 8080:3000 -v chord_data:/app/data ghcr.io/jondan1986/modern-chord-charts:latest
```

Then access the app at `http://localhost:8080`.

### Data Persistence

Song and setlist data is stored in a SQLite database inside the container. The `-v chord_data:/app/data` flag creates a Docker volume that persists your data across container restarts, stops, and upgrades.

**Back up your data:**

```bash
docker cp chord-charts:/app/data/songs.db ./songs-backup.db
```

**Restore from a backup:**

```bash
docker cp ./songs-backup.db chord-charts:/app/data/songs.db
docker restart chord-charts
```

### Building from Source

If you prefer to build the image yourself instead of pulling from GHCR:

```bash
git clone https://github.com/jondan1986/modern-chord-charts.git
cd modern-chord-charts
docker build -t modern-chord-charts .
docker run -d --name chord-charts -p 3000:3000 -v chord_data:/app/data modern-chord-charts
```

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
docs/                   # MCS format documentation
```

## Documentation

- **[MCS Format Guide](docs/MCS_FORMAT_GUIDE.md)** — Learn how to write `.mcs` files, including lyrics, chords, grids, and arrangements.

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
