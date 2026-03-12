---
name: git-commit
description: Run audit fix, tests, build, then commit and merge to main
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Git Commit Pipeline

Run the full quality pipeline, then commit and merge to main. Execute each step sequentially. Report progress to the user after each step.

## Step 1: Audit Fix

Run `npm audit fix` to resolve known vulnerabilities. If it fails, report the output but continue — audit issues should not block the pipeline.

## Step 2: ESLint

Run `npm run lint` to check for linting errors.

- If lint **passes**, proceed to Step 3.
- If lint **fails**, analyze the error output, read the affected source files, fix the issues, and re-run `npm run lint`. You may attempt up to **2 remediation cycles**. If lint still fails after 2 attempts, **stop and report the failures to the user**.

## Step 3: Run Tests

Run `npm run test:ci` to execute all tests.

- If tests **pass**, proceed to Step 4.
- If tests **fail**, analyze the error output, read the failing test files and source files, fix the issue, and re-run `npm run test:ci`. You may attempt up to **2 remediation cycles**. If tests still fail after 2 attempts, **stop and report the failures to the user**.

## Step 4: Production Build

Run `npm run build`.

- If the build **succeeds**, proceed to Step 5.
- If the build **fails**, analyze the error output, read the relevant source files, fix the issue, and re-run `npm run build`. You may attempt up to **2 remediation cycles**. If the build still fails after 2 attempts, **stop and report the errors to the user**.

## Step 5: Commit

1. Run `git status` (never use `-uall`) and `git diff` to understand all staged and unstaged changes.
2. Run `git log --oneline -10` to review the recent commit message style.
3. Stage all modified and new files with `git add` (add specific files by name — avoid `git add -A` or `git add .`). Do NOT stage files that contain secrets (`.env`, credentials, tokens).
4. Write a detailed conventional commit message:
   - First line: `type(scope): short summary` (under 70 chars)
   - Blank line, then a bullet-point body describing key changes
   - End with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
5. Create the commit using a HEREDOC for the message.
6. Run `git status` to verify the commit succeeded.

## Step 6: Merge to Main

1. Run `git branch --show-current` to check the current branch.
2. If already on `main`, skip this step — the commit is already on main.
3. If on a **feature branch**:
   - Run `git checkout main`
   - Run `git merge <feature-branch> --no-ff` to merge with a merge commit
   - Report the merge result to the user

## Final Report

Summarize what happened:
- Audit result
- Lint result (pass/fail, any fixes applied)
- Test result (pass/fail, any fixes applied)
- Build result (pass/fail, any fixes applied)
- Commit hash and message
- Branch/merge status
