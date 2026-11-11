// Builds a self-study quiz from the student's own saved words: which words to ask, in which form,
// with which wrong options, and how a typed answer is judged. Pure and random-injectable, so the
// shape is unit-tested. Grades go to the server afterwards as study progress, never as a score.

import type { VocabularyWord } from "./contracts";
import { isDue, isWeak, studyPriority } from "./study.ts";

export const QUIZ_COUNTS = [10, 20, 30] as const;
export type QuizCount = (typeof QUIZ_COUNTS)[number];

export const QUIZ_DIRECTIONS = ["mixed", "term-to-translation", "translation-to-term"] as const;
export type QuizDirection = (typeof QUIZ_DIRECTIONS)[number];
export type QuestionDirection = Exclude<QuizDirection, "mixed">;

/**
 * choice: pick one of four. typing: write the answer. truefalse: is this pairing right?
 * listening: hear the word, pick its meaning. cloze: fill the gap in the word's own example.
 * card: recall, flip, and grade yourself.
 */
export const QUIZ_KINDS = ["choice", "typing", "truefalse", "listening", "cloze", "card"] as const;
export type QuizKind = (typeof QUIZ_KINDS)[number];

/** Which words a session draws from. "smart" takes due, new and weak words first. */
export const QUIZ_SCOPES = ["smart", "all", "due", "new", "weak", "starred"] as const;
export type QuizScope = (typeof QUIZ_SCOPES)[number];

/** Seconds allowed per question; 0 is untimed. */
export const QUIZ_TIMERS = [0, 10, 20] as const;

/** A quiz needs enough words to offer believable choices. */
export const QUIZ_MIN_WORDS = 4;
export const TRUE_FALSE_OPTIONS = ["Зөв", "Буруу"] as const;
const TYPING_MAX = 48;
const GAP = "＿＿＿＿";

export type QuizWord = Pick<VocabularyWord, "id" | "term" | "translation" | "example">
  & Partial<Pick<VocabularyWord, "deckId" | "starred" | "box" | "correct" | "wrong" | "reviewedAt" | "dueAt">>;
export type QuizSpeech = { text: string; lang: string };
export type QuizQuestion = {
  id: string;
  wordId: string;
  kind: QuizKind;
  direction: QuestionDirection;
  /** The side shown to the student: a word, a meaning, or the example with a gap. */
  prompt: string;
  /** choice, listening and cloze: two to four options. truefalse: Зөв / Буруу. typing and card: none. */
  options: string[];
  /** Index of the right option, or -1 when there are no options. */
  answer: number;
  /** typing: every folded spelling that counts as right. */
  accepted: string[];
  /** truefalse: the pairing on offer. card: the hidden side. */
  claim: string | null;
  term: string;
  translation: string;
  example: string | null;
  /** How the word can be read aloud, or null when its script has no voice. */
  speech: QuizSpeech | null;
  /** A second ask of a word missed earlier in the same session; it does not change the grade. */
  retry: boolean;
};

const normal = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const study = (word: QuizWord) => ({ box: word.box ?? 0, correct: word.correct ?? 0, wrong: word.wrong ?? 0, reviewedAt: word.reviewedAt ?? null, dueAt: word.dueAt ?? null });

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** Usable, distinct words only. */
function clean(words: readonly QuizWord[]) {
  const pool: QuizWord[] = [];
  const ids = new Set<string>();
  for (const word of words) {
    if (!word || typeof word.id !== "string" || ids.has(word.id)) continue;
    if (!normal(word.term) || !normal(word.translation)) continue;
    ids.add(word.id);
    pool.push(word);
  }
  return pool;
}

/** The words a session may ask: one deck (or all, or the words in no deck), narrowed by scope. */
export function quizPool<T extends QuizWord>(words: readonly T[], filter: { scope: QuizScope; deckId?: string | null; now: number }): T[] {
  const inDeck = filter.deckId === undefined ? words : words.filter(word => (word.deckId ?? null) === filter.deckId);
  switch (filter.scope) {
    case "due": return inDeck.filter(word => isDue(study(word), filter.now));
    case "new": return inDeck.filter(word => (word.box ?? 0) === 0);
    case "weak": return inDeck.filter(word => isWeak(study(word)));
    case "starred": return inDeck.filter(word => word.starred === true);
    default: return [...inDeck];
  }
}

/** A language tag a browser voice can read the term in, or null (Cyrillic has no dependable voice). */
export function speechFor(term: string): QuizSpeech | null {
  const text = term.replace(/\s+/g, " ").trim();
  if (!text || text.length > 80) return null;
  if (/[぀-ヿ一-鿿]/.test(text)) return { text, lang: "ja-JP" };
  if (/[가-힯]/.test(text)) return { text, lang: "ko-KR" };
  if (/^[\p{Script=Latin}\d\s'’.,!?()&/-]+$/u.test(text) && /\p{Script=Latin}/u.test(text)) return { text, lang: "en-US" };
  return null;
}

/** The example with the term replaced by a gap, or null when the term is not in it as written. */
export function clozeText(example: string | null | undefined, term: string) {
  const source = example?.trim();
  const needle = term.trim();
  if (!source || needle.length < 2) return null;
  const at = source.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return null;
  // Part of a longer word ("art" inside "start") is not this term.
  const before = source[at - 1] ?? " ", after = source[at + needle.length] ?? " ";
  if (/[\p{L}\p{N}]/u.test(before) || /[\p{L}\p{N}]/u.test(after)) return null;
  return source.slice(0, at) + GAP + source.slice(at + needle.length);
}

const fold = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();

/**
 * Every spelling that counts for a typed answer: the whole text, and each alternative when a meaning
 * lists several ("тэсвэртэй, уян хатан"). Notes in brackets and a leading "to " are optional.
 */
export function acceptedAnswers(answer: string): string[] {
  const bare = answer.replace(/\([^)]*\)|\[[^\]]*\]/g, " ");
  const found = new Set<string>();
  for (const text of [answer, bare, ...bare.split(/[,;/]|\s(?:эсвэл|буюу|or)\s/i)]) {
    const value = fold(text);
    if (!value) continue;
    found.add(value);
    if (value.startsWith("to ") && value.length > 3) found.add(value.slice(3));
  }
  return [...found];
}

function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row++) {
    const current = [row];
    let best = row;
    for (let column = 1; column <= b.length; column++) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      const value = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
      current.push(value);
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

/** exact: right. close: one or two slips in a longer answer (counted right, graded "hard"). */
export function checkTyped(input: string, accepted: readonly string[]): "exact" | "close" | "wrong" {
  const typed = fold(input);
  if (!typed) return "wrong";
  if (accepted.includes(typed)) return "exact";
  for (const target of accepted) {
    const slips = target.length >= 9 ? 2 : target.length >= 5 ? 1 : 0;
    if (slips && distance(typed, target, slips) <= slips) return "close";
  }
  return "wrong";
}

/** The first letter and the shape of the rest: "r•••••••• •••". */
export function typingHint(answer: string) {
  const text = answer.trim();
  return [...text].map((letter, index) => index === 0 || letter === " " ? letter : "•").join("");
}

/** Wrong options a 50/50 hint removes: all but one of them. */
export function fiftyFifty(question: Pick<QuizQuestion, "options" | "answer">, random: () => number = Math.random) {
  const wrong = question.options.map((_, index) => index).filter(index => index !== question.answer);
  return shuffle(wrong, random).slice(0, Math.max(0, wrong.length - 1));
}

// Easier forms for words still being learned, recall-heavy forms once a word is familiar.
const KIND_WEIGHT: Record<QuizKind, readonly [number, number, number]> = {
  choice: [4, 3, 1], truefalse: [3, 2, 1], card: [3, 2, 1], listening: [2, 3, 3], cloze: [2, 3, 3], typing: [1, 3, 5],
};

export type BuildOptions = {
  count: number;
  direction: QuizDirection;
  random?: () => number;
  /** Question forms to mix; a word gets a form that suits it and its study box. Default: choice only. */
  kinds?: readonly QuizKind[];
  /** "smart" asks due, new and weak words first; "random" shuffles. */
  order?: "smart" | "random";
  /** Words to draw wrong options from; defaults to the pool itself. */
  bank?: readonly QuizWord[];
  /** Whether the browser has a voice for a language tag; without it there are no listening questions. */
  canSpeak?: (lang: string) => boolean;
  now?: number;
};

/**
 * Pick words, give each a question form and direction, and offer plausible wrong options from the
 * student's other words (same deck and similar length first). A question that cannot be fair
 * (a meaning shared by two words, too few options) is skipped or falls back to an easier form.
 */
export function buildQuiz(words: readonly QuizWord[], options: BuildOptions): QuizQuestion[] {
  const random = options.random ?? Math.random;
  const now = options.now ?? Date.now();
  const pool = clean(words);
  const bank = options.bank ? clean(options.bank) : pool;
  if (!pool.length || bank.length < QUIZ_MIN_WORDS) return [];
  const wanted: readonly QuizKind[] = options.kinds?.length ? options.kinds : ["choice"];
  const kinds = wanted.filter((kind, index, all) => QUIZ_KINDS.includes(kind) && all.indexOf(kind) === index);
  if (!kinds.length) return [];

  // A translation shared by two words cannot be a fair "which word is this?" prompt.
  const translationCounts = new Map<string, number>();
  const termCounts = new Map<string, number>();
  for (const word of bank) {
    translationCounts.set(normal(word.translation), (translationCounts.get(normal(word.translation)) ?? 0) + 1);
    termCounts.set(normal(word.term), (termCounts.get(normal(word.term)) ?? 0) + 1);
  }
  const sharedMeaning = (word: QuizWord) => (translationCounts.get(normal(word.translation)) ?? 0) > 1;

  const requested = Number.isFinite(options.count) ? Math.floor(options.count) : 10;
  const target = Math.max(1, Math.min(requested, pool.length));
  const ordered = options.order === "smart"
    ? pool.map(word => ({ word, rank: studyPriority(study(word), now) + random() * 12 })).sort((a, b) => b.rank - a.rank).map(item => item.word)
    : shuffle(pool, random);
  const picked = options.order === "smart" ? shuffle(ordered.slice(0, target), random) : ordered.slice(0, target);
  const questions: QuizQuestion[] = [];

  /** Up to three wrong options: other words' values, nearest in deck and length first. */
  function distractors(word: QuizWord, correct: string, side: (candidate: QuizWord) => string) {
    const seen = new Set([normal(correct)]);
    const candidates: { value: string; rank: number }[] = [];
    for (const candidate of shuffle(bank, random)) {
      if (candidate.id === word.id) continue;
      const value = side(candidate), key = normal(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const sameDeck = word.deckId !== undefined && (candidate.deckId ?? null) === (word.deckId ?? null) ? 0 : 1;
      candidates.push({ value, rank: sameDeck * 2 + Math.min(2, Math.floor(Math.abs(value.length - correct.length) / 6)) });
    }
    // Array.prototype.sort is stable, so the shuffle above breaks ties.
    return candidates.sort((a, b) => a.rank - b.rank).slice(0, 3).map(item => item.value);
  }

  for (const word of picked) {
    const speech = speechFor(word.term);
    const direction: QuestionDirection = options.direction === "mixed"
      ? (random() < 0.5 ? "term-to-translation" : "translation-to-term")
      : options.direction;
    const gap = clozeText(word.example, word.term);
    const typed = (side: QuestionDirection) => (side === "term-to-translation" ? word.translation : word.term).length <= TYPING_MAX;
    const fits: Record<QuizKind, boolean> = {
      choice: true,
      truefalse: true,
      card: true,
      listening: Boolean(speech && options.canSpeak?.(speech.lang)),
      cloze: Boolean(gap) && (termCounts.get(normal(word.term)) ?? 0) === 1,
      typing: typed(direction) || (options.direction === "mixed" && typed(direction === "term-to-translation" ? "translation-to-term" : "term-to-translation")),
    };
    const band = (word.box ?? 0) <= 1 ? 0 : (word.box ?? 0) <= 3 ? 1 : 2;
    const able = kinds.filter(kind => fits[kind]);
    // Every list of forms can fall back to a plain choice question.
    let kind: QuizKind = able.length ? able[able.length - 1] : "choice";
    const total = able.reduce((sum, item) => sum + KIND_WEIGHT[item][band], 0);
    let roll = random() * total;
    for (const item of able) {
      roll -= KIND_WEIGHT[item][band];
      if (roll < 0) { kind = item; break; }
    }

    let side = direction;
    if (kind === "listening") side = "term-to-translation";
    if (kind === "cloze") side = "translation-to-term";
    if (kind === "typing" && !typed(side)) side = side === "term-to-translation" ? "translation-to-term" : "term-to-translation";
    // Asking for the word from a meaning two words share has no single right answer.
    if (side === "translation-to-term" && kind !== "cloze" && kind !== "card" && sharedMeaning(word)) {
      if (options.direction === "translation-to-term") continue;
      side = "term-to-translation";
      if (kind === "typing" && !typed(side)) kind = "choice";
    }
    const asking = side === "term-to-translation" ? word.term : word.translation;
    const correct = side === "term-to-translation" ? word.translation : word.term;
    const otherSide = (candidate: QuizWord) => side === "term-to-translation" ? candidate.translation : candidate.term;
    const base = {
      id: "q" + (questions.length + 1), wordId: word.id, direction: side,
      term: word.term, translation: word.translation, example: word.example ?? null, speech, retry: false,
    };

    if (kind === "typing") {
      questions.push({ ...base, kind, prompt: asking, options: [], answer: -1, accepted: acceptedAnswers(correct), claim: null });
      continue;
    }
    if (kind === "card") {
      questions.push({ ...base, kind, prompt: asking, options: [], answer: -1, accepted: [], claim: correct });
      continue;
    }
    const wrong = distractors(word, correct, otherSide);
    if (!wrong.length) continue;
    if (kind === "truefalse") {
      const honest = random() < 0.5;
      questions.push({ ...base, kind, prompt: asking, options: [...TRUE_FALSE_OPTIONS], answer: honest ? 0 : 1, accepted: [], claim: honest ? correct : wrong[0] });
      continue;
    }
    const choices = shuffle([correct, ...wrong], random);
    questions.push({
      ...base, kind,
      prompt: kind === "cloze" ? gap! : asking,
      options: choices,
      answer: choices.findIndex(choice => normal(choice) === normal(correct)),
      accepted: [], claim: null,
    });
  }
  return questions;
}

/** A missed question asked once more at the end of the session, as a plain copy. */
export function retryOf(question: QuizQuestion, id: string): QuizQuestion {
  return { ...question, id, retry: true };
}

/** The question's instruction, kept beside the builder so the wording cannot drift. */
export function questionLead(direction: QuestionDirection, kind: QuizKind = "choice") {
  const meaning = direction === "term-to-translation";
  switch (kind) {
    case "typing": return meaning ? "Энэ үгийн орчуулгыг бич" : "Энэ орчуулгатай үгийг бич";
    case "truefalse": return "Энэ хослол зөв үү?";
    case "listening": return "Сонсоод орчуулгыг нь сонго";
    case "cloze": return "Хоосон зайд тохирох үгийг сонго";
    case "card": return meaning ? "Орчуулгыг нь санаж байна уу?" : "Энэ ямар үг вэ?";
    default: return meaning ? "Энэ үгийн орчуулга аль вэ?" : "Энэ орчуулга аль үг вэ?";
  }
}
