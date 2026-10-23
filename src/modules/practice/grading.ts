import { questions, type PracticeResult } from "./questions.ts";

// Original demonstration content, not copied from an official question bank.
// Keep the answer key on the server; do not import this module in client components.
const answerKey = [
  { correct: 1, explanation: "Хоёр талаас 7-г хасвал 3x = 15. Хоёр талыг 3-т хуваавал x = 5." },
  { correct: 2, explanation: "x = 2-ыг орлуулбал y = 4 × 2 − 3 = 8 − 3 = 5." },
  { correct: 3, explanation: "Нэг дэвтэр 4 доллар тул n дэвтэр 4n доллар. Хүргэлтийн 3 долларыг нэг удаа нэмэхэд нийт 4n + 3 болно." },
];

export function gradePractice(input: unknown): PracticeResult | null {
  if (!input || typeof input !== "object" || !("answers" in input)) return null;
  const answers = input.answers;
  if (!Array.isArray(answers) || answers.length !== questions.length) return null;
  if (!answers.every((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < questions[index].options.length)) return null;
  const reviews = questions.map((question, index) => ({
    id: question.id, selected: answers[index] as number, ...answerKey[index],
  }));
  return { score: reviews.filter(item => item.selected === item.correct).length, total: questions.length, reviews };
}

