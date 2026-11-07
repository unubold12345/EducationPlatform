# Mathematics reference variants and offline mocks

Prepared by Codex (GPT-6), 2026-11-06. No website integration, seed, database change, commit or deployment.

## What is ready

| Reference year | Variant | Reference retained | Mock JSON files |
| --- | --- | --- | --- |
| 2015 | A | 8x100 annotated edition of the exam variant | 5 |
| 2016 | C | 8x100 annotated edition of the exam variant | 5 |
| 2017 | D | 8x100 annotated edition of the exam variant | 5 |
| 2018 | A | Six original pages from help.eec.mn | 5 |
| 2019 | A | Six original pages from help.eec.mn | 5 |
| 2021 | A | Eight original pages from help.eec.mn | 5 |
| 2022 | A | Owner-approved MathX transcription and figures | 5 |
| 2023 | A | Owner-approved MathX transcription and figures | 5 |
| 2024 | A | Owner-approved MathX transcription and figures | 5 |
| 2025 | A | Owner-approved MathX transcription and figures | 5 |
| 2026 | A | Owner-approved MathX transcription and figures | 5 |

The 2015–2017 PDFs include the mirror publisher's solutions and advertisements. They are clearly labelled annotated editions, **not original unannotated official booklets**. The original 2018, 2019 and 2021 page images are unmodified. Every reference has its source URL, byte size and SHA-256 in the year's `reference.json`.

2020 was excluded at the owner's request. No older materials are retained.

## Source limitations

**All 11 requested years other than 2020 now have five mocks: 55 forms, 2,200 questions.** On 2026-11-06 the owner approved clearly labelled third-party transcriptions when the original booklet cannot be retrieved. The 2022–2026 references therefore use the complete MathX Variant A transcriptions, their answer choices, multipart statements and original associated figures. They are **not original official booklets**, and their accuracy against the originals has not been independently verified. The source's own answer keys and solutions are omitted; the new mock answers were calculated separately.

The old official 2023–2026 links were unavailable; the current official 2024 entry was empty and the 2025 entry contained only questions 1–23. The incomplete 2025 API entry is retained under `2025/reference/`, expressly marked incomplete, alongside the complete fallback transcription. Each year's `reference.json` retains the original retrieval observations, source URLs and hashes. See [manifest.json](./manifest.json) for coverage.

## Reviewing a year

Open its `reference/`, `reference.json`, `blueprint.json` and `mock-01.json` through `mock-05.json`. Each mock explicitly identifies `referenceYear`, `referenceVariant` and `mockVariant`. Each question identifies its corresponding reference question and skill. The five forms contain different numerical givens, coordinates, settings or response choices while targeting the reference's topic sequence and solution methods.

Each form has 36 A–E questions and four structured tasks: 72 + 28 = 100 points, with answers and worked explanations in the JSON. Part II stores exact mathematical answers to subquestions **rather than reproducing the official digit boxes**. Formulas use Unicode mathematical notation and occasional `sqrt(...)`, `^` or matrix arrays; they are readable content, not website-renderer data.

These are original practice variants, not БҮТ variants or official answer keys. The answers were calculated for the new questions; the official keys were not required. Matching difficulty is the design target. No student-based difficulty calibration or independent teacher review has established exact equivalence. Review the mapping and arithmetic before release.

## Validation and authoring

Geometry questions now include structured points, shapes, labels, givens and an
embedded SVG in `figure`. See [FIGURES.md](./FIGURES.md) and the offline
[figure gallery](./figures-preview.html). Each year's `reference/figures.json`
links the saved source diagrams for comparison. Optional illustrations are marked
so they can remain hidden in a future exam interface.

`tools/yearYYYY.py` reproduces that year's five JSON forms using Python, SymPy and `tools/common.py`. These offline authoring tools are not imported by the application. Run `python MockExmps/Math/tools/validate_all.py` from the repository root to validate all 55 forms, complete answer keys, option uniqueness and 100-point totals. It also runs 990 independent symbolic, numerical or enumerative assertions and compares constant answer choices for mathematical duplicates. The actual results and limits are recorded in [validation-report.json](./validation-report.json).

Reference materials and answer-bearing mocks are for the owner's local review. Keep this folder outside public serving and deployment inputs; it is not a website content source.
