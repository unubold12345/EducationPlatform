export function validateAnswers(input: unknown, optionCounts: number[], complete: boolean): input is { revision: number; answers: (number | null)[] } {
  if (!input || typeof input !== "object" || !("revision" in input) || !("answers" in input)) return false;
  if (!Number.isSafeInteger(input.revision) || (input.revision as number) < 0) return false;
  return Array.isArray(input.answers) && input.answers.length === optionCounts.length &&
    input.answers.every((answer, index) => answer === null ? !complete : Number.isInteger(answer) && answer >= 0 && answer < optionCounts[index]);
}

