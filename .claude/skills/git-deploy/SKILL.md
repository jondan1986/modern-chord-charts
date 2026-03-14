---
name: git-deploy
description: Tag a release, trigger GitHub Actions build, monitor and report
disable-model-invocation: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# Git Deploy Pipeline

Release a new version by bumping the version, tagging, triggering the GitHub Actions release workflow, and monitoring the result. Execute each step sequentially. Report progress to the user after each step.

Unless the user explicitly specifies a version number, **only increment the patch version** (e.g., `1.2.1` → `1.2.2`).

## Step 1: Determine Version

1. Read the current `"version"` field from `package.json`.
2. Parse it as `MAJOR.MINOR.PATCH`.
3. If the user specified a version, use that. Otherwise, increment `PATCH` by 1.
4. Set `NEW_VERSION` to the result (e.g., `1.2.2`) and `TAG` to `v1.2.2`.
5. Report the version bump to the user: `Releasing: vX.Y.Z`.

## Step 2: Bump Version in package.json

1. Update the `"version"` field in `package.json` to `NEW_VERSION`.
2. Stage and commit:
   ```
   git add package.json
   git commit -m "chore(release): bump version to X.Y.Z"
   ```
3. Push the commit: `git push origin main`.

## Step 3: Create and Push Tag

1. Create an annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
2. Push the tag: `git push origin vX.Y.Z`.
3. Report: `Tag vX.Y.Z pushed — Release workflow triggered.`

## Step 4: Monitor Build

1. Wait a few seconds for the workflow to register, then find the run:
   ```
   gh run list --workflow=release.yml --limit=1 --json databaseId,status,conclusion
   ```
2. Poll with `gh run view <run-id>` every 30 seconds until `status` is `completed`.
3. Report progress updates to the user as the build progresses (queued → in_progress → completed).

## Step 5: Handle Result

### On Success

1. Report: `Build succeeded.`
2. Fetch and display the release URL: `gh release view vX.Y.Z --json url --jq '.url'`.
3. Report the Docker image tag: `ghcr.io/jondan1986/modern-chord-charts:vX.Y.Z`.

### On Failure (1st attempt)

1. Report: `Build failed. Analyzing logs...`
2. Fetch failed step logs: `gh run view <run-id> --log-failed`.
3. Analyze the failure output. Read the affected source files and fix the root cause.
4. Commit the fix, push to origin.
5. Delete the old tag locally and remotely:
   ```
   git tag -d vX.Y.Z
   git push origin :refs/tags/vX.Y.Z
   ```
6. Re-create and push the tag:
   ```
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
7. Monitor the retry build (repeat Step 4).

### On Failure (2nd attempt)

1. Report: `Build failed on retry. Manual intervention required.`
2. Show the failed logs to the user.
3. **Stop and ask the user for help.** Do not attempt further retries.

## Step 6: Final Report

Summarize what happened:
- Version released (e.g., `1.2.2`)
- Tag name (e.g., `v1.2.2`)
- Build result (passed on 1st attempt, passed on retry, or failed)
- Release URL
- Docker image: `ghcr.io/jondan1986/modern-chord-charts:vX.Y.Z`
