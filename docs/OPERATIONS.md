# EducationPlatform — Operations

Current state, delivery rules and next actions. Stable product and architecture facts live in
[PROJECT.md](./PROJECT.md). Keep this file under 150 lines. The full log to 2026-11-05 (sections 1–55) is
in git: `git show 2928af3:docs/OPERATIONS.md`. Read it only when old evidence is needed.

## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform`. Never reuse LawTest's remote.
  The repository is **public** (observed 2026-11-05); the owner chose to make it private in GitHub settings.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region
  `sin1`. A push to the branch deploys to production. Latest deployed commit: `8a81f43`.
- Hosted database: Singapore Neon, reached through its pooled address (migrations too; see section 4). The old US Neon
  database is read-only for rollback; do not resume writes to it.
- Hosted flags: `AUTH_HOSTED_PILOT`, `AUTH_HOSTED_DEMO_ACCOUNTS`, `SPEAKING_LAB_ENABLED`, `AUTH_HOSTED_GMAIL` and
  `AUTH_REQUIRE_EMAIL_VERIFICATION` are `true`; payments are simulated; Google and Gmail credentials are set in Vercel.
  `.env.vercel.local` is a stale snapshot.
- Local: PGlite on 51214/51215 (`npm run db:start`). No preview is left running; `prod3006` in `.claude/launch.json` serves a build on 3006.
  Port 3001 was last serving the separate Lexlab app: check `/api/health` before trusting anything on it, and never touch it.
- The 40-paper 2026 EEC import exists only on the previous PC and is not in this tree. Dornod papers and practice exercises
  were deliberately removed.

## 2. Open items

Owner actions:
1. Owner chose on 2026-11-05 to leave old exercise rows in Neon for now (a few MB, unused). Keep the tables in the schema;
   do not add a dropping migration unless asked. `scripts/purge-exercises.mjs` remains available for a later cleanup.
2. Make the repository private. Still public on 2026-11-06, and it holds the БҮТ pages; 2018 A and 2019 A print a no-copying notice, with no permission on record.
3. Decide whether University Prep (₮40,000, papers only) and SAT (₮60,000, mocks only) prices still fit.
4. Complete one real Google sign-in with an owner-controlled account. Only the authorization start has been verified.
5. Buy a sender domain if wanted, then switch to Resend (section 5).

For agents:
- Not verified on the hosted site: signed-in dashboard, profile and admin, or a real sitting with the new questions.
  `tests/hosted_demo_smoke.py` is ready; ask the owner first.
- Rewritten but never run: `tutor_smoke.py` (needs live DeepSeek approval).
- Practice assistant: one real DeepSeek reply checked (SAT, Mongolian, before a check). IELTS, papers, English replies and the later
  field-name prompt fix are untested; `exam_practice_smoke` intercepts it, so real calls need owner approval. Teacher review of its paper answers is pending.
- Not runnable here: `auth_recovery_smoke.py`, because `artifacts/start-auth-recovery.mjs` is not on this machine.
- Remove unused exercise CSS from `theme.css`, `globals.css` and `programs.css`.
- Teacher review is pending for original mock content and the 2020 Math transcription and key corrections.
  Later: production billing, data retention, account deletion and accessibility audit.

## 3. Delivery rules

**Git.** Never commit, amend, push, tag, open a PR or deploy without explicit owner authorization; a request to implement
is not one. Before committing, inspect status, diff, recent log, branch and remote. Stage only intended files; exclude
secrets, `.env*`, logs, `artifacts/`, caches and generated output. Report local changes, commits, pushes and deployments separately.

**Agents.** Several agents share this repo. Claim work in [ACTIVE_WORK.md](./ACTIVE_WORK.md), recheck it before builds, preview
restarts, database changes, commits or pushes, and remove the row when done. Never edit, revert or re-attribute another agent's work.

**Checks.** Run only what the change needs. The runner stops at the first failure and starts its own server on 3007:

| When | Command | Time (2026-11-05) |
| --- | --- | --- |
| Docs only | `git diff --check` and a secret scan | seconds |
| Any code change | `npm run check` (lint, typecheck, unit) | 10 s |
| The change touches a browser area | `npm run check -- <group>` (table below) | 15 s to 2 min |
| Before an authorized push | `npm run check:push` (build + core); add affected groups | 1.5 min |
| Big or cross-cutting change | `npm run check:all` | 5.5 min |

| Group | Run when changing | Suites |
| --- | --- | --- |
| `core` | routing, sessions, layout, exam engine | `browser`, `accounts`, `exams` |
| `papers` | official papers, keys, English archive | `official_paper`, `english_archive` |
| `mocks` | added SAT/IELTS forms | `additional_exams` |
| `practice` | practice mode, its assistant, sitting tools | `exam_practice` |
| `admin` | admin, content publishing | `admin`, `publishing` |
| `billing` | plans, prices, checkout, access | `payments`, `subscriptions` |
| `account` | profile, password, demo accounts | `profile`, `demo_accounts` |
| `ui` | theme, global CSS, homepage | `theme`, `homepage_polish` |
| `writing` | Essay Studio | `writing_lab` |

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

Before 2026-10-25 agents were not recorded. Commits and details are in the full log.

| Dates | Agent | Milestone |
| --- | --- | --- |
| 10-22 to 10-24 | not recorded | Foundation, SAT, IELTS, entrance; accounts, plans, admin, DeepSeek tutor, Speaking Lab; Singapore Neon; Google/Gmail activation |
| 10-25 | Codex | 2020 Math A–D, bundled images, 37 English exams, Dornod papers (later removed) |
| 10-25 | Claude Code | Dashboard rewrite, work board and attribution rules |
| 10-27 to 10-29 | Opencode | Dark-first interface, programs redesign, exam briefings, home atmosphere, Lexlab card |
| 10-29 | Claude Code | Moved to this PC, Dornod removal, Workshop, AI drawer, Essay Studio, Harper spelling, speaking partners |
| 10-30 | Codex | Ten more mocks, mock collections, 240 practice questions (later removed) |
| 10-30 | Opencode | Admin workspace, profile polish |
| 10-30 | Claude Code | Complete admin, suspension, prices, classroom limits, pooled database, health check, load test |
| 11-04 | Opencode | Profile tabs and contrast |
| 11-04 | Claude Code | Dashboard, profile and admin redesign; Golos Text; program page cleanup |

## 8. Recent

- **2026-11-05 · Claude Code (Opus 5.5) · 2020 Math site data (`d9d56f0`).** 160 questions, formula sheet and figures render from data.
  Key corrected for A14 and A22, and B/D 2.1 d/e paired as printed; saved attempts keep old keys. Local suites passed. Hosted
  checks were signed-out only.
- **2026-11-05 · Claude Code (Opus 5.5) · Exercises removed (`2928af3`).** Routes, modules and deploy seed gone; deploy fell from about
  11 min to 1 min 50 s. Workshops, labs, mocks and papers stay. 404s confirmed on the hosted site; hosted data not deleted.
- **2026-11-05 · Claude Code (Opus 5.5) · Docs and checks.** This file cut from 150 KB; `scripts/check.mjs` replaces hand-run suites with
  no pauses. Removed `mock_collections_smoke` (core checks moved to `browser_smoke`) and one-off `hosted_auth_activation_smoke`.
  `check:all` passed, all 16 suites in about 5.5 min. Pushed as `8a81f43`; Vercel reports success.
- **2026-11-06 · Claude Code (Opus 5.5) · Practice mode (uncommitted).** Untimed practice, instant checks and a DeepSeek assistant on all 12 mocks and 41 papers;
  additive `PracticeSession` migration, local only. Sitting tools, result filters, lighter polling; timers and grading unchanged. `check` plus `practice`, `core`, `papers`,
  `mocks` passed; `exams` timed out once at the start page, passed on rerun, cause unproven. One real DeepSeek reply withheld the answer (3 s); hosted site unverified. See PROJECT section 7.
