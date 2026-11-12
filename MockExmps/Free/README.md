# Free half-length mocks — offline pack

Prepared 2026-11-12 by Claude Code (Claude Opus 5.5) at the owner's request: one free mock per exam for
free-plan students, about half the length of a full mock. **Not on the website yet.** No website code, asset,
catalogue, database row or price was changed; the folder is excluded from deployment in `.vercelignore`
like every other pack. Answer keys are inside the JSON files, so keep the folder private.

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

Each file uses the shape the site already reads, so integration mostly means copying files and registering slugs:

- **ЭЕШ:** the stored-paper shape of `assets/entrance-mocks/<subject>/<slug>.json`, read by
  `src/modules/exams/entrance/content.ts` (groups, questions, passages, points, figures). `year` is 2026 and
  `form` is "Үнэгүй".
- **SAT, IELTS, JLPT, HSK:** a complete `ExamDefinition` (`src/modules/exams/types.ts`), the same shape as
  `assets/jlpt/*.json` and `assets/hsk/*.json`.

The IDs follow the prefixes the site keys on. SAT question IDs start with `sat-rw` and `sat-math`, and the Math
stage ID starts with `sat-math`, because the report, calculator and tutor use those prefixes. IELTS stages
reuse `ielts-listening` and `ielts-listening-check`. JLPT numbers start with V, G or L. HSK groups start with
`hsk-l-` and `hsk-r-`. Figures already carry their future public paths:

| Folder here | Public path the JSON expects |
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
entering every key scores full marks and an empty sitting scores zero. On 2026-11-12 all ten scored 100%.

HSK pictures are drawn by the HSK pack's own `MockExmps/HSK/_source/scenes.py`, imported read-only.

## Integration checklist (later; not done)

1. **Files.** Copy ЭЕШ JSON to `assets/entrance-mocks/<subject>/` and figures to `public/exam-assets/eesh/...`; JLPT
   to `assets/jlpt/`; HSK to `assets/hsk/` and its pictures to `public/exam-assets/hsk/hsk1-free/`; load SAT and IELTS
   definitions server-side (for example next to `ielts-forms.json`) and the IELTS chart into `public/ielts-mocks/ielts-free/`.
2. **Catalogues and pages.** Add catalogue rows or a "free sample" card per programme. The ЭЕШ hub groups papers by year
   and form, so the free papers need their own row, not a 2026 variant.
3. **Access, server-side.** Grant these ten slugs to every signed-in, verified account without opening any paid slug,
   and keep the existing start, read, save, audio, AI and ownership checks. Decide whether retakes are unlimited.
   Free slugs must not appear as per-mock purchases.
4. **Audio (required before Listening can be sat).** IELTS, JLPT N5/N4 and HSK listening are scripts only. The
   existing generators read the paid packs, so they need a free-mock entry: `scripts/generate-jlpt-audio.py`
   (the item scripts already use ナレーター/男/女), `scripts/generate-hsk-audio.py` (read each item twice), and the IELTS
   Kokoro pipeline from `ielts-academic-free-listening.json`. Follow PROJECT "Audio functions": give each new
   recording set its own folder, reader and route segment, and check the bundle sizes.
5. **Copy that assumes a full mock.** The `ielts-listening-check` stage label says "40 хариултаа шалгах"
   (`src/app/exams/[slug]/page.tsx`); here it is 20. HSK results convert correct × 5 per 20-item section; with 10 items
   per section the same 100-per-section scale is correct × 10. The SAT free mock has no break and no adaptive routing.
6. **Tests.** Extend the unit and browser suites (`entrance`, `mocks`, `jlpt`, `hsk`, `billing` groups) to cover the
   free slugs and the free-access rule.

## Limits

- **No teacher or native-speaker review**, and no learner calibration. Difficulty targets the paid mocks' level by the
  author's judgement only. ЭЕШ papers need a subject teacher; English, Japanese and Chinese need native review.
- **No audio yet** (see step 4). The IELTS listening stage is set to 15 minutes from the script length (about 1,130 spoken
  words and six 30-second pauses, roughly 10–11 minutes at 150 words a minute), which leaves time to check answers;
  measure it after synthesis.
- Short reading texts are original. The ЭЕШ English and IELTS repair-café stories are fictional. The SAT and IELTS
  texts state a few real-world facts, checked from general knowledge but not against cited sources: induced demand, the
  waggle dance, Kilimanjaro's height, the Orkhon Valley's 2004 World Heritage listing, desert sand in concrete, and
  dendrochronology.
- Not official and not affiliated with the College Board, IELTS partners, the Japan Foundation/JEES, CTI or БҮТ.
  No scaled SAT score, IELTS band, JLPT 180-point score or HSK level is claimed.
