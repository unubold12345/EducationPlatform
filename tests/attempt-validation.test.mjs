import test from "node:test";
import assert from "node:assert/strict";
import { validateAnswers } from "../src/modules/attempts/validation.ts";
test("draft allows unanswered questions but submission requires all answers", () => {
  assert.equal(validateAnswers({revision: 0, answers: [null, 1]}, [4, 4], false), true);
  assert.equal(validateAnswers({revision: 0, answers: [null, 1]}, [4, 4], true), false);
  assert.equal(validateAnswers({revision: 2, answers: [3, 0]}, [4, 4], true), true);
});
test("rejects forged revisions, answer indexes, missing fields and extra responses", () => {
  for (const input of [null, {}, {revision:-1,answers:[0]}, {revision:"0",answers:[0]}, {revision:0.5,answers:[0]}, {revision:0,answers:[4]}, {revision:0,answers:["1"]}, {revision:0,answers:[0,1]}, {revision:0,answers:[]}, {revision:0,answers:[-1]}]) {
    assert.equal(validateAnswers(input, [4], false), false);
  }
});

