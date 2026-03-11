# Project Backlog

## 📋 Not Complete

- [ ] **Theme Editor (Phase 2)**: Per-section-type colors (verse bg, chorus bg, etc.), border and shadow customization. Expand Theme model with `sectionStyles` map.
- [ ] **Mobile Editor**: Revisit mobile-responsive editor layout (pane toggle) without breaking Monaco height calculation.

## ✅ Complete

- [x] **Theme Editor (Core)**: Color pickers, font controls, layout toggles. Custom theme save/load via localStorage. Dedicated /themes page with live preview. Dark/Light site toggle kept simple in header.
- [x] **Editor Regression Fix**: Reverted mobile pane toggle that broke Monaco editor. Restored side-by-side layout.
- [x] **Theme System Cleanup**: Removed unusable High Contrast/Projection presets. Reverted header to simple Dark/Light toggle. Moved theme editor from modal overlay to dedicated /themes page.
- [x] **Custom Metadata**: Dynamic key-value custom fields in Edit Metadata modal. Displayed in viewer metadata area. Data model already supported via Zod catchall.
- [x] **PDF Export / Print Function**: Browser `window.print()` with `@media print` CSS. Print button on viewer ActionBar. Hides UI chrome, optimizes for B&W.
- [x] **ChordPro Export**: `ChordProExporter` converts Song objects to ChordPro format. Export button on viewer ActionBar.
- [x] **Chord Formatting Issue**: Added `minWidth: 2.5em` on ChordLyricPair when segment has chord but no lyric, preventing adjacent chord collision.
- [x] **Mobile Optimization**: Responsive editor (pane toggle on mobile), responsive header/action bar, mobile padding, fixed scroll trapping via `overflow-auto` on main.
- [x] **Bug Fix: Empty Section Syntax Error**: Changed InsertSectionModal to output `lines: []` instead of `lines: [" "]` when no content is entered.
- [x] **Encoding Sharps and Flats**: `formatChordForDisplay()` utility converts `#` to `♯` and flat `b` to `♭` at render time. Applied in ChordLyricPair, ChordList, GridRenderer, and SongViewer key display.
- [x] **Re-Implement Setlists**: SQLite storage, CRUD UI, setlist playback with keyboard navigation. Completed during v1.0.0 release work.
- [x] **Library UX Fixes**: Selection-based model. Single-click selects a card, double-click opens. Action buttons (Open, Edit, Export, Delete) appear in the ActionBar based on selection.
- [x] **Better ChordPro Imports/Exports**: Fixed `{comment}` not creating chorus, added bridge/tab directives, fixed type re-inference bug, added capo/copyright, proper section closing. Export implemented separately.

- [x] **Section Comments**: Have a Section "subtitle" that includes a short phrase or note about the section. i.e. Breakdown or All-In or Accapella or Out on Beat 3, etc.

- [x] **New Section Feature**: User can highlight lines in the editor and right-click to create a new section, or click the "New Section" button. Selected text is pre-filled in the modal and replaced upon insertion.
  - Modal asks for type and content.
  - "Insert" button adds section semantically.

- [x] **Metadata Display**: All available metadata displayed and editable in the Viewer.
- [x] **Chord Diagrams (Viewer)**: Automatically displayed. Configurable instruments (Guitar, Ukulele, Piano).
- [x] **Chord Diagrams (Editor)**: Displayed and editable in the Editor.
- [x] **ChordPro Import**: Convert traditional ChordPro format to "MCS" format.
- [x] **UI Accessibility**: Fix modal text input contrast in light mode.
- [x] **Bar Counts**: Track and edit bar counts in sections (validated via Zod).
- [x] **Unified Section Button**: "New Section" button combining Verse/Chorus/etc. with modal.
- [x] **Unified Metadata Button**: "Edit Metadata" button replacing individual keys/time/tempo buttons.
- [x] **Arrangements**: Feature to reuse and reorder sections, baked into the song for Viewer selection.
- [x] **Viewer Arrangements**: Selectable arrangements in the Viewer.

- [x] **Shortcuts**: Ctrl+S (Save), Ctrl+O (Open), Ctrl+Shift+S (Save As New), Ctrl+Shift+O (Open New), Ctrl+Z (Undo), Ctrl+Y (Redo).
- [x] **Key Signature**: Renders on Editor Preview and Viewer windows.
- [x] **Music Only Section (Chord Grids)**: Implemented special `grid` section type for chord grids.
  - Display chords according to time signature (bars).
  - Editor allows editing via "New Section" modal.
  - Graphically represents bars/beats using `GridRenderer`.
- [x] **UX Issue: Code Editor Scrolling**: Fixed issue where editor would not scroll to the end of the file. Enabled `scrollBeyondLastLine` and fixed flex layout.
- [x] **Transpose Feature**: Modified SongViewer to include a UI for transposing keys on the fly. Implemented `transpose.ts` utility for sharp/flat preference and key calculation.
