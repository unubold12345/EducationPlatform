import test from "node:test";
import assert from "node:assert/strict";
import { editableQuestions, applyQuestionFix, fixChanges } from "../src/modules/content/fix.ts";
import { validateContentShape, validateAnswerKeys } from "../src/modules/content/validation.ts";
import { pageInfo, pageWindow, parsePage } from "../src/modules/admin/paging.ts";
import { validPlanPrice } from "../src/modules/subscriptions/plans.ts";
import { normalizeIp } from "../src/modules/admin/ip.ts";
import { exerciseSets } from "../src/modules/exercises/content.ts";
import { examDefinitions } from "../src/modules/exams/definitions.ts";

const clone = value => JSON.parse(JSON.stringify(value));

test("every exercise and mock question is listed for fixing with a reachable path", () => {
  for (const set of exerciseSets) assert.equal(editableQuestions(clone(set)).length, set.questions.length, set.slug);
  for (const exam of examDefinitions) {
    const expected = exam.stages.reduce((sum, stage) => sum + stage.questions.length + (stage.variants ? stage.variants.lower.length + stage.variants.higher.length : 0), 0);
    const listed = editableQuestions(clone(exam));
    assert.equal(listed.length, expected, exam.slug);
    assert.equal(new Set(listed.map(q => q.path.join("."))).size, listed.length, exam.slug);
  }
});

test("an exercise answer fix publishes a valid body and records only the changed fields", () => {
  const set = clone(exerciseSets[0]);
  const first = editableQuestions(set)[0];
  const correct = (set.questions[0].correct + 1) % set.questions[0].options.length;
  const fixed = applyQuestionFix(set, first.path, { correct, explanation: "  Corrected explanation.  " });
  assert.ok(fixed);
  assert.equal(fixed.questions[0].correct, correct);
  assert.equal(fixed.questions[0].explanation, "Corrected explanation.");
  assert.ok(validateContentShape(exerciseSets[0], fixed) && validateAnswerKeys(fixed));
  assert.deepEqual(Object.keys(fixChanges(set, fixed, first.path)).sort(), ["correct", "explanation"]);
  assert.equal(set.questions[0].correct, exerciseSets[0].questions[0].correct, "input body is not mutated");
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
  const set = clone(exerciseSets[0]);
  const path = ["questions", 0];
  assert.equal(applyQuestionFix(set, ["slug"], { prompt: "x" }), null);
  assert.equal(applyQuestionFix(set, ["questions", 999], { prompt: "x" }), null);
  assert.equal(applyQuestionFix(set, ["questions", "0"], { prompt: "x" }), null);
  assert.equal(applyQuestionFix(set, path, { id: "other" }), null);
  assert.equal(applyQuestionFix(set, path, { answers: ["a"] }), null, "exercise questions have no answers field");
  assert.equal(applyQuestionFix(set, path, { options: ["only one"] }), null);
  assert.equal(applyQuestionFix(set, path, { correct: "1" }), null);
  assert.equal(applyQuestionFix(set, path, {}), null);
  assert.equal(applyQuestionFix(set, ["__proto__", 0], { prompt: "x" }), null);
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
