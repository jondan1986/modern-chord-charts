# Modern Chord Charts

Modern Chord Charts is a powerful tool for creating, managing, and viewing musical chord charts in the custom `.mcs` (Modern Chord Specification) format. It features a semantic data model that separates musical content from presentation, allowing for dynamic transposition, reformatting, and style customization.

## Documentation

- **[MCS Format Guide](docs/MCS_FORMAT_GUIDE.md)**: Learn how to write `.mcs` files, including lyrics, chords, grids, and arrangements.

## Features

- **Semantic Editing**: Write chords inline with lyrics (`[C]text`).
- **Chord Grids**: Visualize instrumentals and intros with pipe-delimited grids (`| C | G |`).
- **Arrangements**: Define multiple structures (e.g., "Radio Edit", "Live") for a single song.
- **Dynamic Viewer**: Transpose keys, change themes, and toggle columns on the fly.
- **File System Storage**: Songs are saved as `.mcs` files in your local `songs/` directory.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.
Songs are stored in the `songs/` directory at the project root.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE). See the [LICENSE](LICENSE) file for details.
