# Author review — mocks 07–12

Prepared on 9 November 2026 by Codex (GPT-6). This is an author review, not an independent teacher assessment.

## Coverage

| Form | Reading words | Listening-script words | Writing visual |
| --- | ---: | ---: | --- |
| 07 | 2,311 | 2,510 | Three-series line graph |
| 08 | 2,310 | 2,556 | Two pie charts with changing expenditure totals |
| 09 | 2,274 | 2,606 | Capacity, occupancy and length-of-stay table |
| 10 | 2,263 | 2,608 | Manufacturing flow with rejection and reprocessing |
| 11 | 2,242 | 2,720 | Paired site plans |
| 12 | 2,254 | 2,614 | Grouped bars and supplementary study-time table |

Listening word counts include role labels; spoken delivery is slightly shorter. Measured recording durations are listed in AUDIO.md; live-reader timing varies. Parts 1–3 have one midpoint pause after five questions; Part 4 is continuous. Each form supplies four scripts in the conventional progression: an everyday conversation, a public talk, an academic discussion and a lecture. Parts 1 and 3 are conversations; Parts 2 and 4 have one main speaker.

## Checks and editorial decisions

- All 480 objective items have a key and source evidence. Missing-information answers distinguish absence from contradiction; person matching uses named roles; paragraph and heading evidence is checked against the selected paragraph.
- Word completions are present in the corresponding text or script and fit the printed word limit. Spoken numbers are represented conventionally in keys. A few overly open completion stems were narrowed during review.
- Every Listening sequence follows question order. The first five answers occur before the midpoint marker in Parts 1–3. The two plans are self-contained, oriented and keyed by position.
- Each Reading form uses three distinct full passages and totals within the official format's published text-length range. At least one passage develops a sustained argument. Fictional examples are identified as such rather than presented as published research.
- Writing has distinct datasets/tasks, full units and accessible transcriptions. Percentage shares are distinguished from amounts, occupancy from visitor shares, and overlapping participation from a 100% distribution. The process includes both rejection and a return loop; the plans show retained as well as changed features.
- Six SVGs were rasterised with local Sharp and visually inspected together. Labels, legends, arrows and values are readable; paired charts/maps and all table columns fit the canvas. Markdown table spacing was checked in the generated answer sheets and keys.
- Speaking has three familiar Part 1 topics per form, a distinct long-turn card and linked general discussion. Examiner-only questions remain separate from the candidate cue card.
- The deterministic builder validates counts, continuous numbering, key membership, completion limits, source excerpts, paragraph mapping and Listening order. `validation-report.json` and SHA-256 `manifest.json` record the generated pack.
- `npm run check` passed: lint, typecheck and 156 unit tests in the shared worktree. No production build or browser-suite run was needed for this offline authoring pack. Writing visuals were inspected as local files; no site preview was restarted.

## Remaining limits

The added recordings use synthetic British and American stock voices. Complete human listening/pronunciation review and candidate trials remain outstanding. The same broad Listening blueprint is used across forms, with completion, single-answer multiple choice and matching; two include plans. This does not cover every possible official question configuration.

The English, distractors, answer uniqueness, task difficulty and productive-skill prompts still need a qualified IELTS teacher's independent review. The forms have not been trialled, statistically calibrated or equated to one another. No official band conversion, examiner certification or test-day equivalence is claimed. Writing guidance is a content checklist, not a marked model response; Speaking requires actual interaction and assessment of speech.

Website definitions, released recordings, purchases, attempts and database content were not edited for this work. The only deployment configuration edit is exclusion of `MockExmps/IELTS/`. Unrelated work by other agents remains outside this pack's authorship.

## Audio addition — 9 November 2026

Added 24 part MP3s and six complete Listening MP3s with local Kokoro-82M stock voices. Complete-track durations are 07 25:11; 08 25:29; 09 25:19; 10 25:48; 11 26:04; 12 25:40. All tracks include the chosen reading/checking protocol. The full tests join decoded parts with continuous timestamps and are encoded as 24 kHz mono MP3s; the individual parts are retained for focused practice.

`_source/validate_audio.py` passed: all 30 files fully decoded without FFmpeg errors, file/source hashes agree, every source turn is represented by the assigned voice, segment timelines are contiguous, all specified pauses are present, and full-test durations match their parts. Initial compressed-stream joins produced timestamp warnings; full tests were rebuilt on a decoded-audio timeline before these final checks.

Local faster-whisper `small.en` checked two source-aligned samples per exam: the name/spelling turn in Part 1 and the opening lecture paragraph in Part 4. All 12 automatic spot-checks passed, with mean word error rate 0.8%. Full results are in `audio-asr-review.json`. This is automatic intelligibility evidence, not a complete human pronunciation review. `npm run check` also passed again (lint, typecheck, 156 unit tests). No website integration or real-provider call was made.
