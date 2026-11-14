// The free half-length mocks (owner request 2026-11-13): one per exam, built from MockExmps/Free by
// scripts/build-free-mocks.mjs, open to every signed-in account and never sold.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { allExamSlugs, examDefinitions, findExam } from "../src/modules/exams/definitions.ts";
import { freeMocks, isFreeMock } from "../src/modules/exams/free/catalog.ts";
import { createExamState, isCorrect, makeReport } from "../src/modules/exams/engine.ts";
import { mockPractice } from "../src/modules/exam-practice/form.ts";
import { audioPath, audioSetOf, listeningFile, listeningParts } from "../src/modules/exams/audio-files.ts";
import { validateAnswerKeys, validateContentShape } from "../src/modules/content/validation.ts";
import { endsSpeaking, examinerScript, speakingPart } from "../src/modules/exams/speaking-examiner.ts";
import { mockBriefingSummary } from "../src/modules/exams/briefing-summary.ts";
import { subjectFromSlug } from "../src/modules/exams/entrance/subjects.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const json = path => JSON.parse(text(path));
const SLUGS = ["eesh-math-free", "eesh-physics-free", "eesh-chemistry-free", "eesh-biology-free", "eesh-english-free", "sat-free", "ielts-academic-free", "jlpt-n5-free", "jlpt-n4-free", "hsk1-free"];

test("one free mock per exam, found by slug but kept out of the paid collections and counts", () => {
  assert.deepEqual(freeMocks.map(mock => mock.slug), SLUGS);
  for (const mock of freeMocks) {
    const exam = findExam(mock.slug);
    assert.ok(exam, mock.slug);
    assert.equal(exam.slug, mock.slug);
    assert.equal(exam.program, mock.program, mock.slug);
    assert.ok(isFreeMock(mock.slug));
    assert.ok(allExamSlugs().includes(mock.slug));
    assert.ok(!examDefinitions.some(item => item.slug === mock.slug), "not in the SAT/IELTS collections");
    assert.ok(existsSync(new URL(`../assets/free-mocks/${mock.slug}.json`, import.meta.url)), mock.slug);
  }
  assert.ok(!isFreeMock("sat-full-01") && !isFreeMock("eesh-math-2024-m1") && !isFreeMock("../sat-free"));
  // The client-safe catalogue carries no keys, explanations or listening scripts.
  assert.doesNotMatch(text("src/modules/exams/free/catalog.json"), /"answers"|"explanation"|"listening":\s*\{|"script"/);
});

test("the catalogue's counts and times are the definitions' own, and every figure is on disk", () => {
  for (const mock of freeMocks) {
    const exam = findExam(mock.slug);
    const scored = new Map();
    for (const stage of exam.stages) for (const question of stage.questions) if (question.answers?.length && question.kind !== "essay" && question.kind !== "speaking") scored.set(question.id, question);
    assert.equal(scored.size, mock.questions, mock.slug);
    assert.equal(exam.stages.reduce((sum, stage) => sum + stage.seconds, 0) / 60, mock.minutes, mock.slug);
    if (mock.program === "entrance") assert.equal(exam.points, mock.points, mock.slug);
    // Half of a full mock: ЭЕШ papers are out of 50, the rest are shorter than their full forms.
    if (mock.program === "entrance") assert.equal(mock.points, 50);
    const figures = JSON.stringify(exam).match(/"\/(?:exam-assets|ielts-mocks)\/[^"]+"/g) ?? [];
    for (const figure of figures) assert.ok(existsSync(new URL("../public" + JSON.parse(figure), import.meta.url)), `${mock.slug}: ${figure}`);
    // Own figures live in the free folder, which the ЭЕШ and HSK builds never delete; only HSK's shared examples are reused.
    for (const figure of figures) assert.match(JSON.parse(figure), /^\/exam-assets\/(free\/[a-z0-9-]+-free|hsk\/examples)\//, figure);
  }
});

test("every key scores full marks with the site's engine, an empty sitting scores zero, and admin fixes can validate it", () => {
  for (const mock of freeMocks) {
    const exam = findExam(mock.slug);
    const full = createExamState(exam, Date.now()), empty = createExamState(exam, Date.now());
    for (const stage of exam.stages) for (const question of stage.questions) {
      if (!question.answers?.length) continue;
      assert.ok(isCorrect(question, question.answers[0]), `${mock.slug} ${question.id}`);
      full.responses[question.id] = question.answers[0];
    }
    for (const state of [full, empty]) { state.stageIndex = exam.stages.length; state.finishedAt = new Date().toISOString(); }
    const report = makeReport(full), zero = makeReport(empty);
    assert.equal(report.points.earned, report.points.total, mock.slug);
    assert.ok(report.points.total > 0, mock.slug);
    assert.equal(zero.points.earned, 0, mock.slug);
    assert.ok(validateAnswerKeys(exam), mock.slug);
    assert.ok(validateContentShape(exam, structuredClone(exam)), mock.slug);
  }
});

test("practice mode knows each free mock's subject, sections and IELTS transcripts", () => {
  for (const subject of ["math", "physics", "chemistry", "biology", "english"]) {
    const slug = `eesh-${subject}-free`;
    assert.equal(subjectFromSlug(slug), subject);
    assert.equal(mockPractice(findExam(slug)).form.subject, `eesh-${subject}`);
  }
  const ielts = mockPractice(findExam("ielts-academic-free"));
  const listening = ielts.form.questions.filter(question => question.audioPart);
  assert.equal(listening.length, 20);
  assert.deepEqual([...new Set(listening.map(question => question.audioPart))], [1, 2]);
  // The part's script is revealed only after a check, from the server-side scripts file.
  const reveal = ielts.reveal(listening[0].id, { correct: true });
  assert.match(reveal.transcript, /^Part 1/);
  assert.match(ielts.reveal(listening[15].id, { correct: false }).transcript, /^Part 2/);
  assert.equal(json("assets/free-mocks/ielts-academic-free-listening.json").parts.length, 2);
});

test("the free IELTS Speaking ends after Part 2, and briefings say the mock is free and half-length", () => {
  const ielts = findExam("ielts-academic-free");
  const last = ielts.stages.at(-1);
  assert.equal(last.id, "ielts-speaking-2-final");
  assert.equal(speakingPart(last), 2);
  assert.ok(endsSpeaking(last) && endsSpeaking({ id: "ielts-speaking-3" }) && !endsSpeaking({ id: "ielts-speaking-2" }));
  assert.equal(examinerScript(last).closing, "Thank you. That is the end of the speaking test.");
  assert.equal(examinerScript({ ...last, id: "ielts-speaking-2" }).closing, "Thank you.", "full mocks still go on to Part 3");
  const sat = mockBriefingSummary(findExam("sat-free"));
  assert.match(sat.eyebrow, /ҮНЭГҮЙ ХАГАС MOCK/);
  assert.ok(!sat.chips.some(chip => chip.includes("завсарлага")), "no break chip without a break");
  assert.equal(sat.priceNote, "Үнэгүй · бүртгэлтэй бүх хүнд");
  assert.equal(mockBriefingSummary(findExam("sat-full-01")).priceNote, "₮10,000 эсвэл Гадаад хэл багц");
  assert.match(mockBriefingSummary(findExam("ielts-academic-free")).eyebrow, /ҮНЭГҮЙ ХАГАС MOCK/);
});

test("free listening is served from its own recording folder and route, with timings for every item", () => {
  const catalog = json("src/modules/exams/free/audio-catalog.json");
  const listening = freeMocks.filter(mock => mock.listening).map(mock => mock.slug);
  assert.deepEqual(listening, ["ielts-academic-free", "jlpt-n5-free", "jlpt-n4-free", "hsk1-free"]);
  assert.deepEqual(Object.keys(catalog).sort(), [...listening].sort(), "every listening mock has recordings");
  for (const slug of listening) {
    const exam = findExam(slug), stage = exam.stages.find(item => item.kind === "listening");
    assert.equal(audioSetOf(slug), "free");
    assert.equal(audioPath(slug), "/audio/free");
    const parts = listeningParts(slug);
    assert.deepEqual(parts, catalog[slug].seconds);
    assert.ok(parts.length >= 1 && parts.length <= 4, slug);
    // The recordings leave time to check answers inside the timed Listening stage.
    assert.ok(parts.reduce((sum, seconds) => sum + seconds, 0) < stage.seconds, `${slug}: ${parts.join("+")} s in a ${stage.seconds} s stage`);
    parts.forEach((_, index) => {
      const file = listeningFile(slug, index + 1);
      assert.equal(file, `${slug}-part-${index + 1}.mp3`);
      assert.ok(existsSync(new URL(`../assets/free-audio/${file}`, import.meta.url)), file);
    });
    assert.equal(listeningFile(slug, parts.length + 1), undefined);
    assert.equal(listeningFile(slug, 0), undefined);
    if (exam.program !== "ielts") for (const question of stage.questions) {
      const timing = catalog[slug].questions[question.id];
      assert.ok(timing, `${slug} ${question.id}`);
      assert.ok(timing.part >= 1 && timing.part <= parts.length && timing.start < timing.end && timing.end <= parts[timing.part - 1] + 0.5, `${slug} ${question.id}`);
    }
  }
  // Own route segment and tracing entry, like every other recording set (Vercel's 250 MB function limit).
  for (const route of ["src/app/api/mock-attempts/[id]/audio/free/route.ts", "src/app/api/exam-practice/[slug]/audio/free/route.ts"]) {
    assert.match(text(route), /freeAudioResponse/);
    assert.match(text(route), /"free"/);
  }
  const config = text("next.config.ts");
  assert.match(config, /"\/api\/mock-attempts\/\*\/audio\/free":\["\.\/assets\/free-audio\/\*\.mp3"\]/);
  assert.match(config, /"\/api\/exam-practice\/\*\/audio\/free":\["\.\/assets\/free-audio\/\*\.mp3"\]/);
  assert.match(config, /"\.\/assets\/free-mocks\/\*\.json"/);
});
