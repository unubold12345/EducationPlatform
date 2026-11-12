# EducationPlatform — Operations

Current state, delivery rules and next actions. Stable facts: [PROJECT.md](./PROJECT.md). Keep under 150 lines. Full log to 2026-11-05 (sections 1–55): `git show 2928af3:docs/OPERATIONS.md`; read only for old evidence.
## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform`. Never reuse LawTest's remote.
  The repository is **public** (observed 2026-11-05); the owner chose to make it private in GitHub settings.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region
  `sin1`. A push to the branch deploys to production. Latest pushed code: 2026-11-12 my-exams on the account + free mocks (see Recent); previous deploy `1581b65` (speaking voice wave).
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
- **2026-11-12 · Agent: Claude Code (Claude Opus 5.5), git/npm · Owner-authorized push of the local my-exams, exam-storage and free-mock work.** Owner approved stopping the 3006 preview first. `npm run check:push -- myexams billing` passed (lint, typecheck, unit, build, `browser`, `accounts`, `exams`, `my_exams`, `payments`, `subscriptions`). Two commits: `MockExmps/Free/` (ignored by Vercel), then my-exams polish + account storage with the additive `MyExam` migration, which Vercel applies on build. Hosted result is in the closing report.
- **2026-11-12 · Agent: Claude Code (Claude Fable 5.2), npm/in-app browser · Speaking partner portraits replaced by a live voice wave.** Owner request. The stage in the Lab and the mock examiner now draws a canvas wave (`avatar.tsx`; same component name, class and `data-ready` hook), and the small faces in the pickers, report heading, sign-in card, examiner invitation and Workshop tile are per-partner bar marks (`partner.tsx`, `PartnerMark`). The face drawing, mouth shapes and their CSS are removed; George's colour was lightened so it reads on the dark card (PROJECT "IELTS Speaking Lab").
  `npm run check` passed (213 unit tests). In-app browser on this session's `next dev` 3005 with the real hosted voice: idle dots, a playing wave for two partners, the picker and the Workshop tile at 571 and 1280 wide, light and dark, no console errors or sideways scroll. Not seen: the green listening wave and the thinking ripple (need a microphone and a paid reply), the mock examiner stage, a build or browser suites; `speaking_lab_smoke.py` now expects a canvas but was not run. The homepage demo videos still show the old faces. Owner then authorized the deploy: `npm run check:push -- ui` passed and `1581b65` (voice-wave files and docs only) was pushed. The first Vercel build failed before the app build, at `migrate deploy` (`P1002`, advisory-lock timeout on the pooled connection; no migration was pending); a redeploy of the same commit went READY. Live as demo account 05: the wave played Ava's hosted voice, no console errors.
- **2026-11-12 · Agent: Claude Code (Claude Fable 5.2), npm/web search · Speaking partner at scale: optional hosted speech provider.** Owner asked how the partner copes with more students. Voice and transcription ran inside the web server, one request at a time per instance, with a ~460 MB model load on each cold instance. With `DEEPINFRA_API_KEY` set, the same routes and checks now call DeepInfra (same six Kokoro voices as MP3, Whisper large-v3-turbo, English fixed) with no shared queue; without the key nothing changes (PROJECT "Hosted speech provider"). Microphone notices now say audio may pass to a speech service.
  `npm run check` passed (213 unit tests; new `tests/speaking-provider.test.mjs` with the provider mocked). The owner then supplied a key (stored in ignored `.env.local` only): a scratch node run through `speech-provider.ts` made 9 voice and 3 transcription calls. All six partners returned MP3 (as base64 JSON) with distinct pitch (100–222 Hz), 1.3–2.0 s a sentence; Whisper heard each line back correctly, including "I'm", in 0.7–3.0 s. Then, owner-approved, in the in-app browser on this session's `next dev` 3005 (3006 left running): the Lab's voice route streamed MP3 frames (first audio ~1.0 s), the page decoded them, the transcribe route returned the right text (1.9 s), ten simultaneous voice requests all finished within 3.2 s, and "Hear Ava" played through the Lab's own player with no console errors. Not run: a real microphone, the mock/practice examiner routes (same two functions), a person listening, a build, browser suites, hosted check. Owner then authorized the key in Vercel (production and preview, sensitive), the commit and the push: `npm run check:push` passed, `91db28c` holds only the speaking files and the docs, Vercel READY, live `/`, `/labs/ielts-speaking`, `/exams/ielts`, `/login` 200 and health ok. Owner-approved live check as demo account 05 in the in-app browser: the Lab's voice route returned MP3 from the provider (first audio 2.3 s on a fresh function), the transcribe route returned the right text (3.8 s) and all six partners answered at once within 2.8 s. Other sessions' work (my-exams, plans, free mocks) is still local; the 3006 preview needs a restart after the rebuild.
- **2026-11-12 · Agent: Claude Code (Claude Fable 5.2), npm/Prisma/Playwright/in-app browser · Exams from a file moved from browser storage to the account.** Owner request, after asking where they were saved. New `MyExam` table (additive migration `20261112100000_my_exams`, applied locally; Vercel applies it on deploy) holds the questions with their key, the open sitting, the last result and the best score. The page is server-rendered; start, autosave, grade and delete go through session-checked routes scoped to the student, and the 5/15 saved-exam limit is counted on the server. Exams still in a browser move to the account once through their sealed token (score re-graded, expired tokens accepted, 20 per account). Details: PROJECT "Exams from a file".
  `npm run check -- myexams` and `-- core` passed (206 unit tests, build). `my_exams_smoke.py` was rewritten to use the real routes and database (new `tests/my_exams_fixture.mjs`; only the provider reply is mocked) and one source assertion in `credits.test.mjs` follows the new reply shape; the suite caught a server/browser date-format hydration error, now fixed. A scratch tsx run of `createMyExam` with the DeepSeek call stubbed saved, graded and deleted a row. In-app browser on a 3006 production build: a browser exam moved, its claimed 100% was re-graded to 70%, and it stayed after storage was cleared.
  The local database dropped once during `core` (section 4; stop/start, row counts intact). Not run: a real DeepSeek generation, `check:all`, hosted check. Still browser-only: Workspace chats, Reading Lab practices, Writing/Speaking/Listening Lab progress. With owner approval the earlier 3006 preview was stopped and a new one started (see the board). No commit or push.
- **2026-11-12 · Agent: Claude Code (Claude Opus 5.5), Python/SymPy/Node/resvg · Free half-length mocks prepared offline (not on the site).** Owner asked for one free mock per exam for free-plan students, at least half length, to be put on the site later. New `MockExmps/Free/`: ten original mocks (ЭЕШ Mathematics, Physics, Chemistry, Biology and English at 50 points each; SAT one R&W + one Math module, 49; IELTS Listening 1–2, Reading 1–2, Writing 1, Speaking 1–2; JLPT N5 34 and N4 43 items; HSK 1 20 items in all eight parts), already in the site's stored-paper/`ExamDefinition` shapes with figures, HSK pictures from the pack's scene library and listening scripts; `.vercelignore` excludes the folder. Its README has the integration checklist (files, catalogue, server-side free access, audio, copy that assumes full length).
  `python -B MockExmps/Free/_source/build.py` (keys recomputed in Python/SymPy, structure, HSK word list) and `node MockExmps/Free/_source/grade_with_engine.mjs` (the site's `engine.ts`: all ten 100% with every key, 0 when empty) passed; figures inspected as PNGs; `git diff --check` and secret scan clean. Not done: listening audio (IELTS/JLPT/HSK cannot be sat yet), teacher/native review, any app code (so no `npm run check`). No commit or push.
- **2026-11-12 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright/in-app browser · My-exams polish: any 5–20 questions, per-question price, structure request, saved-exam limits, free plan card.** Owner request. `/workspace/my-exams`: a slider and number box replace the 10/20 buttons; an optional "Шалгалтын бүтэц" request (500 characters, sent as data) and a fixed structure rule in the prompt; setting hints and fine print removed; saved exams limited to 5 free / 15 with IELTS or SAT (University Prep 5 is my reading, not confirmed). Exams are stored in the browser, so the server decides from the plan and the count the page reports, before credits are held. Price: 2 credits a question with a 2× DeepSeek-cost floor (10–40; was 13/17 at cost; the owner named no figure). `/workspace/plans` has a free card and a free column. Details: PROJECT "Exams from a file", "AI credits". No migration.
  `npm run check -- myexams billing` passed (203 unit tests, build, `my_exams`, `payments`, `subscriptions`); `my_exams_smoke.py` was extended and the plans assertions in `subscriptions_smoke.py` changed on purpose (3→4 cards, ₮0 first). In-app browser on a 3006 production build (left running for the owner; see the board): plans at 1280/1024/768/390/320 and my-exams at 820/390/320, no sideways scroll or console errors. Not run: a real DeepSeek generation (the structure request, counts other than 10/20 and the count-based `max_tokens` are untested live), the `core`/`ui` groups, hosted check. Board rows from 2026-11-11 still claim 3001/3005, but nothing was listening on them. No commit or push.
- **2026-11-12 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright/in-app browser · Student-view review; public counts and programme lists corrected.** A guest review of the live site found stale copy after the HSK, Chemistry/Biology, IELTS 07–12 and Reading Lab additions; the owner approved fixing it. Counts now come from the catalogues (221 mocks, 5 programmes, 4 labs): homepage hero, ticker, HSK as a fifth programme (reusing the language photo; no Chinese artwork exists), Reading Lab card, ЭЕШ subjects, `/programs` total with JLPT/HSK links, `/workspace/plans` (IELTS 12, five subjects, JLPT/HSK note), register and meta description; phones get content-sized launch links.
  `npm run check -- ui core` passed (199 unit tests, build), then `-- ui` again after the phone CSS; card counts in `homepage_polish_smoke.py` and `browser_smoke.py` changed 4→5 and labs 3→4 on purpose. Spot-checked `/`, `/programs`, `/workspace/plans` on a local 3006 build at 1440/700/390/320 by measurement (no overflow). Reported, not done: no free sample before purchase, no terms/privacy/contact pages, no scaled SAT/IELTS scores, 12-character password, demo accounts above the sign-in form. Owner then authorized the commit and push: `npm run check:push -- ui` passed first. Hosted result is in the closing report.
- **2026-11-11 · Agent: Claude Code (Claude Opus 5.5), git/npm/gh · Owner-authorized full-tree commit, push and production deploy.** Committed 1,581 files as `a76c266` (HSK 1, Biology/Chemistry ЭЕШ, IELTS 07–12, vocabulary decks + migration `20261111090000`, Speaking Lab examiner/partners). Owner had the 3001 `next dev` stopped for the checks (3005 was already down). `npm run check:all` passed after updating stale `/exams` counts in five suites (4→5 cards, HSK added). Vercel status success; live `/`, `/exams` (5 cards incl. HSK), `/exams/hsk`, `/exams/eesh`, `/exams/ielts`, `/login` 200, `/api/health` database ok.
  2026-11-12, owner-approved: `hosted_demo_smoke` passed on the live site (five demo sign-ins, admin/name/password denial, logout, 320 px) after scoping its logout click to `.profile-heading` (the Workspace sidebar adds a second "Гарах"). Not run: real AI provider calls.
  Owner-approved read-only load test (anonymous GETs only, no sign-ups or writes; ad-hoc script, not `load-test.mjs`, which would send real verification mail on hosted): 150 visitors over 3.5 min, 8,108 requests at 38/s, 0 errors, p50 148 ms, p95 207 ms, health `databaseMs` p95 22 ms. Signed-in sittings/autosave untested at load (needs staging with mail off).
- **2026-11-11 · Agent: Claude Code (Claude Fable 5.2), npm/Playwright/in-app browser · Selectable mock examiner; Ava/Bella voice check.** Owner reported that IELTS mocks only showed George and that Ava and Bella sounded different locally. The examiner is now any of the six partners (George default): picker on the IELTS start page, the in-stage invitation, the practice offer and a "Шалгагч солих" link in the stage; `voice` is validated server-side, and the report prompt no longer names the examiner (PROJECT "AI examiner in the IELTS mocks"). Voices: with the owner signed in on the live site, the hosted and local voice routes returned identical audio for Ava, Bella and George (same sample counts, pitch, loudness), so the natural voices are unchanged. The Lab refuses its voice route while a timed mock is open and then used the device voice with no message on the setup screen; the notice now shows there and gives the server's reason.
  `npm run check` passed (189 unit tests; two source-shape assertions updated for the new `voice` field, new cases added). Playwright on the running 3001 `next dev` (not restarted), two local QA accounts and one simulated purchase: practice voice route per examiner (greeting name and pitch), 400 for unknown voices and extra keys, start-page picker, practice offer, a live stage as Bella then Lewis, 390 width, refusal notice with a simulated 403; no page errors. Not run: browser suites or a build, a timed mock sitting with a non-George examiner (same route code as practice), whether an open mock was the owner's actual cause. No commit or push.
