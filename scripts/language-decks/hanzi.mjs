// The characters of the HSK 1 and HSK 2 word lists, shown in the HSK word decks under the «Ханз» filter (2026-11-19;
// owner: the characters come from the vocabulary, so they belong in the vocabulary decks, not in decks of their own, and
// without a writing drill). HSK 3.0 asks for 246 characters to read at HSK 1 and 371 by HSK 2; the official character
// lists were not available here, so these are every character of the HSK 1 words (248) and the new ones of the HSK 2
// words (123; 371 together). Each sits in the word-deck lesson where its first word is, in word order. Pinyin and
// Mongolian meanings are drafted by scripts/build-language-decks.mjs and kept for teacher review in
// MockExmps/Decks/hsk-hanzi-<level>.json; the example words are the deck's own words.
import { DECKS } from "./lists.mjs";

const HAN = /\p{Script=Han}/u;

const seen = new Set();
export const HSK_CHARACTERS = [["hsk-hanzi-1", "hsk-1"], ["hsk-hanzi-2", "hsk-2"]].map(([draft, deck]) => ({
  draft, deck,
  lessons: DECKS.find(item => item.id === deck).lessons.map(lesson => {
    const terms = [];
    for (const term of lesson.terms) for (const char of term) if (HAN.test(char) && !seen.has(char)) { seen.add(char); terms.push(char); }
    return { id: lesson.id, title: lesson.title, terms };
  }),
}));
