// Builds the JLPT/HSK word decks (the HSK ones with their characters) and the JLPT kanji decks served in Workshop → JLPT / HSK.
//
//   node --env-file=.env.local scripts/build-language-decks.mjs --draft   drafts missing lessons with DeepSeek
//   node scripts/build-language-decks.mjs                                  validates the drafts and writes assets/
//
// Terms come from scripts/language-decks/lists.mjs. Drafts (reading, Mongolian meaning, example and its reading and
// meaning) are kept per deck in MockExmps/Decks/<id>.json, an offline pack for teacher review that is never served; a
// teacher's fix goes there and survives re-runs, because only lessons without a draft are sent to DeepSeek, and only the terms
// no deck of the same exam has drafted yet (an entry is reused by term when a list changes; a deck's `notes` sense is
// always drafted afresh). The site
// reads assets/language-decks/<id>.json (private, plan-gated on the server).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DECKS } from "./language-decks/lists.mjs";
import { KANA_SCRIPTS } from "./language-decks/kana.mjs";
import { KANJI_DECKS } from "./language-decks/kanji.mjs";
import { HSK_CHARACTERS } from "./language-decks/hanzi.mjs";
import { kanaToRomaji, romajiVariants, toHiragana } from "../src/modules/language-decks/romaji.ts";
import { markTone } from "../src/modules/language-decks/tones.ts";
import { aiFetch } from "./lib/ai-call.mjs";

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
  // Logged in the AI usage log (scripts/lib/ai-call.mjs), like every paid call.
  const response = await aiFetch("deepseek", (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com") + "/chat/completions", {
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

/** Drafts `lesson.terms` (only the ones no draft has yet); `deck.notes` gives DeepSeek the sense for a term. */
async function draftLesson(deck, lesson) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set (run with --env-file=.env.local).");
  const response = await aiFetch("deepseek", (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com") + "/chat/completions", {
    method: "POST", signal: AbortSignal.timeout(240_000),
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash", thinking: { type: "enabled" }, max_tokens: 16000,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: rules(deck) }, { role: "user", content: `Lesson topic: ${lesson.title}\nTerms:\n${lesson.terms.map(term => deck.notes?.[term] ? `${term} (sense: ${deck.notes[term]})` : term).join("\n")}` }],
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
    if (deck.exam === "hsk" && !/^[\p{Script=Han}，。？！、：；“”‘’《》（）0-9０-９…—\s]+$/u.test(word.example)) problems.push(`${term}: example is not in characters "${word.example}"`);
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
  // Entries already drafted for this exam, by term (snapshot before this deck's lessons are rewritten).
  const known = new Map();
  for (const other of DECKS.filter(item => item.exam === deck.exam)) {
    const file = other.id === deck.id ? draft : readJson(join(DRAFTS, other.id + ".json"));
    for (const lesson of Object.values(file?.lessons ?? {})) for (const word of lesson.words) if (!known.has(word.term)) known.set(word.term, structuredClone(word));
  }
  for (const term of Object.keys(deck.notes ?? {})) known.delete(term);
  if (missing.length && draftMode) {
    await pool(missing.map(lesson => async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const fresh = lesson.terms.filter(term => !known.has(term));
          const drafted = fresh.length ? await draftLesson(deck, { ...lesson, terms: fresh }) : [];
          const words = lesson.terms.map(term => known.get(term) ?? drafted[fresh.indexOf(term)]);
          draft.lessons[lesson.id] = { title: lesson.title, words };
          writeFileSync(path, JSON.stringify(draft, null, 1) + "\n");
          console.log(`drafted ${deck.id}/${lesson.id} (${lesson.terms.length} words, ${fresh.length} new)`);
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
// Kanji decks (2026-11-19): on/kun readings, Mongolian meaning and two example words drafted per lesson by DeepSeek into
// MockExmps/Decks/jlpt-kanji-<level>.json. Example words are taken from the reviewed N5/N4 word decks first (words whose
// kanji are all at the level or below), and the drafted ones only fill the remaining places.
const ON = /^[ァ-ヺー]+$/, KUN = /^[ぁ-ゖ]+(\([ぁ-ゖ]+\))?$/, HIRAGANA = /^[ぁ-ゖー]+$/;
const HAN = /\p{Script=Han}/u;
function kanjiRules(deck) {
  return [
    `You write kanji study entries for Mongolian learners preparing for JLPT ${deck.level}. For each kanji, in the given order, return:`,
    `- "on": its on-yomi in katakana, only the readings a ${deck.level} learner meets in common words (0–3), most common first.`,
    `- "kun": its kun-yomi in hiragana, only common ones (0–4), most common first; write okurigana in parentheses, e.g. "た(べる)", "おお(きい)", "ひと".`,
    `  Do not use dots or dashes. Leave out readings used only in names or rare words.`,
    `- "meaning": the kanji's core meaning in Mongolian Cyrillic, short like a dictionary gloss (1–4 words; separate senses with "; ").`,
    `- "examples": two very common words that contain this kanji exactly once, ideally ${deck.level}-level words, each {"word","reading","meaning"}:`,
    `  "reading" is the whole word in hiragana, "meaning" a short Mongolian Cyrillic gloss.`,
    `Use Mongolian Cyrillic only for "meaning" fields. Keep "term" exactly as given.`,
    `Return ONE JSON object: {"kanji":[{"term":"…","on":["…"],"kun":["…"],"meaning":"…","examples":[{"word":"…","reading":"…","meaning":"…"}]}]}.`,
  ].join("\n");
}
const pickKanji = raw => ({
  term: String(raw?.term ?? "").trim(), on: (raw?.on ?? []).map(value => String(value).trim()).filter(Boolean), kun: (raw?.kun ?? []).map(value => String(value).trim()).filter(Boolean),
  meaning: String(raw?.meaning ?? "").trim(), examples: (raw?.examples ?? []).map(item => ({ word: String(item?.word ?? "").trim(), reading: String(item?.reading ?? "").trim(), meaning: String(item?.meaning ?? "").trim() })),
});
const mongolian = text => CYRILLIC.test(text) && !/[A-Za-z]{3,}/.test(text);
function checkKanji(lesson, entries) {
  if (!Array.isArray(entries) || entries.length !== lesson.terms.length) return [`expected ${lesson.terms.length} kanji, got ${entries?.length}`];
  const problems = [];
  entries.forEach((raw, index) => {
    const entry = pickKanji(raw), term = lesson.terms[index];
    if (entry.term !== term) problems.push(`#${index + 1} term ${entry.term} ≠ ${term}`);
    if (!entry.on.length && !entry.kun.length) problems.push(`${term}: no reading`);
    if (entry.on.length > 3 || entry.kun.length > 4) problems.push(`${term}: too many readings`);
    for (const on of entry.on) if (!ON.test(on)) problems.push(`${term}: on "${on}"`);
    for (const kun of entry.kun) if (!KUN.test(kun)) problems.push(`${term}: kun "${kun}"`);
    if (!mongolian(entry.meaning)) problems.push(`${term}: meaning "${entry.meaning}"`);
    if (entry.examples.length < 2) problems.push(`${term}: examples`);
    for (const example of entry.examples) {
      if (example.word.split(term).length !== 2) problems.push(`${term}: example "${example.word}"`);
      if (!HIRAGANA.test(example.reading) || !mongolian(example.meaning)) problems.push(`${term}: example ${example.word} ${example.reading} ${example.meaning}`);
    }
  });
  return problems;
}
async function draftKanji(deck, lesson) {
  const data = await deepseek([{ role: "system", content: kanjiRules(deck) }, { role: "user", content: `Lesson topic: ${lesson.title}\nKanji:\n${lesson.terms.join("\n")}` }]);
  const problems = checkKanji(lesson, data.kanji);
  if (problems.length) throw new Error(`${deck.id}/${lesson.id}: ${problems.slice(0, 5).join("; ")}`);
  return data.kanji.map(pickKanji);
}
/** Every spelling a quiz accepts for "type one reading": each on (katakana, hiragana, romaji) and each kun (whole word and stem). */
function kanjiAnswers(entry) {
  const kana = [...entry.on.flatMap(on => [on, toHiragana(on)]), ...entry.kun.flatMap(kun => [kun.replace(/[()]/g, ""), kun.replace(/\(.*\)/, "")])];
  const romaji = kana.map(kanaToRomaji);
  return [...new Set([...kana, ...romaji, ...romaji.flatMap(romajiVariants)])];
}
// Whether a word's reading uses one of the kanji's listed readings (also voiced or before っ: 三百 さんびゃく, 学校 がっこう);
// words with a special reading (今日 きょう, 大人 おとな) are poor first examples for a single kanji.
const VOICED = { か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご", さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ", た: "だ", ち: "ぢ", つ: "づ", て: "で", と: "ど", は: "ば", ひ: "び", ふ: "ぶ", へ: "べ", ほ: "ぼ" };
const HALF = { は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ" };
function regularReading(entry, reading) {
  return [...entry.on.map(toHiragana), ...entry.kun.map(kun => kun.replace(/\(.*\)/, ""))].some(base => {
    const forms = [base, ...[VOICED[base[0]], HALF[base[0]], base[0] === "ち" ? "じ" : undefined].filter(Boolean).map(head => head + base.slice(1))];
    return [...forms, ...forms.filter(form => form.length > 1).map(form => form.slice(0, -1) + "っ")].some(form => reading.includes(form));
  });
}
const kanjiReading = entry => [entry.on.join("・"), entry.kun.join("・")].filter(Boolean).join(" / ");
const kanjiRomaji = entry => [entry.on.map(kanaToRomaji).join(", "), entry.kun.map(kanaToRomaji).join(", ")].filter(Boolean).join(" / ");

const wordPool = ["jlpt-n5", "jlpt-n4"].map(id => readJson(join(OUT, id + ".json"))?.lessons.flatMap(lesson => lesson.words) ?? []);
const known = new Set();
for (const deck of KANJI_DECKS) {
  const path = join(DRAFTS, deck.id + ".json");
  const draft = readJson(path) ?? { id: deck.id, note: "Draft kanji entries (DeepSeek), awaiting teacher review. Edit here; re-run the build to publish.", lessons: {} };
  const missing = deck.lessons.filter(lesson => draft.lessons[lesson.id]?.kanji.map(entry => entry.term).join(" ") !== lesson.terms.join(" "));
  if (missing.length && draftMode) {
    await pool(missing.map(lesson => async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          draft.lessons[lesson.id] = { title: lesson.title, kanji: await draftKanji(deck, lesson) };
          writeFileSync(path, JSON.stringify(draft, null, 1) + "\n");
          console.log(`drafted ${deck.id}/${lesson.id} (${lesson.terms.length} kanji)`);
          return;
        } catch (error) { console.warn(`retry ${attempt}: ${error.message}`); }
      }
      failed++;
    }), 4);
  }
  const ready = deck.lessons.every(lesson => draft.lessons[lesson.id]?.kanji.length === lesson.terms.length);
  if (!ready) { console.warn(`${deck.id}: drafts incomplete; run with --draft`); failed++; continue; }
  const problems = deck.lessons.flatMap(lesson => checkKanji(lesson, draft.lessons[lesson.id].kanji));
  if (problems.length) { console.warn(`${deck.id}: ${problems.length} problems\n  ${problems.join("\n  ")}`); failed++; continue; }
  for (const lesson of deck.lessons) for (const term of lesson.terms) known.add(term);
  // Words with a regular reading and only learned kanji first; then N5 words before N4, shorter words, list order.
  const words = (deck.level === "N5" ? wordPool.slice(0, 1) : wordPool).flatMap((list, rank) => list.map((word, order) => ({ word, rank, order })));
  const easy = word => [...word.term].every(char => !HAN.test(char) || known.has(char));
  let drafted = 0;
  const out = {
    id: deck.id, exam: "jlpt", level: deck.level, title: deck.title, lang: "ja-JP",
    lessons: deck.lessons.map(lesson => ({ id: lesson.id, title: lesson.title, words: draft.lessons[lesson.id].kanji.map(entry => {
      const found = words.filter(({ word }) => word.term.split(entry.term).length === 2)
        .map(item => ({ ...item, cost: (regularReading(entry, item.word.reading) ? 0 : 2) + (easy(item.word) ? 0 : 1) }))
        .sort((a, b) => a.cost - b.cost || a.rank - b.rank || a.word.term.length - b.word.term.length || a.order - b.order)
        .map(({ word }) => ({ word: word.term, reading: word.reading, meaning: word.meaning }));
      // Two longer words, then the kanji as a word of its own (山 やま) when the decks have it, then drafted words.
      const examples = [...found.filter(item => item.word.length > 1).slice(0, 2), ...found.filter(item => item.word === entry.term)];
      for (const item of entry.examples) if (examples.length < 3 && !examples.some(other => other.word === item.word)) { examples.push(item); drafted++; }
      // The first example is the one the quiz gaps (cloze), so it must be longer than the kanji itself.
      examples.sort((a, b) => Number(a.word.length < 2) - Number(b.word.length < 2));
      const shown = examples.slice(0, 3).map(item => ({ ...item, romaji: kanaToRomaji(item.reading) }));
      return {
        id: wordId(entry.term), term: entry.term, reading: kanjiReading(entry), on: entry.on, kun: entry.kun, meaning: entry.meaning,
        example: shown[0].word, exampleReading: shown[0].reading, exampleMeaning: shown[0].meaning, examples: shown,
        romaji: kanjiRomaji(entry), answers: kanjiAnswers(entry),
      };
    }) })),
  };
  writeFileSync(join(OUT, deck.id + ".json"), JSON.stringify(out) + "\n");
  console.log(`wrote ${OUT}/${deck.id}.json: ${out.lessons.length} lessons, ${out.lessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} kanji (${drafted} drafted example words)`);
}
// HSK characters (2026-11-19; owner: shown in the HSK word decks under a «Ханз» filter, not as decks of their own): the
// characters of the word lists (language-decks/hanzi.mjs). Pinyin and a Mongolian meaning are drafted per lesson by
// DeepSeek into MockExmps/Decks/hsk-hanzi-<level>.json and checked against the syllables of the deck words (pinyin.json):
// every reading must be one the words use, and every toned one they use must be listed (一 and 不 are written in their own
// tone). The example words are the deck's words that hold the character. Written into the word deck as `lessons[].chars`.
const hskWords = ["hsk-1", "hsk-2"].map(id => readJson(join(OUT, id + ".json"))?.lessons.flatMap(lesson => lesson.words) ?? []);
const charSyllables = new Map();
for (const word of readJson(join(DRAFTS, "pinyin.json"))?.drill ?? []) {
  [...word.term].forEach((char, index) => {
    const syllable = word.syllables[index];
    if (!syllable) return;
    if (!charSyllables.has(char)) charSyllables.set(char, new Map());
    charSyllables.get(char).set(syllable.base + syllable.tone, syllable);
  });
}
const SANDHI = new Set(["一", "不"]), SYLLABLE = /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/;
function hanziRules() {
  return [
    "You write character study entries for Mongolian learners preparing for HSK 1–2 (HSK 3.0). For each character, in the given order, return:",
    `- "pinyin": the character's readings in Hanyu Pinyin with tone marks, one syllable each (1–3), most common first: every reading used by the HSK`,
    `  words given with it, and no other. Write the character's own tone, never a tone change: 一 yī, 不 bù. When a word reads the character in the`,
    `  neutral tone but it has a tone of its own (朋友 péngyou: 友 yǒu; 东西 dōngxi: 西 xī), give its own tone. Only particles and suffixes that are`,
    `  always neutral (的 de, 了 le, 吗 ma, 们 men) keep a reading without a tone mark.`,
    `- "meaning": the character's own core meaning in Mongolian Cyrillic, short like a dictionary gloss (1–4 words; separate senses with "; ").`,
    `  For a grammar character give a short gloss and a note in parentheses, e.g. "(асуух сул үг)"; for a character used only inside one word,`,
    `  a note with that word, e.g. "(葡萄 «усан үзэм» үгэнд)".`,
    `Use Mongolian Cyrillic only for "meaning". Keep "term" exactly as given.`,
    `Return ONE JSON object: {"hanzi":[{"term":"…","pinyin":["…"],"meaning":"…"}]}.`,
  ].join("\n");
}
const pickHanzi = raw => ({
  term: String(raw?.term ?? "").trim(), pinyin: (raw?.pinyin ?? []).map(value => String(value).normalize("NFC").trim().toLowerCase()).filter(Boolean),
  meaning: String(raw?.meaning ?? "").trim(),
});
function checkHanzi(lesson, entries) {
  if (!Array.isArray(entries) || entries.length !== lesson.terms.length) return [`expected ${lesson.terms.length} characters, got ${entries?.length}`];
  const problems = [];
  entries.forEach((raw, index) => {
    const entry = pickHanzi(raw), term = lesson.terms[index];
    if (entry.term !== term) problems.push(`#${index + 1} term ${entry.term} ≠ ${term}`);
    if (!entry.pinyin.length || entry.pinyin.length > 3 || new Set(entry.pinyin).size !== entry.pinyin.length) problems.push(`${term}: pinyin ${entry.pinyin.join(",")}`);
    const heard = [...(charSyllables.get(term)?.values() ?? [])];
    const spellings = new Set(heard.flatMap(item => [1, 2, 3, 4, 5].map(tone => markTone(item.base, tone))));
    for (const reading of entry.pinyin) if (!SYLLABLE.test(reading) || (heard.length && !spellings.has(reading))) problems.push(`${term}: pinyin "${reading}"`);
    if (!SANDHI.has(term)) for (const item of heard) if (item.tone !== 5 && !entry.pinyin.includes(markTone(item.base, item.tone))) problems.push(`${term}: no ${markTone(item.base, item.tone)}`);
    if (!mongolian(entry.meaning)) problems.push(`${term}: meaning "${entry.meaning}"`);
  });
  return problems;
}
async function draftHanzi(list, lesson) {
  const listing = lesson.terms.map(char => `${char}: ${hskWords.flat().filter(word => word.term.includes(char)).slice(0, 8).map(word => `${word.term} ${word.reading} «${word.meaning}»`).join("; ")}`);
  const data = await deepseek([{ role: "system", content: hanziRules() }, { role: "user", content: `Lesson topic: ${lesson.title}\nCharacters, each with the HSK 1–2 words that contain it:\n${listing.join("\n")}` }]);
  const problems = checkHanzi(lesson, data.hanzi);
  if (problems.length) throw new Error(`${list.draft}/${lesson.id}: ${problems.slice(0, 5).join("; ")}`);
  return data.hanzi.map(pickHanzi);
}
const learned = new Set();
for (const list of HSK_CHARACTERS) {
  const path = join(DRAFTS, list.draft + ".json");
  const draft = readJson(path) ?? { id: list.draft, note: "Draft character entries (DeepSeek), awaiting teacher review. Edit here; re-run the build to publish.", lessons: {} };
  const matches = lesson => !lesson.terms.length || draft.lessons[lesson.id]?.hanzi.map(entry => entry.term).join(" ") === lesson.terms.join(" ");
  const missing = list.lessons.filter(lesson => !matches(lesson));
  if (missing.length && draftMode) {
    await pool(missing.map(lesson => async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          draft.lessons[lesson.id] = { title: lesson.title, hanzi: await draftHanzi(list, lesson) };
          writeFileSync(path, JSON.stringify(draft, null, 1) + "\n");
          console.log(`drafted ${list.draft}/${lesson.id} (${lesson.terms.length} characters)`);
          return;
        } catch (error) { console.warn(`retry ${attempt}: ${error.message}`); }
      }
      failed++;
    }), 4);
  }
  if (!list.lessons.every(matches)) { console.warn(`${list.draft}: drafts incomplete; run with --draft`); failed++; continue; }
  const problems = list.lessons.flatMap(lesson => lesson.terms.length ? checkHanzi(lesson, draft.lessons[lesson.id].hanzi) : []);
  if (problems.length) { console.warn(`${list.draft}: ${problems.length} problems\n  ${problems.join("\n  ")}`); failed++; continue; }
  const deckPath = join(OUT, list.deck + ".json"), deck = readJson(deckPath);
  if (!deck) { console.warn(`${list.deck}: word deck missing`); failed++; continue; }
  const words = deck.lessons.flatMap(lesson => lesson.words);
  for (const lesson of deck.lessons) {
    const terms = list.lessons.find(item => item.id === lesson.id)?.terms ?? [];
    for (const char of terms) learned.add(char);
    // The deck's words that hold the character: longer ones with only characters learned so far first, shorter and
    // earlier ones before the rest, then the character as a word of its own (好), words that repeat it (妈妈) last.
    lesson.chars = (draft.lessons[lesson.id]?.hanzi ?? []).map(raw => {
      const entry = pickHanzi(raw);
      const found = words.map((word, order) => ({ word, order })).filter(({ word }) => word.term.includes(entry.term))
        .map(item => ({ ...item, rank: item.word.term === entry.term ? 2 : item.word.term.split(entry.term).length === 2 ? 0 : 3,
          cost: [...item.word.term].every(char => !HAN.test(char) || learned.has(char)) ? 0 : 1 }))
        .sort((a, b) => a.cost - b.cost || [...a.word.term].length - [...b.word.term].length || a.order - b.order);
      const once = found.filter(item => item.rank === 0);
      const examples = [...once.slice(0, 2), ...found.filter(item => item.rank === 2), ...once.slice(2), ...found.filter(item => item.rank === 3)].slice(0, 3)
        .map(({ word }) => ({ word: word.term, reading: word.reading, meaning: word.meaning }));
      return { id: wordId(entry.term), term: entry.term, reading: entry.pinyin.join(" / "), readings: entry.pinyin, meaning: entry.meaning, examples };
    });
  }
  writeFileSync(deckPath, JSON.stringify(deck) + "\n");
  console.log(`added ${deck.lessons.reduce((sum, lesson) => sum + lesson.chars.length, 0)} characters to ${deckPath}`);
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
    // A word with only neutral syllables (的, 们, 吗 …) has no tone to choose, so the drill leaves it out.
    words: pinyin.drill.filter(word => word.deck === deck && word.syllables.some(item => item.tone !== 5)).map(word => ({
      id: word.id, term: word.term, reading: word.syllables.map(item => item.base).join(" "), meaning: word.meaning,
      example: "", exampleReading: "", exampleMeaning: "", syllables: word.syllables,
    })),
  }));
  if (lessons.some(lesson => lesson.words.some(word => !word.syllables.length || word.syllables.length !== [...word.term].length))) { console.warn("pinyin: a drill word's syllables do not match its characters"); failed++; }
  writeFileSync(join(OUT, "hsk-tones.json"), JSON.stringify({ id: "hsk-tones", exam: "hsk", level: "Pinyin", title: "Аялгуу таних", lang: "zh-CN", lessons }) + "\n");
  console.log(`wrote ${OUT}/pinyin-chart.json: ${cells.length} syllables; hsk-tones.json: ${lessons.reduce((sum, lesson) => sum + lesson.words.length, 0)} words`);
}
process.exit(failed ? 1 : 0);
