/** The ЭЕШ plan covers the "entrance" mocks: original ЭЕШ-style Mathematics, Physics, Chemistry, Biology and English. */
export type ExamProgram = "sat" | "ielts" | "entrance" | "jlpt" | "hsk";
/** HSK picture and pinyin display data (answer-free). Words the student hears stay in `listening.script`. */
export type HskPicture = { label?: string; src: string; alt: string };
export type HskLine = { label?: string; text: string; pinyin: string };
/** A question's own printed material: picture choices (Listening 2), its sentence (Reading) or text choices (Listening 4). */
export type HskItem = { pictures?: HskPicture[]; line?: HskLine; choices?: HskLine[] };
/** A part's shared six pictures or six answers/words, and its worked example with the example's printed answer. */
export type HskGroup = { pictures?: HskPicture[]; choices?: HskLine[]; example?: { pictures?: HskPicture[]; line?: HskLine; choices?: HskLine[]; answerLine?: HskLine; answer: string } };
export type EntranceSubject = "math" | "physics" | "chemistry" | "biology" | "english";
/** A site-drawn diagram (legacy mock content) or a stored, self-contained SVG diagram. */
export type ExamFigure =
  | { kind: "piecewise" | "absolute-area" | "isosceles" | "tangents" | "cevians" | "parabola-rectangle" | "open-box" | "circle-line" | "box-net" | "cubic-area" | "triangle-circles"; scale: number }
  | { kind: "image"; src: string; alt: string; width?: number; height?: number; expandable?: boolean };
/** A numbered part of one paper. Group pages keep a reading text or a multi-part task together. */
export type ExamGroup = {
  id: string; title: string; section?: string; instructions?: string;
  context?: string; contextTitle?: string;
  wordBank?: { label: string; text: string }[];
  figure?: ExamFigure;
  pageMode?: "single" | "group";
  kind?: "listening";
  hsk?: HskGroup;
};
export type ExamQuestion = {
  id: string; domain: string; prompt: string; passage?: string; options?: string[];
  kind: "choice" | "number" | "short" | "essay" | "speaking";
  answers: string[]; explanation: string; maxWords?: number; minWords?: number; pretest?: boolean;
  figure?: ExamFigure;
  /** The number printed on the paper (1, 2.1a, …). */
  number?: string;
  /** Marks are counted, not just the number of right answers, when a paper sets item points. */
  points?: number;
  /** The paper part this question belongs to. */
  groupId?: string;
  /** Choice labels printed on the paper: A–E or 1–8 for a matching bank. */
  optionLabels?: string[];
  /** Show only the labels because the full bank is printed above the question. */
  compactOptions?: boolean;
  /** How a typed answer is compared. Defaults from `kind`. */
  matcher?: "numeric" | "text" | "math";
  /** The written form is the task (factorise, simplify, rationalise): a `math` answer must match a listed spelling, not just its value. */
  exactForm?: boolean;
  /** The answer as it should be shown in review (e.g. a Unicode formula). */
  answerDisplay?: string;
  /** Per-question context when it is not shared through the group. */
  context?: string;
  /** Private listening material. Never included in a PublicQuestion or practice form. */
  listening?: { part: number; script: string };
  /** HSK printed material (pictures, pinyin, text choices); answer-free. */
  hsk?: HskItem;
};
export type ExamStage = {
  id: string; title: string; seconds: number; kind: "questions" | "break" | "listening" | "writing" | "speaking" | "preparation";
  instructions: string; questions: ExamQuestion[]; passages?: { title: string; text: string }[];
  audioPart?: number; variants?: { lower: ExamQuestion[]; higher: ExamQuestion[] };
  groups?: ExamGroup[];
};
export type ExamDefinition = {
  slug: string; version: number;
  /** Immutable recording set; independent of the publishing version. Missing means legacy audio. */
  audioRevision?: number; program: ExamProgram; title: string; description: string;
  stages: ExamStage[]; sources: { label: string; url: string }[];
  /** Entrance papers only. */
  subject?: EntranceSubject;
  points?: number;
  calculator?: boolean;
  notes?: string[];
  sourceNote?: string;
};
export type ExamState = {
  version: 1; definition: ExamDefinition; stageIndex: number; stageStartedAt: string; deadline: string;
  responses: Record<string, string>; flags: string[]; routes: Record<string, "lower" | "higher">;
  completed: string[]; finishedAt: string | null;
};
export type PublicQuestion = Omit<ExamQuestion, "answers" | "explanation" | "pretest" | "listening" | "answerDisplay">;
export type PublicStage = Omit<ExamStage, "questions" | "variants"> & { questions: PublicQuestion[] };
export type ExamReport = {
  sections: { title: string; correct: number; total: number; pending: number; points: number; earned: number }[];
  reviews: { id: string; groupId?: string; number?: string; domain: string; prompt: string; passage?: string; selected: string; answer: string; explanation: string; correct: boolean | null; pretest: boolean; figure?: ExamFigure; points: number; earned: number | null;
    /** The shared task text, figure and reading/listening material for a grouped page. */
    instructions?: string; context?: string; contextTitle?: string; transcript?: string;
    /** HSK pictures, pinyin and choices for the review. */
    hsk?: HskItem; hskGroup?: HskGroup }[];
  points: { total: number; earned: number };
};
export type PublicExamAttempt = {
  id: string; slug: string; title: string; program: ExamProgram; audioRevision?: number; revision: number; stageIndex: number;
  stage: PublicStage | null; serverNow: string; deadline: string; stageStartedAt: string;
  responses: Record<string, string>; flags: string[]; completed: string[]; finishedAt: string | null;
  timeline: { title: string; seconds: number; kind: ExamStage["kind"] }[]; report: ExamReport | null;
  recordings: { stageId: string; mime: string }[];
  /** The caller said it already holds this stage, so `stage` is null and it keeps its own copy. */
  stageUnchanged?: boolean;
  subject?: EntranceSubject;
};
