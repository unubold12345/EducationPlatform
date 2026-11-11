// IELTS Academic Mocks 07–12, generated from the offline pack by scripts/build-ielts-mocks.mjs.
// Server-side only, like the other definitions: the JSON holds answers and Listening scripts.
import forms from "./ielts-forms.json" with { type: "json" };
import type { ExamDefinition, ExamQuestion } from "./types.ts";

type StoredQuestion = ExamQuestion & { listeningPart?: number };
type StoredForm = {
  slug: string; paper: number; title: string; description: string;
  listening: StoredQuestion[]; scripts: string[];
  reading: ExamQuestion[]; passages: { title: string; text: string }[];
  writing: ExamQuestion[];
  speaking: { part1: ExamQuestion[]; notes: ExamQuestion; part2: ExamQuestion[]; part3: ExamQuestion[] };
};
const stored = forms as unknown as StoredForm[];

/** Each form reuses the stage timing and instructions of the revised Mocks 02–06. */
export function createIeltsForms(base: ExamDefinition): ExamDefinition[] {
  return stored.map(form => {
    const exam = structuredClone(base);
    exam.slug = form.slug; exam.version = 1; exam.title = form.title; exam.description = form.description;
    // New recordings are not part of the revised 02–06 set; audio-files.ts maps this slug to its own files.
    delete exam.audioRevision;
    // Scripts stay out of the definition (and so out of every attempt snapshot); practice reads them by part.
    const listening = form.listening.map(stored => {
      const question: StoredQuestion = { ...stored };
      delete question.listeningPart;
      return question as ExamQuestion;
    });
    exam.stages[0].questions = listening;
    exam.stages[1].questions = listening;
    exam.stages[2].questions = form.reading;
    exam.stages[2].passages = form.passages;
    exam.stages[3].questions = form.writing;
    exam.stages[4].questions = form.speaking.part1;
    exam.stages[5].questions = [form.speaking.notes];
    exam.stages[6].questions = form.speaking.part2;
    exam.stages[6].instructions = "Speak for up to two minutes about your prepared topic. If time remains, answer the one or two short rounding-off questions that follow the card. The recording is saved for human review.";
    exam.stages[7].questions = form.speaking.part3;
    return exam;
  });
}

/** The four Listening scripts of Mocks 07–12, for practice mode after a question is checked. */
export function ieltsFormScripts(slug: string): string[] {
  return stored.find(form => form.slug === slug)?.scripts ?? [];
}
