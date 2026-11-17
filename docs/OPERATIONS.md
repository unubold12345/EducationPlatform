# EducationPlatform — Operations

Current state, delivery rules and next actions. **Budget: this file stays under 130 lines and 12 KB**; it is read at the start of
every session. Product facts: [PROJECT.md](./PROJECT.md) and `docs/project/`. Past work: [OPERATIONS_HISTORY.md](./OPERATIONS_HISTORY.md)
(search it, do not read it whole); log to 2026-11-05: `git show 2928af3:docs/OPERATIONS.md`.

## 1. Current state

- Branch and only remote: `codex/education-foundation` on `unubold12345/EducationPlatform` (public; see Open items). Never reuse LawTest's remote.
- Hosted: <https://education-platform-seven-neon.vercel.app>, Vercel project `prj_MTzsdRQuLeMAjpUnvhScHcYnF37n`, region `sin1`.
  A push to the branch deploys to production. Latest pushed code: `5df2b69` (2026-11-16); previous deploy `5b392cb`.
- Hosted database: Singapore Neon through its pooled address (migrations too). The old US Neon database is read-only for
  rollback; do not resume writes to it.
- Hosted flags `true`: `AUTH_HOSTED_PILOT`, `AUTH_HOSTED_DEMO_ACCOUNTS`, `SPEAKING_LAB_ENABLED`, `AUTH_HOSTED_GMAIL`,
  `AUTH_REQUIRE_EMAIL_VERIFICATION`. Payments are simulated. Google, Gmail and `DEEPINFRA_API_KEY` are set in Vercel.
  `.env.vercel.local` is a stale snapshot.
- Local: PGlite on 51214/51215 (`npm run db:start`); verified build on 3001 (`npm start`); other agents preview on their own
  port (`next dev -p 3005`); `prod3006` in `.claude/launch.json` launches 3006; the check runner uses 3007.
- Local dev switch: `DEV_PRACTICE_DURING_MOCK=true` in `.env.local` opens practice mode during a timed mock (localhost pilot
  only; refused when hosted; `scripts/check.mjs` forces it off).
- Deliberately removed, do not restore: practice exercises, Dornod papers, official ЭЕШ papers, the roadmap page, the daily
  streak ([project/removed.md](./project/removed.md)). The 40-paper 2026 EEC import exists only on the previous PC.

## 2. Open items

Owner actions:
1. Make the repository private. `reference/` holds the withdrawn БҮТ papers; 2018 A and 2019 A print a no-copying notice.
2. Confirm plan figures: ЭЕШ ₮40,000, Гадаад хэл ₮60,000 (3,000 AI credits), and that the ЭЕШ plan keeps a 100-word bank and 5 saved exams.
3. Audio: listen to the free mocks (HSK free item 1 was misheard by Whisper) and to JLPT audio revision 2 (VoxCPM2 narrator, 2026-11-16).
4. Complete one real Google sign-in with an owner-controlled account (only the authorization start is verified).
5. Buy a sender domain if wanted, then switch to Resend ([troubleshooting](./project/troubleshooting.md)).
6. Listen to one Speaking Lab partner on the hosted site from a phone. The DeepInfra key was pasted into a chat; consider replacing it.
7. Old exercise rows stay in Neon by owner choice (2026-11-05); keep the tables, no dropping migration unless asked
   (`scripts/purge-exercises.mjs` is available).

For agents:
- Not verified on the hosted site: signed-in dashboard, admin, plans, picks, retries, free sittings, or a real sitting.
  `hosted_demo_smoke` last passed 2026-11-13 after `d67a969`; rerun only with owner approval.
- Never run live: `tutor_smoke.py`; the practice assistant beyond one SAT reply; exam-from-file with a structure request.
  Real provider calls need owner approval.
- Unused code kept on purpose (ask before deleting): roadmap planner, `roadmap` credit action, `StudyPlan`/`StudyDay` tables.
- Found, not fixed: the Reading Lab library scrolls sideways at 320 px with a saved practice. The mobile hub route (`api/mobile/exams/programs/[program]`) labels HSK 2 mocks "HSK 1" and counts progress by `hsk1-` ids.
- Not runnable here: `auth_recovery_smoke.py` (`artifacts/start-auth-recovery.mjs` is not on this machine).
  `vocabulary_smoke` cannot pass on `next dev` (StrictMode closes `modal.tsx`).
- Cleanup: unused exercise CSS in `theme.css`, `globals.css`, `programs.css`.
- Teacher review is pending for all imported ЭЕШ papers and every other mock; 2022–2026 Mathematics and English references are
  third-party copies. Later: production billing, data retention, account deletion, accessibility audit.

## 3. Delivery rules

**Git.** Never commit, amend, push, tag, open a PR or deploy without explicit owner authorization; a request to implement is not
one. Before committing, inspect status, diff, recent log, branch and remote. Stage only intended files; exclude secrets, `.env*`,
logs, `artifacts/`, caches and generated output. Report local changes, commits, pushes and deployments separately.

**Agents.** Several agents share this repo. Claim work in [ACTIVE_WORK.md](./ACTIVE_WORK.md), recheck it before builds, preview
restarts, database changes, commits or pushes, and remove the row when done. Never edit, revert or re-attribute another agent's work.

**Checks.** Run only what the change needs; the runner stops at the first failure and starts its own server on 3007:

| When | Command | Time |
| --- | --- | --- |
| Docs only | `git diff --check` and a secret scan | seconds |
| Any code change | `npm run check` (lint, typecheck, unit) | 10 s |
| Shared presentation only (footer, header chrome, type, spacing, colour, copy) | `npm run check -- ui`, then open one marketing page, one exam page and `/login` at 1440/390/320 | 30–40 s |
| A browser area changed | `npm run check -- <group>` | 15 s to 2 min |
| Before an authorized push | `npm run check:push` (build + core); add affected groups | 1.5 min |
| Behaviour across routes (server/API, data or migrations, auth/session, route or layout structure, exam lifecycle/timers/grading, payments/entitlements, publishing, shared component logic) | `npm run check:all` | 5.5 min |

Groups: `core` (routing, sessions, layout, exam engine) · `vocabulary` · `myexams` (exam from file) · `entrance` (ЭЕШ mocks, hub,
withdrawn-paper 404s) · `mocks` (added SAT/IELTS forms, Гадаад хэл picks) · `free` (free mocks, their audio) · `jlpt` · `hsk`
(also the `/exams` grid) · `practice` (practice mode, assistant, sitting tools) · `admin` (admin, publishing) · `billing` (plans,
prices, checkout, access, picks) · `account` (profile, password, demo accounts) · `ui` (theme, global CSS, chrome, homepage, copy) ·
`writing` (Essay Studio) · `notifications` (inbox, announcements). Reading Lab and the mock AI examiner have no browser suite. When unsure, run the affected group, not every group.

Manual only, with owner approval: `tutor_smoke`, `speaking_lab_smoke` (real providers), `hosted_demo_smoke` (after a deployment),
`auth_recovery_smoke` (3002). No pauses between suites (sign-up allows 60 per minute). Inspect screenshots when UI changes. Never
weaken an assertion to pass; change one only when intended behaviour changed. Report only checks actually run.

**Invariants.** Keep owner, plan, exam, active-exam, quota, same-origin, ownership, bounded-body and verified-email checks on
the server. Never trust client scores, prices, user IDs, content versions or prompts. Never add timer, payment, grading or AI
bypasses, or global paid access. Keep purchases, LEGACY grants, immutable attempt snapshots and exact-version grading. Provider
keys stay server-side; never send secrets, identity or scratch work to a model. The five demo addresses never become admins or
change shared data. Do not read LawTest/Lexlab code or data. Never fabricate scores, delivery, deployments or test results.

**Docs.** Keep the startup set small: `AGENTS.md`, this file, `PROJECT.md` and `ACTIVE_WORK.md` are read every session, so nothing
detailed goes in them. Put how a feature works in its `docs/project/<topic>.md` file (update the text in place; do not append dated
change notes). Add a `Recent` entry here of at most 600 characters: agent and model, outcome, checks run, what is unverified. No
play-by-play. `Recent` holds five entries; move the oldest, unchanged, to the top of `OPERATIONS_HISTORY.md`.

## 4. Known problems

One line each; causes and fixes in [project/troubleshooting.md](./project/troubleshooting.md).
- **Local database drops** (`P1017`, `P1001`, `ECONNREFUSED`, `{"database":"down"}`): `npm run db:stop`, wait, `npm run db:start`; never reset. `P2028`/`08P01`: rerun once.
- **Database port drift**: `.env` and fixtures expect 51214; if Prisma moved it, fix `server.json` with owner approval.
- **Only one app on the local database** (PGlite has one connection): stop other previews before running suites.
- **Build replaces `.next`**: restart any running preview after a build. If `next dev` reload-loops, delete `.next/dev`.
- **Local change log** (`prisma-dev-nodejs/Data/durable-streams`) grows about 60 MB per `check:all`; move it aside above 1 GB.
- **Vercel build** runs generate, `migrate deploy`, `next build`, no seed; a failure with no app error can be transient (redeploy).
- **Hosted email**: a configured sender enforces verification for every non-demo account. Do not bulk-mark rows verified.

## 5. Provider notes

Gmail, Resend and hosted Google setup: [project/troubleshooting.md](./project/troubleshooting.md). Never print, commit or paste
secret values. Hosted and real-provider checks need explicit owner authorization.

## 6. Commands

```powershell
npm ci; npm run setup:env; npm run db:start; npm run db:migrate; npm run db:generate; npm run dev
npm run demo:accounts
npm run admin:grant -- qa-demo-01@example.invalid
```

## 7. Recent

Full entries, with attribution and verification limits, are at the top of [OPERATIONS_HISTORY.md](./OPERATIONS_HISTORY.md).
- **2026-11-17 · Claude Code (Opus 5.5) · Exam from file: question formats** ([my-exams](./project/my-exams.md)): seven formats as chips (choice,
  true/false, fill-in, matching, I–III, case, order), each still one option, so grading and the mobile app are unchanged; the server plans the mix,
  groups it and spreads the key over A–D. `check -- myexams` passed (308 unit, build, mixed-exam suite); screenshots reviewed. No live DeepSeek run, no commit.
- **2026-11-16 · Claude Code (Opus 5.5) · JLPT audio revision 2** ([assessments](./project/assessments.md)): N5/N4 narrator re-voiced with VoxCPM2
  via the VoiceStudio app (warm male, owner-picked); dialogue keeps the Kokoro takes. `assets/jlpt-audio`, `/audio/jlpt`, `audioRevision: 2`; old
  sittings keep revision 1. Whisper flagged one narrator line (N5-02 L24). `check` passed; no browser suite, build or human listen.
- **2026-11-16 · Claude Code (Fable 5.2) · HSK 2, three mocks** ([assessments](./project/assessments.md)): `hsk2-mock-01`–`03`, 60 items each, 82 new pictures, 22 min of Kokoro audio per mock, two-level hub. `check -- hsk` passed (304 unit, build, HSK 1 and 2 browser flow);
  screenshots of the HSK 2 sitting, practice and results reviewed; 3001 restarted on the new build (owner approved). Audio unchecked by Whisper or ear; drafts await a teacher. No commit.
- **2026-11-16 · Claude Code (Fable 5.2) · Homepage loops rebuilt** ([HOMEPAGE_MEDIA](./HOMEPAGE_MEDIA.md)): the three loops are now 12 to 14 s
  films from real screenshots with camera moves, a pointer and numbered captions (`scripts/home-loops/`, HyperFrames). `check -- ui` passed;
  frames reviewed; files are 0.9 to 1.7 MB (were 0.3 to 0.5). Old set: `artifacts/home-recordings/prev-2026-11-16/`. No commit.
- **2026-11-16 · Claude Code (Fable 5.2) · Typed hero headline** ([ui-homepage](./project/ui-homepage.md)): the homepage headline types
  itself slowly and keeps a blinking caret (`hero-typing.tsx`). `check -- ui` passed; 3001 rebuilt (`next start`) and seen at 1280 and 390. No commit.
