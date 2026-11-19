# HSK 3.0 mock exams (HSK 1 and HSK 2): offline authoring pack

Twelve forms (HSK 1 and HSK 2, six of each), built on 2026-11-19 with Claude Code (Opus 5.5) for the 2026 HSK 3.0
paper and word list. The pack is never deployed (`.vercelignore`). Forms 01–03 replace the HSK 2.0 forms under the same
slugs (`hsk1-mock-01` … `hsk2-mock-03`). Forms 04–06 (`hsk1-mock-04` … `hsk2-mock-06`) were added the same day and are
entirely new: their items are in `_source/forms456.py`, and their pictures are drawn by `_source/scenes3.py` in each
form's own palette.

Sources: the HSK 3.0 word lists for levels 1 and 2 (300 + 200 words, hsk.wordswing.com/vocabulary, the same lists the
Workshop decks use) and the public descriptions of the 3.0 papers. No official 3.0 sample paper was available, so the
part layout follows those descriptions and needs a teacher's review. Every sentence, key and picture is original. Items
the 3.0 paper kept come from the HSK 2.0 packs (`MockExmps/HSK`, `MockExmps/HSK2`), reworded where a word left the
syllabus (`OVERRIDES` and `TEXT_FIXES` in `_source/content.py`). Forms 04–06 copy only the shared worked examples of
form 01. In every six-entry bank of these forms, one entry belongs to the worked example, as on the paper.

| Level | Listening | Reading | Writing | Minutes |
| --- | --- | --- | --- | --- |
| HSK 1 | 20: word → 3 pictures, sentence → word, dialogue → picture bank, statement + question | 20: sentence → picture, question → answer, fill the blank, text + ★ question | none | 15 + 25 (40) |
| HSK 2 | 25: sentence → 3 pictures, dialogues → pictures (2 × 5), dialogue + question (10) | 25: sentence → picture, fill the blank, sentence matching (2 × 5), text + ★ question | 10: pick the missing component (5), type the character from its pinyin (5) | 20 + 30 + 10 (60) |

Every word printed or heard is checked against the deck lists in `scripts/language-decks/lists.mjs` (plus the names
and implied words in `build.py`). Writing answers come only from the 100 HSK 1–2 handwriting characters
(`HANDWRITING`). Practice score: 100 per section. This is not an official or equated score.

```
_source/content.py   new 3.0 items, rewrites of kept 2.0 items, Writing banks, handwriting characters
_source/forms456.py  forms 04-06 of both levels: every item, key, pinyin, explanation and picture choice
_source/scenes3.py   the HSK 1 and HSK 2 drawings plus 24 new scenes, and three more palettes (variants 4-6)
_source/build.py     compose the forms, validate, copy or draw pictures, write mock.json, manifest.json, validation-report.json
examples/            the 3.0 parts' shared example pictures
hsk1-mock-01 …/      mock.json (with answers) and images/
```

Rebuild from the repository root:

```powershell
python -B -X utf8 MockExmps/HSK3/_source/build.py   # pack (stops on any validation error)
python scripts/generate-hsk3-audio.py <slug ...>    # only the forms whose listening text changed (Kokoro env, see generate-hsk-audio.py)
node scripts/build-hsk-mocks.mjs                     # site definitions, pictures and catalogue
```

Known limits:

- Old attempts and practice results keep their snapshot, but they share slugs, question ids and audio file names with
  the new forms. A 2.0 HSK 2 sitting still in progress would ask for a fourth track that no longer exists.
- The Listening audio is synthetic (Kokoro) and has had no human listening review (`humanListeningReview: false`).
- HSK 1 Reading 1, form 1: the 看书 sentence reuses a 2.0 picture of a man reading a newspaper.
- Forms 04–06 were rechecked the same day (pinyin, pictures, a key-free re-read, a Whisper round trip, a blind solve by
  a second model; detail in `docs/project/assessments.md`) but have had no teacher's review yet.
- Kokoro cannot say some words on their own: 饺子 in any voice, 米饭 in the woman's (form 01 L1 now starts with the man).
  Hear a new single-word L1 item through Whisper before keeping it.
- The free HSK 1 half mock (`MockExmps/Free`) is still in the HSK 2.0 format.
