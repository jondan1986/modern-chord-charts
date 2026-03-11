# Application Design Document: Modern Chord Specifications & Application

## 1. Executive Summary
This project aims to define a next-generation, open standard for music chord charts and lead sheets, addressing the limitations of existing formats. We will create a **Modern Chord Specification (MCS)** based on structured data (YAML) and build a comprehensive **web-based application** featuring a WYSIWYG editor, library management, and playback capabilities.

## 2. Goals & Objectives
*   **Modernize Data Structure:** Move away from loose text parsing to a structured, reliable format (YAML) that is both human-readable and machine-parseable.
*   **Enhance Portability:** Ensure the format supports rich metadata, multiple sections, and explicit musical semantics (time signatures, key changes, tempo) natively.
*   **Creator-Focused:** Build a WYSIWYG editor that abstracts the underlying syntax, allowing songwriters and worship leaders to focus on the music.
*   **Interactive:** Enable "play-along" features (autoscroll, transpose, audio sync).
*   **Local-First & Private:** The application must work 100% offline. No account or internet connection required to create, edit, or play songs.
*   **Open Standard:** Design the specification to be open, extensible, and free for the community.
*   **Deployable as a Docker container on a campus local network for local accessibility and portability.

## 3. Research & Analysis: Existing Standards
**Existing standards** have been the de-facto choice for decades.
*   **Syntax:** Text-based with inline chords `[C]Lyrics`. Directives in curly braces `{title: Song}`.
*   **Pros:** Easy to type in a notepad; massive legacy library.
*   **Cons:**
    *   **Parsing Ambiguity:** "Loose" standard means different parsers handle directives differently.
    *   **Structure:** No strict hierarchy; a "chorus" is just a label unless explicitly start/end tagged, often leading to formatting errors.
    *   **Extensibility:** Adding complex data (MIDI mappings, multi-instrument tabs) is clumsy.

## 4. Proposed Specification: Modern Chord (MCS)
We propose a **YAML-based** format. YAML offers strict hierarchy, excellent readability, and native support for lists and key-value pairs.

### 4.1 Key Concepts
*   **Root Object:** The Song.
*   **Metadata:** Dedicated fields for Title, Artist, Key, Tempo, Copyright, CCLI, etc.
*   **Structure:** A song is composed of an ordered list of **Sections**.
*   **Sections:** Each section has a `type` (Verse, Chorus, Bridge), a `label`, and `content`.
*   **Content:** We propose a "Smart Line" approach. While full tokenization is too verbose for manual editing, we can support two modes:
    1.  **Strict Mode:** Arrays of line objects with explicit chord/lyric mapping (e.g., `{ lyric: "Ama", chord: null }, { lyric: "zing", chord: "G" }`).
    2.  **Compact Mode:** Strings with inline syntax. **Crucially, chords can be placed at any character index (mid-word/mid-syllable) to ensure perfect phrasing accuracy** (e.g., `A[G]mazing` vs `[G]Amazing`).
*   **Separation of Concerns:** Content (Song data) is strictly separated from Presentation (Styling).

### 4.2 Draft Schema (Song Content)

```yaml
schema_version: "1.0.0"
metadata:
  title: "Amazing Grace"
  artist: "John Newton"
  key: "G"
  tempo: 60
  time_signature: "3/4"
  themes: ["Grace", "Hymn"]

options:
  transpose: 0 # Default transposition relative to original key

definitions: # Optional: Custom chord fingerings specific to this song
  - name: "G*"
    base_fret: 1
    frets: [3, 2, 0, 0, 3, 3] # Strings 6 to 1 (Low E to High E). -1 or 'x' for mute.
    fingers: [2, 1, 0, 0, 3, 4] # Optional: Finger recommendations (1=Index, 4=Pinky)


sections:
  - id: "v1"
    type: "verse"
    label: "Verse 1"
    lines:
      - "A[G]mazing grace! How [C]sweet the [G]sound"
      - "That [G]saved a wretch like [D]me!"
  
  - id: "c1"
    type: "chorus"
    label: "Chorus"
    lines:
      - ...
```

### 4.3 Styling Schema (Theme)
To ensure the song content remains pure, all "rendering" decisions are delegated to a separate **Style Object**. This allows a single song to be rendered in "Dark Mode", "High Contrast", "Nashville Number System", or "Compact Print" without changing the song file itself.

**Draft Style Schema:**

```yaml
theme_name: "Midnight Worship"
colors:
  background: "#1a1a1a"
  text_primary: "#ffffff" # Lyrics
  text_secondary: "#a0a0a0" # Metadata
  chord: "#facc15" # Yellow
  section_header: "#3b82f6" # Blue
  highlight: "rgba(255,255,255,0.1)" # Active line highlighting

typography:
  font_family_lyrics: "Inter, sans-serif"
  font_family_chords: "Roboto Mono, monospace"
  size_lyrics: 18 # px
  size_chords: 18 # px
  weight_chords: "bold"
  line_height: 1.5

layout:
  show_diagrams: false
  two_column: true # For wider screens
  chord_position: "above" # Options: above, inline (charts vs lead sheets)
  notation_system: "western" # Options: western (C, D, E), nashville (1, 2, 3), solfege (Do, Re, Mi)
```

## 5. Application Architecture
The application will be a modern web app (Progressive Web App - PWA) to ensure cross-platform compatibility (Desktop, Tablet, Mobile).
*   **Offline Support:** Crucial for gigs/worship services without consistent internet. The app will cache the UI and local library (IndexedDB) for full offline playback on tablets (iPad/Android).
*   **Installation:** Users can "install" the app to their home screen, giving it a native-like feel.

### 5.1 Tech Stack
*   **Frontend:** React / Next.js
*   **State Management:** Zustand or Redux Toolkit
*   **UI Framework:** Tailwind CSS (for modern, premium aesthetics) + Shadcn/UI
*   **Parser/Engine:** A custom TypeScript library `mcs-core` to parse/stringify the YAML format.
*   **Storage:** **Local-First.** Data is stored in the browser's `IndexedDB` and `LocalStorage`.
    *   **File Management:** Users can Import/Export their library as files to transfer between PC and Tablet manually.
    *   **No Backend Required:** The app runs entirely client-side.

### 5.2 Core Features
1.  **Dashboard:** Library view of all songs (search, filter by key/artist).
2.  **Editor (WYSIWYG):**
    *   Left pane: Code/YAML view (for power users).
    *   Right pane: Visual "Music Stand" view.
    *   **Interaction:** Precision caret placement allows inserting chords **between any letters** (character-level accuracy), not just at word boundaries. Essential for handling melismas and mid-word syllable changes.
3.  **Live Mode:**
    *   Fullscreen presentation.
    *   **Theming:** User can toggle between different "Styles" (e.g., Dark Mode for stage, Light Mode for outdoors) instantly.
4.  **Setlists:**
    *   Group songs into ordered lists for events/services.
    *   **Unified Styling:** Apply a "Set Theme" (e.g., "Sunday Morning") that overrides individual song settings ensures the whole band sees the same format.
    *   **Duration Estimation:** Auto-calculate total set time.

## 6. Implementation Stages
1.  **Phase 1: The Core:** Define the YAML spec (Content & Style) and build a TypeScript parser/validator.
2.  **Phase 2: The Viewer:** Build the rendering engine to display the YAML as a beautiful chart using the Style schema.
3.  **Phase 3: The Editor:** Build the WYSIWYG interface for creating/editing content.
4.  **Phase 4: The App:** Wrap it all into a Next.js application with library management and Setlists.
5.  **Phase 5: Collaboration (Future):**
    *   **Local Network Sync:** Leader controls page turns/scrolling for all connected band devices (WebSockets/WebRTC).
    *   **P2P Sharing:** "AirDrop" style sharing of sets/songs between devices without internet.
    *   **Dynamic Arrangements:** Live re-ordering of sections (e.g., "Repeat Chorus") during playback that propagates to all screens.

## 7. Next Steps
*   Approve this ADD.
*   Create the `mcs-core` parser package.
*   Initialize the Next.js project.
