// Turns a mock definition or an official paper into a practice form, and holds the only code that
// reads its answers. Server-side only: the client imports the types, never this file.
import { isCorrect } from "../exams/engine.ts";
import { listeningScripts } from "../exams/ielts-listening.ts";
import { additionalListening } from "../exams/ielts-additional-listening.ts";
import type { ExamDefinition, ExamQuestion, ExamStage } from "../exams/types.ts";
import { gradePaper, type PaperKey } from "../papers/engine.ts";
import { slotsForPaper, type PaperSlot } from "../papers/layout.ts";
import { mathPaperContent } from "../papers/math-2020/index.ts";
import type { PaperFigure, PaperTable } from "../papers/math-2020/types.ts";
import type { PracticeEdit, PracticeForm, PracticeKind, PracticeProgress, PracticeQuestion, PracticeResult, PracticeReveal, PracticeSection } from "./types.ts";

/** Everything the assistant may read about one question. Answers stay out until the student has checked. */
export type PracticeMaterial = {
  section: string; domain: string; prompt: string; options?: string[]; passage?: string; data?: string; table?: PaperTable;
  figure?: PaperFigure; work?: string; cells?: string[]; transcript?: string; questionTextAvailable: boolean;
};
export type PracticeSource = {
  form: PracticeForm;
  grade(id: string, response: string): PracticeResult;
  reveal(id: string, result: PracticeResult): PracticeReveal;
  material(id: string): PracticeMaterial;
};

const hints = {
  questions: "Хариугаа сонгоод «Шалгах» дарна уу. Тайлбар нь шууд гарна.",
  listening: "Бичлэгийг хэдэн ч удаа сонсож, зогсоож болно. Хариугаа шалгасны дараа тухайн хэсгийн текст нээгдэнэ.",
  writing: "Бичих даалгаврыг автоматаар дүгнэхгүй. Зөвлөмж болон AI туслахын саналаар бичвэрээ сайжруулаарай.",
  speaking: "Чанга хариулж дасгал хийгээрэй. Энд бичлэг хадгалахгүй. Санаа, тэмдэглэлээ бичиж, AI туслахаас зөвлөгөө аваарай.",
  paper: "Хариугаа оруулаад «Шалгах» дарна уу. Албан түлхүүртэй шууд тулгана.",
} as const;

const listeningPartSize = 10;
function transcriptsFor(slug: string) {
  const form = /^ielts-academic-0([1-6])$/.exec(slug)?.[1];
  if (!form) return [];
  const scripts = form === "1" ? listeningScripts : additionalListening(Number(form)).scripts;
  return scripts.map(script => script.title + "\n\n" + script.halves.flat().map(turn => turn.text).join("\n\n"));
}

export function mockPractice(definition: ExamDefinition): PracticeSource {
  const sections: PracticeSection[] = [];
  const questions: PracticeQuestion[] = [];
  const authored = new Map<string, ExamQuestion>();
  const transcripts = transcriptsFor(definition.slug);
  const passages = definition.stages.flatMap(stage => stage.passages ?? []);

  function addSection(stage: ExamStage, id: string, title: string, list: ExamQuestion[]) {
    const fresh = list.filter(question => !authored.has(question.id));
    if (!fresh.length) return;
    const kind = stage.kind === "listening" || stage.kind === "writing" || stage.kind === "speaking" ? stage.kind : "questions";
    sections.push({ id, title, kind, hint: hints[kind], math: stage.id.startsWith("sat-math") });
    fresh.forEach((question, index) => {
      authored.set(question.id, question);
      const { id: questionId, domain, prompt, passage, options, kind: questionKind, maxWords, minWords } = question;
      questions.push({ id: questionId, section: id, label: String(index + 1), domain, kind: questionKind, prompt, passage: passage || undefined, options, maxWords, minWords, ...(kind === "listening" ? { audioPart: Math.floor(index / listeningPartSize) + 1 } : {}) });
    });
  }
  for (const stage of definition.stages) {
    // The break, the listening re-check and the cue-card minute only make sense against a clock.
    if (stage.kind === "break" || stage.kind === "preparation" || stage.id === "ielts-listening-check") continue;
    if (stage.variants) {
      addSection(stage, stage.id + ":lower", stage.title + " · Хөнгөн хувилбар", stage.variants.lower);
      addSection(stage, stage.id + ":higher", stage.title + " · Хүнд хувилбар", stage.variants.higher);
    } else addSection(stage, stage.id, stage.title, stage.questions);
  }
  const questionFor = (id: string) => {
    const question = authored.get(id);
    if (!question) throw new Error("Unknown practice question");
    return question;
  };
  const partOf = (id: string) => questions.find(question => question.id === id)?.audioPart;
  const transcriptFor = (id: string) => {
    const part = partOf(id);
    return part ? transcripts[part - 1] : undefined;
  };
  return {
    form: { slug: definition.slug, title: definition.title, subject: definition.program, sections, questions, passages, pages: [], briefingHref: "/exams/" + definition.slug },
    grade: (id, response) => ({ correct: isCorrect(questionFor(id), response) }),
    reveal(id, result) {
      const question = questionFor(id);
      const transcript = transcriptFor(id);
      return { ...result, answer: question.answers.join(" / "), explanation: question.explanation, ...(transcript ? { transcript } : {}) };
    },
    material(id) {
      const question = questionFor(id);
      const summary = questions.find(item => item.id === id)!;
      const passage = question.passage ? passages.find(item => item.title === question.passage)?.text ?? question.passage : undefined;
      return { section: sections.find(section => section.id === summary.section)!.title, domain: question.domain, prompt: question.prompt, options: question.options, passage: passage || undefined, questionTextAvailable: true };
    },
  };
}

type PaperInput = { slug: string; title: string; variant: string; subject?: "math" | "english"; pageUrls: string[]; slots?: PaperSlot[]; categoryPath?: string };
const cellsFor = (slot: PaperSlot) => slot.cellLabels ?? "abcdefg".split("").slice(0, slot.length ?? 7);

export function paperPractice(paper: PaperInput, key: PaperKey): PracticeSource {
  const english = paper.subject === "english";
  const content = mathPaperContent(paper.slug);
  const slots = slotsForPaper(paper);
  const paperSection = (id: PaperSlot["kind"], title: string): PracticeSection => ({ id, title, kind: "paper", hint: hints.paper, math: !english });
  const sections = [paperSection("choice", "Сонгох даалгавар"), paperSection("digits", "Нөхөх даалгавар")].filter(section => slots.some(slot => slot.kind === section.id));
  const marksFor = (slot: PaperSlot) => {
    if (slot.kind === "choice") return key.choiceMarks[Number(slot.id) - 1] ?? 0;
    return key.fills.find(fill => fill.id === slot.id)?.groups.reduce((sum, group) => sum + group.marks, 0) ?? 0;
  };
  const questions: PracticeQuestion[] = slots.map(slot => ({
    id: slot.id, section: slot.kind, label: slot.label, domain: slot.kind === "choice" ? "Сонгох" : "Нөхөх",
    kind: slot.kind === "choice" ? "paper-choice" : "paper-digits",
    ...(slot.kind === "choice" ? { options: slot.options ?? "ABCDE".split("") } : { cells: cellsFor(slot) }),
    ...(marksFor(slot) === 0 ? { ungraded: true } : {}),
  }));
  const slotFor = (id: string) => {
    const slot = slots.find(item => item.id === id);
    if (!slot) throw new Error("Unknown practice question");
    return slot;
  };
  return {
    form: { slug: paper.slug, title: paper.title, subject: english ? "eec-english" : "eec-math", sections, questions, passages: [], pages: english ? paper.pageUrls : [], briefingHref: "/exams/" + paper.slug },
    grade(id, response) {
      const slot = slotFor(id);
      const report = gradePaper(key, { [id]: response });
      if (slot.kind === "choice") {
        const item = report.choices.find(choice => choice.id === id)!;
        return { correct: response === item.answer, marks: item.marks, maxMarks: item.maxMarks };
      }
      const item = report.fills.find(fill => fill.id === id)!;
      return { correct: item.maxMarks > 0 ? item.marks === item.maxMarks : item.selected === item.answer, marks: item.marks, maxMarks: item.maxMarks };
    },
    reveal(id, result) {
      const slot = slotFor(id);
      if (slot.kind === "choice") {
        const correction = key.corrections?.find(item => item.id === id);
        return { ...result, answer: key.choices[Number(id) - 1], explanation: correction ? `Албан түлхүүрт ${correction.printed} гэж хэвлэгдсэн алдааг ${correction.answer} болгож зассан.` : "" };
      }
      const digits = key.fills.find(fill => fill.id === id)!.digits;
      return { ...result, answer: cellsFor(slot).map((cell, index) => cell + " = " + digits[index]).join(" · "), explanation: "" };
    },
    material(id) {
      const slot = slotFor(id);
      const section = sections.find(item => item.id === slot.kind)!.title;
      const choice = content?.choices.find(item => item.id === id);
      if (choice) return { section, domain: "Математик", prompt: choice.prompt, options: choice.options, data: choice.data, table: choice.table, figure: choice.figure, questionTextAvailable: true };
      const fill = content?.fills.find(item => item.id === id);
      if (fill) return { section, domain: "Математик", prompt: fill.prompt, work: fill.work, figure: fill.figure, cells: cellsFor(slot), questionTextAvailable: true };
      return { section, domain: "Англи хэл", prompt: `${paper.title}, даалгавар ${slot.label}`, questionTextAvailable: false };
    },
  };
}

const limits: Partial<Record<PracticeKind, number>> = { essay: 16000, speaking: 4000, number: 32, short: 120 };
function validResponse(question: PracticeQuestion, value: unknown) {
  if (typeof value !== "string") return false;
  if (question.kind === "choice" || question.kind === "paper-choice") return value === "" || Boolean(question.options?.includes(value));
  if (question.kind === "paper-digits") return value.length <= (question.cells?.length ?? 0) && /^[0-9_]*$/.test(value);
  return value.length <= (limits[question.kind] ?? 120);
}
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validPracticeEdit(form: PracticeForm, input: unknown): input is PracticeEdit {
  if (!isRecord(input) || Object.keys(input).some(key => !["responses", "flags", "retry"].includes(key))) return false;
  const known = new Map(form.questions.map(question => [question.id, question]));
  const knownList = (value: unknown) => Array.isArray(value) && value.length <= form.questions.length && value.every(id => typeof id === "string" && known.has(id));
  if (input.flags !== undefined && !knownList(input.flags)) return false;
  if (input.retry !== undefined && !knownList(input.retry)) return false;
  if (input.responses === undefined) return true;
  if (!isRecord(input.responses)) return false;
  return Object.entries(input.responses).every(([id, value]) => {
    const question = known.get(id);
    return Boolean(question) && validResponse(question!, value);
  });
}
export function validPracticeCheck(form: PracticeForm, input: unknown): input is { questionId: string; response: string } {
  if (!isRecord(input) || Object.keys(input).sort().join() !== "questionId,response" || typeof input.questionId !== "string") return false;
  const question = form.questions.find(item => item.id === input.questionId);
  return Boolean(question) && validResponse(question!, input.response);
}

const reviewedByPerson = (question: PracticeQuestion) => question.kind === "essay" || question.kind === "speaking";

// A checked answer is locked until the student asks to retry it, so the first result stays honest.
// Writing and speaking stay editable: reading the guidance is how the student improves them.
export function applyPracticeEdit(form: PracticeForm, progress: PracticeProgress, edit: PracticeEdit): PracticeProgress {
  const next: PracticeProgress = { responses: { ...progress.responses }, flags: progress.flags, results: { ...progress.results } };
  for (const id of edit.retry ?? []) { delete next.results[id]; delete next.responses[id]; }
  for (const [id, value] of Object.entries(edit.responses ?? {})) {
    const question = form.questions.find(item => item.id === id)!;
    if (!next.results[id] || reviewedByPerson(question)) next.responses[id] = value;
  }
  if (edit.flags) next.flags = [...new Set(edit.flags)];
  return next;
}
export function applyPracticeCheck(source: PracticeSource, progress: PracticeProgress, id: string, response: string): PracticeProgress {
  const question = source.form.questions.find(item => item.id === id)!;
  const next: PracticeProgress = { responses: { ...progress.responses }, flags: progress.flags, results: { ...progress.results } };
  if (next.results[id]) {
    if (reviewedByPerson(question)) next.responses[id] = response;
    return next;
  }
  next.responses[id] = response;
  next.results[id] = source.grade(id, response);
  return next;
}
export function practiceStats(form: PracticeForm, results: Record<string, PracticeResult>) {
  const known = form.questions.filter(question => results[question.id]);
  const graded = known.filter(question => results[question.id].correct !== null && !question.ungraded);
  return { checked: known.length, total: form.questions.length, graded: graded.length, correct: graded.filter(question => results[question.id].correct).length };
}
