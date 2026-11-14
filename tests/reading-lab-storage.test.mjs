import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { READING_LIMITS, allQuestions, gradeReading } from "../src/modules/reading-lab/contracts.ts";
import { findReadingSample } from "../src/modules/reading-lab/samples.ts";
import {
  PRACTICES_FULL, answersFit, applyProgress, blankState, importedParagraphs, importedState, isBlank, legacyState, readGradeRequest,
  readImportRequest, readProgressRequest, readSavedPractice, readState,
} from "../src/modules/reading-lab/state.ts";
import { READING_TOKEN_TTL_MS, ReadingTokenError, openReading, readingImportKey, sealReading } from "../src/modules/reading-lab/token.ts";
import { forgetLegacyPractice, forgetLegacySamples, legacyReading, setGuestSample, tidyLegacyReading } from "../src/modules/reading-lab/store.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const SECRET_ENV = "BETTER_AUTH_SECRET";
// The one sample with every question kind: matching, multiple choice, TRUE/FALSE/NOT GIVEN and gaps.
const sample = findReadingSample("bird-navigation");
const groups = sample.groups;
const questions = allQuestions(groups);
const total = questions.length;
/** The answers a perfect student would give, from the key. */
const perfect = list => Object.fromEntries(allQuestions(list).map(question => [question.id, question.kind === "gap" ? question.answers[0] : question.answer]));
const firstOf = kind => questions.find(question => question.kind === kind);
const PRACTICE_ID = "cm3k8x2p40000abcdxyz1234";

test("progress requests are read exactly, within the bounds the browser store used", () => {
  const save = { action: "save", attempts: 0, answers: { q1: 0, q9: "water" }, timerStartedAt: 1_762_000_000_000 };
  assert.deepEqual(readProgressRequest(save), save);
  assert.deepEqual(readProgressRequest({ ...save, timerStartedAt: null }), { ...save, timerStartedAt: null });
  // A score, a result or a best never travels with a request.
  for (const extra of [{ result: { correct: 13 } }, { best: 13 }, { correct: 13 }, { score: 100 }, { token: "x".repeat(60) }]) {
    assert.equal(readProgressRequest({ ...save, ...extra }), null, JSON.stringify(extra));
  }
  for (const attempts of [-1, 10_000, 1.5, "1", null]) assert.equal(readProgressRequest({ ...save, attempts }), null, String(attempts));
  for (const answers of [{ x1: 0 }, { q1: 20 }, { q1: -1 }, { q1: 1.5 }, { q1: "x".repeat(READING_LIMITS.answerChars + 1) }, [], null,
    Object.fromEntries(Array.from({ length: READING_LIMITS.questions.max + 1 }, (_, index) => ["q" + (index + 1), 0]))]) {
    assert.equal(readProgressRequest({ ...save, answers }), null, JSON.stringify(answers));
  }
  assert.ok(readProgressRequest({ ...save, answers: { q1: "x".repeat(READING_LIMITS.answerChars) } }), "a 60-character gap answer fits");
  for (const timerStartedAt of [0, -5, "1", undefined]) assert.equal(readProgressRequest({ ...save, timerStartedAt }), null, String(timerStartedAt));

  const check = { action: "check", attempts: 1, answers: { q1: 2 }, finishedSeconds: 600 };
  assert.deepEqual(readProgressRequest(check), check);
  for (const finishedSeconds of [null, 0, 86_400]) assert.ok(readProgressRequest({ ...check, finishedSeconds }), String(finishedSeconds));
  for (const finishedSeconds of [-1, 86_401, 1.5, undefined]) assert.equal(readProgressRequest({ ...check, finishedSeconds }), null, String(finishedSeconds));
  assert.equal(readProgressRequest({ ...check, timerStartedAt: null }), null, "a check has no timer");

  assert.deepEqual(readProgressRequest({ action: "retry", attempts: 2 }), { action: "retry", attempts: 2 });
  assert.equal(readProgressRequest({ action: "retry", attempts: 2, answers: {} }), null);
  assert.equal(readProgressRequest({ action: "grade", attempts: 0, answers: {} }), null);

  // Marking a generated practice names its row, never its key or a score.
  const grade = { id: PRACTICE_ID, attempts: 0, answers: { q1: 0 }, finishedSeconds: null };
  assert.deepEqual(readGradeRequest(grade), { id: PRACTICE_ID, request: { action: "check", attempts: 0, answers: { q1: 0 }, finishedSeconds: null } });
  for (const extra of [{ token: "x".repeat(60) }, { correct: 13 }, { result: {} }, { action: "check" }]) assert.equal(readGradeRequest({ ...grade, ...extra }), null, JSON.stringify(extra));
  for (const id of ["../other", "short", "", 42]) assert.equal(readGradeRequest({ ...grade, id }), null, String(id));
  assert.equal(readGradeRequest({ id: PRACTICE_ID, answers: {}, finishedSeconds: null }), null, "attempts is required");
});

test("stored progress is read back with the same bounds, and anything unusable reads as blank", () => {
  assert.deepEqual(readState(null), blankState());
  assert.deepEqual(readState("x"), blankState());
  const state = readState({
    answers: { q1: 0, bad: 1, q2: 99, q3: "x".repeat(61), q4: "ok" }, best: 99, attempts: 10_000, timerStartedAt: "x", finishedSeconds: 86_401,
    result: { total: 1, correct: 2, percent: 100, results: [] },
  });
  assert.deepEqual(state, { answers: { q1: 0, q4: "ok" }, result: null, best: null, attempts: 0, timerStartedAt: null, finishedSeconds: null });
  const many = readState({ answers: Object.fromEntries(Array.from({ length: 30 }, (_, index) => ["q" + (index + 1), 0])) });
  assert.equal(Object.keys(many.answers).length, READING_LIMITS.questions.max);
  const graded = gradeReading(groups, perfect(groups));
  assert.deepEqual(readState({ answers: {}, result: graded, best: total, attempts: 1, timerStartedAt: null, finishedSeconds: 30 }).result, graded);

  const practice = { id: PRACTICE_ID, title: "Wild Horses", paragraphs: sample.paragraphs, groups: [], language: "mn", sourceName: "notes.pdf", sourceKind: "pdf", createdAt: 1, updatedAt: 2, state: null };
  assert.equal(readSavedPractice(practice), null, "a practice without questions is not shown");
  const shown = readSavedPractice({ ...practice, groups: [{ instruction: "Choose TRUE, FALSE or NOT GIVEN.", questions: [{ id: "q1", kind: "tfng", prompt: "A statement." }] }] });
  assert.ok(shown);
  assert.deepEqual(shown.state, blankState());
  assert.equal(readSavedPractice({ ...practice, id: "../x" }), null);
});

test("answers must name a question of the practice and fit it", () => {
  assert.ok(answersFit(groups, sample.paragraphs.length, perfect(groups)));
  assert.ok(answersFit(groups, sample.paragraphs.length, {}));
  assert.ok(!answersFit(groups, sample.paragraphs.length, { q99: 0 }), "a question from another practice");
  assert.ok(!answersFit(groups, sample.paragraphs.length, { [firstOf("tfng").id]: 3 }), "TRUE/FALSE/NOT GIVEN has three choices");
  assert.ok(!answersFit(groups, sample.paragraphs.length, { [firstOf("tfng").id]: "TRUE" }));
  assert.ok(!answersFit(groups, sample.paragraphs.length, { [firstOf("gap").id]: 1 }), "a gap takes words");
  assert.ok(!answersFit(groups, sample.paragraphs.length, { [firstOf("choice").id]: firstOf("choice").options.length }));
  const match = groups.find(group => group.questions[0].kind === "match");
  if (match) assert.ok(!answersFit(groups, sample.paragraphs.length, { [match.questions[0].id]: 12 }));
});

test("a check is marked from the key the caller holds, never from anything the browser claims", () => {
  const answers = { ...perfect(groups), [firstOf("tfng").id]: (firstOf("tfng").answer + 1) % 3 };
  const outcome = applyProgress(blankState(), { action: "check", attempts: 0, answers, finishedSeconds: 900 }, groups);
  assert.ok(!("stale" in outcome));
  assert.deepEqual(outcome.state.result, gradeReading(groups, answers));
  assert.equal(outcome.state.result.correct, total - 1);
  assert.deepEqual({ ...outcome.state, result: null }, { answers, result: null, best: total - 1, attempts: 1, timerStartedAt: null, finishedSeconds: 900 });
  // The same answers marked with another key give that key's score: the key passed in is the only one used.
  const otherKey = groups.map(group => ({ ...group, questions: group.questions.map(question => question.kind === "tfng" ? { ...question, answer: (question.answer + 1) % 3 } : question) }));
  const other = applyProgress(blankState(), { action: "check", attempts: 0, answers, finishedSeconds: null }, otherKey);
  assert.notEqual(other.state.result.correct, outcome.state.result.correct);
  assert.deepEqual(other.state.result, gradeReading(otherKey, answers));

  // The server reads the key from the student's own row and passes only that to the rules.
  const service = text("src/modules/reading-lab/service.ts");
  assert.match(service, /const row = await getDb\(\)\.readingPractice\.findFirst\(\{ where: \{ id, userId \}, select: PRACTICE_SELECT \}\);/);
  assert.match(service, /const \{ row, groups, practice \} = await ownPractice\(userId, id\);/);
  assert.match(service, /const outcome = applyProgress\(practice\.state, input, groups\);/);
  assert.match(service, /const input = readGradeRequest\(body\);/);
  // Samples are marked with the built-in key, the same rules a guest's browser uses.
  assert.match(service, /applyProgress\(row \? readState\(row\.state\) : blankState\(\), input, sample\.groups\)/);
  assert.match(service, /if \(record\(body\) && "token" in body\) throw new ApiError\(409, RELOAD\);/, "a page from before the move is told to reload");
});

test("a change made from an out-of-date view is refused; repeats are harmless", () => {
  const answers = perfect(groups);
  const save = applyProgress(blankState(), { action: "save", attempts: 0, answers: { q1: 0 }, timerStartedAt: 5 }, groups);
  assert.deepEqual(save, { state: { ...blankState(), answers: { q1: 0 }, timerStartedAt: 5 }, changed: true });
  assert.equal(applyProgress(save.state, { action: "save", attempts: 0, answers: { q1: 0 }, timerStartedAt: 5 }, groups).changed, false);
  assert.ok("stale" in applyProgress(save.state, { action: "save", attempts: 1, answers: {}, timerStartedAt: null }, groups), "another device checked meanwhile");

  const checked = applyProgress(save.state, { action: "check", attempts: 0, answers, finishedSeconds: 60 }, groups).state;
  assert.equal(checked.attempts, 1);
  assert.ok("stale" in applyProgress(checked, { action: "save", attempts: 1, answers: {}, timerStartedAt: null }, groups), "checked answers are locked until a reset");
  assert.deepEqual(applyProgress(checked, { action: "check", attempts: 0, answers, finishedSeconds: 60 }, groups), { state: checked, changed: false }, "a check sent twice counts once");
  assert.ok("stale" in applyProgress(checked, { action: "check", attempts: 0, answers: {}, finishedSeconds: 60 }, groups));
  assert.ok("stale" in applyProgress(checked, { action: "check", attempts: 1, answers, finishedSeconds: 60 }, groups));

  const cleared = applyProgress(checked, { action: "retry", attempts: 1 }, groups);
  assert.deepEqual(cleared, { state: { answers: {}, result: null, best: total, attempts: 1, timerStartedAt: null, finishedSeconds: null }, changed: true });
  assert.ok("stale" in applyProgress(checked, { action: "retry", attempts: 0 }, groups));
  const typed = applyProgress(cleared.state, { action: "save", attempts: 1, answers: { q2: 1 }, timerStartedAt: null }, groups).state;
  assert.deepEqual(applyProgress(typed, { action: "retry", attempts: 1 }, groups), { state: typed, changed: false }, "a second reset keeps what was typed since");
  // The best score is the best over every check.
  const worse = applyProgress(typed, { action: "check", attempts: 1, answers: { q2: 1 }, finishedSeconds: null }, groups).state;
  assert.equal(worse.attempts, 2);
  assert.equal(worse.best, total);
  assert.ok(worse.result.correct < total);
});

test("a moved practice believes only its token, and its passage must match the sealed key", () => {
  const before = process.env[SECRET_ENV];
  process.env[SECRET_ENV] = "reading-lab-storage-test-secret-0123456789abcdef";
  try {
    const sealed = { title: sample.title, language: "mn", paragraphs: sample.paragraphs.length, groups, sourceName: "notes.pdf", sourceKind: "pdf", createdAt: 1 };
    const token = sealReading("user-1", sealed, 1_000);
    const code = fn => { try { fn(); return "opened"; } catch (error) { return error instanceof ReadingTokenError ? error.code : String(error); } };
    const later = 1_000 + READING_TOKEN_TTL_MS + 1;
    assert.equal(code(() => openReading(token, "user-1", later)), "expired", "an expired token no longer marks answers");
    assert.deepEqual(openReading(token, "user-1", later, { allowExpired: true }), sealed, "but it still moves to the account");
    assert.equal(code(() => openReading(token, "user-2", later, { allowExpired: true })), "invalid", "only for its own student");
    // One token imports once: the account remembers its SHA-256, not the token.
    const key = readingImportKey(token);
    assert.equal(key, createHash("sha256").update(token).digest("hex"));
    assert.match(key, /^[0-9a-f]{64}$/);
    assert.equal(readingImportKey(token), key);
    assert.notEqual(readingImportKey(sealReading("user-1", sealed, 1_000)), key, "a fresh seal is a different practice");
    const service = text("src/modules/reading-lab/service.ts");
    assert.match(service, /openReading\(input\.token, userId, Date\.now\(\), \{ allowExpired: true \}\)/);
    assert.match(service, /const importKey = readingImportKey\(input\.token\);/);
    assert.match(service, /userId_importKey: \{ userId, importKey \}/);
  } finally {
    if (before === undefined) delete process.env[SECRET_ENV]; else process.env[SECRET_ENV] = before;
  }

  const paragraphs = sample.paragraphs;
  assert.deepEqual(importedParagraphs([...paragraphs], paragraphs.length, groups), paragraphs);
  assert.equal(importedParagraphs(paragraphs.slice(1), paragraphs.length, groups), null, "the sealed paragraph count");
  assert.equal(importedParagraphs(paragraphs.slice(0, 2), 2, groups), null, "at least three paragraphs");
  assert.equal(importedParagraphs(paragraphs.map((paragraph, index) => index ? paragraph : "x".repeat(READING_LIMITS.paragraph + 1)), paragraphs.length, groups), null);
  assert.equal(importedParagraphs(paragraphs.map((paragraph, index) => index ? paragraph : 42), paragraphs.length, groups), null);
  assert.equal(importedParagraphs("text", paragraphs.length, groups), null);
  const quoted = questions.find(question => question.evidence).evidence;
  const rewritten = paragraphs.map(paragraph => paragraph.replace(quoted, "Something else entirely was written here instead."));
  assert.equal(importedParagraphs(rewritten, paragraphs.length, groups), null, "a passage without the key's evidence is not this practice");

  const practice = { kind: "practice", token: "t".repeat(60), paragraphs, state: { answers: {}, checked: false, attempts: 0, timerStartedAt: null, finishedSeconds: null } };
  assert.deepEqual(readImportRequest(practice), practice);
  assert.deepEqual(readImportRequest({ ...practice, state: undefined }), { ...practice, state: null });
  for (const bad of [{ ...practice, score: 13 }, { ...practice, token: "short" }, { ...practice, token: "t".repeat(READING_LIMITS.tokenChars + 1) }, { ...practice, kind: "exam" }, null]) {
    assert.equal(readImportRequest(bad), null);
  }
  assert.deepEqual(readImportRequest({ kind: "samples", samples: { takhi: {} } }), { kind: "samples", samples: { takhi: {} } });
  assert.equal(readImportRequest({ kind: "samples", samples: { "Not An Id": {} } }), null);
  assert.equal(readImportRequest({ kind: "samples", samples: Object.fromEntries(Array.from({ length: 21 }, (_, index) => ["s" + index, {}])) }), null);
  assert.equal(readImportRequest({ kind: "samples", samples: [] }), null);
});

test("moved progress is marked again from the key, and a claimed score is ignored", () => {
  const tfng = firstOf("tfng");
  const answers = { ...perfect(groups), [tfng.id]: (tfng.answer + 1) % 3 };
  const claimed = { answers, checked: true, attempts: 3, best: total, result: { correct: total, total, percent: 100, results: [] }, timerStartedAt: 9, finishedSeconds: 700 };
  const state = importedState(claimed, groups, sample.paragraphs.length);
  assert.deepEqual(state.result, gradeReading(groups, answers));
  assert.equal(state.best, total - 1, "the browser's best is not carried over");
  assert.deepEqual({ ...state, result: null }, { answers, result: null, best: total - 1, attempts: 3, timerStartedAt: null, finishedSeconds: 700 });
  assert.equal(importedState({ ...claimed, attempts: 0 }, groups, sample.paragraphs.length).attempts, 1, "a checked practice counts one check");

  const open = importedState({ answers: { q1: 0, q99: 1, [tfng.id]: 7 }, checked: false, attempts: 2, best: 13, timerStartedAt: 123, finishedSeconds: 5 }, groups, sample.paragraphs.length);
  const kept = tfng.id === "q1" ? {} : { q1: 0 };
  assert.deepEqual(open, { answers: kept, result: null, best: null, attempts: 2, timerStartedAt: 123, finishedSeconds: null }, "answers that do not fit are dropped");
  assert.ok(isBlank(importedState(null, groups, sample.paragraphs.length)));
  assert.ok(!isBlank(open));

  // What the browser sends: the answers and whether they were checked, never a score.
  const browser = { answers: { q1: 0 }, result: gradeReading(groups, { q1: 0 }), best: 5, attempts: 2, timerStartedAt: null, finishedSeconds: 40 };
  assert.deepEqual(legacyState(browser), { answers: { q1: 0 }, checked: true, attempts: 2, timerStartedAt: null, finishedSeconds: 40 });
});

test("the account keeps at most 20 practices, and a full library is refused before credits are held", () => {
  assert.equal(READING_LIMITS.practices, 20);
  assert.match(PRACTICES_FULL, /20 дасгал/);
  const service = text("src/modules/reading-lab/service.ts");
  const full = "const saved = await db.readingPractice.count({ where: { userId } });\n  if (saved >= READING_LIMITS.practices) throw new ApiError(409, PRACTICES_FULL);";
  assert.ok(service.includes(full));
  assert.ok(service.indexOf(full) < service.indexOf("return chargeCredits("), "the 409 comes before any credits are held");
  assert.ok(service.indexOf("await ensureNoTimedExam(userId);") < service.indexOf(full));
  // Counted again just before the practice is saved (a move from another tab may fill the last place); the hold is then refunded.
  const again = service.indexOf("if (await db.readingPractice.count({ where: { userId } }) >= READING_LIMITS.practices) throw new ApiError(409, PRACTICES_FULL);");
  assert.ok(again > service.indexOf("return chargeCredits(") && again < service.indexOf("await db.readingPractice.create("));
  // A page from before the move does not send `store` and is told to reload before credits are held.
  assert.ok(service.indexOf('if (form.get("store") !== "account") throw new ApiError(409, RELOAD);') < service.indexOf("return chargeCredits("));
  // Moving: a practice already moved is returned as it is; otherwise the same 20-practice ceiling applies.
  const importAt = service.indexOf("export async function importReading(");
  assert.ok(service.indexOf("if (existing) return { practice: shown(existing), imported: false };", importAt) < service.indexOf(">= READING_LIMITS.practices) {", importAt));
  // Every query on a practice is scoped to the signed-in student.
  const queries = [...service.matchAll(/readingPractice\.\w+\(\{\s*where: \{([^}]*)/g)];
  assert.ok(queries.length >= 7);
  for (const [query, where] of queries) assert.match(where, /userId/, query);
  assert.match(service, /const where = \{ userId_sampleId: \{ userId, sampleId: sample\.id \} \};/);

  const client = text("src/modules/reading-lab/client.tsx");
  assert.match(client, /<Creator full=\{practices\.length >= READING_LIMITS\.practices\}/);
  assert.match(client, /const ready = !full && /);
  assert.match(client, /form\.append\("store", "account"\);/);
  // Moving from the browser stops sending once the account is full, newest practice first.
  assert.match(client, /else if \(response\.status === 409\) overflow\+\+;/);
  assert.match(text("src/modules/reading-lab/store.ts"), /found\.sort\(\(a, b\) => b\.createdAt - a\.createdAt\);/);
});

test("the routes are same-origin, session-checked and bounded; the page reads the account", () => {
  const bounds = {
    "src/app/api/labs/ielts-reading/grade/route.ts": "READING_LIMITS.gradeBodyBytes",
    "src/app/api/labs/ielts-reading/practices/[id]/route.ts": "READING_LIMITS.progressBodyBytes",
    "src/app/api/labs/ielts-reading/samples/[id]/route.ts": "READING_LIMITS.progressBodyBytes",
    "src/app/api/labs/ielts-reading/import/route.ts": "READING_LIMITS.importBodyBytes",
  };
  for (const [path, limit] of Object.entries(bounds)) {
    const route = text(path);
    assert.match(route, /checkOrigin\(request\);\s+const user = await apiUser\(request\);/, path);
    assert.ok(route.includes(`readJson(request, ${limit})`), path);
    assert.match(route, /user\.id/, path);
  }
  assert.match(text("src/app/api/labs/ielts-reading/practices/[id]/route.ts"), /export async function DELETE/);
  assert.ok(READING_LIMITS.progressBodyBytes <= 16 * 1024 && READING_LIMITS.importBodyBytes <= 320 * 1024);
  const page = text("src/app/labs/ielts-reading/page.tsx");
  assert.match(page, /if \(!readingLabEnabled\(\)\) notFound\(\);/);
  assert.match(page, /const library = userId \? await readingLibrary\(userId\) : null;/);
  assert.match(page, /initialPractices=\{library\?\.practices \?\? \[\]\} initialSamples=\{library\?\.samples \?\? \{\}\}/);
  // The samples stay open during a timed mock; only generation (a new practice or a retry) checks for an open sitting.
  const service = text("src/modules/reading-lab/service.ts");
  assert.equal(service.match(/await ensureNoTimedExam\(userId\)/g).length, 4);
  // Nothing about a signed-in student's work is kept in the browser by the page itself.
  assert.doesNotMatch(text("src/modules/reading-lab/client.tsx"), /localStorage/);
});

test("browser data moves once; only the signed-in student's own slot is removed, never the guest's", () => {
  const storage = new Map();
  const saved = { localStorage: globalThis.localStorage, dispatchEvent: globalThis.dispatchEvent };
  globalThis.localStorage = { getItem: key => storage.has(key) ? storage.get(key) : null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
  globalThis.dispatchEvent = () => true;
  try {
    const answered = { answers: { q1: 0 }, result: gradeReading(groups, { q1: 0 }), best: 1, attempts: 1, timerStartedAt: null, finishedSeconds: 30 };
    const own = (id, createdAt, token = "t".repeat(60) + id) => ({ id, title: "T " + id, paragraphs: ["p"], groups: [], token, language: "mn", sourceName: "a", sourceKind: "pdf", createdAt, updatedAt: createdAt, state: answered });
    const guest = JSON.stringify({ samples: { takhi: answered }, own: [], textSize: 0 });
    storage.set("education-reading-lab-v1:guest", guest);
    storage.set("education-reading-lab-v1:user-1", JSON.stringify({ samples: { takhi: answered, "Bad Id": answered }, own: [own("old", 1), own("new", 2), own("broken", 3, "short")], textSize: 2 }));

    const legacy = legacyReading("user-1");
    assert.deepEqual(legacy.practices.map(item => item.id), ["new", "old"], "newest first; an unusable token is not sent");
    assert.deepEqual(legacy.practices[0].body, { kind: "practice", token: "t".repeat(60) + "new", paragraphs: ["p"], state: legacyState(answered) });
    assert.deepEqual(legacy.samples, { takhi: legacyState(answered) });
    assert.deepEqual(legacyReading("guest"), { practices: [], samples: null }, "the guest slot is not moved");
    assert.deepEqual(legacyReading("user-2"), { practices: [], samples: null });

    forgetLegacySamples("user-1");
    forgetLegacyPractice("user-1", "new");
    assert.deepEqual(legacyReading("user-1").practices.map(item => item.id), ["old"]);
    assert.equal(legacyReading("user-1").samples, null);
    forgetLegacyPractice("user-1", "old");
    // A practice without a usable token could not move (or be checked before the move), so it does not keep the slot.
    assert.ok(!storage.has("education-reading-lab-v1:user-1"), "nothing of the account's work is left in the browser");
    assert.equal(storage.get("education-reading-lab-text-v1"), "2", "the text size stays as a device preference");
    assert.equal(storage.get("education-reading-lab-v1:guest"), guest, "the guest slot is untouched");
    forgetLegacySamples("guest");
    tidyLegacyReading("guest");
    assert.equal(storage.get("education-reading-lab-v1:guest"), guest);
    // A slot with nothing left to move is removed on the next visit.
    storage.set("education-reading-lab-v1:user-3", JSON.stringify({ samples: {}, own: [own("x", 1, "short")], textSize: 1 }));
    assert.deepEqual(legacyReading("user-3"), { practices: [], samples: null });
    tidyLegacyReading("user-3");
    assert.ok(!storage.has("education-reading-lab-v1:user-3"));
    assert.equal(storage.get("education-reading-lab-text-v1"), "2", "an earlier device choice is not overwritten");

    setGuestSample("paper", blankState());
    const next = JSON.parse(storage.get("education-reading-lab-v1:guest"));
    assert.deepEqual(Object.keys(next.samples).sort(), ["paper", "takhi"]);
    assert.equal(next.textSize, 0);
  } finally {
    globalThis.localStorage = saved.localStorage;
    globalThis.dispatchEvent = saved.dispatchEvent;
  }
});
