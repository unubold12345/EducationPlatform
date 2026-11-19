// The dashboard's day-by-day to-do list: limits, request readers and quick-add ideas per exam. Pure and client-safe.
import { addDays, dayNumber } from "./dates.ts";
import type { GoalExam } from "./exams.ts";

export const TASK_LIMITS = {
  title: 120,
  perDay: 20,
  /** Tasks can be written from this many days back to this many days ahead. */
  pastDays: 30, aheadDays: 365,
  /** The carousel loads this window around today. */
  windowBefore: 7, windowAfter: 21,
  bodyBytes: 1024,
} as const;

export type Task = { id: string; day: string; title: string; done: boolean };

/** One line of plain text: control, invisible and direction characters go, runs of spaces become one. */
export function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.normalize("NFC").replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, " ").replace(/\s+/g, " ").trim();
  if (!text || text.length > TASK_LIMITS.title) return null;
  return text;
}

export function dayAllowed(day: unknown, today: string): day is string {
  if (dayNumber(day) === null) return false;
  return (day as string) >= addDays(today, -TASK_LIMITS.pastDays) && (day as string) <= addDays(today, TASK_LIMITS.aheadDays);
}

const exactKeys = (body: unknown, keys: string[], optional = false) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const present = Object.keys(body);
  return present.length > 0 && present.every(key => keys.includes(key)) && (optional || keys.every(key => present.includes(key)));
};

/** `{ day, title }` for a new task. */
export function readNewTask(body: unknown, today: string): { ok: true; day: string; title: string } | { ok: false; error: string } {
  if (!exactKeys(body, ["day", "title"])) return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
  const { day, title } = body as Record<string, unknown>;
  if (!dayAllowed(day, today)) return { ok: false, error: `Өдөр нь өнөөдрөөс ${TASK_LIMITS.pastDays} хоногийн өмнөөс 1 жилийн дотор байна.` };
  const text = cleanTitle(title);
  if (!text) return { ok: false, error: `Ажлаа 1–${TASK_LIMITS.title} тэмдэгтээр бичнэ үү.` };
  return { ok: true, day, title: text };
}

/** `{ done?, title?, day? }` for a change to one task; at least one field. */
export function readTaskPatch(body: unknown, today: string): { ok: true; patch: { done?: boolean; title?: string; day?: string } } | { ok: false; error: string } {
  if (!exactKeys(body, ["done", "title", "day"], true)) return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
  const value = body as Record<string, unknown>;
  const patch: { done?: boolean; title?: string; day?: string } = {};
  if ("done" in value) {
    if (typeof value.done !== "boolean") return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
    patch.done = value.done;
  }
  if ("title" in value) {
    const text = cleanTitle(value.title);
    if (!text) return { ok: false, error: `Ажлаа 1–${TASK_LIMITS.title} тэмдэгтээр бичнэ үү.` };
    patch.title = text;
  }
  if ("day" in value) {
    if (!dayAllowed(value.day, today)) return { ok: false, error: "Өдөр буруу байна." };
    patch.day = value.day;
  }
  return { ok: true, patch };
}

/** Quick-add ideas under the input, by the goal's exam (plain text; the student edits or ticks them like any task). */
const IDEAS: Record<GoalExam | "none", string[]> = {
  sat: ["Reading & Writing-ийн 1 модуль цаггүй ажиллах", "Math: Desmos-оор 10 бодлого", "Алдсан асуултуудаа Review-д задлах", "Бүтэн SAT mock цагтай өгөх"],
  ielts: ["Listening-ийн 1 хэсэг сонсох", "Writing Task 2 эссэ бичих (40 мин)", "Speaking Part 2: 2 минут ярьж бичлэг хийх", "20 шинэ үг давтах"],
  toefl: ["Build a Sentence 10 даалгавар", "Academic Discussion пост бичих", "Listen and Repeat дасгал", "Reading-ийн 1 модуль цагтай"],
  jlpt: ["Ханз 10-ыг давтах", "Үгийн багцаас 30 үг давтах", "聴解-ийн 1 хэсэг сонсох", "文法・読解-ыг цаггүй ажиллах"],
  hsk: ["Үгийн багцаас 20 үг (ая, пиньинь) давтах", "听力-ийн 1 хэсэг сонсох", "Ханз бичих 10 дасгал", "Mock-ийн 阅读 хэсгийг ажиллах"],
  topik: ["Hangul / үгийн багцаас 20 үг давтах", "듣기-ийн 10 асуулт", "읽기-ийн 1 текст унших", "쓰기 53: график тайлбар бичих"],
  eesh: ["10 асуулттай сэдвийн дасгал (Workshop)", "Сул сэдвээ давтах", "Өмнөх оны mock цагтай өгөх", "Алдсан бодлогуудаа дахин бодох"],
  none: ["Бүтэн mock цагтай өгөх", "Алдсан асуултуудаа задлах", "20 шинэ үг давтах", "AI туслахаас 1 сэдэв асуух"],
};
export function taskIdeas(exam: GoalExam | null): string[] {
  return IDEAS[exam ?? "none"];
}
