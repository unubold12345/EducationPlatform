// Client-safe shapes for practice mode. Nothing here may carry an answer before the student checks it.
export type PracticeKind = "choice" | "number" | "short" | "essay" | "speaking" | "paper-choice" | "paper-digits";
export type PracticeSectionKind = "questions" | "listening" | "writing" | "speaking" | "paper";
export type PracticeSubject = "sat" | "ielts" | "eec-math" | "eec-english";

export type PracticeQuestion = {
  id: string; section: string; label: string; domain: string; kind: PracticeKind;
  prompt?: string; passage?: string; options?: string[]; maxWords?: number; minWords?: number;
  audioPart?: number; cells?: string[]; ungraded?: boolean;
};
export type PracticeSection = { id: string; title: string; kind: PracticeSectionKind; hint: string; math: boolean };
export type PracticeForm = {
  slug: string; title: string; subject: PracticeSubject; sections: PracticeSection[]; questions: PracticeQuestion[];
  passages: { title: string; text: string }[]; pages: string[]; briefingHref: string;
};
/** Stored per question at its first check. `correct` is null for work a person has to review. */
export type PracticeResult = { correct: boolean | null; marks?: number; maxMarks?: number };
export type PracticeReveal = PracticeResult & { answer: string; explanation: string; transcript?: string };
export type PracticeProgress = { responses: Record<string, string>; flags: string[]; results: Record<string, PracticeResult> };
export type PracticeView = { form: PracticeForm; responses: Record<string, string>; flags: string[]; reveals: Record<string, PracticeReveal> };
export type PracticeEdit = { responses?: Record<string, string>; flags?: string[]; retry?: string[] };
