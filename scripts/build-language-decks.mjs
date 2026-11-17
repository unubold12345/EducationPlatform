// Builds the JLPT/HSK word decks served in Workshop → JLPT / HSK.
//
//   node --env-file=.env.local scripts/build-language-decks.mjs --draft   drafts missing lessons with DeepSeek
//   node scripts/build-language-decks.mjs                                  validates the drafts and writes assets/
//
// Terms come from scripts/language-decks/lists.mjs. Drafts (reading, Mongolian meaning, example and its reading and
// meaning) are kept per deck in MockExmps/Decks/<id>.json, an offline pack for teacher review that is never served; a
// teacher's fix goes there and survives re-runs, because only lessons without a draft are sent to DeepSeek. The site
// reads assets/language-decks/<id>.json (private, plan-gated on the server).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DECKS } from "./language-decks/lists.mjs";
import { KANA_SCRIPTS } from "./language-decks/kana.mjs";
import { kanaToRomaji, romajiVariants } from "../src/modules/language-decks/romaji.ts";

// Word romaji comes from the kana reading; a greeting that ends in the particle は is read "wa".
const WORD_ROMAJI = { "こんにちは": "konnichiwa", "こんばんは": "konbanwa" };
const ROMAJI = /^[a-z' ,.?!-]+$/;

const DRAFTS = "MockExmps/Decks", OUT = "assets/language-decks";
const draftMode = process.argv.includes("--draft");
const wordId = term => createHash("sha1").update(term).digest("hex").slice(0, 10);
const readJson = path => existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;

const KANA = /^[぀-ヿー・ ]+$/;
const PINYIN = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' ,.!?·-]+$/i;
const CYRILLIC = /[Ѐ-ӿ]/;

function rules(deck) {
  const ja = deck.exam === "jlpt";
  return [
    `You write study entries for Mongolian learners preparing for ${deck.title}. For each term, in the given order, return:`,
    ja ? `- "reading": the term's reading in hiragana (for a katakana word, repeat the katakana).`
       : `- "reading": the term's Hanyu Pinyin with tone marks, syllables of one word written together (e.g. "bàba", "dǎ diànhuà").`,
    `- "meaning": the Mongolian (Cyrillic) meaning, short, like a dictionary gloss (1–4 words; separate distinct senses with "; ").`,
    `  For particles, greetings and grammar words give a short gloss and a note in parentheses, e.g. "(асуух сул үг)".`,
    `- "example": one short, natural sentence a ${deck.level} learner can read, using only ${deck.level}-level words and grammar.`,
    `  Include the term exactly as written whenever grammar allows (a verb may appear in its dictionary or polite form).`,
    ja ? `- "exampleReading": the whole example in hiragana (katakana words stay katakana), no spaces.`
       : `- "exampleReading": the whole example in pinyin with tone marks, words separated by spaces.`,
    `- "exampleMeaning": a natural Mongolian translation of the example.`,
    `Use Mongolian Cyrillic only for "meaning" and "exampleMeaning". Keep "term" exactly as given.`,
    `Return ONE JSON object: {"words":[{"term":"…","reading":"…","meaning":"…","example":"…","exampleReading":"…","exampleMeaning":"…"}]}.`,
  ].join("\n");
}

async function deepseek(messages) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set (run with --env-file=.env.local).");
  const response = await fetch((process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com") + "/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(240_000),
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || "deepseek-flash", thinking: { type: "enabled" }, max_tokens: 16000, response_format: { type: "json_object" }, messages }),
  });
  if (!response.ok) throw new Error("DeepSeek HTTP " + response.status);
  return JSON.parse((await response.json()).choices[0].message.content);
}

// Example-sentence romaji (2026-11-18): word spacing and the particles は/へ/を (wa/e/o) need the sentence's grammar,
// so it is drafted, then compared with a plain kana conversion of the example's reading.
const ROMAJI_RULES = [
  "Write each Japanese sentence in romaji for beginners, using its hiragana reading.",
  "Rules: lowercase; words separated by spaces, particles as separate words; particles は→wa, へ→e, を→o;",
  "no macrons: write long vowels as typed (おう→ou, ええ→ee, ー→the vowel doubled); っ doubles the next consonant (っち→tchi);",
  "ん before a vowel or y → n'. Keep the sentence's punctuation as , . ? !",
  'The input is a JSON list of items; an item may hold two short sentences. Return ONE JSON object {"romaji":["…", …]}',
  "with exactly one string per item, in the same order, never splitting an item.",
].join("\n");
const squash = text => text.toLowerCase().replace(/[^a-z]/g, "");
function similar(a, b) {
  const x = squash(a), y = squash(b);
  let previous = Array.from({ length: y.length + 1 }, (_, index) => index);
  for (let row = 1; row <= x.length; row++) {
    const current = [row];
    for (let column = 1; column <= y.length; column++) current.push(Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + (x[row - 1] === y[column - 1] ? 0 : 1)));
    previous = current;
  }
  return 1 - previous[y.length] / Math.max(1, x.length, y.length);
}
async function draftRomaji(lesson) {
  const words = lesson.words;
  const data = await deepseek([{ role: "system", content: ROMAJI_RULES }, { role: "user", content: JSON.stringify({ count: words.length, items: words.map(word => ({ sentence: word.example, reading: word.exampleReading })) }) }]);
  if (!Array.isArray(data.romaji) || data.romaji.length !== words.length) throw new Error(`romaji: expected ${words.length}, got ${data.romaji?.length}`);
  return data.romaji.map((value, index) => {
    const romaji = String(value).trim().toLowerCase();
    if (!ROMAJI.test(romaji)) throw new Error(`romaji "${romaji}"`);
    if (similar(romaji, kanaToRomaji(words[index].exampleReading)) < 0.85) throw new Error(`romaji drifts from the reading: ${words[index].exampleReading} → ${romaji}`);
    return romaji;
  });
}

async function draftLesson(deck, lesson) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set (run with --env-file=.env.local).");
  const response = await fetch((process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com") + "/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(240_000),
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash", thinking: { type: "enabled" }, max_tokens: 16000,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: rules(deck) }, { role: "user", content: `Lesson topic: ${lesson.title}\nTerms:\n${lesson.terms.join("\n")}` }],
    }),
  });
  if (!response.ok) throw new Error(`${deck.id}/${lesson.id}: DeepSeek HTTP ${response.status}`);
  const data = await response.json();
  const words = JSON.parse(data.choices[0].message.content).words;
  const problems = check(deck, lesson, words);
  if (problems.length) throw new Error(`${deck.id}/${lesson.id}: ${problems.slice(0, 5).join("; ")}`);
  return words.map(word => pick(word));
}

const FIELDS = ["term", "reading", "meaning", "example", "exampleReading", "exampleMeaning"];
/** JLPT words: romaji of the word and the example, and the spellings a quiz accepts when the word is typed. */
function romajiFields(deck, word) {
  if (deck.exam !== "jlpt") return {};
  const romaji = WORD_ROMAJI[word.term] ?? kanaToRomaji(word.reading);
  return { romaji, exampleRomaji: word.exampleRomaji, answers: [romaji, ...romajiVariants(romaji)] };
}
const pick = word => Object.fromEntries(FIELDS.map(field => [field, String(word[field] ?? "").trim()]));

function check(deck, lesson, words) {
  const problems = [];
  if (!Array.isArray(words) || words.length !== lesson.terms.length) return [`expected ${lesson.terms.length} words, got ${words?.length}`];
  words.forEach((raw, index) => {
    const word = pick(raw), term = lesson.terms[index];
    if (word.term !== term) problems.push(`#${index + 1} term ${word.term} ≠ ${term}`);
    for (const field of FIELDS) if (!word[field]) problems.push(`${term}: empty ${field}`);
    if (!(deck.exam === "jlpt" ? KANA : PINYIN).test(word.reading)) problems.push(`${term}: reading "${word.reading}"`);
    if (!CYRILLIC.test(word.meaning) || /[A-Za-z]{3,}/.test(word.meaning)) problems.push(`${term}: meaning "${word.meaning}"`);
    if (!CYRILLIC.test(word.exampleMeaning)) problems.push(`${term}: exampleMeaning`);
    if (word.example.length > 60 || word.exampleMeaning.length > 160) problems.push(`${term}: example too long`);
  });
  return problems;
}

async function pool(tasks, size) {
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (next < tasks.length) { const index = next++; results[index] = await tasks[index](); } }));
  return results;
}

mkdirSync(DRAFTS, { recursive: true });
mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const deck of DECKS) {
  const path = join(DRAFTS, deck.id + ".json");
  const draft = readJson(path) ?? { id: deck.id, note: "Draft study entries (DeepSeek), awaiting teacher review. Edit here; re-run the build to publish.", lessons: {} };
  const missing = deck.lessons.filter(lesson => !draft.lessons[lesson.id] || draft.lessons[lesson.id].words.map(word => word.term).join(" ") !== lesson.terms.join(" "));
  if (missing.length && draftMode) {
    await pool(missing.map(lesson => async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          draft.lessons[lesson.id] = { title: lesson.title, words: await draftLesson(deck, lesson) };
          writeFileSync(path, JSON.stringify(draft, null, 1) + "\n");
          console.log(`drafted ${deck.id}/${lesson.id} (${lesson.terms.length} words)`);
          return;
        } catch (error) { console.warn(`retry ${attempt}: ${error.message}`); }
      }
      failed++;
    }), 4);
  }
  if (deck.exam === "jlpt" && draftMode) {
    const bare = deck.lessons.filter(lesson => draft.lessons[lesson.id]?.words.some(word => !word.exampleRomaji));
    await pool(bare.map(lesson => async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const romaji = await draftRomaji(draft.lessons[lesson.id]);
          draft.lessons[lesson.id].words.forEach((word, index) => { word.exampleRomaji = romaji[index]; });
          writeFileSync(path, JSON.stringify(draft, null, 1) + "\n");
          console.log(`romaji ${deck.id}/${lesson.id}`);
          return;
        } catch (error) { console.warn(`romaji retry ${attempt} ${deck.id}/${lesson.id}: ${error.message}`); }
      }
      failed++;
    }), 4);
  }
  const ready = deck.lessons.every(lesson => draft.lessons[lesson.id]?.words.length === lesson.terms.length);
  if (!ready) { console.warn(`${deck.id}: drafts incomplete; run with --draft`); failed++; continue; }
  const problems = deck.lessons.flatMap(lesson => check(deck, lesson, draft.lessons[lesson.id].words));
  if (deck.exam === "jlpt") for (const lesson of deck.lessons) for (const word of draft.lessons[lesson.id].words) if (!ROMAJI.test(word.exampleRomaji ?? "")) problems.push(`${word.term}: exampleRomaji missing (run with --draft)`);
  if (problems.length) { console.warn(`${deck.id}: ${problems.length} problems\n  ${problems.join("\n  ")}`); failed++; continue; }
  const out = {
    id: deck.id, exam: deck.exam, level: deck.level, title: deck.title, lang: deck.lang,
    lessons: deck.lessons.map(lesson => ({ id: lesson.id, title: lesson.title, words: draft.lessons[lesson.id].words.map(word => ({ id: wordId(word.term), ...pick(word), ...romajiFields(deck, word) })) })),
  };
  writeFileSync(join(OUT, deck.id + ".json"), JSON.stringify(out) + "\n");
  console.log(`wrote ${OUT}/${deck.id}.json: ${out.lessons.length} lessons, ${out.lessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} words`);
}
// Kana charts: no AI. A row is a lesson; each kana's romaji is its meaning, so the shared cards and quiz ask kana ↔ romaji.
const KANA_EXTRA = { "を": ["wo"], "ヲ": ["wo"], "ぢ": ["di"], "ヂ": ["di"], "づ": ["du"], "ヅ": ["du"], "ん": ["nn"], "ン": ["nn"] };
for (const script of KANA_SCRIPTS) {
  const lessons = script.rows.map(row => ({
    id: row.id, title: row.cells.find(Boolean) + " мөр", section: row.section, cells: row.cells,
    words: row.cells.filter(Boolean).map(kana => {
      const romaji = kanaToRomaji(kana);
      if (!/^[a-z]+$/.test(romaji)) throw new Error(`${script.id}: ${kana} → ${romaji}`);
      return { id: wordId(kana), term: kana, reading: romaji, meaning: romaji, example: "", exampleReading: "", exampleMeaning: "", romaji,
        answers: [...new Set([romaji, ...romajiVariants(romaji), ...(KANA_EXTRA[kana] ?? [])])] };
    }),
  }));
  const ids = new Set(lessons.flatMap(lesson => lesson.words.map(word => word.id)));
  const lookalikes = script.lookalikes.map(wordId);
  if (lookalikes.some(id => !ids.has(id))) throw new Error(script.id + ": a look-alike is not in the chart");
  writeFileSync(join(OUT, script.id + ".json"), JSON.stringify({ id: script.id, exam: "jlpt", level: "Kana", title: script.title, lang: "ja-JP", lookalikes, lessons }) + "\n");
  console.log(`wrote ${OUT}/${script.id}.json: ${lessons.length} rows, ${ids.size} kana`);
}
// Pinyin workshop (HSK): the chart and the tone-drill deck, from MockExmps/Decks/pinyin.json (build_pinyin.py).
const pinyin = readJson(join(DRAFTS, "pinyin.json"));
if (!pinyin) { console.warn("MockExmps/Decks/pinyin.json missing: run build_pinyin.py"); failed++; }
else {
  const cells = Object.values(pinyin.chart).flatMap(rows => rows.flatMap(row => row.cells.filter(Boolean)));
  if (cells.some(cell => !pinyin.examples[cell]?.char)) { console.warn("pinyin: a chart syllable has no example character"); failed++; }
  writeFileSync(join(OUT, "pinyin-chart.json"), JSON.stringify({ groups: pinyin.groups, chart: pinyin.chart, examples: pinyin.examples }) + "\n");
  const lessons = ["hsk-1", "hsk-2"].map((deck, index) => ({
    id: deck, title: index ? "HSK 2" : "HSK 1",
    words: pinyin.drill.filter(word => word.deck === deck).map(word => ({
      id: word.id, term: word.term, reading: word.syllables.map(item => item.base).join(" "), meaning: word.meaning,
      example: "", exampleReading: "", exampleMeaning: "", syllables: word.syllables,
    })),
  }));
  if (lessons.some(lesson => lesson.words.some(word => !word.syllables.length || word.syllables.length !== [...word.term].length))) { console.warn("pinyin: a drill word's syllables do not match its characters"); failed++; }
  writeFileSync(join(OUT, "hsk-tones.json"), JSON.stringify({ id: "hsk-tones", exam: "hsk", level: "Pinyin", title: "Аялгуу таних", lang: "zh-CN", lessons }) + "\n");
  console.log(`wrote ${OUT}/pinyin-chart.json: ${cells.length} syllables; hsk-tones.json: ${lessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} words`);
}
process.exit(failed ? 1 : 0);
