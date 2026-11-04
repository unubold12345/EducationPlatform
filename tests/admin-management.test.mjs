import test from "node:test";
import assert from "node:assert/strict";
import { editableQuestions, applyQuestionFix, fixChanges } from "../src/modules/content/fix.ts";
import { validateContentShape, validateAnswerKeys } from "../src/modules/content/validation.ts";
import { pageInfo, pageWindow, parsePage } from "../src/modules/admin/paging.ts";
import { validPlanPrice } from "../src/modules/subscriptions/plans.ts";
import { normalizeIp } from "../src/modules/admin/ip.ts";
import { nextAttempt, ACCOUNT_ATTEMPTS } from "../src/lib/account-throttle-rule.ts";
import { examDefinitions } from "../src/modules/exams/definitions.ts";

const clone = value => JSON.parse(JSON.stringify(value));

test("every mock question is listed for fixing with a reachable path", () => {
  for (const exam of examDefinitions) {
    const expected = exam.stages.reduce((sum, stage) => sum + stage.questions.length + (stage.variants ? stage.variants.lower.length + stage.variants.higher.length : 0), 0);
    const listed = editableQuestions(clone(exam));
    assert.equal(listed.length, expected, exam.slug);
    assert.equal(new Set(listed.map(q => q.path.join("."))).size, listed.length, exam.slug);
  }
});

test("a mock question fix publishes a valid body and records only the changed fields", () => {
  const source = examDefinitions.find(item => item.program === "sat");
  const exam = clone(source);
  const first = editableQuestions(exam).find(q => q.kind === "choice" && q.explanation);
  const fixed = applyQuestionFix(exam, first.path, { prompt: "  Corrected prompt.  ", explanation: "  Corrected explanation.  " });
  assert.ok(fixed);
  assert.ok(validateContentShape(source, fixed) && validateAnswerKeys(fixed));
  assert.deepEqual(Object.keys(fixChanges(exam, fixed, first.path)).sort(), ["explanation", "prompt"]);
  assert.equal(JSON.stringify(exam), JSON.stringify(source), "input body is not mutated");
});

test("a mock choice fix must keep the answer among the options; adaptive variants are reachable", () => {
  const exam = clone(examDefinitions.find(item => item.program === "sat"));
  const choice = editableQuestions(exam).find(q => q.kind === "choice" && q.options?.length);
  const other = choice.options.find(option => option !== choice.answers[0]);
  const fixed = applyQuestionFix(exam, choice.path, { answers: [other] });
  assert.ok(fixed && validateAnswerKeys(fixed) && validateContentShape(examDefinitions.find(item => item.slug === exam.slug), fixed));
  const bad = applyQuestionFix(exam, choice.path, { answers: ["not an option"] });
  assert.ok(bad && !validateAnswerKeys(bad), "server validation rejects an answer that is not an option");
  assert.ok(editableQuestions(exam).some(q => q.path.includes("variants")), "module two variants are listed");
});

test("fixes cannot reach structure, add fields, change counts or retype values", () => {
  const exam = clone(examDefinitions.find(item => item.program === "sat"));
  const path = editableQuestions(exam).find(q => q.kind === "choice" && q.options?.length).path;
  assert.equal(applyQuestionFix(exam, ["slug"], { prompt: "x" }), null);
  assert.equal(applyQuestionFix(exam, ["questions", 0], { prompt: "x" }), null, "the removed exercise shape is not reachable");
  assert.equal(applyQuestionFix(exam, ["stages", 0, "questions", 999], { prompt: "x" }), null);
  assert.equal(applyQuestionFix(exam, ["stages", "0", "questions", 0], { prompt: "x" }), null);
  assert.equal(applyQuestionFix(exam, path, { id: "other" }), null);
  assert.equal(applyQuestionFix(exam, path, { correct: 1 }), null, "mock questions have no correct field");
  assert.equal(applyQuestionFix(exam, path, { options: ["only one"] }), null);
  assert.equal(applyQuestionFix(exam, path, { prompt: 1 }), null);
  assert.equal(applyQuestionFix(exam, path, {}), null);
  assert.equal(applyQuestionFix(exam, ["__proto__", 0], { prompt: "x" }), null);
});

test("admin pagination clamps pages and shows a short window with gaps", () => {
  assert.deepEqual(pageInfo(0, 5), { page: 1, pages: 1, size: 20, skip: 0, from: 0, to: 0, total: 0 });
  assert.deepEqual(pageInfo(45, 9), { page: 3, pages: 3, size: 20, skip: 40, from: 41, to: 45, total: 45 });
  assert.deepEqual(pageWindow(1, 1), [1]);
  assert.deepEqual(pageWindow(6, 12), [1, null, 4, 5, 6, 7, 8, null, 12]);
  assert.deepEqual(pageWindow(2, 4), [1, 2, 3, 4]);
  assert.equal(parsePage("abc"), 1); assert.equal(parsePage("-3"), 1); assert.equal(parsePage("7"), 7);
});

test("plan prices accept whole hundreds of tugrik within the allowed range only", () => {
  for (const ok of [1000, 40000, 59900, 1000000]) assert.ok(validPlanPrice(ok), String(ok));
  for (const bad of [999, 40050, 1000100, -40000, 40000.5, "40000", null, NaN]) assert.ok(!validPlanPrice(bad), String(bad));
});

test("activity IPs are stored in one canonical form so repeat sign-ins group together", () => {
  assert.equal(normalizeIp("0000:0000:0000:0000:0000:0000:0000:0001"), "::1");
  assert.equal(normalizeIp("::1"), "::1");
  assert.equal(normalizeIp("2001:0db8:0000:0000:0000:ff00:0042:8329"), "2001:db8::ff00:42:8329");
  assert.equal(normalizeIp("2001:DB8:1:0:1:0:1:1"), "2001:db8:1:0:1:0:1:1");
  assert.equal(normalizeIp("203.0.113.7"), "203.0.113.7");
  assert.equal(normalizeIp(""), null); assert.equal(normalizeIp(null), null);
});

test("per-account sign-in attempts allow ten per minute, then reset after the window", () => {
  let state = null; const start = 1_000_000;
  for (let i = 0; i < ACCOUNT_ATTEMPTS; i++) { const next = nextAttempt(state, start + i * 1000); assert.ok(next.allowed, String(i)); state = next; }
  assert.equal(nextAttempt(state, start + 20_000).allowed, false);
  const later = nextAttempt(state, start + 60_000);
  assert.ok(later.allowed); assert.equal(later.count, 1);
});

