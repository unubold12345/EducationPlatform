# EducationPlatform — Project Guide

Consolidated 2026-10-24 from `AGENTS.md`, `readme.md`, `rules.md`, `start.md` and `HANDOFF.md`.
This file is the stable "what and how" reference. Read [OPERATIONS.md](./OPERATIONS.md) first for the
current delivery state, checks, credentials and next actions.

## 1. What this is

EducationPlatform is an independent Mongolian exam-preparation web application. It started with SAT
Mathematics and now covers SAT, IELTS Academic and university entrance preparation. It is not
affiliated with the College Board, IELTS, or the Mongolian ЕШ; all practice content is original unless
an official source is explicitly labelled. LawTest/Lexlab is a separate service: this project only
links to <https://lexlab.site/plan> and must never read LawTest code or data.

Accounts, payments and email are still pilot-grade. Hosted payments are simulated. Google and email
authentication require provider configuration; see the actual hosted checkpoint in
[OPERATIONS.md](./OPERATIONS.md).

## 2. Product surface

| Area | What exists |
| --- | --- |
| Free practice | `/practice`, a three-question sample with immediate grading |
| Program practice | 10 sets / 80 original questions: SAT 32, IELTS 24, university entrance 24 |
| IELTS workshops | Four focused workshops with saved work and grading |
| Full mocks | Digital SAT and IELTS Academic sittings with server-authoritative timers |
| Official papers | One 2020 EEC (ЭЕШ) Mathematics category with A, B, C and D; eight archive-image pages per variant |
| Accounts | Better Auth email/password, profile, Google OAuth, verification and password recovery |
| Plans and payments | Three monthly plans plus per-mock and per-paper simulated purchases |
| Admin | Protected overview, members, subscriptions, payments, monitoring, content and audits |
| AI tutor | DeepSeek math hints, explanations and mistake review |
| Speaking Lab | Isolated IELTS speaking studio at `/labs/ielts-speaking` |
| Study tools | Light/dark theme and a browser-only mathematics scratchpad |

Program practice, workshop grading and new saved attempts require the matching active plan; `/practice`
stays free. Full mocks accept a matching plan or a prior per-exam purchase. Subscription-backed
sittings keep continuation and review access after expiry, but new starts remain gated. Existing
purchases and LEGACY grants are preserved.

## 3. Assessments

### Digital SAT

- 98 delivered questions: 54 Reading and Writing in two 32-minute modules, a 10-minute break, then
  44 Math in two 35-minute modules.
- Operational raw counts are 50 Reading/Writing and 40 Math. Routing assumes 65% accuracy; each
  module includes two pretest questions.
- Math includes multiple-choice and numerical-response items.
- Results are raw scores. There is no 200–800 scaled score.

### IELTS Academic

- Listening: 40 questions in about 30 minutes, plus 2 minutes checking, using four bundled synthetic
  recordings.
- Reading: 40 questions over three passages (2,265 words) in 60 minutes.
- Writing: two tasks in 60 minutes.
- Speaking: a 12-minute simulation.
- No IELTS band score is calculated.

### Official 2020 EEC Mathematics · A–D

- `/exams/eec-math-2020` groups only 2020 Mathematics, with A, B, C and D variation links.
- Each variation has eight unchanged archive page copies served from the app, its own official key and a private saved
  100-minute answer sheet. Attempts, immutable snapshots, timers and history retain the variation.
- Existing `/exams/eec-math-2020-a` purchases and saved attempts remain valid. B/C/D use their own
  per-paper purchases; University Prep includes all four. The category itself is not a purchasable paper.
- Exact official weighting: 36 multiple-choice and 4 fill-in questions, 72 + 28 = 100 points.
- Variant-specific digit scoring: A/C question 2.1 groups d/e; B/D scores those cells separately.
  Question 2.3 groups d/e and f/g in all four. Raw /100 only, with no 200–800 conversion.
- Read-only official material. Do not treat it as editable authored mock content.
- The 32 JPEGs in `public/exam-assets/eec-math-2020/` are byte-identical to the reviewed originals.
  `assets/papers/eec-math-2020.json` records provenance, dimensions and SHA-256 hashes.
  Original source URLs remain in snapshots and attribution links. The workspace maps only the exact
  2020 A–D page URLs to same-origin files, so existing saved attempts work over HTTPS too.
  Browser image loading does not depend on the external archive or its TLS certificate.
- New starts require the University Prep plan or an existing 10,000 MNT per-paper simulated purchase.
  Saved work and review remain available after subscription expiry.

### Official English exams

- `/exams/eec-english` groups every verified, retrievable paper/key pair by year and variation.
  Published coverage is 37 variations across nine years: 2006 A–E; 2007 A–C; 2008 B–F;
  2009 B/D/H/I; 2010–2011 A–D; 2018–2020 A–D.
- Each variation uses the same timed sitting flow as Mathematics: source pages beside a variation-specific
  answer sheet, server deadlines, autosave/resume, final submission, immutable graded results and
  dashboard history. New starts require the matching per-paper purchase or University Prep plan.
  `/exams/eec-english/[slug]` opens its briefing; canonical `/exams/[slug]` also works.
- English practice lasts 80 minutes. Official 2011 and 2020 timing rules are linked; the original
  2006–2010 duration is not independently verified and is labelled as an 80-minute practice setting.
- 2006–2011 reports count correct choices/cells (one point each), explicitly distinct from historical
  official weighted scores. 2018 and 2020 use printed key weights. In 2020 D the ambiguous printed
  2.3e entry `e17` is ungraded, giving a verified maximum of 99. The 2019 listening recording is
  unavailable: questions 41–46 are retained but ungraded; the written-paper maximum is 88. These
  limits appear before starting, during the sitting and in the result; no scaled score is calculated.
- `english-structure.json` holds public answer layouts only; `english-keys.json` is loaded exclusively
  by server grading/admin code. Keys are snapshotted on start and released only after submission.
  Old Mathematics snapshots keep their 36-choice/four-seven-digit layout and original grading.
- The 2006–2011 БҮТ booklets are mirrored by `highschool.num.edu.mn`; original PDFs are retained in
  `assets/papers/english-originals`. Pages are rendered at 2× and clipped only at printed variation
  headings when a PDF page contains the end of one variation and the beginning of the next.
- The 2018–2020 JPEGs come directly from `help.eec.mn` and retain their original bytes.
  `assets/papers/english-archive.json` records every published pairing, source page/clip, image and
  original-file hashes, and exclusions. There are 218 served images under
  `public/exam-assets/eec-english/`; readers make no external image requests.
- No listing is published just because an exam title exists. Historical 2012–2017 source/key links
  are unavailable; 2021's accessible mirror key does not match the official paper option order;
  current 2022–2026 links/bank entries did not yield a complete verified pairing. The 2019 E key
  exists but its source paper returns 404, so E is excluded. These are availability/verification
  limits, not a claim that no such exams or answers exist anywhere.

## 4. Pricing and access

| Item | Price | Access rule |
| --- | --- | --- |
| University Prep | 40,000 MNT/month | Entrance sets, workshops, new official-paper starts |
| IELTS | 60,000 MNT/month | IELTS sets and workshops |
| SAT | 60,000 MNT/month | SAT sets and workshops |
| Full SAT or IELTS mock | 10,000 MNT each | Per-exam purchase, including retakes, or a matching plan |
| Official EEC paper | 10,000 MNT | Per-paper purchase or University Prep |
| Free practice | 0 | Always available |

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

- `/admin` is protected and offers an overview, members, subscription controls, simulated payment
  records, attempt monitoring, content previews/review notes, audit history, CSV exports and a
  configuration reference.
- Existing catalog items are edited through `ContentDraft` → review → immutable `PublishedContent`.
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

### DeepSeek mathematics tutor

- Fixed endpoint `https://api.deepseek.com/chat/completions`; server-side `DEEPSEEK_API_KEY`.
- Available for authored math practice and completed SAT Math mock review, in Mongolian or English.
- Supports next-step hints, worked explanations, typed working, mistake review and one ungraded
  similar follow-up question.
- Students must explicitly consent before any context is sent. No request happens on page load.
- Prompts contain only the relevant problem, options, selected answer, authorized reference
  explanation and at most four bounded prior turns. No account identity, cookies, scratchpad or full
  history is sent.
- 30 attempts per student per Ulaanbaatar day, a 90-second reservation lease, a 60-second provider
  timeout and a 3-second cooldown. Failed provider attempts count.
- Requests are denied while the same user has an active mock or official-paper sitting. Timers,
  grading, answers and immutable results are untouched.
- Conversations are temporary page state and are not saved to the account. Answers are learning
  feedback, never official grading. The scanned EEC paper is outside AI coverage until its questions
  and worked solutions are verified.

### IELTS Speaking Lab

`/labs/ielts-speaking` is an experimental, `noindex` studio. The homepage and IELTS program show a
Speaking invitation only when the studio is enabled: local pilot, or hosted pilot with
`SPEAKING_LAB_ENABLED=true`. Sign-in and registration preserve the return path to the studio.
The studio stays separate from graded practice and exams. It requires login and explicit transcript/microphone
consent, uses DeepSeek for text conversation, Kokoro for local British English speech, Whisper for
transcription and the licensed CC0 RobotExpressive 3D character. It writes no attempts, scores,
subscriptions or chat history. Bands shown are transcript-only AI estimates, not official IELTS
scores; pronunciation is not assessed. Raw microphone recordings are not persisted.

### Homepage, theme and scratchpad

- The homepage has additional education sketches through the page, a dedicated Speaking invitation,
  and one-time scroll reveals. Motion uses a small client component around server-rendered content,
  respects reduced-motion settings (including live changes), and leaves content readable without JS.

- The header theme switch defaults to the browser preference and saves an explicit choice in
  `education-theme` localStorage. Dark mode uses a deep indigo palette and bundled Manrope with
  Mongolian Cyrillic coverage. English passages keep a reading serif.
- Mathematics tests expose a collapsible scratchpad with graph paper, mouse/pen/touch drawing,
  last-stroke undo, confirmed clear and keyboard-accessible typed notes.
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
| `src/modules/practice` | Practice sets, workshops and grading |
| `src/modules/exams` | SAT/IELTS sitting lifecycle, timers and scoring |
| `src/modules/papers` | EEC paper access, answer sheet and paired-digit scoring |
| `src/modules/subscriptions` | Plans, purchases, entitlements and legacy grants |
| `src/modules/attempts` | Shared attempt ownership, validation and saved practice |
| `src/modules/admin` | Admin services, reporting, exports and audit |
| `src/modules/tutor` | DeepSeek prompt contracts, quotas and provider calls |
| `prisma` | Schema and migrations |
| `scripts` | Setup, provisioning, seeding and deployment/readiness checks |
| `tests` | Unit, contract and Playwright browser suites |

Server-side checks are authoritative. Ownership, plan entitlement, exam ownership, active-exam
blocks, quotas, same-origin mutation checks and bounded JSON bodies must remain on the server. Never
trust client-supplied scores, user IDs, content versions, prompts or prices. Immutable attempt
snapshots preserve what the student actually saw.

Before writing framework-specific code, read the installed Next.js guides in
`node_modules/next/dist/docs/`. This project uses APIs that can differ from older Next.js versions.

## 9. Local development

Requirements: Node.js 24.x, npm 11 or newer, and a local PostgreSQL-compatible PGlite instance
managed by the project scripts.

```powershell
npm ci
npm run setup:env
npm run db:start
npm run db:migrate
npm run db:generate
npm run db:seed
npm run dev
```

Open <http://localhost:3001>. Local services:

| Service | Address / port | Notes |
| --- | --- | --- |
| App preview | 3001 | `npm run dev`, or production `npm run build` then `npm start` |
| Local database | 51214 (and 51215) | PGlite, database `template1`; never reset casually |
| Recovery QA server | 3002 | Optional, built app plus loopback outbox and synthetic Google credentials |

With `AUTH_LOCAL_PILOT=true`, the app and seed scripts use a single database connection
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

The recovery QA server is started after a production build with
`node artifacts/start-auth-recovery.mjs`. It forces the loopback outbox, enables verification and
uses synthetic Google credentials. It is for local QA only; it cannot perform a real Google login or
send real mail.

## 10. Verification and delivery

Application changes require, at minimum:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
python tests/browser_smoke.py
python tests/accounts_smoke.py
python tests/exercises_smoke.py
python tests/exams_smoke.py
```

The four required browser suites run against a local preview on port 3001. Add the suites that match
the changed area:

| Suite | Target / purpose |
| --- | --- |
| `auth_recovery_smoke.py` | Verification, password recovery, auth/linking boundaries; port 3002 |
| `homepage_polish_smoke.py` | Scroll motion, reduced motion/no JS, themes/mobile, Speaking discovery and return path, Google-link UI recovery |
| `admin_smoke.py` | Admin access, reports, controls and mobile layout |
| `profile_smoke.py` | Profile updates and session revocation |
| `theme_smoke.py` | Light/dark persistence and contrast |
| `demo_accounts_smoke.py` | Local demo login and shared-data protections |
| `payments_smoke.py` | Simulated mock purchases |
| `subscriptions_smoke.py` | Plan purchase and access enforcement |
| `official_paper_smoke.py` | EEC archive, scoring, access and saved work |
| `publishing_smoke.py` | Draft → review → published content |
| `tutor_smoke.py` | Consent, live DeepSeek calls, quotas and active-exam denial |
| `speaking_lab_smoke.py` | 3D, conversation, speech and transcription |
| `hosted_demo_smoke.py` | Hosted demo accounts; only run after an authorized deployment |

Fixtures under `tests/` may advance deadlines or manipulate reserved QA rows only. They must never add
a runtime timer or payment bypass, shorten a public exam, or change a real learner's data. Inspect
affected screenshots whenever the UI changes. Documentation-only edits need a diff/whitespace check
and a secret scan, not an application rebuild.

See [OPERATIONS.md](./OPERATIONS.md) for the exact latest results and the delivery contract.

## 11. Known limits

- See `OPERATIONS.md` for the current Git and hosted deployment state. A source push does not prove
  a hosted deployment or enable Google/email without the corresponding provider settings.
- Hosted Google and Gmail credentials are configured; a hosted verification email reached the owner
  inbox. A completed real Google login, consent and token exchange still require an owner-controlled
  browser session. See `OPERATIONS.md` for exact deployment/check evidence.
- There is no verified-email production onboarding, no live billing and no real payment provider.
- Scores are raw; SAT scaled scores and IELTS bands are not calculated. The Speaking Lab's bands are
  AI estimates only.
- The scanned EEC paper has no AI explanations, no structured question text and no independently
  reviewed worked solutions.
- Creating new catalog items and replacing content media are unfinished.
- Content and official-page accuracy depend on manual review. Original archive and answer-key links are external and can be unavailable; exam page images are bundled.
- Local PGlite works with single-connection settings; broad production concurrency and scale are
  unverified.
- AI and speech features depend on third-party models and local model caches; quality, latency and
  cost are not production-benchmarked. Provider retention is governed by the provider's terms.
- Personal-data retention, account deletion policy, email deliverability and accessibility audits
  remain to be completed.
- This is a hosted test pilot, not a production education service.
