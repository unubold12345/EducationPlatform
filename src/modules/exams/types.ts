export type ExamQuestion = {
  id: string; domain: string; prompt: string; passage?: string; options?: string[];
  kind: "choice" | "number" | "short" | "essay" | "speaking";
  answers: string[]; explanation: string; maxWords?: number; minWords?: number; pretest?: boolean;
};
export type ExamStage = {
  id: string; title: string; seconds: number; kind: "questions" | "break" | "listening" | "writing" | "speaking" | "preparation";
  instructions: string; questions: ExamQuestion[]; passages?: { title: string; text: string }[];
  audioPart?: number; variants?: { lower: ExamQuestion[]; higher: ExamQuestion[] };
};
export type ExamDefinition = {
  slug: string; version: number; program: "sat" | "ielts"; title: string; description: string;
  stages: ExamStage[]; sources: { label: string; url: string }[];
};
export type ExamState = {
  version: 1; definition: ExamDefinition; stageIndex: number; stageStartedAt: string; deadline: string;
  responses: Record<string, string>; flags: string[]; routes: Record<string, "lower" | "higher">;
  completed: string[]; finishedAt: string | null;
};
export type PublicQuestion = Omit<ExamQuestion, "answers" | "explanation" | "pretest">;
export type PublicStage = Omit<ExamStage, "questions" | "variants"> & { questions: PublicQuestion[] };
export type ExamReport = { sections: { title: string; correct: number; total: number; pending: number }[];
  reviews: { id: string; domain: string; prompt: string; passage?: string; selected: string; answer: string; explanation: string; correct: boolean | null; pretest: boolean }[] };
export type PublicExamAttempt = {
  id: string; slug: string; title: string; program: "sat" | "ielts"; revision: number; stageIndex: number;
  stage: PublicStage | null; serverNow: string; deadline: string; stageStartedAt: string;
  responses: Record<string, string>; flags: string[]; completed: string[]; finishedAt: string | null;
  timeline: { title: string; seconds: number; kind: ExamStage["kind"] }[]; report: ExamReport | null;
  recordings: { stageId: string; mime: string }[];
};
