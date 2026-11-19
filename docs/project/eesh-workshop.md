# ЭЕШ Workshop: year-by-year changes, recurring topics, topic drill, 2027 forecast

Part of the [project guide](../PROJECT.md).

### What it is (2026-11-20, owner request)

- The owner asked for an ЭЕШ Workshop: how each subject's content differs between years, what changed, which exercises
  come up most across the years' mocks, plus whatever else suits ЭЕШ students. Workshop has a sixth tab, **ЭЕШ**
  (`WORKSHOP_EXAMS`), with one tile per subject. Each tile's art is that subject's topic points by year, drawn from the data
  (`tile-chart.tsx`). The tiles open `/labs/eesh/<subject>`, which renders in the Workspace under the Workshop tab
  (`workspace/paths.ts`).
- Each subject page shows:
  - Four facts: the latest format, the biggest rise and fall in topic points (first three years against the last three)
    and the number of topics that appear every year.
  - **Бүтэц жилээр**: years with the same format share one row, and years with no paper are listed in that row.
    Changes are shown as chips, for example physics 2017 «I хэсгийн оноо 80 → 76», biology 2026 «Сонгох асуулт 50 → 46» and
    English 2020 «Хасагдсан: Сонсож ойлгох».
  - **Сэдвийн оноо жилээр**: a heat table of points per paper by domain and year.
  - **Хамгийн их давтагддаг даалгавар**: topics ranked by the years they appeared and their points in the last three years.
    One dot stands for each year, and a «Дасгал» link opens the drill page on that topic.
  - **Таны сул сэдэв**: signed-in only.
  - **Сэдвээр дасгал**: a card that opens the drill page.
  - The charts are public, since they hold no question text.
- The extra features, chosen because they suit ЭЕШ students:
  - **Topic drill**: ten questions of one topic from different years' mocks, on its own page (owner follow-up
    2026-11-20): `/labs/eesh/<subject>/drill?topic=<id>` or `?domain=<name>`.
    - The heading and the topic's facts follow the address. Picking another topic opens its address, and an older
      `?topic=` link on the subject page is sent on to the drill page.
    - Sign-in returns to the drill page (five exact paths in `src/lib/return-path.ts`; the query is dropped).
    - A topic a free account cannot drill shows a plan notice and the areas it can drill.
    - Exam figures are styled by `entrance.css` on exam pages only, so the drill frames them itself and scales them to
      the column (`eesh.module.css`; 640–900 px figures had overflowed a phone).
  - **Weak topics**: the student's accuracy per topic, taken from every ЭЕШ practice answer they have checked.

### Data (`scripts/build-eesh-insights.mjs`)

- **Inputs**:
  - The served papers (`assets/entrance-mocks`) give formats, domain points and drill counts.
  - The offline packs give the skill each item tests: `MockExmps/<Subject>/<year>/blueprint.json` per year for the rankings,
    and `mock-0N.json` per form for the question → topic index.
  - The grouping in `scripts/eesh-insights/topics.json` maps 427 maths, 177 chemistry, 119 biology and 102 physics skills
    to 30 / 26 / 23 / 15 topics (physics gained astronomy, «Одон орон, орчлон ертөнц», with the per-year papers).
  - The maths, chemistry and biology grouping was drafted by a Sonnet subagent and checked by script for full coverage.
    Some calls could go either way: optimisation of solids sits under derivatives, Newton cooling under exponentials, and
    the derivative-definition limit under limits.
- **English** has no skill tags. Its 15 task types (error identification, phrasal verbs, idioms, word forms, conversation…)
  come from each task's directions by ordered rules (`RULES` in the build). Every task's assignment was reviewed once.
- **Outputs**:
  - `src/modules/eesh-workshop/insights.json`: client-safe; formats, changes, domains and topics, with no question text or
    answers.
  - `topic-index.json`: question number → topic per year, or per paper when a year's forms differ.
  - The build fails on any skill without a topic. `--check` fails when the outputs are stale, and the unit test runs it.
    Rebuild after an ЭЕШ paper or pack changes.
- **Caveats shown on the pages**:
  - The figures come from this site's mocks, not official statistics.
  - Physics mocks follow each year's own paper since 2026-11-20 (`MockExmps/Physics/<year>/blueprint.json`), so physics is
    compared by year like the others. Its note says 2016 follows variant D, 2024 (no paper found) copies 2026, and the
    2015, 2017, 2021 and 2022 Part II tasks copy 2026's. `COPIED` in the build lists 2024: it stays in the charts and the
    drill but not in the forecast.
  - Biology topics cover Part I only.
  - The gap years are 2020 (maths), 2024 (chemistry) and 2021 (English).

### Drill and access

- `GET /api/labs/eesh-drill?subject=&topic=|domain=` (signed in) returns up to 10 key-free questions. The rules:
  - Questions are unchecked, one year at a time in a random order, and never the same item number twice in one year,
    because a year's forms are parallel versions of one item (`pickDrill`).
  - A question must stand alone: a choice item without a passage, shared context, word bank, task drawing or audio.
  - English also drops Reading, Part II and Listening (`drillEligible`). The build counts the same rule, and a unit test
    compares both.
- **Access**:
  - `hubAccess` narrows the papers: an ЭЕШ plan opens all of them, and a bought mock opens itself.
  - Every paper a drawn question comes from is checked again by `requirePractice` (access plus the open-sitting block).
    An open timed sitting returns 403 with its link.
  - Answers go through the existing `/api/exam-practice/<slug>/check`, so they are graded on the server and saved in that
    mock's practice record. The drill never offers them again, and they feed the weak topics.
  - A free account gets a domain drill from the subject's free paper. Topic drills answer 402 and link to the plans.
- Weak topics need at least 3 checked answers in a topic; when no topic has 3 yet, the domains are shown instead. Timed
  sittings are not counted, only practice checks.
- **Tests**:
  - `tests/eesh-workshop.test.mjs`: build current, no question text, format facts, sums to 100, index coverage, drill rule
    and counts, spread, no repeats, filters, progress.
  - `tests/eesh_workshop_smoke.py` (check group `entrance`): tab and tiles, pages, free versus plan drill, guards, sitting
    block, the drill page (addresses, old links, sign-in return, free-account notice), 390 px with figures loaded.

### 2027 forecast (`/labs/eesh/<subject>/forecast`, owner request 2026-11-20)

- The owner asked for a predicted 2027 mock "with what exercises can be in", accurate or not. Each subject page has a
  «2027 оны таамаг» card under the facts. The forecast page is public like the charts: topic names, chances, points and
  exercise-type labels only.
- **Page**:
  - Facts: the predicted format (the latest paper's, with how many years it has held), the backtest score, the number of
    topics at 60%+ and the area with the most points.
  - **Таамагласан бүтэц**: whole questions per topic in each part, adding up to the part, next to the latest year's count.
  - **Гарч болох сэдэв ба даалгавар**: topics in tiers by chance (85%+, 60–85%, 30–60%, under 30% folded), with expected
    questions and points, the latest year's count, a trend tag, the likely exercise types and «Дасгал».
  - **Даалгавар бүрээр**: Part II task by task, then Part I question by question: the likely topic and chance, the
    alternatives, the exercise types and the latest year's topic.
  - **Чиглэлийн оноо**: predicted points per area, the latest year as a tick, and the backtest's mean error as a band.
  - **Хэр найдвартай вэ?**: the backtest table and the caveats.
- **Method** (`scripts/eesh-insights/forecast.mjs`, run by the insights build into `src/modules/eesh-workshop/forecast.json`):
  - Each year becomes positions: Part I questions and Part II tasks. Every known year votes for the topic, area and skill
    at each position of the latest paper, recent years weighted more.
  - Years with a different question count are lined up by sequence alignment on their topics. Each position is shrunk
    toward its neighbours' topics, because a topic often moves by one or two numbers.
  - Topic chances are the weighted share of years a topic appeared in, pulled toward 50%. Area points are a weighted trend
    scaled to the paper's total. The make-up adds the positions' chances and rounds them to whole questions (largest
    remainder).
  - The settings are a grid search on the last three known years of maths, chemistry, biology and English, each predicted
    only from the years before it, one component at a time. Physics uses the same settings but does not tune them: its
    copied 2024 and Part II would tune the others to copies. Chosen: half-life 2 years, alignment always, shrinkage 1,
    chances by years (half-life 2, pull 0.5), area trend, make-up from positions. They are printed by the build.
  - Physics leaves out 2024 (`skipped`, shown on the page), so its history is 11 years and its backtest years are 2023,
    2025 and 2026.
  - Biology's Part II has no topics, so its tasks show unshrunk area votes and its make-up is counted by area.
- **Backtest** (stored and shown on the page): share of each real paper's questions whose topic the make-up covered, and
  the share of topics that appeared which got a 50%+ chance.
  - Maths: 71% make-up; 24/25, 23/26, 20/22 topics.
  - Chemistry: 75%; 21/21, 19/21, 22/24.
  - Biology: 84%; 22/22, 20/20, 20/22.
  - English: 77%; 10/12, 8/8, 9/10.
  - Physics: 85%; 12/12, 12/14, 14/14.
  - Area points are off by ±1.8–5.8 on average.
  - The top pick at each position is weaker: maths 25%, chemistry 34%, physics 66%, English 67%, biology 69%. Topics move between
    numbers, so the page says the position list is less reliable than the make-up.
- **Exercise types**: the skill tags translated to Mongolian in `scripts/eesh-insights/skills-mn.json` (427 maths, 169
  chemistry and 119 biology labels).
  - Drafted by Sonnet subagents. The build fails on a skill with no label. Not teacher-reviewed, and the page says so
    without naming any tool.
  - Physics tags and Part II task titles were already Mongolian. English has no skill tags, so it shows task types only.
- **Tests**:
  - Unit: the forecast follows the latest format, positions and points add up, it names only known topics and areas, its
    labels are Cyrillic, every subject has chances and three backtest years (physics without its skipped 2024), and no
    question text; the page imports no
    account data and names no provider.
  - Smoke: the link from the subject page, the sections, a make-up summing to 40, the physics (skipped-year note, backtest rows) and biology variants, 404, and
    390 px.
