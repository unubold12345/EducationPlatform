"use client";
import { MY_EXAM_LIMITS } from "./contracts";

// Until 2026-11-12 generated exams, their open sittings and results lived only in this browser, with the
// answer key sealed in a token. They now live on the account. This file only reads what a browser still
// holds, so the page can move each exam to the account once, and forgets an exam after it has moved.
const PREFIX = "education-my-exams-v1:";

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** One browser exam, as the body the import route accepts. The server believes only the token. */
export type LegacyExam = {
  id: string;
  body: { token: string; draft: unknown; last: { answers: Record<string, number>; finishedAt: unknown; elapsedSeconds: unknown; timed: unknown } | null; attempts: number };
};

function stored(userKey: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PREFIX + userKey) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

/** The last sitting's chosen answers; the server grades them again from the sealed key. */
function lastSitting(value: unknown): LegacyExam["body"]["last"] {
  if (!record(value) || !Array.isArray(value.results)) return null;
  const answers: Record<string, number> = {};
  for (const item of value.results) {
    if (record(item) && typeof item.id === "string" && typeof item.chosen === "number") answers[item.id] = item.chosen;
  }
  return { answers, finishedAt: value.finishedAt, elapsedSeconds: value.elapsedSeconds, timed: value.timed };
}

/** The exams this browser still keeps for this account. Empty once they have all moved. */
export function legacyExams(userKey: string): LegacyExam[] {
  const exams: LegacyExam[] = [];
  for (const item of stored(userKey)) {
    if (!record(item) || typeof item.id !== "string" || typeof item.token !== "string") continue;
    if (item.token.length < 40 || item.token.length > MY_EXAM_LIMITS.tokenChars) continue;
    const attempts = typeof item.attempts === "number" && Number.isInteger(item.attempts) && item.attempts >= 0 && item.attempts <= 999 ? item.attempts : 0;
    exams.push({ id: item.id, body: { token: item.token, draft: record(item.draft) ? item.draft : null, last: lastSitting(item.last), attempts } });
  }
  return exams;
}

/** Drop one exam from this browser after the account has it. */
export function forgetLegacyExam(userKey: string, id: string) {
  try {
    const rest = stored(userKey).filter(item => !record(item) || item.id !== id);
    if (rest.length) localStorage.setItem(PREFIX + userKey, JSON.stringify(rest));
    else localStorage.removeItem(PREFIX + userKey);
  } catch { /* Storage can be blocked; the server recognises an exam it has already moved. */ }
}
