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
| Full mocks | Six Digital SAT and twelve IELTS Academic mocks (01–12), with server-authoritative timers |
| JLPT | Three N5 and three N4 mocks, 456 original items, Japanese synthetic listening, timed sections and focused practice |
| HSK 1 | Three original HSK 1 mocks (120 items), picture tasks, pinyin, Mandarin synthetic listening and practice (section 3) |
| ЭЕШ mocks | 194 imported practice papers: 55 Mathematics, 60 Physics, 18 Chemistry, 21 Biology and 40 English (2015–2026), on the site as University Prep |
| Practice mode | Untimed practice on every mock, with instant checks and a DeepSeek assistant |
| Accounts | Better Auth email/password, profile, Google OAuth, verification and password recovery |
| Plans and payments | A free account and three monthly plans plus per-mock and per-paper simulated purchases |
| Admin | Protected overview, members, subscriptions, payments, monitoring, content and audits |
| AI tutor | DeepSeek math hints, explanations and mistake review; students can attach photos of a problem or their working (section 7) |
| Speaking Lab | Isolated IELTS speaking studio at `/labs/ielts-speaking` |
| Essay Studio | Workshop writing practice with AI corrections at `/labs/ielts-writing` |
| Listening Lab | Two original IELTS Listening practice tests (Parts 1–4, mock-style recordings) at `/labs/ielts-listening` |
| Reading Lab | Five original IELTS Academic passages (62 questions, seven question types) and credit-paid AI practices from the student's own file, page photos or pasted text at `/labs/ielts-reading` (section 7) |
| Workspace | `/workspace`: the signed-in study app, separate from the marketing site, with left tabs for Home, AI chat, Vocabulary, Exams, Review, Workshop and Plans, plus the profile (section 7) |
| Vocabulary | Add words and translations, organize them in decks, scan a document with AI and choose which words to keep, and study with an adaptive quiz that stores per-word progress at `/workspace/vocabulary`; the old `/workspace/flashcards` address redirects |
| Exam from file | Upload a PDF, Word, PowerPoint or text file, or up to four page photos, and get an AI multiple-choice exam of 5–20 questions at `/workspace/my-exams` (5 saved exams free, 15 with IELTS or SAT); exams, sittings and scores are saved on the account and follow the student between devices |
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

The `/exams` library has five categories: SAT, IELTS, ЭЕШ, JLPT and HSK, three per row on a desktop canvas (a container query on
`.library-page`, so it follows the Workspace rail: 3 columns from 900px of canvas, 2 from 640px, then 1). `/exams/sat` and `/exams/ielts` collect
their six mocks. `/exams/eesh` is the ЭЕШ hub: subject tabs (`?subject=math|physics|english`) and dense
year rows with five variants per year. The retired `/exams/eesh-math` route and the first four Mathematics
mocks (`eesh-math-01`–`04`) return 404; their files are kept unserved in `reference/retired-site-mocks/eesh-math/`.
Homepage and program links open the hub; individual mock briefings link back to their subject tab. Existing
saved attempts and purchases remain readable. The library itself uses four programme cards with a compact
index (counts, timings, included parts and direct entry); the ЭЕШ row links to the three subject tabs.
`/workspace/plans` (moved from `/plans`, which redirects) is a comparison-first pricing page inside the Workspace that guests
can read: a free-account card (2026-11-12: ₮0, the monthly free credits, 100 vocabulary words, 5 saved file exams) and three plan
cards, a feature table with a free column, the per-mock option and month terms. Both pages use scoped CSS
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

- Mocks `ielts-academic-01` through `ielts-academic-12` are separately purchasable; an active
  IELTS plan includes all twelve. Mocks 07–12 (2026-11-10) are described at the end of this section.
- Mocks 01–06: the 2026-11-09 revision strengthens all six forms: plausible Listening/Reading distractors,
  passage-specific paragraph matching, richer Writing data and a process diagram in Mock 05. Mocks 02–06 use authored
  connected scripts, with longer academic sections, rather than answer-announcing templates. Their three distinct Reading
  passages total about 2,200 words per form; each has a distinct essay, cue card and linked discussion.
  Full review and limits: [IELTS_MOCK_REVIEW.md](./IELTS_MOCK_REVIEW.md). Teacher review and learner calibration remain pending.
- Listening: 40 questions in about 30 minutes, plus 2 minutes checking, using four bundled synthetic
  recordings.
- Reading: 40 questions over three passages (2,265 words) in 60 minutes.
- Writing: two tasks in 60 minutes.
- Speaking: a 12-minute simulation in four timed stages (Part 1, the preparation minute, the long turn, Part 3). The whole
  stage is recorded and stored for review. Where the Speaking Lab is enabled the student can take it with the AI examiner
  ("AI examiner in the IELTS mocks" in section 7); otherwise the prompts are read from the screen as before.
- No IELTS band score is calculated.
- Authenticated audio serving resolves the exact mock slug to its own allowlisted recording files.
  Original and revised recordings are included in the production function trace. New audio provenance, script
  hashes, file hashes and durations live in `assets/exams/manifest.json`, `manifest-02.json` through
  `manifest-06.json`, and `manifest-v2-02.json` through `manifest-v2-06.json`. `scripts/generate-ielts-audio.py` (setup in its header) regenerates the revised 02–06 set with local
  Kokoro-82M neural voices (Apache-2.0) at one natural pace. Revised Parts 1–3 have 30-second reading/checking pauses;
  Part 4 has a one-minute preview and a continuous lecture. The generator also updates the answer-free
  `ielts-audio-v2.json` timing catalogue. `audioRevision` in each attempt snapshot selects the matching files and timing;
  missing revision means legacy audio, independently of the publishing version. Never overwrite a released recording set.
  Parts play back to back; the 30-minute stage leaves checking time after the last part.
- Mocks 07–12 (2026-11-10): Codex's offline pack `MockExmps/IELTS` (kept local, not committed) is converted by
  `node scripts/build-ielts-mocks.mjs` into `src/modules/exams/ielts-forms.json` (server-side, with keys and the
  four Listening scripts per form), `ielts-forms-audio.json` (answer-free file prefixes and part lengths),
  `public/ielts-mocks/mock-XX-writing-1.svg` and the two Listening plans (Mocks 07 and 10, drawn from the pack's
  fixed-width plans). Each form reuses the revised Mock 02 stages and timing. Question types: note completion,
  A–C/A–D choice, plan and bank matching, paragraph matching, headings (Roman-numeral labels), TRUE/FALSE/NOT GIVEN
  and YES/NO/NOT GIVEN; Speaking has nine Part 1 prompts, a cue card with two rounding-off questions and six
  Part 3 prompts. Completion keys also accept 6.30 for 6:30 and October 19 / 19th October for 19 October; the word
  limit counts the number that "AND/OR A NUMBER" allows.
- Mocks 07–12 audio: the pack's 80 kbps Kokoro recordings are re-encoded to 48 kbps mono in their own folder
  (`assets/ielts-forms/ielts-07-part-1.mp3` … `ielts-12-part-4.mp3`, 55 MB; hashes and durations in
  `assets/ielts-forms/manifest.json`).
- Audio functions: a Vercel function must stay under 250 MB, and the build bundles into a route every file its code
  can read, so one shared reader of `assets/exams` once put all 93 recordings (236 MB) into every audio route.
  Each folder now has its own reader and route: `/audio` reads `assets/exams` through `audio-response.ts`
  (IELTS 01–06 and JLPT, 180 MB bundle) and `/audio/forms` reads `assets/ielts-forms` through
  `audio-response-forms.ts` (IELTS 07–12, 77 MB), `/audio/hsk` reads `assets/hsk-audio` (HSK 1, 12 MB), for both `/api/mock-attempts/<id>/…` and
  `/api/exam-practice/<slug>/…`. `audio-handlers.ts` holds the shared checks and reads no files;
  `audioPath()` in `audio-files.ts` picks the route, and each route refuses the other folder's mocks.
  `next.config.ts` lists only the `/audio/forms` folder: tracing keys match anywhere in a route path, so an `/audio`
  key would also feed `/audio/forms`. Give any new recording set its own folder, reader and route segment, and
  check the bundle sizes in `.next/server/app/api/**/route.js.nft.json` after a build. There is one recording set per form,
  so `audioRevision` is unset. Scripts stay out of the definition (and so out of attempt snapshots); practice
  mode reads them by part after a check. Teacher review and learner calibration remain pending.

### JLPT N5 and N4

- `/exams/jlpt?level=N5|N4` lists three forms per level, purchased access, saved practice progress and open attempts.
- `jlpt-n5-01`–`03`: 21 vocabulary / 20 min, 22 grammar-reading / 40 min, 24 listening / 30 min.
  `jlpt-n4-01`–`03`: 28 / 25 min, 29 / 55 min, 28 / 35 min. Server deadlines and attempt snapshots use the existing exam engine.
- `scripts/build-jlpt-mocks.mjs` converts offline `MockExmps/JLPT` source into six private `assets/jlpt` definitions and an answer-free catalogue. Authoring packs and official format reference images stay excluded from deployment.
- `scripts/generate-jlpt-audio.py` uses local Kokoro-82M Japanese voices (Apache-2.0) and Misaki Japanese G2P. The 24 MP3s in `assets/exams/jlpt-*-part-*.mp3` have script/file hashes, measured durations and per-item timings; protected mock/practice audio routes apply the existing access and active-sitting checks.
- Timed listening follows the server clock, with no pause/replay; practice can replay one item and reveals its transcript only after checking. Written questions keep shared passages together, use numbered options and support optional authored furigana. Result skill links open focused practice.
- Per-mock access uses the existing simulated ₮10,000 purchase. No JLPT monthly plan or cross-program access is added. Raw scores only; no 180-point conversion or pass/fail claim.
- All questions are original drafts awaiting Japanese-teacher review. Situational text replaces illustrations. Synthetic tracks are shorter than the official listening window; remaining time is answer checking. Native-speaker listening review and learner calibration remain pending.

### HSK 1 (2026-11-11)

- The owner asked for the offline HSK pack on the site. `hsk1-mock-01`–`03` (program `hsk`) follow the current regular HSK 1 (2.0)
  paper: Listening 20 items in 15 minutes, then Reading 20 items in 17 minutes (32 minutes; the paper's 5 minutes of personal
  information and 3 minutes of answer transfer are not needed on screen). Eight five-item parts: picture √/×, three-picture choice,
  dialogue to one of six pictures, short question with three printed answers; word–picture √/×, sentence to one of six pictures,
  question to one of six answers, word into a gap. Every printed Chinese line carries the pack's pinyin (a Pinyin toggle hides it);
  each part opens with the paper's worked example. Hub `/exams/hsk`; `/exams` has an HSK card.
- Build: `node scripts/build-hsk-mocks.mjs` converts `MockExmps/HSK` (never deployed) into `assets/hsk/<slug>.json` (server-side,
  with keys and listening scripts), `public/exam-assets/hsk/` (118 answer-free, text-free SVG pictures) and the client-safe
  `src/modules/exams/hsk/catalog.json`. Display data sits in `question.hsk` / `group.hsk` (pictures, pinyin lines, choices,
  example) and the single pictures in `figure`; `pictures` is an immutable content field, so admin edits can fix text and pinyin
  but not media. Answers are the labels (√/×, A–F).
- Audio: the pack has none (it is reader-administered), so `scripts/generate-hsk-audio.py` (setup in its header) synthesises it
  locally with Kokoro-82M v1.0 Mandarin voices (narrator `zm_yunxia`, woman `zf_xiaoyi`, man `zm_yunxi`, speed 0.9), from the
  pack's authored pinyin rather than automatic conversion (neutral tones, 一/不 as printed; third-tone runs changed). Each item is
  read twice (5 s, then 10 s), with each part's instruction and example; about 11 minutes per mock, the rest of the 15 minutes is
  checking time. Four tracks per mock, 48 kbps mono, 12 MB in `assets/hsk-audio` with hashes and per-item timings
  (`src/modules/exams/hsk/audio-catalog.json`, used for practice replay). Voices were chosen by a Whisper-small round trip
  (2026-11-11): over the 60 scored items 0.97 mean toneless and 0.96 toned pinyin match; the weakest are 2–3-syllable phrases
  (喝水 heard as 河水). No person has listened to them.
- Own audio route segment `/audio/hsk` (`audio-response-hsk.ts`, both `/api/mock-attempts/<id>/…` and `/api/exam-practice/<slug>/…`),
  with the usual rule: in a sitting only the part playing now. Results: raw correct (40) and the paper's practice conversion
  (correct × 5 per section, 200 in all; 120 is the usual pass mark), stated as not an official or equated score. Access is the
  ₮10,000 per-mock purchase only; no plan. Practice mode, the practice assistant and the review coach (`hsk` chat subject) get
  pictures as their descriptions (`hsk/describe.ts`). Tests: `tests/hsk.test.mjs`, browser group `hsk` (`tests/hsk_smoke.py`).
- All items, pictures and keys are DeepSeek Harness drafts (2026-11-10) awaiting a Chinese teacher's review; not HSK 3.0.

### ЭЕШ mocks (University Prep)

- 194 imported papers live on the site, all with program `entrance`:
  - `eesh-math-<year>-m1`–`m5`: 55 Mathematics forms for 2015–2026 (2020 excluded).
  - `eesh-physics-<year>-p1`–`p5`: 60 Physics forms for 2015–2026.
  - `eesh-chemistry-<year>-c1`–`c3`: 18 Chemistry forms for 2020–2023, 2025 and 2026 (no 2024 reference was found).
    40 A–E items (68 points) and four Part II tasks of eight one-digit cells (32 points); 100 minutes.
    2020–2023 Part II tasks are provisional (no official Part II source); the task says so.
  - `eesh-biology-<year>-b1`–`b3`: 21 Biology forms for 2020–2026. 50 A–E items (46 in 2026, 76 points) and four
    Part II tasks with numeric or choice-number answers (24 points); 80 minutes. 2020, 2021 and 2023 Part II tasks
    are provisional.
  - `eesh-english-<year>-e1`–`e5`: 40 English forms for 2018–2020 and 2022–2026.
- Source and build: the offline authoring packs stay in `MockExmps/` (never served or deployed).
  `node scripts/build-entrance-mocks.mjs` converts them into `assets/entrance-mocks/<subject>/<slug>.json`
  (server-side content with answers) and `public/exam-assets/eesh/<subject>/<slug>/*.svg` (2825 diagrams).
  It also writes the client-safe catalogue in `src/modules/exams/entrance/catalog.json` and
  `catalog-data.ts`. `next.config.ts` traces the content JSON for every server route. Rerun it after editing
  `MockExmps`, naming the subjects you changed (`node scripts/build-entrance-mocks.mjs biology chemistry`): the
  committed Mathematics/Physics output differs from what the script now produces from `MockExmps` (diagram sizes
  were adjusted after generation), so a full rebuild rewrites those 115 papers. The catalogue is always rebuilt from
  every pack. Chemistry/Biology figures are the packs' own SVG files; an explanation shorter than 12 characters
  is shown after its answer ("H₂SO₄: +6."). Biology's generic "№ / Бүтэц / жишээ" tables are left out when every
  word in them is already in the question or its options (360 items); every other figure is shown. The Biology
  generator also hyphenated case endings onto ordinary nouns ("Шош-ийн"); the converter spells the 63 reviewed
  forms out ("Шошны", "үндсэнд", …) and fails the build on any new one. Hyphens after abbreviations, units and
  numbers (ДНХ-ийн, 3 мин-д, 20 °С-д) are correct Mongolian and stay.
- Results (all ЭЕШ papers, fixed 2026-11-10): each skill row counts only its own questions; a precedence slip had
  made every row show the whole paper. The header separates wrong from blank answers, and the review list opens on
  the wrong answers, or on the blanks when nothing was answered wrongly.
- Chemistry and Biology prompts are Mongolian prose with Unicode formulas, so they render as text (no KaTeX) with
  the scratchpad; the AI assistant and Workspace chat have `eesh-chemistry` and `eesh-biology` subjects.
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
- `tests/entrance-mocks.test.mjs` checks all 194 papers: 5 forms per year (3 for Chemistry/Biology), unique IDs, five options,
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
| Free account | 0 | Workspace tools with 100 AI credits a month, a 100-word vocabulary bank and 5 saved file exams; mocks by per-exam purchase |
| University Prep | 40,000 MNT/month | All 194 ЭЕШ Mathematics, Physics, Chemistry, Biology and English papers |
| IELTS | 60,000 MNT/month | IELTS mocks and workshops |
| SAT | 60,000 MNT/month | SAT mocks |
| Full SAT, IELTS or ЭЕШ mock | 10,000 MNT each | Per-exam purchase, including retakes, or a matching plan |
| AI credit pack | 5,000 MNT for 1,000 credits | Admin-editable size and price; credits never expire |

Monthly plan prices and the credit pack above are the defaults; admins can change them in `/admin?tab=pricing`. Each plan also adds
AI credits for every month of the plan (University Prep 1,500, IELTS 3,000, SAT 2,000), kept until the plan ends, on top of 100 free
credits a month; see "AI credits" in section 7.

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
  history. Actions: note, grant/extend or expire a month, grant AI credits for this month, sign out everywhere, suspend/unsuspend.
- Suspension (`User.suspendedAt`) is admin-only (`input:false`), signs the user out, is refused at
  session creation (`ACCOUNT_SUSPENDED`) and by `getSession`/`apiUser`. Admins and the acting admin
  cannot be suspended. `UserEvent` keeps the durable activity record because sessions are deleted on
  sign-out; logging never blocks sign-in. Activity starts from the 2026-10-30 migration.
- Monthly plan prices are editable in the Prices tab (`PlanPrice`, ₮1,000–₮1,000,000 in steps of
  ₮100, reason required, audited). New and unpaid orders use the current price; paid orders keep their
  amount. Missing rows fall back to `subscriptions/plans.ts`. The single-mock price stays ₮10,000 in
  code. The same tab edits the AI credit pack (`CreditPack`, 10–100,000 credits for ₮1,000–₮1,000,000 in steps of ₮100,
  audited `set-credit-pack`); unpaid credit orders follow it and paid ones keep what they were bought at.
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
  after a check, both Writing tasks and all Speaking prompts (with the AI examiner where the Speaking Lab is enabled; section 7,
  "AI examiner in the IELTS mocks"); recordings are not stored here. ЭЕШ Mathematics and Physics
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
  `/workspace/vocabulary`, `/workspace/my-exams`, `/workspace/review` and `/workspace/review/[id]`, `/workspace/workshop`, plus the exam
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
- AI chat: `POST /api/workspace/chat` (same origin, verified session, 48 KB of text plus up to three images, `CHAT_BODY_BYTES`). Modes ask, solve, explain, quiz, writing
  and vocab; subjects general, SAT, IELTS, ЭЕШ Math/Physics/English and JLPT; Mongolian or English. Six prior turns of at most
  2,500 characters are sent. 50 requests per student per Ulaanbaatar day with one in flight (`education-workspace-ai:*`).
  Refused before and after the provider call while any timed sitting is open; the local practice override does not apply.
  Threads live only in this browser (`education-workspace-chats-v1:<userId>`, 30 threads); nothing is stored on the server.
- Review: finished mocks with scores (12 per page, programme filter), then per-question review with the snapshot's answer,
  key, explanation, printed choices, figures and transcripts, weakest skills, and an AI coach beside it (explain, my mistake,
  similar question, free questions). The server builds the coach's context from the student's own SUBMITTED snapshot via
  `ownMock`; the page sends only the attempt and question ids. Replies render as a small Markdown subset through React text.

### Vocabulary (2026-11-09, reorganized 2026-11-11)

- `/workspace/vocabulary` replaces the 2026-11-08 flashcards page; `/workspace/flashcards` redirects there. It is a Workspace rail tab ("Үгсийн сан"); guests are sent to sign-in with the vocabulary page as the return path.
- Words: a student adds a word or phrase with its translation, an optional example and an optional deck; saved words can be edited or deleted. `VocabularyWord` is unique by a case/width-folded `termKey`, so a duplicate term is refused (409) rather than silently doubled. Words are server-stored per account, so they follow the student between devices; every read and write is scoped by `userId` on the server.
- Bank size (2026-11-09, owner rule): 100 words on a free account, 3,000 while an IELTS or SAT plan is active (`vocabularyWords` in `subscriptions/plans.ts`; the largest active plan wins, plans do not stack; University Prep keeps 100, owner-confirmed 2026-11-09). Adds and saves past the size get a 409 that names the IELTS/SAT upgrade; words kept above it after a plan ends stay listed, editable and deletable, but no new word fits until the bank is under its size.
- Organization (2026-11-11, owner asked for the list to stop being "a scroll dump"): the page opens on four figures (saved / bank size, due now, mastered, reviewed today), a study banner and the library. The library has a deck rail (all words, starred, words in no deck, then the student's decks with counts), search over term, translation, example and source file, level filters with counts (due, new, learning, familiar, mastered, weak), five sort orders, a list or card view (the choice is kept in this browser) and pages of 25. Rows can be selected (one page, or everything the filter matches up to 500) for bulk move to a deck, star, quiz, reset progress or delete. `VocabularyDeck` (name unique per student by a folded `nameKey`, one of six colours, at most 50) is created from the rail, renamed and recoloured in place; deleting a deck keeps its words unless the student chooses to delete them too. Migration `20261111090000_vocabulary_decks_and_study` is additive (one table, defaulted or nullable columns). The page is a size container: its layouts follow the page's own width, so the Workspace rail being open or collapsed does not break the list.
- API: `POST /api/workspace/vocabulary` (one word), `PATCH`/`DELETE …/words/[id]`, `POST …/words` (bulk: `add` a reviewed list, `move`, `star`, `reset`, `delete`; 384 KB body, 500 ids), `POST …/decks`, `PATCH`/`DELETE …/decks/[id]` (`?words=delete`), `POST …/review` and `POST …/import`. Every handler checks same origin, then a verified session; every shape is exact (`contracts.ts`), and a deck id is only used after the server finds it under the same `userId`.
- File scan (2026-11-11 replaces the 10/20/50/all buttons): a file is uploaded as multipart (4 MB maximum) to `POST …/import`, which reuses the shared bounded document pipeline in `src/modules/documents` (signature check, 100 PDF pages, Office ZIP bounds, text decoding). The student sets the most words to find with a slider or a number (`count`, 1–120, lowered to the room left in the bank; missing means 120), and may filter by level (`level`: any, basic A1–A2, intermediate B1–B2, advanced C1–C2) and word type (`kind`: any, nouns, verbs, adjectives/adverbs, phrases); both are fixed choices mapped to fixed prompt sentences. An optional instruction (at most 500 characters) is sent as untrusted data and can only narrow the list. DeepSeek receives only the extracted text (first 45,000 characters) or up to four page photos, and returns term/translation pairs with an optional copied example; a translation the document supplies is kept as written, and the chosen fallback language is used only for terms without one. Malformed output gets one silent retry.
- Review before saving: the scan saves nothing. It returns the words that are not already in the bank (`candidates`; words the student already has are left out and not charged, and a file with nothing new is a refunded 409). The page lists them with checkboxes and editable term and translation, and the student chooses the target: a new deck named after the file, an existing deck or none. Only the chosen words are saved, through the bulk `add`. The list is kept in this browser (`education-vocabulary-scan-v1:<userId>`) until it is saved or discarded, so a reload does not lose a scan that was paid for.
- The import route checks same origin, a verified session, the exact multipart shape, the file signature and the no-open-timed-sitting rule before and after the provider call. It allows 20 scans per student per Ulaanbaatar day with one in flight, using the shared `RateLimit` compare-and-set. The file itself is never stored. A scanned PDF with no text layer is still refused (pages are not rendered on the server); the student can send up to four photos of the pages instead (see "Image input"). The panel shows the price badge only; the worked price examples and the rules about holds were removed at the owner's request (2026-11-11). Price: "AI credits" below.
- Study progress (2026-11-11): each word carries a Leitner box 0–5, right and wrong counts, `reviewedAt` and `dueAt` (`study.ts`, shared by server and browser). A right answer moves a due word up one box and schedules it 1, 2, 4, 8 or 16 days out; a hinted or near-miss answer holds the box; a miss sends the word to box 1, due in 10 minutes. An answer given before a word is due keeps its box and date, so repeating one quiz cannot fake mastery. A quiz session posts one grade per word (`again`, `hard`, `good`) to `POST …/review`; the server computes the new state from the stored one and never accepts a box, date or score from the browser. This is self-study data, not a grade. Levels shown: new (0), learning (1–2), familiar (3–4), mastered (5).
- Quiz (2026-11-11): built in the browser from the saved words (`quiz.ts`), at least four words in the bank. Scope: smart (due, new and weak words first), all, due, new, weak or starred, within one deck or all, or an explicit selection from the list. Six question forms can be mixed, and each word gets a form that suits it and its box (easier forms for new words, recall for familiar ones): four-option choice, typing (alternatives separated by commas count, one or two slips in a longer answer count as a near miss), true/false, listening (the browser's own voice reads the term; offered only when the browser has a voice for the term's script), gap-fill from the word's own example sentence, and self-graded cards. Wrong options come from the student's other words, same deck and similar length first. Settings: 1–50 questions, direction, an optional 10 or 20 second timer per question, re-asking missed words at the end, reading words aloud; they are kept in this browser (`education-vocabulary-quiz-v2:<userId>`). During a question there are a hint (50/50 or the first letter), "don't know", a streak counter and keyboard answers (1–4, Enter, H, Space, Esc). The result shows the score of first attempts, time, best streak, each word's level change, and offers a retry of the missed words and starring them. "Ухаалаг давталт" on the page starts a smart session at once with the saved settings. Leaving early keeps the answered words' progress.
- AI-generated translations and examples are drafts, not teacher-reviewed material. The browser-stored flashcard decks created by the 2026-11-08 page are not migrated into the vocabulary bank; the old local data is simply unused.

### Exams from a file (2026-11-09)

- `/workspace/my-exams` is a Workspace rail tab, linked from the home "Шалгалтууд" heading. A student uploads a PDF, DOCX, PPTX, TXT, MD or CSV (4 MB maximum, first 45,000 characters) and sets any question count from 5 to 20 with a slider or a number box (`count`; 2026-11-12 replaces the 10/20 buttons; 20 is the most one 8,000-token reply holds), in Mongolian or English. DeepSeek writes a title, four-option prompts, one key, an explanation and an optional topic per question; malformed or too-short output gets one silent retry. The JSON reader, prompt limits and malformed-question handling live in `src/modules/my-exams/contracts.ts`.
- Structure (2026-11-12): the prompt has a fixed "Exam structure" rule (follow the material's order, spread the questions over its parts, easier to harder), and the student may add a structure request (`structure`, at most 500 characters: sections, questions per topic, question kinds, difficulty, order). It is sent in the user message as data and can only arrange the exam; it cannot raise the count or change the format, language, rules or JSON shape. Live DeepSeek output with a structure request is untested.
- Saved-exam limit (2026-11-12, owner rule): 5 exams on a free account, 15 while an IELTS or SAT plan is active (`savedExams` in `subscriptions/plans.ts`; University Prep keeps 5, by analogy with the vocabulary bank and not separately confirmed). The server reads the plan (`savedExamLimit`) and counts the account's `MyExam` rows for the page and for every generation, and refuses a full library with a 409 before any credits are held; the page also disables the button and names the upgrade. Clearing the browser or switching devices does not change the count. Exams above the limit (moved from a browser, or kept after a plan ends) stay usable, but no new one fits; an account never keeps more than 20.
- The setting hints, the upload fine print, the briefing note and the runner's filler lines were removed at the owner's request (2026-11-12). The library heading shows "N / limit · бүртгэлд" and the results page keeps one line saying the exam is AI-made and not teacher-reviewed.
- The server reuses the shared bounded document pipeline (`src/modules/documents/extract.ts`): signature check, 100 PDF pages, Office ZIP bounds and text decoding. The route checks same origin, a verified session, the exact multipart shape and the no-open-sitting rule before and after the provider call. A 15-per-Ulaanbaatar-day quota with one request in flight uses the shared `RateLimit` compare-and-set; the uploaded file is never stored.
- Storage (2026-11-12, owner request): exams live on the account in `MyExam` (migration `20261112100000_my_exams`), not in the browser, so they survive cleared site data and appear on every device. A row holds the questions with their key and explanations, the open sitting (`draft`: answers, current question, flags, start time, mode), the last graded sitting, the best score and the attempt count; deleting the exam removes all of it. The page is server-rendered from `myExamLibrary`, and the browser only ever receives the public questions; the key and explanations leave the server inside a graded result. `/workspace/review` lists graded mocks only, not these exams.
- Routes, all same-origin, session-checked, exact-shape and scoped to the student's own rows: `POST /api/workspace/my-exams` generates and saves; `PATCH …/[id]` starts a sitting or saves its progress (a save must name the open sitting by its start time, so a stale tab or a graded sitting gets 409); `DELETE …/[id]`; `POST …/grade` takes `{ id, answers, elapsedSeconds, timed }`, grades from the stored key and stores the result. The runner saves 0.6 s after the last change, retries a failed save and sends the last progress when the tab closes. The timer (suggested 90 seconds a question, 7.5 to 30 minutes) and the elapsed time come from the student's device: a study aid that auto-submits at zero, not a `MockAttempt` and not a server-enforced deadline.
- Exams made before the move stay in a browser (`education-my-exams-v1:<userId>`) with their key sealed in an AES-256-GCM token (`token.ts`, derived from `BETTER_AUTH_SECRET`, bound to the student's id). On the next visit the page sends each one to `POST …/import` and forgets it locally once the account has it. Only the token is believed: the questions and key come out of it, the last sitting's answers are graded again (a score claimed by the browser is ignored; the earlier best score is not carried over), an expired token is accepted, a token is imported once (`importKey`), and an unreadable token is reported and dropped. No new token is issued; `sealExam` remains for tests and `tests/my_exams_fixture.mjs`. A page loaded before the move still sends `saved` and is told to reload before any credits are held.
- The runner has one question per page, an always-visible answer grid, flags, keyboard answers (1–4, arrows, F, Esc), a confirm step, corrective review filters and the source's math through `MathText`/KaTeX. Generated exams and explanations are AI drafts and are not teacher-reviewed. A scanned PDF is refused; page photos are accepted instead (see "Image input").

### AI credits (2026-11-09)

- The owner asked for every AI feature to spend credits priced from DeepSeek. `src/modules/credits/pricing.ts` is the one price
  list: DeepSeek Flash peak list prices (USD 0.006 / 0.30 / 1.20 per million cache-hit input, cache-miss input and output tokens,
  checked 2026-11-09 on the official pricing page) and 1 credit = USD 0.001. Each action has a token budget (output = the
  provider `max_tokens` the service sends; input = a generous prompt estimate, all priced as cache misses); its fixed cost is
  the budget's cost rounded up: chat 5, review coach 6, practice assistant 5, SAT math tutor 3, Essay Studio ideas 3 /
  grammar 5 / feedback 6, Speaking Lab reply 3 / report 9, vocabulary import 4–47 (sold with a margin, below), file-to-exam 10–40 (two credits a question, sold with a margin, below),
  Reading Lab practice 4–15 (priced by length, below).
  Changing a price or budget there changes the charge, the badges and the plans page together.
- Vocabulary import is sold with a margin (owner rule 2026-11-11: an AI action should earn, not only cover its DeepSeek cost),
  and priced by what the student receives rather than by tokens. `vocabularyImportCredits` = 3 credits + 0.5 per new word for
  words 1–20, 0.4 for words 21–60 and 0.3 for words 61–120, rounded up (10 words = 8, 20 = 13, 40 = 21, 120 = 47, the listed
  maximum), and never less than twice the DeepSeek peak list cost of that scan (`vocabularyImportCostNano`: 1,500 prompt tokens
  + one token per two characters read or 1,024 per page photo + 66 output tokens per word), so 10 words from a full
  45,000-character file cost 16. Against that cost model the price is about 4–5× on ordinary files and at least 2× in the worst
  case. The maximum for the chosen count on a full-length file is held first (10 words 16, 20 → 18, 40 → 21, 120 → 47); the
  charge settles to the new words found and the rest returns in the same transaction. Words already in the bank cost nothing.
  The badge shows "хамгийн ихдээ N"; the page no longer explains how the price is worked out. `MARGIN_ACTIONS` lists the
  actions sold this way; every other action is still priced at its token budget's cost.
- An exam from a file is priced by its questions and sold with a margin (owner request 2026-11-12; it was 13 or 17 at cost).
  `examCredits` = 2 credits per question delivered (5 = 10, 10 = 20, 20 = 40, the listed maximum), and never less than twice
  the DeepSeek peak list cost of that exam (`examCostNano`: 1,500 prompt tokens + one token per two characters read or 1,024 per
  page photo, plus 800 + 360 output tokens per question, which is also the call's `max_tokens`), so 5 questions from a full
  45,000-character file cost 21 and 10 cost 25. The hold is the most the chosen count can cost (a document at the full-file
  price: 5 → 21, 10 → 25, 15 → 30, 20 → 40; page photos by their number: 10 → 20) and the charge settles to the questions
  delivered and the text read. The 2 and the margin are code constants (`EXAM_PRICE`); the owner did not name a figure.
  The retired `exam-10`/`exam-20` ids stay in the price list only so earlier charges keep their name in admin reports.
- Reading Lab practices are priced by length (owner rule 2026-11-10) with the same hold-and-settle: `readingPracticeCredits` =
  1,500 prompt tokens + the larger of one token per two characters of material or 1,024 per page photo (input), plus 600 + 2 per
  passage word + 200 per question (output). The rates fill the 24,000/6,000 budget, so a full 45,000-character file with a
  1,300-word passage and 14 questions costs the listed 15. The hold is that maximum for the material's known size (pasted text by its
  length, photos by count, a document at 15); the charge settles to what was read and written. The first live call (1,935 characters,
  351-word passage, 12 questions, $0.0027 real) now costs 6 instead of 15; a malformed-reply retry is not charged.
- Where credits come from (owner rule 2026-11-09; pure rules in `credits/buckets.ts`):
  - Free: 100 per Ulaanbaatar calendar month for every verified account, plus any admin bonus (`CreditPeriod`); they lapse on the 1st.
  - Plan: each active plan's `aiCredits` for its subscription term (`CreditPlanTerm`, keyed by `Subscription.startsAt`, which stays
    fixed while a plan is renewed before it ends). Every billing month of the term adds the plan's credits when that month begins;
    unused ones carry over and lapse only when the subscription ends. Nothing resets on the 1st. A plan bought again after it
    lapsed starts a new term with fresh credits. Plans stack; per-mock purchases add none.
  - Purchased: the credit pack (default 1,000 credits for ₮5,000, simulated payment like the plans; `CreditOrder`, `CreditWallet`).
    They never lapse.
  - A charge takes whatever lapses first (month or plan, by end date) and purchased credits last; `CreditCharge.parts` records the
    split, so a refund or a settle returns credits to where they came from (purchased first on a settle).
  - After this change deployed, plan credits already spent in the current month stay counted against that month's free credits,
    so students with a plan get their plan amount afresh once (a one-time gain in their favour).
- `chargeCredits` (`credits/service.ts`) wraps every DeepSeek call: after validation, access and provider-key checks it holds
  the cost (or, with `settle`, the most it can cost; never above the listed price) under a per-student row lock on
  `CreditWallet` (`SELECT … FOR UPDATE`), with a compare-and-set on each bucket's `used`, then runs the existing daily quota and
  provider call. A `settle` result lowers `CreditCharge.credits` to the final price and returns the difference while marking
  the charge SPENT; a failing settle keeps the hold. Any failure
  (402 not enough credits happens first; 429 busy/quota, provider errors, malformed output, too little file text, a timed
  sitting opening meanwhile) refunds the hold; credits are kept only when the student receives the result. `CreditCharge`
  records each action (HELD/SPENT/REFUNDED) with DeepSeek's reported prompt, cached and completion tokens and the list cost
  in micro-dollars, so real cost can be compared with credits charged. Daily request quotas stay as abuse limits.
- Every AI reply carries a `credits` receipt (spent, balance, allowance). `credits/client.tsx` keeps the balance in the
  Workspace shell, shows it in the rail ("AI кредит", linking to `/workspace/plans#credits`) and renders `CreditCost`
  badges beside each AI action with the remaining balance or a "хүрэлцэхгүй" warning. The meter's total is every available
  credit; its maximum is the month's and the plan terms' credits plus unspent purchased credits. The plans page shows each
  plan's credits and one "AI кредит нэмэх" row (`#credits`): the balance, the pack and an inline simulated purchase. The price
  list, rules and charge history were removed from it at the owner's request (2026-11-09); every AI button still shows its cost.
- Admin (2026-11-09): `/admin?tab=credits` shows a month's credits spent and refunded, the real DeepSeek list cost (failed calls
  included) against the credits' value, usage by action, the top students and every charge (search, status/action filters,
  CSV `kind=credits`); the overview has a one-line summary. On `/admin/users/[id]` the facts show this month's balance and an
  "AI кредит" view lists the student's charges (credit orders appear under payments and in the Payments tab's "AI кредит"
  list); "AI кредит олгох" adds 1–10,000 bonus credits to the current month only
  (`CreditPeriod.bonus`, audited `grant-credits`). The Prices tab edits the free and per-plan monthly amounts (0–100,000,
  `CreditAllowance`, audited `set-credits`); missing rows fall back to the code defaults, and charging, the plans page and the
  user record read the same table. The hold's compare-and-set runs as one SQL statement that includes the bonus.
- If the credit tables are missing (migration not applied), Workspace pages still render
  without the meter, but AI actions fail. Vercel applies migrations on deploy. Since 2026-11-09 `getDb()` (`src/lib/db.ts`)
  replaces a cached client whose generated models or columns differ, so a running dev server picks up `prisma generate`
  without a restart (before that, the admin Prices tab failed with `db.creditPack` undefined).

### Image input (2026-11-09)

- The owner asked for image upload in the AI features once DeepSeek V4.1 Flash (build 1017) read images. `deepseek-flash`, the model every
  feature already calls, takes JPEG, PNG and WebP as `image_url` parts of a user message only (checked 2026-11-09 on DeepSeek's
  Vision guide; at most 1,024 input tokens per image). Shared rules: `src/modules/ai-images` (pure `contracts.ts`, browser `client.tsx`).
- Conversations: Workspace AI chat (and the home composer), the review coach, the practice assistant and the SAT math tutor (one shared
  drawer) accept up to three images on the student's latest message, by picker, paste or drop. Earlier turns stay text: the prompt asks
  the model to restate what it read, and the browser keeps only 128px previews with the chat (threads in this browser only). An image-only
  message sends a readable default request. A photo never unlocks an answer: the practice "not checked" rules are unchanged.
- Study material: vocabulary import and exam-from-file accept one document or up to four page photos (4 MB together), sent as repeated
  `file` fields; `documents/upload.ts` proves every file by its signature before credits are held. Photos and documents cannot be mixed.
- The browser decodes each picture, resizes the longer side to 1,600px and re-encodes it as JPEG under 900 KB, which also drops camera
  metadata such as location. The server accepts only base64 data URLs whose declared type matches the bytes (no GIF, SVG or remote URLs),
  at most 3 MB decoded per message (body caps `CHAT_BODY_BYTES` / `ASSISTANT_BODY_BYTES`, under Vercel's 4.5 MB). Images are never stored.
- Price: each image on a conversation adds `IMAGE_CREDITS` (2: 1,024 input tokens plus 600 output tokens for restating the picture,
  at the peak price; raised from 1 at the owner's request on 2026-11-09) to that reply, so chat is 5 → 7 with one photo; page photos
  replace document text, so imports and exams keep their listed maximum (vocabulary settles with 1,024 tokens per photo).
- One owner-approved live chat call (2026-11-09, synthetic worksheet photo) read the problem and the working, found the error and answered
  correctly in Mongolian; the whole request was 1,009 prompt tokens. Not verified: hosted behaviour and HEIC decoding outside Chromium.

### IELTS Reading Lab (2026-11-09)

- The owner asked for a Reading lab in the Workshop with five example practices and credit-paid practices made from the student's own
  files or text. `/labs/ielts-reading` is a Workshop tile, a home lab link and a sign-in return path; it shares the labs' pilot switch
  (`readingLabEnabled`) and is `noindex`. Module: `src/modules/reading-lab`.
- Samples (`samples.ts`): five original passages written for this site (urban heat islands, the takhi's return, sleep and memory, the
  spread of paper, bird navigation), ordered Band 5.5–6.5 to 7+, each six paragraphs of about 520–550 words with 12–13 questions across
  seven IELTS types (matching headings, matching information, matching features, True/False/Not Given, multiple choice, sentence and
  summary completion, including a word box). Every answer has a Mongolian explanation and, except NOT GIVEN, an exact quote from the
  passage; `tests/reading-lab.test.mjs` checks quotes, keys and word limits. Like the Listening Lab drills, they are open to guests and
  during a timed mock, use no AI, and are marked in the browser.
- Runner: IELTS-style split screen (lettered paragraphs in a sticky pane beside the questions; tabs on phones), an optional 20-minute
  timer that only warns, three text sizes, then a score card, the key, an explanation per question and highlighted, numbered evidence
  ("Текстээс харах" scrolls to it). Typed gaps forgive case, hyphens, articles and sentence punctuation; samples list spelling variants.
- Own practice: `POST /api/labs/ielts-reading` (same origin, verified session) takes pasted `text` (1,000–45,000 characters) or one
  document / up to four page photos (`readUploadedSource`, 4 MB), plus the explanation language (Mongolian or English). Credits
  (`reading-practice`, 4–15 by length; see "AI credits") are held before DeepSeek is called, settled to the practice delivered and
  refunded on any failure; the button shows the most the current material can cost ("хамгийн ихдээ N") and the practice shows what
  was spent; a
  15-per-Ulaanbaatar-day quota with one request in flight and the open-sitting rule (before and after the call) apply. The model writes
  an English passage of 450–900 words from the material only (translating non-English material), plus about 12 questions in two or
  three of TRUE/FALSE/NOT GIVEN, four-option choice and two-word gaps. `parseGeneratedReading` keeps only gap answers copied from the
  passage and evidence found in it, groups questions by type, and refuses thin or single-type sets (one silent retry, started only within
  60 seconds).
- The key is sealed in an AES-256-GCM token (`reading-lab/token.ts`, its own HKDF key and AAD, bound to the student, valid 180 days);
  the browser gets the passage, answer-free questions and the token. `POST /api/labs/ielts-reading/grade` opens it and marks the
  answers (no AI, no credits). Practices, answers and scores live only in this browser (`education-reading-lab-v1:<userId>`, 20 own
  practices; guests share a "guest" slot for sample progress); nothing is stored on the server.

### IELTS Speaking Lab

`/labs/ielts-speaking` is an experimental, `noindex` studio. The homepage and IELTS program show a
Speaking invitation only when the studio is enabled: local pilot, or hosted pilot with
`SPEAKING_LAB_ENABLED=true`. Sign-in and registration preserve the return path to the studio.
The studio stays separate from graded practice and exams (its examiner also runs inside the IELTS mocks; see the end of
this section). It requires login and explicit transcript/microphone
consent, uses DeepSeek for text conversation, Kokoro for local British English speech, Whisper for
transcription. Since 2026-11-12 the partner is shown as sound, not a face: a live voice wave on stage (`avatar.tsx`, a canvas) and
a small bar mark per partner in its own colour and pattern (`partner.tsx`; no image files or third-party artwork). It writes no attempts, scores,
subscriptions or chat history. Bands shown are transcript-only AI estimates, not official IELTS
scores; pronunciation is not assessed. Raw microphone recordings are not persisted.
- Two modes, sent to the server as `mode` with the chosen partner as `voice` (both validated against fixed lists).
  **Full mock test**: the partner is an AI examiner using standard IELTS framing, neutral and without praise, under exam
  conditions; the screen shows no tips, ideas or retries, and every correction arrives in the report's conversation review.
  **Practise one part**: a named conversational partner with its own manner (`speakingVoices[..].manner`) that reacts to what
  was said, with live tips, ideas and retries. Both prompts keep the AI/not-an-examiner disclosure and forbid an invented human life.
- Human touches are browser-side: after the first reply the page pre-loads three or four acknowledgement clips ("Okay.",
  "Thank you.") through the normal voice route and plays one the instant a spoken answer ends; the partner nods on pauses;
  the wave carries loudness from the centre outwards: the partner's colour while it speaks, green from the student's microphone
  while listening, a ripple while thinking, a row of dots when quiet, and a small pulse for the nod after an answer. A short
  request to repeat or explain (`isClarificationRequest`) is answered but does not count as a mock question, and keeps the cue card.
- The server drops a tip unless it quotes the answer it is attached to (`tipQuotesAnswer`); the model otherwise re-corrects earlier
  answers. Every answer sent to the model ends with a JSON-format cue, because a bare one-word answer returned an empty reply.

#### Hosted speech provider (2026-11-12)

Running Kokoro and Whisper inside the web server does not scale: each instance loads about 460 MB of models and
`serialized()` lets one sentence or one answer through at a time, so students queue behind each other. With the server-only
`DEEPINFRA_API_KEY` set, `speech-provider.ts` sends the work to DeepInfra instead: `hexgrad/Kokoro-82M` (the same six voice
ids, returned as MP3) and `openai/whisper-large-v3-turbo` (English fixed). Nothing else moves: the Lab, mock and practice
routes, their access checks before and after, the daily voice/transcription counts, the frame format and the device-voice
and typing fallbacks are unchanged, and there is no queue on this path. A provider failure is retried once, then becomes the
same 503 the page already handles. Without the key the local models serve as before (local development needs no key).
The student's audio leaves this server only for transcription, with no account data attached; the microphone notices say so.
Listed prices on 2026-11-12 (check before budgeting): about $0.99 per million characters and $0.0002 per audio minute, under
one US cent for a full mock; the daily limits cap a student at roughly $0.12 a day. Called live once from a script on
2026-11-12 (six distinct voices, 1.3–2.0 s a sentence, correct transcripts) and through the Lab's routes in a browser (ten voice requests at once in 3.2 s).

#### AI examiner in the IELTS mocks (2026-11-11)

The owner asked for the Speaking Lab inside the IELTS mock exams. In the four Speaking stages of all twelve mocks the Lab's
examiner (the same avatars, Kokoro voice, microphone loop and Whisper transcription) can conduct the test. George is the
default; since 2026-11-11 the student picks any of the six partners (start page, invitation, practice offer, or "Шалгагч солих"
in the stage). The choice lives in the browser (`education-mock-examiner-voice-v1`) and is sent as `voice` with each speech
request, validated against the fixed list; only the greeting names the examiner, and the words still come from the script.
- **Scripted, no language model during a sitting.** The examiner reads the mock's own authored questions from the attempt
  snapshot with standard framing ("Let's talk about …" per Part 1 topic in Mocks 07–12, the cue card on screen, the
  rounding-off questions, the Part 3 link), repeats a question on request (`isClarificationRequest` or the Repeat button),
  asks one fixed follow-up ("Why is that?") after a short answer and says "Thank you" as an answer ends. The rule that no AI
  answers while a timed sitting is open is unchanged: the Lab's own routes still return 403 during a mock.
- **Server checks** (`exams/speaking-examiner-service.ts`, routes under `/api/mock-attempts/<id>/speaking/`): `voice` and
  `transcribe` need the Lab switch, same origin, a verified session, the student's own IELTS attempt with access, and the
  server clock inside a Speaking stage (deadlines are applied to a copy first, so an ended stage is refused). The page never
  sends text to speak: it names script lines by key (`intro`, `q:<id>`, `follow:<n>`, …) and the server resolves them against
  the current stage. `warm` loads the speech models from the Writing stage on. The Lab's daily voice and transcription
  counts are shared.
- **Clock and answers.** Stages, deadlines and saving are the runner's. Each transcript is saved through the normal autosave
  as that question's response, prefixed `[Transcript] ` so it is told apart from typed notes; a follow-up answer goes on a new
  line. Recording stops seven seconds before a deadline so the transcript can still be saved, a new question is not started
  in a stage's last seconds, and after a reload the script resumes at the first unanswered question. The stored whole-stage
  recording is unchanged. Speaking stays "pending human review" in the mock's report; no band is stored.
- **Choice.** The IELTS start page has a third check, on by default ("Speaking-ийг AI шалгагчтай өгөх"); the choice lives in
  this browser per mock (`education-mock-examiner-v1:<slug>`). With no choice (an attempt opened elsewhere) the Speaking stage
  shows an invitation above the unchanged prompt view. The student can switch either way at any time. If the natural voice
  is slow or missing, the line is read by the device voice and shown on screen; if the microphone fails, the panel says so.
- **Report after the mock.** The results page offers the Lab's report for the examiner's transcripts
  (`POST …/speaking/report`, 9 credits as `speaking-report`, through the Lab's one provider call). It is the only DeepSeek
  call of the feature, is refused before the mock has finished and while any sitting is open, rebuilds the conversation from
  the submitted snapshot (the page sends only the feedback language, target band and measured timing) and returns transcript-only
  band estimates, fixes, vocabulary and a model answer. The report and the timing are kept in this browser
  (`education-mock-speaking-v1:<attemptId>`); asking again, or on another device, costs credits again.
- **Practice mode.** The IELTS Speaking sections of `/exams/<slug>/practice` offer the same examiner ("AI шалгагчтай эхлэх";
  opened by a click, off by default). There is no clock: the Part 2 preparation minute is given inside the section and
  can be ended early, its notes stay in this browser, a finished part can be done again (its saved answers are cleared),
  and no audio is stored. Transcripts are saved as the section's practice responses, so the practice assistant can read
  them too. Routes `/api/exam-practice/<slug>/speaking/{voice,transcribe,report}` (`exam-practice/speaking.ts`) run
  practice mode's own check on every request (entitlement to the exam, no open timed sitting) plus the Lab switch and
  IELTS only; the report is built from the saved practice responses and costs the same 9 credits.
- Pure rules and tests: `exams/speaking-examiner.ts`, `tests/speaking-examiner.test.mjs`. The examiner has no browser suite yet.

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
| `scripts/build-entrance-mocks.mjs` | Converter from `MockExmps` to ЭЕШ site content, diagrams and catalogue (name the subjects to rebuild) |
| `scripts/build-ielts-mocks.mjs` | Converter from the local `MockExmps/IELTS` pack to IELTS Mocks 07–12, their visuals and 48 kbps audio |
| `public/ielts-mocks` | Answer-free IELTS Writing visuals and Listening plans |
| `src/modules/exams/hsk` | HSK 1 catalogue, loader, sitting, practice audio, results and picture/pinyin views |
| `assets/hsk`, `assets/hsk-audio` | Private HSK definitions with keys; Mandarin tracks, hashes and provenance |
| `scripts/build-hsk-mocks.mjs`, `scripts/generate-hsk-audio.py` | HSK pack converter (definitions, pictures, catalogue) and local Mandarin audio generator |
| `reference/official-papers` | Withdrawn official papers, kept as a format guide only; never served, built or deployed |
| `reference/retired-site-mocks` | Retired site mocks (the first four Mathematics forms and the old English set); never built |
| `src/modules/workspace` | Workspace shell, home, AI chat (contract, service, browser-stored threads), review and styles |
| `src/modules/documents` | Shared bounded document extraction (PDF, DOCX, PPTX, TXT, MD, CSV), the upload reader for one document or page photos, and text helpers |
| `src/modules/ai-images` | Image input for AI features: signature/size rules and prompt parts (pure), and the browser resize, attach button and previews |
| `src/modules/vocabulary` | Vocabulary limits and request shapes, AI scan contract, server-stored word bank with decks and study progress, the Leitner schedule, quiz builder and UI |
| `src/modules/my-exams` | Upload-to-exam contract, server generation, account-stored exams (`MyExam`), sittings and grading, the import of older browser-stored exams and the runner |
| `src/modules/reading-lab` | Reading Lab: five sample passages, question contract and marking, AI generation and sealed key, browser store and the split-screen runner |
| `src/modules/subscriptions` | Plans, purchases, entitlements and legacy grants |
| `src/modules/credits` | AI credit price list from DeepSeek prices, free/plan-term/purchased credit buckets, hold/refund ledger, the credit pack purchase and cost badges |
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
After editing the offline packs in `MockExmps`, run `node scripts/build-entrance-mocks.mjs <subjects>` and commit the
regenerated JSON, SVG and catalogue. The script validates 194 forms, 100-point totals and diagram files.
IELTS Mocks 07–12: `node scripts/build-ielts-mocks.mjs` (needs ffmpeg/ffprobe and the local `MockExmps/IELTS` pack);
it re-encodes a recording only when its source hash changes.

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
- All 194 imported ЭЕШ papers await teacher review, so their answers, explanations and the AI's answers
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
- Vocabulary is generated from the uploaded text only: imported words can be incomplete or wrong, are not teacher-reviewed, and scans or photos are not OCR'd. A translation written in the document is kept; a fallback translation that the AI writes for a word with no meaning in the document may be inaccurate. The chosen word count is a strict maximum (the model may return fewer); the free-text selection request is only a preference.
- Vocabulary quiz scores are self-study feedback in the browser; they are not saved, graded or official results.
- Exams from a file are generated from the uploaded text only and are also unreviewed AI drafts. Their
  results and history are saved on the account, the timer runs on the student's device, the score is practice
  feedback rather than an official result, and scanned documents are refused because there is no OCR.
- Reading Lab samples are original practice texts awaiting teacher review; generated practices are unreviewed AI drafts made only
  from the student's material, and their scores are browser-local self-study feedback, not band scores.
- Personal-data retention, account deletion policy, email deliverability and accessibility audits
  remain to be completed.
- This is a hosted test pilot, not a production education service.
