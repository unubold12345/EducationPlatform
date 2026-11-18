# TOPIK mock authoring brief

Original practice forms that follow the official paper-based TOPIK (PBT) exactly: same sections, timing, question
order, task types, printed instructions, paired sets and points. Content (dialogues, texts, options) is **new**.

- Do **not** reproduce or closely paraphrase any real TOPIK item, script or text you remember (copyright). Same task
  type, new situation, new wording.
- The structure is fixed in `_source/structure.py` (also `_source/structure.json`): blocks, printed instructions,
  per-question points, the printed question line (`prompt`) for paired sets. Points are not authored; the builder adds them.
- Check your file with `python -X utf8 MockExmps/TOPIK/_source/validate.py MockExmps/TOPIK/topik-i/mock-01.json`
  until it prints `OK` (warnings are advice). Save the file early and keep improving it.

## Levels and difficulty

| | TOPIK Ⅰ (levels 1–2) | TOPIK Ⅱ (levels 3–6) |
| --- | --- | --- |
| Sections | 듣기 1–30 (40 min), 읽기 31–70 (60 min) | 듣기 1–50 (60 min), 쓰기 51–54 (50 min), 읽기 1–50 (70 min) |
| Score | 200; level 1 from 80, level 2 from 140 | 300; level 3 from 120, 4 from 150, 5 from 190, 6 from 230 |
| Audio | every recording is read twice | items 1–20 once, 21–50 twice |

Difficulty rises with the item number, as on the real paper. TOPIK Ⅰ uses beginner vocabulary and grammar (daily
life, -아요/어요, -ㅂ니다, -고, -아서/어서, -(으)면, -(으)려고, -지만, -는데, -(으)ㄹ 거예요, -고 싶다, -아/어 보다, -(으)ㄴ 적이 있다);
items 1–14 and 31–39 are very easy, 49–70 reach a solid level 2. TOPIK Ⅱ items 1–20 (listening) and 1–18 (reading) sit
at level 3, the middle at level 4, and listening 31–50 / reading 39–50 at levels 5–6 (lectures, debates,
documentaries, editorials, literary prose, abstract vocabulary such as 인식, 제도, 비판하다, 신중하다, 불가피하다).

Korean must be natural standard Korean, correctly spelled and spaced (표준어, 한글 맞춤법, 띄어쓰기). Options in one item
share the same form and length range; distractors are plausible (they reuse words heard or read) but clearly wrong
on a careful reading; exactly one answer is defensible. Spread the right answers evenly over ①–④ within a
section, never more than three equal answers in a row (the validator checks).

**Explanations** are Mongolian (Cyrillic), 1–3 sentences: quote the Korean evidence and say why the key is right
(and, briefly, why the strongest distractor is wrong). Example: `Эмэгтэй «주말에 산에 갔어요»
гэж хэлсэн тул ② зөв. ③ буруу: эрэгтэй ууланд яваагүй.`

## File

`MockExmps/TOPIK/topik-i/mock-0N.json` or `MockExmps/TOPIK/topik-ii/mock-0N.json`:

```json
{
  "id": "topik-i-01", "level": "I", "number": 1,
  "theme": "short English summary of the form's situations",
  "themeMn": "Монгол товч тайлбар",
  "listening": [ set, ... ],
  "writing":   [ set, ... ],      // TOPIK II only
  "reading":   [ set, ... ]
}
```

A **set** is one recording or one text with the question(s) asked about it. Blocks marked `set: True` in the
structure ([25～26], [49～50] …) are one set with two or three questions; every other block has one set per
question. Sets appear in number order.

```json
{ "numbers": [25, 26],
  "script": [ {"speaker": "여자", "text": "..."} ],         // listening
  "passage": "...", "doc": {...}, "chart": {...},          // reading: one or more of these
  "questions": [
    { "number": 25, "prompt": "여자가 왜 이 이야기를 하고 있는지 고르십시오.",
      "options": ["...", "...", "...", "..."], "answer": 4,
      "explanation": "Монгол тайлбар ..." },
    { "number": 26, "prompt": "들은 내용과 같은 것을 고르십시오.", "options": [...], "answer": 2, "explanation": "..." }
  ] }
```

- `prompt`: only on questions whose block prints a question line (paired sets). Use the structure's text exactly; where
  it is a pattern, choose 남자/여자 to match the script. Single-question blocks have no `prompt`.
- `options`: four strings without ①–④ numbers. `answer`: 1–4.

### Listening scripts

- `script` is a list of turns, `speaker` is `남자` or `여자` (the voices). A narrator reads numbers and instructions; do
  not write it.
- Write every number as it is spoken, in Hangul (세 시 반, 오천 원, 이십 퍼센트, 이천이십육 년); no digits, no Latin
  letters, no brackets. Use 해요체 in dialogues, 합니다체 in announcements, news and lectures.
- TOPIK Ⅰ 1–4: one line, a question from one speaker; the options are the other speaker's reply. 1–2 are yes/no
  questions: two options begin `네,`, two begin `아니요,`. 3–4 are 누가/언제/어디/뭐/어떻게/얼마/몇 questions.
  5–6: one formulaic line (greeting, thanks, apology, phone, shop); options are set replies.
  7–10: two turns; options are single place nouns (은행, 약국, 미용실 …). 11–14: two turns; options are single topic
  nouns (날씨, 취미, 가족, 계획 …). 15–16: two to four turns; four pictures (below). 17–21: four to six turns; options are
  `남자는/여자는 …ㅂ니다/습니다.` 22–24: four to six turns; options state an opinion (`…는 것이 좋습니다.`, `…아야 합니다.`).
  25–26: one speaker (announcement, guide, message), 6–9 sentences. 27–28: a dialogue of 6–10 turns. 29–30: an
  interview of 6–10 turns (the reason asked in 29 is said, not guessed).
- TOPIK Ⅱ 1–2: a short dialogue, four pictures. 3: one speaker (news) reports survey or statistics; four charts, one
  matches. 4–8: three turns, the next line is the options (spoken by the speaker who did not speak last).
  9–12: four turns; options are the woman's next action in plain form (`서류를 복사한다.`). 13: dialogue; 14: an
  announcement (one speaker); 15: news (one speaker); 16: an interview. 17–20: four turns, the man's main idea.
  21–30: dialogues or interviews of 6–10 turns. 31–32 debate, 33–34 lecture, 35–36 a speech or ceremony address,
  37–38 an educational programme (two speakers), 39–40 a talk that starts mid-discussion (so 39 asks what came before),
  41–42 lecture, 43–44 documentary narration, 45–46 lecture, 47–48 talk show, 49–50 lecture. Monologue blocks
  (33–36, 41–46, 49–50, and 3, 14, 15) have one speaker. From 31 on scripts run 400–700 characters.

### Pictures and charts

- Picture items (TOPIK Ⅰ 15–16, TOPIK Ⅱ 1–2) have `pictures` instead of `options`: four
  `{"scene": "..."}` in English, each a precise illustrator brief: place, who (a man, a woman), pose or action, the key
  objects and where they are. The four differ in one or two drawable details (who holds what, where an object is,
  which action); only one fits the dialogue. Pictures contain no words, numbers or clocks; avoid facial nuance.
  Drawable vocabulary: standing, sitting, walking, giving, holding, carrying, reading, writing, eating, drinking,
  talking on a phone, pointing, waving, typing on a laptop, cooking, cleaning, paying at a counter; rooms, a shop counter,
  a library shelf, a café table, a kitchen, an office desk, a bus stop, a street, a park; book, bag, box, umbrella,
  flowers, cup, laptop, phone, bicycle, ball, chair, table, bed, plant, jacket, glasses, ticket, map.
- Charts (`charts` for TOPIK Ⅱ listening 3, `chart` for reading 10, `charts` in writing 53):
  `{"type": "bar" | "hbar" | "line" | "pie" | "table", "title": "한국어 제목", "unit": "%", "labels": ["20대", "30대"],
  "series": [{"name": "2016년", "values": [12, 30]}], "note": "조사 대상: 성인 남녀 1,000명"}`. Two or three series at
  most, numbers only in `values`. A `%` pie adds up to 100.

### Reading material

- `passage`: the text. Mark a blank `(    )` (four spaces) for TOPIK Ⅰ 34–39 and TOPIK Ⅱ blanks; `( ㉠ )` for TOPIK Ⅰ
  49–69 blanks; `( ㉠ )`…`( ㉣ )` for insertion points (TOPIK Ⅰ 59, TOPIK Ⅱ 39–41), and the given sentence goes in the
  question's `"sentence"` with options `["㉠", "㉡", "㉢", "㉣"]`. Ordering items (TOPIK Ⅰ 57–58, TOPIK Ⅱ 13–15): the passage
  is four lines `(가) …`, `(나) …`, `(다) …`, `(라) …` (shuffled) and the options look like `(나)-(가)-(라)-(다)`; on the real paper
  the four options start with only two different first sentences. Underlined parts (TOPIK Ⅱ 3–4, 23, 42, 50) are
  marked `【…】`. Use `\n` for paragraph breaks.
- `doc`: a printed document (TOPIK Ⅰ 40–42 and 63–64, TOPIK Ⅱ 5–9, writing 51):
  `{"kind": "notice|ticket|memo|message|email|ad|menu|schedule|poster|receipt|card|sign", "title": "...",
  "lines": ["...", "항목 | 내용"], "footer": "..."}`. A line with ` | ` becomes a table row. Email/message may add
  `"from"`, `"to"`. TOPIK Ⅱ 5–8 are short advertising or campaign copy (one or two lines, no product name that gives the
  answer away); the options are noun phrases (`식당`, `건강 관리`, `안전 수칙`, `상품 안내` …).
- TOPIK Ⅰ 31–33: two short sentences; options are single nouns. 34–39: one or two sentences with `(    )`; 34 a particle,
  35 a noun, 36 an adverb, 37 an adjective, 38–39 verbs (options in the same form). 40–42: three of the options match the
  document and one does not (the key). 43–48: 2–3 sentence texts in the first person (저는 …); 46–48 options say what
  the writer thinks or wants. 49–70: 150–330 characters per text.
- TOPIK Ⅱ 1–2 grammar blank in one sentence (options: four endings or connectives on the same stem); 3–4 an underlined
  grammar form and four near-synonym forms; 9 notice, 10 graph, 11–12 news paragraphs (200–260 characters);
  16–18 and 28–31 a paragraph with one longer phrase missing; 19–24 texts of 300–450 characters (21 an idiom such as
  `발 벗고 나서다`, 23–24 a first-person essay); 25–27 one headline each with ellipsis/idiom (`…, 기대 이하` style)
  and four plain explanations; 32–34 academic paragraphs; 35–38 argumentative paragraphs; 39–41 insertion; 42–43 a
  passage of fiction with dialogue (500–650 characters); 44–50 essays and editorials (450–700 characters).

### Writing (TOPIK Ⅱ 51–54)

```json
{ "numbers": [51], "doc": {"kind": "email", "title": "...", "lines": ["... ( ㉠ ) ...", "... ( ㉡ ) ..."]},
  "writing": {"models": {"㉠": ["...", "..."], "㉡": ["..."]}, "rubric": "Монгол: юуг бичих, ямар хэлзүй"},
  "questions": [{"number": 51}] }
{ "numbers": [52], "passage": "... ( ㉠ ). ... ( ㉡ ) ...", "writing": {...same...}, "questions": [{"number": 52}] }
{ "numbers": [53], "writing": {"topic": "1인 가구의 증가", "charts": [...], "notes": ["원인: ...", "전망: ..."],
  "model": "200–300 characters", "rubric": "..."}, "questions": [{"number": 53}] }
{ "numbers": [54], "writing": {"prompt": "주제 소개 단락", "bullets": ["…는가?", "…는가?", "…는가?"],
  "model": "600–700 characters, 문어체 -다", "rubric": "..."}, "questions": [{"number": 54}] }
```

51 is a practical text (email, notice, message, ad) with two one-sentence gaps; 52 an explanatory paragraph with two
gaps whose content follows from the logic (cause, contrast, conclusion). 53: a short report on the charts in written
style (-다), with an overview, comparison and the notes. 54: an argumentative essay on a social topic answering the
three bullets in order. Character counts include spaces (manuscript paper), not line breaks.
