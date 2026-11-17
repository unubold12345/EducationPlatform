# Architecture, data and scaling

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 8). "Section N" in the text means that old numbering; the guide maps it to files.

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
| `src/modules/exams/hsk` | HSK 1–2 catalogue, loader, sitting, practice audio, results and picture/pinyin views |
| `assets/hsk`, `assets/hsk-audio` | Private HSK definitions with keys; Mandarin tracks, hashes and provenance |
| `scripts/build-hsk-mocks.mjs`, `scripts/generate-hsk-audio.py`, `scripts/generate-hsk2-audio.py` | HSK 1–2 pack converter (definitions, pictures, catalogue) and the local Mandarin audio generators |
| `reference/official-papers` | Withdrawn official papers, kept as a format guide only; never served, built or deployed |
| `reference/retired-site-mocks` | Retired site mocks (the first four Mathematics forms and the old English set); never built |
| `src/modules/workspace` | Workspace shell, home, AI chat (contract, service, account-stored threads and their browser import), review and styles |
| `src/modules/documents` | Shared bounded document extraction (PDF, DOCX, PPTX, TXT, MD, CSV), the upload reader for one document or page photos, and text helpers |
| `src/modules/ai-images` | Image input for AI features: signature/size rules and prompt parts (pure), and the browser resize, attach button and previews |
| `src/modules/vocabulary` | Vocabulary limits and request shapes, AI scan contract, server-stored word bank with decks and study progress, the Leitner schedule, quiz builder and UI |
| `src/modules/my-exams` | Upload-to-exam contract, server generation, account-stored exams (`MyExam`), sittings and grading, the import of older browser-stored exams and the runner |
| `src/modules/reading-lab` | Reading Lab: five sample passages, question contract and marking, AI generation, account storage and progress rules (`state.ts`), the one-time import of sealed browser practices and the split-screen runner |
| `src/modules/roadmap` | Unused study roadmap rules (pure `plan.ts`, `structure.ts`) and its server service; the page and the streak are removed |
| `src/modules/subscriptions` | Plans (on sale and retired), plan months, the one mock-access rule, Гадаад хэл picks, purchases, entitlements and legacy grants |
| `src/modules/exams/free`, `assets/free-mocks`, `assets/free-audio` | The free half-length mocks: client-safe catalogue, loader, hub tiles, private definitions and their recordings |
| `scripts/build-free-mocks.mjs`, `scripts/generate-free-audio.py` | Free-mock converter from `MockExmps/Free` (definitions, figures, catalogue) and local audio generator |
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
