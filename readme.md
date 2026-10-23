# Education Platform

Independent education website for Mongolian students. SAT mathematics was selected first on 2026-10-22. The owner subsequently requested complete exercises across SAT, IELTS, and university entrance preparation. Education is a working brand.

## Current status — 2026-10-23

Implemented:
- Isolated local IELTS Speaking Lab at /labs/ielts-speaking: animated 3D partner, DeepSeek conversation, local Kokoro neural speech and local Whisper transcription; not part of practice/exams.
- DeepSeek math tutoring in Mongolian/English, guided hints, explanations and mistake review for authored math practice and completed SAT Math mocks, with consent and a daily quota.
- Protected admin management with default actual-data reporting, isolated test records and no simulated revenue.
- Validated editing/import, drafts, review and immutable publication for the existing 16 content items.
- Three monthly program plans: University Prep ₮40,000; IELTS/SAT ₮60,000 each, with mock payment, renewal, expiry and server-enforced program access.
- Full exam grid with Digital SAT, IELTS Academic and the official 2020 EEC Mathematics A past paper.
- Mongolian homepage, program catalog, and SAT / IELTS / entrance-exam detail pages.
- Ten complete topic practice sets with 80 original questions, server grading, explanations, retry, and reset.
- Four IELTS writing/speaking workshops with prompts, model responses, self-review checklists, writing word counts, and text downloads.
- The original three-question SAT sample remains at /practice.
- Better Auth email/password registration, login, and logout for a local pilot.
- Protected dashboard, answer saving, resume after refresh, and saved-result pages.
- Prisma/PostgreSQL models for accounts, sessions, programs, subjects, topics, question versions, exams, and attempts.
- Attempt content snapshots, revision checks for conflicting saves, server scoring, and duplicate-submit handling.
- Separate LawTest recommendation linking to https://lexlab.site/plan.

**Verified local fix:** application and seed pools use one connection when AUTH_LOCAL_PILOT=true, preventing the overlapping-connection protocol error observed with the embedded PGlite server. Both browser suites now pass, including concurrent submissions returning identical successful results. See [HANDOFF.md](./HANDOFF.md).

This is a local practice pilot with two full-length timed mocks and the official 2020 Mathematics A past-paper workflow. Official difficulty calibration/scaled scores, examiner grading, new catalog/media administration, real payment processing, email verification/recovery, and deployment remain unfinished.

## Read first

Commit/push workflow: owner authorization is required before committing or pushing. Stage only the authorized changes, verify the EducationPlatform remote/branch, and keep secrets, artifacts and model caches excluded. See [rules.md](./rules.md) for verification and delivery requirements and [start.md](./start.md) for the observed Git setup. Documentation-only updates use documentation/diff checks; application changes retain the required build and browser verification.

Source repository: [unubold12345/EducationPlatform](https://github.com/unubold12345/EducationPlatform) (private), branch codex/education-foundation. GitHub storage does not establish a public deployment; local setup below remains the verified runtime.

1. [HANDOFF.md](./HANDOFF.md): exact continuation state, verification, and next actions.
2. [start.md](./start.md): scope and milestones.
3. [rules.md](./rules.md): engineering rules.
4. [AGENTS.md](./AGENTS.md): coding-agent entry point.

## Local setup

### Hosted test pilot on Vercel

The owner selected this mode on 2026-10-23. Use a separate hosted PostgreSQL database and the canonical HTTPS BETTER_AUTH_URL, a private random BETTER_AUTH_SECRET, AUTH_LOCAL_PILOT=false and AUTH_HOSTED_PILOT=true. Enable simulated checkout with HOSTED_MOCK_PAYMENTS=true and the isolated speaking page with SPEAKING_LAB_ENABLED=true. Configure the private DEEPSEEK_API_KEY in Vercel, never in Git or a NEXT_PUBLIC_ variable. Hosted pages display a test-pilot notice; email verification/recovery and real billing remain unfinished. Local demo credentials remain hidden on hosted URLs.

vercel.json selects npm run build:vercel: validate required settings, generate Prisma, apply committed migrations, run the idempotent content seed, then build Next.js. Missing or local database settings fail the deployment rather than publishing broken database pages. Seed transaction limits accommodate remote database latency; existing versions and records are preserved. Use a separate database for any future preview environment. No production/preview credential fallback is provided.

Speech dependencies use statically traceable CJS loading; deployment traces include the six supported Kokoro voice files and IELTS Listening audio. On Vercel, downloaded speech weights use the ephemeral writable temporary directory, so a cold instance may download/load them again. Warm-up uses Next.js after() with a bounded route duration. Real hosted speech performance must be verified on the deployed build; local success alone does not establish Vercel capacity. See HANDOFF.md for actual outcomes and cloud resource IDs. Existing ignored .env and .env.local remain the local runtime; the separate ignored .env.vercel.local holds only this project's hosted setup.

Requirements: Node.js 24.x and npm 11+. Verified host versions were Node 24.19.0 and npm 11.17.0.

Run from this directory:

~~~powershell
npm ci
npm run setup:env
npm run db:start
npm run db:migrate
npm run db:generate
npm run db:seed
npm run dev
~~~

Open http://localhost:3001.

- setup:env creates an ignored .env and a fresh authentication secret without printing it. An existing file is left unchanged.
- db:start uses the named local Prisma ORM 7 instance education-platform, powered by PGlite. Docker is not required.
- Verified database/shadow ports are 51214 and 51215. The database name is template1 inside this independent local instance.
- An earlier attempt to request ports 51314/51315 did not take effect. Configuration now matches the observed ports. Check for conflicts before starting another local database.
- db:migrate applies the committed migration to the configured database. Confirm DATABASE_URL targets EducationPlatform before running it.
- db:seed adds the original three-question sample and all ten exercise sets (80 additional questions). It does not overwrite existing versions or student data. Run it after updating to this content increment; no schema migration is needed.
- npm run db:stop stops the named development database without deleting its data.
- Never reuse LawTest credentials or its database.

For a production-mode local preview, use npm run build followed by npm start. This still uses the local pilot settings; it is not a public production deployment.

## Authentication and data

Registration currently requires AUTH_LOCAL_PILOT=true and a loopback BETTER_AUTH_URL. The server rejects public authentication configuration until verification/recovery and launch configuration are implemented.

Better Auth manages password hashing and sessions. Authentication cookies use the education-platform prefix. Auth rate limiting uses the database. Protected attempt endpoints check the current user and mutations check the configured origin.

Guest /practice and /exercises/[slug] remain stateless. Choose the saved mode before answering to persist a set in /learn/attempts/[id]. All ten new sets use PostgreSQL saving and result history. Login/registration returns students to their chosen set. It saves a snapshot of question text, option order, correct answers, explanations, and scoring version; unfinished-attempt responses omit answer keys. All content is original practice material pending independent editorial review. IELTS workshop responses stay only in the current page and can be downloaded; they are not saved to accounts.

Test runs created qa-prefixed accounts at example.invalid addresses and related attempts. No email was sent. No deletion or cleanup was performed. Real-user data should not be collected in this pilot.

## Full-length exam grid

Open /exams. There is one full Digital SAT mock and one full IELTS Academic computer-format mock. Both require a local account and preserve private snapshots, answers, flags, server deadlines, and result history. Modules/sections cannot end early or be revisited after expiry. Closing the browser does not pause time.

| Mock | Content and timing |
| --- | --- |
| Digital SAT | 54 Reading & Writing questions (2 × 32 minutes), 10-minute break, 44 Math questions (2 × 35 minutes). Total 134 working minutes plus break. Each module has two unscored practice pretest items. Math includes 11 numerical responses across the delivered 44 questions. |
| IELTS Academic | Four original synthetic-voice Listening recordings totalling about 30 minutes, 40 questions, then 2-minute checking; Reading 40 questions across three texts totalling 2,265 words in 60 minutes; both Writing tasks in one 60-minute period; Speaking simulation 12 minutes (4-minute Part 1, 1-minute preparation, 2-minute long turn, 5-minute Part 3). |

SAT second modules have distinct lower/higher practice banks selected using a transparent 65% first-module operational-item threshold. This is not College Board IRT calibration or a 400–1600 score predictor. Results show operational raw counts (50 Reading/Writing and 40 Math) plus explanations for all 98 delivered questions, including pretests. A network-loaded Desmos graphing calculator and formula reference are available during Math; a permitted physical calculator may also be used.

IELTS Listening plays once and resumes at elapsed time after refresh. Short answers enforce their printed word limits. Writing stores both essays and shows word counts; official suggested targets are 150/250 words and 20/40 minutes within the shared hour. Speaking is a prompt-based microphone simulation rather than a live examiner interview. Its three recordings are private, played/downloaded after completion, and stored for human review. Keep the page open during a speaking part: refreshing interrupts the in-progress clip, and the page warns before leaving. Upload failures offer a local audio download. Neither Writing nor Speaking receives an invented automatic band score.

Definitions and authored content are in src/modules/exams. MockAttempt/MockRecording were added by prisma/migrations/20261022130000_full_mock_exams/migration.sql; apply db:migrate when updating an older checkout. Mocks snapshot code-defined content at start and require no extra seed. Bundled audio is in assets/exams and must accompany any deployment. The optional Windows/PowerShell rebuild script scripts/generate-exam-audio.ps1 needs System.Speech voices and ffmpeg/ffprobe; normal app use needs neither. The audio manifest ties files to the authored script hash.

Structures were checked against [College Board](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure), [SAT testing rules](https://satsuite.collegeboard.org/testing-rules/sat), [IELTS Academic](https://ielts.org/take-a-test/test-types/ielts-academic-test), and [IDP computer Listening timing](https://ielts.idp.com/bahrain/about/ielts-on-computer). Content is original and awaits independent editorial/psychometric review. Do not describe matching structure/timing as proven equivalent difficulty.

## Exercise library

| Program | Available exercises |
| --- | --- |
| SAT mathematics | Algebra, Advanced Math, Data Analysis, Geometry & Trigonometry: 8 questions each (32 total) |
| IELTS | Two reading passages and Academic English: 8 questions each (24 total), plus Writing Tasks 1/2 and Speaking Parts 1/2/3 workshops |
| University entrance preparation | Mathematics, English, physics: 8 questions each (24 total) |

Open /programs, choose a program, and start a set. Each full choice-based set requires an active matching monthly plan and supports in-page grading or account saving, question navigation, explanations, and retry. Suggested times are study guidance; these exercises have no countdown or official score conversion. IELTS reading includes multiple choice and True/False/Not Given practice. Language Lab is foundational grammar/vocabulary practice, not a standalone official IELTS test section.

The four /workshops/[slug] pages provide original prompts, a response area, self-review checklists, model responses and downloadable text. They remain untimed self-review exercises. The separate /exams flow adds Listening audio, timed mocks, account-stored essays and private Speaking recordings.

## Verification

~~~powershell
npm run lint
npm run typecheck
npm test
npm run build
~~~

Browser tests require a running app on port 3001 and Python Playwright:

~~~powershell
python -m pip install playwright
python -m playwright install chromium
python tests/browser_smoke.py
python tests/accounts_smoke.py
python tests/exercises_smoke.py
python tests/exams_smoke.py
~~~

Latest observed results (2026-10-22):
- Lint and TypeScript checks passed.
- All 20 unit tests passed, including exercise grading, full-exam structure, deadlines, routing, snapshots, response validation, result counts, and bundled audio manifest checks.
- Production build passed.
- Guest browser suite passed: navigation, grading, retry/reset, API validation, keyboard navigation, and desktop/mobile layouts.
- Account browser suite passed: registration, login/logout, save/resume, ownership, conflict recovery, identical concurrent-submit results, immutable retry results, history, and 320/390px layouts.
- Dashboard desktop/mobile and 320px login/register screenshots were inspected with no clipping or overflow.
- Fixed the guest test's ambiguous alert selector and the mobile login heading's hidden line break.

Tests default to http://localhost:3001. TEST_BASE_URL can select another running local preview; its origin must match that server's BETTER_AUTH_URL. No change to the ignored .env was needed for this verification.

All four browser tests write ignored artifacts/ files. Account tests use disposable local test addresses and do not send email. exams_smoke.py uses a fake microphone and tests full transitions by adjusting only its own qa-exam- attempts through tests/mock_fixture.mjs. This is an accelerated deadline test, not a real-duration multi-hour sitting. The fixture refuses non-local databases and non-QA attempts; there is no test clock override in application routes.

## Dependencies

Pinned application versions include Next.js 16.4.2, React 19.3.1, Better Auth 1.7.12, and Prisma ORM 7.10.1. Prisma 7 is intentional: it supports the selected Prisma Client adapter and local database workflow. Do not blindly upgrade to Prisma 8 or its release candidate.

npm audit --omit=dev was repeated after adding authentication dependencies and reported zero vulnerabilities on 2026-10-22. The full earlier audit reported five high entries in the development ESLint dependency chain (GHSA-vfj7-8cjw-p6xm); the full audit was not repeated in this verification. The suggested incompatible downgrade was not applied.

## Structure

~~~text
prisma/schema.prisma         Auth, content, exams, and attempt models
prisma/migrations/           Initial accounts-and-saved-practice migration
prisma/seed.ts               Non-overwriting demonstration seed
scripts/local-env.mjs        Local-only environment generator
src/app/                     Pages, layout, and route handlers
src/lib/auth.ts              Better Auth configuration and local pilot gate
src/lib/db.ts                Prisma client and connection pool
src/lib/api.ts               Authentication, origin, body-size, and error helpers
src/modules/attempts/        Snapshot, save, submit, validation, and student UI
src/modules/practice/        Guest runner and original three-question sample
src/modules/exercises/       Original content, grading, passage UI, IELTS workshops
tests/                       Unit and browser integration tests
~~~

Generated Prisma files, .env, .next, node_modules, and screenshots are ignored. Git is initialized on codex/education-foundation; no commit or remote has been created.

## LawTest and content

LawTest remains independent: repository, users, purchases, credentials, database, and deployment. Its plan URL returned HTTP 200 on 2026-10-22.

SAT topic names were checked against [College Board's Math overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview). The original sample, 80 exercise questions, and four IELTS workshop tasks are authored practice material pending independent editorial review. IELTS task formats were checked against the official IELTS Academic Writing and Speaking guides linked from each workshop. University-prep sets cover foundational mathematics, English, and physics; they are not mapped to an official annual examination blueprint. This site does not claim official affiliation or convert sample results into SAT scores. Public pages remain noindex.


## Continuing development

Open C:/Users/PC/Desktop/Codes/EducationPlatform and read HANDOFF.md first. Preserve the existing source, database, and ignored .env. The concurrency blocker and both browser suites are now resolved. Continue independent content review and publishing workflows. Full timed mocks and IELTS Listening are now implemented; independent content review, calibrated scores, human grading, additional entrance subjects, and launch readiness remain unfinished.

### Full-exam verification — 2026-10-22

Lint, type checks, production build and all 20 unit tests passed. All four browser suites passed, including both complete exam flows, actual Listening playback, decoding of stored Speaking audio, private ownership, hidden keys, standard deadlines, clock tampering/early-transition prevention, refresh/resume, raw results, dashboard history and active 320/390px layouts. Unit tests also verify the bundled audio durations and script manifest hash. The full-exam suite uses accelerated deadlines and fake microphone input only in isolated local QA fixtures; no real-duration sitting or independent editorial/psychometric evaluation was performed. Desktop/mobile screenshots were inspected.

### Exercise expansion verification — 2026-10-22

All three browser suites passed on the final build, including tests/exercises_smoke.py. The new suite completed all 80 questions and four workshops, verified hidden answer keys, input/body bounds, correct and incorrect scoring, workshop downloads and checklists, registration return-path safety, cross-program save/resume/history, identical concurrent submissions, and all new pages at 320/390px. Lint, type checks, all ten unit tests and the production build passed. New desktop/mobile library, reading, writing, physics and account screenshots were inspected. A legacy bodyless-start regression was corrected before the final passing account test. No dependencies changed; the prior production dependency audit was not repeated.

## Appearance

Use the sun/moon button in the header to switch between light and dark themes. A fresh visit follows the device preference; an explicit choice stays saved in this browser across pages and reloads. Theme changes do not navigate or restart an exam.

Appearance refinement, 2026-10-22: dark mode uses a deep indigo palette (#100e24 surfaces, #0a0819 background accents). The interface and headings use bundled variable Manrope with Mongolian Cyrillic glyph coverage, including Ө/Ү/Ё. Keep its OFL license beside the font in src/app/fonts. English exam passages retain their reading serif. See HANDOFF.md for verification.

## Modern interface refresh — 2026-10-22

The owner requested a more modern UI/UX and darker theme. The shared shell now has a compact brand, segmented navigation with active-page indicators, and mobile access to My preparation. The homepage replaces the decorative workbook with working SAT/IELTS launch links and a short guest-practice option. The exam library has a clearer title/count hierarchy, restrained cards, aligned full-width actions and compact section timing. Program, account, workshop and timed-workspace surfaces share the same updated visual system. Dark mode uses #07070d near-black, #101019 cards, #171529 indigo accents and readable neutral text. Bundled Manrope and saved light/dark preference remain. See the latest HANDOFF.md checkpoint for actual verification.

## Profile and personal dashboard

The header profile icon opens /profile, or returns there after login/registration. Edit your display name, change your password with your current password, and sign out. Password changes revoke other sessions. Email changes/verification remain unavailable. The profile shows your join date and completed exercise/exam counts. The dashboard shows real completion/open counts, resumes your latest open work, and retains private histories. Background education sketches are drawn inline in SVG, without image uploads or external image requests; active timed exams omit them. See HANDOFF.md for browser verification.

## Mock exam pricing and checkout

Each full mock costs ₮10,000 for that specific exam, including retakes. SAT and IELTS have separate access rights. Guests see Нэвтрэх in the header; after login, the profile link replaces it. Choose an exam, open its checkout, and select the clearly marked simulated payment. No money is charged and no card/bank details are collected. A success opens the exam briefing; the clock starts only when you start the exam. The checkout can simulate a decline, and a cancelled/declined checkout does not unlock access. Receipts/access rights appear in the private profile. Full topic exercises now require their matching monthly subscription; the short /practice sample remains free.

Mock confirmation is restricted to the existing loopback local pilot; it is not a real payment integration. Server routes enforce ownership, origin, fixed prices, separate exam access and idempotent confirmation. For a real launch, replace the mock processor with a provider whose notifications are verified server-side. The additive MockPurchase migration preserves prior saved-attempt access with LEGACY grants and leaves student records/deadlines intact. Run tests/payments_smoke.py for price/access/checkout regressions; see HANDOFF.md for final results.

## Five local demo accounts

The local login page includes five test-account buttons (qa-demo-01@example.invalid through qa-demo-05@example.invalid). Click one to fill its email/password, then click Нэвтрэх or press Enter. These are dedicated shared local test accounts. Test 01 now has admin membership; 02–05 remain learners. Admin membership does not bypass exam or subscription purchase checks. Buttons appear only in the loopback local pilot and never on registration. Their intentionally public test credentials live in src/data/demo-accounts.json, separate from private .env secrets.

After starting the local app/database, npm run demo:accounts creates missing accounts through the normal auth API and preserves existing ones. It refuses a non-pilot or unexpected database target. It does not reset an existing demo password if someone changes it. Authentication rate limits remain active; space repeated provisioning and signup-heavy suites accordingly. tests/demo_accounts_smoke.py verifies all five real logins and keyboard/mobile behavior. See HANDOFF.md for actual outcomes.

## Monthly subscriptions — 2026-10-23

Open /plans for three program-specific plans: University Prep 40,000 MNT/month (all current math/English/physics prep), IELTS 60,000 MNT/month (all IELTS practice/workshops and full Academic mock), and SAT 60,000 MNT/month (all SAT practice and full Digital SAT mock). Each is separate; there is no cross-program all-access flag. Current prices/features are centralized in src/modules/subscriptions/plans.ts.

Mock payment opens one calendar month in Ulaanbaatar time, clamped to the last day when the next month lacks the payment date. Early renewal adds a month from the current end; renewal after expiry starts now. There are no automatic charges or automatic renewals. Current status/expiry and renewal links appear in profile and dashboard. Success/decline confirmation is explicitly simulated and restricted to the loopback local pilot; real money/card details are not involved.

Full exercise pages, IELTS workshops, grading APIs and new saved sets require the matching active plan. The original /practice sample remains free. The existing 10,000 MNT individual mock purchase is still available and permanent; subscribers do not pay that additional exam fee. Existing saved attempts/results remain accessible, and a sitting started under a subscription may finish/review after expiry. New content or new mock sittings require renewed membership or a valid individual exam purchase. tests/subscriptions_smoke.py checks scope, expiry, renewal and idempotency; its database expiry fixture only affects isolated qa-sub- users and is never an application route.


## Local administration — 2026-10-23

Open http://localhost:3001/admin. Use the existing Test 01 login button (qa-demo-01@example.invalid), then the profile’s Удирдлагын төв link. Its existing demo password is unchanged. The other four demo accounts remain learners. Shared admin credentials are for this loopback pilot only.

The eight sections provide live counts, member search/pagination, subscription lists and one-month grants/extensions/expiry, session revocation, immutable mock payment records, attempt monitoring, content quality review, audit history, and price/security reference. Each management action requires a reason and confirmation. Grants do not fabricate paid orders or alter prior receipts; expired rights still preserve existing saved work and permanent mock purchases. Session revocation signs a member out but does not ban future login.

Content review covers ten exercise sets, two full mocks and four workshops. Protected previews show questions, keys, explanations, branches, instructions, passages, timing and workshop models to admins. Review statuses/notes are separate from immutable content and learner snapshots. The later publishing increment adds validated imports, field editing, saved drafts, review and immutable publication for these existing 16 catalog items; reviewed status does not claim official calibration or qualified IELTS grading. Creating additional catalog items and replacing media remain unfinished.

CSV exports include the latest 1,000 records for members, subscriptions, monthly orders or audit history (not the current search filter). They exclude passwords/tokens and protect spreadsheet formula cells. Each export is recorded. The default real-data scope excludes reserved .invalid test accounts and MOCK/LEGACY payments; the explicit test-data view retains simulated transactions. Audit history remains the actual complete activity log. Individual mock purchases remain visible in the payment section.

Migration 20261023040000_admin_console adds AdminMembership, AdminAudit and ContentReview without changing old records. Apply with npm run db:migrate and regenerate the client. Explicit local provisioning: npm run admin:grant -- existing-test@example.invalid. This command requires the confirmed independent local pilot/database and an existing example.invalid user. No web endpoint can grant admin membership; signup/profile data cannot set it. The command records who was provisioned in the audit trail. npm run demo:accounts alone does not promote accounts.

The background uses stronger indigo inline sketches in light mode and a separate mobile arrangement, with one visible SVG per viewport. Dark mode remains subdued, and timed workspaces continue hiding the decoration. No uploaded, remote or raster background asset was added. Run tests/admin_smoke.py and the existing browser regressions. See HANDOFF.md for actual outcomes.


Admin increment verification, 2026-10-23: final lint, type checks, build and all 23 unit tests passed. All ten browser suites passed: guest, accounts, exercises, full exams, admin, profile, theme, demo accounts, payments and subscriptions. Inspected admin desktop/content/mobile and vivid light-background screenshots. The app remains on port 3001. See HANDOFF.md for full evidence, fixture rules, migration and limitations.


## Editing and publishing existing content — 2026-10-23

Admin → Контентын хяналт → Материал, хариу хянах now includes a field editor for all ten topic sets, two full mocks and four workshops. Edit titles, prompts, choices/keys, explanations, passages, instructions and workshop material. Preview the draft, supply provenance/permission/review responsibility and a reason, save, confirm review, then publish. Import/export supports the same validated content structure. IDs, program, question counts/types, timer standards, audio references and source URLs remain fixed; additional catalog creation and media replacement are not implemented.

Drafts are private and use revision checks. Saving resets review. Publishing requires the exact reviewed draft and creates a new immutable version, with a new set of QuestionVersion/Exam rows for exercises. Prior learner snapshots, answers, results and clocks remain unchanged. Starting the same topic resumes its open sitting across published versions. Stateless exercise pages submit their exact version for grading; historical published versions remain valid. New pages/sittings use the latest published definition without a rebuild. Restore one of the last five published versions into a draft, then review/publish it as a new version.

Real-data reporting is the default. It excludes reserved .invalid test accounts from user/subscription/attempt totals and lists; MOCK and LEGACY transactions never become real revenue. The explicit Туршилтын өгөгдөл view retains test users and simulated payment records. Test-payment lists include simulated orders even for ordinary accounts. Exports use the selected real/test scope, while search filters remain page-only. Audit records are actual recorded actions across both scopes. Empty/zero results are shown when no matching records exist; no sample records are invented to populate the UI.

Owner confirmed payments should remain simulated because no QPay contract is available. Checkout and 10,000/40,000/60,000 MNT prices are unchanged; no real payment provider was connected. The additive 20261023060000_content_publishing migration adds ContentDraft and PublishedContent. Run tests/publishing_smoke.py alongside the previous suites. Its temporary published title/key edits are restored through the same review/publish workflow, with editorial review left pending; immutable test version/audit history remains.


Publishing/reporting verification, 2026-10-23: lint, type checks, production build and all 26 units passed. All eleven browser suites have passing outcomes in this increment, including the new publishing workflow and final admin session-revocation rerun after the unchanged rate-limit window cleared. Full exams, payments and subscriptions passed in the final managed run. Inspected real-data dashboard and desktop/320px editor screenshots. Preview remains on port 3001; payments remain explicitly simulated. See the latest HANDOFF.md for exact build coverage, interrupted runs and remaining scope.


## Official EEC mathematics paper — 2026-10-23

Open http://localhost:3001/exams/eec-math-2020-a. This is the complete 2020 ЭЕШ Mathematics, variant A, found in the Education Evaluation Center’s public help.eec.mn archive. The application displays all eight original archive image pages directly, including the formula page, diagrams and four fill-in problems; it does not substitute generated questions or OCR-corrupted formulas. Source: http://help.eec.mn/ and modelItems/2020/mat/A/1.jpg through 8.jpg. Timing is corroborated by Dornod Education Department’s official 2020 exam report linked from the briefing.

The online answer sheet has 36 A–E choices and four seven-digit a–g answer groups, with a continuous server-side 100-minute clock. Official raw scoring is 72 points for choices (1–11 one point; 12–25 two; 26–36 three) and 28 points for the four fill-in problems. Some digit pairs receive their combined mark only when both are right; leading zeroes are preserved. The official key is referenced at modelItems/2020Key/mat/mat-1.jpg through mat-3.jpg. Results are raw /100, not a fabricated 200–800 scale conversion. The key and point groups are snapshotted privately and only returned after submission/expiry.

The original material is free at its official source. The app’s timed/saved/grading tools accept the existing 10,000 MNT per-paper simulated purchase or the 40,000 MNT/month University Prep subscription. No clock starts on payment. Saved attempts remain privately accessible after plan expiry; a new sitting requires current access or the permanent per-paper purchase. Payment remains simulated. The paper is linked from the exam grid, University Prep, profile receipts, dashboard resume/history/counts and admin attempt monitoring. Admins can inspect the original source and key but cannot edit the official paper through the original-material CMS.

Migration 20261023080000_official_papers adds PaperAttempt and its user relation without changing old tables/records. It snapshots paper metadata/source URLs and scoring keys, stores bounded answers/revisions and an authoritative deadline, and makes final submission immutable/idempotent. Duplicate starts resume the same open sitting. Late input is ignored in favor of the answers already saved on the server. Conflicting edits return 409 with a load-saved-version action. The interface supports original-page selection, zoom, private autosave, digit-cell entry, final confirmation and source-key review.

Archive pages remain external assets and require an internet connection. No exam-page images were added to public/ or uploaded elsewhere. Only ignored inspection screenshots/downloads exist in artifacts/. The legacy archive’s HTTPS certificate was expired during verification, so this local HTTP pilot references its working HTTP image URLs; no certificate verification was disabled. A public HTTPS launch needs an authorized secure source/mirror. Original archive assets could change or become unavailable; the app snapshots their URLs and scoring facts, not immutable copies of the external image bytes. These source-image pages also do not provide a semantic screen-reader transcription. Failure states retain direct official links/retry controls.

Run tests/official_paper_smoke.py and the four required browser regressions. The new test loads all eight actual external archive pages without intercepting/replacing them, completes all answers, checks a 100/100 result, privacy, autosave/resume, immutable concurrent submission, expiry, permanent retakes, included University Prep access and post-expiry saved-work access. tests/paper_fixture.mjs is a guarded local-only deadline/subscription expiry helper for qa-paper- example.invalid users. See HANDOFF.md for actual outcomes.

Official-paper final verification, 2026-10-23: lint, type checks, production build and all 30 unit tests passed. Nine browser suites passed in this increment: browser, accounts, exercises, exams, profile, admin, theme, payments and official_paper. The final enhanced official-paper suite and corrected three-card payment suite passed on the final build, including all eight live archive pages, exact 100/100 grading, included University Prep access, post-expiry saved access and concurrent finalisation. Demo-account, standalone subscription and publishing suites were not rerun this increment; their prior checkpoint outcomes remain separate. Inspected official-paper briefing, desktop and 320px screenshots. Preview remains on port 3001 with the independent database on 51214. Payments remain simulated; see HANDOFF.md for source limitations and exact coverage.

## Mathematics scratch paper — 2026-10-23

The owner requested a Ноорог цаас option during mathematics tests. The official 2020 A paper and both SAT Math modules now expose a collapsible shared scratchpad with graph paper, mouse/pen/touch drawing, last-stroke undo, confirmed clear and keyboard-accessible typed notes (8,000 characters). It does not appear in IELTS, SAT Reading/Writing or the scheduled break. The SAT math modules share scratch work for their sitting; different attempts have separate browser-storage keys. Scratch work never enters graded responses or server scoring and does not pause/reset deadlines.

Drafts are stored only in this browser under education-scratchpad-v1:<attemptId>, not in the student account/database. The UI explains browser-only storage, public-device clearing and save failures. Close/reopen and refresh retain completed strokes/notes when browser storage is available; private/incognito/storage restrictions may prevent persistence. Drawing is bounded to 200 strokes/12,000 points and 1,500 points per stroke. No schema, access, payment, answer-saving or timer service changed. tests/scratchpad_checks.py exercises native mouse and touch drawing, coordinate alignment at 320px, undo, close/reopen, refresh persistence, clear cancellation/confirmation and unchanged authoritative responses/deadlines, within the existing exam and official-paper suites. Final verification outcomes follow in HANDOFF.md.

Scratchpad verification outcome, 2026-10-23: final lint, type checks and production build passed; all 30 existing unit tests passed. Browser, accounts, exercises, full exams and official-paper browser suites have passing outcomes in this increment. The shared scratchpad checks passed in SAT Math and the official paper: native mouse/touch drawing, 320px pointer alignment, undo, close/reopen, persisted notes/strokes after refresh, clear cancellation/confirmation and unchanged server responses/deadlines. Inspected SAT 320px and official-paper desktop screenshots; layouts fit. The final official-paper suite passed on a separate serial rerun. Preview remains on port 3001. Scratch work is browser-only, not synchronised to accounts; grading and exam clocks remain authoritative. See HANDOFF.md for interrupted-run details.

## Lexlab homepage branding — 2026-10-23

Owner requested the correct lexlab.site logo and domain on the homepage recommendation. Replaced the generic section symbol and LawTest display name with the actual Lexlab logo and visible lexlab.site domain; the existing https://lexlab.site/plan external destination and separate-service/access disclosure remain. The two public original assets were retrieved from https://lexlab.site/logo-light.png and https://lexlab.site/logo-dark.png into public/branding/lexlab-light.png and lexlab-dark.png without redrawing/recolouring them. They match the light/dark logo URLs in the public homepage HTML. Both are rendered with next/image and CSS theme selection, including on mobile. This reads only the public site; no LawTest repository or database access occurred. No account, payment, exam, scoring, timer or environment changes. Browser smoke expectations now use the actual domain and check both themed images load. Final checks are recorded below/in HANDOFF.md.

Lexlab branding final verification, 2026-10-23: lint, type checks, production build and all 30 unit tests passed. All four required browser suites passed serially on the final rebuilt preview: browser, accounts, exercises and exams. Homepage checks verified the visible lexlab.site domain, unchanged https://lexlab.site/plan destination and successfully loaded original light/dark logos; inspected artifacts/lexlab-light.png and lexlab-dark.png. Mobile navigation/layout checks passed at 320/390px, alongside account concurrent submissions, all 80 exercises/four workshops and full SAT/IELTS journeys. Updated all five owned Markdown files. Final preview remains on port 3001 (PID 5156 at last check), independent local database on 51214. Recheck process ownership before future restarts. No database/schema/dependency/environment changes, no LawTest repository/database access, no real payments, email, commit or deployment. This increment changes homepage branding only; other browser suites were not rerun.

## DeepSeek mathematics tutor and mistake review — 2026-10-23

Owner selected the first-priority math tutor/mistake-review features, then explicitly chose their DeepSeek API instead of OpenAI. A server-side DEEPSEEK_API_KEY was already present; only a boolean presence check was printed. The existing ignored .env was not edited and no credential was printed/copied. Public .env.example now documents empty DEEPSEEK_API_KEY and optional DEEPSEEK_MODEL. Requests use the fixed https://api.deepseek.com/chat/completions endpoint; default model deepseek-flash follows the currently fetched official guide at https://api-docs.deepseek.com/ and schema at https://api-docs.deepseek.com/api/create-chat-completion/ . No OpenAI API calls or SDK dependency were added.

Math practice (/practice plus SAT/entrance sets) and saved math attempts now have an expandable AI tutor. It supports Mongolian/English, next-step hints, worked explanations, discussion of typed working and one ungraded similar follow-up question. Saved results and completed SAT Math mock reviews have question-specific Алдаагаа ойлгох controls. IELTS has no tutor in this increment. The scanned official 2020 EEC paper is intentionally outside AI explanation coverage until its question text/diagrams and worked solutions are verified; the existing original-page/raw-score workflow is unchanged. No imaginary scanned-paper solutions are supplied.

Students explicitly tick a disclosure before sending context/typed chat to DeepSeek. No automatic model requests occur on page load or expansion. Only the relevant problem, options, selected answer, authorized reference explanation and at most four bounded previous turns are sent; no account ID/name/email, auth cookies, whole result history, scratchpad or unrelated records are included in model prompts. Conversation is temporary page state, reset on refresh/question change, not saved to the student account/database. The provider's own data handling is separate; this increment makes no zero-retention claim. AI answers may be wrong and are clearly identified as learning feedback, never official grading or calibrated scores.

POST /api/math-tutor requires the existing authenticated session, same origin, bounded 16KB JSON and a strict source/action/language/history contract. The server resolves published exact-version practice content or owner-scoped immutable saved/mock content; arbitrary supplied prompts/keys/scores/user IDs are rejected. Existing matching plan access is required for program practice; existing saved sitting rights are preserved. Mock review requires a completed owned SAT Math sitting and the existing mock entitlement. Hidden saved keys are never used for unfinished saved practice; all hint contexts omit keys/reference explanations. Student conversations are untrusted and cannot supply privileged message roles. Plain text is escaped by React rather than rendered as HTML.

AI requests are denied while any same-user mock is still IN_PROGRESS or an unexpired official-paper sitting is open, including requests made from another tab. The guard is checked before the provider and again before returning a response, covering an exam started while the answer was in flight. Opening a finished-over-time mock may be needed to commit expiry before using AI. Timed workspaces have no AI controls. Timers, grading, answer saving and immutable results remain untouched. Hints use guided questioning; these are model instructions, not a proof that a generative model can never reveal an answer or make a mathematical error.

Cost/concurrency controls reuse reserved education-tutor:<userId>:<Ulaanbaatar-day> rows in RateLimit, separate from auth keys. Database compare-and-swap reserves one request at a time, counts at most 30 attempts per student/day and uses a 90-second lease, a 60-second provider timeout and three-second cooldown after completion. Failed provider attempts count toward the limit. Provider input/output are bounded; truncated/empty completions are rejected and upstream errors are sanitised without echoing provider bodies or secrets. No provider tools, remote user-controlled endpoint, web browsing or model writes to scores/access exist. No schema migration or dependency change was needed. Per-day quota row retention and broader pedagogical/Mongolian quality evaluation remain future operational work.

New tests/tutor_smoke.py makes three bounded REAL DeepSeek calls for a Mongolian hint, saved mistake explanation and English follow-up, then checks auth, origin, strict shapes, source/version/program ownership, timed blocks, completed SAT controls, score immutability, 320px layout and exhausted daily quota. tests/tutor_quota_fixture.mjs can change only reserved qa-exam-ai- example.invalid counter rows on the confirmed independent local database; it cannot change a real learner's limits or grades. Existing mock expiry fixtures are reused without runtime timer bypasses. Four new contract/prompt/day units plus an isolated mocked-provider unit cover bounds, no system-role history, safe defaults, timeout/upstream failures and incomplete output. Mocked transport units are distinct from the three successful live API calls. Screenshots ai-tutor-desktop.png, ai-tutor-320.png and ai-mistake-review.png were inspected. Final regression outcomes follow below.

DeepSeek final verification, 2026-10-23: final lint, type checks, production build and all 35 unit tests passed. All five browser suites passed serially on the final build: tutor_smoke.py, browser_smoke.py, accounts_smoke.py, exercises_smoke.py and exams_smoke.py. The tutor suite made exactly three successful live DeepSeek requests (Mongolian hint, saved-answer mistake explanation and English follow-up), not canned responses. Its other calls verified strict denial before provider use, consent UI, 320/390px fit, private source ownership/program checks, active-mock denial from another page, 44 completed SAT Math review controls, unchanged saved 0/3 score and a guarded exhausted QA daily quota. Full SAT/IELTS journeys and existing concurrent submissions also passed. Other browser suites, including the official-paper suite, were not rerun in this increment; official-paper source/workflow code was not changed.

Inspected ai-tutor-desktop.png, ai-tutor-320.png and ai-mistake-review.png. A safe boolean scan confirmed the actual configured DeepSeek key is absent from .next/static browser assets; no key value was printed. Provider failure/truncation/empty-response behavior was tested with isolated fake transport in unit tests, separate from the real live success checks. Initial type checking rejected a BigInt literal under the project target; replaced it with BigInt(0), then all final checks passed. No assertion/limit/security rule was weakened. No application source changed after final build/checks; subsequent edits were documentation only.

All five owned Markdown files updated, including current checkpoint pointers. The preview remains running on port 3001 (PID 13960 at last check) with the independent local database on 51214; recheck listeners/ownership before future restarts. The ignored .env and existing key were preserved. No database migration/reset, dependency change, LawTest repository/database access, real payment, email sending, commit or deployment. Real provider usage occurred only for the three bounded QA requests described above. The default 30 AI attempts/day is per student across supported math sources; failed provider attempts count. AI chat is temporary, follow-up questions ungraded, and the scanned official EEC paper remains outside AI explanation coverage until structured questions/solutions are verified. Broad pedagogical evaluation, independent source review, production billing/retention and scaled official scoring remain unfinished.

DeepSeek credential selection, 2026-10-23: owner supplied Desktop/Api keys.txt as the intended DeepSeek credential source. Read it privately; it contained one unambiguous candidate, different from the previously configured key. Saved only DEEPSEEK_API_KEY to the ignored project .env.local, preserving other local settings and leaving .env and the Desktop source unchanged. No secret value was printed. An existing process environment DEEPSEEK_API_KEY overrides Next local env files, so the restarted EducationPlatform child was explicitly given the selected project key; the parent and machine/user environment were not changed. Future restarts must ensure the intended project key wins over any ambient process variable, without printing either value. Preview PID 18000 on port 3001 at last check; recheck ownership before restarting. One new bounded live tutor request returned HTTP 200 with a DeepSeek reply. No application source/build changed; the prior 35-unit/five-browser passing outcomes remain the source-check checkpoint, not freshly rerun suites. One disposable qa-exam-ai-key- example.invalid account was created for this verification. No email, real payment, dependency/schema change, LawTest access, commit or deployment. Keep all credential files ignored and private.

## Isolated IELTS Speaking Lab — 2026-10-23

Owner requested a separate test page with a 3D character, DeepSeek conversation and natural speech, explicitly excluding integration into practice/exams. Open /labs/ielts-speaking directly. It is local-pilot-only, noindex/nofollow, absent from homepage/program/practice/exam links, and writes no attempts, scores, subscriptions or chat history. Requires login and explicit transcript/microphone consent. Milo is an openly synthetic AI partner rendered from the licensed CC0 RobotExpressive model. Conversation modes cover Parts 1–3, four topics, editable recorded answers, contextual follow-ups, transcript-based feedback and text download. No pronunciation/band assessment or official test claim.

DeepSeek handles text conversation with the existing private project key. Kokoro supplies local natural British English George/Emma voices; local Whisper transcribes 0.25–120 second recordings. No ElevenLabs/OpenAI API key is used, no real-person voice is cloned, and raw microphone recordings are not persisted. Browser device speech is an explicitly selected fallback. Model weights are cached under ignored artifacts/speaking-voice-cache; first use needs internet and CPU time. See latest HANDOFF.md for exact dependencies, source licenses, safeguards, real-versus-fixture tests and final outcomes.

Speaking Lab final outcome, 2026-10-23: final lint, type checks, production build and all 40 unit tests passed without warnings. Five browser suites have passing outcomes on the final build: speaking_lab_smoke.py plus the four required browser/account/exercise/exam regressions. The standalone lab suite passed actual 3D rendering, three live DeepSeek conversation/answer/feedback calls, actual Kokoro WAV playback/stop, actual local Kokoro-to-Whisper transcription, consent/auth/origin/shape controls, transcript download, both themes at 320/390px, and absence of lab links from homepage/practice/exams/IELTS program. Its MediaRecorder/getUserMedia flow used a fixture microphone with an explicitly mocked UI transcription reply; this is not a real human-accent/noise benchmark. Separate real Whisper inference was verified against generated speech. Required regressions passed all 80 questions/four workshops, concurrent account submissions and full SAT/IELTS journeys with stored mock recordings. No other browser suites were rerun in this increment.

Inspected speaking-lab-desktop.png, speaking-lab-dark-320.png and the earlier light desktop diagnostic. The character, conversation, transcript feedback and voice controls fit; full-page screenshots taken while scrolled reflect the sticky desktop character's current viewport position. Initial failed lab runs occurred before canvas fix, then before the CJS asset-resolution fix, then in an overly indirect audio assertion. The final Chromium test instruments URL.createObjectURL to inspect the actual received playback Blob because its network-response body reported zero bytes even while native audio was playing. It still requires RIFF/WAVE bytes, substantial samples, actual speaking/stop state and real Whisper output; no audio/model response is fabricated for those checks. Failed earlier runs also made real DeepSeek requests; three successful turns refers to the final passing run, not total provider usage across this increment.

All five owned Markdown files updated. No application source changed after the final build; remaining changes were test diagnostics and documentation. The independent database remains on 51214, and preview PID 752 listens on 3001 at the last check; recheck ownership before future restarts. The preview uses the owner's selected private .env.local DeepSeek key explicitly in its child environment; no key value was printed, no .env/.env.local credential changed, and no machine/user environment changed. Auth/RateLimit QA rows remain as actual local records. No database migration/reset, email, real payment checkout, LawTest access, commit or deployment. This is an experimental local page only, with synthetic voices and transcript coaching, not a production voice service, human examiner, official band score or pronunciation evaluator. Device microphone permission/audio quality and broad accent testing remain manual checks. Sources, runtime dependency choices, model caches and remaining pre-existing development-tool audit findings are recorded above.


Hosted verification checkpoint, 2026-10-23: the canonical Vercel site is live on application commit 30574b6. Hosted account/payment suites passed on 88100c2; after the native speech packaging fix, hosted speaking_lab_smoke.py passed real Kokoro streaming, Whisper transcription and three DeepSeek start/answer/report calls. All 47 units and the five required/relevant local browser suites passed for the repair; the final packaging-only follow-up also built successfully. See HANDOFF.md for exact coverage. Neon vercel is now the default branch and sole compute (0.25 CU, five-minute autosuspend). hosted-pilot is absent; the production root remains only because vercel depends on it, with its unused compute removed. Payments remain simulated and accounts have unverified email; this is a hosted test pilot.
