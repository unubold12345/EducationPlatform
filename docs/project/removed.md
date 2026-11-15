# Removed and withdrawn features (history; code left behind)

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 2, 3, 7). "Section N" in the text means that old numbering; the guide maps it to files.

### Removed: practice exercises

The owner removed practice sets, the free `/practice` sample and saved exercise attempts on 2026-11-05. Their
routes (`/exercises`, `/practice`, `/learn/attempts`, `/api/exercises`, `/api/practice`, `/api/attempts`), modules,
catalog data and `prisma/seed.ts` are deleted, and deploys no longer seed. `tests/exercises-removal.test.mjs` guards
against their return. Workshops, the Speaking Lab and the Essay Studio stay, in `src/modules/workshops`. Practice mode
(2026-11-06) is a different feature: it opens the existing mocks without a clock and adds no question bank.

The tables (`Attempt`, `AttemptItem`, `Exam`, `ExamItem`, `Question`, `QuestionVersion`, `Topic`, `Subject`, `Program`)
remain in the schema, unused, because a dropping migration would delete hosted data during the Vercel build.
`scripts/purge-exercises.mjs` previews, and with `--apply` permanently deletes, their rows and old exercise content
versions; hosted databases also need `--confirm-host=<hostname>`. Mocks, workshops, purchases, plans, accounts
and audit history are not touched. A later migration can drop the empty tables.

### Withdrawn: official ЭЕШ papers

The owner withdrew the 2020 Mathematics A–D and the 37 English papers on 2026-11-06. The 2018 and 2019 pages print a БҮТ
notice prohibiting copying and distribution, and no permission is on record. Their routes (`/exams/eec-*`, `/papers/attempts`,
`/api/paper-attempts`), the `src/modules/papers` module and the served images are gone, and
`tests/official-papers-removal.test.mjs` guards against their return. Page images, PDFs, keys, layouts, provenance and the 2020
Mathematics transcription are kept in `reference/official-papers/` only as a format guide (see its README). They are never
served, compiled or deployed (`.vercelignore`) and must never be copied into mocks. `PaperAttempt` rows and per-paper
purchases stay in the database untouched; students no longer see them, and admin lists them as withdrawn.

### Removed: 2026 Dornod regional practice exams

The owner removed both Dornod Online Test 4 papers completely on 2026-10-29: their routes, catalog
entries, layouts, keys, original PDFs and bundled images are deleted, and `tests/dornod-removal.test.mjs`
guards against their return. Local attempts, purchases and content rows were deleted with the guarded
`scripts/purge-dornod.mjs` (dry run by default, `--apply` to delete; local database only).

### Study roadmap and daily streak (both removed)

- **Roadmap removed 2026-11-13 (owner request).** The `/workspace/roadmap` page, `/api/workspace/roadmap`, the rail tab, Home's
  today panel and the page's client and CSS module are gone (copies in ignored `artifacts/removed-roadmap-page-2026-11-13.tar`).
  **Streak removed 2026-11-14 (owner request):** `streak.ts`, `streak-client.tsx`, `POST /api/workspace/streak`, the rail row,
  Home's card and their CSS are gone; the `StudyDay` table and its rows stay (no migration). Left in place and now unused: `plan.ts`, `structure.ts`, the
  planner functions in `service.ts`, the `roadmap` credit action and the `StudyPlan` and `StudyDay` tables (their migrations stay). The bullets below describe the page and the streak as they were.

- The owner asked for a roadmap page where students enter their exam date and get a plan, plus a daily login streak.
  `/workspace/roadmap` is a Workspace rail tab ("Төлөвлөгөө") and a sign-in return path; Home shows today's tasks beside the streak.
- Settings (`StudyPlan`, one per student, migration `20261112200200_study_plan_and_days`): a goal from a fixed list (IELTS, SAT, the
  five ЭЕШ subjects, JLPT N5/N4, HSK 1), the exam date (tomorrow to a year ahead, Ulaanbaatar calendar), an optional target as a
  percentage of mock points (the site reports raw scores, so no bands or scaled scores), study days a week (1–7) and minutes a day
  (15–240). `readSettings` takes the exact shape only. Saving re-anchors the plan on today; ticks are kept only for the same goal.
- Plan (`src/modules/roadmap/plan.ts`, pure and unit tested; the server builds it on every read, nothing is stored but the
  settings and ticked ids): weeks from the save day to the eve of the exam, in phases (find your level, build, mock practice,
  final week). Timed mocks: about 0.8 a week when studying 5+ days, 0.6 for 3–4, 0.4 below, never more than the goal has; the
  first is a diagnostic in week 1, the last in the final week, the rest lean late. Untaken mocks are used first; mocks left over
  go to untimed practice mode, so a timed mock is not spoiled first. Each mock has a review task linking to that sitting. The rest
  of the week (about one task per study day) is practice mode, vocabulary review for language goals, the IELTS labs that are
  switched on, AI chat and a my-exams task now and then; the final week adds an exam-day checklist and a rest day on the eve
  (since 2026-11-13 the eve holds nothing but rest: that week's study days are spread over the days before it).
- AI structure (2026-11-13, owner asked for DeepSeek to generate the roadmap's structure): `POST /api/workspace/roadmap` with
  `{ settings?, note? }` has DeepSeek write a headline, a diagnosis, 1–5 phases (title, focus, weeks, 2–5 repeatable routines
  each: tool, title, method with a finish line, minutes, skill), one theme per week and up to four exam-day tactics, and saves it
  in `StudyPlan.structure` (nullable JSON, migration `20261113090000_study_plan_structure`) in the same write as the settings,
  re-anchored on today. Without `settings` it rebuilds the saved plan. `src/modules/roadmap/structure.ts` (pure) holds the prompt
  and the only reader: every field is bounded and cleaned (no links, control characters or Markdown marks), phase lengths are
  fitted to the plan's real week count, a missing theme falls back to its phase, an unknown tool becomes self-study, and a stored
  structure is re-read with the same checks on every request. The model never schedules anything real: timed mocks, reviews,
  dates, the checklist, the rest day and every link come from `plan.ts`; a routine's tool (`practice`, `vocabulary`, `chat`,
  `myexam`, the four IELTS labs, `self`) is mapped to a site page there, limited to what the goal and the pilot switches allow.
  Each study day left after the mock gets one routine (ids `w<week>:ai<slot>`), repeating in turn. A structure written for
  another start day or length is ignored; saving plain settings (`PUT`) drops it.
- What the model receives: the exam, days and weeks left, study load, target, which weeks hold a mock, the student's own mock
  percentages and per-skill results (`skillProfile`: latest five submitted sittings of the goal's mocks, grouped by question
  domain, read from their snapshots), progress on the plan being replaced, and the optional note (300 characters) quoted as data.
  No name, email or id. Same guards as other Workspace AI: same origin, verified session, exact body, no open timed sitting
  before and after the call, 10 generations per Ulaanbaatar day with one in flight, one silent retry of a malformed reply,
  credits held first and refunded on every failure, nothing saved unless a usable structure arrives. Ticks named by a mock
  survive a new structure; ticks named by a week's position do not. An AI structure is a suggestion, not teacher-reviewed.
- Page (2026-11-13 redesign): a countdown hero with the plan ring and pace (nothing late / 1–2 late / 3+ late / ahead), a
  "journey" road with one point per week in its phase's colour, mock pins and the exam flag, phase cards, today's tasks beside
  the streak, one week at a time (theme, day strip, tasks with skill and tool tags), the AI strategy card (or the offer to write
  one, with the exact credit price), a score path (mock percentages, target line, the pace needed per week) and a skill map.
  Scores and skills are computed on the server; the page is a size container (`wsp-page` gutters, container queries).
- A mock task ticks itself when the student submits that mock after the plan started (read from their own snapshots through
  `finishedAttempts`); other tasks are ticked by the student. `PATCH /api/workspace/roadmap` accepts only a task id the plan
  currently contains. `PUT` saves settings, `DELETE` removes the plan; all three check same origin and a verified session.
  Mocks still need a plan or purchase; the roadmap only links to them and says so.
- Streak: `StudyDay` holds one row per Ulaanbaatar day on which a signed-in student opened a Workspace page. The shell posts
  `POST /api/workspace/streak` (same origin, verified session, no body; the day comes from the server clock) once a day when
  the server says today is not checked in yet; a repeat the same day changes nothing. The rail shows the current streak (orange
  once today counts) and Home/roadmap show the last seven days, the longest run and the total. The current streak counts back
  from yesterday until today's check-in arrives. Opening the Workspace counts; no AI, credits or rewards are attached.
- Dates on these pages are written out in Mongolian (`mnDate`, `mnWeekday`), because browsers lack Mongolian date data and
  `Intl` "mn-MN" falls back to English.
