# Original JLPT N5 and N4 mock packs

Three N5 forms and three N4 forms, written by Codex (GPT-6) on 2026-11-08. **Offline authoring source.** These files remain unserved and excluded from deployment. On 2026-11-08 the owner also requested website integration: `scripts/build-jlpt-mocks.mjs` converts the packs into private `assets/jlpt` definitions for `/exams/jlpt`. The offline booklets below remain independently usable.

All questions, dialogues, passages, notices, keys and explanations are original. The JLPT's official section structure and ordinary daily-life settings are references; no official questions, recordings or answers were reproduced. These are independent, unofficial drafts awaiting Japanese-teacher review and learner-based difficulty calibration.

## Open a mock

| Level | Form 01 | Form 02 | Form 03 |
| --- | --- | --- | --- |
| N5 | [New student and weekend outing](N5/mock-01/questions.md) | [Home, shopping and family visit](N5/mock-02/questions.md) | [Day trip and daily routines](N5/mock-03/questions.md) |
| N4 | [Community events and study plans](N4/mock-01/questions.md) | [Travel, work and shared facilities](N4/mock-02/questions.md) | [Health, notices and learning a skill](N4/mock-03/questions.md) |

Each form directory contains:

- `questions.md`: candidate booklet, including notices/passages and printed listening options.
- `answer-sheet.md`: blank, numbered response sheet, with numbering restarted per section.
- `answers.md`: correct numbered choices, explanations in English, and completed sentence-order solutions.
- `examiner-listening.md`: private listening stimulus and spoken choices, ordered to match the booklet/key.
- `mock.json`: complete structured authoring pack, including answers and scripts; never give this file to a candidate during a sitting.

For these offline booklets, listening can be administered by a separate reader. The website also has 24 generated Japanese Kokoro tracks in the repository's private `assets/exams` directory, delivered through protected routes. Spoken-option choices and quick-response stimuli are absent from the candidate booklet. Verbal-expression items use written situation cues instead of the official format's illustrations. Some task-based listening items use text alternatives instead of picture alternatives. N4 grammar/reading includes parenthetical readings for selected less basic kanji. Recordings are shorter than the official listening window; the remaining website stage time is for checking answers. See [offline administration](ADMINISTRATION.md).

## Structure

| Section / task | N5 items | N4 items |
| --- | ---: | ---: |
| Vocabulary: kanji reading | 7 | 7 |
| Orthography | 5 | 5 |
| Contextual expressions | 6 | 8 |
| Paraphrases | 3 | 4 |
| Usage | — | 4 |
| **Vocabulary total / time** | **21 / 20 min** | **28 / 25 min** |
| Grammar form selection | 9 | 13 |
| Sentence composition (third-position ★) | 4 | 4 |
| Text grammar | 4 | 4 |
| Short passage comprehension | 2 | 3 |
| Mid-size passage comprehension | 2 | 3 |
| Information retrieval | 1 | 2 |
| **Grammar + reading total / time** | **22 / 40 min** | **29 / 55 min** |
| Listening: task comprehension | 7 | 8 |
| Key points | 6 | 7 |
| Verbal expressions | 5 | 5 |
| Quick response | 6 | 8 |
| **Listening total / time** | **24 / 30 min** | **28 / 35 min** |
| **Whole form** | **67 / 90 min** | **85 / 115 min** |

Four alternatives are supplied for vocabulary, grammar, reading, and the first two listening groups. The final two listening groups have three alternatives. Each form has its own content and key; task patterns intentionally follow the same blueprint.

Counts follow the official post-December-2020 approximate blueprint; the JLPT notes that real counts can vary. Timings were checked against the current official section page on 2026-11-08. The two counts-table images in `reference/` are official structure references only, retained with their source links in [SOURCES.md](SOURCES.md).

## Marking and limits

Give one raw practice mark per correct answer and zero for wrong/blank. Report Vocabulary, Grammar + Reading, Listening, and total raw results separately. Do not convert these to an official 180-point score, sectional scaled score, JLPT passing threshold, or certification claim. The forms have not been psychometrically equated. Neither level has a separate speaking or writing task.

The content has undergone an author review and automated structural checks. A qualified Japanese teacher has not reviewed the Japanese, distractors, level fit or reader delivery; no student trial or audio listening verification has taken place.

## Rebuild and validate

From the repository root, run `python -B MockExmps/JLPT/_source/build.py` (Python standard library only). It deterministically rebuilds only this pack, checks the per-type counts, number and uniqueness of choices, answer membership, question IDs and repeated stimuli within each level, and writes SHA-256 file hashes to `manifest.json`. It neither reads nor changes website content or the database. Structural checks cannot prove linguistic correctness.

Source: `_source/n5.py`, `_source/n4.py`; helper: `_source/common.py`; renderer/validator: `_source/build.py`. Keep answers and examiner scripts private during a sitting.
