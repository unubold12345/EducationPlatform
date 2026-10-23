export type SavedAttempt = {
  id: string; title: string; program: "sat" | "ielts" | "entrance"; revision: number; status: "IN_PROGRESS" | "SUBMITTED";
  questions: { id: string; prompt: string; options: string[] }[];
  answers: (number | null)[];
  result: null | { score: number; total: number; reviews: { id: string; selected: number; correct: number; explanation: string }[] };
};

