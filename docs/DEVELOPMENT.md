# Development Guide

## Prerequisites

- **Node.js 20+** and npm

## Getting Started

```bash
git clone https://github.com/jondan1986/modern-chord-charts.git
cd modern-chord-charts
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once (CI) |

## Building from Source

If you prefer to build the Docker image yourself instead of pulling from GHCR:

```bash
git clone https://github.com/jondan1986/modern-chord-charts.git
cd modern-chord-charts
docker build -t modern-chord-charts .
docker run -d --name chord-charts -p 3000:3000 -v chord_data:/app/data modern-chord-charts
```
