import type { ExamProgram } from "@/modules/exams/types";

// Mock slugs start with their programme, so lists can filter by prefix without reading snapshots.
export const programPrefixes: Record<ExamProgram, string> = { sat: "sat-", ielts: "ielts-", entrance: "eesh-", jlpt: "jlpt-" };
export const programLabels: Record<ExamProgram, string> = { sat: "SAT", ielts: "IELTS", entrance: "ЭЕШ", jlpt: "JLPT" };
export function programOf(slug: string): ExamProgram | null {
  for (const [program, prefix] of Object.entries(programPrefixes)) if (slug.startsWith(prefix)) return program as ExamProgram;
  return null;
}
