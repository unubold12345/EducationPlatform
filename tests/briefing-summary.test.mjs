import test from "node:test";
import assert from "node:assert/strict";
import { findExam } from "../src/modules/exams/definitions.ts";
import { formatExamDuration, mockBriefingSummary } from "../src/modules/exams/briefing-summary.ts";

test("SAT briefing summary counts delivered questions and full timing without double counting", () => {
  const sat = findExam("sat-full-01");
  assert.ok(sat);
  const summary = mockBriefingSummary(sat);
  assert.equal(summary.deliveredQuestions, 98);
  assert.equal(summary.totalSeconds, 8640);
  assert.equal(summary.breakSeconds, 600);
  assert.equal(formatExamDuration(summary.totalSeconds), "2ц 24м");
  assert.deepEqual(summary.facts.map(fact => fact.value), ["98", "4 + 10м завсарлага", "2ц 24м нийт", "Raw оноо"]);
});

test("IELTS briefing summary counts Listening and Reading once, then tasks and speaking parts", () => {
  const ielts = findExam("ielts-academic-01");
  assert.ok(ielts);
  const summary = mockBriefingSummary(ielts);
  assert.equal(summary.deliveredQuestions, 80);
  assert.equal(summary.totalSeconds, 9840);
  assert.equal(formatExamDuration(summary.totalSeconds), "2ц 44м");
  assert.deepEqual(summary.facts.map(fact => fact.value), ["80 + 2 даалгавар", "4", "2ц 44м", "Listen/Read оноо"]);
  assert.match(summary.scoreNote, /band/);
});
