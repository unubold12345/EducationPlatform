// The exams a student can set as a dashboard goal, each with the levels it has. Pure and client-safe.
// `onSite` marks the levels this site has mocks for; the others still get the exam information and the to-do list.
import { addDays, dayNumber } from "./dates.ts";

export type GoalExam = "sat" | "ielts" | "toefl" | "jlpt" | "hsk" | "topik" | "eesh";
export type GoalLevel = { id: string; label: string; onSite: boolean; slugPrefix: string };
export type GoalExamMeta = {
  id: GoalExam; label: string; levelLabel: string; tone: "blue" | "violet" | "green" | "amber";
  levels: GoalLevel[];
  /** The exam's mock library on this site. */
  hub: string;
  /** Its Workshop tab, when it has one. */
  workshop: string | null;
};

export const GOAL_EXAMS: GoalExamMeta[] = [
  { id: "sat", label: "SAT", levelLabel: "Хувилбар", tone: "blue", hub: "/exams/sat", workshop: null,
    levels: [{ id: "digital", label: "Digital SAT", onSite: true, slugPrefix: "sat-" }] },
  { id: "ielts", label: "IELTS", levelLabel: "Төрөл", tone: "violet", hub: "/exams/ielts", workshop: "/workspace/workshop?exam=ielts",
    levels: [
      { id: "academic", label: "Academic", onSite: true, slugPrefix: "ielts-" },
      { id: "general", label: "General Training", onSite: false, slugPrefix: "ielts-" },
    ] },
  { id: "toefl", label: "TOEFL", levelLabel: "Хувилбар", tone: "violet", hub: "/exams/toefl", workshop: "/workspace/workshop?exam=toefl",
    levels: [{ id: "ibt", label: "TOEFL iBT (2026)", onSite: true, slugPrefix: "toefl-" }] },
  { id: "jlpt", label: "JLPT", levelLabel: "Түвшин", tone: "amber", hub: "/exams/jlpt", workshop: "/workspace/workshop?exam=jlpt",
    levels: [
      { id: "n5", label: "N5", onSite: true, slugPrefix: "jlpt-n5-" },
      { id: "n4", label: "N4", onSite: true, slugPrefix: "jlpt-n4-" },
      { id: "n3", label: "N3", onSite: false, slugPrefix: "jlpt-n3-" },
      { id: "n2", label: "N2", onSite: false, slugPrefix: "jlpt-n2-" },
      { id: "n1", label: "N1", onSite: false, slugPrefix: "jlpt-n1-" },
    ] },
  { id: "hsk", label: "HSK", levelLabel: "Түвшин", tone: "amber", hub: "/exams/hsk", workshop: "/workspace/workshop?exam=hsk",
    levels: [1, 2, 3, 4, 5, 6].map(n => ({ id: "hsk" + n, label: "HSK " + n, onSite: n <= 2, slugPrefix: `hsk${n}-` })) },
  { id: "topik", label: "TOPIK", levelLabel: "Шалгалт", tone: "amber", hub: "/exams/topik", workshop: "/workspace/workshop?exam=topik",
    levels: [
      { id: "topik1", label: "TOPIK Ⅰ (1–2-р түвшин)", onSite: true, slugPrefix: "topik1-" },
      { id: "topik2", label: "TOPIK Ⅱ (3–6-р түвшин)", onSite: true, slugPrefix: "topik2-" },
    ] },
  { id: "eesh", label: "ЭЕШ", levelLabel: "Хичээл", tone: "green", hub: "/exams/eesh", workshop: "/workspace/workshop?exam=eesh",
    levels: [
      { id: "math", label: "Математик", onSite: true, slugPrefix: "eesh-math-" },
      { id: "physics", label: "Физик", onSite: true, slugPrefix: "eesh-physics-" },
      { id: "chemistry", label: "Хими", onSite: true, slugPrefix: "eesh-chemistry-" },
      { id: "biology", label: "Биологи", onSite: true, slugPrefix: "eesh-biology-" },
      { id: "english", label: "Англи хэл", onSite: true, slugPrefix: "eesh-english-" },
    ] },
];

export const GOAL_LIMITS = { max: 4, bodyBytes: 512, aheadDays: 730 } as const;

export function findGoalExam(exam: unknown): GoalExamMeta | null {
  return GOAL_EXAMS.find(item => item.id === exam) ?? null;
}
export function findGoalLevel(exam: unknown, level: unknown): GoalLevel | null {
  return findGoalExam(exam)?.levels.find(item => item.id === level) ?? null;
}
/** "JLPT N4", "ЭЕШ · Математик", "IELTS Academic". */
export function goalTitle(exam: string, level: string) {
  const meta = findGoalExam(exam), item = findGoalLevel(exam, level);
  if (!meta || !item) return exam;
  if (meta.id === "sat" || meta.id === "toefl") return item.label;
  if (meta.id === "eesh") return "ЭЕШ · " + item.label;
  if (meta.id === "topik") return item.label.replace(/ \(.*\)$/, "");
  if (meta.id === "hsk") return item.label;
  return meta.label + " " + item.label;
}
/** The mock library of a level: ЭЕШ opens on the subject. */
export function goalHub(exam: string, level: string) {
  const meta = findGoalExam(exam);
  if (!meta) return "/exams";
  return meta.id === "eesh" ? `${meta.hub}?subject=${encodeURIComponent(level)}` : meta.hub;
}

export type GoalInput = { exam: GoalExam; level: string; examDate: string | null };
export type Goal = GoalInput & { id: string };

/** A goal exactly as the dashboard sends it: a known exam, one of its levels and a booked date (today to two years on) or null. */
export function readGoal(body: unknown, today: string): { ok: true; goal: GoalInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
  const keys = Object.keys(body);
  if (keys.length !== 3 || !["exam", "level", "examDate"].every(key => keys.includes(key))) return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
  const { exam, level, examDate } = body as Record<string, unknown>;
  const meta = findGoalExam(exam);
  if (!meta) return { ok: false, error: "Шалгалтаа сонгоно уу." };
  if (!findGoalLevel(exam, level)) return { ok: false, error: `${meta.levelLabel} сонгоно уу.` };
  if (examDate !== null) {
    if (dayNumber(examDate) === null) return { ok: false, error: "Огноо буруу байна." };
    if ((examDate as string) < today) return { ok: false, error: "Өнгөрсөн огноо сонгох боломжгүй." };
    if ((examDate as string) > addDays(today, GOAL_LIMITS.aheadDays)) return { ok: false, error: "Огноо 2 жилийн дотор байх ёстой." };
  }
  return { ok: true, goal: { exam: meta.id, level: level as string, examDate: examDate as string | null } };
}

/** Which goal the dashboard opens on: the nearest booked date still ahead, otherwise the first goal saved. */
export function mainGoal<T extends { examDate: string | null }>(goals: readonly T[], today: string): T | null {
  const ahead = goals.filter(goal => goal.examDate && goal.examDate >= today).sort((a, b) => a.examDate!.localeCompare(b.examDate!));
  return ahead[0] ?? goals[0] ?? null;
}
