export type ExerciseProgram = "sat" | "ielts" | "entrance";
export type ExerciseQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};
export type ExerciseSet = {
  slug: string;
  examId: string;
  program: ExerciseProgram;
  title: string;
  subject: string;
  description: string;
  minutes: number;
  questions: ExerciseQuestion[];
};
export type PublicExercise = Omit<ExerciseSet, "questions"> & {
  questions: Omit<ExerciseQuestion, "correct" | "explanation">[];
};
