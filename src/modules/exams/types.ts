/** The ЭЕШ plan covers the "entrance" mocks: original ЭЕШ-style Mathematics, Physics, Chemistry, Biology and English. */
export type ExamProgram = "sat" | "ielts" | "entrance" | "jlpt" | "hsk" | "toefl" | "topik";
/** HSK picture and pinyin display data (answer-free). Words the student hears stay in `listening.script`. */
export type HskPicture = { label?: string; src: string; alt: string };
export type HskLine = { label?: string; text: string; pinyin: string };
/** A question's own printed material: picture choices (Listening 2), its sentence (Reading), text choices (Listening 4) or the HSK 2 starred statement judged against its text. */
export type HskItem = { pictures?: HskPicture[]; line?: HskLine; choices?: HskLine[]; statement?: HskLine };
/** A part's shared six pictures or six answers/words, and its worked example with the example's printed answer. */
/** `layout` (HSK 2) names the page type a group is drawn as when its id does not: an HSK 1 part or J, the text-only true/false part. */
export type HskGroup = { layout?: "L1"|"L2"|"L3"|"L4"|"R1"|"R2"|"R3"|"R4"|"J"; pictures?: HskPicture[]; choices?: HskLine[]; example?: { pictures?: HskPicture[]; line?: HskLine; statement?: HskLine; choices?: HskLine[]; answerLine?: HskLine; answer: string } };
/** TOEFL printed material (answer-free): a Complete the Words gap, a Build a Sentence task, or the recording a speaking item plays. */
export type ToeflItem = { gap?: { prefix: string; missing: number }; build?: { context: string; prefix?: string; suffix?: string; end: string; chips: string[]; slots: number }; clip?: string };
/** A TOEFL group's page: the paragraph with its gaps (`q` marks a gap), a text or passage, a recording, a writing task or a speaking introduction. Never answers or scripts. */
export type ToeflGroup =
  | { layout: "words"; segments: (string | { q: string; prefix?: string; missing?: number })[] }
  | { layout: "daily"; format: string; heading: string; text: string }
  | { layout: "academic"; title: string; paragraphs: string[] }
  | { layout: "response"; clip: string }
  | { layout: "set"; setting: string; clip: string }
  | { layout: "email"; scenario: string; to: string; subject: string; bullets: string[] }
  | { layout: "discussion"; course: string; professor: { name: string; post: string }; students: { name: string; post: string }[] }
  | { layout: "speaking-intro"; part: "repeat" | "interview"; scenario: string; picture?: string; clip: string };
/** TOPIK printed material (answer-free). A document, chart or picture is what the paper prints; writing model answers stay in `answerDisplay`. */
export type TopikDoc = { kind: string; title?: string; lines: string[]; footer?: string; from?: string; to?: string };
export type TopikChart = { type: "bar" | "hbar" | "line" | "pie" | "table"; title: string; unit?: string; labels: string[]; series: { name: string; values: number[] }[]; note?: string };
export type TopikPicture = { src: string; alt: string };
/** One TOPIK question's own print: its four choices (or four pictures / charts), the question line of a paired set, its text, and a writing task. */
export type TopikItem = {
  choices?: string[]; pictures?: TopikPicture[]; charts?: TopikChart[]; line?: string;
  passage?: string; doc?: TopikDoc; chart?: TopikChart; sentence?: string;
  /** Writing 51–52: the gaps to fill; 53: the topic, charts and notes; 54: the prompt and its three questions. Character range for 53–54. */
  gaps?: string[]; topic?: string; notes?: string[]; prompt?: string; bullets?: string[]; chars?: [number, number];
};
/** A printed block ([1～4], [25～26] …): its number range, instruction, worked example (보기) and the text a paired set shares. `plays` is how often the recording is read. */
export type TopikGroup = {
  range: string; instruction: string; plays?: 1 | 2;
  example?: { lines?: string[]; passage?: string; choices: string[]; answer: number };
  passage?: string; doc?: TopikDoc; chart?: TopikChart;
};
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
  toefl?: ToeflGroup;
  topik?: TopikGroup;
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
  /** TOEFL printed material; answer-free. */
  toefl?: ToeflItem;
  /** TOPIK printed material; answer-free. */
  topik?: TopikItem;
  /** Seconds from the stage start during which a changed answer is accepted (TOEFL Listening plays each item once). */
  window?: { start: number; end: number };
};
export type ExamStage = {
  id: string; title: string; seconds: number; kind: "questions" | "break" | "listening" | "writing" | "speaking" | "preparation";
  instructions: string; questions: ExamQuestion[]; passages?: { title: string; text: string }[];
  audioPart?: number; variants?: { lower: ExamQuestion[]; higher: ExamQuestion[] };
  /** Correct answers in the previous stage needed for the `higher` variant; without it the engine uses 65 %. */
  routeAt?: number;
  /** The variant's own length when the two routes differ (TOEFL Listening Module 2); `seconds` is used before routing. */
  variantSeconds?: { lower: number; higher: number };
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
    hsk?: HskItem; hskGroup?: HskGroup;
    /** TOPIK print for the review. */
    topik?: TopikItem; topikGroup?: TopikGroup }[];
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
