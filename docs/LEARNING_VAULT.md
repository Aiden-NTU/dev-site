# Learning vault

Source of truth: public repo [Aiden-NTU/University](https://github.com/Aiden-NTU/University) (Obsidian markdown).

## v1 approach

A curated subset is copied into `content/learn/` and synced into hub assets (`apps/hub/public/learn-content`) on deploy.

Hub routes:

- `/learn` — index
- `/learn/:id` — rendered markdown + KaTeX + empty interactive slot
- Signed-in users can `POST /learn/:id/progress` (D1 `learning_progress`)

## Growing it

1. Add markdown under `content/learn/...`
2. Register in `apps/hub/src/lib/learn.ts`
3. Replace the “Try it” panel with a real widget when ready
4. Keep using DocsShell layout — do not invent a new page chrome

## Later

CI job to pull selected paths from the University repo on a schedule, or build-time fetch. Interactive exams stay hub-owned (auth + D1); never put that DB on an experimental project Worker.
