# EducationPlatform — Operations

Current state, delivery rules and next actions. Stable facts: [PROJECT.md](./PROJECT.md). Keep under 150 lines. Full log to 2026-11-05 (sections 1–55): `git show 2928af3:docs/OPERATIONS.md`; read only for old evidence.
## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform`. Never reuse LawTest's remote.
  The repository is **public** (observed 2026-11-05); the owner chose to make it private in GitHub settings.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region
  `sin1`. A push to the branch deploys to production. Latest pushed code: `26252b9` (2026-11-12, my-exams on the account + free mocks; see History); previous deploy `1581b65` (speaking voice wave).
- Hosted database: Singapore Neon, reached through its pooled address (migrations too; see section 4). The old US Neon
  database is read-only for rollback; do not resume writes to it.
- Hosted flags: `AUTH_HOSTED_PILOT`, `AUTH_HOSTED_DEMO_ACCOUNTS`, `SPEAKING_LAB_ENABLED`, `AUTH_HOSTED_GMAIL` and
  `AUTH_REQUIRE_EMAIL_VERIFICATION` are `true`; payments are simulated; Google and Gmail credentials and `DEEPINFRA_API_KEY` (2026-11-12) are set in Vercel.
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
6. Listen to one Speaking Lab partner on the hosted site from a phone with a real microphone (hosted speech passed an automatic live check on 2026-11-12; nobody has heard it). The DeepInfra key was pasted into a chat; consider replacing it in Vercel and `.env.local` with a fresh one.

For agents:
- Not verified on the hosted site: signed-in dashboard and admin, or a real sitting with the new questions. Demo sign-in,
  profile and server-side denials passed `tests/hosted_demo_smoke.py` on 2026-11-12; rerun it after a deploy only with owner approval.
- Rewritten but never run: `tutor_smoke.py` (needs live DeepSeek approval).
- Practice assistant: one real DeepSeek reply checked (SAT, Mongolian, before a check). IELTS, ЭЕШ, English replies and the later
  field-name prompt fix are untested; `exam_practice_smoke` intercepts it, so real calls need owner approval.
- Roadmap page removed 2026-11-13 (owner request); its planner code, `roadmap` credit action and `StudyPlan` table are left unused (PROJECT section 7). Ask the owner before deleting them.
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
| `vocabulary` | vocabulary bank, decks, file scan, its API guards and quiz UI | `vocabulary` |
| `myexams` | exam-from-file upload, AI generation guards, account-stored exams, sittings, grading, the browser import and the runner | `my_exams` |
| `entrance` | ЭЕШ mocks, their collections, withdrawn-paper 404s | `entrance_mocks` |
| `mocks` | added SAT/IELTS forms | `additional_exams` |
| `jlpt` | JLPT catalogue, timed mocks, Japanese audio and practice | `jlpt` |
| `hsk` | HSK catalogue, picture tasks, Mandarin audio, practice, `/exams` grid | `hsk` |
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
  no app error can be transient (`47dc518`; an empty commit fixed it. `1581b65`: `migrate deploy` lock timeout `P1002`; a redeploy from Vercel fixed it). Vercel logs need a signed-in session.
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
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Node · Typed numeric answers read powers of ten.** Owner approved, after the Part II work. `numeric()` in `engine.ts` now also reads `3.2·10⁻¹³`, `3.2*10^-13`, `3.2 × 10^(−13)` and `10⁻¹⁴` for numeric answers (before, a ЭЕШ Physics 2.3b force typed the way the key prints it scored 0; only `3.2e-13` or the full decimal did); a sign before 10 and a `^` or superscript are required, and the math matcher is unchanged, so `exactForm` tasks still reject `100000` for `10⁵`.
  A scan of all 221 exams (3,750 typed questions) against the previous engine: no key grades differently and no math result changed; the 60 Physics 2.3b keys are the only ones printed as powers of ten. `npm run check` passed (267 unit tests; new case in `tests/mock-fixes.test.mjs`, 2.3b checked in all 60 papers). Not run: browser suites, a sitting in a browser. Old reports regrade with it. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Python/Node/Playwright · ЭЕШ Physics Part II repetition (MOCK_REVIEW H4 follow-up).** Tasks 2.1–2.4 each have 30 scenarios (the five earlier ones and 25 new; one earlier gas scenario moved off a prompt it shared) taken in their own fixed paper order (`slot` 47–50) instead of `rng.choice`; keys are worked in exact fractions and the generator stops on a scenario that breaks a task rule. Distinct Part II task texts 19 → 120, each in two papers (was up to 28); all 2,760 Part I items unchanged. Then, owner-approved via the mock fix session: 2.2[a] (highest pressure) was 3 in every paper; 1–2 is now a straight line (isobaric in ten scenarios) then an isochor, so states 1, 2 and 3 are the answer in 20 papers each and 2.2d is the area under the line; step 3 of the 2.2 explanations now gives V3 = V2 and reads p3 off the graph instead of "isochoric, so p3 = …"; Part I, 2.1, 2.3, 2.4, every key, prompt and figure and the entrance catalogue are byte-identical to the build before. Generator, validator, entrance build (0 problems), SVG trim, `node --test tests/mock-fixes.test.mjs tests/entrance-mocks.test.mjs tests/exams.test.mjs` (Part II cases; a constant 2.2[a] now fails) and `npm run check` (268 unit tests) passed; all 240 Part II keys re-derived from the printed text and figures by an independent script (0 mismatches), 16 new scenarios hand-checked, eight new figures rendered and inspected. Not run: production build, browser suites, the exam pages in a browser. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Python/Node/Playwright · ЭЕШ Physics and Biology item reuse (MOCK_REVIEW H4).** Mock-review follow-up. Physics Part I questions each draw from their own pool of versions (≥20, most numeric ones 60) in a fixed per-question order of the 60 papers; Biology templates filling four or more slots follow their own slot counter (`item_k`). No choice item (prompt + key) is now in more than three papers: Physics 394 → 2,446 distinct of 2,760, Biology 442 → 785 of 1,038 (details and the review's measure in MOCK_REVIEW H4). Also fixed: Physics Q44 options had become 8, 16, 0.67 (now the labels 1–5), Q3 drew negative velocity off the canvas, several figures now match their prompts; Biology matching keys use all six orders.
  Both pack validators, the entrance build (0 problems), the SVG trim and `node --test tests/mock-fixes.test.mjs tests/entrance-mocks.test.mjs` (new H4 case) passed; `npm run check` passed (265 unit tests). 2,292 Physics keys re-derived from the printed prompts by an independent script (0 mismatches); 46 Physics and 54 Biology keys hand-checked. Not run: production build, browser suites, the pages in a browser. Physics Part II tasks still repeat (five scenarios each). No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5) with eight Claude Opus 5.5 subagents, Python/Node · ЭЕШ English explanations, then the doubtful keys.** Mock-review follow-up (MOCK_REVIEW Medium): each of the 2,665 English items explains its key in Mongolian (rule, collocation or the quoted deciding sentence), kept in `MockExmps/English/_source/explanations/` and merged by `_source/build.py`; `build-entrance-mocks.mjs` fails an English item without one. Then, owner-approved: the writers' 17 doubtful keys and 3 wording notes fixed (22 items and one passage sentence, listed in MOCK_REVIEW), the explanations marked `lang="mn"` in results and practice, English no longer exempt in two explanation tests. Rebuilt in a scratch root (shared catalogue untouched); nothing else in the papers changed.
  `npm run check` passed (268 unit tests; new `tests/english-explanations.test.mjs`); 105 explanations hand-checked. Not run: build, browser suites (the 3001 servers hold the local database), a look in a browser (needs a sign-in); teacher review pending. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Python/SymPy/Node · Mock exam review, then fixes.** Owner request: review all mocks, then fix critical first and the rest; findings and fix status in [MOCK_REVIEW.md](./MOCK_REVIEW.md). Grading: choices keep their case (Biology 2026 Q38), typed Mathematics is compared by value (`math-value.ts`; `exactForm` for form tasks), Physics Part II keys are exact with roundings accepted and 2.3d asks for the coefficient of π, Biology digits round half up, 2015 M4 Q34 has one correct option. Content: generators fixed, then every ЭЕШ Mathematics, Physics, Biology and Chemistry paper regenerated and rebuilt (keys, distractor positions and lengths, syntax, spacing, case endings, notation); SAT 02–06 Module 2 has its own items; SAT Mock 01 distractors rewritten; English nested markup; IELTS 02–06 TRUE/FALSE/NOT GIVEN explanations quote the passage. `npm run check` passed (262 unit tests; new `tests/mock-fixes.test.mjs`). Done afterwards by follow-up sessions (their own entries): ЭЕШ English explanations and keys, Physics/Biology item reuse, Physics Part II scenarios and 2.2a, power-of-ten numeric answers; combined tree re-checked (`npm run check`, 268 unit tests). Open: teacher review (Physics Q39, new Mongolian content). Not run: build, browser suites, the pages in a browser, hosted check; a published admin edit still overrides an exam, and old reports regrade. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), npm/Playwright/ffmpeg/DeepInfra/in-app browser · Roadmap page removed; Workspace rail trimmed; homepage refreshed.** Owner request. Removed `/workspace/roadmap`, its API route, rail tab and Home panel (streak kept; planner code and `StudyPlan` left unused, backup tar in `artifacts/`); the rail lost its main-site link and sign-out (profile keeps sign-out). Homepage: three new FLUX-2-pro photos (ЭЕШ, HSK, Workshop; owner-approved DeepInfra, under $0.25) end the image repeats; slogan overlays, seal, filler eyebrows/notes and Workshop fine print removed; current Workspace tools and an AI-credit FAQ; demos re-recorded on the current Workspace (local QA accounts `qa-exam-home-demo-*` left in the local database).
  `npm run check` passed; `npm run check -- ui core` passed (build, theme, homepage_polish, browser, accounts, exams; `accounts_smoke.py` now signs out on the profile). In-app browser on 3001 `next dev`: rail tabs, roadmap 404s, homepage at 1440 and in dark mode. Not run: other groups, hosted check. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Fable 5.2), npm/Prisma/tsx/in-app browser · Roadmap redesign; DeepSeek writes the plan's structure.** Owner request. `POST /api/workspace/roadmap` has DeepSeek write a headline, phases with repeatable routines, a theme per week and exam tactics from the student's settings, mock percentages and per-skill results (no identity); the site still places mocks, links and dates and reads the reply field by field (`structure.ts`). New nullable `StudyPlan.structure` (additive migration `20261113090000_study_plan_structure`, applied locally; Vercel applies it on deploy), new credit action `roadmap` priced by plan length (5–8). The page has a countdown hero, a journey road, one week at a time, a score path and a skill map; it now has the Workspace gutters, and the exam eve holds only rest. Details: PROJECT "Study roadmap and daily streak", "AI credits".
  `npm run check` passed (255 unit tests; 13 new cases, the price list and the provider-caller guard in `credits.test.mjs` extended). A tsx script ran the real service on the local database with the DeepSeek call stubbed: refusals (400/404/429) held no credits, a malformed reply was retried once and refunded, a good one was fitted, saved and charged 5, and the request carried no identity. In-app browser on the running 3001 `next dev` (not restarted) as a reserved QA account: both themes, 1440/1024/375 wide with no sideways scroll, week and phase navigation, ticks through the real `PATCH`, the form's plain save and delete, the route's 400/415/405/404, and the generate flow with the request mocked in the page. Not run: a real DeepSeek generation (needs owner approval), a build, browser suites, hosted check. The QA account keeps a stub-written plan; two seeded sittings were removed. No commit or push.
