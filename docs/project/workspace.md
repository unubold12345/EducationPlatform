# Workspace shell, AI chat and review

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### Workspace (2026-11-08)

- The owner asked for the dashboard, Workshop and exams to become one Workspace with its own look (left tabs, AI chat,
  review of finished mocks), modelled on solvely.ai's layout: a 260px light-grey tab rail (collapsible to icons, saved in
  `education-workspace-rail`), a white canvas, one blue accent and Inter. Phones get a top bar and a slide-in menu.
- Routes: `/workspace` (home: composer, resume, stats, programmes, recent results, practice), `/workspace/dashboard` (below), `/workspace/chat`,
  `/workspace/vocabulary`, `/workspace/my-exams`, `/workspace/review` and `/workspace/review/[id]`, `/workspace/workshop`, plus the exam
  library pages above. `/dashboard`
  and `/workshop` redirect here; sign-in returns to `/workspace` by default. `/workspace/profile` and `/workspace/plans`
  (2026-11-08) replace `/profile` and `/plans`, which redirect (`/profile?error=` keeps its Google link error). The owner
  asked that the site header link only to Programmes and the Workspace: no Exams, Plans or profile button for members;
  guests still see Нэвтрэх. The rail's account row and the phone top-bar avatar open the profile; Plans is a rail tab.
  Since 2026-11-13 (owner request) the rail has no main-site link and no sign-out; signing out is on the profile page.
  Monthly plan purchase and renewal keep their `/subscribe/<program>` address but render inside the Workspace under the
  Plans tab (`src/app/subscribe/layout.tsx`, readable-scale tweaks in `subscribe.css`). Single-mock `/checkout/<slug>`
  uses the Workspace's Exams tab. Guided `/workshops/<slug>` tasks and all three `/labs/ielts-*` studios use the Workshop
  tab; their existing URLs, pilot switches and server access checks stay in place. The Workshop page no longer lists the four
  guided tasks (owner request 2026-11-19); their pages stay, reached from the programme pages.
- Workshop tabs (2026-11-19): IELTS, TOEFL, JLPT, HSK, TOPIK (`WORKSHOP_EXAMS`). The TOEFL tab has four tiles: `/labs/toefl-speaking` and
  `/labs/toefl-writing` (TOEFL tasks on the Speaking Lab and Essay Studio, [labs](./speaking-writing-labs.md)), then
  `/labs/toefl-listening` and `/labs/toefl-reading`, lists of the nine TOEFL mocks' listening or reading; JLPT/HSK/TOPIK tabs add the reading tile (AI texts plus the
  mocks' reading) and, for HSK and TOPIK, a writing tile (`/labs/writing/<exam>`). A lab card opens `/labs/mock/<skill>/<slug>`, the
  mock's practice mode narrowed to that skill, with «← <lab>» back to the list. All of these render under the Workshop tab
  (`workspace/paths.ts`). Access follows the plan family; see [pricing-access](./pricing-access.md) and
  [product-surface](./product-surface.md).
- ЭЕШ tab (2026-11-20): five subject tiles to `/labs/eesh/<subject>` (format and topic changes by year, recurring topics,
  weak topics, topic drill, 2027 forecast), under the Workshop tab; see [eesh-workshop](./eesh-workshop.md).
- The shell is `src/modules/workspace/shell.tsx` (client) behind `frame.tsx` (server: name, email, active plans). The
  shell omits guest chrome on Home, AI chat, Review and Profile while their server-side sign-in redirect resolves,
  so no sidebar is streamed before login. Guest-readable library, plans and Workshop pages keep their shell.
  The site header, footer and backdrop are hidden by CSS only while the shell is on the page (`body:has(.wsp)`), so 404s keep the
  site chrome. Embedded exam pages inherit the Workspace palette through the site tokens redefined on `.wsp`.
- AI chat: `POST /api/workspace/chat` (same origin, verified session, text plus up to three images and their previews, `CHAT_BODY_BYTES`). Modes ask, solve, explain, quiz, writing
  and vocab; subjects general, SAT, IELTS, ЭЕШ Math/Physics/English and JLPT; Mongolian or English. Six prior turns of at most
  2,500 characters are sent. 50 requests per student per Ulaanbaatar day with one in flight (`education-workspace-ai:*`).
  Refused before and after the provider call while any timed sitting is open; the local practice override does not apply.
  Threads live on the account (2026-11-13; `ChatThread`/`ChatMessage`, migration `20261112200000_chat_threads`): 30 threads per
  account (the least recently used goes), 60 messages per thread (the oldest go), 12,000 characters per message. The request names
  its thread (`threadId`, or null for a new one) and the position it has read (`after`); the browser sends no history, the server
  reads the last six turns from the stored thread. The question and answer are saved together, in one transaction, only after the
  reply arrives inside `chargeCredits`, so a failure leaves nothing and refunds; if the same question comes back after a lost
  response, the saved answer is returned with no provider call or charge. Full photos are never stored: a message keeps at most three
  small preview data URLs. Routes: `GET /api/workspace/chat/threads`, `GET`/`DELETE …/threads/[id]`, `POST …/threads/import`, all
  scoped to the student. Threads made before the move are sent once from the browser's `education-workspace-chats-v1:<userId>`;
  the server checks every field and keys the thread by SHA-256 of user and browser id, so it moves once (100 imports a day), and the
  browser key is removed. The list can be read during a timed sitting; only the AI is closed. Other tabs refresh when they regain focus.
- Review: finished mocks with scores (12 per page, programme filter), then per-question review with the snapshot's answer,
  key, explanation, printed choices, figures and transcripts, weakest skills, and an AI coach beside it (explain, my mistake,
  similar question, free questions). The server builds the coach's context from the student's own SUBMITTED snapshot via
  `ownMock`; the page sends only the attempt and question ids. Replies render as a small Markdown subset through React text.

### Student dashboard (2026-11-20)

- Owner request ("dashboard like page for students"). `/workspace/dashboard`, rail tab «Хянах самбар» under Нүүр (Home is
  unchanged), a sign-in return path; guests are redirected like Home. Page `src/app/workspace/dashboard/page.tsx`, module
  `src/modules/dashboard/` (pure `dates`, `exams`, `tasks`, `activity`, `exam-info`; server `service.ts`; client parts).
- Exam goals (`ExamGoal`, additive migration `20261120120000_student_dashboard`): up to four per student, one per exam and level,
  from the fixed list in `exams.ts` (SAT; IELTS Academic/General; TOEFL iBT; JLPT N5–N1; HSK 1–6; TOPIK Ⅰ/Ⅱ; ЭЕШ Math, Physics,
  Chemistry, Biology, English); `onSite` marks levels with mocks here. The date is optional (set once booked), today to two years
  ahead on the Ulaanbaatar calendar; JLPT offers the next first Sunday of July or December. The page opens on the nearest booked
  date, else the first goal: countdown, this site's mock count for the level, the student's finished mocks, the average of the last
  ten (own snapshots) and practice sessions.
- To-do list (`StudyTask`): the student's own one-line tasks (120 characters, 20 a day) on days from 30 back to 365 ahead. The
  carousel loads a week back to three weeks ahead and opens on today; empty cards offer two quick-add ideas for the goal's exam.
  Cards are one fixed height (owner request): a long list scrolls inside with edge shadows, and a new task scrolls into view.
  Self-study notes only; nothing grades or rewards them.
- Activity grid: 53 Monday-first weeks counted per Ulaanbaatar day from rows the site already keeps (sittings started, practice
  and Reading Lab saves, spent AI charges, word reviews in the bank and the exam decks, ticked tasks); fixed shades for 1–2, 3–5,
  6–9 and 10+. It shows totals, not a streak (the streak stays removed); `StudyDay` is not read.
- Exam information (`exam-info.ts`): per level the structure, timing, scoring, pass marks, dates, published statistics with their
  source, tips and official links, checked in November 2026 (College Board 2025 report, ielts.org 2024–25 statistics, ETS 2026
  format, jlpt.jp December 2025, HSK 3.0 levels 1–2, NIIED, ЭЕШ 2025–26 figures from БҮТ via news sites). HSK 3–6 show the 2.0
  format with a note; sources describe HSK 2's 3.0 split differently (noted on the card). Not teacher-reviewed.
- Credit history: AI credits left, purchased credits, spent this month, reset date; bars for the last 30 days; this month by tool;
  every charge newest first (12 a page, `GET /api/workspace/dashboard/credits?before=<id>`) with refunds and purchased-credit use
  marked; the last five paid credit packs.
- Routes: `POST /api/workspace/dashboard/goals`, `PATCH`/`DELETE …/goals/[id]`, `POST …/tasks`, `PATCH`/`DELETE …/tasks/[id]`: same
  origin, verified session, exact JSON shapes, rows scoped to the student. Tests: `tests/dashboard.test.mjs`.
