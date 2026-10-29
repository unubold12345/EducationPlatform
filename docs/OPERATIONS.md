# EducationPlatform — Operations and Handoff

Consolidated 2026-10-24 from `AGENTS.md`, `HANDOFF.md`, `readme.md`, `rules.md` and `start.md`.
This is the single source of truth for current state, delivery rules, providers and next actions.
Read [PROJECT.md](./PROJECT.md) for stable product, architecture and setup details.

## 1. Current checkpoint

- Branch: `codex/education-foundation`; remote: private
  <https://github.com/unubold12345/EducationPlatform.git>.
- This source checkpoint includes Google login/linking, verification/recovery, local Gmail SMTP,
  hosted shared demos, homepage sketches/scroll reveals and visible IELTS Speaking invitations.
- On 2026-10-24 the owner authorized the initial feature push (`86d7075`), then explicitly requested
  hosted Google/Gmail activation using `.env.local` and the Vercel plugin. Production credentials
  have been configured; see section 9 for the activation checkpoint.
- Vercel reported the homepage/auth increment READY before hosted credential activation. The new
  Gmail opt-in requires the follow-up source deployment; do not infer activation from an env write.
- Payments remain simulated locally and hosted. No real money or payment provider is involved.
- The five hosted demo accounts remain unverified learners. The deployed UI exposes them and the
  server prevents shared-profile/password changes and admin access.

## 2. Environment state

The table and PIDs below were recorded on the previous PC. For this PC's workspace, see section 21.

| Item | Actual state |
| --- | --- |
| Local preview | `http://localhost:3001`, production build served by `npm start` |
| Local database | PostgreSQL-compatible PGlite on `127.0.0.1:51214` (companion 51215), `template1` |
| Recovery QA server | `http://localhost:3002`, built app with loopback outbox, verification enforced and synthetic Google credentials |
| Hosted site | <https://education-platform-seven-neon.vercel.app> |
| Hosted database | Singapore Neon, branch `vercel`, PostgreSQL 18, 0.25 CU, five-minute autosuspend |
| Hosted flags | `AUTH_HOSTED_PILOT=true`, `AUTH_HOSTED_DEMO_ACCOUNTS=true`, `SPEAKING_LAB_ENABLED=true`, simulated payments |
| Local credentials | `.env.local` contains Google, Gmail, Resend and DeepSeek values; `AUTH_EMAIL_FROM` is absent |
| Hosted credentials | Production Google pair and Gmail pair configured as sensitive variables via Vercel; `AUTH_HOSTED_GMAIL=true` and `AUTH_REQUIRE_EMAIL_VERIFICATION=true`. Saved `.env.vercel.local` is now a stale snapshot |
| Local email transport | Gmail, because Gmail values are valid locally; recovery QA still uses the loopback outbox |
| Local Google OAuth | Enabled by the local client ID/secret; only the authorization start has been verified |
| Source delivery | Auth/Gmail, homepage, Speaking links, tests and consolidated documentation included in the owner-authorized delivery |

Last observed processes after the verified production-build restart: preview PID 23488 on 3001, recovery
QA PID 19608 on 3002, database PID 25316 on 51214. Recheck listeners and ownership before restarting.
Never stop unrelated processes or assume these PIDs are still current.

### Hosted notes

- Prior baseline: `dpl_BvuGW3NyrsKMpAE6KUm6iRQQ6PUS` on commit `e59caa5`, region `sin1`.
  Current activation: `dpl_5GYtHHME3BMQZBPD59tBSnsc6nZY` on `0ec6d80`; see section 9.
- The five `qa-demo-01` through `qa-demo-05` hosted accounts were provisioned directly in the
  Singapore database with verified Better Auth password hashes, no admin membership, no purchases and
  no subscriptions. Their email addresses remain unverified; the deployed UI now shows the shared-demo
  controls and the exact demo exemptions are enforced.
- The previous US Neon database is retained read-only for rollback. Do not resume its writes while
  Singapore serves the application.
- `AUTH_HOSTED_DEMO_ACCOUNTS=true` is active in Vercel. The deployed source exposes the five demos
  and enforces their shared-data protections. The ignored `.env.vercel.local` predates Google/Gmail
  activation and must not be treated as a current hosted-environment snapshot.

## 3. Previous homepage/auth checkpoint verification ledger

Current local-build checks. Provider rows marked **prior checkpoint** are retained evidence and were
not repeated during the homepage/linking increment:

| Check | Outcome |
| --- | --- |
| `npm test` | 55/55 unit tests pass; includes four in-memory Google account-linking regressions |
| `npm run lint` | Pass, no warnings |
| `npm run typecheck` | Pass |
| `npm run build` | Pass; Next.js 16.4.2; 48 routes |
| `python tests/auth_recovery_smoke.py` | Pass on a standalone 3002 rerun, including authenticated Google-link start, unauthenticated/origin denial: unverified denial, verification, reset, token expiry/reuse, session revocation, origin and body bounds, rate limits, OAuth state/PKCE, forged-state rejection, mobile/themes |
| `python tests/browser_smoke.py` | Pass |
| `python tests/accounts_smoke.py` | Pass |
| `python tests/exercises_smoke.py` | Pass: 80 questions, 10 sets, four workshops, concurrency, grading, downloads, mobile |
| `python tests/exams_smoke.py` | Pass on the current build: SAT 98, IELTS 40+40, essays, audio, recordings, ownership, clocks, resume, results, mobile |
| Gmail SMTP authentication (prior checkpoint) | Passed against `smtp.gmail.com`; no message was sent by the check |
| Gmail test message (prior checkpoint) | SMTP accepted one message from the configured account to itself (`accepted:1`); inbox receipt not independently confirmed |
| Real Google authorization start (prior checkpoint) | HTTP 200; `accounts.google.com` URL with correct localhost redirect URI, state and PKCE; Google returned 302 without `redirect_uri_mismatch` or `invalid_client` |
| `python tests/profile_smoke.py` | Pass: profile/password updates, other-session revocation, ownership, mobile/themes |
| `python tests/theme_smoke.py` | Pass: system/saved themes, keyboard toggle, routes, mobile |
| `python tests/demo_accounts_smoke.py` | Pass on a standalone rerun after the sign-in rate window: five local demos, filling/selection, Enter login, identity/logout, mobile/themes |
| `python tests/admin_smoke.py` | Pass: authorization, controls, audit, exports, previews and mobile/themes |
| `python tests/homepage_polish_smoke.py` | Pass: actual scroll animation, reduced motion/no JS, desktop and 320/390px themes, Speaking discovery/login/register return, real profile button and mocked link failure recovery |
| Screenshots | New homepage inspected in light/dark on desktop and 320px, plus prior auth recovery screenshots; layouts fit |
| `git diff --check` | Pass; only expected LF → CRLF warnings, no whitespace errors |
| Credential scan | Changed/untracked deliverables scanned against private env credentials and common key patterns; no secret findings. Two unchanged local database template matches in `.env.example` confirmed against HEAD |

Important limits on that evidence:

- At the previous checkpoint, the first `tests/exams_smoke.py` run hit a transient PGlite `P2028` transaction-start timeout and
  showed the app error page. A clean serial rerun passed in full. Treat `P2028` as an environment
  flake, not a reason to weaken checks.
- At the previous homepage/auth checkpoint, `tests/hosted_demo_smoke.py` had not been run. It now
  passes on the activated production deployment, after correcting the POST-only admin test and
  respecting real rate-limit windows; see section 9.
- The auth recovery suite uses the loopback outbox and synthetic Google credentials. It does not
  prove real inbox delivery or a completed Google login.
- No consent screen, Google token exchange or completed Google sign-in has been performed.
- No application source changed after the passing production build. Later work was tests and documentation.
- The first exercise run reached the real sign-up rate limit after repeated homepage/account tests.
  A serial rerun passed without changing limits. The demo suite also initially reached the shared
  sign-in limit after password/profile checks; no rate-limit setting was changed. One initial recovery run failed its session-null
  assertion; a standalone rerun passed with an additional HTTP-status assertion. No runtime bypass
  or assertion weakening was introduced.
- Google linking uses Better Auth with an in-memory database and locally signed test identities in
  `google_linking.test.mjs`; it proves same-user/password preservation and unverified/different-email
  rejection, not a completed real Google login. The recovery suite verifies real local authorization
  starts only. New homepage navigation tests mock only model warm-up and the explicit link-failure UI.
- The real speech/DeepSeek `speaking_lab_smoke.py` engine suite was not rerun in this increment;
  its discovery assertions were updated for the newly requested homepage/IELTS links. No speech/model
  implementation changed, and no real provider request or message was sent by this increment.

## 4. Delivery contract

### Authorization and git

- Never commit, amend, push, tag, create a PR or deploy without explicit owner authorization.
  Implementation requests alone do not grant it.
- Before any authorized commit, inspect `git status`, `git diff`, `git log --oneline -10`, branch and
  remote. Stage only intended files or hunks. Preserve unrelated uncommitted work.
- The only valid destination is the EducationPlatform private repository above. Never reuse LawTest's
  remote or commit LawTest data.
- Exclude secrets, `.env`/`.env.local`, logs, `artifacts/`, model caches, generated output and
  dependency caches. Verify the final staged diff before committing.
- Report local changes, commits, pushes and deployments separately, with actual refs and outcomes.

### AI agent attribution

- Several AI agents work in this repository, sometimes in parallel (for example Codex and Claude Code).
  Every agent must state which work it did in the Markdown files it updates.
- Each new `OPERATIONS.md` increment section starts with an `Agent:` line naming the tool and model
  (for example `Agent: Codex` or `Agent: Claude Code (Claude Opus 5.5)`). If several agents contributed,
  list each and the parts it did. Never claim, edit away or re-attribute another agent's work.
- When editing `PROJECT.md` or other Markdown, say in that increment's `OPERATIONS.md` entry which
  agent made the change. Check results are attributed to the agent that actually ran them.
- Entries written before 2026-10-25 section 12 predate this rule and are not attributed.
- Coordinate live work through [ACTIVE_WORK.md](./ACTIVE_WORK.md): check it before every task and
  before builds, preview restarts, database changes, commits or pushes; claim rows and remove them when done.

### Changes and verification

- Read the installed Next.js guides in `node_modules/next/dist/docs/` before framework-specific code.
- Application changes require lint, typecheck, all unit tests, a production build, and the four
  required browser suites (`browser`, `accounts`, `exercises`, `exams`), plus any area-specific
  suites. Inspect affected screenshots when UI changes.
- Documentation-only changes require `git diff --check` and a secret scan; they do not require an
  application rebuild.
- Never weaken assertions, skip a failing suite, shorten public timers, or add a runtime bypass to make
  a test pass. Test fixtures may alter only QA rows and may advance deadlines only through the
  existing trusted local fixtures.
- Report only checks actually run. Distinguish unit tests, mocked transport tests, local fixtures,
  real provider calls, hosted runs and deployments.
- Update this file with each increment's actual outcomes. Update `PROJECT.md` only when stable behavior
  or setup changes.

### Security and product invariants

- Keep owner, plan, exam ownership, active-exam, quota, same-origin and bounded-body checks on the
  server.
- Never trust client scores, prices, user IDs, content versions or model prompts.
- Never grant global paid access; keep purchases and LEGACY grants intact.
- Keep DeepSeek and other provider keys server-side. Never send secrets, account identity, cookies,
  scratch work or unrelated history to a model.
- Reserve the five exact demo addresses for the documented exemptions. They must never become admins
  or mutate shared profile/password state.
- Preserve the verified-email gate on sessions and APIs when verification is required.
- Preserve immutable attempt snapshots and exact-version grading.
- Do not edit or query LawTest/Lexlab repositories or databases. The homepage link is the only
  relationship.
- Do not fabricate scores, email delivery, provider behavior, deployments or test results.

## 5. Provider runbook

### Local Gmail SMTP

1. Enable 2-Step Verification on the Google account.
2. Create a 16-character App Password (Google Account → Security → App passwords).
3. Put `GMAIL_USER` and `GMAIL_APP_PASSWORD` in the ignored `.env.local`; never paste them into chat,
   source, logs or documentation.
4. Restart the local preview so the new environment is loaded.
5. Verify with a small server-side SMTP check. Do not send repeated test messages.

Gmail uses `smtp.gmail.com:465` with TLS. It is local by default; the owner authorized hosted Gmail
on 2026-10-24, supported only with a clean hosted pilot and explicit `AUTH_HOSTED_GMAIL=true`. The
loopback outbox still works only locally and takes precedence when `AUTH_EMAIL_TEST_MODE=true`.
Reserved `.invalid` addresses are skipped for Gmail and Resend. Hosted personal accounts must verify
their email; enabling Gmail does not disable the verified-email gate.

### Switch local email to Resend

Remove the Gmail values, set `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM`, then restart. Resend
is an alternative hosted transport; owner-enabled hosted Gmail is also supported. A custom domain is required for a credible sender; the owner
deferred that purchase.

### Hosted Google and email

The owner has authorized and configured the production Google and Gmail credentials through Vercel.
For future rotations, add `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and `RESEND_API_KEY`/`AUTH_EMAIL_FROM` to Vercel only
when the owner supplies real values. Add the hosted callback URI to the Google OAuth Web client:
`https://education-platform-seven-neon.vercel.app/api/auth/callback/google`.

Enabling a hosted sender automatically enforces email verification for all non-demo hosted accounts,
including existing accounts. Plan the migration/communication before enabling it. The five demo
accounts remain exempt. Google sign-in requires a verified Google email.

### Recovery QA server

After a production build, start `node artifacts/start-auth-recovery.mjs`. It reads local env files,
refuses a non-loopback database, forces `BETTER_AUTH_URL=http://localhost:3002`, enables the loopback
outbox and verification, uses synthetic Google credentials and logs under `artifacts/`. It must never
be exposed publicly and is not evidence of real provider behavior.

## 6. Pending work

1. Hosted Gmail verification delivery to the owner inbox is now independently confirmed. Review
   pilot deliverability/bounces and provider sending limits before expanding account onboarding.
2. Complete one real Google sign-in with an owner-controlled test account and verify the callback,
   verified-email requirement and account-linking behavior.
3. When a domain/sender is purchased, configure Resend and `AUTH_EMAIL_FROM`; switch local Gmail off.
4. Commit/push are owner-authorized for this checkpoint. Deployment verification is separate: after
   an authorized deployment, run `tests/hosted_demo_smoke.py` and hosted auth checks against that source.
   Hosted Google additionally requires the provider pair and an allowed hosted callback URI.
5. Create new catalog items and replace media if the owner wants more than the existing 16 items.
6. Complete content review, official-paper question/solution verification and broader Mongolian/
   pedagogical evaluation.
7. Plan production billing, email deliverability, data retention, account deletion and accessibility.

## 7. Condensed history

| Date | Milestone |
| --- | --- |
| 2026-10-22 | Foundation, SAT Math practice, accounts, timed exams, admin basics; dark theme, Manrope and interface refresh; owner expanded scope to SAT, IELTS and university entrance |
| 2026-10-23 | Hosted pilot, plans/subscriptions, simulated mock purchases, admin expansion, versioned publishing/reporting, official 2020 EEC paper, scratchpad, DeepSeek tutor, isolated Speaking Lab; Singapore Neon migration |
| 2026-10-24 | Google OAuth and verification/recovery; local Gmail; hosted shared demo controls; consolidated docs; homepage sketches/reveals, Speaking discovery/return path and explicit same-email Google linking; owner-authorized Git delivery |

Earlier details were intentionally compressed. The stable behavior, limits and contracts are preserved
in `PROJECT.md`; exact old screenshots and test logs remain under ignored `artifacts/` where present.

## 8. Command reference

```powershell
# Local development
npm ci
npm run setup:env
npm run db:start
npm run db:migrate
npm run db:generate
npm run db:seed
npm run dev

# Production-mode local preview
npm run build
npm start

# Required checks
npm run lint
npm run typecheck
npm test
python tests/browser_smoke.py
python tests/accounts_smoke.py
python tests/exercises_smoke.py
python tests/exams_smoke.py

# Area suites (run the relevant ones)
python tests/auth_recovery_smoke.py
python tests/homepage_polish_smoke.py
python tests/admin_smoke.py
python tests/profile_smoke.py
python tests/theme_smoke.py
python tests/demo_accounts_smoke.py
python tests/payments_smoke.py
python tests/subscriptions_smoke.py
python tests/official_paper_smoke.py
python tests/publishing_smoke.py
python tests/tutor_smoke.py
python tests/speaking_lab_smoke.py

# Provisioning
npm run demo:accounts
npm run admin:grant -- qa-demo-01@example.invalid

# Documentation hygiene
git diff --check
git status --short
```

Do not run hosted/real-provider checks without the necessary credentials and explicit owner
authorization. Do not run `tests/hosted_demo_smoke.py` until the new source is deployed.


## 9. Hosted authentication activation follow-up — 2026-10-24

- Owner explicitly requested configuring Vercel with the existing Google and Gmail values in ignored
  `.env.local`, including necessary source support and deployment. No secret value is recorded here.
- Added `AUTH_HOSTED_GMAIL` as an explicit hosted-pilot opt-in. Default behavior remains local Gmail;
  hosted Gmail enforces verification for personal accounts and retains the exact shared-demo exemptions.
- Existing non-demo hosted accounts must verify via `/verify-email` before a session is accepted.
  Password recovery remains available. Do not mark all existing rows verified or send bulk messages.
- Local Gmail SMTP authentication was freshly verified without sending a message.
- Vercel initially returned 403 for team `unubold12345s-projects`. The owner completed team approval;
  project access then succeeded. Exact project: `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`.
- Configured the Google ID/secret and Gmail user/app-password as sensitive, production-only Vercel
  variables, plus `AUTH_HOSTED_GMAIL=true` and `AUTH_REQUIRE_EMAIL_VERIFICATION=true`. Local env files
  were preserved. No Resend key was uploaded because there is no verified `AUTH_EMAIL_FROM`.
- Source `0ec6d80` was pushed and the authorized production deployment is READY; see the result below.
- Local validation: lint, typecheck, all 56 unit tests, production build, the four required browser
  suites and the recovery suite pass. The first exercise concurrency run returned a Prisma-related
  503; a clean standalone rerun passed without changing assertions or runtime behavior. No inbox
  delivery or real Google login is claimed by the SMTP authentication check.


### Hosted activation result

- Source `0ec6d80c3142d28382f6055f5a9c8f20234b5084` was committed/pushed and automatically deployed
  to production. Vercel deployment `dpl_5GYtHHME3BMQZBPD59tBSnsc6nZY` is READY, region `sin1`, and
  owns `https://education-platform-seven-neon.vercel.app`; build-to-ready took about 4 minutes.
- `tests/hosted_auth_activation_smoke.py` passed against that canonical domain: Google button,
  real authorization URL/state/PKCE, correct callback, forged-state and foreign-origin denial,
  enabled recovery/verification forms, mandatory personal-email verification and no unverified
  session. Inspected hosted login/verification at 320px in both themes and the real Google page.
- Google displayed its sign-in form for the hosted application without `invalid_client` or
  `redirect_uri_mismatch`. No Google password, consent or token exchange was performed by the agent.
- One verification email was sent through the actual hosted signup flow to a test alias of the
  connected owner's configured Gmail mailbox. Receipt was independently confirmed through the
  Gmail connector with INBOX/SENT labels and the canonical hosted verification-link origin.
  This created one unverified owner-mailbox QA account and did not issue a session. No other person
  received a test message, and no private credential or verification token is recorded here.
- Hosted demo checks initially exposed an incorrect GET assertion against the POST-only admin
  endpoint (405). Corrected the test to require actual POST denial (403). Repeated rapid runs also
  hit the real sign-in/password-change rate limits. Tests now wait for the existing password-change
  idle window; no rate-limit configuration or app safeguard was weakened.

- Final `tests/hosted_demo_smoke.py` passed for all five canonical hosted accounts: shared-demo
  disclosure/fill buttons, identities, learner-only access, POST admin denial, profile/password
  mutation denial, no false email verification, logout and 320px layout. The pacing changes are
  test-only and retain exact 403 assertions.
- Final credential scan and `git diff --check` passed; hosted test files also compile. Post-deployment
  verification notes and test corrections are local-only changes, with no application source changes
  after the pushed/deployed `0ec6d80` build.


## 10. Banner removal and login cleanup — 2026-10-24

- Owner requested removing the global hosted-pilot announcement banner. Removed its root-layout
  markup, imports and unused CSS.
- Removed direct verification links from the login form and its error panels, the login explanatory
  footer and the shared email divider. Google sign-in now uses a four-colour SVG logo button with
  an accessible name, busy/disabled state and a 48px target on login and registration.
- Profile verification controls remain. Server verification, ownership, plan, quota and origin checks
  were not changed; unverified sign-in still redirects to the required verification flow.
- Latest lint, typecheck, all 56 unit tests and production build passed. Visual/DOM checks passed
  login, registration and OAuth-error layouts at 1440/390/320px in both themes, including absence of
  the removed text/links/banner and the accessible logo-only button. Screenshots were inspected.
- The initial banner-only browser run was superseded when the owner added login requirements;
  the final combined-change run passed all four required browser suites plus auth recovery and
  homepage polish. `git diff --check` and the credential scan passed. The owner-authorized UI
  update is ready for push/deployment; record hosted confirmation after it is READY.

- UI cleanup source `f381f5856bd664f09856f7dbcb936bf966c43c34` was committed/pushed and deployed
  READY as `dpl_AsPMgZ1DvQmcdaotuEreXfEi5QTV` on the canonical production domain.
- Hosted visual/DOM checks passed homepage, login, registration and linking-error pages in both
  themes at desktop/320px: global banner absent, requested text/direct verification links absent,
  logo-only Google button present, no overflow/browser errors. Clicking the logo opened Google's
  sign-in page without a redirect-URI mismatch. Hosted screenshots were inspected.
- Post-deploy notes are saved locally. Earlier hosted-test corrections remain preserved locally;
  no application source changed after the deployed build.

## 11. 2020 Mathematics category and all variations — 2026-10-25

- Owner requested one 2020 Mathematics category with every variation. `/exams/eec-math-2020`
  lists A, B, C and D; the exam library and University Prep page link to that category.
- Verified all 32 original archive images and inspected the three official key images at
  `http://help.eec.mn/modelItems/2020Key/mat/mat-1.jpg` through `mat-3.jpg`. Transcribed separate
  B/C/D choice columns and digits. A/C 2.1 groups d/e; B/D marks those cells separately.
  Each variation retains eight pages, 36 choices, four digit responses, 100 minutes and 72+28 marks.
- Starts resolve a server-approved variation and snapshot its own paper/key. Paid access remains
  scoped to the exact paper slug; University Prep includes all four. The category cannot be purchased
  or started as a paper. Existing A purchases, LEGACY access and saved snapshots remain intact.
- Workspace labels, dashboard history and admin attempts/previews identify the actual variation.
  Admin review includes all four read-only papers. Server ownership, origin, verified-email,
  entitlement, deadline, revision and immutable-submit checks are preserved.
- Lint, typecheck, all 58 unit tests and production build passed (49 routes). Extended official-paper
  browser checks passed all A–D live pages, variation grading, save/resume, history, purchase isolation,
  subscription access, ownership, invalid slugs, stale writes, immutable submission and expiry.
  Category layouts passed at 1440/390/320px in both themes. Inspected those screenshots, B/C/D
  workspaces and the mobile answer sheet.
- The first browser attempt reached the previously running preview and correctly failed the new
  category-title assertion. Verified the listener, restarted only this project's preview with the
  current build and reran successfully. No assertion or application safeguard was weakened.
- Changes remain local. No commit, push, PR or deployment was performed. Existing hosted-test edits
  and prior operations notes are preserved. No real payment or provider message was sent.
- All four required browser suites (`browser`, `accounts`, `exercises`, `exams`) passed, followed by
  the admin suite, including all four official-paper source/key previews. Python compilation,
  `git diff --check` and the private credential/pattern scan passed with no secret findings.
- Final extended official-paper rerun also passed the new B simulated checkout, return to B,
  B purchase listing in the profile and continued C/D purchase denial. No application source changed
  after the passing production build; subsequent changes were tests and documentation only.

## 12. HTTPS exam image repair — 2026-10-25

Agent: Codex.

- Owner reported missing exam images on Vercel. Read-only hosted inspection confirmed production is
  still deployment `dpl_AsPMgZ1DvQmcdaotuEreXfEi5QTV`. No hosted account or exam data was changed.
- Reproduced the image failure in a normal Chromium context on the canonical HTTPS domain: its
  HTTP archive image was automatically upgraded to HTTPS and failed with `ERR_CERT_DATE_INVALID`.
  Direct HTTP retrieval returned JPEG/200; HTTPS retrieval failed certificate validation.
- Added 32 unchanged A–D JPEGs under `public/exam-assets/eec-math-2020/` (3,566,032 bytes total).
  Fresh archive downloads matched the previously reviewed images byte for byte. Source addresses,
  SHA-256 hashes, dimensions and sizes are recorded in `assets/papers/eec-math-2020.json`.
- The workspace maps only exact reviewed source page URLs to same-origin images. Existing attempt
  snapshots retain their original provenance and load the secure copies without database rewriting.
  Original source links remain available. There is no runtime proxy or external fetch dependency.
  Answer keys, purchase checks, timers, ownership and grading are unchanged by the image repair.
- Lint, typecheck, 60/60 unit tests and production build passed. New unit checks cover all image
  hashes and exact URL mapping, including old snapshot provenance and leaving other URLs unmapped.
- Actual workspace pages were also tested through a temporary loopback HTTPS reverse proxy. All
  32 images loaded from the HTTPS app origin with the archive blocked and zero archive requests;
  attribution links, desktop and 320px light/dark layouts passed and screenshots were inspected.
  The local browser trusted only the temporary self-signed QA setup; production certificate checks
  and the earlier hosted reproduction were not bypassed. This is local HTTPS evidence, not a deployment.
- Local preview was restarted with the passing build. Source repair and the preceding A–D category
  increment remain local; owner authorization is required before commit/push/deployment.
- Final `official_paper_smoke.py` passed with the archive explicitly blocked for both learner
  contexts, including all 32 bundled images, grades, save/resume, purchases, subscriptions and expiry.
  All four required browser suites (`browser`, `accounts`, `exercises`, `exams`) passed on the current
  production build. Python compilation, `git diff --check` and the credential/pattern scan passed.
  There were no failing application checks in this increment. These results cover the 12:17 local
  build containing the image repair. Unrelated dashboard/global-style edits appeared at 12:23 while
  validation was running and were preserved; those later edits are outside this verification.
  Hosted repair verification awaits an owner-authorized deployment.

## 13. Dashboard clarity rewrite — 2026-10-25

Agent: Claude Code (Claude Opus 5.5). Renumbered from a duplicate "12" to 13 by the same agent.

- Owner reported the dashboard was hard to understand. `/dashboard` now has explicit labelled
  sections: resume card (with item type and timer warning), "Таны явц" stats with one-line
  explanations, "Шинээр эхлэх" (Дасгал / Бүтэн шалгалт / Үнэгүй жишиг cards), plans, and
  "Миний түүх" with per-type counts and Дууссан/Дуусаагүй chips on every row. Removed the
  duplicated library banner. Queries, links, access checks and test-relied classes/headings are
  unchanged. Only `src/app/dashboard/page.tsx` and appended `globals.css` rules changed.
- Done in parallel with separate exam-image work; the shared 3001 preview was not rebuilt or restarted.
- Checks run: typecheck, lint, all 60 unit tests, `git diff --check`. A separate dev server on 3005
  rendered the page for a fresh local QA account at 1440/390/320px in light/dark with no horizontal
  overflow or page errors; screenshots inspected. **Not yet run:** production build and the four
  required browser suites. Run them before any commit/deploy. Nothing committed, pushed or deployed.
- Follow-up (owner: no long desktop scroll): at ≥1000px the dashboard is two columns — activity
  (resume, stats, history) on the left, a sticky aside with compact start cards and plans on the
  right. Each history list shows the latest 5 rows; older rows stay in the DOM inside a native
  `<details>` ("Бусад N-г харах"). Below 1000px it stacks as one column. Desktop page height for a
  one-attempt account dropped to 1177px; 390/320px have no overflow; both themes inspected. Re-ran
  typecheck, lint and `git diff --check`. The >5-row fold was not exercised with real data.
- Second follow-up (owner: "too much text, messy, make it minimalistic"): rewrote layout and styles.
  Removed explanations, eyebrows, icon stat boxes, start cards and the long plans card. Now: greeting
  plus Profile/Sign out; one-line resume strip; three plain numbers between rules; list-style history
  (title, date, score/"Үргэлжлүүлэх →", latest 5 plus "Бусад N"); a quiet aside with three start links,
  the free SAT sample button and active plans only (full plan management stays on `/profile`).
  Test-relied classes/headings and the sample-button label are unchanged. Desktop height for a
  one-attempt account ~1010px; 390/320px no overflow; both themes inspected on the 3005 dev preview.
  Re-ran typecheck, lint, 60/60 unit tests and `git diff --check`. Build and browser suites still not run.

## 14. English archive with matched answers — 2026-10-25

Agent: Codex (GPT-6).

- Owner requested every available English exam year and variation, excluding papers without answers.
  Codex researched and added 37 verified paper/key pairs: 2006 A–E; 2007 A–C; 2008 B–F;
  2009 B/D/H/I; 2010–2011 A–D; 2018–2020 A–D. Coverage means complete retrievable paired sources,
  not every year since the exam began. Missing and mismatched sets remain unpublished.
- `/exams/eec-english` groups years and opens each variation's source-paper and answer-key viewer.
  It is a free paper/self-check archive, with no invented grading, timer or saved-attempt claim.
  Existing Mathematics timers, entitlements, purchases, ownership and grading are preserved.
- The six 2006–2011 БҮТ PDFs were retrieved from the NUM school mirror and retained as provenance.
  Rendered pages are clipped at printed variation headings, preserving all questions while avoiding
  adjacent-variation content. The 2018–2020 original JPEGs come from БҮТ's public archive.
  All 218 English images are served from this app; source links and hashes are recorded in
  `assets/papers/english-archive.json`. This also records excluded years and unavailable 2019 E.
- Historical 2012–2017 official links returned missing pages. The accessible 2021 mirror key fails
  the official paper option order (e.g. A question 4); it was not inferred or silently corrected.
  The newer public task bank has placeholders/incomplete or inconsistent sections, and older
  2022–2025 PDF links returned 404. No complete matched 2022–2026 set was verified. These exclusions
  do not claim that answers do not exist elsewhere. Old listening audio is not bundled.
- Codex updated `PROJECT.md` with coverage, source handling, exclusions and the self-check scope.
  Codex ran lint, typecheck, 62/62 unit tests and production build (87 generated pages). The English
  browser suite passed all 37 viewers and all 218 asset hashes, answer-column notices, missing-paper
  404s, source-outage behavior, library/program links and 1440/390/320px themes. Screenshots and
  first/last-page contact sheets were inspected. The final hover-contrast adjustment was rebuilt;
  the final browser regression outcomes are recorded below.
- Owner explicitly chose Claude Code to handle the combined push after Codex finishes. Codex has
  not staged, committed, pushed or manually deployed this work. Claude Code owns the git resource
  on `ACTIVE_WORK.md`; the ignored `artifacts/exam-delivery/` snapshots are preparatory only and
  are not final/current staging instructions. Preserve and review all unrelated work before delivery.
- Final regression notes: the first official-paper run encountered a removed dashboard wrapper from
  the concurrent redesign. Codex updated the history assertion to check each exact attempt link and
  variant title; the full official-paper suite then passed. The browser suite passed. The first
  accounts run reached the real five-per-minute sign-up limit (HTTP 429); a serial rerun after the
  window expired passed. No rate-limit configuration or runtime safeguard was changed.
- Python compilation, `git diff --check` and the credential/pattern scan passed (292 changed/new
  files scanned, zero findings). The exercises suite passed all 80 questions, ten sets, four
  workshops, private history, grading and 320/390px layouts. The exams suite passed SAT 98,
  IELTS 40+40, essays/recordings, ownership, server clocks, resume/results and mobile layouts.
  The admin suite passed authorization, controls, audit, exports, all four math variant previews
  and responsive themes. All required final browser suites passed on the final production build.
- Handoff: Codex work is complete and ready for Claude Code's owner-authorized combined push.
  Local preview remains on port 3001 (last observed Codex-owned PID 23880); no build/restart is
  running. Codex released its preview/database claim. No Codex staging, commit, push or manual
  deployment occurred. Hosted verification must follow the successful combined push/deployment.

## 15. Combined delivery and agent coordination rules — 2026-10-25

Agent: Claude Code (Claude Opus 5.5).

- Owner authorized pushing all completed work, including Codex's image repair (section 12) and English
  archive (section 14), plus Claude Code's dashboard redesign (section 13).
- Added owner-requested coordination rules: `docs/ACTIVE_WORK.md` (claim board: check before every task
  and before builds, preview restarts, database changes, commits or pushes; warn the owner before a task
  that collides with or interrupts another agent), the `Agent:` attribution rule in section 4, and
  matching lines in `AGENTS.md`. Restored the dashboard greeting's final period required by
  `accounts_smoke.py` (found by Claude Code's run; no assertion changed).
- Codex's final production build (13:12) contains all current application source; only
  `tests/official_paper_smoke.py` changed afterwards (Codex's assertion update).
- Claude Code's own final checks on that tree: lint, typecheck, 62/62 unit tests, `subscriptions_smoke.py`
  pass, and `official_paper_smoke.py` pass. Earlier official-paper attempts failed for environment
  reasons only: one concurrent rebuild by another agent, one PGlite fixture protocol error (`08P01`) and
  one real sign-up rate limit (HTTP 429 window); none changed tests or safeguards. Before Codex's English
  work, Claude Code's combined build also passed the four required suites plus profile and payments.
  Codex's section 14 records its final required-suite passes on the final build.
- Credential scan over all 292 changed/new files: no secret values or key patterns; only the public
  hosted URL matched an env value. Pushing triggers Vercel production deployment; hosted verification
  of images, English archive and dashboard must follow.


## 16. English exams replace the self-check viewer — 2026-10-25

Agent: Codex (GPT-6).

- Owner clarified that English must behave like Mathematics exams. Codex replaced the public viewer
  route with the shared official-paper briefing and sitting lifecycle for all 37 included variations.
  English now appears as the fourth exam category, with year/variation selection, per-paper checkout
  or University Prep access, autosave/resume, server deadlines, submission, graded results and history.
- Added separate public layouts and private per-variation key transcriptions. Historical 2006–2011
  columns were extracted from the retained original PDFs; 2018–2020 columns were transcribed from
  the bundled original key images. Shared grading/validation now follows the snapshot's actual counts
  and digit lengths. Mathematics default validation and old immutable snapshots retain their layout,
  paired scoring, 100-minute deadline and 100-point result.
- English duration is 80 minutes. 2011/2020 rules are linked; pre-2011 original timing is unverified
  and labelled as a practice duration. Historical 2006–2011 results explicitly count correct answers
  and cells, with no invented original weighting. 2018/2020 use printed key weights. 2020 D's literal
  `e17` cell (2.3e) is ambiguous and ungraded (maximum 99). 2019's absent listening recording makes
  41–46 ungraded (written maximum 88). Briefings, answer sheets and results disclose these limits.
- Codex updated `PROJECT.md` with the corrected exam behavior, data boundary and scoring limits.
  Verification: lint, typecheck, all 67 unit tests and the production build passed (50 generated
  pages; the 37 personalized briefings are now dynamic). The English browser suite passed all
  37 variants, all 218 served hashes, checkout/plan isolation, ownership, saved-answer reload,
  80-minute deadlines/expiry, CAS rejection, immutable results and a full UI submission. Browser
  navigation/practice suite passed. English desktop and 320/390px light/dark screenshots were
  inspected. The full Mathematics suite passed A–D images, exact 100-point grading, old snapshots,
  autosave, private ownership, access, expiry and mobile layouts. Accounts and exercises suites
  also passed. Standard exam and admin suites also passed, including the new fourth exam category and
  admin-only English key previews for historical, missing-audio and ambiguous-key variants.
- Python compilation and whitespace checks passed. Credential scan passed across 26 changed/new
  files with zero findings. The built client JavaScript scan found no English key versions or
  known answer strings; active-sitting browser/API checks likewise exposed no private key.
- Delivery remains assigned to Claude Code by the owner. Codex has not staged, committed, pushed or
  deployed this correction. No provider request, email, hosted-data mutation or payment bypass added.

- Final state: all required checks passed on the production build served locally on port 3001
  (last observed preview PID 13576). Codex ran Python compilation, final whitespace and credential
  checks; no app code changed after the verified build. Shared preview/database resources released.
  Ready for Claude Code's owner-assigned push; Codex performed no git mutation or deployment.


## 17. Owner-requested Codex delivery — 2026-10-25

Agent: Codex (GPT-6).

- Owner explicitly instructed Codex to push the code itself, superseding the earlier Claude Code
  handoff for the English exam correction. The active work board had no competing git claim.
- Reviewed branch `codex/education-foundation`, private EducationPlatform origin, status, history
  and changes. Fetch confirmed HEAD and the remote branch were aligned before delivery.
- This delivery contains the verified section 16 English exam correction, tests and documentation.
  No app code changed since the passing production build and browser suites. Final whitespace,
  Python compilation and credential scan passed; no ignored env/log/cache/artifact files included.
- Codex committed `8a0f5e8` (`Run all verified English variations as timed graded exams`) and
  successfully pushed `codex/education-foundation` to origin. `git ls-remote` independently confirmed
  remote HEAD `8a0f5e8f589f1832a4491ab66d9bb6dba36ac82d`. No manual deployment was run;
  no hosted success is claimed. This post-push outcome note remains local.


## 18. Both 2026 Dornod practice papers as exams — 2026-10-25

Agent: Codex (GPT-6).

- Owner requested adding the two recently verified practice papers as exams. No other active claim
  conflicted. Codex added a 2026 Dornod category and Math/English briefings using the existing sitting,
  per-paper/University Prep access, immutable snapshots, autosave, server deadlines and grading.
- Clear regional provenance replaces national/БҮТ labels on these two items. They are discoverable
  from the exam library and University Prep; English also appears above the historical English years.
  Old Math A–D and all 37 historical English papers retain their existing keys, layouts and snapshots.
- Source PDF covers confirm Online Test 4, May 30 Math / May 31 English. Math's download filename
  says Online 3; its actual cover and source listing identify Test 4. Original PDFs are retained.
- Math student images crop the printed answer column while preserving every question and diagram;
  English's cover/key page are separated from its 14 question pages. All 33 student/key JPEGs have
  provenance hashes/crop records. Cropped Math contact sheets and original English/key pages inspected.
- Math uses 36 choices (8×1 + 20×2 + 8×3 = 72) and four 7-point fill-ins with 7/8/8/7 digits.
  The source has no per-cell partial-credit weights: a whole correct fill-in earns 7, disclosed in
  briefing, workspace and result. English's printed weights yield 80 choice points plus 8/8/4 cells
  (20 points). Both total 100. Public timers remain 100/80 minutes as the source covers specify.
- Codex updated `PROJECT.md` with routes, source handling, original filename discrepancy and scoring.
  Unit tests: 70/70 passed. Lint, typecheck and production build passed (51 generated pages).
- The new regional browser suite passed both complete UI submissions at 100/100, all 33 served
  image hashes with the source blocked, 8-cell save/reload, exact 100/80-minute deadlines, per-paper
  versus plan access, ownership, stale/invalid edits, immutable reports, expiry/history and discovery
  links. Category and sitting screenshots at 1440/390/320px in both themes were inspected.
- The first regional/navigation runs encountered the stopped local database (P1001), leaving
  database-backed pages unavailable. Codex restarted the existing named Prisma local service without
  resetting data; both suites then passed. No assertions, runtime limits or access checks weakened.
- Whitespace, Python compilation and credential scan passed (56 changed/new files; zero findings).
  Built client JS contained no regional key version or known answer strings. The full historical
  English suite passed all 37 variations/218 asset hashes. The official Math A–D and account suites
  passed. Exercises also passed. The first standard-exam run encountered a database error payload
  during an IELTS stage GET (`PrismaClientKnownRequestError` in the app log). Codex added an HTTP
  status assertion before reading stage data, preserving all existing assertions, and started a
  standalone rerun. The full SAT/IELTS rerun passed, followed by admin authorization, controls,
  exports, regional key previews and responsive themes. All required and affected suites passed.
- Codex is delivering this exam increment under the owner's instruction to push the code itself.
  The working branch and EducationPlatform origin were rechecked; fetch showed no divergence.
  Only this increment's code, source assets, tests and own documentation are staged. No manual
  deployment or hosted-data change is part of this increment.

## 19. 2026 dark-first interface refresh — 2026-10-27

Agent: Opencode (DeepSeek V4.1 Flash).

- Owner requested a more distinctive 2026 layout and UI/UX across every page in a cool dark theme.
  The owner chose to keep the existing indigo direction but make it darker, more minimal and more
  polished. All implementation, verification and documentation in this section are Opencode's work.
- Added `src/app/theme.css` as a design layer loaded after `globals.css`. It defines dark-first
  near-black indigo tokens (page `#07070d` preserved), a designed light counterpart, Manrope display
  type, mono micro-labels, hairline borders, restrained glow, card and form primitives, focus and
  hover states, reduced-motion handling and responsive rules.
- Restructured the shared shell in `src/app/layout.tsx`: sticky blurred header, denser brand lockup,
  pill navigation with an inverted active state, three-column footer with unique link names, and a
  scroll-progress hairline. The footer navigation uses `role="navigation"` rather than a second
  `<nav>` element so existing `nav a` selectors stay unambiguous.
- Rebuilt the homepage in `src/app/page.tsx` around a 2026 editorial hero (live chip, inline stats),
  a duplicated ticker strip, numbered program cards, and a resource bento that becomes a swipe deck
  on small screens. The existing `.hero`, `.launch-panel`, `.program-card`, `.approach`,
  `.speaking-invitation`, `[data-reveal]` and no-JS contracts are unchanged.
- Refreshed the auth screens with a benefits rail and account kicker while preserving the tested
  labels, Google button, demo-account controls and return paths. The exams library gained an
  "EXAM DECK" summary and denser two-column cards; the programs index gained a three-number meta
  strip; the dashboard gained a dated status line and a real empty-state card; the 404 page was
  restyled while keeping the exact heading required by `browser_smoke.py`.
- Global styles now restyle plans, checkout, subscriptions, profile, practice, exercise/workshop,
  exam briefing and sitting, results, official papers, the English archive, admin and the isolated
  Speaking Lab. The exam sitting hides the global header/footer for focus. Server-side ownership,
  timers, quotas, pricing, auth and grading were not touched.
- Because the documented `3001` preview was occupied by an unrelated `share.mn` application, that
  process was left running. This increment was previewed from a production build on `3006` with
  `BETTER_AUTH_URL=http://localhost:3006`; browser suites used `TEST_BASE_URL`. This is why the
  temporary `homepage_polish` run below needed a port-substituted copy.
- With the owner's explicit approval, the stale Claude Code row on `ACTIVE_WORK.md` (started
  2026-10-25 13:20, more than four hours old) was taken over for this task and removed when the work
  finished. Opencode did not touch that agent's prior code or documentation.
- The local workspace had no `.env`/`.env.local`. `npm run setup:env` created the ignored `.env` with
  a fresh secret; the named PGlite instance was started, the seven committed migrations plus
  `prisma db push` (for newer auth/content tables), and the seed were applied without deleting
  existing rows. The five local demos were provisioned and `qa-demo-01` was granted local admin.
  No hosted database, provider account or secret value was read, printed or changed.
- Checks actually run and outcomes:
  - `npm run lint` — pass; `npm run typecheck` — pass; `npm test` — 70/70 pass.
  - `npm run build` — pass, Next.js 16.4.2, 51 routes.
  - Required suites on the final build: `browser_smoke.py`, `accounts_smoke.py`,
    `exercises_smoke.py` and `exams_smoke.py` all pass. The first accounts attempt hit the real
    five-per-minute sign-up window (HTTP 429); a serial rerun passed without changing limits.
  - `theme_smoke.py` and `admin_smoke.py` pass on the final build.
  - `official_paper_smoke.py`, `english_archive_smoke.py`, `regional_papers_smoke.py` and
    `publishing_smoke.py` pass on the final build, including every bundled asset hash, mobile
    layouts and the full answer-sheet interaction.
  - `profile_smoke.py`, `demo_accounts_smoke.py`, `payments_smoke.py` and
    `subscriptions_smoke.py` pass. These ran immediately before the final CSS-only change that
    enlarged the official-paper radio hit target; no profile, demo, payment or subscription source
    changed afterwards.
  - `homepage_polish_smoke.py` hardcodes `http://localhost:3001`, so it could not run canonically
    against the unrelated process there. An otherwise identical temporary copy was run against
    `3006` with synthetic Google credentials (the link failure was mocked): pass for animation,
    reduced motion, no-JS, theme/mobile layouts, Speaking discovery and Google-link recovery. This
    is local synthetic evidence, not a real Google login.
  - Desktop/mobile screenshots were inspected in dark and light for the homepage, programs, exams,
    plans, login, checkout, dashboard, profile, official paper category, English archive, admin,
    Speaking Lab and 404. A real admin overflow at 320px was found and fixed.
- `git diff --check` passed with only the expected LF → CRLF warnings. A credential and common-key
  pattern scan over the 14 changed/new files found zero findings. The unrelated, pre-existing
  uncommitted `package.json` `allowScripts` edit was preserved and is not part of this increment.
- The `3006` production preview remains available for owner review; the unrelated `3001` process
  was not stopped or modified.
- `tests/payments_smoke.py` expected three mock prices even though the repository already listed
  four exam cards (SAT, IELTS, EEC Mathematics and EEC English). The assertion was corrected to
  four existing prices; no payment check, amount or denial assertion was weakened.
- Limits: the recovery suite was not run (the ignored recovery-server script and separate 3002
  setup are absent here); the functional Speaking Lab, real DeepSeek tutor and hosted suites were
  not rerun because they require provider credentials, model caches or an authorized deployment.
  No email or real payment was sent. No commit, push, PR or deployment was performed.
- `PROJECT.md` was updated by Opencode with the stable location and scope of the new interface layer.

## 20. Imported history from the PC bundle - 2026-10-25

Imported on 2026-10-28 from `Desktop\codes\apienvfolders\EducationPlatform\docs\OPERATIONS.md`.
These entries describe work done on another machine and are **not present in this working tree**;
section 19 above remains the current local checkpoint. They are kept here so the EEC 2026 history
and verification details are not lost.

### English 2026 category and display name — 2026-10-25

Agent: Codex (GPT-6).

- Owner requested moving the Dornod English practice paper into ЭЕШ English as its 2026 version,
  explicitly forbidding push. Codex changed the display title to `ЭЕШ 2026 · Англи хэл` and grouped
  it in the year list as `2026 хувилбар` (38 variations / 10 years). It is no longer a separate
  Dornod English banner/card; the Dornod category and banner now show Math only.
- Source attribution still identifies the original Dornod practice material. Stable slugs, per-paper
  purchase IDs, stored snapshots, keys, timers, grading and access checks are preserved. Existing
  English sittings show the new display title without modifying their snapshots. Checkout, history,
  briefing and category links follow the updated naming.
- Codex updated `PROJECT.md` and existing browser assertions for the requested labels/category counts.
  Lint, typecheck, 70/70 unit tests and production build (51 generated pages) passed. Both 2026
  exam lifecycle tests and the navigation suite passed with the updated labels/category links.
  All 37 historical English lifecycles, accounts, exercises, standard exams and admin checks passed.
  The first admin run hit the normal auth request limit (429); after waiting for its real 60-second
  window, the standalone rerun passed without changing limits or checks. Desktop/mobile light/dark
  screenshots were reviewed. Diff whitespace and the 15-file delivery secret scan passed.
- Local preview remains on 3001 (PID 20804), database on 51214 (PID 11424). No staging, commit,
  push or deployment was performed; HEAD remains `ba2dc80`. Shared resource claims released.

### Documentation review — 2026-10-25

Agent: Codex (GPT-6).

- Read all three files in docs: OPERATIONS.md, PROJECT.md and ACTIVE_WORK.md.
- Reviewed the latest local-only English 2026 naming/category checkpoint and coordination rules.
  Existing application and documentation changes were preserved. No build, service restart,
  database change, staging, commit, push or deployment was performed.
- Documentation whitespace check and secret-pattern scan of this new entry passed.


### Official 2026 EEC exams replace Dornod listings — 2026-10-25

Agent: Codex (GPT-6).

- Owner requested removing both Dornod Math/English papers and adding every 2026 ЭЕШ subject from
  eec.mn. The work board was empty. Existing uncommitted work was preserved; no git delivery was
  authorized. Owner explicitly selected all 40 papers with grading unavailable until official keys
  are verified.
- Read EEC's public events API behind the new materials library. The exact national entrance event
  supplies ten subjects with A–D each. Imported all 40 original PDFs and all 432 uncropped pages;
  source IDs/URLs, original filenames, byte counts, hashes and official schedule are recorded in
  assets/papers/eec-2026.json. Excluded the separate МХБШ, school/teacher assessments and task-bank
  entries that were placeholders or actually described 2025. Old WordPress article URLs returned 404.
- Added /exams/eec-2026 with all subjects and links from Exams/University Prep. The four official
  English variants replace the regional version in the English year list (41 variations / 10 years).
  Both Dornod papers are absent from listings, starts, checkout and admin catalogs; their old public
  briefing/category URLs return 404. Historical assets/keys and existing private snapshots remain.
- The 40 new variants use the existing per-paper/University Prep access, server deadlines,
  autosave/resume, revision checks, ownership and immutable submission/expiry. Math/Physics/Chemistry
  use the official 100 minutes; seven other subjects use 80. Source-specific layouts include
  differing choice counts and 5–8-cell fill-ins. Keyless responses validate against the server's
  snapshotted layout. Keyless submissions return no report/key, rather than a fabricated zero score.
- Briefings, checkout, sittings, admin previews and submitted results state that grading is
  unavailable. Existing graded Math/English and legacy Dornod snapshots keep their original keys.
  Codex updated PROJECT.md and the retirement/admin/English tests to match the new catalog.
- Codex ran lint, typecheck, 73/73 unit tests and production build successfully (52 generated pages).
  The final source build is served on local port 3001 (preview PID 31248). The EEC browser suite
  passed all 40 lifecycles, all 472 served PDF/image hashes, exact deadlines, purchase/plan isolation,
  ownership, invalid/stale edits, autosave/reload, final UI submission, immutable no-score results,
  expiry/history, retired listings and an isolated legacy Dornod snapshot with its 100-point report.
- Ten source-page contact sheets were inspected; category and subject sitting layouts passed desktop
  and 320px light/dark, with category checks also at 390px. Screenshots were inspected. Navigation,
  accounts and the dedicated regional retirement browser checks passed.
- Initial new-suite runs corrected two test assumptions: retired start slugs return the existing
  API's exact 400 validation status (public routes return 404), and disabled fieldsets are checked
  through their disabled attribute plus an actual disabled radio. A subsequent run reached the real
  sign-up 429 limit. After its normal window elapsed, the complete standalone EEC suite passed;
  no runtime safeguard, deadline, quota, assertion meaning or application rate limit was weakened.
- Python compilation, whitespace check and credential/pattern scan passed at this checkpoint
  (501 changed/new files, zero findings). Remaining regression results are recorded below.

- Final regression results: exercises passed all 80 questions, ten sets and four workshops. Standard
  SAT/IELTS exams passed delivered counts, audio/recordings, ownership, server clocks, standard
  deadlines, resume/results and responsive layouts. Official Math A–D passed original scoring,
  image availability, access/purchases, privacy, save/resume, immutable submission and expiry.
  Historical English passed all 37 lifecycles and 218 asset hashes with its original independent
  keys/scoring, access, saved work and deadlines. Admin passed authorization, controls, audits,
  exports, historical key previews and ungraded 2026 previews for all ten subjects. All four
  required browser suites and every affected paper/admin suite passed on the final source build.
- Final 73/73 unit rerun passed. Python compilation, final whitespace check and private credential/
  pattern scan passed (501 changed/new files, zero findings). No app source changed after the final
  production build. Only reserved local QA rows were used; no real email, AI provider call, real
  payment or hosted-data mutation occurred. No staging, commit, push or deployment was performed.
  Local preview remains on 3001 (PID 31248); shared build/preview/database claims released.

## 21. Workspace moved to this PC — 2026-10-29

Agent: Claude Code (Claude Opus 5.5).

- Owner moved development to a different PC; this is now the current workspace:
  `C:/Users/Hitech/Desktop/codes/educationplatform`. Claude Code updated the workspace path in
  `AGENTS.md` and added a pointer in section 2. No other agent's entries were rewritten.
- Observed state of this tree: branch `codex/education-foundation`, HEAD `3563065` (the section 19
  interface refresh) equal to `origin/codex/education-foundation`. Section 19's "no commit or push"
  note predates that commit; whether Vercel deployed it was not checked.
- The 2026 EEC 40-paper import and English 2026 renaming (section 20) are **not** in this tree:
  there is no `/exams/eec-2026`, `public/exam-assets/eec-2026` or `assets/papers/eec-2026.json`,
  and the Dornod 2026 papers are still live here. The copied bundle at
  `Desktop/codes/apienvfolders/EducationPlatform` holds only env files and docs, not that source.
  Recovering it requires the previous PC's working tree.
- Ignored `.env`/`.env.local` and Vercel env snapshots exist here (values not read). No process
  was listening on 3001, 3002, 3006 or 51214/51215 when checked; previous-PC PIDs do not apply.
- Documentation-only change: no build, service start, database change, commit or push.
- Checks run by Claude Code: `git diff --check` passed (only LF → CRLF warnings). Secret scan of the
  docs/`AGENTS.md` diff against local env values and key patterns found no secrets; the only match
  was the non-secret `BETTER_AUTH_URL` address already documented above.

## 22. Student-facing programs redesign — 2026-10-29

Agent: Opencode (DeepSeek V4.1 Flash).

- Owner reported that the program index and program detail pages were confusing and asked for a
  clearer, more student-friendly design. The owner explicitly approved sharing the `programs` area
  with Claude Code's active claim; Claude Code then recorded the split on `ACTIVE_WORK.md`.
- `/programs` is now a student decision page: a direct "which exam are you preparing for?" hero, a
  free three-question sample card, one scannable card per program with an audience line, three
  benefit chips and a clear open action, a compact 80/04/04 fact strip, and a three-step
  "choose → practise → review" strip. The Lexlab recommendation remains.
- `/programs/[slug]` now starts with a breadcrumb, a focused hero and an at-a-glance panel (set,
  question and minute counts, workshop count where relevant, monthly price, primary start action
  and the free sample). It continues with the full-mock or Speaking invitation, numbered set cards,
  IELTS workshops, the two official entrance-paper cards, a plan card with the actual plan features,
  one next-step card, and a collapsed notes/source block instead of several competing banners.
- Student-facing additions are data-driven through `audience` and `highlights` on the existing
  program catalog. `ProgramCard` and the homepage were not changed; the new route-only
  `ProgramSpotlight` keeps the `.program-card` class needed by browser checks. Every existing test
  hook is preserved: 3 `.program-card`, 4/3 `.exercise-row`, the exact `SAT` heading, the
  `Writing & Speaking workshop` heading, the `Жишиг дасгал эхлэх` link to `/practice`, the
  Speaking invitation target and all plan/exam routes.
- New styles live in `src/app/programs/programs.css`, loaded by a route-level
  `src/app/programs/layout.tsx`, and are scoped to `.programs-page` / `.program-detail-page`. This
  avoided editing Claude Code's claimed `src/app/theme.css`. Claude Code's uncommitted Dornod banner
  removal and 05→04 category-count edit in the two program pages were preserved; the retired Dornod
  links were not re-added.
- Checks actually run:
  - `npm run lint` — pass; `npm run typecheck` — pass; `npm test` — 70/70 pass.
  - `python tests/browser_smoke.py` and `python tests/theme_smoke.py` — pass against a throwaway
    `next dev --webpack` copy on port 3007 (`TEST_BASE_URL`), including navigation, grading,
    API validation, 404, themes, `/programs/entrance` and 320/390px layouts.
  - A focused Playwright check on the same 3007 preview covered all four program routes, the 404
    slug, hook counts, link targets, light/dark desktop and 320/390px overflow. Screenshots were
    inspected for the index and all three details; card heights, the at-a-glance panel and mobile
    wrapping were corrected after inspection.
  - The first focused pass hit one known PGlite `08P01` transient and the real
    `/api/auth/get-session` 429 after rapid repeated navigation. A paced rerun passed without
    changing code, tests, rate limits or safeguards.
  - `git diff --check` scoped to the programs/docs changes passed; a trailing-whitespace scan of the
    three new files passed. The repo-wide `git diff --check` still reports one pre-existing trailing
    whitespace line in Claude Code's `src/app/exams/eec-english/page.tsx`; that file and other
    agents' work were not touched. A secret-pattern scan of the changed programs files found no
    findings.
- Not run: the production build and the `accounts`, `exercises` and `exams` browser suites, because
  Claude Code still holds `build + 3001` and the `database` (QA rows) claim while testing its own
  increments. The throwaway 3007 preview copied `src`, configuration and the ignored `.env`, linked
  `node_modules`/`public`, and copied the paper JSON; it served public pages read-only. No database
  row, account, session, email, provider request, payment or hosted resource was created or changed.
  No commit, push or deployment was performed.
- `ACTIVE_WORK.md` was updated to confirm the owner-requested split. `PROJECT.md` was not changed:
  the stable product surface, access rules, timers, scoring and setup are unchanged by this visual
  and information-architecture increment.

## 23. Dornod removal, Workshop page, AI assistant drawer and combined delivery — 2026-10-29

Agent: Claude Code (Claude Opus 5.5). Opencode's programs redesign (section 22) is included in this
delivery unchanged; its results there are Opencode's own.

- **Dornod 2026 deleted.** Owner first asked to remove the two Dornod Online Test 4 papers, then to
  delete them completely. Removed the `/exams/dornod-2026` route, catalog entries (`regional.ts`),
  keys (`regional-keys.json`), `assets/papers/dornod-2026*` (original PDFs) and the 33 images under
  `public/exam-assets/dornod-2026`, every Dornod branch in briefing/checkout/sitting/admin, the
  homepage/exams/English/University Prep links, and the three Dornod tests. Exam category counts
  read 04. `tests/dornod-removal.test.mjs` guards against their return. New guarded
  `scripts/purge-dornod.mjs` (local database only; dry run unless `--apply`) deleted every local
  Dornod row: 11 paper attempts (including `qa-demo-01`'s in-progress English sitting; the rest
  were `qa-regional-*` QA accounts) and 2 purchases. A second dry run found 0. Admin audit history
  was kept. **The hosted Neon database was not queried or changed**; any hosted Dornod attempts or
  purchases remain until the owner authorizes a hosted cleanup.
- **Workshop.** New `/workshop` page and a "Workshop" header-nav link. Three-column tile grid
  (two on tablets, one on phones); the AI Speaking partner is the only tile, illustrated by
  `public/characters/milo/milo-wave.webp`, a local three.js render of the unchanged CC0
  RobotExpressive model (recorded in `SOURCE.txt`). The phone header nav now fits five links on
  one row (scrolls inside itself at 320px). The four IELTS Writing/Speaking tasks stay on
  `/programs/ielts`.
- **AI assistant.** Owner rejected an in-layout sidebar. Each math question (exercises, free
  `/practice`, completed SAT Math review) now has an "AI туслах" button that opens a chat drawer
  sliding in from the right (portalled to `<body>`; ×, backdrop or Escape close it; focus returns;
  page scroll is locked while open). Suggestion chips, MN/EN, Enter to send, typing indicator;
  conversation survives close/reopen per question. At the owner's request the consent checkbox and
  fine-print notes were removed; one line under the composer states that the problem and answer go
  to DeepSeek. Nothing is sent on load or on opening. Server quota, origin, ownership, plan and
  active-exam checks are unchanged. Styles are in `src/modules/tutor/tutor.module.css`. A closing
  bug (Escape mid-animation left an invisible overlay) was found in the browser and fixed with a
  timer-based close.
- Checks run by Claude Code on the final production build (which also contains Opencode's
  section 22 work): `npm run lint` pass; `npm run typecheck` pass; `npm test` 68/68 pass (three
  Dornod tests removed, one removal test added); `npm run build` pass (50 generated pages).
  Browser suites, run serially on that build: `browser`, `accounts`, `exercises`, `exams`,
  `official_paper`, `admin`, `profile`, `theme`, `homepage_polish`, `english_archive` — all 10 pass
  (English: all 37 timed exams and 218 asset hashes). This also covers the production build and
  `accounts`/`exercises`/`exams` runs that Opencode's section 22 left for later. Earlier builds in this increment also passed `regional_papers_smoke.py` for
  the interim retirement; one interim `official_paper` run failed once with `KeyError: 'report'`
  (an error body from the API) and passed on every later run without code or test changes.
- Browser pane checks: `/workshop` at 1440/760/440/390/320px in both themes; the AI drawer at
  1440 and 390px (open, all three close paths, reopen, zero `/api/math-tutor` requests); Dornod
  routes and images return 404 and no main page mentions Dornod.
- **Not run:** `tests/tutor_smoke.py` (updated for the drawer) makes three live DeepSeek requests
  and was not run without owner authorization; the recovery and hosted suites were not run.
- After the final build only a blank line was removed from `src/app/exams/eec-english/page.tsx`
  (whitespace). `git diff --check` and a secret/env-value scan of all 33 changed/new files passed;
  the only env match is the non-secret local `BETTER_AUTH_URL`.
- Owner instructed clearing `ACTIVE_WORK.md` (all agents' rows removed) and pushing everything,
  including Opencode's work. Push to `codex/education-foundation` triggers the Vercel production
  deployment; the outcome is recorded below.
- Delivery result: commit `9885c6c` pushed to `origin/codex/education-foundation` (`git ls-remote`
  confirmed). Vercel served the new build on the canonical domain about 260s later. Read-only
  hosted HTTP checks by Claude Code: `/`, `/exams`, `/programs`, `/programs/entrance`, `/practice`,
  `/workshop` and the Milo image return 200; Dornod briefing, category and image URLs return 404;
  the home, exams and University Prep pages have no Dornod mention; `/practice` renders the
  "AI туслах" button. No hosted account, database row or provider was touched. This note is local.
- Hosted Dornod check (owner-requested, read-only): Claude Code queried the Singapore Neon database
  using the `DATABASE_URL` in the ignored `.env.vercel.singapore.local` snapshot (value not printed)
  inside `BEGIN READ ONLY` transactions that were rolled back. Result: 0 Dornod paper attempts,
  0 Dornod purchases, 0 Dornod content reviews/drafts/published rows. The database is populated
  (21 users, 5 purchases, 2 paper attempts, all on `eec-math-2020-a`; latest paper activity
  2026-10-25), so no hosted cleanup is needed. Nothing was written. Caveat: the connection string
  comes from a local snapshot, not read from Vercel's current production settings.

## 24. Exam briefing polish and hint cleanup — 2026-10-29

Agent: Opencode (DeepSeek V4.1 Flash).

- Owner asked to apply the planned full-mock and official-paper briefing polish and to remove
  useless hint copy across the pages. The work board was empty after Claude Code's commit `9885c6c`;
  this agent claimed `build + 3001` and the local QA database. No hosted resource was touched.
- Added `src/modules/exams/briefing-summary.ts` and guarded unit tests. The helper derives the
  briefing facts from the exam definitions instead of hardcoding them: SAT 98 delivered questions,
  4 modules and a 10-minute break; IELTS 80 unique Listening/Reading questions (the final Listening
  check is not counted twice), 2 Writing tasks and 3 Speaking stages. It also formats the real
  total durations (`2ц 24м` SAT, `2ц 44м` IELTS).
- Full mock briefing (`/exams/[slug]`): breadcrumb → focused hero → right-hand fact/start rail →
  numbered stage timeline → grouped rules → collapsed source list. The existing `ExamStart`
  component moved into the rail unchanged, so the access gate, agreement checkbox, IELTS
  headphone/microphone checks, fetch, login redirect and start flow are the same. A signed-in user
  with an open attempt now also sees a `Нээлттэй оролдлого · үргэлжлүүлэх` link. Rules are grouped
  into clock/saving, stage rules and results; the non-official-score caveat stays visible.
- Official paper briefing (`OfficialPaperBriefing`, shared by `/exams/[slug]` math/English and
  `/exams/eec-english/[slug]`): breadcrumb → hero → access/price rail → four fact tiles → score
  breakdown → saving/scoring rules → collapsed provenance. The score breakdown adapts to the
  existing `custom` layouts: Math 36 + 4 with 72 + 28 marks, while English keeps its printed
  weights. The material limits stay visible as a highlighted `official-limit` note: 2019 missing
  audio (88 max) and 2020 D ambiguous 2.3e (99 max). `sourceNote`, `scoringNote`, `timingNote`,
  publisher, source URLs and the `page-intro` heading hook are preserved.
- New styles live in `src/app/exams/briefing.css`, imported only by the two briefing routes and
  scoped to `.exam-briefing-page` / `.official-briefing-page`. No `theme.css` changes were needed.
- Hint cleanup: removed repetitive helper microcopy while keeping payment, score, auth, access,
  privacy and security notes. Examples: the duplicate home hero fine print; the free-sample
  “Бүртгэлгүй · ~2 минут” and “3 бодлого · Бүртгэлгүй · Үнэгүй” lines; the exams panel's repeated
  server-clock note; the per-plan mock-price footnote (already in each plan's feature list); the
  redundant program-gate/free-sample clause; the login/restart hint under the start button
  (shortened to the resume fact); “Нэвтрэх шаардлагатай” on the Speaking invitations (the AI/band
  caveat stays); and the internal curation/migration notes on the Math/English category pages.
  Functional password rules, verification state, payment simulation, score limits, privacy and
  access explanations were intentionally kept.
- Checks actually run on the final production build:
  - `npm run lint` — pass; `npm run typecheck` — pass; `npm test` — 70/70 pass (two new briefing tests).
  - `npm run build` — pass, Next.js 16.4.2, 50 routes.
  - Required suites: `browser_smoke.py`, `accounts_smoke.py`, `exercises_smoke.py`,
    `exams_smoke.py` — all pass.
  - Changed-area suites: `official_paper_smoke.py` (all A–D, 100-point math), `english_archive_smoke.py`
    (37 variants, 218 assets), `theme_smoke.py`, `homepage_polish_smoke.py`, `payments_smoke.py`,
    `subscriptions_smoke.py` — all pass.
  - A read-only Playwright pass covered SAT/IELTS/Math/English briefings at 1440/1024/390/320 in
    light/dark, confirmed no horizontal overflow, the 98/80/timing facts, the 99/88 limit notes,
    the retained access links and the removed hint strings. Screenshots under ignored
    `artifacts/exam-polish/` were inspected; the first full-mock layout left a large empty hero
    column, so the stage section was moved under the hero copy with a sticky right rail.
  - Two test-visible regressions were caught and fixed without weakening any assertion:
    `official_paper_smoke.py` required the briefing heading inside `.page-intro h1`, so the
    existing `page-intro` hook was restored on the new official hero; `theme_smoke.py` treats
    `nav a[href="/exams"]` as unique, so the breadcrumb changed from `<nav>` to
    `<div role="navigation">` while keeping the same accessible name.
  - One `subscriptions_smoke.py` run hit the real sign-up rate limit (HTTP 429); a serial rerun
    after the normal window passed. No rate limit, assertion or runtime guard was changed.
  - `git diff --check` scoped to the changed files passed (only LF → CRLF notices); the new files
    have no trailing whitespace. A credential/common-key scan of the changed files found no
    findings.
- Not run: `profile`, `admin`, `demo_accounts`, `auth_recovery`, `speaking_lab`, live `tutor` and
  hosted suites, because their source and copy were not changed in this increment and the live
  provider/hosted checks need separate authorization. No email, provider request, real payment or
  hosted data was involved. The local QA suites created only reserved `qa-` rows.
- The `3001` preview was rebuilt and restarted from the final production build. `PROJECT.md` was
  not changed because stable product behavior, access, timers, scoring and setup did not change.
  No commit, push, PR or deployment was performed.

## 25. Workshop Essay Studio — 2026-10-29

Agent: Claude Code (Opus 5.5).

- Owner asked for a new Workshop item: essay writing practice with an AI assistant that corrects
  grammar, complete, minimalistic and with very good UX. The work board was empty; this agent
  claimed `build + 3001` and the new writing-lab files.
- Added `/labs/ielts-writing` (`src/modules/writing-lab/**`, `src/app/labs/ielts-writing`,
  `src/app/api/labs/ielts-writing`) and a second `/workshop` tile with an inline SVG illustration.
  `writingLabEnabled()` shares the Speaking Lab pilot switch, so no new env var is needed.
- Features: Essay / Letter / Free writing tasks, 18 original prompts with shuffle and picker, live
  word target bar, paragraph count, soft practice timer, per-task autosaved drafts, AI ideas (plan and
  click-to-insert phrases), quick grammar check, full feedback (Ctrl+Enter), highlighted marks view,
  apply / skip / undo-skip / apply-all corrections, vocabulary upgrades, unofficial four-criteria
  band estimate, strengths, next steps, rewritten passage, MN/EN explanations and a band history.
- Server: login, verified email, same origin, strict input, server-resolved bank prompts, minimum
  word counts, active-exam denial, daily 40-request quota with one in flight, JSON-mode DeepSeek with
  one silent retry. Corrections that do not quote the essay exactly are dropped; overall band is
  computed on the server. Nothing is stored server-side except the quota row.
- Fixed during verification: the 300 ms debounced draft save could lose a fresh result if the page
  closed immediately; pending changes now flush on `pagehide`.
- Checks run: `npm run lint` pass, `npm run typecheck` pass, `npm test` 75/75 pass (new
  `tests/writing-lab.test.mjs`), `npm run build` pass, `git diff --check` clean, new
  `tests/writing_lab_smoke.py` PASS against the rebuilt 3001 preview (real auth/origin/validation
  guards; AI responses mocked in the browser, so no DeepSeek request was made). A live DeepSeek
  call was not run. The other browser suites were not rerun.
- The `3001` preview was rebuilt and restarted. No commit, push, PR or deployment was performed.

## 26. Essay Studio live spelling with Harper — 2026-10-29

Agent: Claude Code (Opus 5.5).

- Owner chose Harper for automatic spelling in the Essay Studio. This agent claimed `build + 3001`,
  the writing-lab files and `package.json`/`package-lock.json`.
- Added `harper.js@2.10.0` (exact pin; Automattic, Apache-2.0). 3.0.0 was two days old, so the
  older release was chosen. `npm install` reported 0 vulnerabilities.
- `src/modules/writing-lab/spelling.ts` lazily loads Harper and maps its Unicode-character spans to
  textarea offsets; `spell-editor.tsx` draws wavy underlines in a transparent mirror behind the
  textarea (red for spelling, indigo for grammar), keeps them aligned while typing and shows a
  suggestion popover at the caret (apply, ignore, add to dictionary, Escape to close). The paper bar
  has a UK / US / off control with a live issue count. Settings and dictionary words are stored in
  the same browser-only `education-writing-lab-v1` key. The essay is not sent anywhere for this check.
- Found and fixed during verification: Turbopack emits a root-relative wasm URL that Harper's
  blob-URL `WorkerLinter` cannot fetch, so setup hung; switched to `LocalLinter` on the main thread
  after a 320 ms pause. The caret after applying a suggestion was restored one frame late; it is now
  restored in a layout effect.
- Checks run: `npm run lint` pass, `npm run typecheck` pass, `npm test` 76/76 pass (new
  `shiftIssues` test), `npm run build` pass (wasm emitted as a hashed static asset),
  `tests/writing_lab_smoke.py` PASS with the new live-spelling section (real Harper, no network
  check; AI responses still mocked). Manually confirmed in the 3001 preview that Harper flags
  `beleive`, `lesons`, `an usefull`, `usefull`, `recieve` and `alot`. The other browser suites were not rerun.
- The `3001` preview was rebuilt and restarted. No commit, push, PR or deployment was performed.

## 27. Combined delivery: Essay Studio, Harper spelling and briefing polish — 2026-10-29

Agent: Claude Code (Opus 5.5).

- Owner authorized pushing the Essay Studio (sections 25-26) together with Opencode's exam briefing
  polish and hint cleanup (section 24, attributed to Opencode). The work board was empty; this agent
  claimed `git` and `build + 3001`. Opencode's diff was reviewed: copy-only hint removals plus new
  briefing layouts whose open-attempt lookups are scoped to the signed-in user.
- Combined-tree checks: `npm run lint` pass, `npm run typecheck` pass, `npm test` 76/76 pass,
  `npm run build` pass, `git diff --check` clean, secret scan of the 35 staged files clean (only env
  variable names in docs). Browser suites run serially against the rebuilt 3001 preview:
  `writing_lab`, `browser`, `exams`, `official_paper`, `homepage_polish` — all pass. The first run
  failed only because the local Prisma dev database had stopped (`P1001`); it was restarted with
  `npm run db:start` and every suite passed on the rerun.
- `.claude/` and `artifacts/` were excluded. No hosted data was read or changed.
