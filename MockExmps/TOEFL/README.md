# Original TOEFL iBT mock exams 01-09 - offline authoring pack

Nine complete practice forms in the TOEFL iBT format that ETS introduced on 21 January 2026 (adaptive Reading and
Listening, the new task types, shorter test). Written on 2026-11-18 with Claude Code (Fable 5.2). On the website
since 2026-11-18 as `toefl-01`…`09`: `scripts/build-toefl-mocks.mjs` copies them into `assets/toefl*` (rerun it after
any change here); `.vercelignore` still excludes this folder. Start with [ADMINISTRATION.md](ADMINISTRATION.md); format references are in [SOURCES.md](SOURCES.md);
the offline recordings (synthetic, made 2026-11-18) are listed in [AUDIO.md](AUDIO.md).

Form 01 is the reference form. Forms 02-09 follow its structure exactly with different content, written to
[_source/AUTHORING.md](_source/AUTHORING.md).

| Form | Paper | Academic passages | Academic talks | Discussion question |
| --- | --- | --- | --- | --- |
| 01 | [candidate](mock-01/candidate.md) | City noise and birdsong; the decoy effect | Sea otters and kelp; time zones; spaced study; painted statues | Free public transportation |
| 02 | [candidate](mock-02/candidate.md) | Green roofs; cooking and human evolution | Pluto; the assembly line; coral bleaching; first-language learning | Courses outside the major |
| 03 | [candidate](mock-03/candidate.md) | Procrastination; tree rings | Bat echolocation; why countries trade; Roman concrete; weak ties | Working from home |
| 04 | [candidate](mock-04/candidate.md) | Borrowed words; planets around other stars | The placebo effect; cold desert nights; tragedy of the commons; deep-sea light | Plastic bags: ban or fee |
| 05 | [candidate](mock-05/candidate.md) | Umami; the first paper money | Hurricanes; perspective in painting; octopus color; gift economies | Devices in lecture halls |
| 06 | [candidate](mock-06/candidate.md) | The bilingual brain; biomimicry | The potato in Europe; why ice floats; network effects; oral epics | Social media and connection |
| 07 | [candidate](mock-07/candidate.md) | Habit formation; penicillin and resistance | Tall buildings and wind; crop rotation; the blue sky; endangered languages | Taxing sugary drinks |
| 08 | [candidate](mock-08/candidate.md) | Third places; bacteria inside us | The compass; too many choices; urban heat islands; fossils | Unpaid internships |
| 09 | [candidate](mock-09/candidate.md) | The weekend; the brain rewiring itself | Plant defenses; prices ending in 99; black holes; the ship of Theseus | Compulsory voting |

## What one form contains

| Section | Module 1 (everyone) | Module 2 Lower | Module 2 Upper | Time |
| --- | --- | --- | --- | --- |
| Reading | 2 Complete the Words paragraphs, 4 daily-life texts, 1 academic passage: 35 questions | 1 paragraph, 2 daily-life texts: 15 | 1 paragraph, 1 academic passage: 15 | 20 + 9 min |
| Listening | 12 Choose a Response, 4 conversations, 2 announcements, 2 academic talks: 32 | 7 Choose a Response, 1 conversation, 3 announcements: 15 | 3 Choose a Response, 1 conversation, 1 announcement, 2 talks: 15 | 18 + 7 or 11 min |
| Writing | 10 Build a Sentence, 1 email, 1 academic discussion post | | | 23 min |
| Speaking | 7 Listen and Repeat sentences, 4 interview questions | | | about 8 min |

A test taker answers 50 Reading, 47 Listening, 12 Writing and 11 Speaking items, the totals in ETS's blueprint.
Because both second modules are written, each form holds 65 Reading and 62 Listening items: the pack has
**1,143 machine-scored questions** (127 x 9), 90 Build a Sentence items, 18 writing prompts with model answers,
63 Listen and Repeat sentences and 36 interview questions with model answers.

Each `mock-NN/` folder has `candidate.md` (the paper), `examiner.md` (every recording script, with voice codes),
`answers.md` (keys, an explanation for every question, model responses, scoring descriptors), `mock.json` (all
of it as data) and `audio/` (one MP3 per recording, 51 per form, with `audio-manifest.json`; see [AUDIO.md](AUDIO.md)).

## Rebuild

From the repository root, standard library only:

```powershell
python -B MockExmps/TOEFL/_source/build.py            # validate and write every form
python -B MockExmps/TOEFL/_source/build.py --check 4  # validate one source file, write nothing
```

`_source/formNN.py` holds a form's content, `common.py` three small constructors, `build.py` the blueprint checks
and the renderers. The build writes only inside this folder, plus [validation-report.json](validation-report.json)
and [manifest.json](manifest.json). The recordings are made by `_source/generate_audio.py` and checked by
`_source/validate_audio.py` (commands in [AUDIO.md](AUDIO.md)); run `build.py` after them so `manifest.json`
records the audio hashes too.

## What was checked, and what was not

- Structure, by `build.py` on every build: task order and counts per module, text and script lengths, the Complete
  the Words rule (ten second halves on alternate words, intact first and last sentences), four distinct options,
  key spread and runs, accent balance, Build a Sentence reconstruction, Listen and Repeat length bands, and no
  text repeated between forms.
- Complete the Words gaps were screened against a list of about 34,000 common English words for other words that
  fit the letters shown.
- Every machine-scored item (137 per form with Build a Sentence) was answered again without the key by an
  independent model run (Claude Sonnet 5.5, one run per form). It agreed with the key on 134 to 137 items per
  form. Each disagreement was resolved: seven Build a Sentence items that could be assembled a second way and two
  loose answer options were rewritten, the others were solver slips against a clear key. Rewritten items were
  checked by the builder but not solved a second time.
- Short items that several forms had written almost identically (response prompts, Build a Sentence replies) were
  found with a word-overlap scan and rewritten; no pair of forms now shares one.
- Academic passages, talks and Complete the Words paragraphs were read once by the author of form 01 for factual
  accuracy; one figure (assembly time of a Model T) was corrected to the chassis.
- Recordings: every Listening and Speaking script was synthesised locally with Kokoro-82M stock voices (American
  and British; Kokoro has no Australian voice, so the AU codes use two other British voices) and checked by a
  Whisper round trip ([AUDIO.md](AUDIO.md), [audio-validation.json](audio-validation.json)). Words the speech
  front end misread in context ("excuse me", "live", teens) were corrected in the phonemes, never in the scripts.
  No person has listened to them yet.
- **Not done:** no review by a TOEFL teacher or a native-speaker editor, no trial with learners, no difficulty
  calibration, no human listening of the recordings. If a script is corrected, run the audio generator again for
  that form: it remakes only the changed recordings and raises their revision.
- Scores are raw. The routing rule, the 35/15 and 32/15 module split and the 6-minute Build a Sentence clock are
  this pack's decisions; [SOURCES.md](SOURCES.md) explains each.

These are practice drafts, not ETS material. TOEFL and TOEFL iBT are registered trademarks of ETS, which has not
reviewed or endorsed this pack.
