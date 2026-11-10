import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { strToU8, zipSync } from "fflate";
import {
  DEFAULT_IMPORT_COUNT, IMPORT_COUNTS, VOCABULARY_LIMITS, bankFullMessage, cleanUserRequest, isImportLanguage,
  parseGeneratedWords, readImportCount, readWordFields, readWordsJson, termKey, vocabularyCapacity, vocabularyMessages,
  vocabularyUpgrade,
} from "../src/modules/vocabulary/contracts.ts";
import { subscriptionPlans } from "../src/modules/subscriptions/plans.ts";
import { buildQuiz, questionLead, QUIZ_COUNTS, QUIZ_MIN_WORDS } from "../src/modules/vocabulary/quiz.ts";
import { DOCUMENT_LIMITS, cleanSourceText, displayFileName, fallbackTitle } from "../src/modules/documents/text.ts";
import { docxText, officeKind, pptxText, xmlToText, zipNames } from "../src/modules/documents/office.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const words = [
  { id: "w1", term: "resilient", translation: "тэсвэртэй", example: null },
  { id: "w2", term: "scarce", translation: "ховор", example: "Water is scarce here." },
  { id: "w3", term: "ambiguous", translation: "хоёр утгатай", example: null },
  { id: "w4", term: "meticulous", translation: "нягт нямбай", example: null },
  { id: "w5", term: "candid", translation: "шударга", example: null },
  { id: "w6", term: "deteriorate", translation: "муудах", example: null },
];

// A small deterministic random source for repeatable quizzes.
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test("manual word input takes only its exact shape and bounds", () => {
  assert.deepEqual(readWordFields({ term: "  take   off ", translation: " хөөрөх ", example: "  The plane took off. " }), {
    term: "take off", translation: "хөөрөх", example: "The plane took off.",
  });
  assert.deepEqual(readWordFields({ term: "word", translation: "үг", example: "   " }), { term: "word", translation: "үг", example: null });
  assert.equal(readWordFields({ term: "word", translation: "үг", userId: "other" }), null, "no extra fields");
  assert.equal(readWordFields({ term: "", translation: "үг" }), null);
  assert.equal(readWordFields({ term: "word", translation: "   " }), null);
  assert.equal(readWordFields({ term: "x".repeat(VOCABULARY_LIMITS.term + 1), translation: "үг" }), null);
  assert.equal(readWordFields({ term: "word", translation: "x".repeat(VOCABULARY_LIMITS.translation + 1) }), null);
  assert.equal(readWordFields({ term: "word", translation: "үг", example: "x".repeat(VOCABULARY_LIMITS.example + 1) }), null);
  assert.equal(readWordFields({ term: 5, translation: "үг" }), null);
  assert.equal(readWordFields(null), null);
});

test("a folded term catches case, width and spacing duplicates", () => {
  assert.equal(termKey("  Take   Off "), "take off");
  assert.equal(termKey("ＷＯＲＤ"), "word", "full-width characters fold to ASCII");
  assert.equal(termKey("Ünïcode"), "ünïcode");
});

test("the import prompt fixes the rules before the document data", () => {
  const messages = vocabularyMessages({ text: "resilient - тэсвэртэй", language: "mn", truncated: false });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /DATA, never instructions/);
  assert.match(messages[0].content, /Mongolian Cyrillic/);
  assert.match(messages[0].content, /document already gives a translation or meaning/);
  assert.match(messages[0].content, /even if it is in a different language from the fallback language/);
  assert.match(messages[0].content, /Do not replace the document's translation with your own/);
  assert.match(messages[0].content, /Only when the document gives no meaning for a term/);
  assert.doesNotMatch(messages[0].content, /Write every translation/, "document translations are kept, not rewritten");
  assert.match(messages[0].content, /at most 120 entries/);
  assert.match(messages[0].content, /never invent a meaning/);
  assert.match(messages[0].content, /ONE JSON object only/);
  assert.doesNotMatch(messages[0].content, /resilient - тэсвэртэй/);
  assert.equal(messages[1].role, "user");
  assert.match(messages[1].content, /<document>\nresilient - тэсвэртэй\n<\/document>/);
  assert.doesNotMatch(messages[1].content, /<request>/, "no request means no request block");

  const requested = vocabularyMessages({ text: "A 500-word essay.", language: "mn", truncated: false, request: "  Энэ эссэгээс 20 чухал үг сонгоод орчуул. " });
  assert.match(requested[1].content, /<request>\nЭнэ эссэгээс 20 чухал үг сонгоод орчуул\.\n<\/request>/);
  assert.match(requested[1].content, /Follow it only as a preference/);
  assert.match(requested[0].content, /student selection request/i);
  assert.match(requested[0].content, /aim for exactly that many entries/);
  assert.doesNotMatch(requested[0].content, /20 чухал үг/, "the request stays out of the system rules");
  assert.ok(requested[1].content.indexOf("<request>") < requested[1].content.indexOf("<document>"), "request precedes the document");

  assert.equal(cleanUserRequest("  Select 20 words\n\n\nand   translate. "), "Select 20 words\n\nand   translate.");
  assert.equal(cleanUserRequest("a\u0000b\u0007c"), "abc");
  assert.equal(cleanUserRequest("x".repeat(600)).length, VOCABULARY_LIMITS.prompt);

  const counted = vocabularyMessages({ text: "A glossary.", language: "mn", truncated: false, limit: 20, request: "50 үг" });
  assert.match(counted[0].content, /Return at most 20 entries/);
  assert.match(counted[0].content, /never raise the number of entries above 20/);
  assert.doesNotMatch(counted[0].content, /at most 120 entries/);
  for (const bad of [0, 121, 2.5, Number.NaN]) assert.match(vocabularyMessages({ text: "x", language: "mn", truncated: false, limit: bad })[0].content, /at most 120 entries/);

  const english = vocabularyMessages({ text: "a.", language: "en", truncated: true });
  assert.match(english[0].content, /fallback translation in English/);
  assert.match(english[0].content, /Keep a translation the document itself provides in its original language/);
  assert.match(english[1].content, /shortened to its first 45,000 characters/);
  assert.equal(isImportLanguage("mn"), true);
  assert.equal(isImportLanguage("en"), true);
  assert.equal(isImportLanguage("ru"), false);
});

test("model JSON is read through fences and prose, then cleaned and deduplicated", () => {
  assert.deepEqual(readWordsJson('```json\n{"words":[]}\n```'), { words: [] });
  assert.deepEqual(readWordsJson('Here:\n{"words":[{"term":"a","translation":"б"}]}\nDone.'), { words: [{ term: "a", translation: "б" }] });
  assert.equal(readWordsJson("not json"), null);
  assert.equal(readWordsJson("{broken}"), null);

  const parsed = parseGeneratedWords(JSON.stringify({ words: [
    { term: "  take   off ", translation: " хөөрөх ", example: " The plane took off. " },
    { term: "take off", translation: "дахин", example: "ignored duplicate" },
    { term: "resilient", translation: "тэсвэртэй" },
    { term: "", translation: "хоосон" },
    { term: "bad", translation: 5 },
  ] }));
  assert.deepEqual(parsed, [
    { term: "take off", translation: "хөөрөх", example: "The plane took off." },
    { term: "resilient", translation: "тэсвэртэй" },
  ]);
  assert.equal(parseGeneratedWords(JSON.stringify({ words: [] })), null);
  assert.equal(parseGeneratedWords("{}"), null);
  const tooMany = { words: Array.from({ length: VOCABULARY_LIMITS.importWords + 5 }, (_, index) => ({ term: "word" + index, translation: "үг" + index })) };
  assert.equal(parseGeneratedWords(JSON.stringify(tooMany)).length, VOCABULARY_LIMITS.importWords);
  assert.equal(parseGeneratedWords(JSON.stringify(tooMany), 10).length, 10, "the student's count bounds the saved list");
  assert.equal(parseGeneratedWords(JSON.stringify(tooMany), 999).length, VOCABULARY_LIMITS.importWords);
  const long = parseGeneratedWords(JSON.stringify({ words: [{ term: "x".repeat(300), translation: "y".repeat(900) }] }));
  assert.ok(long[0].term.length <= VOCABULARY_LIMITS.term && long[0].translation.length <= VOCABULARY_LIMITS.translation);
});

test("the bank size follows the student's plans, and one import asks for a bounded count", () => {
  assert.equal(VOCABULARY_LIMITS.freeWords, 100);
  assert.deepEqual(subscriptionPlans.map(plan => [plan.program, plan.vocabularyWords]), [["entrance", 100], ["ielts", 3000], ["sat", 3000]]);
  assert.equal(VOCABULARY_LIMITS.maxWords, Math.max(...subscriptionPlans.map(plan => plan.vocabularyWords)), "the list reads the largest bank");
  assert.equal(vocabularyCapacity([]), 100);
  assert.equal(vocabularyCapacity(["ielts"]), 3000);
  assert.equal(vocabularyCapacity(["sat"]), 3000);
  assert.equal(vocabularyCapacity(["entrance"]), 100);
  assert.equal(vocabularyCapacity(["ielts", "sat"]), 3000, "plans do not stack");
  assert.equal(vocabularyCapacity(["unknown", "free"]), 100);
  assert.deepEqual(vocabularyUpgrade(), { words: 3000, plans: ["IELTS", "SAT"] });
  assert.match(bankFullMessage(100), /100 үгийн хязгаартаа хүрсэн/);
  assert.match(bankFullMessage(100), /IELTS эсвэл SAT багцтай бол 3,000 үг хадгална/);
  assert.doesNotMatch(bankFullMessage(3000), /багцтай бол/, "no upgrade hint once on the largest bank");
  assert.deepEqual(IMPORT_COUNTS, [10, 20, 50, 120]);
  assert.ok(IMPORT_COUNTS.includes(DEFAULT_IMPORT_COUNT));
  assert.equal(readImportCount(null), 120, "older clients without a count keep the full import");
  assert.equal(readImportCount(""), 120);
  assert.equal(readImportCount("20"), 20);
  assert.equal(readImportCount("1"), 1);
  for (const bad of ["0", "121", "-5", "2.5", "abc", "1e2", " 20", "0020"]) assert.equal(readImportCount(bad), null, bad);
});

test("a quiz needs four words and keeps answers, options and both directions sound", () => {
  assert.equal(QUIZ_MIN_WORDS, 4);
  assert.deepEqual(buildQuiz(words.slice(0, 3), { count: 10, direction: "mixed", random: seeded(1) }), []);
  assert.deepEqual(buildQuiz([], { count: 10, direction: "mixed", random: seeded(1) }), []);

  const fromWords = buildQuiz(words, { count: 6, direction: "term-to-translation", random: seeded(2) });
  assert.equal(fromWords.length, 6);
  for (const item of fromWords) {
    assert.equal(item.direction, "term-to-translation");
    assert.equal(item.prompt, item.term);
    assert.ok(item.options.length >= 2 && item.options.length <= 4);
    assert.equal(new Set(item.options).size, item.options.length, "no repeated option text");
    assert.equal(item.options[item.answer], item.translation);
    assert.equal(new Set(item.options.map(value => value.normalize("NFKC").toLowerCase())).size, item.options.length);
  }

  const fromMeanings = buildQuiz(words, { count: 6, direction: "translation-to-term", random: seeded(3) });
  assert.equal(fromMeanings.length, 6);
  for (const item of fromMeanings) {
    assert.equal(item.direction, "translation-to-term");
    assert.equal(item.prompt, item.translation);
    assert.equal(item.options[item.answer], item.term);
  }

  const mixed = buildQuiz(words, { count: 6, direction: "mixed", random: seeded(4) });
  assert.equal(mixed.length, 6);
  for (const item of mixed) assert.ok(["term-to-translation", "translation-to-term"].includes(item.direction));
  const all = buildQuiz(words, { count: 20, direction: "mixed", random: seeded(5) });
  assert.equal(all.length, words.length, "never more questions than words");

  assert.equal(buildQuiz(words, { count: 20, direction: "mixed", random: seeded(6) }).length, words.length, "never more questions than words");
  assert.equal(buildQuiz(words, { count: 0, direction: "mixed", random: seeded(7) }).length, 1, "a bad count still asks one question");
  assert.equal(questionLead("term-to-translation"), "Энэ үгийн орчуулга аль вэ?");
  assert.equal(questionLead("translation-to-term"), "Энэ орчуулга аль үг вэ?");
  assert.ok(QUIZ_COUNTS.includes(10) && QUIZ_COUNTS.includes(20) && QUIZ_COUNTS.includes(30));
});

test("duplicate meanings reduce options instead of breaking the quiz", () => {
  const same = [
    { id: "a", term: "one", translation: "нэг", example: null },
    { id: "b", term: "two", translation: "нэг", example: null },
    { id: "c", term: "three", translation: "гурав", example: null },
    { id: "d", term: "four", translation: "дөрөв", example: null },
  ];
  // Asking for the meaning has one right answer even when two words share a meaning.
  const quiz = buildQuiz(same, { count: 4, direction: "term-to-translation", random: seeded(8) });
  assert.equal(quiz.length, 4);
  for (const item of quiz) {
    assert.ok(item.options.length >= 2 && item.options.length <= 4);
    assert.equal(item.options[item.answer], item.translation);
  }
  // Asking for the word would be ambiguous for "нэг", so those questions are skipped.
  const ambiguous = buildQuiz(same, { count: 4, direction: "translation-to-term", random: seeded(10) });
  assert.equal(ambiguous.length, 2);
  for (const item of ambiguous) assert.notEqual(item.prompt, "нэг");
  const noAmbiguity = buildQuiz(same.slice(2), { count: 4, direction: "mixed", random: seeded(11) });
  assert.equal(noAmbiguity.length, 0, "fewer than four words is not a quiz");
  const healthy = [
    "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
  ].map((term, index) => ({ id: "w" + index, term, translation: "t" + index, example: null }));
  const nine = buildQuiz(healthy, { count: 20, direction: "mixed", random: seeded(9) });
  assert.equal(nine.length, 10);
  for (const item of nine) assert.equal(item.options.length, 4, "ten distinct words give four options");
});

test("document text and file names keep their old bounds", () => {
  assert.equal(cleanSourceText("  exam-\nple\r\n\r\n\r\nnext  ").text, "example\n\nnext");
  assert.equal(cleanSourceText("keep -\nCap").text, "keep -\nCap");
  const long = cleanSourceText("Sentence one. " + "x".repeat(90_000));
  assert.equal(long.truncated, true);
  assert.ok(long.text.length <= 45_000);
  assert.equal(displayFileName("C:\\Users\\a\\chapter 1.pdf"), "chapter 1.pdf");
  assert.equal(displayFileName("../../etc/passwd"), "passwd");
  assert.equal(displayFileName("\u0000\u0007"), "Файл");
  assert.equal(fallbackTitle("chapter_1-notes.docx"), "chapter 1 notes");
  assert.equal(fallbackTitle(".pdf"), "Шинэ багц");
  assert.ok(displayFileName("x".repeat(500)).length <= 160);
});

test("Word and PowerPoint text keeps reading order and entities", () => {
  const docx = zipSync({
    "word/document.xml": strToU8("<w:document><w:body><w:p><w:r><w:t>Cell</w:t></w:r><w:r><w:t xml:space=\"preserve\"> theory</w:t></w:r></w:p><w:p><w:r><w:t>ATP &amp; energy &#8212; the cell</w:t></w:r></w:p></w:body></w:document>"),
    "[Content_Types].xml": strToU8("<Types/>"),
  });
  assert.equal(officeKind(docx), "docx");
  assert.ok(zipNames(docx).has("word/document.xml"));
  assert.match(docxText(docx), /Cell theory/);
  assert.match(docxText(docx), /ATP & energy — the cell/);

  const pptx = zipSync({
    "ppt/presentation.xml": strToU8("<p:presentation/>"),
    "ppt/slides/slide2.xml": strToU8("<p:sld><a:p><a:r><a:t>Second</a:t></a:r></a:p></p:sld>"),
    "ppt/slides/slide1.xml": strToU8("<p:sld><a:p><a:r><a:t>First</a:t></a:r></a:p><a:p><a:r><a:t>slide</a:t></a:r></a:p></p:sld>"),
  });
  assert.equal(officeKind(pptx), "pptx");
  const slides = pptxText(pptx);
  assert.ok(slides.indexOf("First") < slides.indexOf("Second"));
  assert.match(slides, /First\nslide/);
  assert.equal(officeKind(zipSync({ "notes.txt": strToU8("x") })), null);
  assert.equal(xmlToText("<w:p><w:t>plain</w:t></w:p>", "w"), "plain\n");
  assert.equal(xmlToText("<w:t>a &lt; b</w:t>", "w"), "a < b");
});

test("vocabulary stays behind the server's checks and limits", () => {
  const addRoute = text("src/app/api/workspace/vocabulary/route.ts");
  assert.match(addRoute, /checkOrigin\(request\)/);
  assert.match(addRoute, /apiUser\(request\)/);
  assert.match(addRoute, /readJson\(request, 8 \* 1024\)/);
  const wordRoute = text("src/app/api/workspace/vocabulary/words/[id]/route.ts");
  assert.match(wordRoute, /checkOrigin\(request\)/);
  assert.match(wordRoute, /apiUser\(request\)/);
  assert.match(wordRoute, /await context\.params/);
  const importRoute = text("src/app/api/workspace/vocabulary/import/route.ts");
  assert.match(importRoute, /checkOrigin\(request\)/);
  assert.match(importRoute, /apiUser\(request\)/);
  assert.match(importRoute, /importVocabulary\(user\.id, request\)/);
  const service = text("src/modules/vocabulary/service.ts");
  assert.equal(service.match(/await ensureNoTimedExam\(userId\)/g)?.length, 2, "open sittings are checked before and after the provider call");
  assert.match(service, /count: \{ lt: DAILY_LIMIT \}/);
  assert.match(service, /lastRequest: \{ lte: BigInt\(now\) \}/);
  // The size, count and kind of the upload are checked by the shared reader before credits are held.
  assert.match(service, /readUploadedSource\(form, /);
  assert.ok(service.indexOf("readUploadedSource(form, ") < service.indexOf("return chargeCredits("));
  assert.match(text("src/modules/documents/upload.ts"), /total > DOCUMENT_LIMITS\.fileBytes/);
  assert.equal(VOCABULARY_LIMITS.fileBytes, DOCUMENT_LIMITS.fileBytes);
  assert.match(service, /\["file", "language", "prompt", "count"\]/);
  assert.match(service, /readImportCount\(field\(form, "count"\)\)/);
  assert.match(service, /const wanted = Math\.min\(requested, limit - stored\)/, "an import asks only for the room left");
  assert.match(service, /if \(total >= limit\) throw new ApiError\(409, bankFullMessage\(limit\)\)/);
  assert.match(service, /take: VOCABULARY_LIMITS\.maxWords/);
  assert.match(service, /vocabularyCapacity\(rows\.map\(row => row\.program\)\)/);
  assert.match(service, /endsAt: \{ gt: now \}/, "only active plans raise the bank size");
  assert.match(service, /rawRequest\.length > VOCABULARY_LIMITS\.prompt/);
  assert.match(service, /request: selectionRequest/);
  assert.match(service, /where: \{ id, userId \}/, "deletes are scoped to the owner");
  assert.match(service, /deleteMany\(\{ where: \{ id, userId \} \}\)/);
  assert.match(service, /createMany\(/);
  assert.match(service, /skipDuplicates: true/);
  assert.doesNotMatch(service, /practiceDuringMockAllowed/);
  assert.match(text("src/modules/documents/extract.ts"), /pdf\.numPages > DOCUMENT_LIMITS\.pdfPages/);
  assert.match(text("src/modules/documents/extract.ts"), /maxImageSize: 16 \* 1024 \* 1024/);
  assert.doesNotMatch(text("src/modules/vocabulary/client.tsx"), /dangerouslySetInnerHTML/);
  assert.doesNotMatch(text("src/modules/vocabulary/quiz-view.tsx"), /dangerouslySetInnerHTML/);
  const schema = text("prisma/schema.prisma");
  assert.match(schema, /model VocabularyWord/);
  assert.match(schema, /@@unique\(\[userId, termKey\]\)/);
  const migration = text("prisma/migrations/20261109164500_vocabulary_words/migration.sql");
  assert.match(migration, /CREATE TABLE "VocabularyWord"/);
  assert.match(migration, /ON DELETE CASCADE/);
});
