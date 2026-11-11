# Author review and validation record

Date: 2026-11-10. Reviewer/tool: DeepSeek Harness (deepseek-flash), Python and ReportLab; PDFs visually checked at 100 dpi. This is an author review, **not** a Chinese-teacher review or a learner calibration.

## What was checked

| Check | Result |
| --- | --- |
| Three forms, 40 items each, numbered 1–40 in order | Passed for all three |
| Eight five-item parts per form | Passed; Listening 1–4 and Reading 1–4 each have 5 |
| Answer is one of the printed options/pictures | Passed; checked for every item |
| Listening 1/Reading 1 answers are √ or × | Passed |
| Listening 2/4 answers are A–C | Passed |
| Six-picture and six-option sets in Listening 3, Reading 2, Reading 3, Reading 4 | Passed; each set has exactly six labels and one extra |
| Duplicate scored stems inside one form | None found |
| Chinese text outside the HSK 1 allowed list | None found by the greedy validator; see the caveat below |
| Chinese text has a pinyin field | Present for all candidate-facing text; spot-checked manually |
| Picture scene resolves to an original SVG | Passed; 128 SVGs, all valid XML |
| PDF booklets, keys, scripts, answer sheets | Built and visually checked for all three forms |
| Candidate booklet pages | 8 per form; score keys and scripts 4; answer sheet 1 |
| Answer keys match the JSON and Markdown | Generated from the same source data |

The exact answer spreads are in `validation-report.json`. They are not forced to a fixed pattern; the counts vary by form while every item remains independently keyed.

## What was reviewed by eye

- The three candidate booklets were rendered; the full Form 01 booklet and the pages that vary in Forms 02/03 (Part 2, Part 3/4, end page and answer sheet) were inspected at 100 dpi. All 126 scene variants (42 scenes × 3 colour variants) were inspected in a contact sheet.
- Every picture used in a scored item was checked against its key and explanation. The six-picture sets contain one unused picture; the candidate is told so in the part instruction.
- The images contain no Chinese or English answer words. A few contain conventional non-answer marks (for example, a taxi roof sign, a hospital cross, “Zzz” over a sleeping figure, a clock face), which do not give away a printed option.
- The PDF text was spot-checked for missing questions, missing answer rows and pinyin that failed to render. The answer sheet lists all 40 items.
- The booklet layout was tightened so Part 2 fits on one page and Part 3/4 share a page. The PDF abbreviates the six-picture *example* grids in Listening Part 3 and Reading Part 2; the scored grids are always full size. The Markdown candidates retain the example grids.

## Caveats

1. **No native-speaker or teacher review.** The Chinese is author-written and mechanically checked for vocabulary coverage, but naturalness, regional usage, distractor quality, picture ambiguity and exact HSK 1 difficulty remain unverified. A teacher should read all three forms before classroom use.
2. **No learner calibration.** The forms are parallel by blueprint and vocabulary range, not equated by difficulty. Do not assume that a score on one form predicts a score on another or on the official test.
3. **Vocabulary validator is greedy.** It segments Chinese strings against the allowed list and reports characters that remain. It can miss a valid word segmented differently, and it cannot detect awkward collocations. It did not find any uncovered string; that is a necessary, not sufficient, condition.
4. **Pinyin is line-level.** The official paper prints pinyin above the characters; this pack prints it below/beside them. Tone marks and neutral tones were checked manually, but a teacher should still proofread the pinyin, especially 一/不 sandhi and names.
5. **No audio.** The listening section is reader-administered. The script's suggested timing is 12–15 minutes; it is not a measured recording and does not reproduce the official acoustic demands.
6. **Pictures are simple flat vector art.** They are original and text-free, but they are not official artwork and may be less detailed than the printed HSK pictures. A teacher should confirm that each picture is unambiguous for their learners.
7. **HSK 3.0 is out of scope.** The pack targets the current regular HSK 1 (HSK 2.0) format. Check the registration format before use.

## Sign-off

| Area | Status |
| --- | --- |
| Structure and keys | Author-checked, mechanically validated |
| Pictures | Original, rendered, visually checked |
| Chinese language | Draft; teacher review pending |
| Difficulty | Blueprint-parallel; learner calibration pending |
| Audio | Not included; reader script provided |
| Website integration | Deliberately not implemented |

Recommended next steps: a Chinese teacher reads all 120 items and the 17 shared examples, flags any unnatural sentence or ambiguous picture; a small learner trial checks timing and difficulty; if audio is wanted, record a fluent reader and keep the script/hash record with the recordings.
