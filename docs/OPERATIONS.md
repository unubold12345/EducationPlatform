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
