# Biology ЭЕШ / ЭШ: 2020–2026 offline draft pack

**21 Mongolian JSON drafts: three forms for each year, with authored answers,
explanations and original SVG figures. On the website since 2026-11-10 (see "Website integration").**

These are review drafts, **not a completed set of equivalent official variants**.
The remaining source and fidelity gaps below matter to the owner's requirements.
Do not describe these files as official exams, official keys, or calibrated forms.

## Website integration (2026-11-10)

`node scripts/build-entrance-mocks.mjs biology` converts these drafts into the site's ЭЕШ papers
(`eesh-biology-<year>-b1`–`b3`, program `entrance`, ₮10,000 each or University Prep). The pack itself
stays offline and excluded from deployment. Rerun the converter for this subject after editing a JSON file; it
validates keys, options, 100-point totals and figure files. Everything under "What still needs work" below
still applies: the papers are labelled as practice content awaiting teacher review.
The converter leaves out a "№ / Бүтэц / жишээ" table when every word in it is already in the
question or its options (360 items); every other figure is shown.

## Contents

| Year | Drafts | Local reference | Remaining source gap |
| --- | --- | --- | --- |
| 2020 | `2020/mock-01.json` … `mock-03.json` | Official bank A text/HTML | Part II and source images unavailable; two different A-1 entries |
| 2021 | `2021/mock-01.json` … `mock-03.json` | Official bank A text/HTML | Part II and source images unavailable |
| 2022 | `2022/mock-01.json` … `mock-03.json` | Archived official A PDF, page renders, bank text | Original PDF has damaged font streams and clipped text |
| 2023 | `2023/mock-01.json` … `mock-03.json` | Official bank A text/HTML | Part II and source images unavailable |
| 2024 | `2024/mock-01.json` … `mock-03.json` | Source record only | Full official A PDF/images NOT recovered; indexed text inspected |
| 2025 | `2025/mock-01.json` … `mock-03.json` | Archived official A PDF | No official answer key used |
| 2026 | `2026/mock-01.json` … `mock-03.json` | Official A PDF from current EEC materials API | No official answer key used |

`reference/` directories are local only under the repository's existing ignore
rules. Preserve them for review; they are not committed or deployed. For 2024,
`reference/source-record.json` is a provenance record, **not a reference paper**.
See [SOURCES.md](SOURCES.md) for the actual URLs and acquisition evidence.

## Format and answers

- 2020–2025: 50 A–E multiple-choice items; 2026: 46.
- Each draft has four Part II tasks and 24 labelled subanswers, 80 minutes,
  and a 76 + 24 = 100 practice-point total.
- `referenceYear`, `referenceVariant`, `referenceItem`, `points`, `skill` and
  `blueprint.json` support item-by-item review. The mark placement for 2022–2026
  follows the inspected reference. The legacy 2020 bank sums to **74**, and
  2021 to **75**, so house adjustments add one point to 2020 items **39, 41**
  and 2021 item **39**. Those adjustments are provisional, not official marks.
- MCQ `answer` is the A–E key; `answerText` repeats its text. Part II answers
  are on each `parts[]` entry, with points and explanations. `calculation`
  records permit independent arithmetic checks. All answers were authored
  by Codex (GPT-6). The bank's incorrect `correctRow` HTML classes were never
  used as a key.
- `figure.path` is relative to its year's JSON file. Keep each `images/`
  directory alongside the JSONs. Figures are newly authored SVG diagrams,
  plots and data tables; official images are not reused in mocks.
- `manifest.json` lists the files and SHA-256 digests. `validation-report.json`
  records what was checked and what remains unverified.

## What still needs work

1. Recover full A references for 2020, 2021 and 2023, plus the original 2024
   PDF/images. All three forms for each of 2020, 2021 and 2023 currently use
   explicitly labelled **provisional Part II tasks**, not verified replacements
   for that year's official Part II.
2. Audit every item against its reference. The draft follows topic order and
   point totals, but some slots use topic-level adaptations. In particular,
   a table or process diagram sometimes replaces an anatomical identification
   task. Some prompts, numerical values and response packaging differ in ways
   that can change difficulty. Exact equivalence has **not** been established.
3. Preserve official Part II digit grouping and mark allocation after source
   recovery. The present structured subanswers do not always match the paper's
   printed digit boxes.
4. Have a biology teacher review factual accuracy, Mongolian terminology,
   distractors and diagrams. Use learner data to assess difficulty. Structural
   and arithmetic checks cannot establish that the papers are equally hard.

At authoring time (2026-11-08) no routes, catalogue entries, database records, timers, grading code or purchases
were added. `.vercelignore` excludes this pack. No commit, push or deployment
was performed for this task.

## Reproduce offline

```powershell
python MockExmps/Biology/tools/author.py
python MockExmps/Biology/tools/validate.py
```

Authoring needs Python, PyMuPDF, and the local reference PDFs/bank JSONs.
`acquire_bank.py` documents the public EEC year selector and pagination. Its
downloaded references are not a substitute for the missing complete booklets.

Written 2026-11-08 by Codex (GPT-6), using Python/PyMuPDF, web search, public
HTTP endpoints and the in-app browser for archived downloads.
