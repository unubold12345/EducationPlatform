# Original HSK 1 mock exams — offline pack

Three complete HSK 1 mock forms, prepared on 2026-11-10 with DeepSeek Harness (deepseek-flash). **Offline authoring pack only:** it is not imported by the website, has no database rows, and is excluded from deployment in `.vercelignore`. Every question, dialogue, key, explanation and picture is original; no official HSK question, recording, picture or answer key is reproduced.

The forms follow the **current regular HSK 1 (HSK 2.0) paper used for 2026 test dates**: 40 items, Listening 20 and Reading 20, about 40 minutes including five minutes for personal information, with the picture-based tasks the official paper gives to candidates. The official section structure and the 150-word HSK 1 syllabus are references only. See [SOURCES.md](SOURCES.md) for the checked sources and [ADMINISTRATION.md](ADMINISTRATION.md) for how to run a sitting.

## The three forms

| Form | Theme | Candidate booklet | Answer sheet | Key | Examiner script |
| --- | --- | --- | --- | --- | --- |
| 01 | At school and at home | [booklet](mock-01/booklet.pdf) · [Markdown](mock-01/questions.md) | [PDF](mock-01/answer-sheet.pdf) · [Markdown](mock-01/answer-sheet.md) | [PDF](mock-01/answers.pdf) · [Markdown](mock-01/answers.md) | [PDF](mock-01/examiner-listening.pdf) · [Markdown](mock-01/examiner-listening.md) |
| 02 | Saturday, going to Beijing | [booklet](mock-02/booklet.pdf) · [Markdown](mock-02/questions.md) | [PDF](mock-02/answer-sheet.pdf) · [Markdown](mock-02/answer-sheet.md) | [PDF](mock-02/answers.pdf) · [Markdown](mock-02/answers.md) | [PDF](mock-02/examiner-listening.pdf) · [Markdown](mock-02/examiner-listening.md) |
| 03 | Friends and home | [booklet](mock-03/booklet.pdf) · [Markdown](mock-03/questions.md) | [PDF](mock-03/answer-sheet.pdf) · [Markdown](mock-03/answer-sheet.md) | [PDF](mock-03/answers.pdf) · [Markdown](mock-03/answers.md) | [PDF](mock-03/examiner-listening.pdf) · [Markdown](mock-03/examiner-listening.md) |

Each form is 40 items: Listening Parts 1–4 (items 1–20) and Reading Parts 1–4 (items 21–40). The PDF booklets are 8 pages; the keys and examiner scripts are 4 pages each; each answer sheet is one page. The Markdown files are the editable/text versions, and `mock.json` is the structured authoring copy with answers.

## Official structure followed

| Section | Parts | Items | Time |
| --- | --- | ---: | --- |
| Listening | 4 × 5 | 1–20 | about 15 minutes |
| Transfer listening answers | — | — | 3 minutes |
| Reading | 4 × 5 | 21–40 | 17 minutes |
| Personal information | — | — | 5 minutes |
| **Total** | **8 parts** | **40** | **about 40 minutes** |

The item types match the current paper:

| Part | Official task | What the candidate sees | What is heard |
| --- | --- | --- | --- |
| Listening 1 | Judge a phrase against one picture (√/×) | one picture per item | a short phrase, twice |
| Listening 2 | Choose the picture matching a sentence (A/B/C) | three pictures per item | one sentence, twice |
| Listening 3 | Choose the picture matching a dialogue (one of six) | six pictures for items 11–15 | a two-turn dialogue, twice |
| Listening 4 | Choose the answer to a short statement and question (A/B/C) | three printed options per item | statement + question + options, twice |
| Reading 1 | Judge a word against one picture (√/×) | one picture and one word per item | — |
| Reading 2 | Match sentences to pictures (one of six) | six pictures for items 26–30 | — |
| Reading 3 | Match five questions with six answers | five questions and answers A–F | — |
| Reading 4 | Choose the word for each blank | six word options, five sentences | — |

This is why the pack contains pictures: the official HSK 1 paper uses them in Listening Parts 1–3 and Reading Parts 1–2. Every scored picture is present as an original SVG in each form's `images/` folder, and the printable booklets embed them. The six-picture sets deliberately contain one unused picture, as in the official task.

All candidate-facing Chinese is printed with pinyin, as in the official HSK 1 paper. The pinyin is shown below or beside the characters for screen and print use; it is not a character-by-character ruby layout.

**Version note:** regular HSK 1–6 dates in 2026 still use the six-level (HSK 2.0) format. HSK 3.0 is being introduced through specifically announced sessions, including 20 September 2026, with a larger vocabulary (about 300 words at Level 1) and a different picture/text mix. This pack is for the current regular HSK 1, not HSK 3.0. Confirm the format on your own registration before using it.

## Difficulty and content

- The Chinese is written inside the HSK 1 vocabulary and grammar range: the 2015 150-word syllabus, plus 没 (the syllabus entry omitted by the reference PDF), 猫, 火车 and 饭馆, which appear in the official HSK 1 sample or are its transparent everyday words. Proper names (王月, 李月, 王老师) are the only other Chinese tokens; 女/男 are printed speaker labels.
- Sentences are short and concrete. Listening Part 1 uses 2–4-word phrases; Part 2 uses one short sentence; Part 3 uses two turns; Part 4 uses one or two short clauses plus a question. Reading sentences are 5–10 words. The three forms use different contexts and different keys while keeping the same task blueprint.
- There is no writing or speaking section in HSK 1, and this pack adds none.
- All content is a draft for practice. A qualified Chinese teacher has not reviewed the language, distractors, pictures or level fit; no learner-based difficulty calibration has been done. Do not present it as an official form or as an equated HSK score.

## Listening without an audio file

No audio is included. The listening section is **reader-administered**: the examiner reads the examples and every item twice, using [examiner-listening.md](mock-01/examiner-listening.md) (or the PDF). The script gives Chinese, pinyin and pause instructions. A fluent Mandarin reader is required. The suggested pace finishes in 12–15 minutes; the official listening window is about 15 minutes, followed by 3 minutes to transfer answers. Do not add long silent waits merely to fill the official time, and do not claim that a reader session reproduces recorded pacing.

The reader script and the key are private. The candidate booklet does not print the listening texts. After the sitting, the transcripts in `answers.md`/`answers.pdf` can be used for review.

## Marking and review

Give one raw mark per correct answer and zero for wrong or blank. Listening and Reading each have 20 marks. A practice score out of 200 is `5 × correct answers` in each section; the usual HSK 1 pass mark is 120/200. This is a raw practice conversion, **not** an official equated score, and it does not certify a level.

For review, use the private key, read each listening transcript, and compare the picture that the key identifies. The examples are not scored. If a reader makes a substantive error, record the affected item and state the changed denominator; do not silently treat the delivery as valid.

## Files, rebuild and validation

```
MockExmps/HSK/
  README.md                     this file
  SOURCES.md                    checked official references and version note
  ADMINISTRATION.md             how to run and mark a sitting
  REVIEW.md                     author review, caveats and pending teacher review
  manifest.json                 SHA-256 hashes of every form file and shared example
  validation-report.json        structural check output
  examples/                     shared example pictures (not scored)
  mock-01/ … mock-03/
    questions.md                candidate booklet (text)
    booklet.pdf                 printable candidate booklet
    answer-sheet.md / .pdf      blank answer sheet
    answers.md / .pdf           private key, transcripts and explanations
    examiner-listening.md / .pdf private reader script
    mock.json                   complete structured form, including answers
    images/                     original SVG pictures for this form
  _source/
    content.py                  all three forms' text and keys
    scenes.py                   original SVG scene library
    build.py                    deterministic renderer + validator
    pdf_build.py                optional ReportLab PDF layout
```

Rebuild the Markdown, JSON, SVG and hashes from the repository root:

```powershell
python -B MockExmps/HSK/_source/build.py
```

This validates the 40-item counts, answer membership, picture references, duplicate stems and HSK 1 vocabulary coverage, then writes the text files, pictures and `manifest.json`. It does not read or change website content or the database.

To rebuild the PDFs as well:

```powershell
python -B MockExmps/HSK/_source/build.py --pdf
```

The PDF step needs a local `resvg` executable at `artifacts/resvg/resvg.exe` to turn each SVG into a print-resolution PNG, plus Microsoft YaHei for the Chinese text. Neither is part of the pack. The included PDFs were generated with both; users who only want to print do not need to rebuild them. The SVGs are the authoritative drawings.

The build checks are structural and mechanical. They cannot prove that a sentence is natural, that a distractor is plausible, that a picture is unambiguous, or that the difficulty matches a real HSK form. Those require teacher review and learner trials. See [SOURCES.md](SOURCES.md) and `validation-report.json` for what was actually checked.

## Limits

- **Not official and not affiliated** with Chinese Testing International (CTI), the Center for Language Education and Cooperation, Hanban or any test centre. “HSK” is used only to describe the format being practised.
- **No teacher or native-speaker review yet**, no learner calibration, no audio, no psychometric equating and no official score conversion.
- The pictures are simple original flat-vector drawings, not official artwork. They are intentionally text-free so a candidate cannot read an answer from the picture.
- The PDF layout omits the six-picture *example* grids in Listening Part 3 and Reading Part 2 to keep the booklet to eight pages; the scored six-picture set is always printed in full. The Markdown candidates include the example grids for study.
- The pack does not cover HSK 3.0, HSK 2 or any later level.
- Do not commit, deploy or publish the pack without the owner's decision; it is excluded from Vercel deployment by `.vercelignore`, and its answer keys are private during a sitting.
