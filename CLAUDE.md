# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Next.js dev server (IDX preview tees output to dev-server.log)
npm run build      # Production build
npm run lint       # ESLint (flat config, ESLint 9+)
npm test           # Vitest in watch mode
npm run test:ci    # Vitest single run (for CI)
```

To run a single test file: `npx vitest run src/path/to/file.test.ts`

**Dev server**: The Firebase Studio (IDX) preview manages the dev server automatically — do NOT start `npm run dev` manually. The preview tees dev server output to `dev-server.log` in the project root. Read this file to check for build errors, warnings, or server status.

## Architecture

**Modern Chord Charts** is a Next.js 16 (App Router) application for creating and displaying chord charts using a custom YAML-based format called MCS (Modern Chord Specification).

### Stack
- **React 19 + Next.js 16** with App Router and Server Actions
- **TypeScript** with path alias `@/*` → `src/*`
- **Tailwind CSS 4** (PostCSS plugin variant)
- **Zustand 5** for client-side state
- **Monaco Editor** for YAML editing
- **Vitest + jsdom** for testing

### Data Flow

1. Songs are stored as `.mcs` files (YAML text) in the `songs/` directory
2. Server Actions in `src/actions/file-storage.ts` handle file I/O
3. `src/services/storage/index.ts` (FileStorageService) wraps those actions
4. The Zustand store (`src/state/store.ts`) holds active YAML content and UI state
5. `src/mcs-core/parser.ts` (MCSParser) converts YAML → `Song` objects
6. `src/components/viewer/` renders `Song` objects as styled chord charts

### MCS Data Model (`src/mcs-core/model.ts`)

- **Song** → metadata + sections + arrangements (multiple play-orders)
- **Section** → typed content blocks (verse, chorus, bridge, grid, etc.)
- **Line** → array of **LineSegment** objects pairing chords with lyrics
- **Compact syntax**: `[C]text` in YAML is expanded to strict LineSegment objects by the parser
- **Theme**: per-song color/font configuration applied via CSS variables

### Pages
- `app/page.tsx` — Library (song/setlist browser)
- `app/editor/page.tsx` — Split view: Monaco YAML editor (left) + live SongViewer preview (right)
- `app/viewer/page.tsx` — Read-only song display
- `app/setlist/[id]/page.tsx` — Setlist playback

### Key Directories
- `src/mcs-core/` — Parser, validator (Zod), transposition, data model
- `src/state/` — Zustand store
- `src/components/viewer/` — Song rendering components and theme definitions
- `src/components/editor/` — Editor modal dialogs
- `src/components/library/` — Song/setlist browsing components
- `src/services/` — Storage service, chord DB, ChordPro importer
- `src/actions/` — Next.js Server Actions (file I/O)
- `docs/MCS_FORMAT_GUIDE.md` — User-facing MCS format reference

## Backlog Management

The project backlog is managed in **Linear** via MCP (configured in `.mcp.json`).

- **Team**: Modern-chord-charts (key: `MOD`)
- **Team ID**: `27f74917-5705-4986-aada-95436192dba8`
- Use `mcp__linear__list_issues` to view the backlog before starting work
- Use `mcp__linear__update_issue` to move issues through the workflow:
  - **Todo** → **In Progress**: when starting work on an issue
  - **In Progress** → **In Review**: when implementation is complete and ready for user validation
  - **In Review** → **Done**: only after the user has validated the success criteria and approved the change
- When creating new issues, include a user story, scope, and success criteria checklist
- Never mark an issue as Done without explicit user approval
