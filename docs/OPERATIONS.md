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
