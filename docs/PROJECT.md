# EducationPlatform — Project Guide

Consolidated 2026-10-24 from `AGENTS.md`, `readme.md`, `rules.md`, `start.md` and `HANDOFF.md`.
This file is the stable "what and how" reference. Read [OPERATIONS.md](./OPERATIONS.md) first for the
current delivery state, checks, credentials and next actions.

## 1. What this is

EducationPlatform is an independent Mongolian exam-preparation web application. It started with SAT
Mathematics and now covers SAT, IELTS Academic, JLPT N5/N4 and university entrance exams. Practice exercises were
removed on 2026-11-05 and the official ЭЕШ papers on 2026-11-06; students prepare through full mocks and workshops. It is not
affiliated with the College Board, IELTS, or the Mongolian ЕШ; all practice content is original unless
an official source is explicitly labelled. LawTest/Lexlab is a separate service: this project only
links to <https://lexlab.site/plan> and must never read LawTest code or data.

Accounts, payments and email are still pilot-grade. Hosted payments are simulated. Google and email
authentication require provider configuration; see the actual hosted checkpoint in
[OPERATIONS.md](./OPERATIONS.md).

## 2. Product surface

| Area | What exists |
| --- | --- |
| IELTS workshops | Four focused workshops with saved work and grading |
| Full mocks | Six Digital SAT and six IELTS Academic mocks (01–06), with server-authoritative timers |
| JLPT | Three N5 and three N4 mocks, 456 original items, Japanese synthetic listening, timed sections and focused practice |
| ЭЕШ mocks | 155 imported practice papers: 55 Mathematics, 60 Physics and 40 English (2015–2026), on the site as University Prep |
| Practice mode | Untimed practice on every mock, with instant checks and a DeepSeek assistant |
| Accounts | Better Auth email/password, profile, Google OAuth, verification and password recovery |
| Plans and payments | Three monthly plans plus per-mock and per-paper simulated purchases |
| Admin | Protected overview, members, subscriptions, payments, monitoring, content and audits |
| AI tutor | DeepSeek math hints, explanations and mistake review |
| Speaking Lab | Isolated IELTS speaking studio at `/labs/ielts-speaking` |
| Essay Studio | Workshop writing practice with AI corrections at `/labs/ielts-writing` |
| Listening Lab | Two original IELTS Listening practice tests (Parts 1–4, mock-style recordings) at `/labs/ielts-listening` |
| Workspace | `/workspace`: the signed-in study app, separate from the marketing site, with left tabs for Home, AI chat, Flashcards, Exams, Review, Workshop and Plans, plus the profile (section 7) |
| Flashcards | Upload a PDF, Word, PowerPoint or text file and get AI study cards at `/workspace/flashcards`; decks stay in the browser |
| Exam from file | Upload a PDF, Word, PowerPoint or text file and get an AI multiple-choice exam at `/workspace/my-exams`; sittings, drafts and scores stay in the browser |
| Study tools | Light/dark theme and a browser-only mathematics scratchpad |

Workshops require the IELTS plan. Full mocks accept a matching plan or a prior per-exam purchase. Subscription-backed
sittings keep continuation and review access after expiry, but new starts remain gated. Existing
purchases and LEGACY grants are preserved.

The mathematics tutor is offered when reviewing a submitted SAT Math mock. Every mock also has
practice mode at `/exams/<slug>/practice`, with its own assistant (section 7).

### Removed: practice exercises

The owner removed practice sets, the free `/practice` sample and saved exercise attempts on 2026-11-05. Their
routes (`/exercises`, `/practice`, `/learn/attempts`, `/api/exercises`, `/api/practice`, `/api/attempts`), modules,
catalog data and `prisma/seed.ts` are deleted, and deploys no longer seed. `tests/exercises-removal.test.mjs` guards
against their return. Workshops, the Speaking Lab and the Essay Studio stay, in `src/modules/workshops`. Practice mode
(2026-11-06) is a different feature: it opens the existing mocks without a clock and adds no question bank.

The tables (`Attempt`, `AttemptItem`, `Exam`, `ExamItem`, `Question`, `QuestionVersion`, `Topic`, `Subject`, `Program`)
remain in the schema, unused, because a dropping migration would delete hosted data during the Vercel build.
`scripts/purge-exercises.mjs` previews, and with `--apply` permanently deletes, their rows and old exercise content
versions; hosted databases also need `--confirm-host=<hostname>`. Mocks, workshops, purchases, plans, accounts
and audit history are not touched. A later migration can drop the empty tables.

The `/exams` library has four categories: SAT, IELTS, ЭЕШ and JLPT. `/exams/sat` and `/exams/ielts` collect
their six mocks. `/exams/eesh` is the ЭЕШ hub: subject tabs (`?subject=math|physics|english`) and dense
year rows with five variants per year. The retired `/exams/eesh-math` route and the first four Mathematics
mocks (`eesh-math-01`–`04`) return 404; their files are kept unserved in `reference/retired-site-mocks/eesh-math/`.
Homepage and program links open the hub; individual mock briefings link back to their subject tab. Existing
saved attempts and purchases remain readable. The library itself uses four programme cards with a compact
index (counts, timings, included parts and direct entry); the ЭЕШ row links to the three subject tabs.
`/workspace/plans` (moved from `/plans`, which redirects) is a comparison-first pricing page inside the Workspace that guests
can read: three plan cards, a feature table, the per-mock option and month terms. Both pages use scoped CSS
(`src/app/exams/library.css`, `src/app/workspace/plans/plans.css`).
Collection URLs cannot be purchased or started as exams. The library, collections, hubs, briefings, timed sittings
(`/exams/attempts/*`), results and practice (`/exams/*/practice`) all render inside the Workspace shell
(`src/app/exams/layout.tsx`); the exam clock stays below the Workspace toolbar on phones.

## 3. Assessments

### Digital SAT

- Mocks `sat-full-01` through `sat-full-06` are separately purchasable; an active SAT plan
  includes all six. Mocks 02–06 use original parallel practice forms with different contexts and
  numerical values, and separate first/lower/higher question banks (147 authored items per form,
  98 delivered per sitting). Shared question patterns are intentional; these are not calibrated
  College Board forms or independent official papers. Mock 01 and existing snapshots are preserved.
- 98 delivered questions: 54 Reading and Writing in two 32-minute modules, a 10-minute break, then
  44 Math in two 35-minute modules.
- Operational raw counts are 50 Reading/Writing and 40 Math. Routing assumes 65% accuracy; each
  module includes two pretest questions.
- Math includes multiple-choice and numerical-response items.
- Results are raw scores. There is no 200–800 scaled score.

### IELTS Academic

- Mocks `ielts-academic-01` through `ielts-academic-06` are separately purchasable; an active
  IELTS plan includes all six. Mocks 02–06 each have four matching synthetic recordings, three
  original fictional case-study passages (about 2,200 words total), a distinct data table and essay,
  and a distinct speaking interview, cue card and discussion. They share practice task patterns;
  specialist content and pedagogical review remain pending.
- Listening: 40 questions in about 30 minutes, plus 2 minutes checking, using four bundled synthetic
  recordings.
- Reading: 40 questions over three passages (2,265 words) in 60 minutes.
- Writing: two tasks in 60 minutes.
- Speaking: a 12-minute simulation.
- No IELTS band score is calculated.
- Authenticated audio serving resolves the exact mock slug to its own allowlisted recording files.
  All 24 recordings are included in the production function trace. New audio provenance, script
  hashes, file hashes and durations live in `assets/exams/manifest.json` and `manifest-02.json` through
  `manifest-06.json`. `scripts/generate-ielts-audio.py` (setup in its header) regenerates them with local
  Kokoro-82M neural voices (Apache-2.0) at one natural pace, with 20/15/15 s reading/checking pauses.
  Parts play back to back from their recorded lengths (`listeningSeconds` in `audio-files.ts`, which
  must be updated after regenerating); the 30-minute stage leaves checking time after the last part.

### JLPT N5 and N4

- `/exams/jlpt?level=N5|N4` lists three forms per level, purchased access, saved practice progress and open attempts.
- `jlpt-n5-01`–`03`: 21 vocabulary / 20 min, 22 grammar-reading / 40 min, 24 listening / 30 min.
  `jlpt-n4-01`–`03`: 28 / 25 min, 29 / 55 min, 28 / 35 min. Server deadlines and attempt snapshots use the existing exam engine.
- `scripts/build-jlpt-mocks.mjs` converts offline `MockExmps/JLPT` source into six private `assets/jlpt` definitions and an answer-free catalogue. Authoring packs and official format reference images stay excluded from deployment.
- `scripts/generate-jlpt-audio.py` uses local Kokoro-82M Japanese voices (Apache-2.0) and Misaki Japanese G2P. The 24 MP3s in `assets/exams/jlpt-*-part-*.mp3` have script/file hashes, measured durations and per-item timings; protected mock/practice audio routes apply the existing access and active-sitting checks.
- Timed listening follows the server clock, with no pause/replay; practice can replay one item and reveals its transcript only after checking. Written questions keep shared passages together, use numbered options and support optional authored furigana. Result skill links open focused practice.
- Per-mock access uses the existing simulated ₮10,000 purchase. No JLPT monthly plan or cross-program access is added. Raw scores only; no 180-point conversion or pass/fail claim.
- All questions are original drafts awaiting Japanese-teacher review. Situational text replaces illustrations. Synthetic tracks are shorter than the official listening window; remaining time is answer checking. Native-speaker listening review and learner calibration remain pending.

### ЭЕШ mocks (University Prep)

- 155 imported papers live on the site, all with program `entrance`:
  - `eesh-math-<year>-m1`–`m5`: 55 Mathematics forms for 2015–2026 (2020 excluded).
  - `eesh-physics-<year>-p1`–`p5`: 60 Physics forms for 2015–2026.
  - `eesh-english-<year>-e1`–`e5`: 40 English forms for 2018–2020 and 2022–2026.
- Source and build: the offline authoring packs stay in `MockExmps/` (never served or deployed).
  `node scripts/build-entrance-mocks.mjs` converts them into `assets/entrance-mocks/<subject>/<slug>.json`
  (server-side content with answers) and `public/exam-assets/eesh/<subject>/<slug>/*.svg` (2825 diagrams).
  It also writes the client-safe catalogue in `src/modules/exams/entrance/catalog.json` and
  `catalog-data.ts`. `next.config.ts` traces the content JSON for every server route. Rebuilding is
  deterministic; rerun it after editing `MockExmps`.
- `src/modules/exams/entrance/content.ts` loads a paper on demand (one `readFileSync`, cached).
  `findExam()` resolves it lazily; SAT/IELTS definitions stay in memory. `getExam()` still applies
  published content versions and admin edits.
- Format: Mathematics has 36 A–E questions plus four multi-part constructed tasks; Physics has 46 A–E
  questions plus four constructed tasks; English has Part I (grammar, vocabulary, communication,
  reading) plus Part II matching/cloze tasks. Each paper is 100 points. Mathematics and Physics are
  100 minutes and have no calculator; English follows the 80-minute house timing (the 2022–2026 papers
  print no duration). Physics uses g = 10 m/s².
- Marks: each question carries its printed points. Mathematics task points (7 each) are split over
  their parts with integer largest-remainder weights. Typed Mathematics answers accept Unicode or
  ASCII signs, comma or semicolon intervals, equivalent fractions/decimals and scientific notation;
  symbolic expressions are compared after normalisation. Physics constructed answers are numeric
  where possible, with a text matcher for the one direction answer.
- Presentation: the ЭЕШ sitting is the compact `entrance/session.tsx` workspace, not the retired paper
  booklet. It has one page per multiple-choice item, one page per constructed task or Part II task,
  a slide-over answer sheet grouped by printed section, a per-question flag, a collapsible scratchpad
  for Mathematics and Physics, and a side passage pane for English reading. Stored SVG diagrams render
  as images, so their internal styles never leak into the page. KaTeX typesets short pure formulas and
  all Mathematics options; longer Mongolian prose stays as text.
- English listening: the 2018 and 2019 writing packs include a script but no recording. Those papers
  show the script as a labelled text panel (“бичлэг оруулаагүй”). No fabricated audio is served.
- Results: 100-point total, per-domain points and correct counts, a wrong/blank/correct filter and a
  review that repeats the shared task text, figure, reading or listening material. Review answers and
  explanations come from the paper snapshot, never from current definitions.
- Access is ₮10,000 per paper or the University Prep plan; the server checks it on start, read, save,
  check, audio and AI paths. Practice mode, the admin question fixer and versioned publishing work.
- `tests/entrance-mocks.test.mjs` checks all 155 papers: 5 forms per year, unique IDs, five options,
  answer membership, answer spread, 100-point totals, diagram files, typed-answer equivalence and a
  full 100-mark report. `tests/entrance_mocks_smoke.py` covers the hub, access, a bought Mathematics
  paper, University Prep, the reading/Part II layouts and mobile widths.
- Provenance: 2015–2021 Mathematics/Physics references are official or clearly labelled annotated
  editions; 2022–2026 Mathematics and English references are third-party copies/transcriptions,
  not official БҮТ files. Every paper says it is practice content, and explanations are the site's own.
  Teacher review and student-based difficulty calibration remain pending.

### Withdrawn: official ЭЕШ papers

The owner withdrew the 2020 Mathematics A–D and the 37 English papers on 2026-11-06. The 2018 and 2019 pages print a БҮТ
notice prohibiting copying and distribution, and no permission is on record. Their routes (`/exams/eec-*`, `/papers/attempts`,
`/api/paper-attempts`), the `src/modules/papers` module and the served images are gone, and
`tests/official-papers-removal.test.mjs` guards against their return. Page images, PDFs, keys, layouts, provenance and the 2020
Mathematics transcription are kept in `reference/official-papers/` only as a format guide (see its README). They are never
served, compiled or deployed (`.vercelignore`) and must never be copied into mocks. `PaperAttempt` rows and per-paper
purchases stay in the database untouched; students no longer see them, and admin lists them as withdrawn.

### Removed: 2026 Dornod regional practice exams

The owner removed both Dornod Online Test 4 papers completely on 2026-10-29: their routes, catalog
entries, layouts, keys, original PDFs and bundled images are deleted, and `tests/dornod-removal.test.mjs`
guards against their return. Local attempts, purchases and content rows were deleted with the guarded
`scripts/purge-dornod.mjs` (dry run by default, `--apply` to delete; local database only).

## 4. Pricing and access

| Item | Price | Access rule |
| --- | --- | --- |
| University Prep | 40,000 MNT/month | All 155 ЭЕШ Mathematics, Physics and English papers |
| IELTS | 60,000 MNT/month | IELTS mocks and workshops |
| SAT | 60,000 MNT/month | SAT mocks |
| Full SAT, IELTS or ЭЕШ mock | 10,000 MNT each | Per-exam purchase, including retakes, or a matching plan |

Monthly plan prices above are the defaults; admins can change them in `/admin?tab=pricing`.

Local checkout is explicitly simulated: no real money, card details or payment provider. Hosted
payments are also simulated under `HOSTED_MOCK_PAYMENTS`. A matching active plan or a prior
per-exam/per-paper purchase is checked server-side on every new start, read, edit, audio, recording
and grading path. Never grant global paid access.

## 5. Accounts, authentication and email

### Modes and gates

- **Local pilot:** loopback host plus `AUTH_LOCAL_PILOT=true`.
- **Hosted pilot:** clean HTTPS host plus `AUTH_HOSTED_PILOT=true` and a canonical `BETTER_AUTH_URL`.
- Separate opt-ins: `HOSTED_MOCK_PAYMENTS`, `SPEAKING_LAB_ENABLED`, `AUTH_HOSTED_DEMO_ACCOUNTS`.
- Sessions last 7 days and refresh after 1 day. Better Auth cookies use the `education-platform` prefix.

### Google OAuth

Google is enabled only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are present and the
app is in a local or hosted pilot. A Google sign-in requires a verified Google email; an unverified
local account with the same address is not silently linked. Existing verified email/password accounts
link automatically when Google returns the same verified address. For an unverified account, sign in
with its password, then use **Profile → Google холбох**, or verify the local email before trying Google
again. Explicit linking requires the same verified Google email, preserves the existing user and
password, and is unavailable to hosted shared demo users. Unverified Google claims are rejected
server-side on sign-in and linking, including for already verified local users.

Redirect URIs:

- `http://localhost:3001/api/auth/callback/google`
- `https://education-platform-seven-neon.vercel.app/api/auth/callback/google`

### Email delivery and verification

| Environment | Transport | Required settings |
| --- | --- | --- |
| Local QA recovery | Loopback outbox | `AUTH_EMAIL_TEST_MODE=true`; writes JSONL under `artifacts/auth-outbox` |
| Local development | Gmail SMTP | `GMAIL_USER` plus a 16-character `GMAIL_APP_PASSWORD` |
| Hosted pilot (owner opt-in) | Gmail SMTP | `AUTH_HOSTED_GMAIL=true`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` |
| Hosted | Resend HTTPS API | `RESEND_API_KEY` plus a verified `AUTH_EMAIL_FROM` |

Precedence is outbox, then Gmail, then Resend. Gmail is local by default; hosted pilot additionally requires the explicit
`AUTH_HOSTED_GMAIL=true` opt-in. Reserved `.invalid` QA addresses never receive Gmail or Resend mail; the
loopback outbox still records them. When a hosted sender is configured, email verification is
enforced automatically for every non-demo account. Locally, set
`AUTH_REQUIRE_EMAIL_VERIFICATION=true` to enforce it.

The login form uses an accessible Google-logo button and omits the email divider, explanatory
footer and direct verification links. Profile retains its verification control. Registration and
blocked unverified sign-ins still use the required verification flow before a session is accepted.

Verification links expire after 1 hour. Password-reset links expire after 15 minutes, are one-use,
and revoke existing sessions when used. Unverified users cannot create a session or call protected
APIs. Google accounts must arrive with a verified email.

### Demo accounts

Exactly five local and hosted pilot accounts are exempt from email verification:

`qa-demo-01@example.invalid` through `qa-demo-05@example.invalid`.

They are deliberate public test data. They are never emailed, never become administrators, and
cannot change shared profile data or passwords. Locally, `qa-demo-01` is the provisioned admin;
`qa-demo-02` through `qa-demo-05` remain learners. `npm run demo:accounts` provisions them through
the guarded local auth API without resetting existing accounts. Hosted demo access is additionally
gated by `AUTH_HOSTED_DEMO_ACCOUNTS=true`.

## 6. Content, admin and reporting

- `/admin` is protected and offers an overview (with an attention row and section directory), users,
  attempts (mocks / withdrawn official papers), subscriptions, payments (plan orders / single-exam
  purchases), prices, content, audit history, CSV exports and a system status page (`tab=settings`,
  labelled "Систем"). Its sidebar groups these by purpose and each section states what it is for. Every
  list has search, filters and numbered pagination with totals (20 rows per page).
- `/admin/users/[id]` is the user record: account facts, sign-in methods, totals paid, active plans,
  IP addresses and other accounts seen on the same IP, admin notes, and paginated activity
  (sign-ups, sign-ins with IP/device, password changes), payments, attempts, live sessions and admin
  history. Actions: note, grant/extend or expire a month, sign out everywhere, suspend/unsuspend.
- Suspension (`User.suspendedAt`) is admin-only (`input:false`), signs the user out, is refused at
  session creation (`ACCOUNT_SUSPENDED`) and by `getSession`/`apiUser`. Admins and the acting admin
  cannot be suspended. `UserEvent` keeps the durable activity record because sessions are deleted on
  sign-out; logging never blocks sign-in. Activity starts from the 2026-10-30 migration.
- Monthly plan prices are editable in the Prices tab (`PlanPrice`, ₮1,000–₮1,000,000 in steps of
  ₮100, reason required, audited). New and unpaid orders use the current price; paid orders keep their
  amount. Missing rows fall back to `subscriptions/plans.ts`. The single-mock price stays ₮10,000 in
  code.
- Wrong answers and typos are fixed per question on `/admin/content/[key]` (searchable, paginated
  list; prompt, passage, options, answer key, explanation). Each fix is validated with the same shape
  and answer-key rules and published immediately as a new version by one admin (owner decision
  2026-10-30); it is blocked while an unpublished draft exists. Earlier attempts keep their version.
  The ЭЕШ mocks are fixed the same way; withdrawn official papers have no admin page.
- Existing catalog items are edited through `ContentDraft` → optional review → immutable `PublishedContent`.
  Runtime definitions must be read through `src/modules/content/published.ts`; never bypass version
  resolution in grading or new attempts.
- Exact-version stateless grading preserves prior results. Cross-version saved-attempt resume must
  keep the original attempt's content snapshot.
- Standards, IDs, types, counts, timers and media references stay fixed during editing. Creating new
  catalog items and replacing media remain unfinished.
- Default reports and exports exclude known reserved test domains and MOCK/LEGACY revenue. The
  explicit test view preserves test workflows. CSV exports return at most the latest 1,000 rows.
- Audit history contains actual actions across operational and test scopes.

## 7. AI, Speaking Lab and study tools

### Practice mode and its assistant

- `/exams/<slug>/practice` opens any of the 167 mocks without a clock. Access is the same as the timed
  exam (matching plan or per-exam purchase), checked on every read, save, check, audio and AI request. The owner asked for this
  on 2026-11-06.
- SAT practice covers all 147 authored items, both Module 2 routes included. IELTS has replayable audio, the part's transcript
  after a check, both Writing tasks and all Speaking prompts; recordings are not stored here. ЭЕШ Mathematics and Physics
  have Mongolian prompts, the scratchpad and the imported paper's section structure; ЭЕШ English shows its conversation,
  word bank or reading passage beside the question and keeps the printed Part II choices.
- One `PracticeSession` per student and exam (`responses`, `flags`, `results`), created on the first save. It is not an attempt:
  it never appears in exam history, reports or admin scores. **Дахин эхлэх** deletes only that row.
- Answers, explanations, keys and transcripts stay on the server (`exam-practice/form.ts`) until the student checks that question.
  The first check is recorded and the answer locks until the student retries it. Writing and speaking stay editable.
- While the student has an open timed sitting, on any exam, practice pages, answers, audio and AI are all refused
  (`exams/active-sitting.ts`, also used by the tutor). Sittings whose deadline passed while closed are settled first and do not block.
- Assistant: `POST /api/exam-practice/<slug>/assistant`, 60 requests per student per Ulaanbaatar day with one in flight, sharing the
  tutor's provider code. The page sends only the question id and the student's words; the server adds the question, the saved
  answer and, only after a check, the key, explanation and transcript. Before a check the prompt forbids stating or confirming the answer.
- Limits: ЭЕШ answers and explanations are this site's own, not an official key, and the prompt says so; for Mathematics the
  model works without a calculator, for Physics it keeps units and g = 10 m/s², and it must say when it disagrees. It gives no IELTS bands.

### Timed sitting tools

SAT and IELTS keep the always-visible question strip, keyboard shortcuts (arrows, A–E or 1–5, F), option elimination,
passage text size and time notices. The ЭЕШ workspace is intentionally leaner: a stacked header with timer and
answer-sheet count, a slide-over sheet grouped by printed section, keyboard next/previous and A–E, a flag per item,
and a shared task page for constructed or Part II tasks. The booklet, bubble sheet and separate answer-sheet buttons
of the retired Mathematics design are gone. Polls and saves send `?have=<stageId>` so the server omits stage text the
page already holds. Results add per-skill totals, review filters and a link to practice.

### DeepSeek mathematics tutor

- Fixed endpoint `https://api.deepseek.com/chat/completions`; server-side `DEEPSEEK_API_KEY`.
- Available for completed SAT Math mock review, in Mongolian or English.
- Supports next-step hints, worked explanations, typed working, mistake review and one ungraded
  similar follow-up question.
- Each question has an **AI туслах** button. Clicking it slides a chat drawer in from the right
  (portalled to `<body>`, closes on ×, backdrop or Escape). Nothing renders or is sent on page load
  or on opening; a request is sent only when the student presses a suggestion chip or sends a message,
  and the composer states that the problem and the student's answer go to DeepSeek. The former
  consent checkbox and fine-print notes were removed at the owner's request (2026-10-29).
- Prompts contain only the relevant problem, options, selected answer, authorized reference
  explanation and at most four bounded prior turns. No account identity, cookies, scratchpad or full
  history is sent.
- 30 attempts per student per Ulaanbaatar day, a 90-second reservation lease, a 60-second provider
  timeout and a 3-second cooldown. Failed provider attempts count.
- Requests are denied while the same user has an active mock sitting. Timers,
  grading, answers and immutable results are untouched.
- Conversations are temporary page state and are not saved to the account. Answers are learning
  feedback, never official grading. ЭЕШ and IELTS mocks are outside this tutor; practice mode's assistant covers them.

### Workspace (2026-11-08)

- The owner asked for the dashboard, Workshop and exams to become one Workspace with its own look (left tabs, AI chat,
  review of finished mocks), modelled on solvely.ai's layout: a 260px light-grey tab rail (collapsible to icons, saved in
  `education-workspace-rail`), a white canvas, one blue accent and Inter. Phones get a top bar and a slide-in menu.
- Routes: `/workspace` (home: composer, resume, stats, programmes, recent results, practice), `/workspace/chat`,
  `/workspace/flashcards`, `/workspace/my-exams`, `/workspace/review` and `/workspace/review/[id]`, `/workspace/workshop`, plus the exam
  library pages above. `/dashboard`
  and `/workshop` redirect here; sign-in returns to `/workspace` by default. `/workspace/profile` and `/workspace/plans`
  (2026-11-08) replace `/profile` and `/plans`, which redirect (`/profile?error=` keeps its Google link error). The owner
  asked that the site header link only to Programmes and the Workspace: no Exams, Plans or profile button for members;
  guests still see Нэвтрэх. The rail's account row and the phone top-bar avatar open the profile; Plans is a rail tab.
  Monthly plan purchase and renewal keep their `/subscribe/<program>` address but render inside the Workspace under the
  Plans tab (`src/app/subscribe/layout.tsx`, readable-scale tweaks in `subscribe.css`). Single-mock `/checkout/<slug>`
  uses the Workspace's Exams tab. Guided `/workshops/<slug>` tasks and all three `/labs/ielts-*` studios use the Workshop
  tab; their existing URLs, pilot switches and server access checks stay in place.
- The shell is `src/modules/workspace/shell.tsx` (client) behind `frame.tsx` (server: name, email, active plans). The
  shell omits guest chrome on Home, AI chat, Review and Profile while their server-side sign-in redirect resolves,
  so no sidebar is streamed before login. Guest-readable library, plans and Workshop pages keep their shell.
  The site header, footer and backdrop are hidden by CSS only while the shell is on the page (`body:has(.wsp)`), so 404s keep the
  site chrome. Embedded exam pages inherit the Workspace palette through the site tokens redefined on `.wsp`.
- AI chat: `POST /api/workspace/chat` (same origin, verified session, 48 KB body). Modes ask, solve, explain, quiz, writing
  and vocab; subjects general, SAT, IELTS, ЭЕШ Math/Physics/English and JLPT; Mongolian or English. Six prior turns of at most
  2,500 characters are sent. 50 requests per student per Ulaanbaatar day with one in flight (`education-workspace-ai:*`).
  Refused before and after the provider call while any timed sitting is open; the local practice override does not apply.
  Threads live only in this browser (`education-workspace-chats-v1:<userId>`, 30 threads); nothing is stored on the server.
- Review: finished mocks with scores (12 per page, programme filter), then per-question review with the snapshot's answer,
  key, explanation, printed choices, figures and transcripts, weakest skills, and an AI coach beside it (explain, my mistake,
  similar question, free questions). The server builds the coach's context from the student's own SUBMITTED snapshot via
  `ownMock`; the page sends only the attempt and question ids. Replies render as a small Markdown subset through React text.

### Flashcards (2026-11-08)

- `/workspace/flashcards` turns an uploaded PDF, DOCX, PPTX, TXT, MD or CSV into 10, 20 or 30 study cards. It is a Workspace rail tab; guests are sent to sign-in with the page as the return path.
- The browser posts the file as multipart (4 MB maximum) to `POST /api/workspace/flashcards`. The server checks same origin, a verified session, the exact form shape, card count and language, the file signature and a 100-page/8 MB-part bound before spending the daily AI budget. PDF text comes from `unpdf`'s serverless PDF.js build; Word and PowerPoint text is read from their XML with `fflate` and bounded decompression. Scanned/image-only documents are refused because there is no OCR.
- DeepSeek receives only the extracted text (first 45,000 characters), the chosen language/count and the fixed card rules; the document is data, never instructions. JSON mode returns a title and cards; malformed output gets one silent retry. The provider call is refused while any timed sitting is open, checked before and after.
- 20 generations per student per Ulaanbaatar day, one in flight, using the shared `RateLimit` compare-and-set pattern. The upload and deck are not stored on the server. Decks and per-card mastery live only in this browser, per account (`education-flashcards-v1:<userId>`), like Workspace chats and Essay Studio drafts.
- Study flips a card with a click, Space or Up Arrow, marks it known/again with 1/2 or Left/Right Arrow, and persists the known set. Decks show a known count and can be deleted. Cards are AI drafts, not teacher-reviewed material.

### Exams from a file (2026-11-09)

- `/workspace/my-exams` is a Workspace rail tab, linked from the home "Шалгалтууд" heading. A student uploads a PDF, DOCX, PPTX, TXT, MD or CSV (4 MB maximum, first 45,000 characters) and chooses 10 or 20 questions in Mongolian or English. DeepSeek writes a title, four-option prompts, one key, an explanation and an optional topic per question; malformed or too-short output gets one silent retry. The JSON reader, prompt limits and malformed-question handling live in `src/modules/my-exams/contracts.ts`.
- The server reuses the flashcards' bounded document pipeline (`src/modules/flashcards/extract.ts`): signature check, 100 PDF pages, Office ZIP bounds and text decoding. The route checks same origin, a verified session, the exact multipart shape and the no-open-sitting rule before and after the provider call. A 15-per-Ulaanbaatar-day quota with one request in flight uses the shared `RateLimit` compare-and-set; the file and the exam are never stored on the server.
- The answer key is sealed in an AES-256-GCM token derived from `BETTER_AUTH_SECRET`, bound to the student's id as additional authenticated data, and valid for 30 days. The browser receives only the questions and the opaque token; `POST /api/workspace/my-exams/grade` opens the token server-side, grades the submitted option indexes and returns the key, explanations and score. The timer (suggested 15 or 30 minutes) is a browser study aid that auto-submits at zero; this is personal practice, not a `MockAttempt` and not a server-enforced deadline.
- Exams live only in this browser, per account (`education-my-exams-v1:<userId>`, 20 exams). A draft keeps answers, the current question, flags and the start time, so a reload resumes the same sitting. The last result (with key and explanations), best percentage and attempt count are kept for review; deleting the exam removes all of it. `/workspace/review` lists graded mocks only, not these browser-local exams.
- The runner has one question per page, an always-visible answer grid, flags, keyboard answers (1–4, arrows, F, Esc), a confirm step, corrective review filters and the source's math through `MathText`/KaTeX. Generated exams and explanations are AI drafts, are not teacher-reviewed, and scans are not OCR'd.

### IELTS Speaking Lab

`/labs/ielts-speaking` is an experimental, `noindex` studio. The homepage and IELTS program show a
Speaking invitation only when the studio is enabled: local pilot, or hosted pilot with
`SPEAKING_LAB_ENABLED=true`. Sign-in and registration preserve the return path to the studio.
The studio stays separate from graded practice and exams. It requires login and explicit transcript/microphone
consent, uses DeepSeek for text conversation, Kokoro for local British English speech, Whisper for
transcription and flat SVG speaking partners (one per voice) drawn for this site. It writes no attempts, scores,
subscriptions or chat history. Bands shown are transcript-only AI estimates, not official IELTS
scores; pronunciation is not assessed. Raw microphone recordings are not persisted.

### Workshop Essay Studio

`/labs/ielts-writing` is an experimental, `noindex` writing studio linked from `/workspace/workshop`. It shares
the Speaking Lab pilot switch (local pilot, or hosted pilot with `SPEAKING_LAB_ENABLED=true`).
Students pick an IELTS Task 2 essay, a General Task 1 letter (18 original bank prompts) or free
writing, write with a live word target and optional soft timer, then ask DeepSeek for ideas, a quick
grammar check or full feedback. Corrections must quote the student's text exactly or they are
dropped on the server; each one can be applied, skipped or applied all at once. Full feedback shows
an unofficial four-criteria band estimate (overall computed server-side with IELTS half-band
rounding), vocabulary upgrades, strengths, next steps and one rewritten passage.
- Server checks: login, verified email, same origin, strict input shape, bank prompts resolved on the
  server, minimum words, active timed-exam denial (before and after the provider call), and a daily
  40-request budget with one request in flight per student.
- Drafts, results and band history live only in this browser (`education-writing-lab-v1`). No
  attempts, scores or essays are stored on the server.
- Live spelling and grammar underlines come from Harper (`harper.js` 2.10.0, Apache-2.0), which
  runs as WebAssembly in the page, so this check sends nothing over the network. The 16 MB wasm is a
  hashed static asset loaded lazily only while auto spelling is on. Students choose UK, US or off,
  apply suggestions from a popover, ignore an issue or add words to a per-browser dictionary.
  Harper's `WorkerLinter` cannot load the bundler-emitted wasm from its blob worker, so the studio
  uses `LocalLinter` on the main thread after a 320 ms typing pause.

### Homepage, theme and scratchpad

- The homepage has additional education sketches through the page, a dedicated Speaking invitation,
  and one-time scroll reveals. Motion uses a small client component around server-rendered content,
  respects reduced-motion settings (including live changes), and leaves content readable without JS.
  The owner chose the Classic concept on 2026-11-07; `src/app/page.tsx` renders `HomeClassic`
  directly, and the earlier simple/index/practice experiments and their `/designs` preview routes
  were removed.
  Since 2026-11-08 it uses generated editorial images, concise programme cards with expandable formats,
  three silent autoplaying product loops (exam/practice, Workspace/review and Workshop), current server-read
  prices and FAQs. `home-details.tsx` and `home-overview.css` keep this presentation scoped to the homepage;
  glyphs, sketches, ticker, atmosphere and a compact Lexlab link remain. Programme navigation opens `/#programs`.
  Media and prompts: `docs/HOMEPAGE_MEDIA.md`; optimised images/videos: `public/home/`.
  `scripts/record-homepage-demos.py` records local disposable QA accounts only; no live AI calls.
  Artwork is selected by `HOME_ART_STYLE` in `src/components/home-art.ts`; the owner restored `editorial`.
  The `handdrawn` ink/watercolour alternative and both complete image sets remain available. Loops have no player controls;
  they stop offscreen, in hidden tabs and for reduced-motion preferences.

- The header theme switch defaults to the browser preference and saves an explicit choice in
  `education-theme` localStorage. The public site now shares the Workspace's blue/neutral palette and self-hosted Inter (`next/font/google`, fetched at build) with
  Mongolian Cyrillic coverage. English passages keep a reading serif.
- The 2026 interface layer lives in `src/app/theme.css`, loaded after `globals.css`. It is
  built on white/light-grey surfaces and a blue accent, with matching charcoal surfaces in dark mode. It keeps
  the existing glyphs and decorative features, and styles the sticky glass header/footer,
  homepage hero, cards, auth, dashboard, exam surfaces, admin and mobile navigation without
  changing route semantics, server checks or test hooks.
- Plans (own CSS in `src/app/workspace/plans/plans.css`) and Workshop live in the Workspace; the shell's styles
  are in `src/modules/workspace/workspace.css` (scoped under `.wsp`).
  The rest of the site uses the full display scale and copy. `src/app/footer-compact.css` keeps the
  shared footer to one link row and one disclaimer line; delete its import in `layout.tsx` to restore
  the taller footer.
- `/workspace/profile` and `/admin` share `src/app/workspace.css` (card surface, status pill and tokens) through their own
  stylesheets, with readable type and no monospace Cyrillic labels. Despite its name, that file is not the Workspace's
  stylesheet (`src/modules/workspace/workspace.css`).
- Mathematics and Physics tests expose a collapsible scratchpad with graph paper, mouse/pen/touch drawing,
  last-stroke undo, confirmed clear and keyboard-accessible typed notes.
- The imported ЭЕШ surfaces live in `src/modules/exams/entrance/entrance.css` (hub, briefing, sitting,
  answer sheet and results), scoped under `.eesh-*` so SAT and IELTS keep their existing CSS.
- Scratch work is stored only in this browser under `education-scratchpad-v1:<attemptId>`, capped at
  8,000 characters, 200 strokes / 12,000 points and 1,500 points per stroke. It never enters graded
  responses, server scoring or deadlines. SAT Math modules in one sitting share the pad; different
  attempts do not.

## 8. Architecture and data

| Path | Responsibility |
| --- | --- |
| `src/app` | Next.js App Router pages and route handlers |
| `src/components` | Shared UI, forms, navigation and exam tools |
| `src/lib` | Auth, session, API, config, email and shared helpers |
| `src/modules/content` | Catalog, drafts, review and published content resolution |
| `src/modules/workshops` | IELTS writing and speaking workshop tasks |
| `src/modules/listening-lab` | Listening Lab drills, timings, browser progress and player (its CSS also styles the IELTS mock Listening stages via `src/modules/exams/listening-section.tsx`); audio in `public/listening-lab` |
| `src/modules/exams` | SAT/IELTS sitting lifecycle, timers and the shared scoring engine |
| `src/modules/exam-practice` | Untimed practice on mocks: forms, checks, progress and the assistant |
| `src/modules/exams/entrance` | ЭЕШ catalogue, lazy content loader, hub, compact briefing, sitting and results |
| `assets/entrance-mocks` | Generated, server-side ЭЕШ content JSON with answers; traced into the server routes |
| `assets/jlpt` | Private JLPT definitions and audio provenance; answers/scripts stripped before client delivery |
| `public/exam-assets/eesh` | Generated SVG diagrams for the imported papers; answer-free |
| `MockExmps` | Offline authoring packs and validation tools; never served, built or deployed |
| `scripts/build-entrance-mocks.mjs` | Deterministic converter from `MockExmps` to site content, diagrams and catalogue |
| `reference/official-papers` | Withdrawn official papers, kept as a format guide only; never served, built or deployed |
| `reference/retired-site-mocks` | Retired site mocks (the first four Mathematics forms and the old English set); never built |
| `src/modules/workspace` | Workspace shell, home, AI chat (contract, service, browser-stored threads), review and styles |
| `src/modules/flashcards` | Document extraction, AI card contract, browser-stored decks and the study UI |
| `src/modules/my-exams` | Upload-to-exam contract, sealed answer token, server generation/grading, browser-stored exams and the runner |
| `src/modules/subscriptions` | Plans, purchases, entitlements and legacy grants |
| `src/modules/admin` | Admin services, reporting, exports and audit |
| `src/modules/tutor` | DeepSeek prompt contracts, quotas and provider calls |
| `prisma` | Schema and migrations |
| `scripts` | Setup, provisioning, operator purges and deployment/readiness checks |
| `tests` | Unit, contract and Playwright browser suites |

Server-side checks are authoritative. Ownership, plan entitlement, exam ownership, active-exam
blocks, quotas, same-origin mutation checks and bounded JSON bodies must remain on the server. Never
trust client-supplied scores, user IDs, content versions, prompts or prices. Immutable attempt
snapshots preserve what the student actually saw.

Before writing framework-specific code, read the installed Next.js guides in
`node_modules/next/dist/docs/`. This project uses APIs that can differ from older Next.js versions.

### Scaling and load

- Auth rate limits are per IP and a school network shares one IP. `/get-session` (every page load)
  is not limited; sign-in allows 200/min and sign-up 60/min per IP; password reset 5/min and
  verification mail 3/min stay strict. Password guessing is capped per account instead: 10 sign-in
  attempts per email per minute (`src/lib/account-throttle.ts`), then HTTP 429 for that account only.
- Database: each Vercel instance opens up to 5 connections. For many students use Neon's pooled
  address as `DATABASE_URL` and the direct address as `DIRECT_DATABASE_URL`; Prisma CLI (migrate,
  seed) uses the direct one. Without it the build warns and migrations use the pooled address, which
  production does today and has migrated successfully; a pooled or local `DIRECT_DATABASE_URL` fails.
- Monitoring: `GET /api/health` returns `{ok, database, databaseMs}` (200, or 503 when the database
  is unreachable) for an external uptime monitor. `/admin?tab=settings` shows database latency,
  sign-ins, active users, live exams, the busiest rate-limit keys and when to upgrade.
- Load test: `node scripts/load-test.mjs --setup --students 100` once, then
  `node scripts/load-test.mjs --students 100 --minutes 5`. It signs in a class at once from one IP,
  opens pages, unlocks and starts a mock with simulated payment, and autosaves every 10 s. It refuses
  non-local targets unless `LOAD_TEST_ALLOW_REMOTE=1` (approved staging only; never production). Local
  results run on single-connection PGlite and one Node process, so treat them as a floor, not as
  hosted capacity.

## 9. Local development

Requirements: Node.js 24.x, npm 11 or newer, and a local PostgreSQL-compatible PGlite instance
managed by the project scripts.

```powershell
npm ci
npm run setup:env
npm run db:start
npm run db:migrate
npm run db:generate
npm run dev
```

The imported ЭЕШ content is already generated in `assets/entrance-mocks` and `public/exam-assets/eesh`.
After editing the offline packs in `MockExmps`, run `node scripts/build-entrance-mocks.mjs` and commit the
regenerated JSON, SVG and catalogue. The script validates 155 forms, 100-point totals and diagram files.

Open <http://localhost:3001>. Local services:

| Service | Address / port | Notes |
| --- | --- | --- |
| App preview | 3001 | `npm run dev`, or production `npm run build` then `npm start` |
| Local database | 51214 (and 51215) | PGlite, database `template1`; never reset casually |
| Recovery QA server | 3002 | Optional, built app plus loopback outbox and synthetic Google credentials |

With `AUTH_LOCAL_PILOT=true`, the app uses a single database connection
(`max: 1`). This keeps PGlite stable locally; production connection behavior is not verified by that
setting. The local database is independent: do not point it at LawTest, hosted Neon, or production
data.

Ignored environment files hold real local values. `npm run setup:env` creates local files from
`.env.example` when needed. Never print, commit or paste secret values. Typical local keys:

- `BETTER_AUTH_URL=http://localhost:3001`
- `BETTER_AUTH_SECRET` (at least 32 characters)
- `AUTH_LOCAL_PILOT=true`
- `DATABASE_URL` pointing at the loopback database
- Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
  `AUTH_HOSTED_GMAIL`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `AUTH_REQUIRE_EMAIL_VERIFICATION`, `DEEPSEEK_API_KEY`,
  `DEEPSEEK_MODEL`

Useful provisioning commands:

```powershell
npm run demo:accounts
npm run admin:grant -- qa-demo-01@example.invalid
```

The recovery QA server (`artifacts/start-auth-recovery.mjs`, port 3002) forces the loopback outbox and synthetic Google
credentials. Its launcher is ignored by git and absent on this PC.

## 10. Verification and delivery

`npm run check`, `check:push` and `check:all` (`scripts/check.mjs`) run lint, typecheck, unit tests and browser suites by area.
[OPERATIONS.md](./OPERATIONS.md) section 3 says which to run. Fixtures under `tests/` may alter only reserved QA rows and advance
deadlines; they must never add a runtime bypass, shorten a public exam or change a real learner's data.

## 11. Known limits

- See `OPERATIONS.md` for the current Git and hosted deployment state. A source push does not prove
  a hosted deployment or enable Google/email without the corresponding provider settings.
- Hosted Google and Gmail credentials are configured; a hosted verification email reached the owner
  inbox. A completed real Google login, consent and token exchange still require an owner-controlled
  browser session. See `OPERATIONS.md` for exact deployment/check evidence.
- There is no verified-email production onboarding, no live billing and no real payment provider.
- Scores are raw; SAT scaled scores and IELTS bands are not calculated. ЭЕШ papers report a 100-point
  practice total from printed item marks, not the official weighted ЭЕШ score. The Speaking Lab's and
  Essay Studio's bands are AI estimates only.
- All 155 imported ЭЕШ papers await teacher review, so their answers, explanations and the AI's answers
  about them are unverified. The 2022–2026 Mathematics and English references are third-party copies,
  not official БҮТ files.
- The 2018 and 2019 English listening sections have a script but no recording; they are labelled as
  transcript practice. No audio was synthesized for them.
- Creating new catalog items and replacing content media are unfinished.
- Content accuracy depends on manual review.
- Local PGlite works with single-connection settings; broad production concurrency and scale are
  unverified.
- AI and speech features depend on third-party models and local model caches; quality, latency and
  cost are not production-benchmarked. Provider retention is governed by the provider's terms.
- Flashcards are generated from the uploaded text only: they can be incomplete or wrong, are not
  teacher-reviewed, and scans or photos are not OCR'd.
- Exams from a file are generated from the uploaded text only and are also unreviewed AI drafts. Their
  timer, results and history are browser-local, the score is practice feedback rather than an official
  result, and scanned documents are refused because there is no OCR.
- Personal-data retention, account deletion policy, email deliverability and accessibility audits
  remain to be completed.
- This is a hosted test pilot, not a production education service.
