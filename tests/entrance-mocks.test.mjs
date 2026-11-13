import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { entranceMocks, entranceCounts, findEntranceMeta, mocksForYear, entranceYears, entranceTotal } from "../src/modules/exams/entrance/catalog.ts";
import { entranceDefinition } from "../src/modules/exams/entrance/content.ts";
import { findExam } from "../src/modules/exams/definitions.ts";
import { createExamState, isCorrect, makeReport, normaliseMath } from "../src/modules/exams/engine.ts";
import { mockPractice, practiceStats } from "../src/modules/exam-practice/form.ts";
import { mathHtml, optionTex } from "../src/modules/exams/math-typesetting.ts";

const root = new URL("../", import.meta.url);
const disk = path => new URL(path, root).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const publicFile = src => disk("public" + src);

test("the imported ЭЕШ catalog covers 55 Mathematics, 60 Physics, 18 Chemistry, 21 Biology and 40 English papers", () => {
  assert.equal(entranceTotal, 194);
  assert.deepEqual(entranceCounts(), { math: 55, physics: 60, chemistry: 18, biology: 21, english: 40 });
  assert.deepEqual(entranceYears("math"), [2026, 2025, 2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015]);
  assert.deepEqual(entranceYears("physics"), [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015]);
  assert.deepEqual(entranceYears("english"), [2026, 2025, 2024, 2023, 2022, 2020, 2019, 2018]);
  // Chemistry has no 2024 forms: no 2024 reference paper could be obtained.
  assert.deepEqual(entranceYears("chemistry"), [2026, 2025, 2023, 2022, 2021, 2020]);
  assert.deepEqual(entranceYears("biology"), [2026, 2025, 2024, 2023, 2022, 2021, 2020]);
  const formsPerYear = { math: 5, physics: 5, english: 5, chemistry: 3, biology: 3 };
  const minutes = { math: 100, physics: 100, chemistry: 100, biology: 80, english: 80 };
  for (const mock of entranceMocks) {
    assert.equal(mocksForYear(mock.subject, mock.year).length, formsPerYear[mock.subject], mock.slug);
    assert.equal(mock.points, 100, mock.slug);
    assert.equal(mock.durationMinutes, minutes[mock.subject], mock.slug);
  }
  assert.equal(new Set(entranceMocks.map(mock => mock.slug)).size, 194);
});

test("every imported paper loads as a 100-point entrance exam with unique, complete questions", () => {
  const ids = new Set();
  for (const meta of entranceMocks) {
    const definition = entranceDefinition(meta.slug);
    assert.ok(definition, meta.slug);
    assert.equal(definition.program, "entrance", meta.slug);
    assert.equal(definition.subject, meta.subject, meta.slug);
    assert.equal(definition.stages.length, 1, meta.slug);
    const stage = definition.stages[0];
    assert.equal(stage.kind, "questions", meta.slug);
    assert.equal(stage.seconds, meta.durationMinutes * 60, meta.slug);
    assert.equal(stage.questions.length, meta.questionCount, meta.slug);
    assert.equal(meta.groupCount, stage.groups?.length ?? 0, meta.slug);
    assert.equal(stage.questions.reduce((sum, question) => sum + (question.points ?? 1), 0), 100, meta.slug);
    for (const question of stage.questions) {
      assert.ok(!ids.has(question.id), "duplicate id " + question.id);
      ids.add(question.id);
      assert.ok(question.answers.length > 0, question.id);
      if (question.kind === "choice") {
        assert.ok(question.options?.length >= 2, question.id);
        assert.equal(new Set(question.options).size, question.options.length, question.id);
        assert.ok(question.options.includes(question.answers[0]), question.id);
      }
      assert.ok(question.explanation.trim().length > 3, question.id);
      if (question.figure) {
        assert.equal(question.figure.kind, "image", question.id);
        assert.ok(question.figure.src.startsWith("/exam-assets/eesh/"), question.id);
        assert.ok(existsSync(publicFile(question.figure.src)), question.id);
      }
      if (question.passage) assert.ok(stage.passages?.some(passage => passage.title === question.passage), question.id);
    }
    for (const group of stage.groups ?? []) {
      if (!group.figure) continue;
      assert.equal(group.figure.kind, "image", meta.slug + " " + group.id);
      assert.ok(group.figure.src.startsWith("/exam-assets/eesh/"), group.figure.src);
      assert.ok(existsSync(publicFile(group.figure.src)), group.figure.src);
    }
  }
  assert.ok(ids.size > 9000);
});

test("each subject keeps its printed structure and answer distribution", () => {
  for (const meta of entranceMocks) {
    const definition = entranceDefinition(meta.slug);
    const stage = definition.stages[0];
    const choices = stage.questions.filter(question => question.kind === "choice");
    const tasks = (stage.groups ?? []).filter(group => group.pageMode === "group");
    if (meta.subject === "math") {
      assert.equal(choices.length, 36, meta.slug);
      assert.equal(tasks.length, 4, meta.slug);
    }
    if (meta.subject === "physics") {
      assert.equal(choices.length, 46, meta.slug);
      assert.equal(tasks.length, 4, meta.slug);
    }
    if (meta.subject === "chemistry") {
      assert.equal(choices.length, 40, meta.slug);
      assert.equal(tasks.length, 4, meta.slug);
      // Part II: four tasks × a–h, one digit each.
      const parts = stage.questions.filter(question => question.groupId !== "part-1");
      assert.equal(parts.length, 32, meta.slug);
      assert.ok(parts.every(question => question.kind === "number" && /^\d$/.test(question.answers[0])), meta.slug);
    }
    if (meta.subject === "biology") {
      assert.equal(choices.length, meta.year === 2026 ? 46 : 50, meta.slug);
      assert.equal(tasks.length, 4, meta.slug);
      assert.ok(stage.questions.filter(question => question.groupId !== "part-1").every(question => question.kind === "number" && question.matcher === "numeric"), meta.slug);
    }
    if (meta.subject === "english") {
      assert.ok(choices.length >= 47, meta.slug);
      assert.ok((stage.passages?.length ?? 0) >= 1, meta.slug);
      assert.ok(stage.groups?.some(group => group.pageMode === "group"), meta.slug);
    }
    if (meta.subject !== "english") {
      const counts = [0, 0, 0, 0, 0];
      for (const question of choices) counts[question.options.indexOf(question.answers[0])]++;
      assert.ok(counts.every(count => count >= 2), meta.slug + " " + counts);
    }
  }
});

test("typed answers accept equivalent mathematics without accepting a different value", () => {
  const math = entranceDefinition("eesh-math-2024-m1");
  const interval = math.stages[0].questions.find(question => question.matcher === "math" && question.answers[0].includes(";"));
  assert.ok(interval, "interval question");
  assert.equal(isCorrect(interval, interval.answers[0]), true);
  assert.equal(isCorrect(interval, interval.answers[0].replaceAll(";", ",").replaceAll("−", "-")), true);
  assert.notEqual(normaliseMath(interval.answers[0]), normaliseMath("(0; 0)"));
  const fraction = math.stages[0].questions.find(question => question.kind === "number" && question.answers[0] === "10/7");
  assert.ok(fraction, "fraction question");
  assert.equal(isCorrect(fraction, "1.42857"), true);
  assert.equal(isCorrect(fraction, "0"), false);
  const physics = entranceDefinition("eesh-physics-2024-p1");
  const scientific = physics.stages[0].questions.find(question => question.answerDisplay?.includes("10⁻"));
  assert.ok(scientific, "scientific question");
  assert.equal(isCorrect(scientific, scientific.answers[0]), true);
  assert.equal(isCorrect(scientific, Number(scientific.answers[0]).toExponential(5)), true);
  assert.equal(isCorrect(scientific, "0"), false);
  const direction = physics.stages[0].questions.find(question => question.matcher === "text");
  assert.ok(direction, "direction question");
  assert.equal(isCorrect(direction, "төв рүү"), true);
});

test("a fully correct paper reports 100 marks and keeps the shared task material in review", () => {
  const definition = entranceDefinition("eesh-math-2024-m1");
  const state = createExamState(definition, 0);
  state.responses = Object.fromEntries(definition.stages[0].questions.map(question => [question.id, question.answers[0]]));
  const report = makeReport(state);
  assert.deepEqual(report.points, { total: 100, earned: 100 });
  assert.equal(report.reviews.length, definition.stages[0].questions.length);
  assert.ok(report.sections.length > 1);
  assert.ok(report.reviews.every(review => review.earned === review.points));
  const part = report.reviews.find(review => review.number?.startsWith("2.1"));
  // Each skill row counts only its own questions, so the rows add up to the paper.
  for (const slug of ["eesh-math-2024-m1", "eesh-physics-2024-p1", "eesh-english-2024-e1", "eesh-chemistry-2026-c1", "eesh-biology-2026-b1"]) {
    const paper = entranceDefinition(slug);
    const sitting = createExamState(paper, 0);
    const questions = paper.stages[0].questions;
    sitting.responses = Object.fromEntries(questions.slice(0, 20).map(question => [question.id, question.answers[0]]));
    const result = makeReport(sitting);
    assert.ok(result.sections.length >= 3, slug);
    assert.equal(result.sections.reduce((sum, section) => sum + section.total, 0), questions.length, slug);
    assert.equal(result.sections.reduce((sum, section) => sum + section.points, 0), 100, slug);
    assert.equal(result.sections.reduce((sum, section) => sum + section.earned, 0), result.points.earned, slug);
    assert.ok(result.sections.some(section => section.earned < section.points), slug);
  }
  assert.ok(part?.instructions);
  assert.ok(part?.figure);
});

test("practice forms carry every imported paper and grade their own printed answers", () => {
  for (const slug of ["eesh-math-2024-m1", "eesh-physics-2024-p1", "eesh-english-2024-e1", "eesh-chemistry-2025-c1", "eesh-biology-2026-b2"]) {
    const definition = entranceDefinition(slug);
    const source = mockPractice(definition);
    assert.equal(source.form.subject, "eesh-" + slug.split("-")[1]);
    assert.ok(source.form.sections.length >= 2, slug);
    assert.equal(source.form.questions.length, definition.stages[0].questions.length, slug);
    assert.equal(new Set(source.form.questions.map(question => question.id)).size, source.form.questions.length, slug);
    assert.ok(source.form.questions.every(question => source.form.sections.some(section => section.id === question.section)));
    for (const question of definition.stages[0].questions) assert.equal(source.grade(question.id, question.answers[0]).correct, true, question.id);
    assert.doesNotMatch(JSON.stringify(source.form), /"(answers?|explanation|pretest|transcript)":/);
  }
  const source = mockPractice(entranceDefinition("eesh-math-2024-m1"));
  const question = source.form.questions[0];
  const stats = practiceStats(source.form, { [question.id]: { correct: true } });
  assert.deepEqual([stats.checked, stats.graded, stats.correct], [1, 1, 1]);
});

test("imported root indexes and fractions typeset without a KaTeX error", () => {
  for (const formula of ["⁵√(√(49⁵))", "⁷√2", "√3/2"]) assert.doesNotThrow(() => mathHtml(optionTex(formula)), formula);
  assert.match(mathHtml(optionTex("⁵√(√(49⁵))")), /mroot/);
  assert.match(mathHtml(optionTex("√3/2")), /sqrt/);
});

test("the old four site Mathematics mocks and their booklet route are retired, with the files kept as reference", () => {
  for (const slug of ["eesh-math-01", "eesh-math-02", "eesh-math-03", "eesh-math-04"]) assert.equal(findExam(slug), undefined, slug);
  for (const path of ["src/app/exams/eesh-math", "src/modules/exams/entrance/math-1.ts", "src/modules/exams/entrance/math-format.ts"]) assert.equal(existsSync(disk(path)), false, path);
  for (const path of ["reference/retired-site-mocks/eesh-math/math-1.ts", "reference/retired-site-mocks/eesh-math/math-format.ts"]) assert.ok(existsSync(disk(path)), path);
  assert.equal(findExam("eesh-english-2024-e1")?.program, "entrance");
  assert.equal(findExam("eesh-math-2024-m1")?.subject, "math");
  assert.equal(findEntranceMeta("eesh-english-2018-e1")?.year, 2018);
  assert.equal(findExam("eesh-chemistry-2026-c3")?.subject, "chemistry");
  assert.equal(findExam("eesh-biology-2020-b1")?.subject, "biology");
  assert.equal(findExam("eesh-chemistry-2024-c1"), undefined);
});
