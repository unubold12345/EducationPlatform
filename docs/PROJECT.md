# EducationPlatform — Project guide

A short map, read every session. **Budget: under 100 lines and 9 KB.** How each feature works is in `docs/project/<topic>.md`:
open only the file for the area you are changing. Current state, checks and rules: [OPERATIONS.md](./OPERATIONS.md).

## What this is

An independent Mongolian exam-preparation web app (Next.js App Router, Prisma, Better Auth, PostgreSQL; hosted on Vercel + Neon).
Students prepare through full timed mocks, untimed practice on the same mocks, IELTS workshops and labs, and a signed-in Workspace
with AI tools. Not affiliated with the College Board, IELTS or the Mongolian ЕШ; content is original practice material, mostly
awaiting teacher review. It is a hosted test pilot: payments are simulated, scores are raw (no SAT scaled score), except IELTS/TOEFL Writing and Speaking, which AI grades after the mock (practice bands).
LawTest/Lexlab is a separate service; this project only links to <https://lexlab.site/plan>.

## Product surface

| Area | Where | What | Detail |
| --- | --- | --- | --- |
| Full mocks | `/exams`, `/exams/{sat,ielts,toefl,jlpt,hsk,topik,eesh}` | SAT 01–09, IELTS Academic 01–12, TOEFL iBT 01–09 (2026 format), JLPT N5/N4 ×3 each, HSK 1 and 2 ×6 each, TOPIK Ⅰ and Ⅱ ×3 each, 194 ЭЕШ papers (Math 55, Physics 60, Chemistry 18, Biology 21, English 40); server-authoritative timers, immutable attempt snapshots | [assessments](./project/assessments.md) |
| Free mocks | hub tiles | Ten half-length mocks, one per exam, open to every verified account | [assessments](./project/assessments.md) |
| Practice mode | `/exams/<slug>/practice` | Any mock without a clock, instant checks, DeepSeek assistant; refused while a timed sitting is open | [exam-tools](./project/exam-tools.md) |
| Plans and payments | `/workspace/plans`, `/subscribe/*`, `/checkout/*` | Free, ЭЕШ ₮29,900, Англи хэл Basic ₮29,900 / Pro ₮59,900 (SAT, IELTS, TOEFL), Ази хэл Basic ₮29,900 / Pro ₮59,900 (JLPT, HSK, TOPIK); retired Гадаад хэл honoured until it ends; ₮10,000 per mock for 7 days, plan sales, yellow credit packs; all simulated | [pricing-access](./project/pricing-access.md) |
| Accounts | `/login`, `/workspace/profile` | Better Auth email/password, Google OAuth, verification, recovery, five demo accounts | [accounts-auth](./project/accounts-auth.md) |
| Workspace | `/workspace/*` | Signed-in shell with rail: Home, Dashboard (exam goal, to-dos, activity, credits), AI chat, Vocabulary, Exams, Review (AI coach), Workshop, Plans | [workspace](./project/workspace.md) |
| JLPT/HSK/TOPIK decks | `/workspace/workshop?exam=jlpt\|hsk\|topik`, `/labs/words/<deck>`, `/labs/kana`, `/labs/pinyin`, `/labs/hangul` | Workshop exam tabs; N5/N4, HSK 1/2 and TOPIK Ⅰ/Ⅱ word decks, N5/N4 kanji decks, a «Ханз» filter in the HSK decks, Kana, Pinyin and Hangul workshops, Ази хэл Basic/Pro only | [language-decks](./project/language-decks.md) |
| Reading and writing workshops | `/labs/reading/jlpt\|hsk\|topik`, `/labs/writing/hsk\|topik` | AI-written short texts to read (furigana, pinyin or romanization, translation, browser voice; 8–13 credits) above the mocks' reading with questions; the mocks' writing (HSK 2 书写, TOPIK Ⅱ 쓰기 51–54); Ази хэл Basic/Pro | [language-reading](./project/language-reading.md) |
| ЭЕШ Workshop | `/workspace/workshop?exam=eesh`, `/labs/eesh/<subject>`, `/labs/eesh/<subject>/drill`, `/labs/eesh/<subject>/forecast` | Per subject: format by year, topic points by year, recurring topics, the student's weak topics, a 10-question cross-year topic drill (ЭЕШ plan or bought mocks; free paper by domain), a backtested 2027 forecast (make-up, topic chances, exercise types, area points) | [eesh-workshop](./project/eesh-workshop.md) |
| Vocabulary | `/workspace/vocabulary` | Word bank, decks, AI file scan, Leitner progress, quiz | [vocabulary](./project/vocabulary.md) |
| Exam from file | `/workspace/my-exams` | AI multiple-choice exam (5–40 questions) from a document or page photos, saved on the account, half-price retry | [my-exams](./project/my-exams.md) |
| Notifications | rail row **Мэдэгдэл**, `/admin?tab=announcements` | In-app inbox: purchases, plan reminders, admin announcements; no email or push | [notifications](./project/notifications.md) |
| AI credits | rail meter, every AI button | One price list, free/plan/purchased buckets, hold-settle-refund ledger; image input rules | [ai-credits](./project/ai-credits.md) |
| Reading Lab | `/labs/ielts-reading`, `/labs/toefl-reading` | Five sample passages, the IELTS mocks' reading and credit-paid practices from the student's own material; the TOEFL tab lists the nine TOEFL mocks' reading | [reading-lab](./project/reading-lab.md) |
| Speaking Lab, Essay Studio | `/labs/ielts-speaking`, `/labs/ielts-writing`, `/labs/toefl-speaking`, `/labs/toefl-writing` | AI partner/examiner (also inside IELTS mocks), hosted speech provider; writing feedback with Harper spelling; TOEFL Listen and Repeat, Take an Interview, Build a Sentence, Email and Discussion on the ETS 0–5 scale | [speaking-writing-labs](./project/speaking-writing-labs.md) |
| Listening Lab, workshops | `/labs/ielts-listening`, `/labs/toefl-listening`, `/labs/mock/<skill>/<slug>`, `/workshops/<slug>` | Five listening practice tests and the IELTS mocks' listening; the nine TOEFL mocks' listening; one skill of a mock opened in practice mode; four guided IELTS workshops | [product-surface](./project/product-surface.md) |
| Admin | `/admin`, `/admin/users/[id]`, `/admin/content/[key]` | Members, subscriptions, payments, prices, credits, content fixes and versioned publishing, audits, system status | [admin-content](./project/admin-content.md) |
| Homepage, theme | `/`, `theme.css`, `globals.css` | Marketing page, light/dark theme, stylesheet layout, browser-only scratchpad | [ui-homepage](./project/ui-homepage.md), [HOMEPAGE_MEDIA.md](./HOMEPAGE_MEDIA.md) |

## Things that are easy to get wrong

- **One access rule** for mocks (`src/modules/subscriptions/mock-access.ts`): free mock, purchase, a covering plan, or this plan
  month's pick. Start, read, save, check, audio, practice and the review coach all use it. Never grant global paid access.
- **Content goes through versions.** Read runtime definitions through `src/modules/content/published.ts`; grading and review use
  the attempt's own snapshot, never current definitions.
- **Every DeepSeek call is wrapped by `chargeCredits`** (`src/modules/credits/service.ts`): hold, call, settle or refund. Prices
  live only in `credits/pricing.ts`. No AI answers while a timed sitting is open (`exams/active-sitting.ts`).
- **Answers, keys, explanations and listening scripts stay on the server** until a check or a submitted result.
- **Audio:** each recording set has its own folder, reader and route segment (Vercel's 250 MB function limit). Never overwrite a
  released recording set; add a revision.
- **Generated content:** `MockExmps/` (offline packs) and `reference/` are never served or deployed. Site content is built by
  `scripts/build-*-mocks.mjs` into `assets/` (private, with keys) and `public/exam-assets/` (answer-free).
- **Schema changes are additive.** Vercel runs `migrate deploy` on every push; a dropping migration deletes hosted data. Unused
  tables from removed features stay ([removed](./project/removed.md)).
- **Next.js here differs from older versions:** read `node_modules/next/dist/docs/` before framework-specific code.
- **UI changes:** the owner picks layouts from wireframes, wants one accent colour (`--blue`), no serif titles, few hint texts.

## Code map

| Path | Holds |
| --- | --- |
| `src/app` | Pages and route handlers; `src/components`, `src/lib` (auth, session, API, config, email, db) |
| `src/modules/exams` | Sitting lifecycle, timers, scoring engine; `entrance/`, `hsk/`, `toefl/`, `topik/`, `free/` sub-catalogues; `exam-practice` is practice mode |
| `src/modules/{subscriptions,credits}` | Plans, picks, access rule, purchases; credit prices, buckets and ledger |
| `src/modules/{workspace,vocabulary,my-exams,reading-lab,workshops,listening-lab,tutor}` | The feature of the same name |
| `src/modules/{documents,ai-images}` | Shared bounded file extraction and image-input rules for AI features |
| `src/modules/notifications` | Inbox service, notice texts and rules, the rail bell |
| `src/modules/{content,admin}` | Drafts and published versions; admin services, reports, exports, audit |
| `prisma`, `scripts`, `tests` | Schema and migrations; builders, provisioning, `check.mjs`; unit and Playwright suites |

Full table, scaling notes and load test: [architecture](./project/architecture.md). Setup, ports and env keys: [local-dev](./project/local-dev.md).

## Topic files

| File in `docs/project/` | Was PROJECT.md section |
| --- | --- |
| `product-surface.md`, `removed.md` | 2 (removed.md also holds withdrawn papers, Dornod, roadmap and streak) |
| `assessments.md` | 3 |
| `pricing-access.md` | 4 |
| `accounts-auth.md` | 5 |
| `admin-content.md` | 6 |
| `exam-tools.md`, `workspace.md`, `vocabulary.md`, `my-exams.md`, `ai-credits.md`, `reading-lab.md`, `speaking-writing-labs.md`, `ui-homepage.md` | 7 |
| `architecture.md` | 8 |
| `local-dev.md` | 9, 10 |
| `limits.md` | 11 |
| `troubleshooting.md` | OPERATIONS.md sections 4, 5 |

Older notes that say "PROJECT section N" mean this numbering. Other references, read only when relevant:
[MOCK_REVIEW.md](./MOCK_REVIEW.md), [IELTS_MOCK_REVIEW.md](./IELTS_MOCK_REVIEW.md), [ENTRANCE_MOCK_REVIEW.md](./ENTRANCE_MOCK_REVIEW.md).

## Known limits

Pilot only: no live billing, raw scores, AI bands are estimates, content is unreviewed, scanned PDFs are refused (no OCR), local
PGlite says nothing about hosted capacity, retention/deletion/accessibility work is open. Full list: [limits](./project/limits.md).
