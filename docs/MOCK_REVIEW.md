# Mock exam review — 2026-11-13

Agent: Claude Code (Claude Opus 5.5). Owner request: review all mock exams. The review itself was read-only; the
fixes that followed are in "Fix status" below. Scope: the 221 mocks the site serves (6 SAT, 12 IELTS, 3 JLPT N5, 3 JLPT N4, 3 HSK 1,
194 ЭЕШ) plus the 10 offline free mocks in `MockExmps/Free/`. Content was read through the site's own loaders
(`findExam`, `mockPractice`) and graded with the real `engine.ts`; published admin edits in the hosted database
were not read.

Severity: **Critical** = a correct answer is marked wrong, or a wrong one right. **High** = the item or form
does not measure what it claims. **Medium** = visible defect a student notices. **Low** = cosmetic.

## Fix status (same day)

Owner request: "fix critical ones first then fix everything". Same agent. The sections after this one are the original review.
Nothing was committed, pushed or deployed.

| Finding | Status |
| --- | --- |
| C1 | Fixed. `engine.ts` compares a choice exactly (Unicode-normalised, spacing and apostrophes tidied) when the key is one of the options; a key that matches no option keeps the old case-insensitive comparison. |
| C2–C5 | Fixed in `MockExmps/Physics/tools/generate.py`; all 60 papers regenerated. Part II keys are exact, the usual roundings are accepted (`accept`), 2.1d givens are clean decimals, and 2.3d asks for the integer coefficient of π (`T = [d]·π·10ⁿ с`). Later, owner-approved: a 2.3b force typed the way its key prints it (`3.2·10⁻¹³`) or as `3.2*10^-13` scored 0, since only `3.2e-13` or the full decimal was read; numeric answers now read powers of ten (`engine.ts`, numeric matcher only, so `exactForm` math tasks are unaffected). No key on the site grades differently (all 221 exams scanned). |
| C6 | Fixed. After the string match, the `math` matcher compares by value (`src/modules/exams/math-value.ts`: numbers, π, roots, powers, functions and equations at 16 sample points). Keys are printed in simplest form. `exactForm` marks parts whose written form is the task (factorise, rationalise, express), where the starting expression is rejected. |
| C7 | Fixed: the swapped-exponent distractor is replaced when the two bases are equal. |
| C8 | Fixed: half-up rounding with exact decimals; keys 8 and 4. |
| H1 | Reworded in all 60 papers to name the condition instead of "… хараа муу". **Needs a Mongolian physics teacher's review.** |
| H2 | Fixed: SAT 02–06 Module 2 has its own 27 lower and 27 higher Reading and Writing items and 22 new lower Math items; the higher route's repeated items were replaced. Changed items have new IDs (`-v2`). |
| H3 | Fixed: numeric distractors put the key at a random rank (Mathematics key ranks 1–5: 221/308/323/247/216; Physics 285/269/317/305/264; Biology seeded per item). The key is the uniquely longest option in 2 of 85 SAT Mock 01 text items, 8–10 of about 75 in SAT 02–06, and 22–29 % of Biology items per year (2024: 38 %, weak cues only). |
| H4 | Fixed by a third session (Claude Code, Claude Opus 5.5). Physics: each Part I question draws from its own pool of versions with new contexts and numbers (at least 20 per question, 60 for most numeric ones), taken in a fixed per-question order of the 60 papers (`tools/generate.py`). Biology: the 33 templates that fill four or more slots follow their own slot counter (`item_k` in `tools/author.py`) with at least as many versions as slots; `vmax` and `enzymegraph` had a fixed prompt and now vary. No choice item (prompt + key) is in more than three papers. Distinct items by prompt + key: Physics 394 → 2,446 of 2,760, Biology 442 → 785 of 1,038 (by this review's prompt + options measure: 444 → 2,617 and 440 → 797). Also fixed on the way: Physics Q44 options had become 8, 16 or 0.67 after the H3 rank change (now always the transition labels 1–5); Q3 drew negative velocity off the canvas; figures now match their prompts (lever, lift, calorimeter, wave, sound-speed graph, numbered transitions, circuit symbols); the key is the uniquely longest option in 5.7 % of Physics text items (was 15.7 %); Biology matching keys use all six orders (before only the three cyclic codes, and 1c, 2b, 3a was never offered). Checks: both pack validators, `node --test tests/mock-fixes.test.mjs tests/entrance-mocks.test.mjs` (new H4 case), `npm run check` (265 unit tests); 2,292 Physics keys re-derived from the printed prompts by an independent script with no mismatch; 46 Physics and 54 Biology keys hand-checked. Physics Part II, by a later session (Claude Code, Claude Opus 5.5): tasks 2.1–2.4 each have 30 scenarios (the five earlier ones and 25 new; one earlier gas scenario moved to p1 = 250 kPa because it shared its prompt with another) taken in the same per-task paper order (`slot` 47–50) instead of at random. Keys are worked in exact fractions, and the generator rejects a scenario that breaks its task's rule (2.1 holds at m1_initial and slides at m1_test, 2.2 one state alone highest, 2.3 a whole coefficient of π, 2.4 energy at least 0.01·π²). Distinct Part II task texts 19 → 120, each in two papers (before: up to 28 of 60); all 240 keys re-derived from the printed text and figures by an independent script; new case in `tests/mock-fixes.test.mjs`. Then, owner-approved: 2.2[a] ("which state has the highest pressure") was 3 in all 60 papers; 1–2 is now a straight line on the diagram (isobaric in ten scenarios) followed by an isochor, so states 1, 2 and 3 are the answer in 20 papers each, and 2.2d is the area under that line (p1(V2−V1) or (p1+p2)(V2−V1)/2, whole joules in 28 of the 30 scenarios); the test now fails on a constant answer. Step 3 of every 2.2 explanation said "2–3 изохор процесс тул p3 = …", which does not follow; it now gives V3 = V2 and reads p3 off the graph (keys, prompts and figures unchanged). Remaining: 21 Biology templates with three slots keep three versions (each in three papers). Physics 2015–2025 descriptions say they follow the 2026 task order with that year's point scale. |
| Medium | Fixed: SymPy syntax, float artifacts (SAT, Mathematics, Physics, Biology, Chemistry), nested English markup, SAT sentence capitals, Biology case endings, weak distractors (factorials, powers, Biology frequencies above 1), unsimplified keys. ЭЕШ English explanations: fixed by a second session (next row). |
| Medium: ЭЕШ English explanations | Fixed by a second session (Claude Code, Claude Opus 5.5, with eight Claude Opus 5.5 writers). Each of the 2,665 items has one or two Mongolian sentences on why its key is right (the rule, collocation or meaning, or the deciding sentence quoted from the passage or transcript), kept in `MockExmps/English/_source/explanations/` and merged by `_source/build.py`; `scripts/build-entrance-mocks.mjs` fails an English item without one. 105 writer explanations hand-checked, all correct. The writers' doubtful keys and wording notes were then all fixed with the owner's approval (list below), results and practice now mark these explanations `lang="mn"`, and `entrance-mocks` and `exam-practice` tests no longer exempt English from their explanation checks. Apart from the listed items, answers, options and every other field are identical to the previous build. New `tests/english-explanations.test.mjs`; `npm run check` passed (268 unit tests). Teacher review pending. |
| Low | Fixed: English labels for four options; Mathematics spacing (180 texts, e.g. "радиусr"); Chemistry "..", one-line statement lists and Q11 counts; IELTS 02–06 TRUE/FALSE/NOT GIVEN explanations now quote or name the deciding paragraph. |

**Checks.** `npm run check` passed (lint, typecheck, 262 unit tests, including the new `tests/mock-fixes.test.mjs`). Each generator
reproduced its committed papers before it was edited; after regeneration, only the intended items changed (keys compared with the
previous build). Not run: production build, browser suites, a look at the pages in a browser, hosted check.

**Caveats.** (1) A published admin edit of an exam (`PublishedContent`) replaces the code definition, so these fixes do not show
for such an exam until the edit is updated or removed. (2) Reports are recomputed with the current engine, so old attempts are
regraded: Biology 2026 Q38 answers that were wrongly accepted now score 0, and natural Mathematics answers that were rejected now
score. (3) Attempts already started keep their definition snapshot.

### ЭЕШ English keys (found while writing the explanations; fixed with the owner's approval)

Each fix leaves exactly one option right, changes no other item, and comes with a rewritten explanation where it needed one:
- 2026 E2 Q31 “to pay / draw / attract ___”: “interest” and “money” fitted all three like the key “attention”; now “a crowd”, “a conclusion”.
- 2026 E2 Q14: the stem said “more carefully”, so the keyed “had been” was ungrammatical; now “If only I ___ more careful yesterday”.
- 2026 E1 Q7 and E3 Q7 (key “will be having”): “have” was natural for a timetabled event; now “had” and “have had”.
- 2025 E3 Q25: “One hundred and three.” also read as a 103 °F fever; now “Quick, call one-oh-three! He's badly hurt.”
- 2024 E2 Q32, and 2023 E2 Q32 of the same kind: the underline now covers the whole command (“Don't beat around the bush”,
  “Don't count your chickens before they hatch”) that the key paraphrases.
- Minor: 2020 E1 Q2 and E2 Q2 “for” → “since”; 2020 E1 Q31 now “I'll look it ___ in the dictionary” (only “up” fits); 2020 E2 Q6
  “cooks / is reading” → “cook / reads”; 2023 E2, E4, E5 Q3 “no one”, “nobody”, “nothing” → “anything”, “somewhere”, “every”;
  2024 E3 2.1e “wide” → “wideness”; 2025 E1 Q33 “polish” → “sweep”; 2018 E3 Q11 “round” → “big” in every option (key “nice, big,
  old, wooden” fits both usual adjective orders); 2026 E5 2.2e “to explore” → “to find out”.
- Wording: the 2019 E3 passage now says “tiny windows” (it later mentions “one of the windows”); 2026 E1 Q23 asks for the
  synonym of “to loan” (key “to lend”) instead of repeating 2.2f's “to purchase”.
- 2019 E4 Q31 keyed the greeting “Nice to meet you.” under a task line, shared by items 28–32, that asks for “the correct question”;
  it is now the answer “Since 2015. Before that, we lived in Darkhan.” with the key “How long have you lived here?” and five questions.

Keys changed text in 2018 E3 Q11, 2026 E1 Q23 and 2019 E4 Q31; attempts already started keep their snapshot.

## Critical: grading gives the wrong result

| # | Where | What happens | Fix |
| --- | --- | --- | --- |
| C1 | `eesh-biology-2026-b1/b2/b3` Q38 (3 pts each) | Options are genotypes that differ only by case (`CcGg`, `ccGg`, `CCGG`…). `isCorrect` lowercases choices, so **every option is graded correct** (confirmed with the engine, timed and practice). | Compare `choice` answers exactly (the response is already validated to be one of the options). |
| C2 | Physics Part II 2.2d, **all 60 papers** (1–2 pts) | Work `A = p1(V2−V1)` is stored rounded to 0.1 kJ (keys 1.0 / 1.2 / 1.7 / 3.3; exact 0.9972 / 1.2465 / 1.662 / 3.324). The prompt asks for no rounding and the tolerance is 0.01 %, so the exact answer is marked wrong. | Store exact values (and the rounded one as an extra accepted answer) or state the rounding in the prompt. |
| C3 | Physics 2.4d, **37 papers** | `E = ½mω²A²` coefficient rounded: key 0.13 (exact 0.128, 21 papers), 0.02 (0.0225, 7), 0.29 (0.288, 9). | As C2 (`fmt()` rounds to 2 decimals in `MockExmps/Physics/tools/generate.py` s24). |
| C4 | Physics 2.1d, **11 papers** (m2 = 15 kg scenario) | Key 1.21; exact 25.5/21 = 1.2143 (also `17/14`) is rejected. Same scenario prints μс = 0.366667 (11/30) and another prints μ = 0.333333. | As C2; give clean givens. |
| C5 | Physics 2.3d, **all 60 papers** | Period `2π·10⁻ⁿ` s must be typed as a decimal: 6.28e-6 (π = 3.14, no calculator) is rejected; ≥4 significant figures are needed, and **7** in the ten 10⁻⁸ papers (2015 P2/P3, 2016 P3, 2017 P4/P5, 2018 P2, 2020 P1, 2022 P2, 2023 P1, 2025 P3). | Ask for the coefficient of π (as Mathematics does) or accept 3-figure values. |
| C6 | Mathematics typed answers: **88 parts, 142 points, 48 papers** | The `math` matcher compares one spelling. Keys are often unsimplified or oddly written, so the natural correct answer is rejected: `6π/6`, `30π/6` (2018 2.1c/d; "π", "5π" rejected), `21√3/3`, `624√3/4`, `1404√3/4` (2021 2.1b/d), `270√11/3`, `3√33/3` (2024 2.2b/f), `2−1√3`, `17−4√18`, `26−5√27` (2015 2.2a), `5/√3` (2018 2.4c), `1+((x−1+1)²+3)/7` (2024 2.1c), `1+(2(x−1)−4)/(x−1−3)` (2026 2.1d, = (3x−10)/(x−4)), `−(x−1)²/2+50` (2025 2.1a), `256/3π` (2025 2.3d, also ambiguous), `36x²−6x³` (2022 2.2b), `(x−1)(x−4)` (2021 2.3a; `(x−4)(x−1)` and `x²−5x+4` rejected), `3+√(x−3)` (2019 2.1a), `60°` (2016 2.4b; "60" rejected), 2018 2.4b. 2017 2.1b/2.4c/d/e keys are SymPy text (`3*r**2/92 + …`, `125*sqrt(2)/6`) and only match if the student types `*`. | Simplify keys at build time; compare expressions by value (evaluate both sides at a few points / numerically) instead of by string. Note: re-grading changes old reports, which are rebuilt from snapshots. |
| C7 | `eesh-math-2015-m4` Q34 (3 pts) | Options A `792·6^5·6^7` (key) and E `792·6^7·6^5` are the same number; E is marked wrong. | Replace the swapped-exponent distractor when the two bases are equal. |
| C8 | `eesh-biology-2026-b1` 2.3c, `eesh-biology-2025-b2` 2.1c | Values exactly on a rounding boundary were rounded by Python floats: χ² = 1.075 keyed 1.07 (school rounding 1.08), D = 0.735 keyed 0.73 (0.74). | Round half up with exact arithmetic; fix the two digits. |

## High: content validity

- **H1 Physics Q39 (eye defects), all 60 papers.** The statement bank uses "Ойрын/Холын хараа муу хүн…" (poor near/far
  vision) as if it meant myopia/hyperopia: "Холын хараа муу хүний нүд дүрсийг торлог бүрхэвчийн ард…" is keyed true. In
  everyday Mongolian poor distance vision is myopia (image in front, concave lens), which inverts the key in all 60 papers;
  in 27 the literally correct pattern is not among the options. Needs a Mongolian physics teacher to confirm; reword with
  "ойрын хараатай (миопи)" / "алсын хараатай" and avoid "… хараа муу".
- **H2 SAT 02–06 repeat Module 1 in Module 2.** `additionalReading()` uses the same 27 Reading & Writing items for every route,
  changing only names: 26 of 27 option sets in Module 2 (lower and higher) are identical to Module 1, so there is no
  adaptive difference in R&W. Math lower repeats 21 of 22 Module 1 templates with new numbers and 3 items verbatim
  (√(2x+1), c^p·c^(p+1), right-triangle legs); higher repeats the triangle item. All five forms share every template
  (PROJECT says cross-form patterns are intentional; within-sitting repetition is not mentioned).
- **H3 Answer-position cues.** "Pick the middle number" wins on numeric options: Mathematics 755 of 1,153 items (65 %,
  669 are five consecutive values a−2…a+2 from the default distractor generator), Physics 887 of 1,440 (62 %; the key is
  never the smallest or largest), Biology 129 of 141 (91 %). "Pick the uniquely longest option" wins 74–80 % of text items
  in all six SAT mocks and 81 % in Biology 2024. Mock 01 SAT distractors are often implausible ("The plants needed no water").
- **H4 Physics item reuse.** The 60 papers hold 444 distinct multiple-choice items out of 2,760; Q2, Q23 and Q44 are identical
  in all 60 and most questions have ≤5 versions. Every year 2015–2025 uses the 2026 skill sequence (Physics README), so the
  year labels do not reflect those years' papers. Biology: 440 distinct of 1,038 (items repeat up to 7 times).

## Medium: visible defects

- Python/SymPy syntax in Mathematics options, shown through KaTeX: `x**3 - 7*x**2 + 7*x + 15` (2021 Q21), `x²−3x+-2`
  (2021 Q23), `sqrt(3)/2 + 1`, `2*sqrt(17)`, `3*x + 6`, `9*a - 81` (2016 Q9, 2017 Q21, 2019 Q9/Q13/Q31, 2022 Q12/Q30/Q36,
  2024 Q26, 2026 Q9/Q36).
- Float artifacts: SAT 02–06 `higher-2` options `4.333333333333333`-style; Mathematics 2025 M2/M4 Q9 `1.3490000000000002×10^7`;
  Physics `1πt`, tables `9000.0`, mixed `500.0 Н` / `150 Н` options; Biology explanations `χ²=1.075000`, Chemistry `1.00e-02`.
- ЭЕШ English 2020 E1–E5: `**<u>it</u>**` renders the literal text "<u>it</u>" in bold (`rich-text.tsx` does not nest).
- SAT 02–06: 18 texts per form start a sentence in lowercase ("a coastal research team examined…", "restoring tidal
  channels was expected…") because context fields are inserted at sentence starts.
- Biology: about 110 hyphenated case endings on ordinary nouns remain (Туулай-ны ×33, Хонь-ны ×33, гахай-ны ×31, Хүн-ны,
  үс-ний, Будаа-ны, Талх-ны, тайга-г, хээр-г, цөл-г, булчирхай-н…), despite the converter's check.
- ЭЕШ English: none of the 2,665 items has an explanation.
- Weak distractors: Mathematics 2019 M3–M5 Q27 (10!, 12!, 14! with ±1/±2: only one option ends in 00) and 2016 M4/M5 Q12
  (2²¹, 9⁷ ± 1/2) also demand long hand arithmetic; Biology frequencies above 1 (1.28, 5.64) and 24 % / 26 % around 25 %.
- Unsimplified choice keys, e.g. Mathematics 2016 M4 Q36 `8208√3/9` (= 912√3).

## Low

English 2025 Q45–46 carry labels A–E for four options; Mathematics 2025 Q31 explanation "радиусr"; Chemistry 2026 2.1f "..";
double spaces in Chemistry statement lists; Chemistry 2025 C1 Q11 explanation lists the atom counts out of option order;
IELTS 02–06 TRUE/FALSE/NOT GIVEN explanations are generic boilerplate.

## Checked and found correct

- All 221 site mocks load; every choice key is one of its options; numeric keys parse; no missing figure files; no reused IDs;
  the 57 existing mock unit tests pass.
- IELTS 01–12: every completion key and every quoted "Evidence" line was found in its passage or transcript (960 questions);
  14 TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN items checked by hand.
- Hand-checked keys: all 120 HSK items (script, picture and key), 22 JLPT, 14 Mathematics, 16 Physics (only Q39 wrong),
  16 Chemistry plus two Part II tasks, 16 Biology, 18 English, 28 SAT Mock 01; every SAT 02–06 template read in full.
- Offline free mocks: clean on the same checks, with no middle-value or position bias.

## Not covered

Per-item solving of every key (about 12,000 items; the sample above plus the automated checks and generator reading);
audio; visual correctness of diagrams beyond their text labels; difficulty calibration; admin edits in the hosted database.
