// Regression tests for the 2026-11-13 mock review fixes (docs/MOCK_REVIEW.md): grading that marked right
// answers wrong (or any answer right), and the content defects fixed in the generators.
import test from "node:test";
import assert from "node:assert/strict";
import { isCorrect } from "../src/modules/exams/engine.ts";
import { sameMathValue } from "../src/modules/exams/math-value.ts";
import { findExam } from "../src/modules/exams/definitions.ts";
import { entranceMocks } from "../src/modules/exams/entrance/catalog.ts";

const question = (slug, number) => findExam(slug).stages[0].questions.find(item => item.number === number);
const papers = subject => entranceMocks.filter(mock => mock.subject === subject).map(mock => findExam(mock.slug));
const typed = (answers, extra = {}) => ({ id: "q", domain: "", prompt: "", kind: "short", matcher: "math", answers, explanation: "", ...extra });

test("choices keep their case, so genotype options such as CcGg and ccGg are different answers", () => {
  const genotypes = { id: "g", domain: "", prompt: "", kind: "choice", options: ["CcGG", "ccGg", "CCGg", "CcGg", "CCGG"], answers: ["CcGg"], explanation: "" };
  assert.deepEqual(genotypes.options.map(option => isCorrect(genotypes, option)), [false, false, false, true, false]);
  // A key that matches no option exactly (older content) keeps the earlier case-insensitive comparison.
  assert.equal(isCorrect({ ...genotypes, options: ["True", "False"], answers: ["true"] }, "True"), true);
  for (const slug of ["eesh-biology-2026-b1", "eesh-biology-2026-b2", "eesh-biology-2026-b3"]) {
    const item = question(slug, "38");
    assert.equal(item.options.filter(option => isCorrect(item, option)).length, 1, slug);
  }
});

test("typed mathematics is compared by value, in any written form", () => {
  const equal = [["6π/6", "π"], ["21√3/3", "7√3"], ["2−1√3", "2−√3"], ["17−4√18", "17−12√2"], ["(x−1)(x−4)", "x²−5x+4"],
    ["(x−1)(x−4)", "(x-4)(x-1)"], ["60°", "60"], ["1+(2(x−1)−4)/(x−1−3)", "(3x−10)/(x−4)"], ["y=x/2+8/2", "x−2y+8=0"],
    ["256/3π", "256π/3"], ["5/√3", "5√3/3"], ["3+√(x−3)", "√(x−3)+3"], ["2+ln3", "ln3+2"], ["125*sqrt(2)/6", "125√2/6"],
    ["3*r**2/92 + 13*r/92 - 5/92", "(3r²+13r−5)/92"], ["(15−t)³/54", "(15-t)^3/54"], ["5⁷", "78125"]];
  for (const [key, given] of equal) assert.equal(sameMathValue(key, given), true, `${key} = ${given}`);
  const different = [["6π/6", "2π"], ["(x−1)(x−4)", "x²−5x+5"], ["2x", "2"], ["√2", "1.41421356"], ["256/3π", "256/(3π)"],
    ["y=x/2+4", "y=x/2+3"], ["3+√(x−3)", "√(x+3)+3"], ["3*r**2/92 + 13*r/92 - 5/92", "1/(2r²+r−1)"]];
  for (const [key, given] of different) assert.equal(sameMathValue(key, given), false, `${key} ≠ ${given}`);
  assert.equal(sameMathValue("(2; 5)", "(2;5)"), null, "intervals stay with string matching");
  assert.equal(isCorrect(typed(["6π/6"]), "π"), true);
  // Where the form is the task, the original expression has the same value but is not the answer.
  assert.equal(isCorrect(typed(["(r+1)(2r−1)"], { exactForm: true }), "2r²+r−1"), false);
  assert.equal(isCorrect(typed(["(r+1)(2r−1)"], { exactForm: true }), "(r+1)(2r−1)"), true);
});

test("ЭЕШ Mathematics keys read naturally, form tasks are marked, and no option is Python syntax", () => {
  for (const exam of papers("math")) {
    for (const item of exam.stages[0].questions) {
      for (const text of [...(item.options ?? []), ...item.answers]) assert.doesNotMatch(text, /\*|sqrt\(|\+-|\d\.\d*0000\d/, `${item.id}: ${text}`);
    }
  }
  assert.equal(isCorrect(question("eesh-math-2018-m1", "2.1c"), "π"), true);
  assert.equal(isCorrect(question("eesh-math-2016-m1", "2.4b"), "60"), true);
  assert.equal(isCorrect(question("eesh-math-2026-m1", "2.1d"), "(3x−10)/(x−4)"), true);
  assert.equal(isCorrect(question("eesh-math-2021-m1", "2.3a"), "x²−5x+4"), true);
  for (const [slug, number, original] of [["eesh-math-2015-m1", "2.2a", "(√3−1)/(√3+1)"], ["eesh-math-2017-m1", "2.1a", "2r²+r−1"], ["eesh-math-2017-m1", "2.2a", "cos(4πx)−√3sin(4πx)"], ["eesh-math-2016-m1", "2.2b", "sin(15x)−sin(11x)=0"]]) {
    const item = question(slug, number);
    assert.equal(item.exactForm, true, `${slug} ${number}`);
    assert.equal(isCorrect(item, original), false, `${slug} ${number} must not accept its own starting expression`);
    assert.equal(isCorrect(item, item.answers[0]), true);
  }
  // Two options were the same number: 792·6^5·6^7 and 792·6^7·6^5.
  assert.ok(!question("eesh-math-2015-m4", "34").options.includes("792·6^7·6^5"));
});

test("ЭЕШ Physics Part II accepts the exact values, and the period asks for the coefficient of π", () => {
  const exactly = text => Number(text);
  for (const exam of papers("physics")) {
    const stage = exam.stages[0];
    const part = number => stage.questions.find(item => item.number === number);
    const task = id => stage.groups.find(group => group.id === id).instructions;
    // 2.1d: a = (m1·g − μ·m2·g)/(m1 + m2) from the printed values.
    const m2 = exactly(/m2 = (\d+) кг/.exec(task("task-1"))[1]);
    const mu = exactly(/гулсахын үрэлтийн коэффициент μ = ([\d.]*\d)/.exec(task("task-1"))[1]);
    assert.doesNotMatch(task("task-1"), /\d\.\d{4,}/, `${exam.slug}: givens are clean decimals`);
    const m1 = exactly(/m1 = (\d+) кг үед/.exec(part("2.1d").prompt)[1]);
    assert.equal(isCorrect(part("2.1d"), String((m1 * 10 - mu * m2 * 10) / (m1 + m2))), true, `${exam.slug} 2.1d`);
    // 2.2a: one state alone has the highest pressure, and the key names it.
    const pressures = /p1 = (\d+) кПа, p2 = (\d+) кПа, p3 = (\d+) кПа/.exec(part("2.2a").explanation).slice(1).map(Number);
    const highest = Math.max(...pressures);
    assert.equal(pressures.filter(value => value === highest).length, 1, `${exam.slug} 2.2a: one highest pressure`);
    assert.deepEqual(part("2.2a").answers, [String(pressures.indexOf(highest) + 1)], `${exam.slug} 2.2a`);
    assert.equal(exactly(/p1 = (\d+) кПа/.exec(task("task-2"))[1]), pressures[0], `${exam.slug} 2.2 prompt p1`);
    // 2.2d: the work is the area under the 1–2 line, p1(V2 − V1) when isobaric and (p1 + p2)(V2 − V1)/2 when it slopes,
    // exactly as the explanation computes it.
    const isobar = /A = p1\(V2−V1\) = (\d+)·10³·\(([\d.]+)−([\d.]+)\)/.exec(part("2.2d").explanation);
    const slope = /A = \(p1\+p2\)\(V2−V1\)\/2 = \((\d+)\+(\d+)\)·10³·\(([\d.]+)−([\d.]+)\)/.exec(part("2.2d").explanation);
    const [p1, p2, v2, v1] = (isobar ? [isobar[1], isobar[1], isobar[2], isobar[3]] : slope.slice(1)).map(Number);
    assert.deepEqual([p1, p2], pressures.slice(0, 2), `${exam.slug} 2.2d uses the pressures of 2.2a`);
    assert.equal(isCorrect(part("2.2d"), String(Math.round((p1 + p2) / 2 * (v2 - v1)) / 1000)), true, `${exam.slug} 2.2d`);
    // 2.3b: the force as the key prints it (3.2·10⁻¹³) or as typed (3.2*10^-13) is the stored 3.2e-13; another power is not.
    const force = part("2.3b");
    // ¹²³ sit outside the ⁰–⁹ code-point range, so the superscripts are listed one by one.
    const [, mantissa, power] = /^([\d.]+)·10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/.exec(force.answerDisplay);
    const exponent = Number([...power].map(char => "-0123456789"["⁻⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(char)]).join(""));
    assert.equal(isCorrect(force, force.answerDisplay), true, `${exam.slug} 2.3b ${force.answerDisplay}`);
    assert.equal(isCorrect(force, `${mantissa}*10^${exponent}`), true, `${exam.slug} 2.3b typed`);
    assert.equal(isCorrect(force, `${mantissa}*10^${exponent + 1}`), false, `${exam.slug} 2.3b wrong power`);
    // 2.3d: T = [d]·π·10ⁿ с, an integer coefficient.
    assert.match(part("2.3d").prompt, /T = \[d\]·π·10[⁻⁰-⁹]+ с/);
    assert.match(part("2.3d").answers[0], /^\d+$/);
    // 2.4d: E = ½·m·k²·A² (times π²) from x = A sin(kπt + φ).
    const shm = /([\d.]+) кг масстай бие x = ([\d.]+) sin\((\d*)πt/.exec(task("task-4"));
    const [mass, amplitude, k] = [Number(shm[1]), Number(shm[2]), Number(shm[3] || 1)];
    assert.equal(isCorrect(part("2.4d"), String(Math.round(0.5 * mass * k * k * amplitude * amplitude * 1e6) / 1e6)), true, `${exam.slug} 2.4d`);
    // Q39 names the condition instead of "poor near/far vision", which reads the other way round.
    assert.doesNotMatch(stage.questions.find(item => item.number === "39").prompt, /хараа муу/);
  }
});

test("a numeric answer may be typed as a power of ten, and only in an unambiguous form", () => {
  const force = typed(["3.2e-13"], { kind: "number", matcher: "numeric" });
  for (const given of ["3.2·10⁻¹³", "3.2*10^-13", "3.2 × 10^(−13)", "3,2x10^-13", "32·10⁻¹⁴", "3.2e-13", "0.00000000000032"]) {
    assert.equal(isCorrect(force, given), true, given);
  }
  // No sign before 10, or no ^ or superscript, is not read as a power: 3.2·1013 is not 3.2e13.
  for (const given of ["3.2·10⁻¹²", "3.2·1013", "3.2·10", "310^2", "3.2 10^-13", "3.2·10^-13+1", "3.2·10^(-13", "·10⁻¹³", "0"]) {
    assert.equal(isCorrect(force, given), false, given);
  }
  assert.equal(isCorrect(typed(["1e-14"], { kind: "number", matcher: "numeric" }), "10⁻¹⁴"), true);
  // The math matcher is unchanged: where 10⁵ is the form a task asks for, 100000 is still not the answer.
  assert.equal(isCorrect(typed(["10⁵"], { exactForm: true }), "100000"), false);
});

test("ЭЕШ Biology rounds half up and writes case endings onto the noun", () => {
  assert.deepEqual(question("eesh-biology-2026-b1", "2.3c").answers, ["8"]); // χ² = 1.075 → 1.08
  assert.deepEqual(question("eesh-biology-2025-b2", "2.1c").answers, ["4"]); // D = 0.735 → 0.74
  const hyphenated = /[А-ЯӨҮЁа-яөүё]+-(?:ны|ний|гийн|нд|г|н)(?![а-яөүё])/u;
  for (const exam of papers("biology")) {
    // A hyphen is right after abbreviations (ДНХ-г, мРНХ-г) and in the compound хи-квадрат.
    const text = JSON.stringify(exam).replace(/хи-квадрат/gi, "").replace(/[а-я]?[А-ЯӨҮЁ]{2,}-[а-яөүё]+/gu, "");
    assert.doesNotMatch(text, hyphenated, exam.slug);
  }
});

test("ЭЕШ Physics and Biology choice items each appear in at most three papers", () => {
  // H4: 60 Physics papers held 394 distinct items (Q2, Q23, Q44 the same in all) and Biology items repeated up to seven times.
  for (const [subject, least] of [["physics", 2000], ["biology", 700]]) {
    const seen = new Map();
    for (const exam of papers(subject)) {
      for (const item of exam.stages[0].questions.filter(entry => entry.kind === "choice")) {
        const key = `${item.prompt}\u0000${item.answers[0]}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
    }
    assert.ok(Math.max(...seen.values()) <= 3, `${subject}: an item appears in ${Math.max(...seen.values())} papers`);
    assert.ok(seen.size >= least, `${subject}: only ${seen.size} distinct items`);
  }
  // Q44 asks which numbered transition: the options are the five labels, never a doubled or halved label.
  for (const exam of papers("physics")) {
    assert.deepEqual([...exam.stages[0].questions.find(item => item.number === "44").options].sort(), ["1", "2", "3", "4", "5"], exam.slug);
  }
  // Matching keys use all six orders, not only the three cyclic codes a rotated column gives.
  const codes = new Set(papers("biology").flatMap(exam => exam.stages[0].questions)
    .map(item => item.answers[0]).filter(answer => /^1[abc], 2[abc], 3[abc]$/.test(answer)));
  assert.equal(codes.size, 6);
});

test("ЭЕШ Physics Part II tasks each appear in at most three papers, and 2.2a names each state about equally", () => {
  // H4 follow-up: 2.1–2.4 each drew one of five scenarios at random, so one task text was in 28 of the 60 papers.
  const counts = new Map();
  for (const exam of papers("physics")) {
    for (const group of exam.stages[0].groups.filter(entry => entry.id.startsWith("task-"))) {
      const texts = counts.get(group.id) ?? new Map();
      texts.set(group.instructions, (texts.get(group.instructions) ?? 0) + 1);
      counts.set(group.id, texts);
    }
  }
  assert.deepEqual([...counts.keys()].sort(), ["task-1", "task-2", "task-3", "task-4"]);
  for (const [task, texts] of counts) {
    assert.ok(texts.size >= 20, `${task}: only ${texts.size} distinct tasks`);
    assert.ok(Math.max(...texts.values()) <= 3, `${task}: a task appears in ${Math.max(...texts.values())} papers`);
  }
  // 2.2a ("which state has the highest pressure") was 3 in every paper; each state is now the key in about a third.
  const keys = new Map();
  for (const exam of papers("physics")) {
    const key = exam.stages[0].questions.find(item => item.number === "2.2a").answers[0];
    keys.set(key, (keys.get(key) ?? 0) + 1);
  }
  assert.deepEqual([...keys.keys()].sort(), ["1", "2", "3"]);
  for (const [state, count] of keys) assert.ok(count >= 15, `2.2a: state ${state} is the key in only ${count} of 60 papers`);
});

test("ЭЕШ text keeps its spaces and notation: Mathematics words, Chemistry numbers and statement lists", () => {
  const texts = exam => exam.stages.flatMap(stage => [...(stage.groups ?? []).map(group => group.instructions),
    ...stage.questions.flatMap(item => [item.prompt, item.explanation])]).filter(Boolean);
  // "Оргил50", "радиусr", "бага,их" lost their spaces in the transcriptions.
  for (const exam of papers("math")) for (const text of texts(exam)) assert.doesNotMatch(text, /[а-яөүёА-ЯӨҮЁ]{2}[0-9a-zA-Zπ√]|,[А-ЯӨҮЁа-яөүё]/u, exam.slug);
  // Python's 8.00e-05, a doubled full stop, and one-line lists whose double spaces collapse on the page.
  for (const exam of papers("chemistry")) for (const text of texts(exam)) assert.doesNotMatch(text, /\d\.\d+e[-+]\d|(?<!\.)\.\.(?!\.)|\S {2}\S/, `${exam.slug}: ${text.slice(0, 60)}`);
  // Rotating the options must not leave the explanation's counts in the old order: each count names its substance.
  assert.match(question("eesh-chemistry-2025-c1", "11").explanation, /CH₄ 2 · 5 = 10/);
});

test("IELTS 02–06 TRUE/FALSE/NOT GIVEN explanations point to the deciding paragraph", () => {
  for (const number of ["02", "03", "04", "05", "06"]) {
    const items = findExam(`ielts-academic-${number}`).stages.flatMap(stage => stage.questions).filter(item => item.options?.includes("NOT GIVEN"));
    assert.equal(items.length, 9, number);
    for (const item of items) assert.match(item.explanation, /[Pp]aragraphs? [A-H]/, item.id);
    assert.equal(new Set(items.map(item => item.explanation)).size, 9, `${number}: no shared boilerplate`);
  }
});
