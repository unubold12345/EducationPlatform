# EducationPlatform — Operations

Current state, delivery rules and next actions. Stable facts: [PROJECT.md](./PROJECT.md). Keep under 150 lines. Full log to 2026-11-05 (sections 1–55): `git show 2928af3:docs/OPERATIONS.md`; read only for old evidence.
## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform`. Never reuse LawTest's remote.
  The repository is **public** (observed 2026-11-05); the owner chose to make it private in GitHub settings.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region
  `sin1`. A push to the branch deploys to production. Latest pushed code: `a76c266` (2026-11-11, see Recent); previous deploy `c85aa2c`.
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
- Not verified on the hosted site: signed-in dashboard and admin, or a real sitting with the new questions. Demo sign-in,
  profile and server-side denials passed `tests/hosted_demo_smoke.py` on 2026-11-12; rerun it after a deploy only with owner approval.
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
| `vocabulary` | vocabulary bank, decks, file scan, its API guards and quiz UI | `vocabulary` |
| `myexams` | exam-from-file upload, AI generation guards, sealed grading and the runner | `my_exams` |
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
- **2026-11-11 · Agent: Claude Code (Claude Opus 5.5), git/npm/gh · Owner-authorized full-tree commit, push and production deploy.** Committed 1,581 files as `a76c266` (HSK 1, Biology/Chemistry ЭЕШ, IELTS 07–12, vocabulary decks + migration `20261111090000`, Speaking Lab examiner/partners). Owner had the 3001 `next dev` stopped for the checks (3005 was already down). `npm run check:all` passed after updating stale `/exams` counts in five suites (4→5 cards, HSK added). Vercel status success; live `/`, `/exams` (5 cards incl. HSK), `/exams/hsk`, `/exams/eesh`, `/exams/ielts`, `/login` 200, `/api/health` database ok.
  2026-11-12, owner-approved: `hosted_demo_smoke` passed on the live site (five demo sign-ins, admin/name/password denial, logout, 320 px) after scoping its logout click to `.profile-heading` (the Workspace sidebar adds a second "Гарах"). Not run: real AI provider calls.
- **2026-11-11 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright/in-app browser · Selectable mock examiner; Ava/Bella voice check.** Owner reported that IELTS mocks only showed George and that Ava and Bella sounded different locally. The examiner is now any of the six partners (George default): picker on the IELTS start page, the in-stage invitation, the practice offer and a "Шалгагч солих" link in the stage; `voice` is validated server-side, and the report prompt no longer names the examiner (PROJECT "AI examiner in the IELTS mocks"). Voices: with the owner signed in on the live site, the hosted and local voice routes returned identical audio for Ava, Bella and George (same sample counts, pitch, loudness), so the natural voices are unchanged. The Lab refuses its voice route while a timed mock is open and then used the device voice with no message on the setup screen; the notice now shows there and gives the server's reason.
  `npm run check` passed (189 unit tests; two source-shape assertions updated for the new `voice` field, new cases added). Playwright on the running 3001 `next dev` (not restarted), two local QA accounts and one simulated purchase: practice voice route per examiner (greeting name and pitch), 400 for unknown voices and extra keys, start-page picker, practice offer, a live stage as Bella then Lewis, 390 width, refusal notice with a simulated 403; no page errors. Not run: browser suites or a build, a timed mock sitting with a non-George examiner (same route code as practice), whether an open mock was the owner's actual cause. No commit or push.
- **2026-11-11 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright · Vocabulary reorganized: decks, adaptive quiz, review-first import, margin price.** Words are organized in decks with stars, level filters, sorting, list/card views, pages of 25 and bulk move/star/reset/delete; the quiz mixes six question forms, picks due/new/weak words first and stores per-word progress on the account (`POST …/review`, Leitner boxes); a file scan now returns the new words for the student to choose and edit before saving (any count 1–120, level and word-type filters); the price hints are gone and the import is sold with a margin (4–47 credits: 3 + a per-word fee, never under twice its DeepSeek cost). Details: PROJECT "Vocabulary" and "AI credits". Additive migration `20261111090000_vocabulary_decks_and_study` (applied locally; Vercel applies it on deploy).
  `npm run check` passed (199 unit tests). `tests/vocabulary_smoke.py` was rewritten and passed against this session's `next dev` on 3001 (no build: the HSK session was using 3001), with the scan mocked in the browser; also checked by hand at 1440/1024/375, light/dark. Not run: `npm run check -- vocabulary` on a production build, a real DeepSeek scan (the level/type filters and the new prompt line are untested live), hosted check. Other AI actions are still priced at cost; the owner has not decided whether they get a margin. Local QA accounts (`qa-vocab-*@example.invalid`) remain. No commit or push.
- **2026-11-11 · Agent: Claude Code (Claude Opus 5.5), Python/Kokoro/Whisper/npm/Playwright · HSK 1 on the site; 3-column `/exams`.** The three `MockExmps/HSK` forms are timed mocks with practice, hub and results (PROJECT "HSK 1"): 118 pictures, pinyin, examples, and 12 locally synthesised Mandarin tracks on their own `/audio/hsk` route (the pack had no audio). `/exams` shows three programmes per row on desktop. No migration or new dependency.
  `npm run check` passed (199 unit tests incl. `hsk.test.mjs`); new `tests/hsk_smoke.py` passed against the other session's 3001 `next dev` (not via the runner; with `DEV_PRACTICE_DURING_MOCK=true` set to match it), plus screenshots at 1440/1280/1024/768/390/320, light/dark. Whisper-small round trip on all 60 items: 0.97 match; nobody has listened to the audio.
  Editing `next.config.ts` makes a running `next dev` restart itself once. Five disposable `qa-exam-hsk-*` accounts remain locally. Not run: build/`check:push` (would replace `.next` under 3001), hosted check; Vercel tracing for `/audio/hsk` untested. Teacher review pending. No commit or push.
- **2026-11-11 · Agent: Claude Code (Claude Fable 5.2), npm/tsx/Playwright · Speaking partner redrawn.** Owner chose "detailed illustrated" over a 3D model or a voice orb. The six partners are now shaded portraits drawn in code (`partner.tsx`: real eyes, lips, hair, outfits; George keeps glasses, Lewis his beard), and `avatar.tsx` redraws the mouth each frame from `mouthShape()` (opening follows the voice level; lip width wanders, not true lip-sync), with blink, gaze, brow and mood expressions in CSS. Stage circle gained a lit backdrop; small portraits are tinted with their partner's colour (also `.exam-examiner-face`). Same component, classes and `data-ready` hook, so the Lab, Workshop tile, report and mock examiner all use it; no dependency, asset, server or data change.
  `npm run check` passed (189 unit tests). Playwright on the other session's 3005 `next dev` (not restarted) with one new local QA account: all six partners, wave, a real local Kokoro preview (40 distinct mouth shapes, back to rest), listening/thinking faces, 1440/390/320, light/dark, Workshop tile, sign-in card, no page errors or sideways scroll. Not run: browser suites or a build (they replace `.next` under 3005), `speaking_lab_smoke`, the examiner inside a mock sitting, hosted check. No commit or push.
- **2026-11-11 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright · AI examiner in the IELTS mocks and practice mode.** The Speaking Lab's examiner now conducts Parts 1–3 of all twelve mocks, in the timed sitting and (opened by a click, no clock, parts repeatable) in practice mode's Speaking sections: scripted from each mock's own questions, local voice and transcription only (no model call during a sitting), transcripts saved as the responses, and the Lab's report (9 credits) on the results page afterwards (PROJECT "AI examiner in the IELTS mocks"). On by default on the IELTS start page; the recorded-prompt view remains. No migration; the runner now gives a new stage its clock at once. `npm run check` passed (189 unit tests incl. `speaking-examiner.test.mjs`). On my own `next dev` 3005 (stopped after), Playwright with a fixture microphone, real local Kokoro and Whisper and the mock fixture: a full Mock 07 Speaking run (follow-up, cue card, notes, long turn, three stored recordings), server refusals (other stage, unknown line, other account, Lab routes and report during the sitting), the in-stage invitation, a practice-mode run (preparation minute, redo, its own refusals incl. 402 without the exam), 1440/390/320, light/dark, no page errors; the report's DeepSeek call was intercepted in the browser, not made. Not run: browser suites and a build (they replace `.next`; the board holds 3001), a real report, hosted check. `exams_smoke.py` was edited, not run: the start page has a second equipment checkbox, so it ticks the first and switches the examiner off. Vercel tracing for the new routes (`next.config.ts`) is untested. No commit or push.
- **2026-11-10 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright · Speaking Lab: human-like conversation and redesigned mock/partner screens.** The mock is now run by a neutral AI examiner with standard IELTS framing under exam conditions (no tips, ideas or retries; corrections arrive in the report's new conversation review); practice is a named, conversational partner with its own manner. The partner says a pre-loaded "Okay"/"Thank you" the instant an answer ends, nods while listening, and a "could you repeat?" no longer uses up a mock question (PROJECT "IELTS Speaking Lab"). Call-style stage, cue card pinned with its countdown, mode cards, topic/band chips. The chat request gained `mode` and `voice`; no migration.
  `npm run check` passed (180 unit tests). On my own `next dev` 3005 (stopped after), Playwright with the chat route mocked: mock and practice flows at 1440/390/320 light/dark, a live loop with real local Kokoro voice and a fixture microphone (acknowledgement clip starts ~2 ms after the answer ends), and a copy of `speaking_lab_smoke.py` with only DeepSeek mocked (real Kokoro and Whisper) passed.
  Owner-approved live check (tsx on the real service and ledger, one QA account, 25 calls, about 1–1.5 s per reply, report 4.2 s): a full mock with George and a practice chat with Bella behaved as designed (standard framing, no praise, repeat request honoured, plain "I'm an AI" when asked). It exposed an older fault: a bare one-word answer ("Yes.") made DeepSeek return only whitespace in JSON mode, with the previous prompt too; the final message now ends with a format cue. Tips that quote an earlier answer are dropped on the server (`tipQuotesAnswer`). `npm run check` passed again (181 unit tests). Not run: browser suites, build, hosted check; Kokoro's rendering of the acknowledgement clips was not judged by ear. The QA account has 28 of 100 credits left. No commit or push.
- **2026-11-10 · Agent: DeepSeek Harness (deepseek-flash), Python/resvg/ReportLab · Three offline HSK 1 mocks.** `MockExmps/HSK/`: three 40-item forms on the current regular HSK 1 (2.0) blueprint, 128 original SVG pictures covering every official picture task, pinyin, keys, transcripts, examiner scripts and printable booklets/answer sheets; excluded from deployment. Build/validation `python -B MockExmps/HSK/_source/build.py --pdf` passed (counts, keys, vocabulary, duplicates, images, PDF pages); links and pages checked, diff/secret clean. Not run: `npm run check` (no app code), browser/hosted checks; teacher review, calibration and audio pending. No commit/push.
