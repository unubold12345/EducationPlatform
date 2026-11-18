// Builds the TOPIK Workshop decks (Workshop → TOPIK): the Hangul chart deck and the TOPIK Ⅰ / Ⅱ word decks.
//
//   node scripts/build-topik-decks.mjs
//
// Word decks: drafts in MockExmps/Decks/topik-1.json and topik-2.json (never served; edit there, then re-run), shaped
// { id, note, lessons: [{ id, title, words: [{ term, pronunciation, sounds?, meaning, example, exampleMeaning }] }] }. TOPIK
// publishes no vocabulary list, so the terms are author-selected core words by topic, not an official syllabus. The
// romanization (`reading`, `exampleReading`) is computed from the Hangul by src/modules/language-decks/hangul.ts; the
// dictionary pronunciation in Hangul is kept only where it differs from the spelling. The site reads
// assets/language-decks/<id>.json (private, plan-gated on the server). No AI call is made here.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASIC_CONSONANTS, BASIC_VOWELS, COMPOUND_VOWELS, TENSE_CONSONANTS, compose, pronounce, romanize } from "../src/modules/language-decks/hangul.ts";

const DRAFTS = "MockExmps/Decks", OUT = "assets/language-decks";
const wordId = term => createHash("sha1").update(term).digest("hex").slice(0, 10);
const HANGUL = /^[가-힣 ]+$/;
const SENTENCE = /^[가-힣0-9 ,.?!~'"‘’“”·%()-]+$/;
const CYRILLIC = /[Ѐ-ӿ]/;
const DECKS = [
  { id: "topik-1", level: "TOPIK Ⅰ", title: "TOPIK Ⅰ", min: 450 },
  { id: "topik-2", level: "TOPIK Ⅱ", title: "TOPIK Ⅱ", min: 450 },
];
let failed = 0;

// Hangul chart deck: a row of the chart is a lesson; each syllable's romanization is its meaning, so the shared quiz
// asks syllable ↔ romanization (like the kana charts).
const syllable = (initial, vowel, final = "") => compose({ initial, vowel, final });
const rows = [
  { id: "vowels", title: "Үндсэн эгшиг", cells: BASIC_VOWELS.map(vowel => syllable("ㅇ", vowel)) },
  { id: "compound", title: "Нийлмэл эгшиг", cells: COMPOUND_VOWELS.map(vowel => syllable("ㅇ", vowel)) },
  ...BASIC_CONSONANTS.filter(letter => letter !== "ㅇ").map(letter => ({ id: "row-" + letter, title: letter + " мөр", cells: BASIC_VOWELS.map(vowel => syllable(letter, vowel)) })),
  ...TENSE_CONSONANTS.map(letter => ({ id: "row-" + letter, title: letter + " мөр", cells: BASIC_VOWELS.map(vowel => syllable(letter, vowel)) })),
  { id: "finals", title: "Патчим (төгсгөлийн гийгүүлэгч)", cells: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅇ"].map(final => syllable("ㅇ", "ㅏ", final)) },
];
const hangulLessons = rows.map(row => ({
  id: row.id, title: row.title, cells: row.cells,
  words: row.cells.map(char => {
    const roman = romanize(char);
    if (!/^[a-z]+$/.test(roman)) throw new Error(`hangul: ${char} → ${roman}`);
    return { id: wordId(char), term: char, reading: roman, meaning: roman, example: "", exampleReading: "", exampleMeaning: "", answers: [roman] };
  }),
}));
for (const lesson of hangulLessons) {
  const meanings = lesson.words.map(word => word.meaning);
  if (new Set(meanings).size !== meanings.length) throw new Error(`hangul ${lesson.id}: two cells read the same`);
}
writeFileSync(join(OUT, "hangul.json"), JSON.stringify({ id: "hangul", exam: "topik", level: "Hangul", title: "Хангыль", lang: "ko-KR", lessons: hangulLessons }) + "\n");
console.log(`wrote ${OUT}/hangul.json: ${hangulLessons.length} rows, ${hangulLessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} syllables`);

// Word decks.
const plain = text => text.normalize("NFD").replace(/[ᄁᄄᄈᄊᄍ]/g, char => ({ "ᄁ": "ᄀ", "ᄄ": "ᄃ", "ᄈ": "ᄇ", "ᄊ": "ᄉ", "ᄍ": "ᄌ" })[char]).normalize("NFC");
const seen = new Map();
for (const deck of DECKS) {
  const path = join(DRAFTS, deck.id + ".json");
  if (!existsSync(path)) { console.warn(`${path} missing`); failed++; continue; }
  const draft = JSON.parse(readFileSync(path, "utf8"));
  const problems = [], notes = [];
  const lessons = draft.lessons.map((lesson, index) => {
    if (lesson.id !== `l${String(index + 1).padStart(2, "0")}` || !CYRILLIC.test(lesson.title ?? "")) problems.push(`lesson ${index + 1}: id/title`);
    return {
      id: lesson.id, title: lesson.title.trim(),
      words: lesson.words.map(raw => {
        const word = Object.fromEntries(["term", "pronunciation", "meaning", "example", "exampleMeaning"].map(field => [field, String(raw[field] ?? "").trim()]));
        const where = `${deck.id}/${lesson.id} ${word.term}`;
        if (!HANGUL.test(word.term)) problems.push(`${where}: term`);
        if (seen.has(word.term)) problems.push(`${where}: also in ${seen.get(word.term)}`);
        seen.set(word.term, `${deck.id}/${lesson.id}`);
        const pronunciation = word.pronunciation.replace(/^\[|\]$/g, "");
        if (!HANGUL.test(pronunciation) || pronunciation.replace(/ /g, "").length !== word.term.replace(/ /g, "").length) problems.push(`${where}: pronunciation "${word.pronunciation}"`);
        else if (plain(pronunciation) !== plain(pronounce(word.term)) && plain(pronunciation) !== plain(word.term)) notes.push(`${where}: draft [${pronunciation}], rules [${pronounce(word.term)}]${raw.sounds ? `, romanized as ${romanize(raw.sounds)}` : ""}`);
        if (!CYRILLIC.test(word.meaning) || /[A-Za-z]{3,}/.test(word.meaning) || word.meaning.length > 60) problems.push(`${where}: meaning "${word.meaning}"`);
        if (!SENTENCE.test(word.example) || !/[.?!]$/.test(word.example) || word.example.length > 60) problems.push(`${where}: example "${word.example}"`);
        if (!CYRILLIC.test(word.exampleMeaning) || word.exampleMeaning.length > 160) problems.push(`${where}: exampleMeaning`);
        // `sounds`: a respelling that the romanization rules read correctly where they miss the dictionary
        // pronunciation (닭고기 → 닥고기, ㄴ-insertion 금융 → 금늉); applied to the example too, by term or verb stem.
        const sounds = String(raw.sounds ?? "").trim(), stem = text => word.term.endsWith("다") ? text.slice(0, -1) : text;
        let spokenExample = word.example;
        if (sounds) {
          if (!HANGUL.test(sounds) || sounds.length !== word.term.length) problems.push(`${where}: sounds "${sounds}"`);
          else if (word.example.includes(word.term)) spokenExample = word.example.replaceAll(word.term, sounds);
          else if (word.example.includes(stem(word.term))) spokenExample = word.example.replaceAll(stem(word.term), stem(sounds));
          else problems.push(`${where}: sounds not found in the example`);
        }
        const reading = romanize(sounds || word.term);
        return {
          id: wordId(word.term), term: word.term, reading, ...(pronunciation !== word.term ? { pronunciation } : {}), meaning: word.meaning,
          example: word.example, exampleReading: romanize(spokenExample), exampleMeaning: word.exampleMeaning, answers: [reading],
        };
      }),
    };
  });
  const total = lessons.reduce((sum, lesson) => sum + lesson.words.length, 0);
  if (total < deck.min) problems.push(`${deck.id}: ${total} words, expected at least ${deck.min}`);
  if (notes.length) console.log(`${deck.id}: ${notes.length} pronunciations differ from the rule-based one (check; tensification is ignored):\n  ${notes.join("\n  ")}`);
  if (problems.length) { console.warn(`${deck.id}: ${problems.length} problems\n  ${problems.join("\n  ")}`); failed++; continue; }
  writeFileSync(join(OUT, deck.id + ".json"), JSON.stringify({ id: deck.id, exam: "topik", level: deck.level, title: deck.title, lang: "ko-KR", lessons }) + "\n");
  console.log(`wrote ${OUT}/${deck.id}.json: ${lessons.length} lessons, ${total} words`);
}
process.exit(failed ? 1 : 0);
