import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { LANGUAGE_DECKS, WORKSHOP_EXAMS, isDeckWordId } from "../src/modules/language-decks/catalog.ts";
import { buildQuiz, checkTyped, speechFor } from "../src/modules/vocabulary/quiz.ts";
import { subscriptionPlans, legacyPlans } from "../src/modules/subscriptions/plans.ts";
import { DECKS } from "../scripts/language-decks/lists.mjs";
import { KANA_SCRIPTS } from "../scripts/language-decks/kana.mjs";
import { kanaToRomaji, romajiVariants } from "../src/modules/language-decks/romaji.ts";
import { markTone, spellTones, toneChoices } from "../src/modules/language-decks/tones.ts";
import { inWorkspace, workspaceTab } from "../src/modules/workspace/paths.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const asset = id => JSON.parse(text(`assets/language-decks/${id}.json`));

test("every deck file matches its list: same lessons and terms, stable ids, complete entries", () => {
  // TOPIK decks have their own build (scripts/build-topik-decks.mjs) and test (tests/topik.test.mjs).
  assert.deepEqual(LANGUAGE_DECKS.filter(deck => deck.kind === "words" && deck.exam !== "topik").map(deck => deck.id), DECKS.map(deck => deck.id));
  const sizes = {};
  for (const deck of DECKS) {
    const file = asset(deck.id);
    assert.deepEqual(file.lessons.map(lesson => lesson.words.map(word => word.term)), deck.lessons.map(lesson => lesson.terms), deck.id);
    const words = file.lessons.flatMap(lesson => lesson.words);
    sizes[deck.id] = words.length;
    assert.equal(new Set(words.map(word => word.id)).size, words.length, deck.id + " ids are unique");
    for (const word of words) {
      assert.equal(word.id, createHash("sha1").update(word.term).digest("hex").slice(0, 10));
      assert.ok(isDeckWordId(word.id));
      for (const field of ["reading", "meaning", "example", "exampleReading", "exampleMeaning"]) assert.ok(word[field]?.trim(), `${deck.id} ${word.term} ${field}`);
      assert.match(word.meaning, /[Ѐ-ӿ]/, `${word.term} meaning is Mongolian`);
      assert.match(word.reading, deck.exam === "jlpt" ? /^[぀-ヿー・ ]+$/ : /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' -]+$/i, `${word.term} reading`);
      if (deck.exam === "jlpt") {
        // Romaji: the word's own (from its kana), the example's (drafted, checked against the kana), accepted spellings.
        assert.match(word.romaji, /^[a-z' -]+$/, `${word.term} romaji`);
        assert.match(word.exampleRomaji, /^[a-z' ,.?!-]+$/i, `${word.term} example romaji`);
        assert.equal(word.answers[0], word.romaji);
      } else assert.equal(word.romaji, undefined);
    }
  }
  assert.deepEqual(sizes, { "jlpt-n5": 554, "jlpt-n4": 390, "hsk-1": 154, "hsk-2": 150 });
});

test("HSK decks hold exactly the HSK 1/2 syllabus the mock packs validate against", () => {
  const source = text("MockExmps/HSK2/_source/build.py");
  const list = name => source.match(new RegExp(name + ' = """([\\s\\S]*?)"""'))[1].trim().split(/\s+/);
  for (const [id, name] of [["hsk-1", "HSK1"], ["hsk-2", "HSK2"]]) {
    const terms = DECKS.find(deck => deck.id === id).lessons.flatMap(lesson => lesson.terms);
    assert.deepEqual([...terms].sort(), [...list(name)].sort(), id);
  }
});

test("only plans with workshops and the exam open a deck: Basic and Pro, not free, ЭЕШ, SAT or the old IELTS plan", () => {
  const opens = (plan, exam) => Boolean(plan.workshops && plan.exams.includes(exam));
  for (const exam of ["jlpt", "hsk"]) {
    assert.deepEqual([...subscriptionPlans, ...legacyPlans].filter(plan => opens(plan, exam)).map(plan => plan.program), ["language_basic", "language"]);
  }
  const service = text("src/modules/language-decks/service.ts");
  assert.match(service, /plan\?\.workshops && \(plan\.exams as readonly string\[\]\)\.includes\(exam\)/);
  // The plan and the timed sitting are checked before any deck word or progress is read or written.
  const open = service.slice(service.indexOf("export async function openLanguageDeck"));
  assert.ok(open.indexOf("await requireStudy(") < open.indexOf("languageDeckProgress.findMany"));
  const review = service.slice(service.indexOf("export async function recordDeckReview"));
  assert.ok(review.indexOf("readResults(body)") < review.indexOf("await requireStudy("));
  assert.ok(review.indexOf("await requireStudy(") < review.indexOf("$transaction"));
  assert.match(service, /results\.some\(item => !known\.has\(item\.id\)\)/);
  assert.match(service, /activeTimedSitting\(userId\)/);
  const route = text("src/app/api/labs/words/[deck]/review/route.ts");
  assert.ok(route.indexOf("checkOrigin(request)") < route.indexOf("apiUser(request)"));
  // Every study page (decks, Kana, Pinyin) passes the shared gate (plan, then timed sitting) before reading progress.
  const gate = text("src/modules/language-decks/gate.tsx");
  assert.ok(gate.indexOf("await hasLanguageStudy(") < gate.indexOf("await activeTimedSitting("));
  for (const [path, exam] of [["src/app/labs/words/[deck]/page.tsx", "info.exam"], ["src/app/labs/kana/page.tsx", '"jlpt"'], ["src/app/labs/pinyin/page.tsx", '"hsk"']]) {
    const page = text(path);
    assert.ok(page.includes(`studyGate(user.id, ${exam},`), path);
    assert.ok(page.indexOf("if (gate) return gate;") < page.indexOf("openLanguageDeck("), path);
  }
  // Kana/tone decks never appear as word-deck tiles or open on the word-deck page.
  assert.match(service, /deck\.exam === exam && deck\.kind === "words"/);
  assert.match(text("src/app/labs/words/[deck]/page.tsx"), /info\.kind !== "words"\) notFound\(\)/);
  // Deck content is private: read on the server from assets/, which the deployment includes.
  assert.match(text("next.config.ts"), /"\.\/assets\/language-decks\/\*\.json"/);
  assert.doesNotMatch(text("src/modules/language-decks/client.tsx"), /from "\.\/content"|node:fs/);
});

test("Workshop shows one exam at a time, and the shared Vocabulary page has no JLPT/HSK tab", () => {
  assert.deepEqual(WORKSHOP_EXAMS.map(exam => exam.id), ["ielts", "jlpt", "hsk", "topik"]);
  // Deck pages sit inside the Workspace frame, under the Workshop tab.
  assert.equal(inWorkspace("/labs/words/jlpt-n5"), true);
  assert.equal(workspaceTab("/labs/words/hsk-1"), "workshop");
  for (const path of ["/labs/kana", "/labs/pinyin", "/labs/hangul"]) { assert.equal(inWorkspace(path), true); assert.equal(workspaceTab(path), "workshop"); }
  const page = text("src/app/workspace/workshop/page.tsx");
  assert.match(page, /isExam\(asked\) \? asked : isExam\(stored\) \? stored : "ielts"/);
  assert.match(page, /if \(exam !== "ielts"\) \{[\s\S]*return <div className="wsp-page workshop-index">[\s\S]*<LanguageWorkshop/);
  assert.doesNotMatch(text("src/modules/vocabulary/client.tsx") + text("src/modules/vocabulary/library.tsx"), /JLPT|HSK|language-decks/);
});

test("deck words in the shared quiz: the reading counts when typing, and the voice follows the deck's language", () => {
  assert.deepEqual(speechFor("学生", "zh-CN"), { text: "学生", lang: "zh-CN" });
  assert.equal(speechFor("学生").lang, "ja-JP");
  const word = (id, term, translation, reading) => ({ id, term, translation, example: null, reading, lang: "zh-CN", box: 0, correct: 0, wrong: 0 });
  const words = [word("a1", "学生", "сурагч", "xuésheng"), word("a2", "老师", "багш", "lǎoshī"), word("a3", "朋友", "найз", "péngyou"), word("a4", "医生", "эмч", "yīshēng")];
  const [question] = buildQuiz(words, { count: 1, direction: "translation-to-term", kinds: ["typing"], random: () => 0 });
  assert.equal(question.kind, "typing");
  assert.equal(question.speech.lang, "zh-CN");
  const target = words.find(item => item.id === question.wordId);
  assert.equal(checkTyped(target.term, question.accepted), "exact");
  assert.equal(checkTyped(target.reading, question.accepted), "exact");
  assert.equal(checkTyped(target.reading.normalize("NFD").replace(/[̀-ͯ]/g, ""), question.accepted), "exact");
  // Personal words keep the old rules: no reading, nothing extra accepted.
  const [plain] = buildQuiz(words.map(item => ({ ...item, reading: undefined, lang: undefined })), { count: 1, direction: "translation-to-term", kinds: ["typing"], random: () => 0 });
  assert.equal(plain.reading, null);
  assert.equal(checkTyped("xuesheng", plain.accepted), "wrong");
});

test("romaji follows Hepburn and accepts the common other spellings", () => {
  const cases = { "がっこう": "gakkou", "きって": "kitte", "まっちゃ": "matcha", "コーヒー": "koohii", "きんえん": "kin'en", "ほんや": "hon'ya",
    "しゃしん": "shashin", "ちず": "chizu", "つくえ": "tsukue", "ふじさん": "fujisan", "じゅぎょう": "jugyou", "ん": "n" };
  for (const [kana, romaji] of Object.entries(cases)) assert.equal(kanaToRomaji(kana), romaji, kana);
  for (const variant of ["si", "ti", "tu", "hu", "zi"]) assert.ok(["shi", "chi", "tsu", "fu", "ji"].some(base => romajiVariants(base).includes(variant)), variant);
  assert.ok(romajiVariants("kin'en").includes("kinnen"));
  // A deck word typed in romaji counts in the quiz.
  const deck = asset("jlpt-n5");
  const words = deck.lessons[1].words.slice(0, 4).map(item => ({ id: item.id, term: item.term, translation: item.meaning, example: null, reading: item.reading, answers: [item.reading, ...item.answers], lang: "ja-JP", box: 0, correct: 0, wrong: 0 }));
  const [question] = buildQuiz(words, { count: 1, direction: "translation-to-term", kinds: ["typing"], random: () => 0 });
  const target = words.find(item => item.id === question.wordId);
  assert.equal(checkTyped(target.answers[1], question.accepted), "exact");
});

test("kana charts: every row from the list, 104 kana per script, romaji answers and real look-alikes", () => {
  for (const script of KANA_SCRIPTS) {
    const file = asset(script.id);
    assert.equal(LANGUAGE_DECKS.find(deck => deck.id === script.id).kind, "kana");
    assert.deepEqual(file.lessons.map(lesson => lesson.cells), script.rows.map(row => row.cells));
    const words = file.lessons.flatMap(lesson => lesson.words);
    assert.equal(words.length, 104, script.id);
    assert.deepEqual(file.lessons.map(lesson => lesson.section).filter((value, index, all) => all.indexOf(value) === index), ["basic", "voiced", "combo"]);
    for (const word of words) {
      assert.equal(word.id, createHash("sha1").update(word.term).digest("hex").slice(0, 10));
      assert.match(word.romaji, /^[a-z]+$/);
      assert.equal(word.meaning, word.romaji);
      assert.ok(word.answers.includes(word.romaji));
    }
    const ids = new Set(words.map(word => word.id));
    assert.ok(file.lookalikes.length >= 10 && file.lookalikes.every(id => ids.has(id)), script.id);
  }
  const [hiragana, katakana] = KANA_SCRIPTS.map(script => asset(script.id).lessons.flatMap(lesson => lesson.words));
  assert.deepEqual(katakana.map(word => word.romaji), hiragana.map(word => word.romaji));
  assert.deepEqual(["し", "ち", "つ", "ふ", "じゃ", "を"].map(kana => hiragana.find(word => word.term === kana).romaji), ["shi", "chi", "tsu", "fu", "ja", "o"]);
  assert.ok(hiragana.find(word => word.term === "を").answers.includes("wo"));
});

test("pinyin: chart cells are real syllables with a checked example, drill words split one syllable per character", () => {
  const chart = asset("pinyin-chart");
  const cells = Object.values(chart.chart).flatMap(rows => rows.flatMap(row => row.cells.filter(Boolean)));
  assert.ok(cells.length > 380 && cells.length < 420, String(cells.length));
  assert.equal(new Set(cells).size, cells.length);
  for (const cell of cells) {
    const example = chart.examples[cell];
    assert.equal([...example.char].length, 1, cell);
    assert.equal(example.pinyin.normalize("NFD").replace(/[̀-ͯ]/g, "").replace("ü", "ü"), cell.normalize("NFD").replace(/[̀-ͯ]/g, ""), cell);
  }
  // Spelling rules: ü after j/q/x is written u; zh/ch/sh/r/z/c/s take only -i; zero-initial syllables use y/w.
  for (const syllable of ["ju", "qu", "xue", "lü", "nüe", "zhi", "si", "yi", "wu", "yu", "yuan", "er"]) assert.ok(cells.includes(syllable), syllable);
  for (const syllable of ["jü", "zhia", "i", "u", "ü", "ia"]) assert.ok(!cells.includes(syllable), syllable);
  const drill = asset("hsk-tones");
  assert.equal(LANGUAGE_DECKS.find(deck => deck.id === "hsk-tones").kind, "tones");
  const words = drill.lessons.flatMap(lesson => lesson.words);
  assert.ok(words.length >= 290, String(words.length));
  const deckIds = new Set(["hsk-1", "hsk-2"].flatMap(id => asset(id).lessons.flatMap(lesson => lesson.words.map(word => word.id))));
  for (const word of words) {
    assert.ok(deckIds.has(word.id), word.term);
    assert.equal(word.syllables.length, [...word.term].length, word.term);
    assert.ok(word.syllables.every(item => item.tone >= 1 && item.tone <= 5), word.term);
  }
  const hsk1 = asset("hsk-1").lessons.flatMap(lesson => lesson.words);
  const spelled = id => spellTones(words.find(word => word.id === id).syllables).replace(/ /g, "");
  for (const term of ["我们", "学生", "老师"]) { const deckWord = hsk1.find(word => word.term === term); assert.equal(spelled(deckWord.id), deckWord.reading.replace(/ /g, "").toLowerCase(), term); }
});

test("tone marks go on the right vowel and the drill offers four different choices with one right", () => {
  assert.deepEqual([["ma", 1], ["hao", 3], ["xie", 4], ["gou", 3], ["dui", 4], ["liu", 2], ["lü", 4], ["men", 5]].map(([base, tone]) => markTone(base, tone)), ["mā", "hǎo", "xiè", "gǒu", "duì", "liú", "lǜ", "men"]);
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const syllables of [[{ base: "ni", tone: 3 }], [{ base: "xue", tone: 2 }, { base: "sheng", tone: 5 }], [{ base: "zhong", tone: 1 }, { base: "guo", tone: 2 }]]) {
    const { options, answer } = toneChoices(syllables, random);
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.equal(options[answer], spellTones(syllables));
    // A neutral syllable stays unmarked in every choice.
    if (syllables[1]?.tone === 5) assert.ok(options.every(option => option.endsWith(" sheng")));
  }
});

// The Workshop quiz engine (drill.ts): Kana, word decks and the tone drill.
const seeded = (seed = 11) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const deckItems = (id, exam) => asset(id).lessons.flatMap(lesson => lesson.words.map(word => ({
  id: word.id, term: word.term, meaning: word.meaning, reading: word.reading === word.term ? null : word.reading,
  typed: exam === "jlpt" ? [word.reading, ...(word.answers ?? [])] : exam === "hsk" ? [word.reading] : word.answers,
  example: word.example || null, exampleMeaning: word.exampleMeaning || null, syllables: word.syllables ?? null, group: lesson.id, state: null,
})));

test("quiz engine: every exercise is answerable, options are distinct, and the right answer is among them", async () => {
  const { buildDrill, domainKinds, rightAnswer } = await import("../src/modules/language-decks/drill.ts");
  for (const [id, domain] of [["jlpt-n5", "jlpt"], ["hsk-1", "hsk"], ["kana-hiragana", "kana"], ["hsk-tones", "tones"]]) {
    const pool = deckItems(id, domain === "kana" ? "kana" : domain === "tones" ? "tones" : domain);
    const kinds = domainKinds(domain, true);
    // Items at every study level, as kinds depend on how well an item is known.
    const targets = pool.slice(0, 40).map((entry, index) => ({ ...entry, state: { box: index % 5, correct: index % 5, wrong: 0 } }));
    const exercises = buildDrill(targets, pool, { domain, kinds, random: seeded(), showReading: true });
    assert.ok(exercises.filter(item => item.kind !== "match").length === 40, id);
    const seen = new Set(exercises.map(item => item.kind));
    for (const kind of kinds) if (domain !== "tones") assert.ok(seen.has(kind), `${id} has ${kind}`);
    for (const exercise of exercises) {
      if ("options" in exercise) {
        assert.equal(exercise.options.length, 4, id);
        assert.equal(new Set(exercise.options.map(option => option.text)).size, 4, `${id} ${exercise.kind} options distinct`);
        assert.ok(exercise.answer >= 0 && exercise.answer < 4);
      }
      if (exercise.kind === "build") assert.ok(exercise.answer.every(part => exercise.tiles.includes(part)) && exercise.tiles.length > exercise.answer.length);
      if (exercise.kind === "cloze") assert.ok(exercise.prompt.includes("＿＿") && !exercise.prompt.includes(exercise.options[exercise.answer].text));
      if (exercise.kind === "match") assert.deepEqual([...exercise.left.map(side => side.id)].sort(), [...exercise.right.map(side => side.id)].sort());
      if (exercise.kind !== "match") assert.ok(rightAnswer(exercise));
    }
  }
});

test("quiz engine: smart order, kana tiles and lenient typing", async () => {
  const { pickTargets, morae, typedMatches } = await import("../src/modules/language-decks/drill.ts");
  const now = Date.UTC(2026, 10, 18);
  const item = (id, state) => ({ id, term: id, meaning: id, reading: null, typed: [], example: null, exampleMeaning: null, syllables: null, group: "g", state });
  const items = [item("known", { box: 4, correct: 4, wrong: 0, dueAt: now + 9e8 }), item("new", null), item("due", { box: 2, correct: 2, wrong: 0, dueAt: now - 1000 })];
  assert.deepEqual(pickTargets(items, "smart", 3, now, seeded()).map(entry => entry.id), ["due", "new", "known"]);
  assert.deepEqual(pickTargets(items, "new", 1, now, seeded()).map(entry => entry.id), ["new"]);
  assert.equal(pickTargets(items, "all", 0, now, seeded()).length, 3, "count 0 = every item");
  assert.deepEqual(morae("しゃしん"), ["しゃ", "し", "ん"]);
  assert.deepEqual(morae("きって"), ["き", "っ", "て"]);
  assert.ok(typedMatches("Xue sheng", ["xuésheng"]));
  assert.ok(typedMatches("nv", ["nǚ"]));
  assert.ok(typedMatches(" si ", ["shi", "si"]));
  assert.ok(!typedMatches("", ["a"]));
  assert.ok(!typedMatches("ka", ["ga"]));
});

test("kana test: all letters of both scripts, four distinct romaji with the right one, sections and counts", async () => {
  const { buildKanaTest, kanaLetters } = await import("../src/modules/language-decks/kana-test.ts");
  const scripts = ["kana-hiragana", "kana-katakana"].map(asset);
  const every = kanaLetters(scripts, ["basic", "voiced", "combo"]);
  assert.equal(every.length, 208);
  assert.equal(kanaLetters(scripts.slice(0, 1), ["basic"]).length, 46);
  assert.equal(kanaLetters(scripts, ["voiced"]).length, 50);
  assert.equal(kanaLetters(scripts.slice(1), ["combo"]).length, 33);
  const test = buildKanaTest(every, "all", every, seeded());
  assert.equal(test.length, 208);
  assert.equal(new Set(test.map(question => question.letter.deckId + question.letter.id)).size, 208, "each letter once");
  assert.deepEqual(new Set(test.map(question => question.letter.deckId)), new Set(["kana-hiragana", "kana-katakana"]));
  for (const question of test) {
    assert.equal(question.options.length, 4, question.letter.kana);
    assert.equal(new Set(question.options).size, 4, question.letter.kana + " options distinct");
    assert.equal(question.options[question.answer], question.letter.romaji);
  }
  // A small choice still gets three wrong answers (from the whole chart), and a count caps the test.
  const one = kanaLetters(scripts.slice(0, 1), ["basic"]).filter(letter => letter.row === "a");
  assert.ok(buildKanaTest(one, "all", every, seeded()).every(question => new Set(question.options).size === 4));
  assert.equal(buildKanaTest(every, 20, every, seeded()).length, 20);
  // お and を share "o": を's options never show "o" twice.
  const wo = buildKanaTest(every.filter(letter => letter.kana === "を" || letter.kana === "お"), "all", every, seeded());
  assert.ok(wo.every(question => question.options.filter(option => option === "o").length === 1));
});
