// Reading Lab progress: the state of one practice or sample, the requests that change it and the pure rules that
// apply them. Since 2026-11-12 a signed-in student's practices and sample progress live on the account; the server
// validates every request with these readers and stores what `applyProgress` returns. A guest's sample progress
// still stays in the browser and follows the same rules there. No "server-only" and no "use client", so both
// sides can import it and the rules can be unit tested.
import {
  READING_LIMITS, allQuestions, choiceCount, gradeReading, inPassage, isReadingLanguage, passageWords, validAnswerFor,
  type FullGroup, type FullQuestion, type PublicGroup, type ReadingAnswers, type ReadingGrade, type ReadingLanguage,
} from "./contracts.ts";

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

/** A stored practice as the browser may see it: the passage, answer-free questions and the student's progress. */
export type SavedPractice = {
  id: string;
  title: string;
  paragraphs: string[];
  groups: PublicGroup[];
  language: ReadingLanguage;
  sourceName: string;
  sourceKind: string;
  createdAt: number;
  updatedAt: number;
  state: PracticeState;
};

export const PRACTICES_FULL = `Бүртгэлд хамгийн ихдээ ${READING_LIMITS.practices} дасгал хадгална. Шинэ дасгал үүсгэхийн өмнө нэгийг нь устгана уу.`;
const ATTEMPTS_MAX = 9999;
const SECONDS_MAX = 86_400;

export const blankState = (): PracticeState => ({ answers: {}, result: null, best: null, attempts: 0, timerStartedAt: null, finishedSeconds: null });

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const optional = (value: unknown, max: number) => value === undefined || text(value, max);
const int = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const moment = (value: unknown): value is number => finite(value) && value > 0;
const questionId = (id: string) => /^q\d{1,2}$/.test(id);
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const answerValue = (value: unknown) => int(value, 0, 19) || (typeof value === "string" && value.length <= READING_LIMITS.answerChars);

/** A practice row id (a cuid) or a sample id, before it is looked up for this student. */
export const isPracticeId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9]{10,64}$/i.test(value);
export const isSampleId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9-]{1,40}$/.test(value);

/** Stored answers, dropping anything out of bounds. */
function readAnswers(value: unknown): ReadingAnswers {
  const answers: ReadingAnswers = {};
  if (!record(value)) return answers;
  for (const [id, answer] of Object.entries(value).slice(0, READING_LIMITS.questions.max)) {
    if (questionId(id) && answerValue(answer)) answers[id] = answer as number | string;
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
/** A stored state with the same bounds the browser store has always used; anything unusable reads as blank. */
export function readState(value: unknown): PracticeState {
  if (!record(value)) return blankState();
  return {
    answers: readAnswers(value.answers),
    result: readResult(value.result),
    best: int(value.best, 0, READING_LIMITS.questions.max) ? value.best : null,
    attempts: int(value.attempts, 0, ATTEMPTS_MAX) ? value.attempts : 0,
    timerStartedAt: finite(value.timerStartedAt) ? value.timerStartedAt : null,
    finishedSeconds: int(value.finishedSeconds, 0, SECONDS_MAX) ? value.finishedSeconds : null,
  };
}
/** Sample states keyed by sample id, as the account returns them. */
export function readSampleStates(value: unknown): Record<string, PracticeState> {
  const states: Record<string, PracticeState> = {};
  if (record(value)) for (const [id, state] of Object.entries(value).slice(0, 20)) if (isSampleId(id)) states[id] = readState(state);
  return states;
}

/** The public part of a practice as the server sends it: groups of questions without answers. */
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
/** A stored passage: 1–12 non-empty paragraphs. */
export function readParagraphs(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > READING_LIMITS.paragraphs.max) return null;
  return value.every(paragraph => text(paragraph, READING_LIMITS.paragraph + 10)) ? value as string[] : null;
}
/** A practice as the server sent it; anything incomplete is refused rather than shown broken. */
export function readSavedPractice(value: unknown): SavedPractice | null {
  if (!record(value) || !isPracticeId(value.id) || !text(value.title, 200) || !isReadingLanguage(value.language)) return null;
  if (!text(value.sourceName, 200) || !text(value.sourceKind, 20) || !finite(value.createdAt) || !finite(value.updatedAt)) return null;
  const paragraphs = readParagraphs(value.paragraphs);
  if (!paragraphs || !validPublicGroups(value.groups)) return null;
  return {
    id: value.id, title: value.title, paragraphs, groups: value.groups, language: value.language, sourceName: value.sourceName,
    sourceKind: value.sourceKind, createdAt: value.createdAt, updatedAt: value.updatedAt, state: readState(value.state),
  };
}

/** Whether every answer names a question of this practice and has a shape that question accepts. */
export function answersFit(groups: readonly FullGroup[], paragraphs: number, answers: ReadingAnswers) {
  const questions = new Map(groups.flatMap(group => group.questions.map(question => [question.id, { group, question }] as const)));
  return Object.entries(answers).every(([id, value]) => {
    const found = questions.get(id);
    if (!found) return false;
    return validAnswerFor(found.question, value, choiceCount(found.group, found.question as { kind: FullQuestion["kind"]; options?: string[] }, paragraphs));
  });
}

// ---------- Requests ----------

/**
 * One change to a practice's progress. Each names the number of checks the browser has seen (`attempts`), so a
 * tab that missed a check or a reset made elsewhere is refused instead of overwriting newer progress.
 * - save: the answers typed so far and the timer, while the answers are not checked.
 * - check: mark the answers. The server marks them from the key it keeps; the browser never sends a score.
 * - retry: clear the answers of a checked practice for another attempt (the best score stays).
 */
export type ProgressRequest =
  | { action: "save"; attempts: number; answers: ReadingAnswers; timerStartedAt: number | null }
  | { action: "check"; attempts: number; answers: ReadingAnswers; finishedSeconds: number | null }
  | { action: "retry"; attempts: number };

/** Answers in a request: refused, not trimmed, when anything is out of bounds. */
function requestAnswers(value: unknown): ReadingAnswers | null {
  if (!record(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > READING_LIMITS.questions.max || !entries.every(([id, answer]) => questionId(id) && answerValue(answer))) return null;
  return Object.fromEntries(entries) as ReadingAnswers;
}
const seconds = (value: unknown) => value === null ? null : int(value, 0, SECONDS_MAX) ? value : undefined;

export function readProgressRequest(value: unknown): ProgressRequest | null {
  if (!record(value) || !int(value.attempts, 0, ATTEMPTS_MAX)) return null;
  const attempts = value.attempts;
  if (value.action === "retry") return onlyKeys(value, ["action", "attempts"]) ? { action: "retry", attempts } : null;
  const answers = requestAnswers(value.answers);
  if (!answers) return null;
  if (value.action === "save") {
    if (!onlyKeys(value, ["action", "attempts", "answers", "timerStartedAt"]) || !(value.timerStartedAt === null || moment(value.timerStartedAt))) return null;
    return { action: "save", attempts, answers, timerStartedAt: value.timerStartedAt };
  }
  if (value.action === "check") {
    const finished = seconds(value.finishedSeconds);
    if (!onlyKeys(value, ["action", "attempts", "answers", "finishedSeconds"]) || finished === undefined) return null;
    return { action: "check", attempts, answers, finishedSeconds: finished };
  }
  return null;
}

/** Marking a generated practice: its row id, never its key; the key is read from the account. */
export function readGradeRequest(value: unknown): { id: string; request: Extract<ProgressRequest, { action: "check" }> } | null {
  if (!record(value) || !onlyKeys(value, ["id", "attempts", "answers", "finishedSeconds"]) || !isPracticeId(value.id)) return null;
  const request = readProgressRequest({ action: "check", attempts: value.attempts, answers: value.answers, finishedSeconds: value.finishedSeconds });
  return request?.action === "check" ? { id: value.id, request } : null;
}

const sameAnswers = (a: ReadingAnswers, b: ReadingAnswers) => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]);
};

export type ProgressOutcome = { state: PracticeState; changed: boolean } | { stale: true };

/**
 * Apply one request to the stored progress. Marking always uses `groups`, the key the caller holds (the account's
 * copy for a generated practice, the built-in key for a sample). `stale` means the request was made from an
 * out-of-date view and nothing changes.
 */
export function applyProgress(stored: PracticeState, input: ProgressRequest, groups: FullGroup[]): ProgressOutcome {
  if (input.action === "save") {
    if (stored.result !== null || stored.attempts !== input.attempts) return { stale: true };
    const changed = !sameAnswers(stored.answers, input.answers) || stored.timerStartedAt !== input.timerStartedAt;
    return { state: { ...stored, answers: input.answers, timerStartedAt: input.timerStartedAt }, changed };
  }
  if (input.action === "check") {
    if (stored.result === null && stored.attempts === input.attempts) {
      const result = gradeReading(groups, input.answers);
      return {
        state: {
          answers: input.answers, result, best: Math.max(stored.best ?? 0, result.correct), attempts: Math.min(stored.attempts + 1, ATTEMPTS_MAX),
          timerStartedAt: null, finishedSeconds: input.finishedSeconds,
        },
        changed: true,
      };
    }
    // The same check sent again after its reply was lost: it already counted once.
    if (stored.result !== null && stored.attempts === input.attempts + 1 && sameAnswers(stored.answers, input.answers)) return { state: stored, changed: false };
    return { stale: true };
  }
  if (stored.attempts !== input.attempts) return { stale: true };
  // Already cleared (by another tab, or a repeated request): keep whatever was typed since.
  if (stored.result === null) return { state: stored, changed: false };
  return { state: { ...stored, answers: {}, result: null, timerStartedAt: null, finishedSeconds: null }, changed: true };
}

// ---------- Moving browser data to the account ----------

/** A browser state as the import route takes it: the answers and whether they were checked, never a score. */
export type LegacyState = { answers: ReadingAnswers; checked: boolean; attempts: number; timerStartedAt: number | null; finishedSeconds: number | null };
export function legacyState(state: PracticeState): LegacyState {
  return { answers: state.answers, checked: state.result !== null, attempts: state.attempts, timerStartedAt: state.timerStartedAt, finishedSeconds: state.finishedSeconds };
}

/**
 * The progress a browser kept, rebuilt on the server: answers that do not fit the practice are dropped, and
 * checked answers are marked again from `groups`. A score the browser claims, including its best, is ignored.
 */
export function importedState(value: unknown, groups: FullGroup[], paragraphs: number): PracticeState {
  if (!record(value)) return blankState();
  const answers = Object.fromEntries(Object.entries(readAnswers(value.answers)).filter(([id, answer]) => answersFit(groups, paragraphs, { [id]: answer })));
  const attempts = int(value.attempts, 0, ATTEMPTS_MAX) ? value.attempts : 0;
  if (value.checked === true) {
    const result = gradeReading(groups, answers);
    return { answers, result, best: result.correct, attempts: Math.max(1, attempts), timerStartedAt: null, finishedSeconds: seconds(value.finishedSeconds) ?? null };
  }
  return { answers, result: null, best: null, attempts, timerStartedAt: moment(value.timerStartedAt) ? value.timerStartedAt : null, finishedSeconds: null };
}
export const isBlank = (state: PracticeState) => !Object.keys(state.answers).length && state.result === null && state.attempts === 0 && state.timerStartedAt === null;

/**
 * Moving a browser practice: the sealed `token` is the only thing believed; the passage text comes from the
 * browser and is checked against it. Sample states are keyed by sample id.
 */
export type ImportRequest =
  | { kind: "practice"; token: string; paragraphs: unknown; state: unknown }
  | { kind: "samples"; samples: Record<string, unknown> };
export function readImportRequest(value: unknown): ImportRequest | null {
  if (!record(value)) return null;
  if (value.kind === "practice") {
    if (!onlyKeys(value, ["kind", "token", "paragraphs", "state"]) || typeof value.token !== "string") return null;
    if (value.token.length < 40 || value.token.length > READING_LIMITS.tokenChars) return null;
    return { kind: "practice", token: value.token, paragraphs: value.paragraphs, state: value.state ?? null };
  }
  if (value.kind === "samples") {
    if (!onlyKeys(value, ["kind", "samples"]) || !record(value.samples)) return null;
    const ids = Object.keys(value.samples);
    if (ids.length > 20 || !ids.every(isSampleId)) return null;
    return { kind: "samples", samples: value.samples };
  }
  return null;
}

/**
 * The passage a browser kept for a sealed practice. It is believed only when it has the sealed paragraph count,
 * the generator's bounds, and every evidence quote and gap answer of the sealed key, as the generator made sure.
 */
export function importedParagraphs(value: unknown, count: number, groups: FullGroup[]): string[] | null {
  if (!Array.isArray(value) || count < READING_LIMITS.paragraphs.min || value.length !== count) return null;
  if (!value.every(paragraph => typeof paragraph === "string" && paragraph.trim().length > 0 && paragraph.length <= READING_LIMITS.paragraph)) return null;
  const paragraphs = value as string[];
  const words = passageWords(paragraphs);
  if (words < READING_LIMITS.passageWords.min || words > READING_LIMITS.passageWords.max) return null;
  const questions = allQuestions(groups);
  const quotes = questions.flatMap(question => question.evidence ? [question.evidence] : []);
  if (!quotes.every(quote => paragraphs.some(paragraph => paragraph.includes(quote)))) return null;
  if (!questions.every(question => question.kind !== "gap" || inPassage(paragraphs, question.answers[0]))) return null;
  return paragraphs;
}
