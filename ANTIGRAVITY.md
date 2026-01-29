# Antigravity Best Practices & Context

## Git Workflow

- **Default Branch**: `master` (Always merge back to master, not main).
- **Feature Branches**: Use `feature/feature-name` or `fix/issue-name`.
- **Merging**: Merge feature branches into `master` after verification.
- **Cleanup**: Delete feature branches after merging.

## Development Standards

- **Testing**:
  - Unit tests: `src/**/*.spec.ts` (Vitest)
  - Component tests: `src/**/*.spec.tsx` (React Testing Library)
  - Run all tests before merge: `npm run test:ci`
- **Build**: Ensure `npm run build` passes before merge.
- **Styling**: Use TailwindCSS classes over inline styles whenever possible (except for dynamic theme values).
- **State Management**: Use Zustand for global UI state.
- **Storage**: Use IndexedDB for large user data (songs, setlists).

## Project Structure

- `src/mcs-core`: Core logic/models for Modern Chord Specification.
- `src/components`: React components (atomic designish).
- `app`: Next.js App Router pages.
- `src/state`: Zustand stores.
- `src/services`: External services (Storage, etc).
