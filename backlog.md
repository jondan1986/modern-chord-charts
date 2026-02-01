# Project Backlog

## 📋 Not Complete

- [ ] **Theme Editor**: Implement the theme editor and scope out all the different themeable properties.
  - Follow Tailwind's theme system (column count, font size, autofit for Letter/A4).
  - Options for themeable section types (Verse, Chorus, Bridge, etc.) and borders/shadows.
  - Allow user to edit themeable properties in the theme editor.
  - Viewer and Editor should allow theme selection from a list.
- [ ] **Custom Metadata**: Support the addition of "Custom" metadata attributes.

- [ ] **PDF Export / Print Function**: Implement export to formatted PDF (easy to read/print).
- [ ] **ChordPro Export**:
- [ ] **Chord Formatting Issue**: specific fix for chords spaced closely together.
  - If chords are adjacent, add at least one space and align lyrics.
- [ ] **Mobile Optimization**: Ensure the app looks/feels great on mobile.
  - Fix scrolling in the viewer on mobile.
- [ ] **Bug Fix**: Syntax Error when inserting a new section without lines.
  - `Syntax Error: Unexpected scalar at node end...`
- [ ] **Encoding Sharps and Flats**: Render 'b' and '#' as the true Unicode characters for the musical notation.
- [ ] **Re-Implement Setlists**: Create, manage, save, load, and share setlists, Print Setlists, (extending existing print functionality)
- [ ] **Library UX Fixes**: All Library action buttons should appear on the action bar, and not as single icons next to the Library card title.
- [ ] **Better ChordPro Imports/Exports**: Right now chordpro imports just import the song as One Big Verse Section and don't import sections correctly. They also don't import meta correctly. Implement export to formatted ChordPro (easy to read/print).

## ✅ Complete

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
