# EducationPlatform — Operations and Handoff

Consolidated 2026-10-24 from `AGENTS.md`, `HANDOFF.md`, `readme.md`, `rules.md` and `start.md`.
This is the single source of truth for current state, delivery rules, providers and next actions.
Read [PROJECT.md](./PROJECT.md) for stable product, architecture and setup details.

## 1. Current checkpoint

- Branch: `codex/education-foundation`; remote: private
  <https://github.com/unubold12345/EducationPlatform.git>.
- This source checkpoint includes Google login/linking, verification/recovery, local Gmail SMTP,
  hosted shared demos, homepage sketches/scroll reveals and visible IELTS Speaking invitations.
- On 2026-10-24 the owner explicitly authorized committing and pushing this pending increment to
  `origin/codex/education-foundation`. Inspect Git history for the exact delivery ref. No manual
  deployment or hosted credential transfer is included in this increment.
- Last verified hosted deployment still contains the previous application increment. A Git push may
  trigger Vercel integration; it is not deployment verification. Hosted Google OAuth and hosted email
  are not configured.
- Payments remain simulated locally and hosted. No real money or payment provider is involved.
- The five hosted demo accounts exist in the Singapore database, but the deployed app does not yet
  contain the new shared-demo behavior.

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
| Hosted credentials | Last saved `.env.vercel.local` has no Google pair or configured hosted sender; no cloud credentials were changed in this increment |
| Local email transport | Gmail, because Gmail values are valid locally; recovery QA still uses the loopback outbox |
| Local Google OAuth | Enabled by the local client ID/secret; only the authorization start has been verified |
| Source delivery | Auth/Gmail, homepage, Speaking links, tests and consolidated documentation included in the owner-authorized delivery |

Last observed processes after the verified production-build restart: preview PID 16352 on 3001, recovery
QA PID 14696 on 3002, database PID 25316 on 51214. Recheck listeners and ownership before restarting.
Never stop unrelated processes or assume these PIDs are still current.

### Hosted notes

- Canonical hosted deployment was previously verified as `dpl_BvuGW3NyrsKMpAE6KUm6iRQQ6PUS` on commit
  `e59caa5`, region `sin1`. New auth source is **not** part of that deployment.
- The five `qa-demo-01` through `qa-demo-05` hosted accounts were provisioned directly in the
  Singapore database with verified Better Auth password hashes, no admin membership, no purchases and
  no subscriptions. Their email addresses are unverified and the deployed UI does not yet show the
  shared-demo controls.
- The previous US Neon database is retained read-only for rollback. Do not resume its writes while
  Singapore serves the application.
- `AUTH_HOSTED_DEMO_ACCOUNTS=true` is set in Vercel and the ignored `.env.vercel.local`. It is safe to
  leave set because the deployed source does not read it yet; the new source will use it to expose the
  five demo logins.

## 3. Verification ledger

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
- `tests/hosted_demo_smoke.py` has **never been run**. Its source is undeployed and it targets the
  hosted site. Do not claim it passes.
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

Gmail is local-only, uses `smtp.gmail.com:465` with TLS, and is disabled on Vercel/hosted. The
loopback outbox takes precedence when `AUTH_EMAIL_TEST_MODE=true`. Reserved `.invalid` addresses are
skipped for Gmail and Resend.

### Switch local email to Resend

Remove the Gmail values, set `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM`, then restart. Resend
is the supported hosted transport. A custom domain is required for a credible sender; the owner
deferred that purchase.

### Hosted Google and email

Add `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and `RESEND_API_KEY`/`AUTH_EMAIL_FROM` to Vercel only
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

1. Confirm receipt of the Gmail test message in the owner's inbox. The SMTP server accepted it, but
   inbox placement was not independently verified.
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
