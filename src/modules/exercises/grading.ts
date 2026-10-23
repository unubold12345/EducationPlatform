import type { ExerciseSet } from "./types.ts";

export function gradeExercise(set: ExerciseSet, input: unknown) {
  if (!input || typeof input !== "object" || !("answers" in input)) return null;
  const answers = input.answers;
  if (!Array.isArray(answers) || answers.length !== set.questions.length) return null;
  if (!answers.every((answer, index) => Number.isInteger(answer) && answer >= 0 && answer < set.questions[index].options.length)) return null;
  const reviews = set.questions.map((q, index) => ({ id: q.id, selected: answers[index] as number, correct: q.correct, explanation: q.explanation }));
  return { score: reviews.filter(r => r.selected === r.correct).length, total: reviews.length, reviews };
}
