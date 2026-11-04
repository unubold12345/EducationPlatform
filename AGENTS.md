# EducationPlatform agent entry

Workspace: `C:/Users/Hitech/Desktop/codes/educationplatform`.

Read [docs/OPERATIONS.md](./docs/OPERATIONS.md) first, then [docs/PROJECT.md](./docs/PROJECT.md).
These two files replace the former `HANDOFF.md`, `readme.md`, `rules.md`, `start.md` and detailed
`AGENTS.md`; do not recreate or update those retired files.

Before starting any task, read [docs/ACTIVE_WORK.md](./docs/ACTIVE_WORK.md), claim your work there,
and check it again before builds, preview restarts, database changes, commits or pushes.
If a new owner task would collide with another agent's claimed files or shared resources, or could
interrupt its work, warn the owner and wait for a decision before starting.

Non-negotiables:

- Never commit, push or deploy without explicit owner authorization. Inspect status, diff, branch and
  remote; stage only authorized files; exclude secrets, logs, artifacts, caches and generated output.
- Preserve ignored `.env`/`.env.local` and all uncommitted work. Never print or commit secret values.
- Read installed Next.js guides in `node_modules/next/dist/docs/` before framework-specific code.
- Keep owner, plan, exam, active-exam, quota, same-origin, ownership and verified-email checks
  server-side. Never add timer, payment, grading or AI bypasses.
- Run only the checks `docs/OPERATIONS.md` requires for the change type (`npm run check`). Report only checks
  actually run.
- Record outcomes in `docs/OPERATIONS.md` as one short entry of at most five lines, naming your tool and model. Never
  re-attribute another agent's work or paste play-by-play there.
- Keep LawTest/Lexlab completely separate; this project only links to <https://lexlab.site/plan>.
- Payments are simulated and hosted accounts are a test pilot.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
