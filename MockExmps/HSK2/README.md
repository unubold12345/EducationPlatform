# Original HSK 2 mock exams — offline authoring pack

> Superseded on 2026-11-19 by the HSK 3.0 pack (`MockExmps/HSK3`), which the site now builds from; this pack is the source of the items HSK 3.0 kept. `scripts/build-hsk-mocks.mjs` no longer reads it.

Three complete HSK 2 forms written on 2026-11-16 with Claude Code (Fable 5.2). Every sentence, dialogue, key,
explanation and picture is original; no official HSK question, recording, picture or answer key is reproduced.
The pack is never deployed (`.vercelignore`); the site copies are built from it.

| Form | Theme |
| --- | --- |
| 01 | 运动和身体 · Sport and health |
| 02 | 上班和旅游 · Work and travel |
| 03 | 生日快乐 · Happy birthday |

Regular HSK 2 (HSK 2.0) blueprint: 60 items, Listening 35 (10 + 10 + 10 + 5, about 25 minutes) and Reading 25
(5 + 5 + 5 + 10, 22 minutes). All Chinese is printed with pinyin. Practice score: each section out of 100, 200 in all;
120 is the usual pass mark. This is not an official or equated score.

```
_source/content.py    items, keys, pinyin and explanations of the three forms
_source/scenes2.py    35 drawings added to the HSK 1 scene library (MockExmps/HSK/_source/scenes.py)
_source/build.py      validation, pictures, mock.json, manifest.json, validation-report.json
examples/             the shared Listening 1 example picture
mock-01 … mock-03/    mock.json (with answers) and images/
```

Rebuild, from the repository root:

```powershell
python -B MockExmps/HSK2/_source/build.py        # pack
python scripts/generate-hsk2-audio.py            # only if a listening text changed (Python 3.12 env, see generate-hsk-audio.py)
node scripts/build-hsk-mocks.mjs                 # site definitions, pictures and catalogue for HSK 1 and 2
```

Limits: no teacher or native-speaker review, no learner calibration, no printable booklets or PDFs. The checks are
structural (counts, keys, set coverage, the 300-word HSK 1-2 list plus the extras named in build.py); they cannot
prove that a sentence is natural or that a picture is unambiguous. Released audio is never overwritten: a changed
listening text needs a new recording revision once these mocks are live.
