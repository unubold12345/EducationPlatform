// Turns a mock definition into a practice form, and holds the only code that
// reads its answers. Server-side only: the client imports the types, never this file.
import { isCorrect } from "../exams/engine.ts";
import { listeningScripts } from "../exams/ielts-listening.ts";
import { additionalListening } from "../exams/ielts-additional-listening.ts";
import { entranceSubjectOf } from "../exams/entrance/catalog.ts";
import type { ExamDefinition, ExamGroup, ExamQuestion, ExamStage } from "../exams/types.ts";
import type { PracticeEdit, PracticeForm, PracticeKind, PracticeProgress, PracticeQuestion, PracticeResult, PracticeReveal, PracticeSection, PracticeSubject } from "./types.ts";

/** Everything the assistant may read about one question. Answers stay out until the student has checked. */
export type PracticeMaterial = { section: string; domain: string; prompt: string; options?: string[]; passage?: string; transcript?: string; context?: string };
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
} as const;
const subjectOf = (definition: ExamDefinition): PracticeSubject => {
  if (definition.program !== "entrance") return definition.program;
  const subject = entranceSubjectOf(definition.slug);
  return subject === "physics" ? "eesh-physics" : subject === "english" ? "eesh-english" : "eesh-math";
};

const listeningPartSize = 10;
function transcriptsFor(slug: string) {
  const form = /^ielts-academic-0([1-6])$/.exec(slug)?.[1];
  if (!form) return [];
  const scripts = form === "1" ? listeningScripts : additionalListening(Number(form)).scripts;
  return scripts.map(script => script.title + "\n\n" + script.halves.flat().map(turn => turn.text).join("\n\n"));
}
const pointsOf = (question: Pick<ExamQuestion, "points">) => question.points ?? 1;

function entranceSections(stage: ExamStage, english: boolean) {
  const sections = new Map<string, PracticeSection>();
  const ordered: PracticeSection[] = [];
  const list: PracticeQuestion[] = [];
  const push = (section: PracticeSection) => {
    if (sections.has(section.id)) return;
    sections.set(section.id, section);
    ordered.push(section);
  };
  const idFor = (title: string) => "sec-" + title.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const groups: ExamGroup[] = stage.groups?.length ? stage.groups : [{ id: "all", title: stage.title }];
  for (const group of groups) {
    const questions = stage.questions.filter(question => question.groupId === group.id || (!question.groupId && group.id === "all"));
    if (!questions.length) continue;
    const title = group.section || stage.title;
    const id = idFor(title);
    const kind = group.kind === "listening" ? "listening" : "questions";
    push({ id, title, kind, math: false, hint: group.kind === "listening" ? "Бичлэг оруулаагүй. Доорх текстийг хоёр удаа уншиж, асуултад хариулна уу." : "" });
    for (const question of questions) {
      list.push({
        id: question.id, section: id, label: question.number ?? String(list.length + 1), domain: question.domain,
        kind: question.kind, prompt: question.prompt || undefined, passage: question.passage, options: question.options,
        maxWords: question.maxWords, minWords: question.minWords, figure: question.figure,
        points: pointsOf(question), optionLabels: question.optionLabels, compactOptions: question.compactOptions,
        matcher: question.matcher, context: group.context ?? question.context, contextTitle: group.contextTitle,
        wordBank: group.wordBank,
        // A multi-part task (ЭЕШ Part 2) keeps its statement and drawing on the group, not on each sub-question.
        // English tasks also carry their directions there; the timed sitting shows both, so practice does too.
        ...(group.instructions && (group.pageMode === "group" || english) ? { task: group.title, instructions: group.instructions } : {}),
        ...(group.figure ? { groupFigure: group.figure } : {}),
      });
    }
  }
  return { sections: ordered, questions: list };
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
    sections.push({ id, title, kind, hint: hints[kind], math: /^(sat|eesh)-math/.test(stage.id) });
    fresh.forEach((question, index) => {
      authored.set(question.id, question);
      const { id: questionId, domain, prompt, passage, options, kind: questionKind, maxWords, minWords, figure } = question;
      questions.push({ id: questionId, section: id, label: question.number || String(index + 1), domain, kind: questionKind, prompt, passage: passage || undefined, options, maxWords, minWords, figure, points: pointsOf(question), matcher: question.matcher, optionLabels: question.optionLabels, compactOptions: question.compactOptions, ...(kind === "listening" ? { audioPart: Math.floor(index / listeningPartSize) + 1 } : {}) });
    });
  }
  const entrance = definition.program === "entrance";
  if (definition.program === "jlpt") {
    for (const stage of definition.stages) for (const group of stage.groups ?? []) {
      const list = stage.questions.filter(question=>question.groupId===group.id);
      sections.push({id:group.id,title:group.title,kind:stage.kind==="listening"?"listening":"questions",math:false,
        hint:stage.kind==="listening"?"Япон бичлэгийг дахин сонсож болно. Шалгасны дараа текст нээгдэнэ.":"1–4 сонгох · Enter шалгах · Алдсан асуултаа шүүж дахин ажиллаарай."});
      for (const question of list) {
        authored.set(question.id,question);
        const {id,number,domain,prompt,passage,options,kind,optionLabels}=question;
        questions.push({id,section:group.id,label:number!,domain,prompt,passage,options,kind,optionLabels,points:1,
          instructions:group.instructions,...(question.listening?{audioPart:question.listening.part}:{})});
      }
    }
  } else if (entrance) {
    const stage = definition.stages[0];
    const built = entranceSections(stage, definition.subject === "english");
    sections.push(...built.sections);
    questions.push(...built.questions);
    for (const question of stage.questions) authored.set(question.id, question);
    const math = definition.subject === "math" || definition.subject === "physics";
    for (const section of sections) section.math = math;
  } else {
    for (const stage of definition.stages) {
      // The break, the listening re-check and the cue-card minute only make sense against a clock.
      if (stage.kind === "break" || stage.kind === "preparation" || stage.id === "ielts-listening-check") continue;
      if (stage.variants) {
        addSection(stage, stage.id + ":lower", stage.title + " · Хөнгөн хувилбар", stage.variants.lower);
        addSection(stage, stage.id + ":higher", stage.title + " · Хүнд хувилбар", stage.variants.higher);
      } else addSection(stage, stage.id, stage.title, stage.questions);
    }
  }
  const questionFor = (id: string) => {
    const question = authored.get(id);
    if (!question) throw new Error("Unknown practice question");
    return question;
  };
  const partOf = (id: string) => questions.find(question => question.id === id)?.audioPart;
  const transcriptFor = (id: string) => {
    if (definition.program === "jlpt") return authored.get(id)?.listening?.script;
    const part = partOf(id);
    return part ? transcripts[part - 1] : undefined;
  };
  return {
    form: { slug: definition.slug, title: definition.title, subject: subjectOf(definition), sections, questions, passages, briefingHref: "/exams/" + definition.slug, ...(definition.points ? { points: definition.points } : {}) },
    grade: (id, response) => ({ correct: isCorrect(questionFor(id), response) }),
    reveal(id, result) {
      const question = questionFor(id);
      const transcript = transcriptFor(id);
      return { ...result, answer: question.answerDisplay ?? question.answers.join(" / "), ...(definition.program==="jlpt"?{answerValue:question.answers[0]}:{}), explanation: question.explanation, points: pointsOf(question), ...(transcript ? { transcript } : {}) };
    },
    material(id) {
      const question = questionFor(id);
      const summary = questions.find(item => item.id === id)!;
      const passage = question.passage ? passages.find(item => item.title === question.passage)?.text ?? question.passage : undefined;
      const context = [summary.instructions, summary.context].filter(Boolean).join("\n\n");
      return { section: sections.find(section => section.id === summary.section)!.title, domain: question.domain, prompt: question.prompt, options: question.options, passage: passage || undefined, context: context || undefined };
    },
  };
}

const limits: Partial<Record<PracticeKind, number>> = { essay: 16000, speaking: 4000, number: 160, short: 160 };
function validResponse(question: PracticeQuestion, value: unknown) {
  if (typeof value !== "string") return false;
  if (question.kind === "choice") return value === "" || Boolean(question.options?.includes(value));
  return value.length <= (limits[question.kind] ?? 160);
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
  const graded = known.filter(question => results[question.id].correct !== null);
  const points = graded.reduce((sum, question) => sum + (question.points ?? 1), 0);
  const earned = graded.filter(question => results[question.id].correct).reduce((sum, question) => sum + (question.points ?? 1), 0);
  return { checked: known.length, total: form.questions.length, graded: graded.length, correct: graded.filter(question => results[question.id].correct).length, points, earned };
}
