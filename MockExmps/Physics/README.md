# Physics mock exams (ЭЕШ 2015–2026)

This folder contains **60 physics mock papers** for exam preparation: five parallel variants
(`P1`–`P5`) for each ЭЕШ physics year from 2015 through 2026. The papers are JSON.
`node scripts/build-entrance-mocks.mjs physics` turns them into the website's ЭЕШ physics
mocks (`assets/entrance-mocks/physics/`, figures in `public/exam-assets/eesh/physics/`), and
the ЭЕШ Workshop (`scripts/build-eesh-insights.mjs`) reads each year's `mock-01.json` skills.
This folder itself is never deployed (`.vercelignore`).

The mocks are original questions with changed numbers and contexts. They are not
copies, paraphrases, translations, or rewordings of official EEC questions. The papers
found for each year are kept in `<year>/reference/` (git-ignored) only so the item order
and point placement could be read; see each `reference/README.md` for its sources.

## What each year follows (rebuilt 2026-11-20)

Each year's papers follow `<year>/blueprint.json`: the skill (template) behind each of
the 46 Part I questions in the real paper's order, its points, and the four Part II tasks
with their part points. The item topics in the blueprints are our own short summaries.

| Year | Source read | Part I order and points | Part II tasks |
|---|---|---|---|
| 2015 | Official EEC question bank (variant A); third-party copy of the official key | that year's | not found: 2026's |
| 2016 | Third-party copy of the official variant D; official blueprint and key | that year's (variant D) | that year's |
| 2017 | Official bank (A); official blueprint | that year's | not found: 2026's |
| 2018 | Official variant A page images and key; official bank | that year's | that year's |
| 2019 | Official variant A page images and key; official blueprint; bank | that year's | that year's |
| 2020 | Official variant A page images and key; official bank | that year's | that year's |
| 2021 | Official bank (A); official blueprint | that year's (3 point values ours) | not found: 2026's |
| 2022 | Official bank (A) | that year's | not found: 2026's |
| 2023 | Official bank (A); third-party online copy of variant A (read, not saved) | that year's | that year's |
| 2024 | **Nothing found** (official links return 404, no archive, no third-party copy) | **2026's** | **2026's** |
| 2025 | Official variant A PDF (Wayback Machine) | that year's | that year's |
| 2026 | Official variant A PDF (`reference/2026-A.pdf`) | that year's | that year's |

Where a year's Part II was not found, its papers use the 2026 tasks with that year's
part points; 2024 copies the whole 2026 sequence and point placement. The site's paper
descriptions and the ЭЕШ Workshop say so, and the Workshop's 2027 forecast leaves 2024 out.

## Per-year format

Every paper has **46 multiple-choice questions (A–E)** and **4 constructed tasks**
(2.1–2.4), takes **100 minutes**, and totals **100 points**:

| Years | MCQ | MCQ points | Constructed tasks | Constructed points | Points per constructed task |
|---|---|---|---|---|---|
| 2015–2016 | 46 | 80 | 4 | 20 | 5 |
| 2017–2026 | 46 | 76 | 4 | 24 | 6 |

One-point Part I questions (all others are worth 2):

| Year | One-point questions |
|---|---|
| 2015 | 1, 7, 9, 23, 24, 25, 27, 32, 36, 39, 44, 45 |
| 2016 | 1–12 |
| 2017 | 1, 4, 5, 10, 18, 21, 23, 25, 30, 31, 32, 33, 34, 38, 41, 45 |
| 2018 | 1, 2, 6, 10, 13, 14, 16, 19, 21, 28, 32, 33, 37, 42, 44, 46 |
| 2019 | 1, 5, 7, 11, 12, 14, 19, 21, 24, 27, 29, 30, 34, 39, 42, 45 |
| 2020 | 1–10, 13, 16, 19, 31, 33, 35 |
| 2021 | 1, 2, 3, 5, 6, 7, 8, 9, 12, 17, 22, 23, 28, 29, 34, 36 |
| 2022 | 1, 6, 9, 11, 12, 13, 14, 17, 18, 24, 25, 29, 31, 37, 38, 39 |
| 2023 | 1, 4, 6, 7, 10, 15, 17, 20, 22, 27, 30, 33, 37, 41, 43, 45 |
| 2024, 2026 | 2, 5, 7, 14, 16, 18, 21, 23, 25, 27, 31, 33, 37, 39, 40, 45 |
| 2025 | 2, 5, 6, 9, 15, 16, 19, 22, 23, 25, 29, 31, 33, 39, 41, 43 |

- The bank's point labels were wrong for 2018 (item 10, and 38/42 swapped) and 2020
  (11/31 swapped); the official page images were used instead.
- 2021: the bank marks only 13 one-point items (79 points); questions 22, 28 and 36 are
  set to 1 point by us to reach 76.
- Part II: the official tasks have three to six digit-box parts. The JSON always uses four
  parts, with the official task total (5 points to 2016, 6 after) and, where the paper
  shows it, a split as close to the official one as four parts allow (each blueprint's
  `notes` say where they differ).
- The 2016 `12fizikKey.pdf` that lists 30 MCQ is the 12th-grade state exam (`УШ`), not the
  ЭЕШ, so it is not a format source.

## Directory layout

```
MockExmps/Physics/
  <year>/mock-01.json ... mock-05.json   (2015–2026)
  <year>/blueprint.json                  (item sequence, points, sources)
  <year>/reference/                      (git-ignored: the papers, keys and blueprints read)
  reference/2026-A.pdf, reference/README.md
  tools/generate.py        papers from the blueprints; the 2026 templates q01–q46, s21–s24
  tools/common.py          helpers shared by the template modules
  tools/items_mechanics.py, tools/items_fields.py   Part I templates added 2026-11-20
  tools/tasks_extra.py     Part II templates added 2026-11-20
  tools/figures.py         SVG figures
  tools/check_templates.py, tools/validate.py
  README.md
```

The five variants of a year share its skill sequence and Part II topics but change
numbers, units, contexts, graphs and answer combinations: parallel forms, not five
unrelated tests. A version (prompt and key) appears in at most three of the 60 papers
(finding H4 in `docs/MOCK_REVIEW.md`); `generate.py` stops if that fails.

## JSON schema

Top level:

```json
{
  "schemaVersion": 1,
  "subject": "physics",
  "language": "mn",
  "referenceYear": 2026,
  "mockVariant": "P1",
  "title": "Физик — 2026 оны загварын хувилбар P1",
  "official": false,
  "author": "OpenCode (DeepSeek V4.1 Flash)",
  "referenceVariant": "A",
  "referenceDirectory": "reference",
  "durationMinutes": 100,
  "difficulty": { "target": "official", "status": "parallel" },
  "answerProvenance": "...",
  "responseFormat": "...",
  "instructions": [],
  "questions": []
}
```

Multiple-choice question:

```json
{
  "number": "1",
  "referenceQuestion": "1",
  "skill": "Хэмжилтийн үнэмлэхүй алдаа",
  "type": "multiple_choice",
  "points": 2,
  "prompt": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
  "answer": "D",
  "answerValue": "...",
  "solution": "...",
  "figure": {
    "kind": "...",
    "mediaType": "image/svg+xml",
    "svg": "<svg …>…</svg>"
  }
}
```

Constructed task:

```json
{
  "number": "2.1",
  "referenceQuestion": "2.1",
  "skill": "Холбосон бие ба үрэлт",
  "type": "structured_response",
  "points": 6,
  "prompt": "...",
  "parts": [
    { "id": "1", "points": 1, "prompt": "...", "answer": "..." }
  ],
  "solution": "...",
  "figure": {
    "kind": "...",
    "mediaType": "image/svg+xml",
    "svg": "<svg …>…</svg>"
  }
}
```

Every figure carries the numeric data used to build the question plus a complete,
self-contained `svg` drawing generated from that data. The SVG can be rendered directly
by a browser or JSON viewer; it is an original schematic, not a copy of an official
figure. Questions without a diagram omit `figure`. The site build saves each SVG under
`public/exam-assets/eesh/physics/`.

## Regenerate and validate

From `MockExmps/Physics/tools/` (the modules import each other, so run them from there
and without `python -I`):

```powershell
python check_templates.py items_mechanics items_fields
python generate.py
python validate.py
```

Then rebuild only the site's physics papers from the repository root with
`node scripts/build-entrance-mocks.mjs physics` (a full rebuild rewrites hand-adjusted
Math output), and the Workshop with `node scripts/build-eesh-insights.mjs`.

The generator uses only the Python standard library. 2024 and 2026 keep the versions
they had before the blueprints, so regenerating leaves them byte-identical. The
validator checks all 60 files for 46 MCQ + 4 constructed tasks, year-specific point
totals, five unique options, valid answer letters, part-point sums, required metadata,
and a parseable, self-contained SVG in every `figure`.

## Answer provenance

All mock answers and solutions were computed by the generator or written for the mock
context. They were not copied from an official EEC answer key. The papers are intended
for practice and self-checking; a teacher or independent solver should spot-check any
answer before high-stakes use.

## Source and copyright notes

- Each `<year>/reference/README.md` lists every file kept, its source URL (EEC, the
  Wayback Machine, or a third-party copy), retrieval date, size and SHA-256, and whether
  it is complete. These files are reference-only, git-ignored and never deployed;
  help.eec.mn states its files are EEC property and must not be copied or distributed.
- The official 2026 A paper in `reference/` was downloaded from the EEC materials API
  on 2026-11-06.
- Third-party copies (Scribd for 2015 and 2016, FlipHTML5 for 2023) were used only to
  read item order, points and Part II structure.
- No official question text, passage, option, or figure is included in the mock JSON.
