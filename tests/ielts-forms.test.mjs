import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { examDefinitions, findExam } from "../src/modules/exams/definitions.ts";
import { createExamState, isCorrect, makeReport } from "../src/modules/exams/engine.ts";
import { audioPath, audioSetOf, listeningFile, listeningParts, listeningPosition } from "../src/modules/exams/audio-files.ts";
import { listeningPartInfo } from "../src/modules/exams/listening-prompt.ts";
import { mockPractice } from "../src/modules/exam-practice/form.ts";

const root = new URL("../", import.meta.url);
const disk = path => new URL(path, root).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const slugs = [7, 8, 9, 10, 11, 12].map(n => `ielts-academic-${String(n).padStart(2, "0")}`);
const manifest = JSON.parse(readFileSync(disk("assets/ielts-forms/manifest.json"), "utf8"));

test("IELTS Mocks 07–12 join the catalogue after 01–06 with the full four-skill structure", () => {
  const ielts = examDefinitions.filter(exam => exam.program === "ielts").map(exam => exam.slug);
  assert.deepEqual(ielts, Array.from({ length: 12 }, (_, i) => `ielts-academic-${String(i + 1).padStart(2, "0")}`));
  for (const slug of slugs) {
    const exam = findExam(slug);
    assert.equal(exam.title, `IELTS Academic · Full Mock ${slug.slice(-2)}`);
    assert.equal(exam.audioRevision, undefined, slug);
    assert.deepEqual(exam.stages.map(stage => stage.id), ["ielts-listening", "ielts-listening-check", "ielts-reading", "ielts-writing", "ielts-speaking-1", "ielts-speaking-prep", "ielts-speaking-2", "ielts-speaking-3"]);
    const [listening, check, reading, writing] = exam.stages;
    assert.equal(listening.questions, check.questions, slug);
    assert.equal(listening.questions.length, 40, slug);
    assert.equal(reading.questions.length, 40, slug);
    assert.equal(reading.passages.length, 3, slug);
    assert.equal(writing.questions.length, 2, slug);
    assert.equal(writing.questions[0].figure?.kind, "image", slug);
    assert.ok(existsSync(disk("public" + writing.questions[0].figure.src)), slug);
    // Scripts never enter the definition, so attempt snapshots stay small and answer-free stages stay script-free.
    assert.doesNotMatch(JSON.stringify(exam), /"listening":|"listeningPart":/);
    for (const question of [...listening.questions, ...reading.questions]) {
      assert.ok(question.answers.length, question.id);
      assert.ok(question.explanation.includes("Evidence"), question.id);
      if (question.kind === "choice") {
        assert.equal(new Set(question.options).size, question.options.length, question.id);
        assert.ok(question.options.includes(question.answers[0]), question.id);
        if (question.optionLabels) assert.equal(question.optionLabels.length, question.options.length, question.id);
      } else {
        assert.equal(question.kind, "short", question.id);
        assert.match(question.prompt, /_{3,}/, question.id);
      }
      if (question.passage) assert.ok(reading.passages.some(passage => passage.title === question.passage), question.id);
    }
  }
});

test("every new Listening part names its title and instruction once", () => {
  for (const slug of slugs) {
    const questions = findExam(slug).stages[0].questions;
    for (let part = 0; part < 4; part++) {
      const info = listeningPartInfo(questions.slice(part * 10, part * 10 + 10).map(question => question.prompt));
      assert.ok(info.title, `${slug} part ${part + 1}`);
      assert.ok(info.instructions.length >= 1, `${slug} part ${part + 1}`);
      assert.ok(info.parsed.every(parsed => parsed.instruction && !parsed.text.includes("Write the correct letter")), `${slug} part ${part + 1}`);
    }
  }
  // Mocks 07 and 10 label a plan; it is drawn once for the part.
  for (const [slug, plan] of [["ielts-academic-07", "mock-07"], ["ielts-academic-10", "mock-10"]]) {
    const figure = findExam(slug).stages[0].questions.find(question => question.figure)?.figure;
    assert.equal(figure?.src, `/ielts-mocks/${plan}-listening-plan.svg`);
    assert.ok(existsSync(disk("public" + figure.src)));
  }
});

test("a fully correct new form scores 40/40 twice and leaves Writing and Speaking for human review", () => {
  for (const slug of slugs) {
    const exam = findExam(slug);
    const state = createExamState(exam, 0);
    for (const stage of exam.stages) for (const question of stage.questions) state.responses[question.id] = question.answers[0] ?? "Practice response.";
    const report = makeReport(state);
    assert.deepEqual(report.sections.slice(0, 2).map(section => [section.correct, section.total]), [[40, 40], [40, 40]], slug);
    assert.ok(report.sections.slice(2).every(section => section.pending > 0), slug);
  }
  const time = findExam("ielts-academic-07").stages[0].questions.find(question => question.answers.includes("6:30"));
  assert.ok(time);
  assert.equal(isCorrect(time, "6.30"), true);
  assert.equal(isCorrect(time, "7:30"), false);
});

test("each new form plays its own four re-encoded recordings within the 30-minute Listening stage", () => {
  assert.equal(manifest.files.length, 24);
  for (const slug of slugs) {
    const parts = listeningParts(slug);
    assert.equal(parts.length, 4, slug);
    assert.ok(parts.reduce((sum, seconds) => sum + seconds, 0) < 1800, slug);
    for (const part of [1, 2, 3, 4]) {
      const file = listeningFile(slug, part);
      assert.equal(file, `ielts-${slug.slice(-2)}-part-${part}.mp3`);
      // Snapshots without an audio revision and with the current revision resolve to the same single set.
      assert.equal(listeningFile(slug, part, 1), file);
      const entry = manifest.files.find(item => item.file === file);
      assert.ok(entry, file);
      const bytes = readFileSync(disk("assets/ielts-forms/" + file));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, file);
      assert.equal(entry.seconds, parts[part - 1], file);
    }
    assert.equal(listeningFile(slug, 5), undefined);
    assert.equal(audioPath(slug), "/audio/forms", slug);
    assert.equal(listeningPosition(slug, parts[0] + 1).part, 2);
  }
});

test("practice mode carries every new question, grades its key and reveals the part script only after a check", () => {
  for (const slug of slugs) {
    const source = mockPractice(findExam(slug));
    const listening = source.form.questions.filter(question => question.domain === "Listening");
    assert.equal(listening.length, 40, slug);
    for (const part of [1, 2, 3, 4]) assert.equal(listening.filter(question => question.audioPart === part).length, 10, slug);
    assert.doesNotMatch(JSON.stringify(source.form), /"(answers?|explanation|transcript|listening)":/);
    const first = findExam(slug).stages[0].questions[0];
    assert.equal(source.grade(first.id, first.answers[0]).correct, true);
    const reveal = source.reveal(first.id, { correct: true });
    assert.match(reveal.transcript ?? "", /^Part 1 · /, slug);
  }
});

test("each recording folder has its own audio route, and only that route reads it", () => {
  for (const slug of ["ielts-academic-01", "ielts-academic-06", "jlpt-n5-01", "sat-full-02", "eesh-math-2024-m1"]) assert.equal(audioSetOf(slug), "base", slug);
  for (const slug of slugs) assert.equal(audioSetOf(slug), "forms", slug);
  const source = path => readFileSync(disk(path), "utf8");
  // The build bundles a folder into a route when that route's code reads it, so the shared parts read nothing.
  for (const shared of ["src/modules/exams/audio-handlers.ts", "src/modules/exams/audio-range.ts"]) {
    assert.doesNotMatch(source(shared), /readFile\(|from "[^"]*audio-response/, shared);
  }
  assert.match(source("src/modules/exams/audio-response.ts"), /"assets", "exams", filename/);
  assert.match(source("src/modules/exams/audio-response-forms.ts"), /"assets", "ielts-forms", filename/);
  for (const route of ["src/app/api/mock-attempts/[id]/audio", "src/app/api/exam-practice/[slug]/audio"]) {
    const base = source(route + "/route.ts"), forms = source(route + "/forms/route.ts");
    assert.match(base, /audio-response"/); assert.doesNotMatch(base, /audio-response-forms/); assert.match(base, /"base"/);
    assert.match(forms, /audio-response-forms"/); assert.doesNotMatch(forms, /audio-response"/); assert.match(forms, /"forms"/);
  }
  // Tracing keys match anywhere in a route path, so an `/audio` key would also feed `/audio/forms`.
  const config = source("next.config.ts");
  assert.doesNotMatch(config, /"\/api\/(mock-attempts|exam-practice)\/\*\/audio":/);
  assert.match(config, /"\/api\/mock-attempts\/\*\/audio\/forms":\["\.\/assets\/ielts-forms\/\*\.mp3"\]/);
  for (const file of manifest.files) assert.equal(existsSync(disk("assets/exams/" + file.file)), false, file.file);
});
