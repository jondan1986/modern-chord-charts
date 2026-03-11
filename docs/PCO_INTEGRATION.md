# Planning Center Online (PCO) Integration — Feature Design Document

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [PCO Services API Reference](#3-pco-services-api-reference)
4. [Live API Validation Results](#4-live-api-validation-results)
5. [Data Model Mapping](#5-data-model-mapping)
6. [Import Workflow](#6-import-workflow)
7. [Export Workflow](#7-export-workflow)
8. [Implementation Architecture](#8-implementation-architecture)
9. [UI/UX Flow](#9-uiux-flow)
10. [Error Handling](#10-error-handling)
11. [Testing Strategy](#11-testing-strategy)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Overview

### Problem

Worship teams use Planning Center Online (PCO) Services to plan services, schedule volunteers, and manage song libraries. Modern Chord Charts currently has no PCO integration — users must manually recreate chord charts that already exist in PCO, leading to duplicated effort and version drift.

### Goals

- **Import** songs and setlists from PCO into Modern Chord Charts
- **Convert** PCO chord charts (ChordPro, lyrics-only, hybrid, empty) into MCS format
- **Preserve** PCO metadata (CCLI numbers, copyrights, arrangement IDs) for round-trip fidelity
- **Export** MCS files back to PCO as arrangement attachments
- **Integrate** seamlessly into the existing library/editor workflow

### User Stories

1. **Connect to PCO** — As a worship leader, I want to enter my PCO credentials once so the app can access my church's song library and service plans.
2. **Browse Plans** — As a worship leader, I want to see upcoming service plans and their song lists so I can pick which service to import.
3. **Import a Plan** — As a worship leader, I want to import an entire service plan as a setlist with all its songs converted to MCS format.
4. **Import a Single Song** — As a musician, I want to search and import individual songs from my church's PCO library.
5. **Export Back to PCO** — As a worship leader, I want to push my edited MCS chord chart back to PCO as an attachment on the arrangement, so the team can access it.

---

## 2. Authentication

### Personal Access Token (PAT) — Phase 1

PCO supports two auth methods. PATs are chosen for Phase 1 because they require no OAuth redirect infrastructure and work well for single-user/self-hosted deployments.

**How it works:**

- User creates a PAT at https://api.planningcenteronline.com/oauth/applications
- The PAT produces an **Application ID** and **Secret**
- All API requests use HTTP Basic Auth: `Authorization: Basic base64(app_id:secret)`

**Required header:**

```
User-Agent: ModernChordCharts/1.0
```

PCO requires a descriptive `User-Agent` header on all API requests.

### Credential Storage

Credentials are stored server-side in the SQLite database (never exposed to the browser):

```sql
CREATE TABLE IF NOT EXISTS pco_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Keys: 'pco_app_id', 'pco_secret'
```

Environment variables (`.env.local`) are supported as an alternative:

```env
PCO_APP_ID=your_application_id
PCO_SECRET=your_secret
```

**Resolution order:** `.env.local` → `pco_settings` table → prompt user to configure.

### OAuth — Deferred to Phase 2

OAuth 2.0 is the right choice for multi-tenant/hosted deployments but requires redirect URI handling, token refresh, and a registered OAuth app. Deferred to a future phase.

---

## 3. PCO Services API Reference

All endpoints use the base URL `https://api.planningcenteronline.com/services/v2`.

The PCO API follows the [JSON:API](https://jsonapi.org/) specification. Responses have this shape:

```json
{
  "data": { "type": "...", "id": "...", "attributes": {...}, "relationships": {...} },
  "included": [...],
  "links": { "self": "...", "next": "..." },
  "meta": { "total_count": 123, "count": 25 }
}
```

### 3.1 Service Types

```
GET /service_types
```

Returns all service types (e.g., "Sunday Morning", "Wednesday Night").

**Key attributes:** `id`, `name`, `frequency`, `sequence`

**Example response (abbreviated):**

```json
{
  "data": [
    {
      "type": "ServiceType",
      "id": "646697",
      "attributes": {
        "name": "Sunday Morning",
        "frequency": "Every 1 weeks",
        "sequence": 0
      }
    }
  ]
}
```

### 3.2 Plans (Services)

```
GET /service_types/{service_type_id}/plans?filter=future&order=-sort_date&per_page=10
```

**Filters:** `future`, `past`, `no_dates`
**Ordering:** `sort_date` (asc), `-sort_date` (desc)
**Pagination:** `per_page` (max 100), `offset`

**Key attributes:** `id`, `title`, `dates`, `short_dates`, `sort_date`, `items_count`, `series_title`

**Example response (abbreviated):**

```json
{
  "data": [
    {
      "type": "Plan",
      "id": "74710498",
      "attributes": {
        "title": null,
        "dates": "March 15, 2026",
        "short_dates": "Mar 15",
        "sort_date": "2026-03-15T00:00:00Z",
        "items_count": 21,
        "series_title": null
      }
    }
  ]
}
```

> **Note:** Date-based plans often have `title: null` — use `dates` or `short_dates` for display.

### 3.3 Plan Items (with Includes)

```
GET /service_types/{service_type_id}/plans/{plan_id}/items?include=song,arrangement,key
```

The `?include=song,arrangement,key` parameter is critical — it returns all related data in a **single request** rather than requiring N+1 queries.

**Item types:** `song`, `header`, `item`

**Key attributes on song items:** `title`, `key_name`, `sequence`

**Key relationships:** `song`, `arrangement`, `key`

**Example response (abbreviated):**

```json
{
  "data": [
    {
      "type": "Item",
      "id": "1094880155",
      "attributes": {
        "item_type": "song",
        "title": "You Are My Vision",
        "key_name": "E",
        "sequence": 3
      },
      "relationships": {
        "song": { "data": { "type": "Song", "id": "26627291" } },
        "arrangement": { "data": { "type": "Arrangement", "id": "53765662" } }
      }
    },
    {
      "type": "Item",
      "id": "1094880156",
      "attributes": {
        "item_type": "header",
        "title": "Worship",
        "sequence": 1
      }
    }
  ],
  "included": [
    {
      "type": "Song",
      "id": "26627291",
      "attributes": {
        "title": "You Are My Vision",
        "author": "Rend Collective",
        "ccli_number": 7067249,
        "copyright": "2015 Thankyou Music",
        "themes": "devotion, surrender"
      }
    },
    {
      "type": "Arrangement",
      "id": "53765662",
      "attributes": {
        "name": "Original",
        "chord_chart": "[F]You are my vision O King of my heart\n[C]Nothing else satisfies [Bb]only You [C]Lord",
        "chord_chart_key": "F",
        "has_chords": true,
        "lyrics": "You are my vision O King of my heart...",
        "sequence": ["Verse 1", "Chorus 1", "Verse 2", "Bridge"]
      }
    }
  ]
}
```

### 3.4 Songs Library

```
GET /songs?per_page=25&offset=0
```

**Pagination:** Up to 100 per page. Use `meta.total_count` for total.

**Key attributes:** `title`, `author`, `ccli_number`, `copyright`, `themes` (comma-separated string), `notes`

### 3.5 Song Arrangements

```
GET /songs/{song_id}/arrangements
```

Returns all arrangements for a song. Songs can have multiple arrangements (e.g., "Original", "Student Ministry", "Radio Version").

**Key attributes:** `name`, `chord_chart`, `chord_chart_key`, `has_chords`, `lyrics`, `sequence` (array of section labels)

### 3.6 Arrangement Sections (Structured)

```
GET /songs/{song_id}/arrangements/{arrangement_id}/sections
```

Returns structured section data — much better than parsing raw `chord_chart` for lyrics-only songs.

**Example response:**

```json
{
  "data": [
    {
      "type": "ArrangementSection",
      "id": "123",
      "attributes": {
        "label": "Verse 1",
        "lyrics": "I'll praise in the valley\n\rPraise on the mountain\n\rI'll praise when I'm sure\n\rPraise when I'm doubting"
      }
    },
    {
      "type": "ArrangementSection",
      "id": "124",
      "attributes": {
        "label": "Chorus 1",
        "lyrics": "I'll praise you, I'll praise you\n\rIn the valley, on the mountain"
      }
    }
  ]
}
```

> **Note:** Lyrics use `\n\r` line endings — must normalize to `\n` during conversion.

### 3.7 Arrangement Keys

```
GET /songs/{song_id}/arrangements/{arrangement_id}/keys
```

Returns available keys for an arrangement, including alternate/capo keys.

**Example response:**

```json
{
  "data": [
    {
      "type": "Key",
      "id": "456",
      "attributes": {
        "name": null,
        "alternate_keys": [
          { "name": "Capo 1", "key": "C" }
        ]
      }
    }
  ]
}
```

### 3.8 File Upload

```
POST https://upload.planningcenteronline.com/v2/files
Content-Type: multipart/form-data

file=@content;filename=song-name.mcs;type=text/yaml
```

**Returns:** A file upload identifier (UUID).

```json
{
  "data": {
    "type": "Upload",
    "id": "us4-4cddd4cd-2e7f-309a-1a6d-581e4eabe076",
    "attributes": {
      "content_type": "text/plain",
      "expires_at": "2026-03-11T18:30:00Z"
    }
  }
}
```

> **Note:** Returned `content_type` is always `text/plain` regardless of upload MIME type. Uploads expire after 1 hour.

### 3.9 Create Attachment on Arrangement

```
POST /songs/{song_id}/arrangements/{arrangement_id}/attachments
Content-Type: application/json

{
  "data": {
    "type": "Attachment",
    "attributes": {
      "filename": "song-name.mcs",
      "file_upload_identifier": "us4-4cddd4cd-2e7f-309a-1a6d-581e4eabe076"
    }
  }
}
```

**Returns:** HTTP 201 with attachment details (id, downloadable, url, filetype).

### 3.10 Delete Attachment

```
DELETE /songs/{song_id}/arrangements/{arrangement_id}/attachments/{attachment_id}
```

**Returns:** HTTP 204 No Content.

### 3.11 Update Arrangement chord_chart (Optional)

```
PATCH /songs/{song_id}/arrangements/{arrangement_id}
Content-Type: application/json

{
  "data": {
    "type": "Arrangement",
    "attributes": {
      "chord_chart": "updated ChordPro content..."
    }
  }
}
```

This overwrites the arrangement's chord chart in PCO. Use with caution — offer as an opt-in option.

---

## 4. Live API Validation Results

All endpoints and behaviors documented here were validated against a live PCO account.

### Service Types

- **15 service types** found (Sunday Morning id=646697, Nursery, Kidz Church, Good Friday, etc.)
- Response includes folder/parent relationships

### Plans

| Date | Items | Songs | Notes |
|------|-------|-------|-------|
| March 15, 2026 | 21 | 5 | Future |
| March 22, 2026 | 22 | — | Future |
| March 29, 2026 | 21 | — | Future |
| March 8, 2026 | 22 | — | Past |
| March 1, 2026 | 22 | — | Past |
| Feb 22, 2026 | 30 | — | Past |

- Plan titles are usually `null` (date-based plans) — use `dates` field
- Pagination with `filter=future|past`, `order=-sort_date`

### Plan Items with `?include=song,arrangement,key`

- Single request returns all song data — **no N+1 queries needed**
- Item types observed: `song`, `header`, `item` (no `media` items observed)
- March 15 songs: "Praise (w/Spanish)" key=E, "You Are My Vision" key=E, "Come Behold The Wondrous Mystery" key=E, "How Great Thou Art (w/Spanish)" key=D, "He Will Hold Me Fast" key=G

### chord_chart Format Variants (Critical Discovery)

Four distinct formats observed across 19 sampled arrangements:

#### Format 1: ChordPro with Chords (26% — 5/19 songs)

`has_chords: true`, no hybrid marker.

```
Verse 1
[F]You are my vision O King of my heart
[C]Nothing else satisfies [Bb]only You [C]Lord
```

**Conversion:** Parse with existing `ChordProConverter.convert()`.

#### Format 2: Lyrics-Only (53% — 10/19 songs)

`has_chords: false`, `chord_chart` length > 0 or sections exist.

```
Verse 1
I'll praise in the valley
Praise on the mountain
```

**Conversion:** Fetch `/sections` endpoint for structured data → generate MCS YAML with lyrics-only sections.

#### Format 3: Hybrid (5% — 1/19 songs)

`has_chords: true` but content contains BOTH lyrics-only AND ChordPro portions, separated by `IMPORTED FROM SONGSELECT`.

```
Verse 1
O Lord my God when I in awesome wonder
Consider all the worlds Thy hands have made
...
IMPORTED FROM SONGSELECT
Verse 1
O Lord my [D]God,        when I in [G]awesome wonder
[D]Consider [A]all the [D]worlds Thy hands have made
```

**Conversion:** Split on `IMPORTED FROM SONGSELECT`, use the ChordPro portion → `ChordProConverter.convert()`.

#### Format 4: Empty (16% — 3/19 songs)

`chord_chart: null`, `lyrics: ""`, `sections: []`.

**Conversion:** Import title/artist/key as metadata only. Warn user "no content available."

### Content Sanitization Issues Discovered

| Issue | Example | Action |
|-------|---------|--------|
| `PAGE_BREAK` marker | `PAGE_BREAK` on its own line | Strip entirely |
| `COLUMN_BREAK` marker | `COLUMN_BREAK` on its own line | Strip entirely |
| HTML `<b>` tags | `<b>Espanol</b>`, `<b>Chorus 1</b>` | Strip tags, keep inner text |
| Double open brackets | `[[Gsus]` | Normalize to `[Gsus]` |
| Extra close brackets | `[Amin]]` | Normalize to `[Amin]` |
| Long-form chord names | `Amin`, `Amin7`, `Dmin7`, `Gsus` | Normalize: `Amin`→`Am`, `Dmin7`→`Dm7` |
| `\n\r` line endings | Sections endpoint lyrics | Normalize to `\n` |
| Parenthetical annotations | `(To Int.)`, `(VOICES)`, `(oh oh oh)` | Preserve as-is in lyrics |

### Songs Library

- **349 total songs** in the sampled PCO library
- Songs include: title, author, ccli_number, copyright, themes (comma-separated string)

### File Upload + Attachment Round-Trip (Validated)

Full round-trip confirmed working:

1. **Upload:** `POST https://upload.planningcenteronline.com/v2/files` → returns UUID
2. **Attach:** `POST /songs/{id}/arrangements/{id}/attachments` with UUID → HTTP 201, attachment visible in PCO UI
3. **Delete:** `DELETE /songs/{id}/arrangements/{id}/attachments/{id}` → HTTP 204

---

## 5. Data Model Mapping

### Song Metadata: PCO → MCS

| PCO Field | MCS Field (`SongMetadata`) | Notes |
|-----------|---------------------------|-------|
| `song.title` | `title` | Direct map |
| `song.author` | `artist` | Direct map |
| `item.key_name` or `arrangement.chord_chart_key` | `key` | Prefer item `key_name` (plan-specific key) |
| `song.ccli_number` | `ccli` | Cast to string |
| `song.copyright` | `copyright` | Direct map |
| `song.themes` | `themes` | Split comma-separated string → `string[]` |
| `arrangement.id` | `pco_arrangement_id` | Extensible metadata for round-trip |
| `song.id` | `pco_song_id` | Extensible metadata for round-trip |
| `arrangement.name` | `pco_arrangement_name` | Extensible metadata for round-trip |

> The `SongMetadata` interface supports `[key: string]: any`, so PCO-specific fields (prefixed `pco_`) are stored without model changes.

### Section Labels: PCO → MCS `SectionType`

| PCO Label | MCS `SectionType` | MCS `label` |
|-----------|--------------------|-------------|
| `Verse 1`, `Verse 2`, ... | `verse` | `Verse 1`, `Verse 2`, ... |
| `Chorus 1`, `Chorus 2`, ... | `chorus` | `Chorus 1`, `Chorus 2`, ... |
| `Bridge` | `bridge` | `Bridge` |
| `Intro` | `intro` | `Intro` |
| `Outro`, `Ending` | `outro` | `Outro` / `Ending` |
| `Interlude` | `instrumental` | `Interlude` |
| `Tag` | `tag` | `Tag` |
| `Misc 1`, `Misc 2`, ... | `other` | `Misc 1`, `Misc 2`, ... |
| Anything else | `other` | Original label preserved |

### Setlist Mapping: PCO Plan → MCS Setlist

| PCO Field | MCS Setlist | Notes |
|-----------|-------------|-------|
| `plan.dates` or `plan.title` | Setlist name | Prefer title, fall back to dates |
| Song items (filtered, ordered by `sequence`) | `songIds[]` | Map to local song IDs after import |
| `plan.id` | Stored as setlist metadata | For future sync |

### Key Resolution

The plan item `key_name` may differ from the arrangement's `chord_chart_key` (indicating transposition for that service). The import should:

1. Store `chord_chart_key` as the arrangement's native key
2. Store `key_name` as the MCS `metadata.key` (the key the team is playing in)
3. If they differ, note the transposition interval for potential auto-transpose

---

## 6. Import Workflow

### 6.1 Import Plan (Setlist + Songs)

```
Step 1: User selects service type
  → GET /service_types
  → Display list, user picks one

Step 2: User selects plan
  → GET /service_types/{id}/plans?filter=future&order=-sort_date&per_page=10
  → Display plan list with dates and song counts

Step 3: Fetch plan items with includes
  → GET /service_types/{id}/plans/{id}/items?include=song,arrangement,key
  → Parse JSON:API response, resolve included objects

Step 4: For each song item, convert to MCS
  → Detect chord_chart format variant (ChordPro / Lyrics-only / Hybrid / Empty)
  → Run sanitization pipeline
  → Convert to MCS YAML
  → Save via saveSongFile()

Step 5: Create setlist
  → Map imported song IDs to setlist
  → Save via saveSetlistFile()

Step 6: Display results
  → Show imported songs with status (success / lyrics-only / empty / error)
  → Open setlist in viewer
```

### 6.2 Import Single Song

```
Step 1: Search songs
  → GET /songs?per_page=25&offset=0 (browse)
  → Or filter by title if PCO supports it

Step 2: User selects song → fetch arrangements
  → GET /songs/{id}/arrangements
  → If multiple, let user pick arrangement

Step 3: Convert and save
  → Same conversion pipeline as plan import
  → Save via saveSongFile()
```

### 6.3 Conversion Pipeline

```typescript
function convertPCOToMCS(arrangement: PCOArrangement, song: PCOSong, keyName?: string): string {
  const chordChart = arrangement.chord_chart;
  const hasChords = arrangement.has_chords;

  // 1. Detect format
  if (!chordChart && !arrangement.lyrics) {
    return generateMetadataOnlyMCS(song, arrangement, keyName);
  }

  // 2. Sanitize
  let content = sanitize(chordChart ?? '');

  // 3. Route by format
  if (hasChords && content.includes('IMPORTED FROM SONGSELECT')) {
    // Hybrid: extract ChordPro portion
    content = content.split('IMPORTED FROM SONGSELECT').pop()!.trim();
    return ChordProConverter.convert(content);
  }

  if (hasChords) {
    // Standard ChordPro
    return ChordProConverter.convert(content);
  }

  // Lyrics-only: fetch structured sections
  const sections = await fetchArrangementSections(song.id, arrangement.id);
  return generateLyricsOnlyMCS(song, arrangement, sections, keyName);
}
```

### 6.4 Sanitization Pipeline

Applied to all `chord_chart` content before conversion:

```typescript
function sanitize(content: string): string {
  return content
    // Strip HTML tags
    .replace(/<\/?b>/g, '')
    // Strip layout markers
    .replace(/^PAGE_BREAK$/gm, '')
    .replace(/^COLUMN_BREAK$/gm, '')
    // Fix bracket typos
    .replace(/\[\[/g, '[')
    .replace(/\]\]/g, ']')
    // Normalize long-form chords
    .replace(/\b([A-G](?:#|b)?)min\b/g, '$1m')
    .replace(/\b([A-G](?:#|b)?)min7\b/g, '$1m7')
    // Normalize line endings
    .replace(/\n\r/g, '\n')
    .replace(/\r\n/g, '\n')
    // Remove empty lines left by stripped markers
    .replace(/\n{3,}/g, '\n\n');
}
```

---

## 7. Export Workflow

### 7.1 Export as Attachment

Push the current MCS file to PCO as an attachment on the original arrangement.

```
Step 1: Read PCO metadata from song
  → Check metadata.pco_song_id and metadata.pco_arrangement_id
  → If missing, prompt user to link song to a PCO arrangement

Step 2: Upload MCS file
  → POST https://upload.planningcenteronline.com/v2/files
  → Body: multipart/form-data with file content, filename, type=text/yaml
  → Response: file_upload_identifier (UUID)

Step 3: Create attachment
  → POST /songs/{pco_song_id}/arrangements/{pco_arrangement_id}/attachments
  → Body: { data: { type: "Attachment", attributes: { filename, file_upload_identifier } } }
  → Response: HTTP 201 with attachment details

Step 4: Confirm to user
  → Show success with link to arrangement in PCO
```

### 7.2 Export as chord_chart Update (Opt-in)

Optionally overwrite the arrangement's `chord_chart` field in PCO with ChordPro content.

```
Step 1: Convert MCS → ChordPro
  → Use existing ChordProExporter.export(song)

Step 2: Update arrangement
  → PATCH /songs/{pco_song_id}/arrangements/{pco_arrangement_id}
  → Body: { data: { type: "Arrangement", attributes: { chord_chart: chordProContent } } }

Step 3: Confirm to user
  → Warn that this overwrites the existing chord chart in PCO
```

---

## 8. Implementation Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/services/pco/client.ts` | HTTP client: Basic Auth, JSON:API parsing, pagination, rate limiting |
| `src/services/pco/types.ts` | TypeScript interfaces for PCO API responses |
| `src/services/pco/converter.ts` | PCO→MCS converter (handles all 4 chord_chart variants, sanitization) |
| `src/actions/pco.ts` | Next.js Server Actions for PCO operations (keeps credentials server-side) |
| `src/components/pco/PCOImportModal.tsx` | Multi-step import wizard |
| `src/components/pco/PCOExportButton.tsx` | Push-to-PCO button for editor/viewer |
| `src/components/pco/PCOSettingsPanel.tsx` | Credential entry/validation UI |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/db.ts` | Add `pco_settings` table creation in schema setup |
| `src/components/library/` | Add "Import from PCO" button to library toolbar |
| `src/components/viewer/` or `src/components/editor/` | Add PCOExportButton |

### Database Addition

Add to the `instance.exec()` block in `src/lib/db.ts`:

```sql
CREATE TABLE IF NOT EXISTS pco_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### `src/services/pco/client.ts` — Sketch

```typescript
const PCO_BASE = 'https://api.planningcenteronline.com/services/v2';
const PCO_UPLOAD = 'https://upload.planningcenteronline.com/v2/files';

export class PCOClient {
  private appId: string;
  private secret: string;

  constructor(appId: string, secret: string) {
    this.appId = appId;
    this.secret = secret;
  }

  private headers(): HeadersInit {
    const encoded = Buffer.from(`${this.appId}:${this.secret}`).toString('base64');
    return {
      'Authorization': `Basic ${encoded}`,
      'User-Agent': 'ModernChordCharts/1.0',
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${PCO_BASE}${path}`, { headers: this.headers() });
    if (!res.ok) throw new PCOError(res.status, await res.text());
    return res.json();
  }

  async post<T>(path: string, body: object): Promise<T> { /* ... */ }
  async patch<T>(path: string, body: object): Promise<T> { /* ... */ }
  async delete(path: string): Promise<void> { /* ... */ }

  async uploadFile(content: string, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([content], { type: 'text/yaml' }), filename);
    const res = await fetch(PCO_UPLOAD, {
      method: 'POST',
      headers: {
        'Authorization': this.headers()['Authorization'],
        'User-Agent': 'ModernChordCharts/1.0',
      },
      body: formData,
    });
    if (!res.ok) throw new PCOError(res.status, await res.text());
    const json = await res.json();
    return json.data.id; // file_upload_identifier UUID
  }

  // Pagination helper
  async getAll<T>(path: string, perPage = 25): Promise<T[]> {
    let offset = 0;
    const all: T[] = [];
    while (true) {
      const res = await this.get<any>(`${path}${path.includes('?') ? '&' : '?'}per_page=${perPage}&offset=${offset}`);
      all.push(...res.data);
      if (!res.links?.next) break;
      offset += perPage;
    }
    return all;
  }
}
```

### `src/services/pco/types.ts` — Key Interfaces

```typescript
export interface PCOServiceType {
  id: string;
  name: string;
  frequency: string;
}

export interface PCOPlan {
  id: string;
  title: string | null;
  dates: string;
  short_dates: string;
  sort_date: string;
  items_count: number;
  series_title: string | null;
}

export interface PCOItem {
  id: string;
  item_type: 'song' | 'header' | 'item';
  title: string;
  key_name: string | null;
  sequence: number;
  song?: PCOSong;         // resolved from included
  arrangement?: PCOArrangement; // resolved from included
}

export interface PCOSong {
  id: string;
  title: string;
  author: string;
  ccli_number: number | null;
  copyright: string | null;
  themes: string | null;   // comma-separated
}

export interface PCOArrangement {
  id: string;
  name: string;
  chord_chart: string | null;
  chord_chart_key: string | null;
  has_chords: boolean;
  lyrics: string;
  sequence: string[];      // section label order
}

export interface PCOSection {
  id: string;
  label: string;
  lyrics: string;
}
```

### `src/actions/pco.ts` — Server Actions Pattern

Following the pattern established in `src/actions/file-storage.ts`:

```typescript
"use server";

import db from '@/src/lib/db';
import { PCOClient } from '@/src/services/pco/client';

async function getClient(): Promise<PCOClient> {
  const appId = process.env.PCO_APP_ID
    ?? (db.prepare("SELECT value FROM pco_settings WHERE key = 'pco_app_id'").get() as any)?.value;
  const secret = process.env.PCO_SECRET
    ?? (db.prepare("SELECT value FROM pco_settings WHERE key = 'pco_secret'").get() as any)?.value;

  if (!appId || !secret) throw new Error('PCO credentials not configured');
  return new PCOClient(appId, secret);
}

export async function testPCOConnection(): Promise<{ ok: boolean; error?: string }> { /* ... */ }
export async function fetchServiceTypes(): Promise<PCOServiceType[]> { /* ... */ }
export async function fetchPlans(serviceTypeId: string, filter: 'future' | 'past'): Promise<PCOPlan[]> { /* ... */ }
export async function fetchPlanItems(serviceTypeId: string, planId: string): Promise<PCOItem[]> { /* ... */ }
export async function importPlan(serviceTypeId: string, planId: string): Promise<ImportResult> { /* ... */ }
export async function importSong(songId: string, arrangementId: string): Promise<string> { /* ... */ }
export async function exportToPCO(songId: string): Promise<ExportResult> { /* ... */ }
export async function savePCOCredentials(appId: string, secret: string): Promise<void> { /* ... */ }
```

---

## 9. UI/UX Flow

### 9.1 PCO Import Modal (Multi-Step Wizard)

Uses the existing `Modal` component (`src/components/ui/Modal.tsx`) as the container.

**Step 1 — Connect / Select Service Type**

```
┌─────────────────────────────────────┐
│ Import from Planning Center    [X]  │
├─────────────────────────────────────┤
│                                     │
│  Select Service Type:               │
│  ┌─────────────────────────────┐    │
│  │ ● Sunday Morning            │    │
│  │ ○ Wednesday Night            │    │
│  │ ○ Good Friday                │    │
│  └─────────────────────────────┘    │
│                                     │
│              [Next →]               │
└─────────────────────────────────────┘
```

**Step 2 — Select Plan**

```
┌─────────────────────────────────────┐
│ Import from Planning Center    [X]  │
├─────────────────────────────────────┤
│                                     │
│  Upcoming Services:                 │
│  ┌─────────────────────────────┐    │
│  │ ● Mar 15 — 5 songs          │    │
│  │ ○ Mar 22 — 5 songs          │    │
│  │ ○ Mar 29 — 5 songs          │    │
│  └─────────────────────────────┘    │
│                                     │
│        [← Back]  [Next →]          │
└─────────────────────────────────────┘
```

**Step 3 — Review & Import**

```
┌─────────────────────────────────────┐
│ Import from Planning Center    [X]  │
├─────────────────────────────────────┤
│                                     │
│  Songs to import (Mar 15):          │
│  ☑ Praise (w/Spanish) — key E      │
│  ☑ You Are My Vision — key E       │
│  ☑ Come Behold The Wondrous... — E  │
│  ☑ How Great Thou Art — key D      │
│  ☑ He Will Hold Me Fast — key G    │
│                                     │
│  ☑ Create setlist "Mar 15"         │
│                                     │
│        [← Back]  [Import]          │
└─────────────────────────────────────┘
```

**Step 4 — Results**

```
┌─────────────────────────────────────┐
│ Import Complete                [X]  │
├─────────────────────────────────────┤
│                                     │
│  ✓ Praise (w/Spanish) — imported    │
│  ✓ You Are My Vision — imported     │
│  ✓ Come Behold — imported           │
│  ⚠ How Great Thou Art — lyrics only │
│  ✓ He Will Hold Me Fast — imported  │
│                                     │
│  Setlist "Mar 15" created           │
│                                     │
│          [Open Setlist]             │
└─────────────────────────────────────┘
```

### 9.2 PCO Export Button

Appears in the editor toolbar and viewer header when a song has `pco_song_id` metadata.

```
[↑ Push to PCO]
```

Clicking opens a confirmation dialog:

```
┌─────────────────────────────────┐
│ Export to Planning Center       │
├─────────────────────────────────┤
│                                 │
│ "You Are My Vision"             │
│ Arrangement: Original           │
│                                 │
│ ○ Upload as attachment (.mcs)   │
│ ○ Update chord chart (ChordPro) │
│                                 │
│    [Cancel]  [Export]           │
└─────────────────────────────────┘
```

### 9.3 PCO Settings Panel

Accessible from a settings menu or gear icon. Simple credential entry form:

```
┌─────────────────────────────────┐
│ Planning Center Settings        │
├─────────────────────────────────┤
│                                 │
│ Application ID:                 │
│ ┌─────────────────────────────┐ │
│ │ ******************************** │
│ └─────────────────────────────┘ │
│                                 │
│ Secret:                         │
│ ┌─────────────────────────────┐ │
│ │ ******************************** │
│ └─────────────────────────────┘ │
│                                 │
│ Status: ● Connected (349 songs) │
│                                 │
│    [Test Connection]  [Save]    │
└─────────────────────────────────┘
```

---

## 10. Error Handling

### Authentication Errors

| HTTP Status | Cause | User Action |
|-------------|-------|-------------|
| 401 | Invalid or expired credentials | Prompt to re-enter PAT credentials |
| 403 | Insufficient permissions | Check PAT scope includes Services |

### Rate Limiting

PCO enforces rate limits (exact thresholds undocumented). Strategy:

- Check for `429 Too Many Requests` response
- Read `Retry-After` header if present
- Exponential backoff: 1s, 2s, 4s, max 3 retries
- Show "PCO is rate limiting requests, retrying..." in the UI

### Missing Data

| Scenario | Handling |
|----------|----------|
| `chord_chart: null` and `lyrics: ""` | Import metadata only, show warning icon |
| Song with no arrangements | Skip with warning "No arrangements found" |
| Arrangement with empty sections | Fall back to parsing `chord_chart` or `lyrics` field |
| Missing `ccli_number` | Import without — field is optional in MCS |

### Duplicate Detection

When importing a song that already exists locally:

1. Match by `pco_song_id` + `pco_arrangement_id` in metadata
2. If match found, prompt: "This song already exists. Overwrite / Skip / Import as copy?"
3. Default to skip to avoid accidental overwrites

### HTML Content in chord_chart

The sanitization pipeline (§6.4) handles HTML tags. If unexpected tags appear beyond `<b>`:

- Strip all HTML tags: `content.replace(/<[^>]+>/g, '')`
- Log a warning for review

---

## 11. Testing Strategy

### Unit Tests

| Test | File | Coverage |
|------|------|----------|
| Sanitization pipeline | `src/services/pco/converter.test.ts` | All 8 sanitization rules |
| ChordPro format detection | `src/services/pco/converter.test.ts` | 4 format variants |
| Section label → SectionType mapping | `src/services/pco/converter.test.ts` | All label patterns |
| Long-form chord normalization | `src/services/pco/converter.test.ts` | `Amin`→`Am`, `Dmin7`→`Dm7`, etc. |
| JSON:API response parsing | `src/services/pco/client.test.ts` | Included resource resolution |
| Credential resolution | `src/actions/pco.test.ts` | env var → DB → error fallback |

### Round-Trip Tests

```
PCO chord_chart (ChordPro) → sanitize → ChordProConverter → MCS YAML
  → MCSParser.parse() → Song → ChordProExporter.export() → ChordPro
  → Compare to sanitized original (structural equivalence)
```

### Fixture Data

Create `src/services/pco/__fixtures__/` with anonymized snapshots of real PCO responses:

- `plan-items-response.json` — Full plan items with includes
- `arrangement-chordpro.json` — ChordPro format arrangement
- `arrangement-lyrics-only.json` — Lyrics-only arrangement
- `arrangement-hybrid.json` — Hybrid format arrangement
- `arrangement-empty.json` — Empty arrangement
- `sections-response.json` — Structured sections endpoint
- `songs-list-response.json` — Song library page

### Integration Test (Manual)

A manual test script that exercises the full flow against a live PCO account:

1. Authenticate with PAT
2. List service types
3. Fetch a plan with items
4. Convert each song → MCS
5. Save to local DB
6. Export one song back as attachment
7. Delete test attachment

---

## 12. Future Enhancements

### Phase 2 — OAuth 2.0

- Register OAuth app with PCO
- Implement authorization code flow with PKCE
- Token storage and automatic refresh
- Support multi-user/hosted deployments

### Phase 3 — Two-Way Sync

- Detect changes in PCO arrangements since last import (use `updated_at`)
- Detect local edits since last import
- Merge UI for conflict resolution
- Sync status indicators on songs ("in sync", "local changes", "PCO updated")

### Phase 4 — Team Import

- Import team/volunteer schedules from PCO
- Show who's playing what instrument on each plan
- Display team info alongside setlist

### Phase 5 — CCLI Matching

- Cross-reference PCO's `ccli_number` with CCLI SongSelect
- Auto-suggest chord charts from SongSelect for songs with lyrics-only in PCO
- Copyright compliance tracking

### Phase 6 — Real-Time Updates

- WebSocket or polling for live plan updates during rehearsal
- Key changes, song order changes reflected immediately
- "Live mode" for mid-service adjustments

---

## Appendix: Existing Code to Reuse

| File | What It Provides |
|------|-----------------|
| `src/services/import/chordpro.ts` | `ChordProConverter.convert(chordPro: string): string` — converts ChordPro text to MCS YAML |
| `src/services/export/chordpro.ts` | `ChordProExporter.export(song: Song): string` — converts Song to ChordPro text |
| `src/actions/file-storage.ts` | Server Action pattern (`"use server"` + SQLite via `better-sqlite3`) |
| `src/services/storage/index.ts` | `FileStorageService` class with `saveSong()`, `getSong()`, `getAllSongs()`, `deleteSong()`, `saveSetlist()`, etc. |
| `src/mcs-core/model.ts` | `Song`, `SongMetadata` (with `[key: string]: any`), `Section`, `SectionType`, `Line`, `LineSegment` |
| `src/lib/db.ts` | SQLite setup with `better-sqlite3`, WAL mode, table creation pattern |
| `src/components/ui/Modal.tsx` | `Modal` component — props: `isOpen`, `onClose`, `title`, `children` |
