
---
description: Standard methodology for implementing features or fixes. Follow this strictly for all coding tasks.
---

This workflow defines the standard lifecycle for implementing features or fixes.

1.  **Branching**
    Start by creating a descriptive branch for your task.
    ```bash
    git checkout -b feature/your-feature-name
    ```

2.  **Development & Unit Testing**
    *   Implement the feature or fix.
    *   **Rule**: Every meaningful logical change must have a corresponding test.
    *   Create or update `*.spec.ts` (Unit) or `*.spec.tsx` (Component) files.

3.  **Verificaton (Automated)**
    Before marking a task as "ready for review", ensure the machine is happy.
    *   Run new tests: `npx vitest path/to/new.spec.ts`
    *   Run regression suite: `npm run test:ci`
    *   Verify build: `npm run build`

4.  **Verification (User Acceptance - UAT)**
    *   Manually verify the feature works as expected in the application.
    *   Check for regression in related areas.
    *   **Aesthetics Check**: Ensure the UI looks premium (animations, spacing, colors).

5.  **Commit & Merge**
    Once verified:
    ```bash
    git add .
    git commit -m "feat: description of changes"
    git checkout main
    git merge feature/your-feature-name
    // turbo
    git branch -d feature/your-feature-name
    ```

6.  **Next Steps**
    *   Update `backlog.md` to mark the item as complete.
    *   Review the backlog and propose the next highest priority item to the user.
