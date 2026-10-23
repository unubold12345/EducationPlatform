import test from "node:test";
import assert from "node:assert/strict";
import { gradePractice } from "../src/modules/practice/grading.ts";

test("scores all correct answers and returns explanations", () => {
  const result = gradePractice({ answers: [1, 2, 3] });
  assert.equal(result.score, 3);
  assert.equal(result.total, 3);
  assert.ok(result.reviews.every(review => review.explanation.length > 0));
});
test("scores selected answers rather than client-supplied score", () => {
  assert.equal(gradePractice({ answers: [0, 2, 0], score: 3 }).score, 1);
});
test("rejects incomplete, invalid and malformed responses", () => {
  for (const input of [null, {}, [], { answers: [1] }, { answers: [1, 2, 3, 0] }, { answers: ["1", 2, 3] }, { answers: [1, -1, 3] }, { answers: [4, 2, 3] }, { answers: [null, 2, 3] }, { answers: [1.5, 2, 3] }]) {
    assert.equal(gradePractice(input), null);
  }
});

