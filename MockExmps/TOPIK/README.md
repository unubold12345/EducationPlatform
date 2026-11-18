# TOPIK pack (offline; never deployed)

Six original paper-based TOPIK practice forms: TOPIK Ⅰ 01–03 (`topik-i/`) and TOPIK Ⅱ 01–03 (`topik-ii/`). Each follows
the official paper item by item (sections, timing, order, task types, printed instructions, 보기 examples, paired sets,
points); every item is new. Sources: [SOURCES.md](SOURCES.md). Writing rules for authors: [AUTHORING.md](AUTHORING.md).

| Form | Sections | Themes |
| --- | --- | --- |
| TOPIK Ⅰ 01–03 | 듣기 1–30 (40 min), 읽기 31–70 (60 min) | a student's campus life; home and neighbourhood; travel, leisure and part-time work |
| TOPIK Ⅱ 01–03 | 듣기 1–50 (60 min), 쓰기 51–54 (50 min), 읽기 1–50 (70 min) | work, the economy and health; environment, science and technology; society, culture, the arts and education |

Each form's `themeMn` lists its situations; forms in one level use different situation pools so they do not feel alike.

## Files

- `topik-<i|ii>/mock-0N.json`: the form (sets, scripts, passages, charts, options, keys, Mongolian explanations,
  writing rubrics and model answers). Schema in AUTHORING.md.
- `topik-<i|ii>/mock-0N/l<NN>-<1..4>.svg`: the four picture options of the picture items, drawn by `_source/pictures.py`.
- `_source/structure.py` (→ `structure.json`): the official block-by-block structure, read by the validator, the site
  builder and the audio generator. `_source/validate.py`: counts, numbering, printed lines, option shapes, key balance
  (no more than three equal answers in a row), listening-script rules (남자/여자 only, numbers in Hangul), lengths.
- `_source/scenes.py`: the flat-vector drawing kit (no words or numbers in any picture); `_source/pictures.py`: the
  scenes per form.

## Workflow

```
python -X utf8 MockExmps/TOPIK/_source/validate.py MockExmps/TOPIK/topik-ii/mock-03.json
python -X utf8 MockExmps/TOPIK/_source/pictures.py --only=topik2-mock-03 --png
node scripts/build-topik-mocks.mjs --allow-missing-audio --only=topik2-mock-03   # while the audio is not made
<VoxCPM2 python> scripts/generate-topik-audio.py --only=topik2-mock-03           # setup in the script header
node scripts/build-topik-mocks.mjs                                                # final build, all forms with audio
```

The audio generator caches each line in `artifacts/voicestudio/topik-cache` (`--lines` writes
`lines-<slug>.json`); a Whisper round trip over that list finds clips that do not say their text. A bad clip gets a
new seed, and a misread word a speech-only respelling, in `scripts/topik-audio-lines.json`; then the generator is run
again (only changed lines are synthesised).

## Status

Content written by Claude Code (Opus 5.5) and its Claude subagents (2026-11-17/18), each form validated and then
answered blind twice by a separate checker (last round TOPIK Ⅰ 210/210, TOPIK Ⅱ 300/300); flagged items were reworded. The Korean has not been reviewed by a Korean
teacher, and the synthetic audio has not been listened to by a person. Results show a practice level, not an
official score.
