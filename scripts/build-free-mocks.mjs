// Convert the offline free half-length mocks (MockExmps/Free, never deployed) into site content:
//   assets/free-mocks/<slug>.json            private definitions with keys (ЭЕШ papers keep the stored-paper shape)
//   assets/free-mocks/<slug>-listening.json  IELTS Listening scripts by part, for practice mode after a check
//   public/exam-assets/free/<slug>/*.svg     answer-free figures and pictures
//   src/modules/exams/free/catalog.json      client-safe catalogue (no answers or scripts)
// The figures get their own public folder because build-entrance-mocks.mjs and build-hsk-mocks.mjs delete and
// rebuild theirs; the pack's planned paths are rewritten here. The shared HSK worked examples stay where the HSK
// build puts them (/exam-assets/hsk/examples). Rebuild the pack first (python -B MockExmps/Free/_source/build.py),
// then run `node scripts/build-free-mocks.mjs`, then `python scripts/generate-free-audio.py` if a listening script changed.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACK = join("MockExmps", "Free");
const CONTENT = join("assets", "free-mocks");
const PUBLIC = join("public", "exam-assets", "free");
const CATALOG = join("src", "modules", "exams", "free", "catalog.json");
const MOCKS = [
  { slug: "eesh-math-free", file: "eesh/eesh-math-free.json", program: "entrance" },
  { slug: "eesh-physics-free", file: "eesh/eesh-physics-free.json", program: "entrance" },
  { slug: "eesh-chemistry-free", file: "eesh/eesh-chemistry-free.json", program: "entrance" },
  { slug: "eesh-biology-free", file: "eesh/eesh-biology-free.json", program: "entrance" },
  { slug: "eesh-english-free", file: "eesh/eesh-english-free.json", program: "entrance" },
  { slug: "sat-free", file: "sat/sat-free.json", program: "sat" },
  { slug: "ielts-academic-free", file: "ielts/ielts-academic-free.json", program: "ielts", listening: "ielts/ielts-academic-free-listening.json" },
  { slug: "jlpt-n5-free", file: "jlpt/jlpt-n5-free.json", program: "jlpt", level: "N5" },
  { slug: "jlpt-n4-free", file: "jlpt/jlpt-n4-free.json", program: "jlpt", level: "N4" },
  { slug: "hsk1-free", file: "hsk/hsk1-free.json", program: "hsk" },
];
// Where the pack planned each mock's own figures, and where its files are inside the pack.
const PLANNED = [
  { prefix: /^\/exam-assets\/eesh\/[a-z]+\/(eesh-[a-z]+-free)\/([\w.-]+\.svg)$/, source: (slug, name) => join(PACK, "eesh", "images", slug, name) },
  { prefix: /^\/exam-assets\/hsk\/(hsk1-free)\/([\w.-]+\.svg)$/, source: (slug, name) => join(PACK, "hsk", "images", slug, name) },
  { prefix: /^\/ielts-mocks\/(ielts-free)\/([\w.-]+\.svg)$/, source: (_slug, name) => join(PACK, "ielts", "images", "ielts-free", name) },
];
const SHARED = /^\/exam-assets\/hsk\/examples\/[\w.-]+\.svg$/;

const problems = [];
const fail = message => problems.push(message);

/** Rewrites every planned figure path inside a mock to its own folder, copying each file once. */
function relocate(value, slug, copied) {
  if (typeof value === "string") {
    if (SHARED.test(value)) {
      if (!existsSync(join("public", value))) fail(`${slug}: shared picture ${value} is missing (run scripts/build-hsk-mocks.mjs)`);
      return value;
    }
    for (const plan of PLANNED) {
      const match = plan.prefix.exec(value);
      if (!match) continue;
      const source = plan.source(match[1], match[2]);
      const target = join(PUBLIC, slug, match[2]);
      if (!existsSync(source)) { fail(`${slug}: figure ${value} has no file ${source}`); return value; }
      if (!copied.has(target)) {
        const svg = readFileSync(source, "utf8");
        if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/.test(svg) || /<script|javascript:|on[a-z]+\s*=/i.test(svg)) fail(`${slug}: ${source} is not a plain SVG`);
        copyFileSync(source, target);
        copied.add(target);
      }
      return `/exam-assets/free/${slug}/${match[2]}`;
    }
    if (/^\/(exam-assets|ielts-mocks)\//.test(value)) fail(`${slug}: unexpected asset path ${value}`);
    return value;
  }
  if (Array.isArray(value)) return value.map(item => relocate(item, slug, copied));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, relocate(item, slug, copied)]));
  return value;
}

const scored = question => Array.isArray(question.answers) && question.answers.length > 0 && question.kind !== "essay" && question.kind !== "speaking";

rmSync(CONTENT, { recursive: true, force: true });
rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(CONTENT, { recursive: true });
const catalog = [];
for (const mock of MOCKS) {
  const raw = JSON.parse(readFileSync(join(PACK, mock.file), "utf8"));
  if (raw.slug !== mock.slug) fail(`${mock.file}: slug ${raw.slug}, expected ${mock.slug}`);
  mkdirSync(join(PUBLIC, mock.slug), { recursive: true });
  const copied = new Set();
  const content = relocate(raw, mock.slug, copied);
  if (!copied.size) rmSync(join(PUBLIC, mock.slug), { recursive: true, force: true });
  writeFileSync(join(CONTENT, mock.slug + ".json"), JSON.stringify(content, null, 1) + "\n");
  let entry;
  if (mock.program === "entrance") {
    const questions = content.questions;
    if (!Array.isArray(questions) || !questions.length) fail(`${mock.slug}: no questions`);
    for (const question of questions) if (!scored(question)) fail(`${mock.slug}: ${question.id} has no key`);
    const points = questions.reduce((sum, question) => sum + (question.points ?? 1), 0);
    if (points !== content.points) fail(`${mock.slug}: points ${points} ≠ ${content.points}`);
    entry = { slug: mock.slug, program: "entrance", subject: content.subject, title: content.title, questions: questions.length, points: content.points, minutes: content.durationMinutes, listening: false };
  } else {
    if (content.program !== mock.program) fail(`${mock.slug}: program ${content.program}`);
    const seen = new Map();
    for (const stage of content.stages) for (const question of stage.questions) if (scored(question)) seen.set(question.id, question);
    const points = [...seen.values()].reduce((sum, question) => sum + (question.points ?? 1), 0);
    const minutes = content.stages.reduce((sum, stage) => sum + stage.seconds, 0) / 60;
    entry = { slug: mock.slug, program: mock.program, ...(mock.level ? { level: mock.level } : {}), title: content.title, questions: seen.size, points, minutes, listening: content.stages.some(stage => stage.kind === "listening") };
  }
  if (mock.listening) {
    // IELTS scripts by part ("Narrator: …" lines, pauses left out), read server-side by practice mode after a check.
    const script = JSON.parse(readFileSync(join(PACK, mock.listening), "utf8"));
    const parts = script.parts.map(part => part.title + "\n\n" + part.lines.filter(line => line.text).map(line => `${line.speaker}: ${line.text}`).join("\n\n"));
    writeFileSync(join(CONTENT, mock.slug + "-listening.json"), JSON.stringify({ slug: mock.slug, parts }, null, 1) + "\n");
  }
  catalog.push(entry);
}
writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`${catalog.length} free mocks: ${catalog.map(mock => `${mock.slug} (${mock.questions} q, ${mock.minutes} min)`).join(", ")}`);
