# JLPT/HSK/TOPIK reading practice (Унших дасгал)

Part of the [project guide](../PROJECT.md). Word decks, Kana, Pinyin and Hangul: [language-decks](./language-decks.md).

### What it is (owner request 2026-11-19)

- Workshop → JLPT / HSK / TOPIK tab → the last tile, **Унших дасгал** → `/labs/reading/jlpt|hsk|topik`. The page sits in
  the Workspace frame under the Workshop tab (`workspace/paths.ts`). The student picks a level, a topic and a length.
  The topic is one of 12 chips, or the student's own topic (up to 60 characters). DeepSeek writes a short text on the
  server, and the student reads it. There are no questions, no grading, and nothing is stored on the server.
- Access is the same as the decks: Ази хэл Basic or Pro, or a retired Гадаад хэл plan until it ends (`hasLanguageStudy`), never
  free or Англи хэл, and closed while a timed sitting is open. A free account sees a locked tile linking to `/workspace/plans` and a locked page (`studyGate`).

| Level id | Exam | The text may use |
| --- | --- | --- |
| `hiragana` | JLPT | Hiragana only: no kanji, no katakana, no digits |
| `katakana` | JLPT | Katakana only, particles included (a katakana drill), with many loanwords |
| `n5-kana` | JLPT | N5 words in kana: hiragana, and katakana for loanwords |
| `n5-kanji` | JLPT | N5 words; kanji from `jlpt-kanji-n5.json` only, about one or more per sentence |
| `n4-kanji` | JLPT | N4 words and grammar; kanji from the N5 and N4 kanji decks |
| `hsk-1`, `hsk-2` | HSK | Characters of the HSK 1 words (HSK 2: HSK 1 + 2, the HSK 3.0 decks), plus marked people's names |
| `syllables` | TOPIK | Very short sentences in simple syllables: basic vowels plus ㅐ ㅔ, no tense initials, no double finals |
| `topik-1`, `topik-2` | TOPIK | Hangul only; TOPIK Ⅰ polite style, TOPIK Ⅱ longer linked sentences |

There are three lengths: short (4–6 sentences), medium (7–10) and long (11–15).

### Route and server checks

`POST /api/labs/reading` (`src/app/api/labs/reading/route.ts`, then `src/modules/language-reading/service.ts`) checks in
this order:

1. Same origin.
2. A signed-in account with a verified email (`apiUser`).
3. A JSON body of at most 2 KB.
4. The request shape (`readReadingRequest`): only `exam`, `level`, `length`, `topic` and `custom`, with the level
   belonging to the exam. Otherwise 400.
5. The plan. Otherwise 403.
6. No timed sitting is open. Otherwise 409.
7. The DeepSeek key is set. Otherwise 503.

Then `chargeCredits` holds the price and takes the daily slot. The slot is RateLimit `education-language-reading:<user>:<UB
day>`: 20 texts a day and one request in flight, with a 180 s lease and a 2 s pause after each text. The service then calls
DeepSeek and checks the reply. The call uses `deepseek-flash` in JSON mode with thinking off, temperature 0.7, `max_tokens`
from the price list and an 85 s timeout. Before delivering, the service checks for a timed sitting again. The reply is
`{ reading, provider, credits }`.

### Reply checks (`readReadingReply` in `contracts.ts`; nothing that breaks a rule reaches the student)

- **Shape.** The model returns `{title, sentences: [{text, tokens: [{s, r?, n?}], mn}]}`. A TOPIK reply has only `text`
  and `mn`: the code splits the words on spaces and romanizes them with Revised Romanization.
- **Size.** A reply needs at least the length's minimum number of sentences, and sentences past the maximum are dropped.
  A sentence may have at most 60 characters (JLPT), 40 (HSK) or 90 (TOPIK). The tokens must join back to the sentence.
- **Characters.** Every character is checked against the level's script and punctuation. The allowed kanji come from the
  kanji decks, the allowed HSK characters from the HSK word decks, and the pinyin syllables from `pinyin-chart.json` plus a
  few extras.
- **JLPT readings.**
  - A word with kanji needs its whole reading in hiragana in `r`, and the reading must fit the kana written in the word.
    The code aligns the furigana.
  - The code makes the romaji: Hepburn, with the particles は as wa, へ as e and を as o.
  - A word with a kanji the level does not allow is rewritten in kana from its own reading.
  - In the katakana drill, the code turns hiragana words into katakana.
  - Kanji levels need about one allowed kanji per sentence.
- **HSK readings.**
  - Each character gets one pinyin syllable with at most one tone mark (no tone numbers).
  - Erhua written onto the syllable before 儿 (diǎnr) is split off as its own "r".
  - People's names may use characters outside the list when they are marked `n: 1`: 1–3 characters each, at most three names.
- **Mongolian.** The title and every `mn` must be Mongolian in Cyrillic, with no Latin letters, kana, Han or Hangul.
- **Broken sentences.** Up to a quarter of the sentences may break the rules; they are dropped if enough good ones remain.
  Otherwise the problems (at most 12) go back to DeepSeek for one retry. If the retry fails too, the route returns 503 and
  the hold is refunded ("кредит хасагдаагүй").
- **Prompt.** It holds:
  - the level's rules and the allowed kanji or HSK word list
  - about 30 sampled deck words as hints
  - common words to write in hiragana when their kanji are not allowed (私, 朝, …)
  - the topic; the student's own topic is quoted as data, and the prompt says to ignore any instructions in it

### Page (`client.tsx`, `reading.module.css`)

- **Reading aids.** Kept per exam in this browser (`education-language-reading-aids-v1:<exam>`):
  - ふりがな, Pinyin or Romanization (TOPIK)
  - Romaji (JLPT)
  - word gaps (JLPT/HSK; on by default for the kana levels)
  - a translation toggle for all sentences
  - three text sizes
  - a slow voice
- **Translation.** Each sentence has its own Орчуулга button, and the translation stays hidden until asked.
- **Layout.** Closing punctuation stays with the word before it and an opening bracket with the word after it. Word gaps
  are real spaces, so a wrapped line starts flush.
- **Voice.** The browser's voice (ja-JP, zh-CN or ko-KR) reads one sentence or the whole text, sentence by sentence. The
  current sentence is highlighted, and the reading can be stopped. A katakana text is spoken from its hiragana. Without a
  voice for the language, there are no speech buttons.
- **Buttons.**
  - Дахин унших stops the voice, hides the translations and scrolls back to the top.
  - Шинэ текст moves focus to the form.
- **Storage.** The last 6 texts per exam are kept in `localStorage` (`education-language-reading-v1:<userId>`). They are
  read back defensively, and the history list can open or delete them. A reload keeps a paid text. No database change.

### Mock reading and the writing workshop (owner request 2026-11-19)

- Under the AI texts, «Mock-ийн уншлага» lists the exam's mocks by their reading sections with questions (JLPT 読解: 短文, 中文,
  情報検索; HSK 阅读; TOPIK 읽기), with progress on the ones the student may open. A card opens `/labs/mock/reading/<slug>`.
- `/labs/writing/hsk|topik` (the Workshop's «Бичих дасгал» tile) lists HSK 2 书写 (10 items) and TOPIK Ⅱ 쓰기 51–54 (4 items); JLPT
  has no writing paper and no tile. Essay answers get AI feedback from the practice assistant («Бичсэнд минь санал өг»).
- Both pages are the practice routes narrowed to one skill (see [product-surface](./product-surface.md)), behind the same Ази хэл
  plan and open-sitting gate (`studyGate`).

### Price

The price follows the length: short 8, medium 10, long 13 (action `language-reading`, sold with a margin). How it is worked
out: [ai-credits](./ai-credits.md).

### Checks run (2026-11-19, Claude Code, Opus 5.5)

- **Unit and static checks.**
  - `tests/language-reading.test.mjs` covers levels, script rules, furigana and romaji, the reply reader (including the
    kana repair, the katakana drill, erhua, dropped sentences and names), the prompt, storage and price. It also checks
    the order of the server checks in the route, service and page source.
  - `tests/credits.test.mjs` has the new action.
  - The full `node --test tests/*.test.mjs` passed (386/386).
  - `npm run lint`: 0 errors (2 warnings in another file).
  - `npm run typecheck` passed.
- **Live DeepSeek checks.**
  - 15 probe calls outside the app, across all ten levels, used the app's own prompt and checks. They led to the kana
    repair, the erhua split and dropping broken sentences. One HSK 2 reply used 赛, which is not an allowed character; in
    the app it would get the retry.
  - `tests/language_reading_smoke.py` passed against `next dev` on 3011 with real texts for JLPT N5 kanji, HSK 1 and
    TOPIK Ⅰ (with a custom topic). It spends real DeepSeek tokens, three short texts at 8 credits each on a QA account, so
    it is not in a `scripts/check.mjs` group. Run it by hand with
    `TEST_BASE_URL=<server> PYTHONIOENCODING=utf-8 python tests/language_reading_smoke.py`.
- **Screenshots.** `artifacts/language-reading-{jlpt,hsk,topik}-{desktop,phone}.png`.
- **Not checked.**
  - Real speech: the suite stubs `speechSynthesis`, and headless Chromium has no voices.
  - The production build.
  - A refused text in the app: none was refused there. The unit tests and the credit ledger tests cover it.
  - Medium and long texts in the app (probes only).
