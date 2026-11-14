# EducationPlatform — Operations

Current state, delivery rules and next actions. Stable facts: [PROJECT.md](./PROJECT.md). Keep under 150 lines. Full log to 2026-11-05 (sections 1–55): `git show 2928af3:docs/OPERATIONS.md`; read only for old evidence.
## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform`. Never reuse LawTest's remote.
  The repository is **public** (observed 2026-11-05); the owner chose to make it private in GitHub settings.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region
  `sin1`. A push to the branch deploys to production. Latest pushed code: `d67a969` (2026-11-13, mock exam fixes `c9dfa44`, AI chat and Reading Lab on the account, streak, homepage; see Recent); previous deploy `26252b9` (my-exams on the account + free mocks).
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
3. Three plans since 2026-11-13: confirm ЭЕШ ₮40,000 and Гадаад хэл ₮60,000 (3,000 AI credits, carried over from IELTS), and that the ЭЕШ plan keeps a 100-word bank and 5 saved exams. Listen to the free mocks' audio (HSK free item 1 was misheard by Whisper) and decide whether the paid JLPT N4 audio, which likely reads 何を as なんを in about 15 items, should be regenerated.
4. Complete one real Google sign-in with an owner-controlled account. Only the authorization start has been verified.
5. Buy a sender domain if wanted, then switch to Resend (section 5).
6. Listen to one Speaking Lab partner on the hosted site from a phone with a real microphone (hosted speech passed an automatic live check on 2026-11-12; nobody has heard it). The DeepInfra key was pasted into a chat; consider replacing it in Vercel and `.env.local` with a fresh one.

For agents:
- Not verified on the hosted site: signed-in dashboard and admin, or a real sitting with the new questions. Demo sign-in,
  profile and server-side denials passed `tests/hosted_demo_smoke.py` on 2026-11-13 after the `d67a969` deploy; rerun it after a deploy only with owner approval.
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
| `mocks` | added SAT/IELTS forms, Гадаад хэл picks | `additional_exams` |
| `free` | free half-length mocks: hub tiles (none on the library), free access, their audio route | `free_mocks` |
| `jlpt` | JLPT catalogue, timed mocks, Japanese audio and practice | `jlpt` |
| `hsk` | HSK catalogue, picture tasks, Mandarin audio, practice, `/exams` grid | `hsk` |
| `practice` | practice mode, its assistant, sitting tools | `exam_practice` |
| `admin` | admin, content publishing | `admin`, `publishing` |
| `billing` | plans, prices, checkout, access, picks, retired plans | `payments`, `subscriptions` |
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
- **2026-11-15 · Agent: Claude Code (Claude Fable 5.2, second session), npm/Node/Playwright · More questions, a half-price retry and a whole-page processing screen (owner requests; the owner chose each figure).** Exam from a file: 5–40 questions (was 20; above 20 it is two parallel replies of 20, 40 = 80 credits). Reading Lab: the student picks 8–24 questions (was a fixed 12; top price 17). Retry ("Шинэ асуулт"): new questions from the same material at half price (`exam-retry` 5–40, `reading-retry` 2–8), replacing the old ones in place; the server prices and runs it only for the student's own row, from the text now kept with an exam (`MyExam.sourceText`…, additive migration `20261115100000_my_exam_source`, applied locally; Vercel applies it on deploy) or the passage a practice already stores; photo, moved and older exams have none. `ProcessingOverlay` blocks the whole page while either is generated, and (owner decision) while the vocabulary file scan runs, and always gives it back. Details: PROJECT section 7.
  `npm run check -- vocabulary myexams` passed (287 unit tests, build, `vocabulary` suite unchanged, `my_exams` suite with new retry and processing-screen steps). A stubbed-provider run of the real services on the local database passed (40 questions in two calls, retries, refund, 409 without kept text). Owner-approved live DeepSeek check on a QA account: exam 40 in 12 s, its retry 12 s (39 delivered), Reading 24 asked/22 delivered in 18 s, its retry 16 s; real cost $0.004–0.008 each. Both pages and the vocabulary scan checked by script on `next dev` 3005 (themes, 390/320; on the scan a 503 and a success both leave its modal open). Not run: any other browser group, a hosted check; Reading Lab has no browser suite. The build replaced `.next`: restart 3001 (and 3005 if it misbehaves). Found, not fixed: live exam keys lean to option B (13/21/5/1 of 40); the Reading Lab library scrolls sideways at 320 px when a practice is saved (both older than this work). No commit or push.
- **2026-11-15 · Agent: Claude Code (Claude Fable 5.2), npm, `frontend-design` plugin · New layouts for Vocabulary and Exams (owner request; owner chose each from wireframes).** A first restyle (ruled strips, serif titles) was rejected and restored byte for byte. Vocabulary is now "study first", which the owner approved: a card for the most urgent due or new word leads the page (`study-card.tsx`: show the meaning, then Мэдээгүй/Мэдсэн, or skip; each grade goes through the existing `/review` route), the figures are one column beside it, decks are a row of tabs, the list runs in two compact columns. `/exams` is one full-width row per programme (name and summary, the parts of a sitting, price and button) instead of the three-column cards; the uppercase kickers are gone. No server code changed.
  Revert: `artifacts/design-backup-2026-11-15/restore.ps1` (Vocabulary) and `restore-exams.ps1` (Exams). `npm run check` passed (278 unit tests); on `next dev` 3005 the card's flip, good, skip and miss updated the figures, `/exams` kept its five `.exam-card` rows and prices, and neither page scrolls sideways at 1440, 1024, 375 or 320. One test change: `hsk_smoke` expects one column at every width. Not run: any browser suite or a build (3001 still serves the old pages); `vocabulary_smoke` cannot pass on `next dev`, where StrictMode makes `modal.tsx` close itself. No commit or push.
- **2026-11-15 · Agent: Claude Code (Claude Opus 5.5), npm/Playwright · Vocabulary modals (owner request).** The file scan (with its review list), the permanent bank-space purchase and every delete now open as modals (`src/modules/vocabulary/modal.tsx`, `<dialog>.showModal()`: inert page, focus kept inside, Escape/backdrop close except while busy, page scroll locked) instead of inline panels, `window.confirm` or the inline deck strip; word, selected-words, progress-reset, deck and scan-discard confirmations share one confirm modal. Follow-up: the add-word form is a modal too and shows the last saved word inside it.
  `npm run check -- vocabulary` passed after each step (suite cancels, Escapes and confirms the delete modal, closes the scan and add modals); rebuilt and restarted 3001; checked the modals by script in both themes. No commit or push.
- **2026-11-15 · Agent: Claude Code (Claude Opus 5.5), npm/Playwright · Owner colour pass 2 ("too much colors on some pages").** A computed-style scan of 27 routes in both themes found leftover decorative hues; Home and Workshop card tones, score rings, the rail avatar and plan badge, Speaking lab accent and partner marks (now told apart by bar shape only), Vocabulary level bars and spread, My exams score/topics, Reading lab topics, AI tutor/coach avatars, workshop tile art, the public sketch backdrop and programme labels now use `--blue`. Kept: logo, yellow credits, answer status (correct/wrong/unanswered/flag/review), live dot, warn pills.
  `npm run check -- ui vocabulary myexams writing` passed; rebuilt and restarted 3001; rescan clean. Restarted the local PGlite after a stray `curl` to its port wedged it (no data change). Not run: hand-inspected 390/320 screenshots (app window hidden). No commit or push.
- **2026-11-14 · Agent: Claude Code (Claude Opus 5.5) with one subagent for SAT, npm/Playwright · Owner UI pass 2.** Daily streak removed (rail row, Home card, `POST /api/workspace/streak`, `streak.ts`/`streak-client.tsx`; `StudyDay` table kept, no migration); SAT Mocks 07–09 added (three new reading context rows, same parametric Math; 02–06 unchanged byte for byte); JLPT/HSK practice and timed listening use the IELTS-style player (practice plays only the question's slice); one accent colour (`--blue`) on exam cards, hubs, briefings, plans, programmes and the free tile (status green/red/orange and yellow credits kept); listening and keyboard hint lines and the JLPT/HSK hub footer notes removed; HSK practice is one narrow column with smaller pictures and no worked example. Follow-up: the admin credit-package help text no longer says "шар" (`npm run check` passed, 3001 rebuilt).
  `npm run check:all` passed (lint, typecheck, unit, build and every browser suite); rebuilt and restarted 3001. Not run: hand-inspected 390/320 screenshots. No commit or push.
- **2026-11-14 · Agent: Claude Code (Claude Opus 5.5), npm/Playwright · Owner UI fixes.** Purchased credits are labelled "Кредит" (no "шар") and have their own yellow rail row laid out like the AI credit row, shown at 0 too; plans page hint texts removed (header line, retired-plan line, credit and single-exam paragraphs, terms note) and comparison headers centred; free mocks are listed only as the first tile of each programme hub (the `/exams` strip is gone; the plans page link goes to `/exams`); ЭЕШ library card titled "ЭЕШ" with compact subject chips so it no longer stretches its row. Tests updated to match.
  `npm run check -- free billing vocabulary hsk entrance core` then `-- free vocabulary hsk entrance core` passed (279 unit tests, browser suites); rebuilt and restarted 3001; checked signed in at 1440. Not run: 390/320 screenshots inspected by hand. No commit or push.
- **2026-11-14 · Agent: Claude Code (Claude Sonnet 5.5), Python/Node, scratch files outside the repo · Read-only audit of the paid JLPT N4/N5 recordings (does 何を sound like なんを?).** Confirmed for N4: the released tracks say なんを/なんが in 17 items, 何時ですか as いつ, 何分 as なにぶん, and 2時/2階/2年/12人/一日/間に合う are garbled; 33 of the 84 N4 listening items contain a misread line (8 with a wrong word or number). N5 is clean. Nothing was regenerated or changed.
  Evidence: all 824 spoken lines are in the paid-run cache and rebuild the 24 MP3s exactly (lengths, item timings); re-synthesis with the repo's pipeline is bit-identical; whisper-small likelihood separates all 44 flagged lines from corrected controls (9 correctly read 何 lines pass). Recommended: an N4 recording revision chosen per attempt like IELTS `audioRevision` (owner decides). Not run: repo checks (nothing changed), a person listening, a look at hosted `PublishedContent`.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5) with three Claude Opus 5.5 subagents (two pack reviews, audio), Python/Node/Playwright/Kokoro · Three plans, yellow credits, free mocks on the site.** Owner request. Plans are now free, ЭЕШ (every ЭЕШ mock) and Гадаад хэл (15 picked non-ЭЕШ mocks per plan month; sittings and practice only on picks; workshops); the IELTS/SAT plans are retired but honoured until they end. One server rule (`subscriptions/mock-access.ts`); additive migrations `20261113190000_mock_picks_and_vocabulary_space` and `20261113200000_language_plan_program` (the old `program` CHECK refused `language`), applied locally, Vercel applies them on deploy. Purchased credits show apart as yellow and buy permanent bank space (200 per 100 words). The ten free mocks were reviewed (no wrong key; ambiguous items and wording fixed), built into `assets/free-mocks` with 14 Kokoro tracks on `/audio/free`. Review fixes: hard-coded ₮60,000 plan link, practice offered where the API refused it, fixed 40-item/×5/90-minute copy. Details: PROJECT sections 2–4 and 7.
  `npm run check:all` passed (279 unit tests, build, 20 browser suites incl. the new `free` group; the local database was restarted once after a known PGlite drop); a later rail/vocabulary layout fix passed `npm run check -- core vocabulary billing ui`. One test change: two IELTS image checks now wait for the lazy image to load (a timing race, not a behaviour change). Not run: hosted check; nobody has listened to the new audio (Whisper misheard HSK free item 1). Paid JLPT N4 audio likely says なんを for 何を (unverified, untouched). No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), git/npm/gh · Owner-authorized push and deploy of all uncommitted work.** Owner chose `check:all` first and approved removing the eight stale server rows from the board (nothing was listening on 3001/3005/3006); the local database was started for the suites and stopped afterwards. `npm run check:all` passed (268 unit tests, build, all 19 browser suites). Commits `c9dfa44` (mock exam fixes, 3,321 files) and `d67a969` (AI chat and Reading Lab on the account, study plan and streak, homepage, docs; four additive migrations), pushed `26252b9..d67a969`; Vercel reported success at 14:59 UTC, and its build stops if `migrate deploy` fails, so the migrations are applied. Live: `/api/health` ok with the database; `/`, `/exams/eesh` and `/login` 200, `/workspace` 307; changed figures, a cover and a demo byte-identical to the commit; a deleted figure 404; the new chat and streak routes 401/405 signed out. Then, owner-approved, `hosted_demo_smoke` passed (five shared demo sign-ins, profile identity, admin, name and password denials, sign-out; login page at 1440 and 320). Not run: a signed-in look at the new chat and Reading Lab storage or a sitting. This entry is not yet committed.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Node · Typed numeric answers read powers of ten.** Owner approved, after the Part II work. `numeric()` in `engine.ts` now also reads `3.2·10⁻¹³`, `3.2*10^-13`, `3.2 × 10^(−13)` and `10⁻¹⁴` for numeric answers (before, a ЭЕШ Physics 2.3b force typed the way the key prints it scored 0; only `3.2e-13` or the full decimal did); a sign before 10 and a `^` or superscript are required, and the math matcher is unchanged, so `exactForm` tasks still reject `100000` for `10⁵`.
  A scan of all 221 exams (3,750 typed questions) against the previous engine: no key grades differently and no math result changed; the 60 Physics 2.3b keys are the only ones printed as powers of ten. `npm run check` passed (267 unit tests; new case in `tests/mock-fixes.test.mjs`, 2.3b checked in all 60 papers). Not run: browser suites, a sitting in a browser. Old reports regrade with it. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Python/Node/Playwright · ЭЕШ Physics Part II repetition (MOCK_REVIEW H4 follow-up).** Tasks 2.1–2.4 each have 30 scenarios (the five earlier ones and 25 new; one earlier gas scenario moved off a prompt it shared) taken in their own fixed paper order (`slot` 47–50) instead of `rng.choice`; keys are worked in exact fractions and the generator stops on a scenario that breaks a task rule. Distinct Part II task texts 19 → 120, each in two papers (was up to 28); all 2,760 Part I items unchanged. Then, owner-approved via the mock fix session: 2.2[a] (highest pressure) was 3 in every paper; 1–2 is now a straight line (isobaric in ten scenarios) then an isochor, so states 1, 2 and 3 are the answer in 20 papers each and 2.2d is the area under the line; step 3 of the 2.2 explanations now gives V3 = V2 and reads p3 off the graph instead of "isochoric, so p3 = …"; Part I, 2.1, 2.3, 2.4, every key, prompt and figure and the entrance catalogue are byte-identical to the build before. Generator, validator, entrance build (0 problems), SVG trim, `node --test tests/mock-fixes.test.mjs tests/entrance-mocks.test.mjs tests/exams.test.mjs` (Part II cases; a constant 2.2[a] now fails) and `npm run check` (268 unit tests) passed; all 240 Part II keys re-derived from the printed text and figures by an independent script (0 mismatches), 16 new scenarios hand-checked, eight new figures rendered and inspected. Not run: production build, browser suites, the exam pages in a browser. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Python/Node/Playwright · ЭЕШ Physics and Biology item reuse (MOCK_REVIEW H4).** Mock-review follow-up. Physics Part I questions each draw from their own pool of versions (≥20, most numeric ones 60) in a fixed per-question order of the 60 papers; Biology templates filling four or more slots follow their own slot counter (`item_k`). No choice item (prompt + key) is now in more than three papers: Physics 394 → 2,446 distinct of 2,760, Biology 442 → 785 of 1,038 (details and the review's measure in MOCK_REVIEW H4). Also fixed: Physics Q44 options had become 8, 16, 0.67 (now the labels 1–5), Q3 drew negative velocity off the canvas, several figures now match their prompts; Biology matching keys use all six orders.
  Both pack validators, the entrance build (0 problems), the SVG trim and `node --test tests/mock-fixes.test.mjs tests/entrance-mocks.test.mjs` (new H4 case) passed; `npm run check` passed (265 unit tests). 2,292 Physics keys re-derived from the printed prompts by an independent script (0 mismatches); 46 Physics and 54 Biology keys hand-checked. Not run: production build, browser suites, the pages in a browser. Physics Part II tasks still repeat (five scenarios each). No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5) with eight Claude Opus 5.5 subagents, Python/Node · ЭЕШ English explanations, then the doubtful keys.** Mock-review follow-up (MOCK_REVIEW Medium): each of the 2,665 English items explains its key in Mongolian (rule, collocation or the quoted deciding sentence), kept in `MockExmps/English/_source/explanations/` and merged by `_source/build.py`; `build-entrance-mocks.mjs` fails an English item without one. Then, owner-approved: the writers' 17 doubtful keys and 3 wording notes fixed (22 items and one passage sentence, listed in MOCK_REVIEW), the explanations marked `lang="mn"` in results and practice, English no longer exempt in two explanation tests. Rebuilt in a scratch root (shared catalogue untouched); nothing else in the papers changed.
  `npm run check` passed (268 unit tests; new `tests/english-explanations.test.mjs`); 105 explanations hand-checked. Not run: build, browser suites (the 3001 servers hold the local database), a look in a browser (needs a sign-in); teacher review pending. No commit or push.
- **2026-11-13 · Agent: Claude Code (Claude Opus 5.5), Python/SymPy/Node · Mock exam review, then fixes.** Owner request: review all mocks, then fix critical first and the rest; findings and fix status in [MOCK_REVIEW.md](./MOCK_REVIEW.md). Grading: choices keep their case (Biology 2026 Q38), typed Mathematics is compared by value (`math-value.ts`; `exactForm` for form tasks), Physics Part II keys are exact with roundings accepted and 2.3d asks for the coefficient of π, Biology digits round half up, 2015 M4 Q34 has one correct option. Content: generators fixed, then every ЭЕШ Mathematics, Physics, Biology and Chemistry paper regenerated and rebuilt (keys, distractor positions and lengths, syntax, spacing, case endings, notation); SAT 02–06 Module 2 has its own items; SAT Mock 01 distractors rewritten; English nested markup; IELTS 02–06 TRUE/FALSE/NOT GIVEN explanations quote the passage. `npm run check` passed (262 unit tests; new `tests/mock-fixes.test.mjs`). Done afterwards by follow-up sessions (their own entries): ЭЕШ English explanations and keys, Physics/Biology item reuse, Physics Part II scenarios and 2.2a, power-of-ten numeric answers; combined tree re-checked (`npm run check`, 268 unit tests). Open: teacher review (Physics Q39, new Mongolian content). Not run: build, browser suites, the pages in a browser, hosted check; a published admin edit still overrides an exam, and old reports regrade. No commit or push.
