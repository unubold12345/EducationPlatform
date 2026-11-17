// Local-only fixture for the exam-from-file suite; never imported by the app. It prints sealed exam tokens
// like the ones browsers kept before exams moved to the account (2026-11-12), so the suite can move real
// exams onto a disposable account without a DeepSeek request.
//   node tests/my_exams_fixture.mjs <userId> [count] [ageDays] [plain|mixed]
import "dotenv/config";
import { sealExam } from "../src/modules/my-exams/token.ts";

const base = new URL(process.env.BETTER_AUTH_URL ?? "");
if (process.env.AUTH_LOCAL_PILOT !== "true" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw Error("Requires the independent EducationPlatform local pilot.");
const [userId, count = "1", ageDays = "0", shape = "plain"] = process.argv.slice(2);
if (!userId || !/^\d{1,2}$/.test(count) || !/^\d{1,3}$/.test(ageDays) || !["plain", "mixed"].includes(shape)) throw Error("Usage: node tests/my_exams_fixture.mjs <userId> [count] [ageDays] [plain|mixed]");

// The suite knows this key: option A, B, C, D in turn.
const KEY = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
const sealedAt = Date.now() - Number(ageDays) * 86_400_000;
// "mixed": one question of each format (2026-11-17), each answered by choosing one option like any other.
const MIXED = [
  { prompt: "Which structure holds the cell's DNA?", options: ["The nucleus", "The ribosome", "The cell wall", "The vacuole"], answer: 0 },
  { kind: "truefalse", prompt: "Ribosomes make lipids.", options: ["Үнэн", "Худал"], answer: 1 },
  { kind: "blank", prompt: "Photosynthesis takes place in the _____.", options: ["chloroplast", "nucleus", "ribosome", "vacuole"], answer: 0 },
  { kind: "match", prompt: "Match each part with its job.\n1. Nucleus\n2. Ribosome\n3. Mitochondrion\na) energy\nb) proteins\nc) DNA", options: ["1-c, 2-b, 3-a", "1-a, 2-b, 3-c", "1-b, 2-c, 3-a", "1-c, 2-a, 3-b"], answer: 0 },
  { kind: "statements", prompt: "Which statements are true?\nI. Cells divide.\nII. Cells grow.\nIII. Cells are made of stone.", options: ["I only", "I and II", "II and III", "I, II and III"], answer: 1 },
  { kind: "case", prompt: "A student keeps a leaf in the dark for two days. Which process stops first?", options: ["Photosynthesis", "Respiration", "Transpiration", "Division"], answer: 0 },
  { kind: "order", prompt: "Put the stages of the cell cycle in order.\n1. G2\n2. S\n3. G1\n4. M", options: ["3 → 2 → 1 → 4", "1 → 2 → 3 → 4", "2 → 3 → 1 → 4", "4 → 3 → 2 → 1"], answer: 0 },
];
const tokens = Array.from({ length: Number(count) }, (_, order) => sealExam(userId, {
  title: order ? `Cell biology exam ${order + 1}` : "Cell biology exam",
  language: "mn", sourceName: "notes.pdf", sourceKind: "pdf", createdAt: sealedAt - order * 1000,
  questions: shape === "mixed"
    ? MIXED.map((question, index) => ({ id: `q${index + 1}`, ...question, explanation: `Explanation ${index + 1}: the keyed option matches the chapter.` }))
    : KEY.map((answer, index) => ({
      id: `q${index + 1}`,
      prompt: `Question ${index + 1}: what does the cell structure do in this chapter?`,
      options: ["It carries out one life process.", "It stores the text.", "It changes the author.", "It removes the unit."],
      answer,
      explanation: `Explanation ${index + 1}: the keyed option matches the chapter.`,
      topic: "Cell biology",
    })),
}, sealedAt));
console.log(JSON.stringify(tokens));
