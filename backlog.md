# Backlog

## Not Complete

- [ ] All the available metadata should be displayed in the viewer. The metadata should be editable in the viewer.
- [ ] Chord Diagrams should automatically be displayed in the viewer. The available instruments that can be displayed should be configurable. The 3 default instruments should be guitar, ukulele, and piano.
- [ ] Chord Diagrams should be displayed in the editor. The chord diagrams should be editable in the editor.
- [ ] Implement the theme editor and scope out all the different themeable properties. It would be nice to be able to follow Tailwind's theme system and allow for things like column count, font size, autofit for Letter or A4 printouts, etc. There should options for themeable section types (Verse, Chorus, Bridge, etc.) and section borders with dropshadows, etc. but still allow the user to edit the themeable properties in the theme editor.  The Viewer should be able to let the user select a theme from a list of themes. The Editor should be able to let the user select a theme from a list of themes.
- [ ] ChordPro Import feature that reads the traditional ChordPro format and parses it and converts it to our new "MCS" format.
- [ ] Modal Windows Text Input fields have VERY light colored text that is difficult to read we should make them easily readable in box light mode (Dark mode renders fine)
- [ ] Key Signature Metadeta needs to render on the the editor Preview window and Viewer windows.
- [ ] Implement a system that tracks the the count of bars in each section. This should be displayed in the viewer and allow the user to edit it. This should be validated using Zod.  This can later be used for track playback features.

## Complete

- [x] Roll up our + Verse +Chorus buttons into a unified "new section" button. The new section editor (modal) pops up asking for the type (Verse, Chorus, Bridge, Custom) and a field for new lines. the "Insert" button should nicely add the section to the song in a way that is semantically correct.
- [x] Roll up our Metadata: Key, Time, Tempo into a new Edit Metadata button. This should pop up a modal with a form for editing the metadata. The form should be validated using Zod.
- [x] Build an 'arrangement' feature into the viewer that allow the user to reuse and reorder sections in a song. The arrangements can be baked into the song for the Viewer to select and display them.
- [x] The arrangements should be selectable in the Viewer.
- [x] Build a setlist feature that allows the user to create and manage a setlist of songs. The setlist can be saved and loaded. The setlist can be shared with other users.
- [x] Start a setlist session from the setlist detail page and navigate between songs using left/right arrows in the Viewer.
- [x] Implement a system that tracks the the count of bars in each section. This should be displayed in the viewer and allow the user to edit it. This should be validated using Zod.  This can later be used for track playback features.
- [x] Ctrl+S in the editor should save the song to IndexedDB. Ctrl+O should open a file picker to load a song from IndexedDB. Ctrl+Shift+S should save the song "As New" to IndexedDB. Ctrl+Shift+O should open a file picker to load a song from IndexedDB. Ctrl+Z should undo the last change. Ctrl+Y should redo the last change.
