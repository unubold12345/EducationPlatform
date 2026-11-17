// The JLPT/HSK word decks (Workshop → JLPT / HSK). Client-safe: names and shapes only. The words are private,
// plan-gated content read on the server from assets/language-decks/<id>.json (built by scripts/build-language-decks.mjs).

export const LANGUAGE_EXAMS = ["jlpt", "hsk"] as const;
export type LanguageExam = (typeof LANGUAGE_EXAMS)[number];
export const isLanguageExam = (value: unknown): value is LanguageExam => LANGUAGE_EXAMS.includes(value as LanguageExam);

/** Workshop's exam tabs (owner rule 2026-11-18: each exam shows only its own labs). */
export const WORKSHOP_EXAMS = [{ id: "ielts", label: "IELTS" }, { id: "jlpt", label: "JLPT" }, { id: "hsk", label: "HSK" }] as const;
export type WorkshopExam = (typeof WORKSHOP_EXAMS)[number]["id"];
export const WORKSHOP_EXAM_COOKIE = "workshop-exam";

// kind: "words" decks are tiles of their own; "kana" decks are the Kana workshop's two charts (/labs/kana).
export const LANGUAGE_DECKS = [
  { id: "jlpt-n5", exam: "jlpt", kind: "words", level: "N5", title: "JLPT N5", lang: "ja-JP" },
  { id: "jlpt-n4", exam: "jlpt", kind: "words", level: "N4", title: "JLPT N4", lang: "ja-JP" },
  { id: "hsk-1", exam: "hsk", kind: "words", level: "HSK 1", title: "HSK 1", lang: "zh-CN" },
  { id: "hsk-2", exam: "hsk", kind: "words", level: "HSK 2", title: "HSK 2", lang: "zh-CN" },
  { id: "kana-hiragana", exam: "jlpt", kind: "kana", level: "Kana", title: "Хирагана", lang: "ja-JP" },
  { id: "kana-katakana", exam: "jlpt", kind: "kana", level: "Kana", title: "Катакана", lang: "ja-JP" },
  // The Pinyin workshop's tone drill (/labs/pinyin): HSK 1/2 words split into syllables with tones.
  { id: "hsk-tones", exam: "hsk", kind: "tones", level: "Pinyin", title: "Аялгуу таних", lang: "zh-CN" },
] as const satisfies readonly { id: string; exam: LanguageExam; kind: "words" | "kana" | "tones"; level: string; title: string; lang: string }[];
export type LanguageDeckId = (typeof LANGUAGE_DECKS)[number]["id"];
export type LanguageDeckInfo = (typeof LANGUAGE_DECKS)[number];
export const findLanguageDeck = (id: string): LanguageDeckInfo | undefined => LANGUAGE_DECKS.find(deck => deck.id === id);

/** How the reading aid is named per exam: furigana for Japanese, pinyin for Chinese. */
export const READING_LABEL: Record<LanguageExam, string> = { jlpt: "ふりがな", hsk: "Pinyin" };

export type DeckWord = {
  /** Stable across list edits: a hash of the term, so progress survives reordering. */
  id: string;
  term: string;
  /** Hiragana (JLPT) or pinyin with tone marks (HSK). */
  reading: string;
  meaning: string;
  example: string;
  exampleReading: string;
  exampleMeaning: string;
  /** JLPT only: romaji of the word and the example, and the romaji spellings the quiz accepts. */
  romaji?: string;
  exampleRomaji?: string;
  answers?: string[];
  /** Tone drill only: the word's syllables without tone marks, and each tone (5 = neutral). */
  syllables?: { base: string; tone: number }[];
};

/** The Pinyin workshop chart: initials × finals per group, and one checked example character per syllable. */
export type PinyinChart = {
  groups: Record<string, string[]>;
  chart: Record<string, { initial: string; cells: (string | null)[] }[]>;
  examples: Record<string, { char: string; pinyin: string; meaning: string }>;
};
/** Kana charts: the row's section and its cells in chart columns (null = empty cell). */
export type DeckLesson = { id: string; title: string; words: DeckWord[]; section?: "basic" | "voiced" | "combo"; cells?: (string | null)[] };
/** `lookalikes`: kana charts only, the ids of characters learners mix up. */
export type LanguageDeck = LanguageDeckInfo & { lessons: DeckLesson[]; lookalikes?: string[] };

/** A student's progress on one deck word; words never graded have no entry. */
export type DeckProgress = { box: number; correct: number; wrong: number; reviewedAt: string | null; dueAt: string | null };

/** A deck's tile in the Workshop tab. */
export type DeckSummary = LanguageDeckInfo & { lessons: number; words: number; started: number; mastered: number; due: number };

/** A quiz or card session sends at most this many grades. */
export const DECK_REVIEW_WORDS = 60;
export const isDeckWordId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{10}$/.test(value);
