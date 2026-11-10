"use client";
import { useSyncExternalStore } from "react";
import { READING_LIMITS, type PublicGroup, type ReadingAnswers, type ReadingGrade, type ReadingLanguage } from "./contracts";

// Reading Lab progress lives only in this browser, per account (guests share one "guest" slot): answers, the last
// check and the best score for each sample, plus the practices the student generated. A generated practice keeps
// its answer key sealed in `token` until the server marks it. Nothing here is sent to the account.
export type PracticeState = {
  answers: ReadingAnswers;
  result: ReadingGrade | null;
  /** Best number of correct answers over every check. */
  best: number | null;
  attempts: number;
  /** When the optional 20-minute timer was started; null when it is off. */
  timerStartedAt: number | null;
  /** Seconds the timer showed when the answers were last checked. */
  finishedSeconds: number | null;
};
export type OwnPractice = {
  id: string;
  title: string;
  paragraphs: string[];
  groups: PublicGroup[];
  token: string;
  language: ReadingLanguage;
  sourceName: string;
  sourceKind: string;
  createdAt: number;
  updatedAt: number;
  state: PracticeState;
};
export type TextSize = 0 | 1 | 2;
export type LabData = { samples: Record<string, PracticeState>; own: OwnPractice[]; textSize: TextSize };

const PREFIX = "education-reading-lab-v1:";
const EVENT = "education-reading-lab";
const EMPTY: LabData = { samples: {}, own: [], textSize: 1 };
export const blankState = (): PracticeState => ({ answers: {}, result: null, best: null, attempts: 0, timerStartedAt: null, finishedSeconds: null });
const cached = { raw: null as string | null, key: "", value: EMPTY };

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const optional = (value: unknown, max: number) => value === undefined || text(value, max);
const int = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const questionId = (id: string) => /^q\d{1,2}$/.test(id);

function readAnswers(value: unknown): ReadingAnswers {
  const answers: ReadingAnswers = {};
  if (!record(value)) return answers;
  for (const [id, answer] of Object.entries(value).slice(0, READING_LIMITS.questions.max)) {
    if (!questionId(id)) continue;
    if (int(answer, 0, 19) || (typeof answer === "string" && answer.length <= READING_LIMITS.answerChars)) answers[id] = answer;
  }
  return answers;
}
function readResult(value: unknown): ReadingGrade | null {
  if (!record(value) || !Array.isArray(value.results) || !int(value.total, 1, READING_LIMITS.questions.max) || value.results.length !== value.total) return null;
  if (!int(value.correct, 0, value.total) || !int(value.percent, 0, 100)) return null;
  const ok = value.results.every(item => record(item) && typeof item.id === "string" && questionId(item.id) && typeof item.correct === "boolean"
    && text(item.answer, 100) && text(item.explanation, 1300) && optional(item.evidence, 600));
  return ok ? value as ReadingGrade : null;
}
export function readState(value: unknown): PracticeState {
  if (!record(value)) return blankState();
  return {
    answers: readAnswers(value.answers),
    result: readResult(value.result),
    best: int(value.best, 0, READING_LIMITS.questions.max) ? value.best : null,
    attempts: int(value.attempts, 0, 9999) ? value.attempts : 0,
    timerStartedAt: finite(value.timerStartedAt) ? value.timerStartedAt : null,
    finishedSeconds: int(value.finishedSeconds, 0, 86_400) ? value.finishedSeconds : null,
  };
}
/** The public part of a practice as the server sent it: groups of questions without answers. */
export function validPublicGroups(value: unknown): value is PublicGroup[] {
  if (!Array.isArray(value) || !value.length || value.length > 6) return false;
  let count = 0;
  const ok = value.every(group => record(group) && text(group.instruction, 400) && optional(group.limit, 200) && optional(group.heading, 100)
    && (group.labels === undefined || ["roman", "letter", "paragraph"].includes(group.labels as string))
    && (group.options === undefined || (Array.isArray(group.options) && group.options.length <= 12 && group.options.every(option => text(option, 200))))
    && Array.isArray(group.questions) && group.questions.length > 0 && group.questions.every(question => {
      count++;
      if (!record(question) || typeof question.id !== "string" || !questionId(question.id) || !text(question.prompt, 600)) return false;
      if (question.kind === "choice") return Array.isArray(question.options) && question.options.length >= 2 && question.options.length <= 5 && question.options.every(option => text(option, 400));
      return question.kind === "tfng" || question.kind === "gap" || question.kind === "match";
    }));
  return ok && count <= READING_LIMITS.questions.max;
}
function readOwn(value: unknown): OwnPractice | null {
  if (!record(value)) return null;
  const paragraphs = value.paragraphs;
  if (!text(value.id, 80) || !text(value.title, 200) || !Array.isArray(paragraphs) || paragraphs.length < 1 || paragraphs.length > READING_LIMITS.paragraphs.max
    || !paragraphs.every(paragraph => text(paragraph, READING_LIMITS.paragraph + 10)) || !validPublicGroups(value.groups)
    || !text(value.token, READING_LIMITS.tokenChars) || value.token.length < 40 || (value.language !== "mn" && value.language !== "en")
    || !text(value.sourceName, 200) || !text(value.sourceKind, 20) || !finite(value.createdAt) || !finite(value.updatedAt)) return null;
  return {
    id: value.id, title: value.title, paragraphs: paragraphs as string[], groups: value.groups, token: value.token, language: value.language,
    sourceName: value.sourceName, sourceKind: value.sourceKind, createdAt: value.createdAt, updatedAt: value.updatedAt, state: readState(value.state),
  };
}

function read(userKey: string): LabData {
  let raw: string | null = null;
  try { raw = localStorage.getItem(PREFIX + userKey); } catch { /* Storage can be blocked; progress then lasts for this page only. */ }
  if (raw === cached.raw && userKey === cached.key) return cached.value;
  let value = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (record(parsed)) {
      const samples: LabData["samples"] = {};
      if (record(parsed.samples)) for (const [id, state] of Object.entries(parsed.samples).slice(0, 20)) if (/^[a-z0-9-]{1,40}$/.test(id)) samples[id] = readState(state);
      const own = Array.isArray(parsed.own) ? parsed.own.map(readOwn).filter((item): item is OwnPractice => item !== null).slice(0, READING_LIMITS.practices) : [];
      value = { samples, own, textSize: int(parsed.textSize, 0, 2) ? parsed.textSize as TextSize : 1 };
    }
  } catch { value = EMPTY; }
  Object.assign(cached, { raw, key: userKey, value });
  return value;
}
function subscribe(callback: () => void) {
  addEventListener("storage", callback);
  addEventListener(EVENT, callback);
  return () => { removeEventListener("storage", callback); removeEventListener(EVENT, callback); };
}
function write(userKey: string, lab: LabData) {
  try { localStorage.setItem(PREFIX + userKey, JSON.stringify(lab)); }
  catch {
    // Full storage: keep the newer half of the generated practices rather than lose the change.
    try { localStorage.setItem(PREFIX + userKey, JSON.stringify({ ...lab, own: lab.own.slice(0, Math.ceil(lab.own.length / 2)) })); } catch { /* Nothing more to do. */ }
  }
  dispatchEvent(new Event(EVENT));
}

export const labKey = (userKey: string | null) => userKey ?? "guest";
export function useReadingLab(userKey: string | null) {
  const key = labKey(userKey);
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}
export function updateLab(userKey: string | null, change: (lab: LabData) => LabData) {
  const key = labKey(userKey);
  write(key, change(read(key)));
}
export function setSampleState(userKey: string | null, id: string, state: PracticeState) {
  updateLab(userKey, lab => ({ ...lab, samples: { ...lab.samples, [id]: state } }));
}
export function setOwnState(userKey: string | null, id: string, state: PracticeState) {
  updateLab(userKey, lab => ({ ...lab, own: lab.own.map(item => item.id === id ? { ...item, state, updatedAt: Date.now() } : item) }));
}
export function saveOwn(userKey: string | null, practice: OwnPractice) {
  updateLab(userKey, lab => ({ ...lab, own: [practice, ...lab.own.filter(item => item.id !== practice.id)].slice(0, READING_LIMITS.practices) }));
}
export function deleteOwn(userKey: string | null, id: string) {
  updateLab(userKey, lab => ({ ...lab, own: lab.own.filter(item => item.id !== id) }));
}
export function newPracticeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
}
