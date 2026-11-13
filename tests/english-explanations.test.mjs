// ЭЕШ English mocks explain every key in Mongolian (docs/MOCK_REVIEW.md, Medium: all 2,665 items had an empty
// explanation). The text lives in MockExmps/English/_source/explanations and reaches the site through build.py and
// scripts/build-entrance-mocks.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findExam } from "../src/modules/exams/definitions.ts";
import { entranceMocks } from "../src/modules/exams/entrance/catalog.ts";

const papers = entranceMocks.filter(mock => mock.subject === "english").map(mock => findExam(mock.slug));
const plain = text => text.replace(/[’‘]/g, "'").replace(/\*\*|<\/?u>|\*/g, "").toLowerCase().replace(/\s+/g, " ").trim();

test("every ЭЕШ English item has its own Mongolian explanation", () => {
  assert.equal(papers.length, 40);
  let items = 0;
  for (const paper of papers) {
    const seen = new Map();
    for (const question of paper.stages[0].questions) {
      const where = `${paper.slug} ${question.number}`;
      const text = question.explanation ?? "";
      items += 1;
      assert.ok(text.trim().length >= 30, `${where}: no explanation`);
      // Mongolian prose; the English it explains is quoted as “…”.
      const prose = text.replace(/“[^”]*”/g, " ");
      const cyrillic = (prose.match(/[А-Яа-яЁёӨөҮү]/g) ?? []).length;
      const latin = (prose.match(/[A-Za-z]/g) ?? []).length;
      assert.ok(cyrillic >= 15 && cyrillic >= 2.5 * latin, `${where}: not Mongolian prose`);
      assert.match(text, /“[^”]+”/, `${where}: quotes nothing from the item`);
      // Practice shows it as plain text and results through RichText, so no markup and no straight quotes.
      assert.doesNotMatch(text, /[*<>[\]\n"]/, `${where}: markup`);
      assert.ok(!seen.has(text), `${where}: same explanation as item ${seen.get(text)}`);
      seen.set(text, question.number);
    }
  }
  assert.equal(items, 2665);
});

test("a short English key is named in its explanation, so a changed key cannot keep a stale explanation", () => {
  let checked = 0;
  for (const paper of papers) {
    for (const question of paper.stages[0].questions) {
      // Keys such as 'He's a dentist.' keep their printed quotes and full stop; compare the words.
      const key = plain(question.answers[0]).replace(/^[\s.,;:!?'"()…-]+|[\s.,;:!?'"()…-]+$/g, "");
      if (key.split(" ").length > 3) continue;
      const quoted = plain([...question.explanation.matchAll(/“([^”]*)”/g)].map(match => match[1]).join(" | "));
      assert.ok(quoted.includes(key), `${paper.slug} ${question.number}: key “${question.answers[0]}” is not quoted`);
      checked += 1;
    }
  }
  assert.ok(checked > 1500, `only ${checked} short keys`);
});

test("results and practice mark ЭЕШ explanations as Mongolian while English questions and answers stay English", () => {
  const results = readFileSync(new URL("../src/modules/exams/entrance/results.tsx", import.meta.url), "utf8");
  assert.match(results, /className="eesh-explanation" lang="mn"/);
  assert.match(results, /const mongolian = subject !== "english";/);
  const practice = readFileSync(new URL("../src/modules/exam-practice/workspace.tsx", import.meta.url), "utf8");
  assert.match(practice, /explainLang=entrance\?"mn":"en"/);
  assert.match(practice, /answerLang=[^;]*entrance&&form\.subject!=="eesh-english"\?"mn":"en"/);
});
