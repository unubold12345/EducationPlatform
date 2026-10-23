import type { ExamQuestion } from "./types.ts";
export function choice(id: string, domain: string, passage: string, prompt: string, correct: string, wrong: string[], explanation: string): ExamQuestion {
  const offset = [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4;
  const items = [correct, ...wrong];
  const options = [...items.slice(offset), ...items.slice(0, offset)];
  return { id, domain, passage: passage || undefined, prompt, options, kind: "choice", answers: [correct], explanation };
}
export function short(id: string, domain: string, prompt: string, answers: string[], explanation: string, maxWords = 2): ExamQuestion {
  return { id, domain, prompt, answers, explanation, kind: "short", maxWords };
}
