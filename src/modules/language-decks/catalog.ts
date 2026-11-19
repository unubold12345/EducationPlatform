// The JLPT/HSK/TOPIK word decks (Workshop → JLPT / HSK / TOPIK). Client-safe: names and shapes only. The words are private,
// plan-gated content read on the server from assets/language-decks/<id>.json (built by scripts/build-language-decks.mjs).

export const LANGUAGE_EXAMS = ["jlpt", "hsk", "topik"] as const;
export type LanguageExam = (typeof LANGUAGE_EXAMS)[number];
export const isLanguageExam = (value: unknown): value is LanguageExam => LANGUAGE_EXAMS.includes(value as LanguageExam);

/** Workshop's exam tabs (owner rule 2026-11-18: each exam shows only its own labs). */
// TOEFL joined on 2026-11-19 (owner request: the Workshop is for IELTS and TOEFL, and JLPT/HSK/TOPIK have their own tabs).
// ЭЕШ joined on 2026-11-20 (owner request): each subject's paper year by year, recurring topics and a topic drill.
export const WORKSHOP_EXAMS = [{ id: "ielts", label: "IELTS" }, { id: "toefl", label: "TOEFL" }, { id: "jlpt", label: "JLPT" }, { id: "hsk", label: "HSK" }, { id: "topik", label: "TOPIK" }, { id: "eesh", label: "ЭЕШ" }] as const;
export type WorkshopExam = (typeof WORKSHOP_EXAMS)[number]["id"];
export const WORKSHOP_EXAM_COOKIE = "workshop-exam";

// kind: "words" and "kanji" decks are tiles of their own (the word-deck page, /labs/words/<id>); "kana" decks are the Kana workshop's two charts (/labs/kana); "hangul" is
// the Hangul workshop's syllable chart (/labs/hangul).
export const LANGUAGE_DECKS = [
  { id: "jlpt-n5", exam: "jlpt", kind: "words", level: "N5", title: "JLPT N5", lang: "ja-JP" },
  { id: "jlpt-n4", exam: "jlpt", kind: "words", level: "N4", title: "JLPT N4", lang: "ja-JP" },
  // Kanji (2026-11-19): about 100 N5 and 175 more N4 kanji with on/kun readings and example words from the word decks.
  { id: "jlpt-kanji-n5", exam: "jlpt", kind: "kanji", level: "N5", title: "JLPT N5 ханз", lang: "ja-JP" },
  { id: "jlpt-kanji-n4", exam: "jlpt", kind: "kanji", level: "N4", title: "JLPT N4 ханз", lang: "ja-JP" },
  { id: "hsk-1", exam: "hsk", kind: "words", level: "HSK 1", title: "HSK 1", lang: "zh-CN" },
  { id: "hsk-2", exam: "hsk", kind: "words", level: "HSK 2", title: "HSK 2", lang: "zh-CN" },
  { id: "kana-hiragana", exam: "jlpt", kind: "kana", level: "Kana", title: "Хирагана", lang: "ja-JP" },
  { id: "kana-katakana", exam: "jlpt", kind: "kana", level: "Kana", title: "Катакана", lang: "ja-JP" },
  // The Pinyin workshop's tone drill (/labs/pinyin): HSK 1/2 words split into syllables with tones.
  { id: "hsk-tones", exam: "hsk", kind: "tones", level: "Pinyin", title: "Аялгуу таних", lang: "zh-CN" },
  // TOPIK (2026-11-18): author-selected core words per level (TOPIK publishes no word list) and the Hangul chart.
  { id: "topik-1", exam: "topik", kind: "words", level: "TOPIK Ⅰ", title: "TOPIK Ⅰ", lang: "ko-KR" },
  { id: "topik-2", exam: "topik", kind: "words", level: "TOPIK Ⅱ", title: "TOPIK Ⅱ", lang: "ko-KR" },
  { id: "hangul", exam: "topik", kind: "hangul", level: "Hangul", title: "Хангыль", lang: "ko-KR" },
] as const satisfies readonly { id: string; exam: LanguageExam; kind: "words" | "kanji" | "kana" | "tones" | "hangul"; level: string; title: string; lang: string }[];
export type LanguageDeckId = (typeof LANGUAGE_DECKS)[number]["id"];
export type LanguageDeckInfo = (typeof LANGUAGE_DECKS)[number];
export const findLanguageDeck = (id: string): LanguageDeckInfo | undefined => LANGUAGE_DECKS.find(deck => deck.id === id);

/** How the reading aid is named per exam: furigana for Japanese, pinyin for Chinese, romanization for Korean. */
export const READING_LABEL: Record<LanguageExam, string> = { jlpt: "ふりがな", hsk: "Pinyin", topik: "Romanization" };

export type DeckWord = {
  /** Stable across list edits: a hash of the term, so progress survives reordering. */
  id: string;
  term: string;
  /** Hiragana (JLPT), pinyin with tone marks (HSK) or the romanization of the pronunciation (TOPIK, hangul.ts). */
  reading: string;
  /** TOPIK only: the standard pronunciation in Hangul, where it differs from the spelling (읽다 → 익따). */
  pronunciation?: string;
  meaning: string;
  example: string;
  exampleReading: string;
  exampleMeaning: string;
  /** JLPT only: romaji of the word and the example. `answers`: the romaji (JLPT, kana) or romanization (TOPIK,
   * Hangul) spellings the quiz accepts. */
  romaji?: string;
  exampleRomaji?: string;
  answers?: string[];
  /** Kanji decks only: on readings (katakana), kun readings (hiragana, okurigana in parentheses: た(べる)) and up to three
   * example words; `reading` is the readings joined for display ("ショク / た(べる)"), `example` the first example word. */
  on?: string[];
  kun?: string[];
  examples?: { word: string; reading: string; meaning: string; romaji: string }[];
  /** Tone drill only: the word's syllables without tone marks, and each tone (5 = neutral). */
  syllables?: { base: string; tone: number }[];
};

/** The Pinyin workshop chart: initials × finals per group, and one checked example character per syllable. */
export type PinyinChart = {
  groups: Record<string, string[]>;
  chart: Record<string, { initial: string; cells: (string | null)[] }[]>;
  examples: Record<string, { char: string; pinyin: string; meaning: string }>;
};
/** HSK word decks (2026-11-19): a character first met in the lesson's words, with its pinyin readings (`reading` joins
 * them: "hǎo / hào"), a Mongolian meaning and up to three of the deck's words that hold it. Shown under the «Ханз» filter. */
export type DeckChar = { id: string; term: string; reading: string; readings: string[]; meaning: string; examples: { word: string; reading: string; meaning: string }[] };
/** Kana charts: the row's section and its cells in chart columns (null = empty cell). HSK word decks: `chars`. */
export type DeckLesson = { id: string; title: string; words: DeckWord[]; section?: "basic" | "voiced" | "combo"; cells?: (string | null)[]; chars?: DeckChar[] };
/** `lookalikes`: kana charts only, the ids of characters learners mix up. */
export type LanguageDeck = LanguageDeckInfo & { lessons: DeckLesson[]; lookalikes?: string[] };

/** A student's progress on one deck word; words never graded have no entry. */
export type DeckProgress = { box: number; correct: number; wrong: number; reviewedAt: string | null; dueAt: string | null };

/** Decks studied on the word-deck page (/labs/words/<id>) and shown as their own Workshop tiles. */
export const isStudyDeck = (deck: Pick<LanguageDeckInfo, "kind">) => deck.kind === "words" || deck.kind === "kanji";

/** A deck's tile in the Workshop tab. */
export type DeckSummary = LanguageDeckInfo & { lessons: number; words: number; started: number; mastered: number; due: number };

/** A quiz or card session sends at most this many grades. */
export const DECK_REVIEW_WORDS = 60;
export const isDeckWordId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{10}$/.test(value);
