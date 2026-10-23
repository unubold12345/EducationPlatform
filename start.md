# Start here

Read [HANDOFF.md](./HANDOFF.md) first for the current verification and precise continuation state.

## Commit, push and delivery workflow

Adapted from the owner's requested read of LawTest/lawopen/START.md and RULES.md on 2026-10-23. Follow the detailed delivery rules in [rules.md](./rules.md).

Implement and verify authorized work, then update the project-owned Markdown files with actual outcomes. Commit and push only with explicit owner authorization; inspect and stage the authorized files/hunks only, preserving other local work and all ignored secrets/caches. Verify EducationPlatform's remote and intended branch before pushing, and report commit, push and deployment outcomes separately.

Git delivery setup, 2026-10-23: the owner explicitly authorized pushing the code and identified the unubold12345 GitHub account. Created the private EducationPlatform repository and configured origin as https://github.com/unubold12345/EducationPlatform.git. The branch is codex/education-foundation. Read the latest HANDOFF.md for delivery results and recheck status before future work. Hosting/auto-deployment remains unconfigured. LawTest's remote, production database commands and local-only feature exclusions are specific to that project.

## Objective

Owner decision, 2026-10-23: make the Vercel deployment usable as a hosted test pilot, with simulated payments and clearly labelled unverified-email accounts. Public launch with email verification and password recovery remains a separate milestone. Explicit hosted authentication/payment/speaking opt-ins preserve local-only demo account tooling. See the latest HANDOFF.md for real deployment results; do not infer release success from a local build or Git push.

Build an independent education platform for IELTS, SAT, and Mongolian university entrance exam preparation. Keep LawTest operational and independent, and recommend its plan through an external link where relevant.

## First release

Launch SAT mathematics first, as selected by the owner on 2026-10-22. Begin with a small, reviewed algebra collection before expanding to other mathematics domains. The owner subsequently requested complete exercises for SAT, IELTS, and university entrance preparation on the same date. Practice in all three programs is now in scope.

The first release should support:

- Program and subject browsing.
- Topic practice with explanations.
- Timed mock exams appropriate to the selected program.
- Saved attempts, results, and review of mistakes.
- A basic administrator workflow for content review and publishing.
- A relevant, clearly labeled recommendation for the independent LawTest plan.

Defer live classes, teacher organizations, certificates, shared LawTest login, cross-product bundles, and automated essay or speech grading. Local mock checkout now uses ₮10,000 per full exam with retakes. Real payment processing remains deferred.

## Decisions needed before dependent implementation

- First program: SAT mathematics (decided). Initial sample: algebra. The launch content collection and review owner remain undecided.
- Content source, permission to use it, and reviewer responsible for accuracy.
- Exam format and scoring requirements, verified against current official specifications.
- Authentication: Better Auth email/password is implemented for a local pilot; the short guest sample remains available; full sets require the matching subscription. Public email verification/recovery is unfinished.
- Free pilot versus paid launch and what each access purchase covers.
- Final brand, domain, hosting, and verified LawTest plan URL before publication.

Foundation work may proceed without a final brand. Do not invent exam rules, prices, credentials, or production URLs to resolve missing decisions.

## Milestones

### 1. Scaffold the independent application — complete

Create the Next.js TypeScript application in this directory while preserving these documents. Inspect the installed Next.js documentation before writing framework-specific code. Add a reproducible lockfile, lint and type-check commands, environment-variable examples without secrets, and local setup instructions.

Done when the app builds, lint and type checks pass, and another developer can start it using the README. Do not connect to LawTest's database.

### 2. Define the data and assessment foundation — partially implemented

Design Program, Subject, Topic, Question, QuestionVersion, Exam, ExamSection, Attempt, Response, and program-scoped AccessGrant concepts. Implement only the entities required by the first release.

Use stable question IDs. Preserve the question version, option order, exam rules, and scoring version used for an attempt so later content edits do not change historical results. Model response types explicitly rather than assuming every response is a selected option index.

Choose the first program before finalizing section timing, navigation, question types, and scoring. Do not build a universal exam engine speculatively.

Done when representative sample content can complete a practice and mock-exam flow with correct results and preserved history.

### 3. Deliver the student journey — partially implemented; local account journey verified

Build program selection, practice, timed exams, resume where permitted, submission, results, explanations, and mistake review. Implement authentication before storing personal progress.

Persist timed attempts on the server. Define reconnect, expiry, and submission behavior. Provide clear loading, empty, error, and recovery states. Design for mobile screens, keyboard access, and Mongolian text.

Done when a student can complete the full journey and revisit their results without losing answers on an ordinary refresh.

### 4. Add content administration

Support validated import, draft editing, preview, review, and publishing. Require explanations and answer checks appropriate to the content. Record provenance and publishing responsibility.

Done when an administrator can publish a reviewed exam without editing source code, and ordinary students cannot access administration or unpublished answers.

### 5. Pilot and launch

Test with a small student group. Verify content, scoring, permissions, save/resume, mobile behavior, and access rules. Verify backups and a restore procedure before collecting important production data.

Add the verified LawTest plan link with wording that makes the separate purchase and website clear. If launching paid access, verify server-side payment confirmation and duplicate-event handling before granting access.

Done when pilot issues affecting exam completion are resolved, setup and deployment documentation match reality, and the launch content has been reviewed.

### 6. Expand deliberately

Choose the next program based on demand and content readiness. Add its specific response formats, timing, navigation, and scoring. IELTS and SAT must not be treated merely as renamed multiple-choice law tests.

## Immediate next action

Arrange independent review of the new question bank and IELTS workshop material, then continue content versioning and publishing workflows. The local Prisma/PGlite concurrent-submission error is resolved and both browser suites pass. Content models, local authentication, the independent development database, and saved-practice history are implemented and locally verified. Timed SAT/IELTS mocks are now implemented; independent review, human grading, content administration, and launch requirements remain unfinished.

## Progress recorded on 2026-10-22

- Independent Next.js application, pinned dependencies, lockfile, and local setup are in place.
- Mongolian homepage, program pages, and separate LawTest plan referral are implemented.
- SAT mathematics was selected first; the owner then expanded exercise work to all three programs. Ten original practice sets contain 80 questions, plus four IELTS writing/speaking workshops. Independent editorial review is pending.
- Local account and saved-practice flows passed both browser suites, including concurrent submissions with identical results, conflict recovery, ownership, history, and logout/login persistence.
- Application and seed pools use one connection for AUTH_LOCAL_PILOT=true. Non-pilot pool limits remain five and two respectively; production concurrency is not verified.
- Lint, type checks, ten unit tests, and production build passed. Production dependency audit found zero vulnerabilities.
- Account dashboard and authentication screenshots were inspected; mobile login heading overflow was fixed.
- No LawTest resources were changed, no production database was accessed, and no deployment or commit was created.

## Continuation checkpoint

Read HANDOFF.md before editing and recheck running processes. Preserve .env and uncommitted work. Milestones 2 and 3 remain partial pending independent editorial/psychometric review and complete launch behavior. Full timed SAT/IELTS mocks, Listening audio and a Speaking recording simulation now work. Official scaled scores, examiner grading, wider entrance-subject coverage, and production administration remain unfinished.

## Exercise expansion — 2026-10-22

- SAT: four eight-question sets span all four mathematics domains.
- IELTS: two reading sets and Academic English supply 24 checked questions. Two writing and two speaking workshops add prompts, original model responses, checklists, word counts for writing, and response downloads.
- University preparation: three eight-question sets cover mathematics, English, and physics foundations.
- Every choice-based set supports guest grading and account save/resume/history with private snapshots. Registration/login returns students to their selected set.
- Program pages, homepage, and dashboard link to the new material. The original three-question sample remains compatible.
- Suggested durations are practice guidance only. These are complete exercise sets, not full official-format mock exams. No official SAT score, IELTS band, or entrance-exam score is calculated.

Final verification of the exercise expansion: lint, type checks, all ten unit tests, production build, and all three browser suites passed. The new suite completed every question and workshop, checked multi-program save/resume and concurrent submission, and verified all new pages at 320/390px. A legacy empty-body start regression was corrected before the final passing account run. New library/exercise/workshop and account screenshots were inspected. See the latest checkpoint appended to HANDOFF.md for actual outcomes.


## Full mock exams — 2026-10-22

The latest owner request required a grid with one complete SAT and one complete IELTS exam. /exams now provides both, with briefings, equipment checks and authenticated timed attempts.

- SAT: 98 questions delivered from a 147-item bank, two 32-minute Reading/Writing modules, ten-minute break and two 35-minute Math modules. Distinct lower/higher second-module banks use an explicitly uncalibrated practice threshold. Each module has two unscored pretest items. Math combines multiple choice/numerical responses and offers Desmos plus formulas.
- IELTS Academic computer simulation: 40 Listening questions with four bundled synthetic-voice recordings (30 minutes plus two-minute final checking), 40 Reading questions with 2,265 words over three passages in 60 minutes, both Writing tasks within 60 minutes, and all Speaking parts within 12 minutes including preparation and private microphone recordings.
- Deadlines live on the server. Refresh does not restore time; completed stages lock, unanswered items are allowed, and normal standard-time stages cannot end early. Snapshots, autosave/conflict recovery, private results, downloads and dashboard history are implemented.
- IELTS Writing/Speaking are stored for human review, without invented band scores. Speaking is prompt-based, not a live examiner. Do not refresh during an active recording; the UI warns that the current clip is interrupted. Official SAT difficulty calibration and scale conversion remain outside this mock.
- A non-destructive migration added MockAttempt and MockRecording to the independent local database. Existing practice versions and attempts were preserved. No deployment or commit was created.

Verification includes 20 passing unit tests, lint, type checks, production build and four browser suites. Exam transitions were exercised with isolated local QA deadline fixtures and a fake microphone; this is not a real-duration multi-hour sitting. Desktop/mobile exam-grid, active section, calculator, Writing table, Speaking and result screenshots were inspected. See HANDOFF.md for the final continuation state.

## Appearance increment — 2026-10-22

Added a site-wide dark theme and keyboard-accessible header switch, with saved browser preference and initial device-theme detection. Shared palettes cover programs, practice, accounts, workshops and timed mocks. Verification is recorded in the latest HANDOFF.md checkpoint.

Appearance refinement, 2026-10-22: dark mode uses a deep indigo palette (#100e24 surfaces, #0a0819 background accents). The interface and headings use bundled variable Manrope with Mongolian Cyrillic glyph coverage, including Ө/Ү/Ё. Keep its OFL license beside the font in src/app/fonts. English exam passages retain their reading serif. See HANDOFF.md for verification.

## Modern interface refresh — 2026-10-22

The owner requested a more modern UI/UX and darker theme. The shared shell now has a compact brand, segmented navigation with active-page indicators, and mobile access to My preparation. The homepage replaces the decorative workbook with working SAT/IELTS launch links and a short guest-practice option. The exam library has a clearer title/count hierarchy, restrained cards, aligned full-width actions and compact section timing. Program, account, workshop and timed-workspace surfaces share the same updated visual system. Dark mode uses #07070d near-black, #101019 cards, #171529 indigo accents and readable neutral text. Bundled Manrope and saved light/dark preference remain. See the latest HANDOFF.md checkpoint for actual verification.

## Profile and dashboard increment — 2026-10-23

Delivered a real profile route with display-name editing, password change/current-password confirmation and other-session revocation. Polished the dashboard with owner-scoped completion/open totals, latest-open resume, balanced action cards and existing history. Replaced the header continuation button with a profile icon/link visible at mobile widths. Added subtle education sketches drawn inline, with no image upload. Email change/recovery/verification and previously listed launch work remain unfinished. Final checks are recorded in HANDOFF.md.

## Per-exam mock checkout — 2026-10-23

Owner requested all full mocks priced at ₮10,000 and mock payment. Implemented one purchase per user/exam, including retakes, with separate SAT/IELTS rights. Checkout has explicit success/decline simulation and receipts, without real charges or payment details. Server authorization applies to starts and private attempt/media access. Existing saved-attempt owners retain access through LEGACY migration grants. Real payment processing, refunds and production launch remain unfinished. Guests now see Нэвтрэх; members see the profile link. Verification is recorded in HANDOFF.md.

## Demo login shortcuts — 2026-10-23

Created five named local test learners and login-page buttons that fill their credentials. Selection clears on manual edits, the submit button receives focus, and Enter uses normal login/return routing. At this earlier checkpoint these accounts had no special roles. The later admin increment explicitly grants Test 01 admin membership; payment checks still apply. Local-only visibility and reproducible provisioning were implemented without changing .env, dependencies or schema. Verification is recorded in HANDOFF.md.

## Monthly program plans — 2026-10-23

Owner selected three options: University Prep 40,000 MNT/month, IELTS 60,000/month and SAT 60,000/month. Each covers all currently available content in its program, with IELTS/SAT mocks included. Plan selection, explicit mock checkout, active/expired state, calendar-month renewal and private dashboard/profile status are implemented. Full topic/workshop access is now subscription-gated; the short SAT sample stays free. Previously purchased mock rights and saved work are preserved. Mock renewals are manual, not real automatic billing. Public payment processing, refunds and production launch remain deferred. See HANDOFF.md for actual verification.


## Admin console and vivid light sketches — 2026-10-23

The requested admin console is implemented at /admin: protected overview, searchable members, subscription management, mock transaction records, attempt monitoring, private source-content review previews/notes, audit history, CSV exports and configuration reference. Local Test 01 is the admin; other demo accounts remain learners. Administrative grants and session revocations require reasons and record changes atomically. No learner can self-promote through auth/profile input.

Milestone 4 remains partial: source review, responsibility and review notes now have an interface, but validated imports, draft editing, version publishing and qualified examiner grading are not implemented. Live billing/refunds and public launch readiness remain deferred. Light mode now uses vivid indigo sketches, including a dedicated mobile composition; dark mode retains subdued decoration. See HANDOFF.md for checked outcomes.


Admin increment verification, 2026-10-23: final lint, type checks, build and all 23 unit tests passed. All ten browser suites passed: guest, accounts, exercises, full exams, admin, profile, theme, demo accounts, payments and subscriptions. Inspected admin desktop/content/mobile and vivid light-background screenshots. The app remains on port 3001. See HANDOFF.md for full evidence, fixture rules, migration and limitations.


## Existing-catalog publishing and real reporting — 2026-10-23

The owner approved continuing administration and requested actual data rather than mock examples. Existing exercises, full mock definitions and workshops now have validated field editing/import, private drafts, previews, provenance, explicit review, immutable publishing and restoration from recent published versions. Learner pages and authoritative services resolve published versions; existing attempts retain snapshots and exact-version grading. Milestone 4 now covers publication of the existing catalog without source edits, but creation of additional catalog entries, structural changes and media replacement remain unfinished.

Admin reporting defaults to actual non-test account activity, with zero/empty states rather than sample rows. Reserved test accounts and simulated payments are separate, and simulated/LEGACY payments never count as real revenue. Audit events remain the complete stored operations history. Owner explicitly confirmed keeping checkout simulated because there is no QPay contract; real provider integration is deferred.


Publishing/reporting verification, 2026-10-23: lint, type checks, production build and all 26 units passed. All eleven browser suites have passing outcomes in this increment, including the new publishing workflow and final admin session-revocation rerun after the unchanged rate-limit window cleared. Full exams, payments and subscriptions passed in the final managed run. Inspected real-data dashboard and desktop/320px editor screenshots. Preview remains on port 3001; payments remain explicitly simulated. See the latest HANDOFF.md for exact build coverage, interrupted runs and remaining scope.


## Real official mathematics paper — 2026-10-23

Owner requested finding and implementing an official ЕБС mathematics exam, allowing any year/variant. Selected the complete 2020 ЭЕШ Mathematics A released in the Education Evaluation Center’s archive, after newer legacy download links were unavailable/incomplete. The app uses the exact eight original source pages with all diagrams/formulas, a full online answer sheet, private saved/resumable sittings, server-side 100-minute timing and official 100-point raw grading. No generated question set is presented as official material. Original content is source-attributed and read-only, with no invented 200–800 conversion.

University Prep includes the online workflow; individual simulated access remains 10,000 MNT. The original material itself remains free at the source. Publication/admin models for authored content remain separate. A production-safe secure mirror/permission and accessible semantic transcription are still needed for the external legacy HTTP image source; see HANDOFF.md and readme.md. Browser checks use the live pages and guarded isolated deadline fixtures, not a runtime shortened mode.

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
