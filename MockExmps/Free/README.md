# Free half-length mocks — offline pack

Prepared 2026-11-12 by Claude Code (Claude Opus 5.5) at the owner's request: one free mock per exam for
free-plan students, about half the length of a full mock. **On the website since 2026-11-13.** This folder is
the source: `scripts/build-free-mocks.mjs` converts it into the site's files (see "On the site" below). The
folder itself is excluded from deployment in `.vercelignore` like every other pack. Answer keys are inside the
JSON files, so keep the folder private.

Every question, passage, dialogue, chart and key is original. None is copied from the paid mocks, and
no official paper or answer key is reproduced.

## The ten mocks

| Exam | Slug | File | What it contains | Scored items | Time | Full mock |
| --- | --- | --- | --- | ---: | ---: | --- |
| ЭЕШ Mathematics | `eesh-math-free` | `eesh/eesh-math-free.json` | 18 A–E (1–4: 1 pt, 5–14: 2 pt, 15–18: 3 pt), 2 structured tasks of 7 pt, 1 figure | 30 · 50 pt | 50 min | 40 · 100 pt · 100 min |
| ЭЕШ Physics | `eesh-physics-free` | `eesh/eesh-physics-free.json` | 23 A–E (8 × 1 + 15 × 2 pt), 2 tasks of 6 pt, 2 circuit figures | 31 · 50 pt | 50 min | 62 · 100 pt · 100 min |
| ЭЕШ Chemistry | `eesh-chemistry-free` | `eesh/eesh-chemistry-free.json` | 20 A–E (1–11: 1, 12–15: 2, 16–20: 3 pt), 2 Part II tasks of 8 one-digit cells | 36 · 50 pt | 50 min | 72 · 100 pt · 100 min |
| ЭЕШ Biology | `eesh-biology-free` | `eesh/eesh-biology-free.json` | 23 A–E (10 × 1 + 11 × 2 + 2 × 3 pt), 2 Part II tasks of 6 answers | 35 · 50 pt | 40 min | 70 · 100 pt · 80 min |
| ЭЕШ English | `eesh-english-free` | `eesh/eesh-english-free.json` | Grammar, vocabulary, communication, a reading text with summary, Part II word forms and definitions | 34 · 50 pt | 40 min | 67 · 100 pt · 80 min |
| Digital SAT | `sat-free` | `sat/sat-free.json` | Reading & Writing Module 1 (27) and Math Module 1 (22, five typed answers); no adaptive Module 2, no break | 49 | 67 min | 98 · 134 min |
| IELTS Academic | `ielts-academic-free` | `ielts/ielts-academic-free.json` | Listening Parts 1–2 (20), Reading Passages 1–2 (26), Writing Task 1 (bar chart), Speaking Parts 1–2 | 46 | 84 min | 80 · about 165 min |
| JLPT N5 | `jlpt-n5-free` | `jlpt/jlpt-n5-free.json` | Vocabulary 12, grammar and reading 11, listening 11; every N5 group type | 34 | 45 min | 67 · 90 min |
| JLPT N4 | `jlpt-n4-free` | `jlpt/jlpt-n4-free.json` | Vocabulary 14, grammar and reading 15, listening 14; every N4 group type | 43 | 58 min | 85 · 115 min |
| HSK 1 | `hsk1-free` | `hsk/hsk1-free.json` | All eight parts with fewer items: Listening 10, Reading 10; 21 pictures | 20 | 17 min | 40 · 32 min |

`validation-report.json` lists the counts, timings and the spread of A–E keys. `manifest.json` holds the
SHA-256 of every generated file.

## Format: ready for the site's loaders

Each file uses the shape the site already reads, so the site build copies it with few changes:

- **ЭЕШ:** the stored-paper shape of `assets/entrance-mocks/<subject>/<slug>.json`, read by
  `src/modules/exams/entrance/content.ts` (groups, questions, passages, points, figures). `year` is 2026 and
  `form` is "Үнэгүй".
- **SAT, IELTS, JLPT, HSK:** a complete `ExamDefinition` (`src/modules/exams/types.ts`), the same shape as
  `assets/jlpt/*.json` and `assets/hsk/*.json`.

The IDs follow the prefixes the site keys on. SAT question IDs start with `sat-rw` and `sat-math`, and the Math
stage ID starts with `sat-math`, because the report, calculator and tutor use those prefixes. IELTS stages
reuse `ielts-listening` and `ielts-listening-check`. JLPT numbers start with V, G or L. HSK groups start with
`hsk-l-` and `hsk-r-`. Figures carry the public paths planned here. The site build rewrites them to
`/exam-assets/free/<slug>/`, because the ЭЕШ and HSK builds delete and rebuild their own folders:

| Folder here | Path planned in the JSON |
| --- | --- |
| `eesh/images/<slug>/` | `/exam-assets/eesh/<subject>/<slug>/` |
| `ielts/images/ielts-free/` | `/ielts-mocks/ielts-free/` |
| `hsk/images/hsk1-free/` | `/exam-assets/hsk/hsk1-free/` (worked examples reuse the existing `/exam-assets/hsk/examples/`) |

Listening material never reaches the browser during a sitting. It is stored in `question.listening`, which
`PublicQuestion` omits. IELTS questions carry only the short excerpt that holds each answer, for review. The full
IELTS scripts are in `ielts/ielts-academic-free-listening.json`, with speaker labels, the 30-second reading
pauses and suggested Kokoro voices, so they stay out of attempt snapshots.

## Rebuild and checks

```powershell
python -B MockExmps/Free/_source/build.py              # writes every mock, figure, manifest and validation report
python -B MockExmps/Free/_source/build.py sat ielts    # only some (no manifest or report)
node MockExmps/Free/_source/grade_with_engine.mjs      # grades every file with the site's engine.ts
```

`build.py` stops if an answer recomputation fails. The ЭЕШ Mathematics, Physics, Chemistry and Biology keys and
the SAT Math keys are recalculated in Python (SymPy for Mathematics). It also checks: unique IDs, every key among
its options, point totals, group and passage references, figure files, a script for every listening item, the
half-length time limits, IELTS evidence quotes present in the scripts and passages, and every HSK line against
the HSK pack's 150-word list. `grade_with_engine.mjs` imports the site's `engine.ts` read-only and confirms that
entering every key scores full marks and an empty sitting scores zero. On 2026-11-12 all ten scored 100%, and again
after the 2026-11-13 review fixes.

HSK pictures are drawn by the HSK pack's own `MockExmps/HSK/_source/scenes.py`, imported read-only.

## On the site (2026-11-13)

Site details are in `docs/project/assessments.md`, "Free half-length mocks".

- **Build.** `node scripts/build-free-mocks.mjs` reads this folder and writes the private definitions to
  `assets/free-mocks/` (ЭЕШ papers keep the stored-paper shape), the IELTS Listening scripts for practice after a check,
  the figures to `public/exam-assets/free/<slug>/` and the client-safe `src/modules/exams/free/catalog.json`. The HSK
  worked examples stay shared at `/exam-assets/hsk/examples/`.
- **Audio.** `scripts/generate-free-audio.py` reads the scripts here and writes 14 Kokoro tracks to `assets/free-audio`,
  served on `/audio/free`.
- **Access.** Every signed-in, verified account, with retakes and practice. Free mocks are never sold or picked and are not
  counted in the paid totals (`src/modules/subscriptions/mock-access.ts`).
- **Pages.** Each programme hub shows its free mock as the first tile, and the briefings say free and half-length. Copy
  that assumed a full mock (40 answers, ×5 per HSK section) was fixed. The free IELTS Speaking ends after Part 2.
- **After editing this pack:** run `build.py` and `grade_with_engine.mjs` (above), then `node scripts/build-free-mocks.mjs`,
  then `python scripts/generate-free-audio.py` if a listening script changed, then the checks `docs/OPERATIONS.md`
  requires (`npm run check -- free` covers these mocks and their audio).

## Limits

- **No teacher or native-speaker review**, and no learner calibration. Difficulty targets the paid mocks' level by the
  author's judgement only. ЭЕШ papers need a subject teacher; English, Japanese and Chinese need native review.
  The 2026-11-13 AI review re-derived every key (none wrong) and fixed ambiguous items; it does not replace a teacher.
- **Nobody has listened to the audio.** A Whisper-small round trip heard every IELTS answer and 0.82–1.00 of the JLPT
  kana, but misheard HSK item 1 (小猫, woman's voice). Recorded lengths leave time to check answers: IELTS 567 s of the
  900 s stage, JLPT N5 444 of 900, N4 561 of 1,080, HSK 387 of 480.
- Short reading texts are original. The ЭЕШ English and IELTS repair-café stories are fictional. The SAT and IELTS
  texts state a few real-world facts, checked from general knowledge but not against cited sources: induced demand, the
  waggle dance, Kilimanjaro's height, the Orkhon Valley's 2004 World Heritage listing, desert sand in concrete, and
  dendrochronology.
- Not official and not affiliated with the College Board, IELTS partners, the Japan Foundation/JEES, CTI or БҮТ.
  No scaled SAT score, IELTS band, JLPT 180-point score or HSK level is claimed.
