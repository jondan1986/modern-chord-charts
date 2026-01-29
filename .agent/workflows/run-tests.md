
---
description: Run the automated test suite
---

To run the automated tests for the project, follow these steps:

1.  **Run Tests in Watch Mode** (Recommended for development):
    This command runs the tests and stays active, re-running them whenever you modify a file.
    ```bash
    npm test
    ```

2.  **Run Tests Once** (CI Mode):
    This command runs the tests once and exits. Useful for verifying everything is green before committing.
    ```bash
    npm run test:ci
    ```

3.  **Test specific file**:
    You can filter tests by filename.
    ```bash
    npx vitest src/mcs-core/parser.spec.ts
    ```

## Writing New Tests
- **Unit Tests**: Place `.spec.ts` files alongside the source files (e.g., `src/foo.ts` -> `src/foo.spec.ts`).
- **Component Tests**: Place `.spec.tsx` files alongside components. We use React Testing Library.

**Example Component Test**:
```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

it('renders correctly', () => {
  render(<MyComponent label="Hello" />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```
