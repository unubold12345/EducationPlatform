// Client-safe shapes for practice mode. Nothing here may carry an answer before the student checks it.
import type { ExamFigure } from "../exams/types";
export type PracticeKind = "choice" | "number" | "short" | "essay" | "speaking";
export type PracticeSectionKind = "questions" | "listening" | "writing" | "speaking";
/** ЭЕШ Mathematics, Physics and English are the imported set; SAT and IELTS are the international papers. */
export type PracticeSubject = "sat" | "ielts" | "jlpt" | "eesh-math" | "eesh-physics" | "eesh-english";

export type PracticeQuestion = {
  id: string; section: string; label: string; domain: string; kind: PracticeKind;
  prompt?: string; passage?: string; options?: string[]; maxWords?: number; minWords?: number;
  audioPart?: number;
  figure?: ExamFigure;
  points?: number;
  optionLabels?: string[];
  compactOptions?: boolean;
  matcher?: "numeric" | "text" | "math";
  context?: string;
  contextTitle?: string;
  wordBank?: { label: string; text: string }[];
  /** Multi-part task title (2.1), its shared statement and drawing. */
  task?: string; instructions?: string; groupFigure?: ExamFigure;
};
export type PracticeSection = { id: string; title: string; kind: PracticeSectionKind; hint: string; math: boolean };
export type PracticeForm = {
  slug: string; title: string; subject: PracticeSubject; sections: PracticeSection[]; questions: PracticeQuestion[];
  passages: { title: string; text: string }[]; briefingHref: string; points?: number;
};
/** Stored per question at its first check. `correct` is null for work a person has to review. */
export type PracticeResult = { correct: boolean | null };
export type PracticeReveal = PracticeResult & { answer: string; answerValue?: string; explanation: string; transcript?: string; points?: number };
export type PracticeProgress = { responses: Record<string, string>; flags: string[]; results: Record<string, PracticeResult> };
export type PracticeView = { form: PracticeForm; responses: Record<string, string>; flags: string[]; reveals: Record<string, PracticeReveal> };
export type PracticeEdit = { responses?: Record<string, string>; flags?: string[]; retry?: string[] };
