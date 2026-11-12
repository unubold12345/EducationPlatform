// Grades every free mock with the website's own exam engine (src/modules/exams/engine.ts, read only):
// entering every key must score full marks and an empty sitting must score zero. ЭЕШ papers are wrapped
// the way src/modules/exams/entrance/content.ts wraps them. Node 22.6+ (TypeScript type stripping).
// Run from the repository root: node MockExmps/Free/_source/grade_with_engine.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const engine = await import(pathToFileURL(join(root, "src", "modules", "exams", "engine.ts")).href);
const free = join(root, "MockExmps", "Free");
const files = ["eesh", "sat", "ielts", "jlpt", "hsk"].flatMap(folder =>
  readdirSync(join(free, folder)).filter(name => name.endsWith("-free.json")).map(name => join(free, folder, name)));

function definitionOf(stored) {
  if (stored.stages) return stored;
  return {
    slug: stored.slug, version: 1, program: "entrance", subject: stored.subject, title: stored.title,
    description: stored.description, sources: [], points: stored.points, calculator: stored.calculator, notes: stored.instructions,
    stages: [{ id: `${stored.slug}-stage`, title: stored.title, seconds: stored.durationMinutes * 60, kind: "questions",
      instructions: stored.instructions.join(" "), questions: stored.questions, passages: stored.passages, groups: stored.groups }],
  };
}

let failed = false;
for (const file of files) {
  const definition = definitionOf(JSON.parse(readFileSync(file, "utf8")));
  const full = engine.createExamState(definition, Date.now());
  const empty = engine.createExamState(definition, Date.now());
  let refused = 0;
  for (const stage of definition.stages) for (const question of stage.questions) {
    if (!question.answers?.length) continue;
    full.responses[question.id] = question.answers[0];
    if (!engine.isCorrect(question, question.answers[0])) { refused++; console.log(`  key refused: ${question.id} ${question.answers[0]}`); }
  }
  for (const state of [full, empty]) { state.stageIndex = definition.stages.length; state.finishedAt = new Date().toISOString(); }
  const report = engine.makeReport(full);
  const zero = engine.makeReport(empty);
  const ok = refused === 0 && report.points.earned === report.points.total && zero.points.earned === 0;
  failed ||= !ok;
  const sections = report.sections.map(section => `${section.title} ${section.earned}/${section.points}`).join(" · ");
  console.log(`${ok ? "OK  " : "FAIL"} ${definition.slug}: ${report.points.earned}/${report.points.total} with every key, ${zero.points.earned} empty; ${sections}`);
}
process.exit(failed ? 1 : 0);
