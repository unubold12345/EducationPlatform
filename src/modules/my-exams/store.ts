"use client";
import { useSyncExternalStore } from "react";
import { MY_EXAM_LIMITS, type ExamLanguage } from "./contracts";

// Generated exams, in-progress answers and results live only in this browser, per account,
// like Workspace chats and vocabulary banks. The answer key stays in the sealed token.
export type StoredQuestion = { id: string; prompt: string; options: string[]; topic?: string };
export type Draft = {
  answers: Record<string, number>;
  index: number;
  flagged: string[];
  startedAt: number;
  mode: "timed" | "untimed";
};
export type StoredResultItem = { id: string; chosen: number | null; answer: number; correct: boolean; explanation: string; topic?: string };
export type StoredResult = {
  total: number;
  correct: number;
  percent: number;
  finishedAt: number;
  elapsedSeconds: number;
  timed: boolean;
  results: StoredResultItem[];
};
export type StoredExam = {
  id: string;
  title: string;
  sourceName: string;
  sourceKind: string;
  language: ExamLanguage;
  createdAt: number;
  updatedAt: number;
  questions: StoredQuestion[];
  token: string;
  suggestedSeconds: number;
  draft: Draft | null;
  last: StoredResult | null;
  best: { correct: number; total: number; percent: number; at: number } | null;
  attempts: number;
};
export type GradeReply = {
  title: string;
  gradedAt: number;
  total: number;
  correct: number;
  percent: number;
  results: StoredResultItem[];
};

const PREFIX = "education-my-exams-v1:";
const EVENT = "education-my-exams";
const EMPTY: StoredExam[] = [];
const MAX_EXAMS = MY_EXAM_LIMITS.exams;
const MAX_QUESTIONS = MY_EXAM_LIMITS.questions;
const cached = { raw: null as string | null, key: "", value: EMPTY };

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const optionalText = (value: unknown, max: number) => value === undefined || text(value, max);
const int = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);

function validQuestion(value: unknown): value is StoredQuestion {
  if (!record(value)) return false;
  return /^q\d{1,2}$/.test(String(value.id)) && text(value.prompt, 900)
    && Array.isArray(value.options) && value.options.length >= 2 && value.options.length <= 5
    && value.options.every(option => text(option, 400)) && optionalText(value.topic, 100);
}
function validAnswers(value: unknown): value is Record<string, number> {
  if (!record(value)) return false;
  return Object.entries(value).every(([id, answer]) => /^q\d{1,2}$/.test(id) && int(answer, 0, 4));
}
function validDraft(value: unknown, questions: StoredQuestion[]): value is Draft {
  if (!record(value)) return false;
  const ids = new Set(questions.map(question => question.id));
  return (value.mode === "timed" || value.mode === "untimed") && finite(value.startedAt)
    && int(value.index, 0, Math.max(0, questions.length - 1)) && validAnswers(value.answers)
    && Object.keys(value.answers).every(id => ids.has(id))
    && Array.isArray(value.flagged) && value.flagged.length <= questions.length && value.flagged.every(id => typeof id === "string" && ids.has(id));
}
function validResultItem(value: unknown): value is StoredResultItem {
  if (!record(value)) return false;
  return text(value.id, 8) && (value.chosen === null || int(value.chosen, 0, 4)) && int(value.answer, 0, 4)
    && typeof value.correct === "boolean" && text(value.explanation, 1300) && optionalText(value.topic, 100);
}
function validResult(value: unknown): value is StoredResult {
  if (!record(value)) return false;
  return int(value.total, 1, MAX_QUESTIONS) && int(value.correct, 0, value.total) && int(value.percent, 0, 100)
    && finite(value.finishedAt) && typeof value.elapsedSeconds === "number" && value.elapsedSeconds >= 0
    && typeof value.timed === "boolean" && Array.isArray(value.results) && value.results.length === value.total
    && value.results.every(validResultItem);
}
function validExam(value: unknown): value is StoredExam {
  if (!record(value)) return false;
  const questions = value.questions;
  if (!Array.isArray(questions) || questions.length < 5 || questions.length > MAX_QUESTIONS || !questions.every(validQuestion)) return false;
  const ids = new Set(questions.map(question => question.id));
  if (ids.size !== questions.length) return false;
  return text(value.id, 80) && text(value.title, 200) && text(value.sourceName, 200) && text(value.sourceKind, 20)
    && (value.language === "mn" || value.language === "en") && finite(value.createdAt) && finite(value.updatedAt)
    && text(value.token, MY_EXAM_LIMITS.tokenChars) && value.token.length >= 40
    && int(value.suggestedSeconds, MY_EXAM_LIMITS.minSeconds, MY_EXAM_LIMITS.maxSeconds)
    && (value.draft === null || validDraft(value.draft, questions))
    && (value.last === null || validResult(value.last))
    && (value.best === null || (record(value.best) && int(value.best.correct, 0, questions.length) && int(value.best.total, 1, questions.length)
      && int(value.best.percent, 0, 100) && finite(value.best.at)))
    && int(value.attempts, 0, 999);
}
function read(userKey: string): StoredExam[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(PREFIX + userKey); } catch { /* Storage can be blocked; exams then last for this page only. */ }
  if (raw === cached.raw && userKey === cached.key) return cached.value;
  let value = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter(validExam).slice(0, MAX_EXAMS) : EMPTY;
  } catch { value = EMPTY; }
  Object.assign(cached, { raw, key: userKey, value });
  return value;
}
function subscribe(callback: () => void) {
  addEventListener("storage", callback);
  addEventListener(EVENT, callback);
  return () => { removeEventListener("storage", callback); removeEventListener(EVENT, callback); };
}
function write(userKey: string, exams: StoredExam[]) {
  try { localStorage.setItem(PREFIX + userKey, JSON.stringify(exams)); }
  catch {
    try { localStorage.setItem(PREFIX + userKey, JSON.stringify(exams.slice(0, Math.ceil(exams.length / 2)))); } catch { /* Nothing more to do. */ }
  }
  dispatchEvent(new Event(EVENT));
}
function replace(userKey: string, id: string, change: (exam: StoredExam) => StoredExam | null) {
  const exams = read(userKey);
  const exam = exams.find(item => item.id === id);
  if (!exam) return;
  const next = change(exam);
  if (!next) return;
  write(userKey, exams.map(item => item.id === id ? { ...next, updatedAt: Date.now() } : item).sort((a, b) => b.updatedAt - a.updatedAt));
}

export function useExams(userKey: string | null) {
  return useSyncExternalStore(subscribe, () => userKey ? read(userKey) : EMPTY, () => EMPTY);
}
export function saveExam(userKey: string, exam: StoredExam) {
  write(userKey, [exam, ...read(userKey).filter(item => item.id !== exam.id)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_EXAMS));
}
export function deleteExam(userKey: string, id: string) {
  write(userKey, read(userKey).filter(exam => exam.id !== id));
}
export function beginDraft(userKey: string, id: string, mode: Draft["mode"], now = Date.now()) {
  replace(userKey, id, exam => ({ ...exam, draft: { answers: {}, index: 0, flagged: [], startedAt: now, mode } }));
}
export function updateDraft(userKey: string, id: string, patch: Partial<Pick<Draft, "answers" | "index" | "flagged">>) {
  replace(userKey, id, exam => exam.draft ? { ...exam, draft: { ...exam.draft, ...patch } } : exam);
}
export function clearDraft(userKey: string, id: string) {
  replace(userKey, id, exam => ({ ...exam, draft: null }));
}
/** Persist the server's grade; the best score is kept across retakes. */
export function saveGrade(userKey: string, id: string, grade: GradeReply, meta: { elapsedSeconds: number; timed: boolean }) {
  replace(userKey, id, exam => {
    const last: StoredResult = {
      total: grade.total, correct: grade.correct, percent: grade.percent, finishedAt: grade.gradedAt,
      elapsedSeconds: Math.max(0, Math.round(meta.elapsedSeconds)), timed: meta.timed, results: grade.results,
    };
    const best = !exam.best || grade.percent >= exam.best.percent
      ? { correct: grade.correct, total: grade.total, percent: grade.percent, at: grade.gradedAt }
      : exam.best;
    return { ...exam, last, best, attempts: exam.attempts + 1, draft: null };
  });
}
export function newExamId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
}
