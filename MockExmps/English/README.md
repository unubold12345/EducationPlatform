# ЭЕШ English mocks

Forty practice mocks for the ЭЕШ / ЭШ English test, five per official year (2018, 2019, 2020, 2022, 2023, 2024,
2025, 2026), plus one official variant of each year for comparison (Variant A, except 2023 D and 2025 B). Written by
Claude Code (Opus 5.5) on 2026-11-06. The website does not read this folder: `scripts/build-entrance-mocks.mjs english`
copies the mock JSON into `assets/entrance-mocks/english/`, which the site serves.

## Which official years exist

| Year | Official БҮТ source | In this folder |
| --- | --- | --- |
| 2018–2020 | Already in `reference/official-papers/english/` (A–D, with keys) | Variant A pages + key, 5 mocks each |
| 2021 | No official English paper found on eec.mn or its archive; only an unofficial user upload | nothing |
| 2022 | [eec.mn/post/2213, archived](https://web.archive.org/web/20230321152409/https://eec.mn/post/2213) (A–D, no key) | Variant A PDF + page images, 5 mocks |
| 2023 | [eec.mn/post/4722, archived](https://web.archive.org/web/20231203225354/https://eec.mn/post/4722) (A–D, no key) | Variant D page screenshots (8) from a [Scribd upload](https://www.scribd.com/document/773959743/); the uploader highlighted answers 28 and 29 on page 3; 5 mocks |
| 2024 | [eec.mn/post/5309, archived](https://web.archive.org/web/20241206011054/https://eec.mn/post/5309) (A–D + official key) | Variant A page screenshots (8) from a [Scribd upload](https://www.scribd.com/document/811066486/); uploader marks on pages 6 and 8. The key upload was deleted from Scribd; 5 mocks |
| 2025 | [eec.mn/post/6273, archived](https://web.archive.org/web/20260112160335/https://www.eec.mn/post/6273) (A–D, no key) | Variant B PDF + page images (A was never archived), 5 mocks |
| 2026 | [eec.mn/materials](https://www.eec.mn/materials), tab "Элсэлтийн шалгалт 2026" (A–D, no key) | Variant A PDF + page images, 5 mocks |

eec.mn was rebuilt in 2026 and its old 2022–2025 files now return 404. The 2022 and 2025 B–D PDFs were saved from
the Internet Archive through the in-app browser (2025 C and D are in the owner's Downloads folder). The archive
holds no copy of any 2023 or 2024 English PDF, nor of 2025 A. For 2023 D and 2024 A, the pages were captured as
screenshots from user uploads on Scribd, which display them without signing in; they are not official БҮТ files.

## Layout

```
MockExmps/English/
  2018/  mock-1.json … mock-5.json   reference-variant-A/  (pages/1-6.jpg, key/*.jpg, official-key.json)
  2019/  mock-1.json … mock-5.json   reference-variant-A/  (pages/1-6.jpg, key/*.jpg, official-key.json)
  2020/  mock-1.json … mock-5.json   reference-variant-A/  (pages/1-8.jpg, key/*.jpg, official-key.json)
  2022/  mock-1.json … mock-5.json   reference-variant-A/  (official-2022-A.pdf, pages/1-8.jpg; no key published)
  2023/  mock-1.json … mock-5.json   reference-variant-D/  (pages/1-8.png, Scribd screenshots)
  2024/  mock-1.json … mock-5.json   reference-variant-A/  (pages/1-8.png, Scribd screenshots)
  2025/  mock-1.json … mock-5.json   reference-variant-B/  (official-2025-B.pdf, pages/1-7.jpg; no key published)
  2026/  mock-1.json … mock-5.json   reference-variant-A/  (official-2026-A.pdf, pages/1-8.jpg; no key published)
  _source/  build.py + data_<year>.py, which generate and validate every mock JSON
```

`official-key.json` is Variant A's key, copied from `reference/official-papers/english/keys.json`. The key images
cover all four variants of that year.

## How each mock matches its year

Each mock copies its year's reference variant (the folder named in `referenceVariant`) exactly in sections,
task types, item count, points, timing and option count. Only the content changes (new sentences, conversations, passages, topics), at the same level, the way
БҮТ writes Variants A–D. No question, passage or option was copied or reworded from the official paper.

| | 2018 (80 min, 100 pts) | 2019 (80 min, 100 pts) | 2020 (80 min, 100 pts) |
| --- | --- | --- | --- |
| Grammar | 1–12 gaps ×1 | 1–12 gaps ×1 | 1–12 gaps ×1; 13–16 ×2; 17–19 error spotting ×2 |
| Vocabulary | 13–22 words ×2; 23–25 word in dialogue ×2; 26–27 antonym prefix ×2 | 13–18 words ×2; 19–21 synonym ×2; 22–25 phrasal particle ×2; 26–27 job definition ×2 | 20–28 words ×2; 29–32 phrasal particle ×2; 33–35 idioms ×2 |
| Communication | Conversation 1: blanks 28–29 + place 30; Conversation 2: feelings 31–32 (×2) | 28–32 pick the question for the answer ×2 | One conversation: 36–37 questions, 38–40 blanks ×2 |
| Reading | Passage 33–36 (main idea, detail, reference, synonym); e-mail with blanks 37–39 + 40 (×2) | One titled article, 33–40 ×2 | Advice text with bullets, 41–46 ×2 |
| Part II | 2.1 complete questions, 2.2 fill gaps, 2.3 sentence endings, 2.4 match jobs/places/etc.; 5 × 1 each, 7 options | 2.1 endings, 2.2 replies, 2.3 adjectives in a text, 2.4 report-based endings; 5 × 1 each, 6 options | 2.1 linking words, 2.2 definitions, 2.3 situations to suggestions, 2.4 conversation gaps; 5 × 1 each, 7 options |
| Listening | 41–46 ×2, an interview | 41–46 ×2, a radio dialogue | none (the 2020 paper has none) |

2026 (Элсэлтийн шалгалт; the paper prints no duration) uses a new layout. Part I has 47 items for 80 points:
- Grammar: 1–6 ×1; 7–13 ×2 (tenses, reported speech, verb patterns, adjective order); 14–16 ×2; 17–18 error spotting ×3.
- Vocabulary: 19–27 ×1; 28–29 phrasal-verb meaning ×2; 30–31 collocation ×2; 32–33 idiom/situation ×3.
- Communication: 34–36 polite request or inference ×2; 37–38 meaning of an expression ×2.
- Reading: 39–44 ×1 on one titled passage; 45–47 summary cloze ×3 from a shared five-word bank (two extra).

Part II has three tasks for 20 points: 2.1 a word-form cloze (6 gaps, five forms each); 2.2 four definitions and
four synonyms (one extra each); 2.3 a gap passage (6 gaps, five options each).

2022–2025 also have 47 items / 80 points in Part I and three Part II tasks / 20 points. None of these papers prints a
duration, so `durationMinutes` is null.

2022 (Variant A):
- Grammar: 1–4 ×1; 5–15 ×2 (conditionals, used to, wish, tenses, passive, reported speech, causative, as…as, purpose);
  16–17 error spotting ×2.
- Vocabulary: 18–27 ×1; 28–30 phrasal particles ×2; 31–33 idiom meaning ×2.
- Communication: 34–36 short replies ×2; 37–38 implied meaning ×2.
- Reading: 39–44 ×2 on a five-paragraph passage (detail, role of a quotation, method, word meaning, inference,
  reference); 45–47 ×2, a short notice with three gaps, each with its own options.
- Part II: 2.1 six sentence halves (eight endings); 2.2 six words to definitions (eight); 2.3 an eight-gap word-form
  cloze.

2023 (Variant D, from Scribd screenshots):
- Grammar: 1–13 ×1; 14–16 error spotting ×3; 17–18 phrasal particles ×3. The paper heads 17–18 "3x2=6 points" over
  two items, so its printed item points add up to 78. The mocks keep the section's 6 points as 2 × 3 so each paper
  totals 100.
- Vocabulary: 19–25 ×1; 26–27 naming the speaker's reaction ×1; 28–29 collocation forks ×3; 30 study-skills comment ×3;
  31 most likely solution to a problem ×3; 32–33 idiom meaning ×3.
- Communication: 34–35 missing word ×1; 36 most polite form ×2; 37 phrase to replace a word ×3; 38 three-speaker
  inference ×3.
- Reading: 39–42 ×1 and 43–44 ×3 on a six-paragraph passage; 45–46 game definitions ×1; 47 what you would say in a
  game ×3.
- Part II: 2.1 a six-gap word-form cloze; 2.2 eight words matched to eight sentences with an underlined synonym; 2.3 a
  six-gap passage.

2024 (Variant A, from Scribd screenshots):
- Grammar: 1–6 ×1; 7–13 ×2; 14–16 replies chosen from a shared five-item bank (two extra) ×2; 17–18 key-word
  transformations ×3.
- Vocabulary: 19–22 ×1; 23–25 one word with three meanings that fits all three gaps (shared bank) ×1; 26–27 situations
  ×1; 28–29 prefix and suffix forks ×2; 30–31 prepositions ×2; 32–33 idiom meaning ×3.
- Communication: 34–36 ×2 on a conversation in three parts; 37–38 phrasal verbs in short dialogues ×2.
- Reading: 39–44 ×1 on a titled article; 45–47 ×3, a summary cloze from a five-item bank of linking words (two extra).
- Part II: 2.1 a six-gap word-form cloze; 2.2 eight words from the 2.1 passage matched to ten definitions numbered 1–9
  and 0; 2.3 synonyms of six bold words in a short passage.

2025 (Variant B):
- Grammar: 1–9 ×1; 10–13 ×2; 14–16 error spotting ×3.
- Vocabulary: 17–25 ×1; 26–30 a story with a five-verb bank, each verb used once ×2; 31–33 phrasal-verb meaning and
  particles ×3.
- Communication: 34–36 where/who inferences ×2; 37–38 meaning ×3.
- Reading: 39–44 ×1 on an untitled passage; 45–46 ×3, two gaps filled from a four-item bank (A–D, two extra), as on the
  official paper; 47 an inference from one statement ×2.
- Part II: 2.1 a six-gap word-form cloze; 2.2 four synonyms of bold words and four antonyms of underlined words, five
  options each; 2.3 a six-gap text with a six-word box (every word used once).

## JSON format

- `year` names the official year the mock is modelled on; `referenceVariant` points at the folder to compare with.
- `parts → sections → tasks → questions`: each question has `number`, `stem` (empty for numbered blanks in a text),
  `options` A–E, `answer` and `points`. Part II tasks have `items` a–e, numbered `choices`, `answer` (a→number)
  and `answerDigits`, the same five-digit form the official keys use (for example `"35241"`).
- `answerKey` repeats every answer in one place: question letters (`"1"`–`"46"`, or `"47"` for 2022–2026), then Part II
  digit strings, one digit per item a, b, c … In 2024 `2.2`, the tenth definition is numbered 0, as on the paper.
- Part II matching tasks have `items` (a–h, or only labels for gaps in a `text`), numbered `choices`, `answer` and
  `answerDigits`. Gap tasks with their own options per gap use `gaps` (2026 2.1/2.3 and the 2022–2025 clozes); 2025 2.2
  uses `groups` of sentences, each with its own five `choices`.
- Shared banks are printed once as `wordBank` (A–E, or A–D for 2025 items 45–46); those questions have an empty stem and
  the bank as their options.
- Text markup: `**word**` is bold, `<u>word</u>` is underlined, `*words*` is italic. In error-spotting items (2020,
  2022–2026) the underlined parts are written `[A …] [B …]`, and the options are those parts.
- Listening (2018, 2019): no audio is included. `audioScript` is the full transcript, to be read aloud twice or
  turned into audio.
- Correct letters are spread evenly (6–12 per letter per mock). Error-spotting and shared-bank items keep their printed
  option order, because their letters are fixed in the sentence or word bank.
- Every question, Part II item and gap has an `explanation`: one or two Mongolian sentences on why the key is right,
  quoting the English as “…” and never naming an option letter (letters are reassigned when an item changes). The
  text is kept in `_source/explanations/<year>-mock-<n>.json`, keyed by item number (`"17"`) or task and label
  (`"2.1a"`), and merged in by `build.py` (added 2026-11-13).

## Editing

Edit `_source/data_<year>.py` (items) or `_source/explanations/` (explanations; rewrite an item's explanation when you
change the item), then run `python -I MockExmps/English/_source/build.py .` from the repository root (add years, for
example `. 2024 2025`, to rebuild only those), then `node scripts/build-entrance-mocks.mjs english` for the site copy.
`build.py` rewrites the 40 files and refuses to write if numbering, distinct options, answer letters, `[A …]` markers,
Part II answers, the 100-point total or an item's explanation (missing, or a key for no item) are wrong.

## Notes

- The answers and explanations were prepared by Claude and have not had teacher review yet; read them before students
  use them.
- Reading passages in 2022–2025 are generic stories or summaries of well-documented events (the 2019 lost-wallet
  study, Hachikō, the Mars Climate Orbiter, the 1957 spaghetti hoax, Apollo 13 and others); check figures before reuse.
- 2019's `official-key.json` gives the listening items 0 marks because that is how `keys.json` recorded them; the
  printed 2019 booklet says listening is 6 × 2 = 12 points, and the mocks follow the booklet.
- The official page images carry a БҮТ notice that prohibits copying and distribution. Keep them only for this
  comparison, and keep the repository private while they are here.
