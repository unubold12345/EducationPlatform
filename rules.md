# Project rules

Read readme.md and start.md before making changes. These rules apply to this education project; they do not authorize changes to LawTest.

## Product boundaries

- Keep LawTest separate. Do not change its repository, production data, accounts, or purchases as part of work here.
- Recommend LawTest through a verified external plan link. Never silently share student data or imply bundled access.
- Launch one program first. Mark assumptions and pending decisions explicitly.
- Do not publish placeholder exam content as reviewed material or claim official exam affiliation.
- Use content with appropriate permission and keep its source and review status.

## Architecture

- Use Next.js and TypeScript with a separate PostgreSQL database and Prisma.
- Keep one deployable application initially, with clear module boundaries.
- Share account, access, content, and progress capabilities; keep exam-specific scoring and behavior explicit.
- Avoid premature microservices and abstractions that have no concrete second use case.
- Select dependencies when needed and commit the lockfile. Never assume a particular version is current.
- Before writing Next.js code, read the relevant installed documentation under node_modules/next/dist/docs/. Follow generated framework guidance and deprecation notices. If those docs are absent, consult official documentation for the installed version.

## Assessment integrity

- Use stable IDs and immutable published question versions or equivalent attempt snapshots.
- Preserve question content/version, presented option order, scoring rules, and submitted responses for historical attempts.
- Validate answers and compute authoritative scores on the server. Do not trust browser scores or timekeeping.
- Avoid sending answer keys or explanations to a timed-exam client before review is allowed.
- Define section timing, navigation, resume, expiry, and submission rules per exam format.
- Make final submission idempotent so retries cannot create duplicate completed attempts.
- Distinguish ungraded, pending review, and graded results. Do not present provisional grading as an official score.

## Security and access

- Check authentication, ownership, role, and program access on the server for each protected operation.
- Keep secrets out of source control, client bundles, logs, and example environment files.
- Never copy LawTest secret files or connect to its production database.
- Validate imports, requests, and uploads. Use private media access where needed and enforce appropriate size and type limits.
- Use program-scoped access grants; do not introduce one global paid flag for unrelated purchases.
- If payments are added, verify provider notifications server-side and handle duplicates before granting access.
- Collect only necessary personal data and define retention and deletion behavior before production collection.

## User experience

- Start with Mongolian interface text and support English exam content. Keep text organized for future localization.
- Support mobile layouts, keyboard navigation, readable contrast, and accessible forms.
- Show useful empty, loading, error, and save/reconnect states.
- State clearly whether a test is practice, a mock exam, or an estimate of performance.
- Do not expose implementation details in student-facing flows.

## Delivery and verification

- Never commit or push without explicit owner authorization. Permission to implement a feature or update documentation alone does not authorize either operation. Honor any narrower scope the owner gives.
- Before a commit, inspect the current branch, status, staged changes and configured remote. Stage only the authorized files or hunks with explicit paths; do not use blanket staging in this workspace with existing uncommitted work. Preserve unrelated edits.
- Never stage credentials (.env/.env.local), logs, temporary files, artifacts, model caches, generated clients, dependency folders or build output. .env.example may contain empty placeholders only. Inspect the staged diff for secrets and unrelated changes before committing.
- Before an authorized push, verify the destination belongs to EducationPlatform and confirm the intended branch. Never reuse LawTest's remote or assume main is the target. Do not force-push or rewrite shared history without explicit authorization.
- The owner-authorized initial destination is the private https://github.com/unubold12345/EducationPlatform.git repository, branch codex/education-foundation. Recheck current configuration rather than treating this recorded value as proof of the active destination or fresh push authorization.
- Verify application changes with lint, type checks, relevant units, a production build and the required browser suites; inspect affected screenshots. Checks must cover the source being delivered. Documentation-only edits need documentation/diff checks, not a fresh application build or browser run. Record failures and unrun checks accurately.
- Report local changes, commits, pushes and deployment as separate states. Record the commit/branch and push outcome when they exist. A successful push is not proof of deployment; verify the actual deployment when deployment is in scope. Inspect a missed deployment before retrying; do not automatically create empty commits.
- Stop or restart only processes verified to belong to EducationPlatform. Never kill all Node processes to build or start this project. Use its independent local database and reviewed migrations; do not copy LawTest's production database commands.
- Keep handoffs concise: current state, decisions, changed paths, actual checks, unresolved work and useful commands. Preserve active-task details through compaction and distinguish historical verification from current evidence. Preserve Mongolian text with UTF-8 without BOM when editing Markdown or scripts.

- Develop using an independent local or test database. Review migrations before applying them to production.
- Back up important data and verify restoration before destructive schema changes or production migration.
- Verify scoring, access control, answer persistence, timing, and submission retries with meaningful tests.
- Run lint, type checks, relevant tests, and a production build when applicable. Report checks actually run and unresolved failures.
- Keep changes reviewable and avoid unrelated refactors.
- Update readme.md when setup changes and start.md when scope or milestone status changes.
- Never describe planned features, unrun checks, or undeployed changes as completed.

## Confirmed first program

The owner initially selected SAT mathematics on 2026-10-22, then explicitly requested usable exercises for all three programs. SAT, IELTS, and university-prep practice sets are now in scope. Original practice content must remain clearly labeled until independent editorial review and a production publishing workflow exist. Do not call short topic sets full mock exams or convert raw scores into official SAT, IELTS band, or entrance-exam scores.

## Local account and persistence conventions

- Use Better Auth 1.7.12 with Prisma ORM 7.10.1 for the current local pilot. Do not upgrade Prisma major versions without reviewing adapter compatibility.
- Keep AUTH_LOCAL_PILOT restricted to loopback URLs and keep demo credentials/provisioning local-only. Owner-selected hosted test pilot (2026-10-23) uses a separate explicit AUTH_HOSTED_PILOT gate with a canonical HTTPS URL, an independent hosted PostgreSQL database and a visible unverified-email/recovery limitation. This opt-in does not constitute a verified-email public launch.
- Hosted simulated checkout requires its own HOSTED_MOCK_PAYMENTS opt-in; the isolated speaking page requires SPEAKING_LAB_ENABLED. Preserve all session, ownership, origin, plan, active-exam and quota checks in either pilot mode. Never make hosted access depend on exposing local credentials or bypassing database errors.
- Never display the local authentication secret or copy it into documentation or test output.
- Confirm attempt ownership on every read and mutation. Check request origin on authenticated mutations.
- Preserve attempt content snapshots and use revision checks for conflicting writes. A stale tab must not overwrite newer saved answers.
- Keep submitted attempts immutable. A repeated submission must return the saved result; do not weaken this requirement to accommodate the current failing test.
- For the embedded development database, keep the verified single-connection pool when AUTH_LOCAL_PILOT=true. Both simultaneous submissions must succeed with identical saved results. This local verification does not establish production or multi-process concurrency support; read HANDOFF.md.
- Browser integration tests use disposable qa-prefixed example.invalid accounts. Do not delete unrelated user records during test cleanup.
- Update HANDOFF.md whenever a session ends with incomplete verification or a blocker. Distinguish an observed cause from a proposed fix.

## Session handoff rules

- Begin a replacement session in C:/Users/PC/Desktop/Codes/EducationPlatform and read HANDOFF.md before editing.
- Treat that file's process, permission, and Git observations as historical until rechecked; never assume Full access was enabled from a conversation about it.
- Preserve ignored local credentials and existing uncommitted work. Do not copy secrets into handoff documents.
- Record documentation-only transfers as such. Previously passed checks do not prove a later failing integration test passed.
- Update the five project-owned Markdown documents when their facts change. Do not rewrite dependency documentation or generated Markdown as part of this instruction.

## Exercise content and grading

- Maintain stable, versioned question IDs in src/modules/exercises/content.ts. Existing seeded versions and attempt snapshots must not be overwritten; use new version IDs for substantive content corrections.
- Keep answer keys and explanations in server modules. Use publicExercise before passing questions across the server/client boundary.
- Include reading passages in stored question prompts using the documented [QUESTION] separator so saved attempts retain the full evidence.
- Allow only known exercise IDs when starting saved attempts. Preserve ownership, origin, bounded request parsing, revision conflicts, and idempotent submission.
- Keep the legacy bodyless start endpoint compatible with the original three-question sample. Next.js may expose an empty POST body as a stream.
- IELTS workshops are self-reviewed: no automated band score, speech recording, or server persistence. Let students download responses and clearly describe their temporary lifetime.
- Test new sets through tests/exercises_smoke.py in addition to guest/account regressions. Check all question keys, no pre-submission key leakage, cross-program resume/history, and mobile layouts.

## Full mock exam rules

- Preserve the verified standard-time structures in src/modules/exams/definitions.ts. SAT is 27+27 Reading/Writing, a 600-second break, then 22+22 Math; module times are 1920/2100 seconds. IELTS computer Listening is 1800 seconds plus 120 checking, Reading/Writing 3600 each, and the chosen Speaking simulation is 240+60+120+300 seconds.
- Expiry is authoritative on the server and carries deadlines forward from the previous scheduled deadline. Never reset time on refresh, accept late edits to expired stages, or expose runtime test timer shortcuts.
- Snapshot the full versioned definition, keys, passages and practice branches at start. Only the current stage's stripped questions may reach an unfinished client. Keep private recordings owner-only.
- Treat the 65% SAT practice routing threshold and original question difficulty as uncalibrated. Do not present raw counts as official scaled scores. Keep two pretest items per SAT module out of operational counts.
- IELTS Writing/Speaking need qualified human grading. A stored transcript or recording is not an IELTS band score. The live-examiner interaction is simulated by prompts; state that clearly.
- Keep bundled audio filenames/version content immutable after release. Include assets/exams in packaging, and regenerate its manifest when a new authored audio edition is published.
- Speaking records only in its active parts and must stop microphone tracks afterward. Warn before refresh/exit during recording and offer a download if upload fails. Do not claim an in-progress clip survives a hard refresh.
- Run tests/exams_smoke.py for timer/state changes. tests/mock_fixture.mjs is a trusted local QA-only fixture, never a route or production dependency. Document accelerated testing separately from a real-duration sitting.

## Appearance rules

- Use shared theme colors for surfaces and readable text; preserve distinct correct, incorrect, urgent and recording states in both themes.
- Apply the saved theme before first paint, falling back to device preference on a fresh visit. Storage failures must not break the page.
- Theme switching must not navigate, remount the exam or change its authoritative timer. Keep the control keyboard-accessible at mobile widths.
- Run tests/theme_smoke.py for appearance changes; the full exam browser suite also exercises dark mode.

Appearance refinement, 2026-10-22: dark mode uses a deep indigo palette (#100e24 surfaces, #0a0819 background accents). The interface and headings use bundled variable Manrope with Mongolian Cyrillic glyph coverage, including Ө/Ү/Ё. Keep its OFL license beside the font in src/app/fonts. English exam passages retain their reading serif. See HANDOFF.md for verification.

## Modern interface refresh — 2026-10-22

The owner requested a more modern UI/UX and darker theme. The shared shell now has a compact brand, segmented navigation with active-page indicators, and mobile access to My preparation. The homepage replaces the decorative workbook with working SAT/IELTS launch links and a short guest-practice option. The exam library has a clearer title/count hierarchy, restrained cards, aligned full-width actions and compact section timing. Program, account, workshop and timed-workspace surfaces share the same updated visual system. Dark mode uses #07070d near-black, #101019 cards, #171529 indigo accents and readable neutral text. Bundled Manrope and saved light/dark preference remain. See the latest HANDOFF.md checkpoint for actual verification.

## Profile and dashboard conventions

- /profile must authenticate before reading account data; only this fixed path is added to the login return allowlist. Never accept an arbitrary redirect.
- Use Better Auth for profile/password changes, require the current password and confirmation for password changes, and revoke other sessions after a successful change. Do not expose secrets in props or logs.
- Dashboard totals and latest-open continuation must use owner-scoped queries, without fake streaks/progress. Full-exam time keeps running while away; explain this on resume cards.
- Keep decorative education linework inline in SVG, hidden from assistive technology and pointer interactions. Omit it in active timed exam workspaces. No background image upload is needed.
- Run tests/profile_smoke.py for profile/security changes, alongside relevant existing suites. It uses disposable qa-profile- example.invalid accounts and verifies current-password checks and other-session revocation.

## Mock checkout and authorization

- Price full mocks from src/modules/exams/pricing.ts: 10,000 MNT per exam, including retakes. Keep topic exercise access independent.
- A matching active subscription or a PAID MockPurchase authorizes a new full mock. Its subscription-backed sitting retains private continuation/review after expiry. A pending/declined order must never grant access.
- Price, currency, owner and status are server-controlled. Reject client amount/user/status fields; validate origin and bounded JSON. Creation and confirmation must be idempotent, including concurrent requests.
- Mock confirmation is local-pilot/loopback only and must be visibly labeled as simulated, without card/bank data or real-charge claims. It is not a provider webhook. Real providers require verified server notifications.
- Do not start/reset an exam clock during checkout. Existing attempt owners keep their zero-cost LEGACY rights; preserve stored answers, timestamps and recordings.
- Keep checkout return routing limited to known exam slugs. Show member/guest header state from the auth session. Run payments_smoke.py and complete exam flows through the actual simulated checkout, without a payment bypass fixture.

## Local demo login buttons

- Demo credentials are deliberate shared test data, never real student credentials. Render them only behind localPilotEnabled; never import the credential catalog into a globally shipped client module.
- Fill the normal login form and use Better Auth; never bypass password checks, ownership or mock purchases. Keep buttons absent from registration and disabled during submission.
- Provision only the five dedicated example.invalid accounts against the confirmed local app/database. Preserve existing demo profiles/passwords on repeated provisioning; never reset unrelated records or weaken auth rate limits.
- Verify all five accounts, credential filling, focus/Enter, manual-edit selection clearing and 320/390px layouts through tests/demo_accounts_smoke.py.

## Monthly subscription rules

- Use the exact three independent prices in subscriptions/plans.ts: entrance 40,000 MNT/month, IELTS/SAT 60,000 each. One program never unlocks another. Full mocks accept an active matching plan OR a valid individual purchase.
- Protect full exercise/workshop content before serializing questions/models, guard grading APIs and new saved-attempt creation on the server, and leave the original three-question sample free. Ownership checks and old snapshots remain immutable.
- Billing uses one calendar month in Ulaanbaatar time, clamped at month ends. Active renewal starts from existing endsAt; expired renewal starts at server now. Reconfirming one paid order must not extend the subscription twice.
- Subscription orders control owner, amount, currency and status server-side. Mock confirmation requires the selected local or explicitly enabled hosted pilot, is explicitly labeled and never claims real charges. No automatic renewal is performed. Keep pending-order keys and transactional confirmation idempotent under concurrency.
- A subscription-authorized mock snapshots its access provenance; that sitting can finish and remain privately reviewable after expiry. New starts require current access. Existing saved exercises can finish/review, while current full-set pages and grading require an active plan. Preserve prior individual/LEGACY rights.
- tests/subscription_fixture.mjs may expire only isolated qa-sub- users in the confirmed local database; never expose expiry/timer/payment bypass routes. Run subscriptions_smoke.py and required browser regressions using actual mock order confirmation.


## Admin console — 2026-10-23

- AdminMembership is a server-controlled relation separate from client-editable Better Auth user fields. Check it before every protected page/export and again inside privileged mutation transactions. Never accept an admin role from registration or profile input.
- Only the explicit guarded local operator command provisions membership. Test 01 is the current shared local admin; 02–05 remain learners. This is not a production admin provisioning policy.
- Record grants, expiry, session revocation, content review and exports in AdminAudit. Require 5–1000-character reasons for management writes, origin checks and bounded JSON. Do not expose audit editing/deletion in the app.
- Do not fabricate paid receipts for administrative grants or alter historical payments, scores, clocks, snapshots or recordings. Expiry retains existing saved-work and prior purchase policies. Session revocation is not account suspension.
- Keep content keys/answers in admin-only source preview routes; review notes/status do not publish content, certify accuracy or award IELTS bands. The later content-publishing rules below supersede this limitation for the fixed existing catalog.
- Export only explicitly selected non-secret fields, protect spreadsheet formula cells, bound exports to the latest 1,000 rows and record the export. Current exports do not apply page search filters; monthly-order exports do not include individual mock purchases.
- Maintain stronger light-mode sketches and exactly one visible desktop/mobile inline SVG arrangement. Preserve subdued dark mode and hide all decoration in active timed exams.
- Run admin_smoke.py with the four required browser regressions, plus relevant profile/theme/demo/payment/subscription suites. Update actual outcomes in HANDOFF.md.


Admin increment verification, 2026-10-23: final lint, type checks, build and all 23 unit tests passed. All ten browser suites passed: guest, accounts, exercises, full exams, admin, profile, theme, demo accounts, payments and subscriptions. Inspected admin desktop/content/mobile and vivid light-background screenshots. The app remains on port 3001. See HANDOFF.md for full evidence, fixture rules, migration and limitations.


## Content publishing and reporting scopes — 2026-10-23

- Use ContentDraft revision checks and reset review on every save/import. Validate against canonical structure, immutable IDs/standards/timings and answer consistency. Require provenance and a reason; keep drafts and keys admin-only.
- Publish only the exact reviewed revision and create a new immutable PublishedContent record atomically with audit history. Exercise publications add new QuestionVersion and Exam rows; never overwrite old rows or learner snapshots. Keep publishing conflicts explicit, including unique-create races.
- Runtime pages, grading and new mock starts must resolve through the published-content service. Exact exercise version accompanies stateless grading. New starts of the same exercise resume its open snapshot across versions; prior valid versions remain readable/gradable. Request-time pages must not freeze new publications at build time.
- Restore recent versions into a draft and publish a new version after review; never delete version history to undo changes. Current editor preserves counts, IDs, kinds, standard timers, media references and source URLs. New catalog creation/media replacement are separate unfinished scope.
- Default admin user/subscription/attempt reporting excludes reserved .invalid accounts. MOCK and LEGACY transactions are never real revenue. Preserve a clearly selected test view and scope-aware CSV export. Actual audit history is not fabricated or erased to clean up a dashboard.
- Payments stay simulated at the owner’s explicit request until an appropriate real provider contract/configuration exists. Do not relabel simulation as real payment or fabricate transactions to fill empty views.
- Publishing browser tests must restore the prior original material after temporary assertions and leave independent editorial review pending. Keep immutable audit/version evidence. Run publishing_smoke.py with required browser regressions and relevant access/payment suites.


Publishing/reporting verification, 2026-10-23: lint, type checks, production build and all 26 units passed. All eleven browser suites have passing outcomes in this increment, including the new publishing workflow and final admin session-revocation rerun after the unchanged rate-limit window cleared. Full exams, payments and subscriptions passed in the final managed run. Inspected real-data dashboard and desktop/320px editor screenshots. Preview remains on port 3001; payments remain explicitly simulated. See the latest HANDOFF.md for exact build coverage, interrupted runs and remaining scope.


## Official past-paper integrity — 2026-10-23

- Keep the real 2020 Mathematics A paper distinct from authored practice mocks. Attribute БҮТ and the exact year/variant; use original source pages for diagrams/formulas. Do not quietly rewrite official content or award invented scaled scores.
- Preserve the exact official scoring: 36 choices worth 72 points, four fill-in problems worth 28, grouped digit-pair conditions and leading zeroes. Scoring facts are server-only until finalisation and snapshotted per sitting.
- PaperAttempt owns a fixed server deadline, source URL/key snapshot, bounded answer map, revision and immutable result. Confirm owner on every read/write, origin on mutations and current access before new starts. Existing saved work may continue after plan expiry; new starts require a current University Prep plan or permanent per-paper purchase.
- Never use the authored-content publishing workflow to mutate the official paper. The admin source/key view is read-only except separate editorial notes. Keep the free official material/source link distinct from the app’s simulated paid workflow.
- External archive image bytes are not stored immutably; URL/key snapshots do not guarantee external asset persistence. The legacy source currently uses HTTP because HTTPS certificate verification failed. Do not disable certificate checking or present this as a verified secure public deployment.
- Use tests/paper_fixture.mjs only for isolated qa-paper- example.invalid users in the confirmed independent local database. Do not add runtime deadline/access bypasses. Verify all eight live pages, 100-minute deadlines, scoring, saves, isolation, concurrent finalisation, expiry and responsive layouts.

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


Singapore checkpoint, 2026-10-23: owner requested AWS Asia Pacific 1 (Singapore), aws-ap-southeast-1. The hosted database is now EducationPlatform-Singapore (flat-lab-37306599), default vercel branch br-dry-mode-aomngscc, endpoint ep-wandering-surf-aoura6ip, PostgreSQL 18, 0.25 CU with five-minute autosuspend. All 26 tables/312 pre-cutover rows matched before switching Vercel; 22 original private rows across 11 tables were also verified unchanged after deployment. The old US database is retained read-only for rollback; never resume its writes while Singapore serves the app. Existing .env/.env.local and all credentials remain private. See HANDOFF.md for actual suite outcomes and the monthly-plan UI gate follow-up.


Singapore final verification, 2026-10-23: Vercel deployment dpl_BvuGW3NyrsKMpAE6KUm6iRQQ6PUS is READY on e59caa5, serves the canonical domain and reports function region sin1. Hosted exercises_smoke.py passed all 80 questions/10 sets/four workshops on the final source; an additional browser check passed the monthly-plan button, simulated receipt, session response and 320px layout. Hosted guest/accounts/payments passed on the initial Singapore deployment before the isolated UI gate correction. Final local lint/type checks/build/all 47 units and all four required browser suites passed. Inspected Singapore monthly-checkout desktop/320px screenshots. A final comparison confirms all 22 original private records across 11 tables remain unchanged. Old US app connections remain read-only; retain that project for rollback until separately approved for deletion. No runtime source changed after final checks.
