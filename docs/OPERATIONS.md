# EducationPlatform — Operations

Current state, delivery rules and next actions. Stable facts: [PROJECT.md](./PROJECT.md). Keep under 150 lines. Full log to 2026-11-05 (sections 1–55): `git show 2928af3:docs/OPERATIONS.md`; read only for old evidence.

## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform`. Never reuse LawTest's remote.
  The repository is **public** (observed 2026-11-05); the owner chose to make it private in GitHub settings.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region
  `sin1`. A push to the branch deploys to production. Latest deployed code: `30897c7`, the 2026-11-09 flashcards and file-to-exam push (a docs-only follow-up records it; see Recent).
- Hosted database: Singapore Neon, reached through its pooled address (migrations too; see section 4). The old US Neon
  database is read-only for rollback; do not resume writes to it.
- Hosted flags: `AUTH_HOSTED_PILOT`, `AUTH_HOSTED_DEMO_ACCOUNTS`, `SPEAKING_LAB_ENABLED`, `AUTH_HOSTED_GMAIL` and
  `AUTH_REQUIRE_EMAIL_VERIFICATION` are `true`; payments are simulated; Google and Gmail credentials are set in Vercel.
  `.env.vercel.local` is a stale snapshot.
- Local dev switch (2026-11-07): `DEV_PRACTICE_DURING_MOCK=true` in `.env.local` opens practice mode during a timed mock; it needs the local pilot on localhost, is refused on Vercel/hosted, and `scripts/check.mjs` forces it off. Remove the line to restore the block locally.
- Local: PGlite on 51214/51215 (`npm run db:start`). Verified build served on 3001 (`npm start`, 2026-11-06); `prod3006` in `.claude/launch.json` is a separate launcher for 3006.
- The 40-paper 2026 EEC import exists only on the previous PC and is not in this tree. Dornod papers, practice exercises and
  (2026-11-06) the official ЭЕШ papers were deliberately removed.
- The imported ЭЕШ set is now on the site: 55 Mathematics, 60 Physics and 40 English papers generated from `MockExmps/`
  into `assets/entrance-mocks/` and `public/exam-assets/eesh/`, with the `/exams/eesh` hub. The first four Mathematics
  mocks and `/exams/eesh-math` are retired; existing attempts remain readable. Local build verified 2026-11-06.

## 2. Open items

Owner actions:
1. Owner chose on 2026-11-05 to leave old exercise rows in Neon for now (a few MB, unused). Keep the tables in the schema;
   do not add a dropping migration unless asked. `scripts/purge-exercises.mjs` remains available for a later cleanup.
2. Make the repository private. Still public on 2026-11-06, and `reference/` holds the withdrawn БҮТ papers; 2018 A and 2019 A print a no-copying notice.
3. Decide whether University Prep (₮40,000, ЭЕШ mocks only) and SAT (₮60,000, mocks only) prices still fit.
4. Complete one real Google sign-in with an owner-controlled account. Only the authorization start has been verified.
5. Buy a sender domain if wanted, then switch to Resend (section 5).

For agents:
- Not verified on the hosted site: signed-in dashboard, profile and admin, or a real sitting with the new questions.
  `tests/hosted_demo_smoke.py` is ready; ask the owner first.
- Rewritten but never run: `tutor_smoke.py` (needs live DeepSeek approval).
- Practice assistant: one real DeepSeek reply checked (SAT, Mongolian, before a check). IELTS, ЭЕШ, English replies and the later
  field-name prompt fix are untested; `exam_practice_smoke` intercepts it, so real calls need owner approval.
- Not runnable here: `auth_recovery_smoke.py`, because `artifacts/start-auth-recovery.mjs` is not on this machine.
- Remove unused exercise CSS from `theme.css`, `globals.css` and `programs.css`.
- Teacher review is pending for all 155 imported ЭЕШ papers (55 Mathematics, 60 Physics, 40 English). The 2022–2026
  Mathematics and English references are third-party copies, not official БҮТ files. The 2018–2019 English listening
  sections are transcript-only. Later: production billing, data retention, account deletion and accessibility audit.

## 3. Delivery rules

**Git.** Never commit, amend, push, tag, open a PR or deploy without explicit owner authorization; a request to implement is not one. Before committing, inspect status, diff, recent log, branch and remote.
Stage only intended files; exclude secrets, `.env*`, logs, `artifacts/`, caches and generated output. Report local changes, commits, pushes and deployments separately.

**Agents.** Several agents share this repo. Claim work in [ACTIVE_WORK.md](./ACTIVE_WORK.md), recheck it before builds, preview
restarts, database changes, commits or pushes, and remove the row when done. Never edit, revert or re-attribute another agent's work.

**Checks.** Run only what the change needs; the runner stops at the first failure and starts its own server on 3007:

| When | Command | Time (2026-11-05) |
| --- | --- | --- |
| Docs only | `git diff --check` and a secret scan | seconds |
| Any code change | `npm run check` (lint, typecheck, unit) | 10 s |
| Shared presentation only (footer, header chrome, type, spacing, colour, copy) | `npm run check -- ui`, then spot-check 3 routes at 1440/390/320 | 30–40 s |
| A browser area changed | `npm run check -- <group>` (table below) | 15 s to 2 min |
| Before an authorized push | `npm run check:push` (build + core); add affected groups | 1.5 min |
| Cross-cutting behaviour | `npm run check:all` | 5.5 min |

| Group | Run when changing | Suites |
| --- | --- | --- |
| `core` | routing, sessions, layout, exam engine | `browser`, `accounts`, `exams` |
| `flashcards` | flashcards, their API guards and study UI | `flashcards` |
| `myexams` | exam-from-file upload, AI generation guards, sealed grading and the runner | `my_exams` |
| `entrance` | ЭЕШ mocks, their collections, withdrawn-paper 404s | `entrance_mocks` |
| `mocks` | added SAT/IELTS forms | `additional_exams` |
| `jlpt` | JLPT catalogue, timed mocks, Japanese audio and practice | `jlpt` |
| `practice` | practice mode, its assistant, sitting tools | `exam_practice` |
| `admin` | admin, content publishing | `admin`, `publishing` |
| `billing` | plans, prices, checkout, access | `payments`, `subscriptions` |
| `account` | profile, password, demo accounts | `profile`, `demo_accounts` |
| `ui` | theme, global CSS, footer/header chrome, homepage, presentation copy | `theme`, `homepage_polish` |
| `writing` | Essay Studio | `writing_lab` |

**`check:all` means behaviour, not reach.** Shared CSS and copy used by every page (footer, header chrome, type
scale, spacing, colour) are presentation-only: run `npm run check -- ui`, then open one marketing page, one exam page
and `/login` at 1440, 390 and 320 and inspect the screenshots. Reserve `check:all` for changes that can alter
behaviour across routes: server/API, data or migrations, auth/session, route or layout structure (not visual
spacing), exam lifecycle/timers/grading, payments/entitlements, publishing, or a shared component's logic. When
unsure, run the affected group rather than every group.

Manual only, with owner approval: `tutor_smoke` and `speaking_lab_smoke` (real providers), `hosted_demo_smoke` (after a
deployment), `auth_recovery_smoke` (3002 server). Do not add pauses between suites: sign-up allows 60 per minute. Inspect
screenshots when UI changes. Never weaken an assertion to pass, and change one only when intended behaviour changed.
Report only checks actually run.

**Invariants.** Keep owner, plan, exam, active-exam, quota, same-origin, ownership, bounded-body and verified-email checks on
the server. Never trust client scores, prices, user IDs, content versions or prompts. Never add timer, payment, grading or AI
bypasses, or global paid access. Keep purchases, LEGACY grants, immutable attempt snapshots and exact-version grading. Provider
keys stay server-side; never send secrets, identity or scratch work to a model. The five demo addresses never become admins or
change shared data. Do not read LawTest/Lexlab code or data. Never fabricate scores, delivery, deployments or test results.

**This file.** Add a `Recent` entry of at most five lines, starting with the agent and model: outcome, checks run, anything
unverified. No play-by-play. When `Recent` passes eight entries, compress the oldest into `History`.

## 4. Known problems
- **Database port drift.** If another app holds 51214 when `db:start` runs, Prisma saves the new port in `%LOCALAPPDATA%\prisma-dev-nodejs\Data\education-platform\server.json` (`--db-port` is ignored for an existing server); `.env` and the fixtures expect 51214. Fix, with owner approval: `db:stop`, set `databasePort`, the `exports.database` URLs and the URL inside the base64 `ppg` api_key back to 51214, `db:start`. Happened 2026-11-08 (Edge, 51217); restored the same day.
- **Local database drops** (`P1017`, `P1001`, `ECONNREFUSED`, or `{"database":"down"}`; every suite then fails). Run `npm run db:stop`,
  wait a few seconds, `npm run db:start`; never reset. Transient `P2028` or `08P01`: rerun once. Cause not proven; suspect
  below. It dropped three times on 2026-11-04/05, then stayed up through two runs after the log was set aside.
- **Local change log grows forever.** `prisma-dev-nodejs/Data/durable-streams/education-platform` is Prisma's one-way copy of every
  write, has no retention setting, and our app does not use it; each `check:all` adds about 60 MB. Above about 1 GB: stop the
  database, move that folder elsewhere and start again; Prisma recreates it. Moved aside 2026-11-05 at 2.8 GB with identical row counts;
  the old copy is `Data/durable-streams-log-backup-2026-11-05`, for the owner to delete.
- **Only one app on the local database.** PGlite uses one connection, so stop other previews before running suites.
- **Build replaces `.next`.** Restart any running preview after a build. If `next dev` reload-loops, delete `.next/dev`.
- **Vercel build.** It runs `scripts/vercel-build.mjs`: generate, `migrate deploy`, `next build`, with no seed; about 2 minutes.
  Fonts are fetched from Google at build time. A pooled `DATABASE_URL` without a direct URL only warns. A build that fails with
  no app error can be transient (`47dc518`; an empty commit fixed it). Vercel logs need a signed-in session.
- **Hosted email.** Enabling a sender enforces verification for every non-demo account. Do not bulk-mark rows verified.

## 5. Provider notes
- **Gmail:** `GMAIL_USER` plus a 16-character App Password in `.env.local`; restart the app. Verify with one small SMTP check.
- **Resend:** remove the Gmail values, set `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM`.
- **Hosted Google:** set the ID/secret pair in Vercel; callback is `<site>/api/auth/callback/google`.
- Never print, commit or paste secret values. Hosted and real-provider checks need explicit owner authorization.

## 6. Commands

```powershell
npm ci; npm run setup:env; npm run db:start; npm run db:migrate; npm run db:generate; npm run dev
npm run demo:accounts
npm run admin:grant -- qa-demo-01@example.invalid
```

## 7. History

Earlier entries, with their original attribution and verification limits, are in [OPERATIONS_HISTORY.md](./OPERATIONS_HISTORY.md).

## 8. Recent
- **2026-11-09 · Agent: DeepSeek Flash (DeepSeek Harness), npm/Playwright · Exams from a file.** Added `/workspace/my-exams`: PDF/DOCX/PPTX/TXT/MD/CSV upload (4 MB), DeepSeek 10/20-question generation (15/day, closed during timed sittings), AES-GCM-sealed answer keys with server grading, timed/untimed runner with draft resume, and browser-stored results; linked from the home exams heading.
  `npm run check -- myexams ui` and `npm run check -- ui core` passed (lint, typecheck, 129 unit tests, build; smoke covers clock auto-submit, theme/homepage, browser/accounts/exams); screenshots at 1440/375 reviewed. Committed and pushed the flashcards and exam-from-file work as `30897c7`; Vercel production verified `/workspace/my-exams` and `/workspace/flashcards` 307 to sign-in, `/api/health` ok and public pages 200. No live DeepSeek call; real-provider quality, teacher review and OCR remain unverified.
- **2026-11-08 · Agent: DeepSeek Flash (DeepSeek Harness), npm/Playwright · Workspace flashcards.** Added `/workspace/flashcards`: PDF/DOCX/PPTX/TXT/MD/CSV upload (4 MB), DeepSeek card generation with a 20/day quota and active-sitting checks, browser-stored decks and a study/known UI; `unpdf` and `fflate` added.
  `npm run check -- flashcards` passed (lint, typecheck, 120 unit tests, flashcards smoke); the production build passed and 3001 was rebuilt healthy. A 3005 build with a mocked DeepSeek endpoint returned decks for PDF, DOCX, PPTX and TXT; local PGlite was restarted without reset. Workspace hints now name AI rather than the provider. No live DeepSeek call; real-provider quality, teacher review and OCR remain unverified.
- **2026-11-08 · Agent: DeepSeek Flash (DeepSeek Harness), git/npm · Owner-authorized full-tree commit, push and production deploy.** Committed 1,243 files as `986e2af` (Workspace shell, JLPT N5/N4 with 24 tracks, homepage media, checkout/labs layouts, Biology authoring pack, operations history split); `reference/` and `MockExmps/**/reference*/` stayed local by `.gitignore`.
  `npm run check:push` passed (lint, typecheck, 112 unit tests, build, browser/accounts/exams); 3001 restarted healthy on the new build, staged secret scan and cached whitespace check run. Vercel production verified: `/exams/jlpt` and `/exams/jlpt-n5-01` 200 with N5/N4, `/workspace` 307 to sign-in, `/dashboard` 307 to `/workspace`, homepage art/JLPT/FAQ plus `/home/` media 200, `/api/health` ok.
  Hosted signed-in smoke, a real Google sign-in, live AI and teacher review remain unverified.
- **2026-11-08 · Agent: DeepSeek V4.1 Flash (OpenCode), edit/Playwright · Admin fills wide desktops.** Removed the retired 1440px admin-page cap and the 1240px content cap so the Workspace body uses the full remaining width; desktop content now ends 40px from the right edge at both 1440 and 2560.
  `npm run check -- admin` passed (lint, typecheck, 112 unit tests, build, admin/publishing suites); users tab checked at 2560/1440 in light/dark. 3001 restarted on the fresh build and `/api/health` is green. No commit, push or deploy.
- **2026-11-08 · Agent: DeepSeek V4.1 Flash (OpenCode), edit/Playwright · Admin inside the Workspace shell.** `/admin` and its user/content detail pages now use the same rail, drawer, top bar, Inter face, palette and site-chrome hiding as `/workspace`, with grouped section links, rail collapse, theme toggle and sign-out preserved.
  `npm run check -- admin` and `npm run check -- ui` passed (112 unit tests, build, admin/publishing and theme/homepage suites); overview at 1440/390/320 and content at 1440 in light/dark, with no site header or footer. 3001 restarted on the fresh build and healthy.
  No commit, push or deploy.
- **2026-11-08 · Agent: Codex (GPT-6), image_gen/Playwright/FFmpeg · Visual homepage, reversible artwork.** 51% less copy, expandable formats/current prices, four original images preserved (SHA-256 checked), four new non-human ink/watercolour images; `HOME_ART_STYLE` restores the originals. Three real QA recordings now autoplay as muted loops without controls, respecting reduced motion; prompts: `docs/HOMEPAGE_MEDIA.md`. `npm run check -- ui` passed (112 unit tests, build, theme/homepage including autoplay/looping); home/exam/login at 1440/390/320 light/dark clean, 3001 healthy after PGlite restart without reset. No live AI, commit, push or deploy. Owner restored `editorial` images afterwards; both sets and autoplay loops retained, `check -- ui` passed again and 3001 restored.
