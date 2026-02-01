# Modern Chord Specification (MCS) Format Guide

 The `.mcs` format is a YAML-based standard for defining chord charts that are semantic, flexible, and render-ready. It separates the "musical data" (chords, lyrics, structure) from the "presentation" (fonts, colors, columns), allowing the same song file to be displayed in endless ways.

 ---

## 1. File Structure

 A basic `.mcs` file consists of **Metadata**, **Definitions**, **Sections**, and optional **Arrangements**.

 ```yaml
 schema_version: "1.0.0"
 metadata:
   # info about the song
   title: "My Song"
 sections:
   # the actual content (verses, choruses)
   - id: "v1"
     type: "verse"
     lines: ...
 ```

 ---

## 2. Metadata

 The `metadata` block is required and lives at the top of the file.

 | Field | Type | Description |
 | :--- | :--- | :--- |
 | `title` | String | **Required**. The title of the song. |
 | `artist` | String | **Required**. The artist or composer. |
 | `key` | String | Key of the song (e.g., "C", "F#m"). |
 | `tempo` | Number | BPM (Beats Per Minute). |
 | `time_signature` | String | e.g., "4/4", "6/8". |
 | `ccli` | String | CCLI license number. |
 | `copyright` | String | Copyright information. |
 | `themes` | List | Keywords like ["Trust", "Worship"]. |

 **Example:**

 ```yaml
 metadata:
   title: "Amazing Grace"
   artist: "John Newton"
   key: "G"
   tempo: 74
   time_signature: "3/4"
   themes:
     - "Grace"
     - "Hymn"
 ```

 ---

## 3. Sections

 The `sections` block is a list of all unique musical parts. You define each Verse, Chorus, or Bridge ONCE here. You can then reuse them using Arrangements.

### Common Fields

- `id`: Include a short, unique ID (e.g., "v1", "c1"). This is used for arrangements.
- `type`: Semantic type. Options: `verse`, `chorus`, `bridge`, `intro`, `outro`, `instrumental`, `tag`, `hook`, `grid`, `other`.
- `label`: (Optional) Custom display name like "Verse 1".
- `subtitle`: (Optional) Short note like "Build", "All In".
- `lines`: The content of the section.

### Writing Lyrics & Chords

 Standard sections use strict `[Chord]` syntax inline with lyrics. The renderer automatically positions the chord above the specific syllable it precedes.

 **Syntax:**
 `This is [C]lyrics with [G]chords.`

 **Example:**

 ```yaml
   - id: "v1"
     type: "verse"
     label: "Verse 1"
     lines:
       - "A[G]mazing Grace, how [C]sweet the [G]sound"
       - "That [G]saved a wretch like [D]me"
 ```

### Chord Grids (Music Only)

 Use the `grid` type for sections without lyrics (Intros, Instrumentals). Use pipes `|` to separate bars.

 **Syntax:**
 `| Chord | Chord |`

 **Example:**

 ```yaml
   - id: "intro"
     type: "grid"
     label: "Intro"
     lines:
       - "| G | C | G | D |"
       - "| Em | C | G | D |"
 ```

 ---

## 4. Arrangements

 Arrangements allow you to define the *order* of sections. You can have multiple arrangements (e.g., "Default", "Radio Edit", "Live Version").

- If no arrangement is selected, the viewer displays all sections in the order they are defined.
- `order`: A list of Section IDs.

 **Example:**

 ```yaml
 arrangements:
   - name: "Default"
     order:
       - "intro"
       - "v1"
       - "c1"
       - "v2"
       - "c1"
       - "outro"
 ```

 ---

## 5. Chord Definitions (Optional)

 If you use complex or custom chords, you can define exactly how they should be fingered.

 ```yaml
 definitions:
   - name: "G/B"
     frets: [-1, 2, 0, 0, 0, 3]  # -1 = mute, 0 = open
     fingers: [0, 1, 0, 0, 0, 2] # 1=Index, ... 4=Pinky
 ```
