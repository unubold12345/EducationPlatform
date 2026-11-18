// The Kana test (owner request 2026-11-18: "make it simple, take an exam with all letters, mix with katakana"). Pure and
// client-safe: one kind of question only, a kana and four romaji to pick from. kana-quiz.tsx asks them.
import type { LanguageDeck } from "./catalog.ts";

export const KANA_SECTIONS = [{ id: "basic", label: "Үндсэн" }, { id: "voiced", label: "Дауны тэмдэг" }, { id: "combo", label: "Нийлмэл" }] as const;
export type KanaSection = (typeof KANA_SECTIONS)[number]["id"];
/** `all` = every chosen letter once. */
export const KANA_TEST_COUNTS = [10, 20, 50, "all"] as const;
export type KanaTestCount = (typeof KANA_TEST_COUNTS)[number];

export type KanaLetter = { id: string; deckId: string; kana: string; romaji: string; row: string; section: KanaSection };
export type KanaQuestion = { letter: KanaLetter; options: string[]; answer: number };

type Random = () => number;
const shuffle = <T,>(list: readonly T[], random: Random) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

/** Every letter of the given charts in the given sections. */
export function kanaLetters(scripts: readonly LanguageDeck[], sections: readonly KanaSection[]): KanaLetter[] {
  return scripts.flatMap(script => script.lessons.filter(lesson => lesson.section && sections.includes(lesson.section)).flatMap(lesson =>
    lesson.words.map(word => ({ id: word.id, deckId: script.id, kana: word.term, romaji: word.romaji ?? word.meaning, row: lesson.id, section: lesson.section! }))));
}

/**
 * The test: `count` letters (or all), each with its romaji and three other romaji, the same chart row first (the
 * sounds people mix up), then the chosen letters, then the whole chart. Two kana can share a romaji (お/を, じ/ぢ, ず/づ),
 * so options are distinct texts.
 */
export function buildKanaTest(letters: readonly KanaLetter[], count: KanaTestCount, everything: readonly KanaLetter[], random: Random = Math.random): KanaQuestion[] {
  const picked = shuffle(letters, random).slice(0, count === "all" ? letters.length : count);
  return picked.map(letter => {
    const seen = new Set([letter.romaji]);
    const wrong: string[] = [];
    const sameRow = letters.filter(other => other.row === letter.row && other.section === letter.section);
    for (const other of [...shuffle(sameRow, random).slice(0, 2), ...shuffle(letters, random), ...shuffle(everything, random)]) {
      if (seen.has(other.romaji)) continue;
      seen.add(other.romaji); wrong.push(other.romaji);
      if (wrong.length === 3) break;
    }
    const options = shuffle([letter.romaji, ...wrong], random);
    return { letter, options, answer: options.indexOf(letter.romaji) };
  });
}
