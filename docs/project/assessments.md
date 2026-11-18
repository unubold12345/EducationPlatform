# Assessments: SAT, IELTS, JLPT, HSK, TOPIK, ЭЕШ and free mocks

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 3). "Section N" in the text means that old numbering; the guide maps it to files.

### Digital SAT

- Mocks `sat-full-01` through `sat-full-09` are separately purchasable or picked with the Гадаад хэл plan
  (a retired SAT plan includes every SAT mock until it ends). Mocks 02–09 use original parallel practice forms with different contexts and
  numerical values, and separate first/lower/higher question banks (147 authored items per form,
  98 delivered per sitting). Shared question patterns are intentional; these are not calibrated
  College Board forms or independent official papers. Mock 01 and existing snapshots are preserved. Mocks 07–09
  (2026-11-14) add three context rows (urban heat, sport, waste) to `sat-additional.ts`; Math is the same parametric generator.
- 98 delivered questions: 54 Reading and Writing in two 32-minute modules, a 10-minute break, then
  44 Math in two 35-minute modules.
- Operational raw counts are 50 Reading/Writing and 40 Math. Routing assumes 65% accuracy; each
  module includes two pretest questions.
- Math includes multiple-choice and numerical-response items.
- Results are raw scores. There is no 200–800 scaled score.

### IELTS Academic

- Mocks `ielts-academic-01` through `ielts-academic-12` are separately purchasable or picked with the Гадаад хэл
  plan (a retired IELTS plan includes all twelve until it ends). Mocks 07–12 (2026-11-10) are described at the end of this section.
- Mocks 01–06: the 2026-11-09 revision strengthens all six forms: plausible Listening/Reading distractors,
  passage-specific paragraph matching, richer Writing data and a process diagram in Mock 05. Mocks 02–06 use authored
  connected scripts, with longer academic sections, rather than answer-announcing templates. Their three distinct Reading
  passages total about 2,200 words per form; each has a distinct essay, cue card and linked discussion.
  Full review and limits: [IELTS_MOCK_REVIEW.md](../IELTS_MOCK_REVIEW.md). Teacher review and learner calibration remain pending.
- Listening: 40 questions in about 30 minutes, plus 2 minutes checking, using four bundled synthetic
  recordings.
- Reading: 40 questions over three passages (2,265 words) in 60 minutes.
- Writing: two tasks in 60 minutes.
- Speaking: a 12-minute simulation in four timed stages (Part 1, the preparation minute, the long turn, Part 3). The whole
  stage is recorded and stored for review. Where the Speaking Lab is enabled the student can take it with the AI examiner
  ("AI examiner in the IELTS mocks" in section 7); otherwise the prompts are read from the screen as before.
- Bands (2026-11-18): Writing and Speaking are graded by AI after the sitting (see "AI grading of Writing and Speaking"
  below); Listening and Reading raw /40 convert by the published Academic tables, and the overall band is their mean with
  IELTS rounding. Shorter (free half) mocks show raw Listening/Reading and no overall band. Practice estimates only.
- Authenticated audio serving resolves the exact mock slug to its own allowlisted recording files.
  Original and revised recordings are included in the production function trace. New audio provenance, script
  hashes, file hashes and durations live in `assets/exams/manifest.json`, `manifest-02.json` through
  `manifest-06.json`, and `manifest-v2-02.json` through `manifest-v2-06.json`. `scripts/generate-ielts-audio.py` (setup in its header) regenerates the revised 02–06 set with local
  Kokoro-82M neural voices (Apache-2.0) at one natural pace. Revised Parts 1–3 have 30-second reading/checking pauses;
  Part 4 has a one-minute preview and a continuous lecture. The generator also updates the answer-free
  `ielts-audio-v2.json` timing catalogue. `audioRevision` in each attempt snapshot selects the matching files and timing;
  missing revision means legacy audio, independently of the publishing version. Never overwrite a released recording set.
  Parts play back to back; the 30-minute stage leaves checking time after the last part.
- Mocks 07–12 (2026-11-10): Codex's offline pack `MockExmps/IELTS` (kept local, not committed) is converted by
  `node scripts/build-ielts-mocks.mjs` into `src/modules/exams/ielts-forms.json` (server-side, with keys and the
  four Listening scripts per form), `ielts-forms-audio.json` (answer-free file prefixes and part lengths),
  `public/ielts-mocks/mock-XX-writing-1.svg` and the two Listening plans (Mocks 07 and 10, drawn from the pack's
  fixed-width plans). Each form reuses the revised Mock 02 stages and timing. Question types: note completion,
  A–C/A–D choice, plan and bank matching, paragraph matching, headings (Roman-numeral labels), TRUE/FALSE/NOT GIVEN
  and YES/NO/NOT GIVEN; Speaking has nine Part 1 prompts, a cue card with two rounding-off questions and six
  Part 3 prompts. Completion keys also accept 6.30 for 6:30 and October 19 / 19th October for 19 October; the word
  limit counts the number that "AND/OR A NUMBER" allows.
- Mocks 07–12 audio: the pack's 80 kbps Kokoro recordings are re-encoded to 48 kbps mono in their own folder
  (`assets/ielts-forms/ielts-07-part-1.mp3` … `ielts-12-part-4.mp3`, 55 MB; hashes and durations in
  `assets/ielts-forms/manifest.json`).
- Audio functions: a Vercel function must stay under 250 MB, and the build bundles into a route every file its code
  can read, so one shared reader of `assets/exams` once put all 93 recordings (236 MB) into every audio route.
  Each folder now has its own reader and route: `/audio` reads `assets/exams` through `audio-response.ts`
  (IELTS 01–06 and JLPT, 180 MB bundle) and `/audio/forms` reads `assets/ielts-forms` through
  `audio-response-forms.ts` (IELTS 07–12, 77 MB), `/audio/hsk` reads `assets/hsk-audio` (HSK 1, 12 MB), `/audio/jlpt` reads `assets/jlpt-audio` (JLPT audio revision 2, 28 MB), `/audio/free` reads `assets/free-audio`
  (the free mocks, 12 MB), for both `/api/mock-attempts/<id>/…` and `/api/exam-practice/<slug>/…`. `audio-handlers.ts` holds the shared checks and reads no files;
  `audioPath()` in `audio-files.ts` picks the route, and each route refuses the other folder's mocks.
  `next.config.ts` lists only the `/audio/forms` folder: tracing keys match anywhere in a route path, so an `/audio`
  key would also feed `/audio/forms`. Give any new recording set its own folder, reader and route segment, and
  check the bundle sizes in `.next/server/app/api/**/route.js.nft.json` after a build. There is one recording set per form,
  so `audioRevision` is unset. Scripts stay out of the definition (and so out of attempt snapshots); practice
  mode reads them by part after a check. Teacher review and learner calibration remain pending.

### JLPT N5 and N4

- `/exams/jlpt?level=N5|N4` lists three forms per level, purchased access, saved practice progress and open attempts.
- `jlpt-n5-01`–`03`: 21 vocabulary / 20 min, 22 grammar-reading / 40 min, 24 listening / 30 min.
  `jlpt-n4-01`–`03`: 28 / 25 min, 29 / 55 min, 28 / 35 min. Server deadlines and attempt snapshots use the existing exam engine.
- `scripts/build-jlpt-mocks.mjs` converts offline `MockExmps/JLPT` source into six private `assets/jlpt` definitions and an answer-free catalogue. Authoring packs and official format reference images stay excluded from deployment.
- Audio revision 1: `scripts/generate-jlpt-audio.py` uses local Kokoro-82M Japanese voices (Apache-2.0) and Misaki Japanese G2P. The 24 MP3s in `assets/exams/jlpt-*-part-*.mp3` have script/file hashes, measured durations and per-item timings; protected mock/practice audio routes apply the existing access and active-sitting checks.
- Audio revision 2 (2026-11-16, current): only the narrator changes (owner decision). `scripts/generate-jlpt-audio-v2.py`
  (setup in its header) reads instructions, item numbers, questions and spoken choices with VoxCPM2 (openbmb/VoxCPM2,
  Apache-2.0) run locally through the VoiceStudio desktop app's engine install: one cloned warm male voice (reference clip
  in `assets/jlpt-audio/voices/`), N5 lines slowed to 0.92. The woman and man are revision 1's exact Kokoro takes, read
  from its utterance cache; every line is levelled to one loudness. Track layout and pauses match revision 1.
  Speech-only kana fix narrator readings the voice gets wrong (numbers before 番 and answer numbers, 何です/何を/何時,
  名札, 申込書, furigana including okurigana); per-line seed overrides and extra readings live in
  `scripts/jlpt-audio-v2-lines.json`. Files: `assets/jlpt-audio/<slug>-part-N.mp3`
  (48 kbps mono), `<slug>-audio.json` manifests and `src/modules/exams/jlpt/audio-catalog-v2.json` timings, served by
  `/audio/jlpt`. JLPT definitions carry `audioRevision: 2`, so new sittings and practice use revision 2; an attempt
  snapshot without it keeps the Kokoro files in `assets/exams`. Every narrator line was transcribed with Whisper large-v3
  and compared in kana; nobody has listened to it all yet.
- Timed listening follows the server clock, with no pause/replay; practice can replay one item and reveals its transcript only after checking. Written questions keep shared passages together, use numbered options and support optional authored furigana. Result skill links open focused practice.
- Per-mock access uses the existing simulated ₮10,000 purchase, or a Гадаад хэл pick (2026-11-13). Raw scores only; no 180-point conversion or pass/fail claim.
- All questions are original drafts awaiting Japanese-teacher review. Situational text replaces illustrations. Synthetic tracks are shorter than the official listening window; remaining time is answer checking. Native-speaker listening review and learner calibration remain pending.

### HSK 1 (2026-11-11)

- The owner asked for the offline HSK pack on the site. `hsk1-mock-01`–`03` (program `hsk`) follow the current regular HSK 1 (2.0)
  paper: Listening 20 items in 15 minutes, then Reading 20 items in 17 minutes (32 minutes; the paper's 5 minutes of personal
  information and 3 minutes of answer transfer are not needed on screen). Eight five-item parts: picture √/×, three-picture choice,
  dialogue to one of six pictures, short question with three printed answers; word–picture √/×, sentence to one of six pictures,
  question to one of six answers, word into a gap. Every printed Chinese line carries the pack's pinyin (a Pinyin toggle hides it);
  each part opens with the paper's worked example. Hub `/exams/hsk`; `/exams` has an HSK card.
- Build: `node scripts/build-hsk-mocks.mjs` converts `MockExmps/HSK` (never deployed) into `assets/hsk/<slug>.json` (server-side,
  with keys and listening scripts), `public/exam-assets/hsk/` (118 answer-free, text-free SVG pictures) and the client-safe
  `src/modules/exams/hsk/catalog.json`. Display data sits in `question.hsk` / `group.hsk` (pictures, pinyin lines, choices,
  example) and the single pictures in `figure`; `pictures` is an immutable content field, so admin edits can fix text and pinyin
  but not media. Answers are the labels (√/×, A–F).
- Audio: the pack has none (it is reader-administered), so `scripts/generate-hsk-audio.py` (setup in its header) synthesises it
  locally with Kokoro-82M v1.0 Mandarin voices (narrator `zm_yunxia`, woman `zf_xiaoyi`, man `zm_yunxi`, speed 0.9), from the
  pack's authored pinyin rather than automatic conversion (neutral tones, 一/不 as printed; third-tone runs changed). Each item is
  read twice (5 s, then 10 s), with each part's instruction and example; about 11 minutes per mock, the rest of the 15 minutes is
  checking time. Four tracks per mock, 48 kbps mono, 12 MB in `assets/hsk-audio` with hashes and per-item timings
  (`src/modules/exams/hsk/audio-catalog.json`, used for practice replay). Voices were chosen by a Whisper-small round trip
  (2026-11-11): over the 60 scored items 0.97 mean toneless and 0.96 toned pinyin match; the weakest are 2–3-syllable phrases
  (喝水 heard as 河水). No person has listened to them.
- Own audio route segment `/audio/hsk` (`audio-response-hsk.ts`, both `/api/mock-attempts/<id>/…` and `/api/exam-practice/<slug>/…`),
  with the usual rule: in a sitting only the part playing now. Results: raw correct (40) and the paper's practice conversion
  (correct × 5 per section, 200 in all; 120 is the usual pass mark), stated as not an official or equated score. Access is the ₮10,000 per-mock purchase or a Гадаад хэл pick (2026-11-13). Practice mode, the practice assistant and the review coach (`hsk` chat subject) get
  pictures as their descriptions (`hsk/describe.ts`). Tests: `tests/hsk.test.mjs`, browser group `hsk` (`tests/hsk_smoke.py`).
- All items, pictures and keys are DeepSeek Harness drafts (2026-11-10) awaiting a Chinese teacher's review; not HSK 3.0.

### HSK 2 (2026-11-16)

- The owner asked for three HSK 2 mocks. `hsk2-mock-01`–`03` (program `hsk`) follow the regular HSK 2 (2.0) paper: Listening 35
  items in 25 minutes, then Reading 25 items in 22 (47 minutes on screen). Ten groups keep the paper's numbering: `hsk-l-1`
  (sentence and picture, √/×, 10), `hsk-l-2a`/`2b` (dialogue to a picture; six pictures with one used by the example, then five),
  `hsk-l-3` (two-turn dialogue, question, three printed answers, 10), `hsk-l-4` (four-turn dialogue, 5); `hsk-r-1` (sentence to a
  picture), `hsk-r-2` (word into a gap), `hsk-r-3` (a text and a ★ statement, √/×), `hsk-r-4a`/`4b` (sentence to its matching
  sentence; six with one in the example, then five).
- Authoring pack `MockExmps/HSK2` (never deployed; in `.vercelignore`): `_source/content.py` (items, keys, pinyin, explanations),
  `_source/scenes2.py` (35 new drawings on the HSK 1 primitives) and `_source/build.py`, which checks counts, keys, that every
  set entry is used once, and that every sentence stays inside the 300-word HSK 1–2 list plus a short documented list of extras
  (plural pronouns, split verbs such as 游, 天, 分, 杯), then writes `mock.json` and the pictures. No PDFs or printable booklets.
- The same `scripts/build-hsk-mocks.mjs` converts both levels (HSK 1 output is unchanged). An HSK 2 group carries
  `hsk.layout`, the HSK 1 page type it is drawn as (`J` is the text-only √/× part), so `hskPart(groupId, group)` and the views
  need no level switch; `question.hsk.statement` holds the ★ statement. The catalogue has `level`; `hskLevel(slug)` reads it from
  the slug. 200 pictures are served (`hsk2-mock-0N/`, `hsk2-examples/`).
- Audio: `scripts/generate-hsk2-audio.py` loads the HSK 1 generator for synthesis (same model, voices, pinyin-driven speech) and
  merges its timings into the shared `audio-catalog.json`; the HSK 1 script keeps other levels' entries. Every item is read twice
  (3 s, then 8 s in Parts 1–2 and 10 s in Parts 3–4); about 22 minutes per mock, four tracks, 23 MB more in `assets/hsk-audio`
  (35 MB in all, same `/audio/hsk` route). In a sitting the page follows the item being read (`hskPlayingItem`), so Part 2 turns
  from its first picture set to its second. No Whisper round trip and no human listening has been done for these tracks.
- Results use the same conversion: each section out of 100 (a correct answer is 2.86 in Listening, 4 in Reading), 200 in all.
- All items, pictures and keys are Claude Code (Fable 5.2) drafts awaiting a Chinese teacher's review. Tests: the
  HSK 2 cases in `tests/hsk.test.mjs` and the HSK 2 section of `tests/hsk_smoke.py` (practice, a full sitting, results).

### ЭЕШ mocks (the ЭЕШ plan; called University Prep before 2026-11-13)

- 194 imported papers live on the site, all with program `entrance`:
  - `eesh-math-<year>-m1`–`m5`: 55 Mathematics forms for 2015–2026 (2020 excluded).
  - `eesh-physics-<year>-p1`–`p5`: 60 Physics forms for 2015–2026.
  - `eesh-chemistry-<year>-c1`–`c3`: 18 Chemistry forms for 2020–2023, 2025 and 2026 (no 2024 reference was found).
    40 A–E items (68 points) and four Part II tasks of eight one-digit cells (32 points); 100 minutes.
    2020–2023 Part II tasks are provisional (no official Part II source); the task says so.
  - `eesh-biology-<year>-b1`–`b3`: 21 Biology forms for 2020–2026. 50 A–E items (46 in 2026, 76 points) and four
    Part II tasks with numeric or choice-number answers (24 points); 80 minutes. 2020, 2021 and 2023 Part II tasks
    are provisional.
  - `eesh-english-<year>-e1`–`e5`: 40 English forms for 2018–2020 and 2022–2026.
- Source and build: the offline authoring packs stay in `MockExmps/` (never served or deployed).
  `node scripts/build-entrance-mocks.mjs` converts them into `assets/entrance-mocks/<subject>/<slug>.json`
  (server-side content with answers) and `public/exam-assets/eesh/<subject>/<slug>/*.svg` (2825 diagrams).
  It also writes the client-safe catalogue in `src/modules/exams/entrance/catalog.json` and
  `catalog-data.ts`. `next.config.ts` traces the content JSON for every server route. Rerun it after editing
  `MockExmps`, naming the subjects you changed (`node scripts/build-entrance-mocks.mjs biology chemistry`): the
  committed Mathematics/Physics output differs from what the script now produces from `MockExmps` (diagram sizes
  were adjusted after generation), so a full rebuild rewrites those 115 papers. The catalogue is always rebuilt from
  every pack. Chemistry/Biology figures are the packs' own SVG files; an explanation shorter than 12 characters
  is shown after its answer ("H₂SO₄: +6."). Biology's generic "№ / Бүтэц / жишээ" tables are left out when every
  word in them is already in the question or its options (360 items); every other figure is shown. The Biology
  generator also hyphenated case endings onto ordinary nouns ("Шош-ийн"); the converter spells the 63 reviewed
  forms out ("Шошны", "үндсэнд", …) and fails the build on any new one. Hyphens after abbreviations, units and
  numbers (ДНХ-ийн, 3 мин-д, 20 °С-д) are correct Mongolian and stay.
- Results (all ЭЕШ papers, fixed 2026-11-10): each skill row counts only its own questions; a precedence slip had
  made every row show the whole paper. The header separates wrong from blank answers, and the review list opens on
  the wrong answers, or on the blanks when nothing was answered wrongly.
- Chemistry and Biology prompts are Mongolian prose with Unicode formulas, so they render as text (no KaTeX) with
  the scratchpad; the AI assistant and Workspace chat have `eesh-chemistry` and `eesh-biology` subjects.
- `src/modules/exams/entrance/content.ts` loads a paper on demand (one `readFileSync`, cached).
  `findExam()` resolves it lazily; SAT/IELTS definitions stay in memory. `getExam()` still applies
  published content versions and admin edits.
- Format: Mathematics has 36 A–E questions plus four multi-part constructed tasks; Physics has 46 A–E
  questions plus four constructed tasks; English has Part I (grammar, vocabulary, communication,
  reading) plus Part II matching/cloze tasks. Each paper is 100 points. Mathematics and Physics are
  100 minutes and have no calculator; English follows the 80-minute house timing (the 2022–2026 papers
  print no duration). Physics uses g = 10 m/s².
- Marks: each question carries its printed points. Mathematics task points (7 each) are split over
  their parts with integer largest-remainder weights. Typed Mathematics answers accept Unicode or
  ASCII signs, comma or semicolon intervals, equivalent fractions/decimals and scientific notation;
  symbolic expressions are compared after normalisation. Physics constructed answers are numeric
  where possible, with a text matcher for the one direction answer.
- Presentation: the ЭЕШ sitting is the compact `entrance/session.tsx` workspace, not the retired paper
  booklet. It has one page per multiple-choice item, one page per constructed task or Part II task,
  a slide-over answer sheet grouped by printed section, a per-question flag, a collapsible scratchpad
  for Mathematics and Physics, and a side passage pane for English reading. Stored SVG diagrams render
  as images, so their internal styles never leak into the page. KaTeX typesets short pure formulas and
  all Mathematics options; longer Mongolian prose stays as text.
- English listening: the 2018 and 2019 writing packs include a script but no recording. Those papers
  show the script as a labelled text panel (“бичлэг оруулаагүй”). No fabricated audio is served.
- Results: 100-point total, per-domain points and correct counts, a wrong/blank/correct filter and a
  review that repeats the shared task text, figure, reading or listening material. Review answers and
  explanations come from the paper snapshot, never from current definitions.
- Access is ₮10,000 per paper or the ЭЕШ plan; the server checks it on start, read, save,
  check, audio and AI paths. Practice mode, the admin question fixer and versioned publishing work.
- `tests/entrance-mocks.test.mjs` checks all 194 papers: 5 forms per year (3 for Chemistry/Biology), unique IDs, five options,
  answer membership, answer spread, 100-point totals, diagram files, typed-answer equivalence and a
  full 100-mark report. `tests/entrance_mocks_smoke.py` covers the hub, access, a bought Mathematics
  paper, the ЭЕШ plan, the reading/Part II layouts and mobile widths.
- Provenance: 2015–2021 Mathematics/Physics references are official or clearly labelled annotated
  editions; 2022–2026 Mathematics and English references are third-party copies/transcriptions,
  not official БҮТ files. Every paper says it is practice content, and explanations are the site's own.
  Teacher review and student-based difficulty calibration remain pending.

### Free half-length mocks (2026-11-13)

- The owner asked for the offline free pack (`MockExmps/Free`, prepared 2026-11-12) on the site. Ten mocks, about half a full mock
  each: `eesh-{math,physics,chemistry,biology,english}-free` (50 points; 50/50/50/40/40 minutes), `sat-free` (one module of each
  section, no break or routing, 67 minutes), `ielts-academic-free` (Listening Parts 1–2, Reading Passages 1–2, Writing Task 1, Speaking
  Parts 1–2; 84 minutes), `jlpt-n5-free` (45 minutes), `jlpt-n4-free` (58) and `hsk1-free` (10 + 10 items, 17 minutes).
- Access: every signed-in, verified account, with retakes and practice, no plan or purchase; never sold (`createMockOrder` refuses them),
  never picked, and not counted in the paid mock totals or collections (`findExam` resolves them by slug only).
- Review before release (2026-11-13, owner request): two Claude Opus 5.5 subagents re-derived every key and found none wrong; they fixed
  four ambiguous ЭЕШ English items, an ambiguous Biology sub-question, SAT/IELTS/JLPT/HSK ambiguities and wording in the generators, and
  the pack was rebuilt (`python -B MockExmps/Free/_source/build.py`; `grade_with_engine.mjs`: every key full marks, empty 0). Physics 2.1c
  now asks for the magnitude.
- Build: `node scripts/build-free-mocks.mjs` writes `assets/free-mocks/<slug>.json` (private; ЭЕШ keeps the stored-paper shape and is
  wrapped by `storedEntranceDefinition`), `ielts-academic-free-listening.json` (scripts by part, for practice after a check),
  `public/exam-assets/free/<slug>/*.svg` (own folder, because the ЭЕШ and HSK builds wipe theirs; the HSK worked examples are shared) and
  the client-safe `src/modules/exams/free/catalog.json`.
- Audio: `scripts/generate-free-audio.py` (setup in its header; same Kokoro voices, pace and per-item structure as the paid IELTS v2,
  JLPT and HSK generators) writes 14 tracks to `assets/free-audio` (48 kbps mono, 11.8 MB, hashes in its `manifest.json`) and
  `src/modules/exams/free/audio-catalog.json`. Recorded lengths leave checking time: IELTS 567 s of 900, N5 444 of 900, N4 561 of
  1,080, HSK 387 of 480. A Whisper-small round trip found every IELTS answer and 0.82–1.00 JLPT kana recall; HSK item 1 (小猫, woman's
  voice) was misheard. Nobody has listened yet.
- Site details: each programme hub shows its free mock as the first tile (the `/exams` strip was removed on 2026-11-14); briefings say free and half-length; the HSK result scales
  each section to 100 by its item count (×10 here); the free IELTS Speaking ends after Part 2 (stage `ielts-speaking-2-final`, which the
  examiner closes with the end-of-test line). Admins can fix them like any mock. Teacher and native-speaker review remain pending.

### TOEFL iBT (2026-11-18)

- On the site since 2026-11-18: nine forms `toefl-01`…`09` at `/exams/toefl` (Гадаад хэл Basic/Pro, or ₮10,000 for 7 days per
  mock). `scripts/build-toefl-mocks.mjs` turns the pack below into `assets/toefl/toefl-NN.json` (server-only definitions, read
  lazily by `toefl/content.ts`), `assets/toefl-audio/` (459 MP3s, 64.5 MB, `manifest.json` with hashes) and the client-safe
  `src/modules/exams/toefl/catalog.json` and `timeline.json`. It is deterministic; rerun it after any pack change
  (`tests/toefl.test.mjs` checks counts, keys, hashes and that client files hold no key or script).
- Sitting (20 stages): Reading Module 1 20 min, Module 2 9 min routed Upper at 21 of 35; Listening Module 1 runs on a server
  timeline (each clip once, then an answer window of 20 s per Choose a Response item or 25 s per question after a set) and
  Module 2 is routed Upper at 20 of 32 with its own length per route; Writing: Build a Sentence 6 min, email 7, discussion
  10; Speaking: two introductions, 7 Listen and Repeat items (8–12 s to answer) and 4 interview questions (45 s), each
  recorded and uploaded like IELTS Speaking. Engine additions are opt-in fields: `routeAt`, `variantSeconds` (read through
  `stageSeconds`) and a question `window` (a changed answer outside it plus 5 s is refused); SAT routing is unchanged.
- Audio has its own routes and function bundles (`/api/mock-attempts/[id]/audio/toefl`, `/api/exam-practice/[slug]/audio/toefl`):
  during a sitting only the clip playing now on the server clock is served; practice serves any clip after the access check.
- Views live in `src/modules/exams/toefl/` (hub, briefing, section, practice item, results, `toefl.css`): letter boxes for
  Complete the Words, tap-to-place boxes for Build a Sentence. Results are raw: Reading /50 and Listening /47 with the module
  taken, Build a Sentence /10; the email, discussion and speaking get AI scores (0–5) after the sitting, with model answers.
  Practice lists both routes per module; transcripts and model answers open after a check. Browser suite: `check -- toefl`.
- The pack: `MockExmps/TOEFL` (never deployed; in `.vercelignore`) holds the nine original forms in the format ETS introduced
  on 21 January 2026.
- A form follows ETS's 2026 blueprint: Reading 50 items (Complete the Words, Read in Daily Life, Read an Academic Passage) and
  Listening 47 (Choose a Response, Conversation, Announcement, Academic Talk), each as a 35- or 32-item routing module plus a
  15-item Lower or Upper module (both are written, so 127 scored items per form); Writing with 10 Build a Sentence items, an
  email and an academic discussion post; Speaking with 7 Listen and Repeat sentences and a 4-question interview.
- `_source/formNN.py` is the content, `_source/build.py` validates the blueprint and writes `mock-NN/candidate.md`,
  `answers.md`, `examiner.md` (recording scripts with US/UK/AU voice codes) and `mock.json`; `_source/AUTHORING.md` is the
  writing spec. Details, what was checked and the pack's own decisions (module split, routing at about 60 %, raw scores only):
  `MockExmps/TOEFL/README.md` and `SOURCES.md`.
- Offline recordings (2026-11-18): `mock-NN/audio/` has one MP3 per spoken item (51 per form: Choose a Response prompts,
  conversations, announcements, talks, the two speaking scenario lines, Listen and Repeat sentences, interview questions)
  and `audio-manifest.json` (voice per speaker, duration, file and source-text SHA-256, revision). `_source/generate_audio.py`
  synthesises them with local Kokoro-82M (fp32 model from the Speaking Lab cache, kokoro-js voice tables, speed 1.0, one
  sentence per call); AU codes use two extra British voices (`bf_isabella`, `bm_fable`). Script text is never changed:
  titles and room numbers get speech-only renderings, and espeak misreadings (heteronyms such as "excuse me", "live",
  "read"; teens stressed like "fifty") are corrected at phoneme level and listed per recording in the manifest. It is
  re-runnable per form and per recording and remakes only recordings whose script, phonemes or settings changed (their
  `revision` goes up). `_source/validate_audio.py` checks files, hashes, decoding and durations and runs a Whisper round
  trip (small.en, medium.en second opinion; files over 25 s are cut at sentence pauses first, because long-file
  transcription dropped sentence-initial words), listing recordings that differ from their script, ordinary words before
  name spellings; the pack's `AUDIO.md` is the index. Files hold speech only; pauses come from ADMINISTRATION.md.

### TOPIK Ⅰ and Ⅱ (2026-11-18)

- Owner request: three mocks per level matching the official paper. `topik1-mock-01`–`03` and `topik2-mock-01`–`03` (program
  `topik`) follow the paper-based TOPIK item by item: TOPIK Ⅰ 듣기 1–30 (40 min) and 읽기 31–70 (60 min); TOPIK Ⅱ 듣기 1–50
  (60 min), 쓰기 51–54 (50 min) and 읽기 1–50 (70 min). Same blocks, printed Korean instructions, 보기 examples, paired sets and
  points as the released papers (52nd and 60th TOPIK Ⅰ points: 3 or 4 per item, 100 per section; TOPIK Ⅱ 2 per item). Hub
  `/exams/topik` (two level columns), `/exams` card, Гадаад хэл Basic/Pro or the usual per-mock purchase.
- Pack `MockExmps/TOPIK` (never deployed): one JSON per form, `_source/structure.py` (the official structure),
  `validate.py`, the picture kit, `README.md` and `SOURCES.md` (only structure was taken; every item is new).
  `node scripts/build-topik-mocks.mjs [--only=…]` writes `assets/topik/<slug>.json` (server-only, with keys, scripts,
  explanations and writing models), the answer-free SVG pictures in `public/exam-assets/topik/<slug>/` (TOPIK Ⅰ L15–16 and
  TOPIK Ⅱ L1–2; TOPIK Ⅱ L3 and reading charts are drawn from data) and the client-safe `src/modules/exams/topik/catalog.json`.
  Question ids `topik{1,2}-0N-{l,w,r}NN`; group ids such as `topik-l-15` are also the practice sections.
- Views in `src/modules/exams/topik/` (hub, briefing, booklet-style section with ①–④, picture and chart options, practice
  audio, results, `topik.css`). Writing 51–54 are essay questions left ungraded: results show the model answers and rubric,
  and the student may score them for a TOPIK Ⅱ total out of 300 on the page (kept in the page only). Listening and Reading
  are scored on the server: TOPIK Ⅰ out of 200 with level 1 from 80 and 2 from 140; TOPIK Ⅱ out of 200 plus the self-score,
  levels 3–6 from 120/150/190/230. The page says it is a practice estimate, not an official score.
- Audio: `scripts/generate-topik-audio.py` synthesises the paper's administration locally with VoxCPM2 (Apache-2.0,
  through VoiceStudio): a narrator, a woman and a man (designed once, then cloned for each line), the opening, block
  instructions and examples, item numbers, each recording read twice (TOPIK Ⅱ 1–20 once) and the answer time. Four part
  tracks per mock in `assets/topik-audio/` (48 kbps mono, provenance and hashes in `<slug>-audio.json`), timings in
  `src/modules/exams/topik/audio-catalog.json` for practice replay. Own routes `/audio/topik` (`audio-response-topik.ts`);
  in a sitting only the part playing now is served. A faster-whisper large-v3 round trip compared every clip with its
  text; 15 bad lines got new seeds in `scripts/topik-audio-lines.json` and then passed. No person has listened to the tracks.
- Practice mode, the practice assistant and the review coach (`topik` chat subject) get pictures and charts as text
  (`topik/describe.ts`). Tests: `tests/topik.test.mjs`, browser group `topik` (`tests/topik_smoke.py`).
- Content: Claude Code (Opus 5.5) and Claude subagents. Each form is validated and was solved blind twice by a separate
  checker from a key-free copy (last round: TOPIK Ⅰ 210/210, TOPIK Ⅱ 300/300); flagged items were fixed, and options were
  rebalanced so length does not give the key away (key strictly the longest in 21–24% of items). Awaiting a Korean
  teacher's review.

### AI grading of Writing and Speaking (owner request 2026-11-18)

Owner: "fully automated website", no teacher review. When an IELTS or TOEFL results page opens, it asks
`POST /api/mock-attempts/[id]/grade` (`{part: "writing"|"speaking"}`; same origin, own attempt with its access rule, finished,
no other open sitting) once per part; `GET` reads the saved grades. Included in the mock's price: no credits.
- Code: `src/modules/exams/ai-grading/` (`contracts.ts` pure: what is graded, prompts, reply checks, band maths;
  `service.ts`; `panel.tsx` on both results pages). Stored in `MockGrade` (migration `20261118180000_mock_grades`), one row per
  attempt and part with status, tries, the result JSON, model and tokens.
- IELTS Writing: each task to DeepSeek (thinking, JSON) on the four band descriptors, with the Task 1 data table; the task band
  is the criteria mean, Writing = (Task 1 + 2 × Task 2) / 3, IELTS rounding. Speaking: Parts 1–3 from the AI examiner's
  transcripts, else DeepInfra Whisper of the stage recording (WebM/MP4 as stored); four criteria, pronunciation estimated from
  the transcript and labelled so. TOEFL: email and discussion 0–5 (ETS rubric); interview answers 0–5 each; Listen and Repeat
  scored on the site by word edit distance against the sentence (no AI). Fewer than 5 written / 8 spoken words = 0 without a call.
- The grade is scores and a short note only (owner 2026-11-18): criterion bands or 0–5 scores and one or two Mongolian sentences
  per task or part; no lists or corrections (older saved grades with them show only the note).
- Detailed reviews of IELTS essays (owner 2026-11-18): under the grade, each Writing task offers the Essay Studio's two reviews at
  the studio's price: "Бүрэн үнэлгээ" (DeepSeek, `writing-review` credits, 50+ words) and "Шинжээчийн үнэлгээ" (Claude, the
  plan's monthly reviews, 100+ words; free accounts see the plans link). `GET/POST /api/mock-attempts/[id]/essay-review`
  (`ai-grading/essay-review.ts`): own finished IELTS attempt, body `{questionId, kind}` only; the task (Task 1 as "report" with its
  data table, Task 2 as "essay") and the essay are read from the attempt snapshot, then `strongReview`/`expertReview` in
  `writing-lab/expert-service.ts` run the studio's checks, charge and save. The `EssayReview` row carries `attemptId` and
  `questionId` (migration `20261118190000_essay_review_mock`), so it lists on the results page (`essay-reviews.tsx`, report in a
  modal) and in the studio. TOEFL keeps the score only (the studio's examiner is IELTS-specific).
- Limits: 3 tries per part, a 6-minute lease, 16 parts per student per day (the free mock can be retaken); speaking waits up
  to 75 s for a recording still uploading. Checks: `tests/mock-grading.test.mjs`; `scripts/check.mjs` points DeepSeek at the
  suites' mock and sets `GRADING_TRANSCRIBE=off`, so suites never send recordings to DeepInfra.
- First live run (2026-11-18, dev 3009, learner-style answers): IELTS Writing 6 (6.5 / 6), Speaking 6 in 38 s; TOEFL Writing
  4 / 4, Speaking 3.5 in 21 s. The credit-priced Speaking report after a mock (`speaking/report`) is unchanged.
