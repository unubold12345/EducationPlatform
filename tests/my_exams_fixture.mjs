// Local-only fixture for the exam-from-file suite; never imported by the app. It prints sealed exam tokens
// like the ones browsers kept before exams moved to the account (2026-11-12), so the suite can move real
// exams onto a disposable account without a DeepSeek request.
//   node tests/my_exams_fixture.mjs <userId> [count] [ageDays]
import "dotenv/config";
import { sealExam } from "../src/modules/my-exams/token.ts";

const base = new URL(process.env.BETTER_AUTH_URL ?? "");
if (process.env.AUTH_LOCAL_PILOT !== "true" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw Error("Requires the independent EducationPlatform local pilot.");
const [userId, count = "1", ageDays = "0"] = process.argv.slice(2);
if (!userId || !/^\d{1,2}$/.test(count) || !/^\d{1,3}$/.test(ageDays)) throw Error("Usage: node tests/my_exams_fixture.mjs <userId> [count] [ageDays]");

// The suite knows this key: option A, B, C, D in turn.
const KEY = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];
const sealedAt = Date.now() - Number(ageDays) * 86_400_000;
const tokens = Array.from({ length: Number(count) }, (_, order) => sealExam(userId, {
  title: order ? `Cell biology exam ${order + 1}` : "Cell biology exam",
  language: "mn", sourceName: "notes.pdf", sourceKind: "pdf", createdAt: sealedAt - order * 1000,
  questions: KEY.map((answer, index) => ({
    id: `q${index + 1}`,
    prompt: `Question ${index + 1}: what does the cell structure do in this chapter?`,
    options: ["It carries out one life process.", "It stores the text.", "It changes the author.", "It removes the unit."],
    answer,
    explanation: `Explanation ${index + 1}: the keyed option matches the chapter.`,
    topic: "Cell biology",
  })),
}, sealedAt));
console.log(JSON.stringify(tokens));
