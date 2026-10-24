# EducationPlatform agent entry

Workspace: `C:/Users/PC/Desktop/Codes/EducationPlatform`.

Read [docs/OPERATIONS.md](./docs/OPERATIONS.md) first, then [docs/PROJECT.md](./docs/PROJECT.md).
These two files replace the former `HANDOFF.md`, `readme.md`, `rules.md`, `start.md` and detailed
`AGENTS.md`; do not recreate or update those retired files.

Non-negotiables:

- Never commit, push or deploy without explicit owner authorization. Inspect status, diff, branch and
  remote; stage only authorized files; exclude secrets, logs, artifacts, caches and generated output.
- Preserve ignored `.env`/`.env.local` and all uncommitted work. Never print or commit secret values.
- Read installed Next.js guides in `node_modules/next/dist/docs/` before framework-specific code.
- Keep owner, plan, exam, active-exam, quota, same-origin, ownership and verified-email checks
  server-side. Never add timer, payment, grading or AI bypasses.
- Run the checks required by `docs/OPERATIONS.md` for the change type. Report only checks actually run
  and update `docs/OPERATIONS.md` with actual outcomes.
- Keep LawTest/Lexlab completely separate; this project only links to <https://lexlab.site/plan>.
- Payments are simulated, hosted accounts are a test pilot, and new auth/Gmail source is currently
  uncommitted and undeployed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
