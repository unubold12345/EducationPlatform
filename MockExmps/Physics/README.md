# Physics mock exams (ЭЕШ 2015–2026)

This folder contains **60 standalone physics mock papers** for exam preparation: five
parallel variants for each official ЭЕШ physics year from 2015 through 2026. The papers
are JSON only. They are **not** imported by the EducationPlatform website and are not
part of the deployed application.

The mocks are original questions with changed numbers and contexts. They are not
copies, paraphrases, translations, or rewordings of official EEC questions. One official
paper is kept in `reference/` only so the format and difficulty can be reviewed; see
`reference/README.md` for its source and usage restrictions.

## Per-year format

Every paper has **46 multiple-choice questions (A–E)** and **4 constructed tasks**
(2.1–2.4), takes **100 minutes**, and totals **100 points**. The point split follows the
year, not a single common template:

| Years | MCQ | MCQ points | Constructed tasks | Constructed points | Points per constructed task |
|---|---|---|---|---|---|
| 2015–2016 | 46 | 80 | 4 | 20 | 5 |
| 2017–2026 | 46 | 76 | 4 | 24 | 6 |

For 2017–2026 each constructed task has four subparts worth `[1, 1, 2, 2]` points.
For 2015–2016 each constructed task is worth 5 points; the JSON represents it with four
subparts so the answer model stays uniform. The official 2015 Part II answer key uses
6–7 digit-coded subanswers per task, but the task total is still 5 points; the JSON keeps
four subparts to preserve one schema across all years. The overall year-level split
(80 + 20 versus 76 + 24) is deliberately different and is never mixed between years.

The 2015 official key gives a 12-question one-point set:
`1, 7, 9, 23, 24, 25, 27, 32, 36, 39, 44, 45`; every other MCQ is worth 2 points, for
80. The 2016 official ЭЕШ D paper text also shows 46 MCQ and 80 MCQ points plus four
constructed tasks totalling 20. The 2016 `12fizikKey.pdf` that lists 30 MCQ is the
12th-grade state exam (`УШ`), not the ЭЕШ, so it is not used as the 2016 format source.
The 2016 D paper also gives the item-level placement: questions 1–12 are worth 1 point
and questions 13–46 are worth 2 points, for 80. The generator uses that exact placement
plus four 5-point constructed tasks to reach 20.

The 2018 paper is placed in the 76 + 24 group. The direct 2018 official PDF was not
available from EEC during this build; the 76 + 24 split is inferred from the surrounding
2017 and 2019 official papers and from 2018 exam descriptions. All other year splits are
confirmed from official papers, official answer keys, or official exam text.

For 2017–2025 the exact one-point item placement was not available. The generator uses
the official 2026 A placement (questions 2, 5, 7, 14, 16, 18, 21, 23, 25, 27, 31, 33,
37, 39, 40 and 45 are 1 point; the rest are 2), while the year-level 76 + 24 split is
confirmed.

## Directory layout

```
MockExmps/Physics/
  2015/mock-01.json ... mock-05.json
  2016/mock-01.json ... mock-05.json
  ...
  2026/mock-01.json ... mock-05.json
  reference/2026-A.pdf
  reference/README.md
  tools/generate.py
  tools/validate.py
  README.md
```

`mockVariant` is `P1` through `P5`. Each variant keeps the same 46-skill sequence and the
same four constructed-task topics, but changes numbers, units, contexts, graphs, and
answer combinations. The five variants are parallel forms, not five unrelated tests.
The skill sequence follows the official 2026 A paper, the only full official paper
available in this build; the year-specific MCQ/constructed point split is applied on top.
Because the 2015–2025 official papers were unavailable, their exact topic order was not
reproduced.

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
figure. Questions without a diagram omit `figure`. The SVG is not rendered by the
website, and the mocks are not imported by the application.

## Regenerate and validate

From the repository root:

```powershell
python MockExmps/Physics/tools/generate.py
python MockExmps/Physics/tools/validate.py
```

The generator uses only the Python standard library. The validator checks all 60 files
for 46 MCQ + 4 constructed tasks, year-specific point totals, five unique options,
valid answer letters, part-point sums, required metadata, and a parseable, self-contained
SVG in every `figure`.

## Answer provenance

All mock answers and solutions were computed by the generator or written for the mock
context. They were not copied from an official EEC answer key. The papers are intended
for practice and self-checking; a teacher or independent solver should spot-check any
answer before high-stakes use.

## Source and copyright notes

- The official 2026 A paper in `reference/` was downloaded from the EEC materials API
  on 2026-11-06. It is reference-only and must not be redistributed.
- Official 2015–2025 PDFs were not reliably downloadable from EEC during this build:
  the old direct file links return 404 and `eyeshitems.eec.mn` requires a login. The
  per-year formats above were verified from official EEC paper text, official answer
  keys, and official exam descriptions where available.
- The 2015 point set came from a mirrored copy of the official 2015 key
  (`scribd.com/document/654250593`). The 2016 46-question/80-point paper text came from
  a mirrored copy of the official 2016 D variant (`scribd.com/document/849025396`).
  These mirrors are used only to verify format; no official question text is stored in
  this folder.
- The 2016 `12fizikKey.pdf` from `ees.eec.mn` is a state-exam (`УШ`) key with 30 MCQ,
  not the ЭЕШ key; it is deliberately not used to set the 2016 mock format.
- No official question text, passage, option, or figure is included in the mock JSON.
- Keep this folder out of any public deployment. It is a local preparation resource,
  not website content.
