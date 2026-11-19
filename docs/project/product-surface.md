# Product surface and exam library

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 2). "Section N" in the text means that old numbering; the guide maps it to files.

| Area | What exists |
| --- | --- |
| IELTS workshops | Four focused workshops with saved work and grading |
| Full mocks | Nine Digital SAT (01–09) and twelve IELTS Academic mocks (01–12), with server-authoritative timers |
| JLPT | Three N5 and three N4 mocks, 456 original items, Japanese synthetic listening, timed sections and focused practice |
| HSK 1–2 | Three original HSK 1 mocks (120 items) and three HSK 2 mocks (180 items), picture tasks, pinyin, Mandarin synthetic listening and practice (section 3) |
| ЭЕШ mocks | 194 imported practice papers: 55 Mathematics, 60 Physics, 18 Chemistry, 21 Biology and 40 English (2015–2026), opened by the ЭЕШ plan |
| Free mocks | Ten free half-length mocks, one per exam (ЭЕШ ×5, SAT, IELTS, JLPT N5/N4, HSK 1), open to every signed-in account (section 3, "Free half-length mocks") |
| Practice mode | Untimed practice on every mock, with instant checks and a DeepSeek assistant |
| Accounts | Better Auth email/password, profile, Google OAuth, verification and password recovery |
| Plans and payments | Five plans (2026-11-19): the free account, ЭЕШ, Англи хэл Basic / Pro (SAT, IELTS, TOEFL) and Ази хэл Basic / Pro (JLPT, HSK, TOPIK), every covered mock with no limit, plus per-mock simulated purchases and purchased "yellow" credits ([pricing-access](./pricing-access.md)) |
| Admin | Protected overview, members, subscriptions, payments, monitoring, content and audits |
| AI tutor | DeepSeek math hints, explanations and mistake review; students can attach photos of a problem or their working (section 7) |
| Speaking Lab | Isolated IELTS speaking studio at `/labs/ielts-speaking` |
| Essay Studio | Workshop writing practice with AI corrections at `/labs/ielts-writing` |
| Listening Lab | Five original IELTS Listening practice tests (Parts 1–4, mock-style recordings) at `/labs/ielts-listening`; the sidebar is one collapsible card per test (numbered header with checked parts and score; only the open test lists its parts; on phones a row of test chips over a sideways strip of parts). The page has no intro text. The player draws reading and checking breaks as hatched blocks on the track and a chip names what is playing (Заавар, Завсарлага with a countdown, Яриа), from `recordingPhases` in `drills.ts`. A visit opens on a part left half-answered, otherwise on the first part not yet checked (`startDrill` in `progress.ts`), not on the part clicked last |
| Reading Lab | Five original IELTS Academic passages (62 questions, seven question types) and credit-paid AI practices (8–24 questions, half-price retry) from the student's own file, page photos or pasted text at `/labs/ielts-reading` (section 7) |
| Workspace | `/workspace`: the signed-in study app, separate from the marketing site, with left tabs for Home, AI chat, Vocabulary, Exams, Review, Workshop and Plans, plus the profile (section 7) |
| Daily streak | Removed 2026-11-14 (owner request): no rail row, Home card or check-in route. The study roadmap page was removed on 2026-11-13 (section 7) |
| Vocabulary | Add words and translations, organize them in decks, scan a document with AI and choose which words to keep, and study with an adaptive quiz that stores per-word progress at `/workspace/vocabulary`; the old `/workspace/flashcards` address redirects |
| Exam from file | Upload a PDF, Word, PowerPoint or text file, or up to four page photos, and get an AI multiple-choice exam of 5–40 questions at `/workspace/my-exams` (5 saved exams free, 15 with IELTS or SAT), with a half-price retry that writes new questions from the kept text; exams, sittings and scores are saved on the account and follow the student between devices |
| Study tools | Light/dark theme and a browser-only mathematics scratchpad |

Workshops follow the plan family (2026-11-19): the IELTS and TOEFL tabs with Англи хэл Basic / Pro, the JLPT, HSK and TOPIK tabs with
Ази хэл Basic / Pro (and a retired Гадаад хэл or IELTS plan until it ends). Full mocks open with a free mock, a prior per-exam purchase
or a plan that covers the programme (section 4). Subscription- and
pick-backed sittings keep continuation and review access after the plan or month ends, but new starts remain gated.
Existing purchases and LEGACY grants are preserved.

**Mock skills in the labs (owner request 2026-11-19).** The Listening Lab lists the IELTS mocks' listening under its five tests
(«IELTS mock-ийн сонсгол»), the Reading Lab the IELTS mocks' reading («Mock-ийн уншлага»), and the Workshop's TOEFL tab has two list pages,
`/labs/toefl-listening` and `/labs/toefl-reading`, for the nine TOEFL mocks, after its speaking and writing practice pages
(`/labs/toefl-speaking`, `/labs/toefl-writing`; [labs](./speaking-writing-labs.md)). JLPT, HSK and TOPIK get the mocks' reading under the AI
reading texts (`/labs/reading/<exam>`) and, for HSK 2 and TOPIK Ⅱ, a writing page `/labs/writing/hsk|topik` (JLPT has no writing paper).
A card opens `/labs/mock/<skill>/<slug>`: practice mode narrowed to that skill's sections (`exam-practice/skills.ts`: `sectionSkill`,
`labView`, `labFor`), so access (`mayUseMock`), the open-sitting block, saves, checks, audio and the assistant are the practice routes'
own; the JLPT/HSK/TOPIK pages also need an Ази хэл plan (`studyGate`). The lists (`exam-practice/lab-mocks.ts`) read access from the hub
rule and send a locked mock to its briefing. In a lab, «Дахин эхлэх» retries only the questions shown, never the whole practice session.
TOPIK writing and HSK sentence writing get AI feedback from the practice assistant's «Бичсэнд минь санал өг» on essay tasks.

The mathematics tutor is offered when reviewing a submitted SAT Math mock. Every mock also has
practice mode at `/exams/<slug>/practice`, with its own assistant (section 7).

The `/exams` library has five categories: SAT, IELTS, ЭЕШ, JLPT and HSK, three per row on a desktop canvas (a container query on
`.library-page`, so it follows the Workspace rail: 3 columns from 900px of canvas, 2 from 640px, then 1). `/exams/sat` and `/exams/ielts` collect
their six mocks. `/exams/eesh` is the ЭЕШ hub: subject tabs (`?subject=math|physics|english`) and dense
year rows with five variants per year. The retired `/exams/eesh-math` route and the first four Mathematics
mocks (`eesh-math-01`–`04`) return 404; their files are kept unserved in `reference/retired-site-mocks/eesh-math/`.
Homepage and program links open the hub; individual mock briefings link back to their subject tab. Existing
saved attempts and purchases remain readable. The library itself uses four programme cards with a compact
index (counts, timings, included parts and direct entry); the ЭЕШ row links to the three subject tabs.
`/workspace/plans` (moved from `/plans`, which redirects) is a comparison-first pricing page inside the Workspace that guests
can read: a free-account card (2026-11-12: ₮0, the monthly free credits, 100 vocabulary words, 5 saved file exams) and three plan
cards, a feature table with a free column, the per-mock option and month terms. Both pages use scoped CSS
(`src/app/exams/library.css`, `src/app/workspace/plans/plans.css`).
Collection URLs cannot be purchased or started as exams. The library, collections, hubs, briefings, timed sittings
(`/exams/attempts/*`), results and practice (`/exams/*/practice`) all render inside the Workspace shell
(`src/app/exams/layout.tsx`); the exam clock stays below the Workspace toolbar on phones.
