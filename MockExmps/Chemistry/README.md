# Chemistry ЭЕШ / ЭШ 2020–2026: offline mock pack

**18 Mongolian JSON mock forms: three for each of 2020, 2021, 2022, 2023, 2025 and 2026, with
authored answer keys, explanations and original SVG figures. Nothing is integrated into the website.**

These are preparation drafts written as "other variants" of one official reference paper per year:
same item order, item type, skill and point value, with different substances, contexts and numbers.
They are **not** official papers or official keys, and their difficulty has not been equated.

## Contents

| Year | Mock forms | Official reference kept locally (`<year>/reference/`) | Part II |
| --- | --- | --- | --- |
| 2020 | `2020/mock-01.json` … `mock-03.json` | EEC question bank, variant A, Part I text (`bank-A.html/json`) | provisional |
| 2021 | `2021/mock-01.json` … `mock-03.json` | EEC question bank A, Part I + official 2021 chemistry blueprint PDF | provisional |
| 2022 | `2022/mock-01.json` … `mock-03.json` | EEC question bank A, Part I | provisional |
| 2023 | `2023/mock-01.json` … `mock-03.json` | EEC question bank A, Part I | provisional |
| 2024 | **none** | **not found** – see below | – |
| 2025 | `2025/mock-01.json` … `mock-03.json` | Full official A PDF (archived), page renders, text extraction | parallel to official |
| 2026 | `2026/mock-01.json` … `mock-03.json` | Full official A PDF (eec.mn materials API), page renders, text extraction | parallel to official |

Every JSON states its year in `referenceYear`, the form in `mockVariant` (M1–M3) and the source in
`reference`. `reference/` folders are local only (repository `.gitignore`), like the other subjects.
See [SOURCES.md](SOURCES.md) for URLs and how each file was obtained.

**2024 is missing on purpose.** The 2024 chemistry A–D PDFs and key were published on eec.mn
(`wp-content/uploads/2024/07/Хими-А-хувилбар.pdf`), but the rebuilt eec.mn site returns 404, the
Wayback Machine never captured them, the question bank stops at 2023, and the only third-party copy
found (Testly.mn) requires an account. No login, paywall or access-control bypass was attempted, so no
2024 mocks were written rather than inventing a "2024" paper without a reference.

## Format (same in every year)

- 100 minutes, 100 points. Part I: 40 five-option MCQ worth 68 points. Part II: four constructed
  tasks × 8 one-digit answers (a–h), 32 points, with the paper's rounding rule.
- MCQ points follow the reference year: 2022–2026 use 1–22 × 1, 23–30 × 2, 31–40 × 3;
  2020 uses 1–12 × 1, 13–40 × 2; 2021 uses the bank's own irregular split (still 68).
- `questions[]`: `answer` (A–E), `answerText`, `explanation`, `skill`, `referenceItem`, optional
  `optionColumns` (table-style options are `"col1 | col2"` strings) and `figure.path`.
- `tasks[]`: `parts[]` with `answer` (digit), `explanation`; `choices` text is inside `prompt`.
  Tasks marked `"provisional": true` are for 2020–2023 (see limitations).
- Figure paths are relative to the year's JSON. Keep each `images/mock-0N/` folder next to the JSON.
  Where the reference item had an image, the mock item has an original SVG (apparatus, graphs,
  chromatograms, energy diagrams, skeletal structures, tables). Official images are not reused.
- Answer letters are balanced (8 × A–E per form) by rotating option order; content is unchanged.

## Checks performed

- `tools/build.py` regenerates all JSON/SVG and validates: 40 MCQ, 68 + 32 points, A–E present and
  distinct, key present, 4 tasks × a–h, single-digit Part II answers, figure files exist.
- A separate check confirmed all 720 MCQ keys still point at the intended option after rotation.
- Every calculation item was worked through while authoring; the working is in each `explanation`.
- `manifest.json` lists every form with its SHA-256; `validation-report.json` records the results.
- Sample figures from every year were rasterised and inspected visually.

## Limitations — read before use

1. **2020–2023 Part II is provisional.** The bank exposes only Part I and the full PDFs were not
   recoverable, so Part II follows the confirmed 4 × 8 format and the official 2021 blueprint topics
   (ion/gas identification, equilibrium with Kc and pH, period-3 trends, organic reaction schemes).
2. **2020–2023 figures are reconstructed.** The bank's `stat.eec.mn` image links are dead, so items
   whose official picture is lost were rebuilt from the item text; the official picture may differ.
3. **No official answer keys were used.** All keys and explanations are authored. 2026 item 40 in the
   extracted layout appears to have no fully correct option; the mock uses an unambiguous version.
4. **Not teacher-reviewed or equated.** Mongolian terminology, distractor quality and difficulty need
   a chemistry teacher's review; some ∆H values in provisional equilibrium tasks are given data,
   chosen to be plausible rather than taken from a single table.

## Reproduce

```powershell
python MockExmps/Chemistry/tools/build.py          # all years, manifest and validation report
python MockExmps/Chemistry/tools/build.py 2026     # one year only
python MockExmps/Chemistry/tools/acquire_bank.py   # refresh 2020–2023 bank references (itemLid=9)
```

Content lives in `tools/content_<year>.py`; figure helpers in `figures.py`, `chem_draw.py`,
`chem_extra.py`; provisional Part II generators in `bank_part2.py`. Requires Python 3 (PyMuPDF/Pillow
only for optional previews).

Written 2026-11-09 by Claude Code (Claude Opus 5.5), using Python, curl, web search and the in-app
browser (Wayback Machine). No routes, catalogue entries, database rows or website code were changed.
