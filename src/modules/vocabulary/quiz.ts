// Builds a self-study multiple-choice quiz from the student's own saved words. Pure and random
// injectable, so the shape is unit-tested; the score never leaves the browser.

import type { VocabularyWord } from "./contracts";

export const QUIZ_COUNTS = [10, 20, 30] as const;
export type QuizCount = (typeof QUIZ_COUNTS)[number];

export const QUIZ_DIRECTIONS = ["mixed", "term-to-translation", "translation-to-term"] as const;
export type QuizDirection = (typeof QUIZ_DIRECTIONS)[number];
export type QuestionDirection = Exclude<QuizDirection, "mixed">;

/** A quiz needs enough words to offer believable choices. */
export const QUIZ_MIN_WORDS = 4;

export type QuizWord = Pick<VocabularyWord, "id" | "term" | "translation" | "example">;
export type QuizQuestion = {
  id: string;
  wordId: string;
  direction: QuestionDirection;
  /** The side shown to the student: a word when asking for its meaning, or a meaning when asking for the word. */
  prompt: string;
  options: string[];
  answer: number;
  term: string;
  translation: string;
  example: string | null;
};

const normal = (value: string) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Pick words, choose one direction each, and offer three plausible distractors from the same
 * field of other saved words. A question with fewer than two distinct options is skipped.
 */
export function buildQuiz(
  words: readonly QuizWord[],
  options: { count: number; direction: QuizDirection; random?: () => number },
): QuizQuestion[] {
  const random = options.random ?? Math.random;
  const pool: QuizWord[] = [];
  const ids = new Set<string>();
  for (const word of words) {
    if (!word || typeof word.id !== "string" || ids.has(word.id)) continue;
    if (!normal(word.term) || !normal(word.translation)) continue;
    ids.add(word.id);
    pool.push(word);
  }
  if (pool.length < QUIZ_MIN_WORDS) return [];

  // A translation shared by two words cannot be a fair "which word is this?" prompt.
  const translationCounts = new Map<string, number>();
  for (const word of pool) {
    const key = normal(word.translation);
    translationCounts.set(key, (translationCounts.get(key) ?? 0) + 1);
  }

  const requested = Number.isFinite(options.count) ? Math.floor(options.count) : 10;
  const target = Math.max(1, Math.min(requested, pool.length));
  const picked = shuffle(pool, random).slice(0, target);
  const questions: QuizQuestion[] = [];

  for (const word of picked) {
    const direction: QuestionDirection = options.direction === "mixed"
      ? (random() < 0.5 ? "term-to-translation" : "translation-to-term")
      : options.direction;
    if (direction === "translation-to-term" && (translationCounts.get(normal(word.translation)) ?? 0) > 1) continue;
    const asking = direction === "term-to-translation" ? word.term : word.translation;
    const correct = direction === "term-to-translation" ? word.translation : word.term;
    const otherSide = (candidate: QuizWord) => direction === "term-to-translation" ? candidate.translation : candidate.term;

    const seen = new Set([normal(correct)]);
    const distractors: string[] = [];
    for (const candidate of shuffle(pool, random)) {
      if (candidate.id === word.id) continue;
      const value = otherSide(candidate);
      const key = normal(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      distractors.push(value);
      if (distractors.length === 3) break;
    }
    const choices = shuffle([correct, ...distractors], random);
    if (choices.length < 2) continue;
    questions.push({
      id: "q" + (questions.length + 1),
      wordId: word.id,
      direction,
      prompt: asking,
      options: choices,
      answer: choices.findIndex(choice => normal(choice) === normal(correct)),
      term: word.term,
      translation: word.translation,
      example: word.example ?? null,
    });
  }
  return questions;
}

/** The question's instruction, kept beside the builder so the wording cannot drift. */
export function questionLead(direction: QuestionDirection) {
  return direction === "term-to-translation" ? "Энэ үгийн орчуулга аль вэ?" : "Энэ орчуулга аль үг вэ?";
}
