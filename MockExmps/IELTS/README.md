# Six new IELTS Academic mock exams — 07–12

Six original, complete offline practice forms, continuing the project's existing 01–06 numbering. Since 2026-11-10 they are on the website as `ielts-academic-07`–`12`, converted by `node scripts/build-ielts-mocks.mjs` (forms JSON, Writing visuals, the two Listening plans and 48 kbps mono copies of the part recordings in `assets/ielts-forms`); rerun it after rebuilding this pack. At authoring time the files were independent of the website. No catalogue, route, database, site asset or deployed exam is added. `.vercelignore` excludes this folder.

Start with [ADMINISTRATION.md](ADMINISTRATION.md). **Listening recordings are included: [open the audio index](AUDIO.md).** Each exam has one complete MP3 and four separate part MP3s, with distinct speaker voices and built-in reading/checking pauses. Complete scripts remain available for a separate reader or post-test review.

| Mock | Candidate paper | Reading topics | Writing Task 1 | Speaking long turn |
| --- | --- | --- | --- | --- |
| 07 | [Open paper](mock-07/candidate.md) | Station reuse; soundscape surveys; recommendation systems | Library visits: line graph | Useful advice |
| 08 | [Open paper](mock-08/candidate.md) | Cargo deliveries; night lighting; learning through copying | Expenditure: paired pie charts and totals | Organising an event |
| 09 | [Open paper](mock-09/candidate.md) | Unpowered cooling; remembering; repairability | Accommodation: comparative table | A useful borrowed item |
| 10 | [Open paper](mock-10/candidate.md) | Harbour swimming; archaeological surveys; accountable decisions | Cork-panel manufacturing: process diagram | A considered decision |
| 11 | [Open paper](mock-11/candidate.md) | Distributed libraries; seasonal photographs; convenience | Market Square: paired plans | A welcome local change |
| 12 | [Open paper](mock-12/candidate.md) | Public clocks; old paper; forecasts | Skill learning: bars plus study-time data | A clear explanation |

Each `mock-XX/` folder contains:

- `candidate.md`: 40 Listening questions, three full Reading passages with 40 questions, two Writing tasks and the Speaking cue card.
- `answer-sheet.md`: blank Listening/Reading response sheet, with separate response-paper instructions for Writing and Speaking notes.
- `answers.md`: all 80 objective keys, evidence and explanations, plus task-specific Writing guidance.
- `examiner.md`: four connected Listening scripts and the full three-part Speaking interview.
- `audio/`: four part MP3s, one complete Listening MP3, and examiner-only JSON script/voice/timing records. Share only the MP3s with a candidate during a sitting.
- `writing-1.svg`: original, locally viewable Writing visual. The candidate paper repeats all data as accessible text.
- `mock.json`: complete structured authoring source including keys and scripts; examiner-only during a sitting.

The pack contains **480 objective questions**, 18 original Reading passages, 24 complete Listening scripts, 12 Writing tasks and six Speaking interviews. Reading passages total 2,242–2,311 words per form. Tasks include completion, multiple choice, headings, paragraph/person matching, TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, and two Listening plans.

These are authored practice drafts, not official IELTS papers. Places, people, studies and numerical datasets are fictional teaching contexts unless explicitly identified otherwise. No official exam questions, passages, figures or recordings are reproduced. Qualified IELTS-teacher review, student trials and difficulty calibration remain pending. Raw Listening/Reading marks are available; no official band prediction or automatic Writing/Speaking score is supplied.

## Rebuild and inspect

From the repository root:

```powershell
python -B MockExmps/IELTS/_source/build.py
```

The Python standard-library builder writes only within this pack. It regenerates papers, keys, scripts, structured JSON, six SVG visuals, [validation-report.json](validation-report.json) and [manifest.json](manifest.json). `_source/readingXX.py` and `listeningXX.py` hold the authored texts; `extras.py` holds Writing and Speaking; `common.py`, `figures.py` and `build.py` handle structure, visuals and rendering. It does not convert content to website definitions.

Structural validation checks counts, numbering, key membership, completion limits, evidence excerpts and Reading length. It cannot establish that every distractor is pedagogically effective or that a proposed answer is the only defensible interpretation. See [REVIEW.md](REVIEW.md) for the author review and remaining limits; [SOURCES.md](SOURCES.md) records format references.

Audio generation uses local Kokoro-82M stock voices. [AUDIO.md](AUDIO.md) explains playback and regeneration; [audio-manifest.json](audio-manifest.json) records measured durations, source/file hashes and voice settings. Run `python -B MockExmps/IELTS/_source/validate_audio.py` to check every recording. The recordings do not include Speaking answers or spoken Reading passages.
