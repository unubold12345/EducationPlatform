# JLPT/HSK/TOPIK word decks (HSK with their characters), JLPT kanji decks, Kana, Pinyin and Hangul workshops

Part of the [project guide](../PROJECT.md).

### Workshop exam tabs and word decks (2026-11-18)

- Owner rule: features for one exam show only to that exam's students. `/workspace/workshop` has tabs IELTS / JLPT / HSK / TOPIK
  (`?exam=`; the last tab is kept in the `workshop-exam` cookie, else IELTS). The shared Vocabulary page has no JLPT/HSK tab.
- Decks: JLPT N5 (791 words, 29 lessons), N4 (688 new words, 24; none repeats N5, so ~1,480 by N4), HSK 1 (300, 12),
  HSK 2 (198, 11), by topic. JLPT grew 2026-11-19 (owner) toward the usual ~800 / ~700-more study targets: the new
  words are lessons N5 l19–l29 and N4 l15–l24 only, so earlier drafts and their fixes stayed untouched (changing a
  lesson's terms redrafts the whole lesson). pykakasi flags there were its own misreadings; 17 meanings/examples were
  hand-fixed (Latin letters inside Cyrillic, typos, the 用 example reading the romaji check caught). Kanji decks: see below. HSK lists are the HSK 3.0
  (2026) level 1 and 2 word lists (hsk.wordswing.com/vocabulary; 2026-11-19, owner request; 300 + 200 words; 花 and 过 are listed
  twice at HSK 2, so 198 entries; 点 is in both levels; their senses are in `notes`), which the HSK 3.0 mock pack (`MockExmps/HSK3`) validates
  against. The rebuild reused the drafted entry of every word already drafted in either HSK deck and drafted only the new
  words (DeepSeek); a word with a `notes` sense is always redrafted, and an HSK example must be in characters only (a build
  check, after one lesson came back in pinyin). Ten entries were hand-fixed (它们, 前, 万, 时, 游, 间, 坏, 花, 门票, 有时). JLPT has had no official list since 2010: the N5/N4 lists are
  author-selected core words (`scripts/language-decks/lists.mjs`), not an official syllabus.
- Kanji decks (2026-11-19, owner request): `jlpt-kanji-n5` (104 kanji, 9 lessons) and `jlpt-kanji-n4` (174 more, 14;
  none repeats N5), kind `kanji` in the catalog, author-selected from common study lists (`scripts/language-decks/kanji.mjs`;
  no official list since 2010). Same page, access, progress and review route as the word decks (`isStudyDeck`). An entry is
  the kanji, `on` (katakana) and `kun` (hiragana, okurigana in parentheses: た(べる)), a Mongolian meaning and 2–3 example
  words. DeepSeek drafts readings, meaning and two example words per lesson into `MockExmps/Decks/jlpt-kanji-<level>.json`;
  the build takes example words from the reviewed N5/N4 word decks first (regular reading and only learned kanji first, so
  今日 きょう is not 日's first example) and fills the rest from the drafts (40 N5 / 108 N4 drafted words). The first example
  is longer than the kanji and holds it once. Quiz domain `kanji`: meaning, kanji choice, pairs, typing any one reading (kana
  or romaji, on also in hiragana) and a word gap (＿本 with にほん · Япон); no listening or reading-building, and nothing reads a
  lone kanji aloud (the example words can be played). Readings in quiz prompts and choices are hidden. 19 readings/meanings were
  hand-fixed after review (rare kun dropped, 茶 kun ちゃ wrong, okurigana forms); remaining special-reading examples (日本, 田舎,
  昨日) are real words. Two N4 word glosses lost Russian wording (地下, 講堂).
- HSK characters (2026-11-19, owner request after the HSK 3.0 move): HSK 3.0 asks for 246 characters to read at HSK 1 and
  371 by HSK 2 (plus 100 to write by hand). The official character lists were not available, so the characters are those of
  the deck word lists (`scripts/language-decks/hanzi.mjs`: every character of the HSK 1 words, then the new ones of the HSK 2
  words), 248 rather than 246 at HSK 1. They are nothing new to learn, so the owner asked for them as a filter in the HSK word
  decks rather than decks of their own, and dropped writing as useless: there are no character decks, no handwriting list
  and no writing drill. Each lesson of `hsk-1`/`hsk-2` has `chars` (the characters first met in that lesson's words: 248 and
  123), shown by a «Ханз» tab between Үгс and Карт: kanji-style cards with pinyin (hidden with the reading toggle) and a
  meaning; a card opens up to three deck words that hold it (voiced, the longest once-words first). Reading only: no progress,
  cards or quiz of their own, and nothing reads a lone character aloud. DeepSeek drafts pinyin and a Mongolian meaning per
  lesson into `MockExmps/Decks/hsk-hanzi-<level>.json`; the build checks every reading against the syllables of the deck words
  (`pinyin.json`): each must be one the words use and each toned one they use must be listed, with the character's own tone
  (一 yī, 不 bù, 友 yǒu in 朋友). Fixed with it: the tone drill split 可能 as kěn·éng (`build_pinyin.py` now tries a split
  without a vowel-initial later syllable first), and the kanji example panel no longer clips its first letter.
- Access (owner rule): paid only. A deck opens with an active plan that has workshops and includes the exam (Ази хэл
  Basic and Pro since 2026-11-19, and a retired Гадаад хэл plan until it ends; not free, not ЭЕШ, not Англи хэл, not the retired IELTS
  plan; `hasExamWorkshop`). Closed during an open timed sitting, like AI help.
  The page (`/labs/words/[deck]`, inside the Workspace frame) and `POST /api/labs/words/[deck]/review` both check.
- Page: lesson list, reading toggle (ふりがな / Pinyin, kept per browser), today's cards and quiz (the Vocabulary page's own
  `StudyCard` and `Quiz`, given the deck words, a `reviewUrl` and lessons instead of decks), word rows with the example,
  its reading and Mongolian meaning, and browser speech in ja-JP / zh-CN. When typing a word in the quiz, its kana or pinyin
  (with or without tone marks) also counts.
- Progress: `LanguageDeckProgress` (migration `20261118120000_language_deck_progress`), one row per graded word, same Leitner
  fields as `VocabularyWord`. Word ids are the first 10 hex characters of sha1(term), so list edits keep progress. A review
  takes at most 60 grades, only words in that deck.
- Content: `node --env-file=.env.local scripts/build-language-decks.mjs --draft` drafts missing lessons with DeepSeek (reading,
  Mongolian meaning, example, example reading and meaning) into `MockExmps/Decks/<deck>.json` (offline, for teacher review;
  edits there survive re-runs); the plain run validates and writes `assets/language-decks/` (private, traced by
  `next.config.ts`). `MockExmps/Decks/check_readings.py` compares readings with pykakasi / pypinyin: on 2026-11-18 all 69
  differences were the dictionaries' (other readings of a kanji, neutral tones, tone sandhi). Meanings and examples are
  drafts awaiting teacher review; the page says so.
- Romaji (JLPT decks, 2026-11-18): a second toggle, off by default, kept per browser. Word romaji comes from the kana
  (`src/modules/language-decks/romaji.ts`, Hepburn: gakkou, kin'en, matcha); example romaji is drafted by DeepSeek and kept
  only when it is within 0.85 similarity of the kana's own romaji. Typed answers also accept si/ti/tu/hu/zi, nn and so on.
  `MockExmps/Decks/check_example_readings.py` (pykakasi) flags example readings that drift; on 2026-11-18 it found and fixed
  ガスの火 (read がすのがす) and 九時 (read きゅうじ); the other 42 flags were pykakasi's own misreadings.

### Kana workshop (`/labs/kana`, JLPT tab, 2026-11-18)

- Owner pick "Chart first": script tabs ひらがな / カタカナ, a Romaji toggle (on by default) and Шалгалт өгөх, then the
  chart in three sections (Үндсэн 46, Дауны тэмдэг 25, Нийлмэл 33 = 104 per script). Clicking a kana plays it; each cell
  has a mastery bar.
- Test (owner request 2026-11-18, "simple, all letters, mix with katakana"; replaced row chips, cards, the quiz maker and
  the look-alike round; setup in a modal, owner: "just make modal", using the Vocabulary `Modal`): pick ひらがな / カタカナ / Хоёулаа, any of the three sections, and 10 / 20 / 50 / Бүгд questions.
  One question kind only: a kana and four romaji (same row first, distinct texts, so お/を never show "o" twice). A right
  answer moves on by itself, a wrong one shows the answer and Дараах; keys 1–4 and Enter. Results: score, %, time, the
  missed letters, Алдсанаа давтах / Дахин / Буцах. One grade per letter goes to its own chart's review route.
  Engine `kana-test.ts`, screen `kana-quiz.tsx`. The `kana` domain of `drill.ts` is no longer used by any page.
- Data: `scripts/language-decks/kana.mjs` (rows, look-alikes), built without AI into `assets/language-decks/kana-*.json`.
  Each row is a lesson; a kana's romaji is its meaning, so the shared cards and quiz ask kana ↔ romaji. Typing romaji accepts
  other spellings (`meaningAnswers`); typing the kana from its romaji needs the kana.
- The two charts are decks `kana-hiragana` / `kana-katakana` (kind `kana`): same access, progress table and review route as
  the word decks, but no tile of their own and not openable at `/labs/words/`.

### Pinyin & tones workshop (`/labs/pinyin`, HSK tab, 2026-11-18)

- Same layout: tone drill bar, then sections Аялгуу (four tones and neutral, contour drawing, 妈麻马骂吗, sandhi rules for
  3+3, 不, 一) and the initials × finals chart in four groups (a·o·e, i, u, ü), 405 syllables. A cell plays one common
  character with that reading (browser voices read characters, not pinyin).
- Data: `uv run --with pypinyin python MockExmps/Decks/build_pinyin.py [--draft]` writes `MockExmps/Decks/pinyin.json`:
  syllables that some character is read as (pypinyin), minus eight rare ones; example characters drafted by DeepSeek and kept
  only when pypinyin confirms the reading; drill words = the HSK 1/2 deck words split one syllable per character (erhua words
  skipped; 477 since 2026-11-19, without the ten words that have only neutral syllables, such as 的, 们, 吗, which gave
  the drill a one-choice question). `build-language-decks.mjs` publishes `pinyin-chart.json` and deck `hsk-tones` (kind `tones`).
- Drill: 10 or 20 words from HSK 1 and/or 2, due and weak first; the word plays, the student picks its tones from four
  choices (one or two syllables' tones changed; neutral stays neutral). Without a Chinese voice the word is shown and the
  drill still works. Results save through the same review route.
- Checks: `tests/language-decks.test.mjs`, browser group `decks` (`tests/language_decks_smoke.py`).
### Workshop quiz and deck page redesign (2026-11-18)

- Owner: "a quiz maker like Duolingo" for the word decks, layout left to us (Kana now has its own plain test, above). `drill.ts` (pure engine) builds the
  exercises; `drill-session.tsx` has the maker (groups, exercise kinds, 5/10/20/30/50/Бүгд questions (0 = every word), Ухаалаг/Шинэ/Сул/Бүгд, kept per
  browser), one exercise per screen with Шалгах/Алгасах, a green/red answer bar, missed exercises asked again once at the end,
  keys 1–9 and Enter, and a result screen (points, accuracy, time, best streak, words to review). One grade per item
  (missed anywhere = again) goes through the deck review route; no new table.
- Kinds: meaning, word, listening (only with a voice), pairs (after every fifth), typing (lenient: case, spaces, tone marks;
  v = ü; romaji spellings), building the reading from kana tiles (JLPT) or the word from characters (HSK), sentence gap
  (example holds the word once), and tones (Pinyin drill, which now runs on the same quiz).
- Deck page: progress hero (ring, stats, Өнөөдрийн давталт = 10 smart questions, Quiz үүсгэх), a lesson path with progress
  rings, and the lesson as word cards, a Карт tab (StudyCard) and previous/next. An open card keeps its grid place; its
  example opens as a full-width panel (`#deck-word-example`) after the last card of its row, with a pointer under the card
  (the column count is measured from the grid). Spanning the card across the row had left earlier cards alone on theirs. The shared
  Vocabulary quiz is no longer used here. Old layout and a restore script: `artifacts/design-backup-2026-11-18/`.
- Widths: the deck page fills the Workspace content area up to 1440 px (`.page.page` in `deck-page.module.css`); the Kana,
  Hangul and Pinyin pages go to 1120 px (`decks.module.css`). Both use a doubled class because the shared `.wsp-page` cap
  (1000 px) otherwise wins, which had left the word cards about 600 px beside the lesson path on every desktop.

- Shared page gate: `src/modules/language-decks/gate.tsx` (plan, then timed sitting) for the deck, Kana and Pinyin pages.
- Next (owner, 2026-11-18): Reading Lab for JLPT/HSK in the same tabs. TOPIK after TOEFL (TOPIK tab done, below).

### TOPIK tab: Hangul workshop and word decks (2026-11-18)

- Tab TOPIK (`?exam=topik`) with three tiles: Хангыль (`/labs/hangul`) and decks TOPIK Ⅰ / TOPIK Ⅱ (`/labs/words/topik-1|2`).
  Same plan rule, gate, progress table, review route, deck page and quiz maker as JLPT/HSK; voice ko-KR; reading toggle
  "Romanization". A typed answer counts in Hangul or romanization; tiles build the word from its syllables.
- Hangul (`hangul-client.tsx`, deck `hangul`, kind `hangul`): sections Үсэг (vowels, consonants, with notes), Үеийн хүснэгт
  (21 rows, 208 syllables: basic and compound vowels, 13 consonant rows, 5 tense rows, 7 final sounds) and Патчим ба дүрэм
  (seven final sounds, linking, nasalization, ㄹ, aspiration, palatalization, each with words to play). Шалгалт өгөх opens
  the Kana test in a modal: parts Эгшиг / Гийгүүлэгч / Давхар / Патчим and 10 / 20 / 50 / Бүгд questions.
- Romanization: `src/modules/language-decks/hangul.ts` writes Revised Romanization letters after the sound changes inside a
  word (입학 → ipak, 같이 → gachi), no tensification. Where the rules miss the dictionary pronunciation, a draft word gives a
  respelling `sounds` (닭고기 → dakgogi, 맛없다 → madeopda, ㄴ-insertion 금융 → geumnyung, 집안일 → jibannil), also applied to
  its example. The dictionary pronunciation in Hangul shows in brackets where it differs from the spelling ([직짱]).
- Decks: drafts in `MockExmps/Decks/topik-1.json` and `topik-2.json`, built with `node scripts/build-topik-decks.mjs` (no
  AI; also writes `hangul.json`). TOPIK publishes no word list, so both are author-selected by topic (written by Claude
  subagents): TOPIK Ⅰ 513 words in 18 lessons (levels 1–2), TOPIK Ⅱ 513 in 18 (levels 3–4, the last three lessons essay and
  lecture words), no word in both. The builder lists pronunciations that differ from its rules for review; on 2026-11-18 all
  six were dictionary forms (흰색 [힌색], 댓글 [대끌], plus the four respelled). Mongolian meanings and examples await a
  Korean teacher's review; the page says so.
- Checks: `tests/topik.test.mjs` (tab, Hangul chart and test, deck romanization, quiz answers). The browser smokes do not
  open the TOPIK tab yet; it was checked by hand on a dev server (tiles, deck page, signed-out redirects, review API 401).
