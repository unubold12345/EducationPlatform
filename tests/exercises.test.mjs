import test from "node:test";
import assert from "node:assert/strict";
import { exerciseSets, publicExercise, findExercise } from "../src/modules/exercises/content.ts";
import { gradeExercise } from "../src/modules/exercises/grading.ts";

test("all three programs have complete, uniquely versioned exercise sets", () => {
  assert.equal(exerciseSets.length, 10);
  const questions = exerciseSets.flatMap(set => set.questions);
  assert.equal(questions.length, 80);
  assert.equal(new Set(questions.map(q => q.id)).size, 80);
  assert.equal(new Set(exerciseSets.map(set => set.examId)).size, 10);
  for (const program of ["sat", "ielts", "entrance"]) assert.ok(exerciseSets.filter(set => set.program === program).length >= 3);
  for (const q of questions) {
    assert.equal(new Set(q.options).size, q.options.length);
    assert.ok(q.correct >= 0 && q.correct < q.options.length);
    assert.ok(q.explanation.trim());
  }
  assert.equal(findExercise("not-an-exercise"), undefined);
});

test("draft exercise props exclude all keys and explanations", () => {
  for (const set of exerciseSets) {
    const data = publicExercise(set);
    assert.equal(data.questions.length, 8);
    assert.ok(data.questions.every(q => !Object.hasOwn(q, "correct") && !Object.hasOwn(q, "explanation")));
    assert.ok(set.questions.every(q => !JSON.stringify(data).includes(q.explanation)));
  }
});

test("every set grades exact correct and incorrect answers, ignoring forged score", () => {
  for (const set of exerciseSets) {
    const answers = set.questions.map(q => q.correct);
    assert.equal(gradeExercise(set, { answers, score: -99 }).score, 8);
    const wrong = set.questions.map(q => (q.correct + 1) % q.options.length);
    const result = gradeExercise(set, { answers: wrong, score: 999 });
    assert.equal(result.score, 0);
    assert.equal(result.reviews.length, 8);
    assert.ok(result.reviews.every(r => r.explanation && Number.isInteger(r.correct)));
  }
});

test("grading rejects malformed, partial and out-of-range answers for every set", () => {
  for (const set of exerciseSets) {
    const valid = set.questions.map(q => q.correct);
    for (const input of [null, {}, [], { answers: valid.slice(1) }, { answers: [...valid, 0] },
      { answers: [null, ...valid.slice(1)] }, { answers: ["0", ...valid.slice(1)] },
      { answers: [-1, ...valid.slice(1)] }, { answers: [4, ...valid.slice(1)] },
      { answers: [0.5, ...valid.slice(1)] }]) assert.equal(gradeExercise(set, input), null);
  }
});

test("numerical answer keys match independent calculations", () => {
  const expected = {
    "sat-algebra": [String((26+9)/5), String((19-7)/(6-2)), String((8+7)/3), "x < 4", String(10-2*3), String((104-8*10)/(12-8)), String(20/5*3), "None"],
    "sat-advanced": ["2 and 5", String(-9), String(Math.round(200*1.1**2)), "x + 2", String(4**2-5), String(36/4), String(16**(3/4)), "(x − 3)(x + 3)"],
    "sat-data": [String((920-800)/800*100)+"%", String((8+10+12+14)/4), "3/8", String((20*80+10*95)/30), "40 per km²", String([3,9,4,12,7].sort((a,b)=>a-b)[2])],
    "sat-geometry": [String(Math.hypot(6,8)), "49π", "90π", String(180-65-55)+"°", "3/5", "9:1", "π", "−1/2"],
    "entrance-math": [String(2**3*2**4), String(Math.log2(32)), String(2+3), String(4+9*3), String(3*2**2-2), "1", "1/2", "68,000₮"],
    "entrance-physics": ["12 м/с", "3 м/с²", "40 Ж", "30 Вт", "2 А", "5 Ом", "100 Ж", "21,000 Ж"],
  };
  for (const [slug, values] of Object.entries(expected)) {
    const set = findExercise(slug);
    values.forEach((value, index) => assert.equal(set.questions[index].options[set.questions[index].correct].replaceAll("−", "-"), value.replaceAll("−", "-"), `${slug} Q${index+1}`));
  }
});
