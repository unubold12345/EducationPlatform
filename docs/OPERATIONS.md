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
| `vocabulary` | vocabulary bank, its API guards and quiz UI | `vocabulary` |
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
- **2026-11-09 · Agent: Codex (GPT-6), PowerShell/npm/Playwright/Kokoro · Six IELTS mocks reviewed and revised.** Replaced answer-announcing Listening 02–06 with connected scripts and 20 versioned recordings; strengthened Reading distractors/matching/NOT GIVEN, enriched Writing data plus a process diagram, and broadened Speaking Part 1. Review: `IELTS_MOCK_REVIEW.md`.
  `npm run check:all` passed (133 unit tests, build, 18 browser suites); final `npm run check -- mocks practice` passed, including old-audio compatibility and the full-size mobile diagram view. Existing attempt snapshots/media retained; new IDs isolate revised practice work.
  Local 3001 verified healthy on revised content. Teacher/learner calibration, full human pronunciation review and hosted deployment remain unverified. No real AI-provider calls, commit, push or deploy.
- **2026-11-09 · Agent: Claude Code (Claude Opus 5.5), Python/npm/Playwright/tsx · Vocabulary priced by words; plan bank sizes.** Kept the selection prompt and priced imports by result: a 10/20/50/all word picker holds the most that count can cost on a full file (8/9/12/17) and settles to text read + new words saved (10 words from a short list = 2), returning the rest; `chargeCredits` gained `hold`/`settle`. Bank: free 100, IELTS/SAT 3,000 (University Prep 100), enforced on add and before any import hold.
  `npm run check` passed (148 unit tests). A tsx QA script on the real local ledger confirmed settle, refund, 402 "хамгийн ихдээ", a 3-way race and plan sizes (rows cleared). Owner-authorized delivery: `npm run check:all` passed (build and all 20 browser suites, incl. the extended vocabulary smoke); 3001 restarted healthy on that build. Screenshots reviewed at 1440/375 light/dark. No live DeepSeek call.
- **2026-11-09 · Agent: Claude Code (Claude Opus 5.5), Python/npm/Playwright/in-app browser · Admin AI credits.** New `/admin?tab=credits` (monthly credits spent/refunded, real DeepSeek cost vs credit value, by action, top students, charge list with CSV), an overview line, an audited per-student "AI кредит олгох" bonus (this month only) with balance and history on the user record, and audited free/plan monthly amounts in the Prices tab (`CreditAllowance`, used by charging and `/workspace/plans`).
  Owner-approved additive migration `20261109210000_admin_credits` applied locally; the hold is now one SQL compare-and-set that includes the bonus (ledger script re-run on a QA account, rows cleared). `npm run check` passed (145 unit tests); on own `next dev` 3005 the extended `admin_smoke` and `publishing_smoke` passed and the tab, Prices section, user page and overview were checked at 1440/390/320. A dev server must restart after `prisma generate` to see new tables. No commit or push.
- **2026-11-09 · Agent: Claude Code (Claude Opus 5.5), Python/npm/Playwright/in-app browser · AI credits.** Every DeepSeek action now costs fixed credits priced from DeepSeek Flash peak list rates (1 credit = $0.001; 3–17 per action), held before the call, refunded on any failure, with tokens and real cost logged per charge (`src/modules/credits`).
  Monthly allowance per Ulaanbaatar month: 100 free plus University Prep 1,500, SAT 2,000, IELTS 3,000 (plans stack). Costs show beside every AI button; the balance is in the rail and on `/workspace/plans#credits`.
  `npm run check` passed (lint, typecheck, 143 unit tests incl. `credits.test.mjs`). Owner-approved: applied the additive migration `20261109190000_ai_credits` locally; a QA-account script confirmed spend, refund, 402 and a 3-way race on the real ledger; on an own `next dev` 3005 (no build, 3001 untouched) my_exams, vocabulary, writing_lab, exam_practice, browser, accounts and exams smokes passed and the rail, badges, 402 message and plans section were checked at 1440/390/320 light/dark. QA rows were cleared. No live DeepSeek call, tutor/practice drawer view, commit or push.
- **2026-11-09 · Agent: DeepSeek V4.1 Flash (DeepSeek Harness), npm/Playwright · Vocabulary width and columns.** Restored the Workspace 1000px page cap on `/workspace/vocabulary` and made the saved-word list a responsive grid (3 columns at the 1000px page width, 2 at mid widths, 1 on phones) instead of one full-width column.
  `npm run lint`, `npm run typecheck`, `npm test` (134 tests) and `npm run build` passed; the vocabulary smoke passed against rebuilt 3001 (auth/origin/ownership/file guards, add/edit/delete, import, search, quiz, mobile drawer and no horizontal scroll). Playwright measured 3/2/1 columns at 1440/1000/390–320 with no horizontal scroll (screenshots in `artifacts/vocab-*.png`). Local PGlite was restarted without reset after its process dropped; 3001 is healthy on the new build. No commit or push.
- **2026-11-09 · Agent: DeepSeek Flash (DeepSeek Harness), npm/Playwright · Vocabulary bank and quiz.** Replaced `/workspace/flashcards` with `/workspace/vocabulary` (old URL redirects): per-account `VocabularyWord` store (add/edit/delete, duplicate guard, 1,000-word cap), AI file import saved to the bank with an optional bounded selection prompt (e.g. "choose 20 words"), a document's own translation is kept, with a visible warning that fallback AI translations may be inaccurate, and a browser-scored 10/20/30-question quiz; shared upload extraction moved to `src/modules/documents`.
  `npm run check -- vocabulary` passed (lint, typecheck, 134 unit tests, build, vocabulary smoke); the smoke mocked the AI reply and covered guest/origin/body/ownership/file guards, persistence across reloads and accounts, import, search, keyboard quiz and mobile; light/dark screenshots reviewed. Local additive migration applied. No live DeepSeek call, commit, push or deployment; generated-word quality and teacher review remain unverified.
- **2026-11-09 · Agent: Claude Code (Claude Opus 5.5), Python/curl/in-app browser · Chemistry ЭЕШ offline mocks.** Added `MockExmps/Chemistry/`: 18 JSON forms (3 each for 2020–2023, 2025, 2026) with authored keys, explanations and original SVG figures; references kept local (2025/2026 official A PDFs, 2020–2023 EEC bank Part I, 2021 blueprint). 2024 not found (eec.mn 404, no Wayback capture, Testly login-only) so no 2024 forms; 2020–2023 Part II is provisional. `tools/build.py` validation passed for all forms and all 720 MCQ keys re-checked; `.vercelignore` excludes the pack. No site integration, `npm run check`, teacher review, commit or push.
