import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { examDefinitions, findExam } from "../src/modules/exams/definitions.ts";

// The owner withdrew the official БҮТ papers on 2026-11-06. The site serves original ЭЕШ mocks instead, and the
// papers are kept only as reference files that are never served, built or deployed.
const root = new URL("../", import.meta.url);
const exists = path => existsSync(new URL(path, root));
const read = path => readFileSync(new URL(path, root), "utf8");
function files(dir) {
  return readdirSync(dir).flatMap(name => { const full = join(dir, name); return statSync(full).isDirectory() ? files(full) : [full]; });
}

test("no official paper can be listed, opened, sold or practised", () => {
  for (const slug of ["eec-math-2020-a", "eec-english-2019-a", "eec-english-2006-a"]) assert.equal(findExam(slug), undefined, slug);
  assert.ok(examDefinitions.every(exam => !exam.slug.startsWith("eec-")));
  for (const path of ["src/modules/papers", "src/app/exams/eec-english", "src/app/exams/eec-math-2020", "src/app/papers", "src/app/api/paper-attempts", "public/exam-assets/eec-english", "public/exam-assets/eec-math-2020", "assets/papers"])
    assert.equal(exists(path), false, path);
});

test("application code never reads, links or serves the reference copies", () => {
  const code = files(new URL("src", root).pathname.replace(/^\/([A-Za-z]:)/, "$1")).filter(file => /\.(ts|tsx)$/.test(file) && !file.includes("generated"));
  const offending = code.filter(file => /reference\/official-papers|exam-assets|modules\/papers|paper-attempts|papers\/attempts|eec-english|eec-math/.test(readFileSync(file, "utf8")));
  assert.deepEqual(offending, []);
});

test("reference copies are kept, documented and excluded from builds and deploys", () => {
  for (const path of ["reference/official-papers/README.md", "reference/official-papers/english/keys.json", "reference/official-papers/english/structure.json", "reference/official-papers/english/archive.json", "reference/official-papers/math-2020/manifest.json", "reference/official-papers/key.ts"])
    assert.ok(exists(path), path);
  const images = files(new URL("reference/official-papers", root).pathname.replace(/^\/([A-Za-z]:)/, "$1")).filter(file => file.endsWith(".jpg"));
  assert.equal(images.length, 250);
  assert.match(read("reference/official-papers/README.md"), /Never copy, reword or translate/);
  assert.match(read(".vercelignore"), /^reference\/$/m);
  assert.ok(JSON.parse(read("tsconfig.json")).exclude.includes("reference"));
  assert.match(read("eslint.config.mjs"), /"reference\/\*\*"/);
});
