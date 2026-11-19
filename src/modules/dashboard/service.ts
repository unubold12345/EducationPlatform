import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";
import { makeReport } from "@/modules/exams/engine";
import { allExamSlugs } from "@/modules/exams/definitions";
import type { ExamState } from "@/modules/exams/types";
import { AI_ACTIONS, creditPeriod, isAiAction } from "@/modules/credits/pricing";
import { creditSummary } from "@/modules/credits/service";
import { addDays, DAY_MS, dayNumber, ubDay } from "./dates";
import { GOAL_LIMITS, findGoalLevel, readGoal, type Goal, type GoalExam } from "./exams";
import { TASK_LIMITS, readNewTask, readTaskPatch, type Task } from "./tasks";
import { activityGrid, bucketActivity, gridStart, type ActivityKind } from "./activity";
import type { CreditEntry, CreditOverview, GoalProgress } from "./types";

/** Today in Ulaanbaatar, read from the server clock. */
export const today = () => ubDay(Date.now());
/** The UTC moment a Ulaanbaatar calendar day starts. */
const dayStart = (day: string) => new Date((dayNumber(day) ?? 0) * DAY_MS - 8 * 3600e3);
const duplicate = (error: unknown) => Boolean(error) && typeof error === "object" && (error as { code?: unknown }).code === "P2002";

// ---------------------------------------------------------------- Goals

const goalSelect = { id: true, exam: true, level: true, examDate: true } as const;
const asGoal = (row: { id: string; exam: string; level: string; examDate: string | null }): Goal => ({ ...row, exam: row.exam as GoalExam });

/** The student's exam goals, oldest first, skipping any row whose exam or level is no longer offered. */
export async function listGoals(userId: string): Promise<Goal[]> {
  const rows = await getDb().examGoal.findMany({ where: { userId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: GOAL_LIMITS.max, select: goalSelect });
  return rows.filter(row => findGoalLevel(row.exam, row.level)).map(asGoal);
}

export async function createGoal(userId: string, body: unknown): Promise<Goal> {
  const read = readGoal(body, today());
  if (!read.ok) throw new ApiError(400, read.error);
  const db = getDb();
  if (await db.examGoal.count({ where: { userId } }) >= GOAL_LIMITS.max) throw new ApiError(409, `Хамгийн ихдээ ${GOAL_LIMITS.max} шалгалт нэмнэ.`);
  try {
    return asGoal(await db.examGoal.create({ data: { userId, ...read.goal }, select: goalSelect }));
  } catch (error) {
    if (duplicate(error)) throw new ApiError(409, "Энэ шалгалт аль хэдийн нэмэгдсэн байна.");
    throw error;
  }
}

export async function updateGoal(userId: string, id: string, body: unknown): Promise<Goal> {
  const read = readGoal(body, today());
  if (!read.ok) throw new ApiError(400, read.error);
  const db = getDb();
  const found = await db.examGoal.findFirst({ where: { id, userId }, select: { id: true } });
  if (!found) throw new ApiError(404, "Шалгалт олдсонгүй.");
  try {
    return asGoal(await db.examGoal.update({ where: { id: found.id }, data: read.goal, select: goalSelect }));
  } catch (error) {
    if (duplicate(error)) throw new ApiError(409, "Энэ шалгалт аль хэдийн нэмэгдсэн байна.");
    throw error;
  }
}

export async function deleteGoal(userId: string, id: string) {
  const { count } = await getDb().examGoal.deleteMany({ where: { id, userId } });
  if (!count) throw new ApiError(404, "Шалгалт олдсонгүй.");
  return { ok: true };
}

// ---------------------------------------------------------------- To-do list

const taskSelect = { id: true, day: true, title: true, done: true } as const;

/** The carousel's window of days around today, in order of the day and then of writing. */
export async function listTasks(userId: string, from: string, to: string): Promise<Task[]> {
  return getDb().studyTask.findMany({ where: { userId, day: { gte: from, lte: to } }, orderBy: [{ day: "asc" }, { createdAt: "asc" }, { id: "asc" }], take: 2000, select: taskSelect });
}

async function roomOnDay(userId: string, day: string) {
  if (await getDb().studyTask.count({ where: { userId, day } }) >= TASK_LIMITS.perDay) throw new ApiError(409, `Нэг өдөрт хамгийн ихдээ ${TASK_LIMITS.perDay} ажил.`);
}

export async function createTask(userId: string, body: unknown): Promise<Task> {
  const read = readNewTask(body, today());
  if (!read.ok) throw new ApiError(400, read.error);
  await roomOnDay(userId, read.day);
  return getDb().studyTask.create({ data: { userId, day: read.day, title: read.title }, select: taskSelect });
}

export async function updateTask(userId: string, id: string, body: unknown): Promise<Task> {
  const read = readTaskPatch(body, today());
  if (!read.ok) throw new ApiError(400, read.error);
  const db = getDb();
  const found = await db.studyTask.findFirst({ where: { id, userId }, select: { id: true, day: true } });
  if (!found) throw new ApiError(404, "Ажил олдсонгүй.");
  const { done, title, day } = read.patch;
  if (day && day !== found.day) await roomOnDay(userId, day);
  return db.studyTask.update({
    where: { id: found.id },
    data: { ...(title === undefined ? {} : { title }), ...(day === undefined ? {} : { day }), ...(done === undefined ? {} : { done, doneAt: done ? new Date() : null }) },
    select: taskSelect,
  });
}

export async function deleteTask(userId: string, id: string) {
  const { count } = await getDb().studyTask.deleteMany({ where: { id, userId } });
  if (!count) throw new ApiError(404, "Ажил олдсонгүй.");
  return { ok: true };
}

// ---------------------------------------------------------------- Activity grid

const EVENT_CAP = 4000;

/** What the student did on each day of the last year, read from rows the site already keeps: sittings started,
 * practice saved, AI actions that were charged, words reviewed (own bank and exam decks) and to-do items ticked. */
export async function activity(userId: string, day = today()) {
  const start = gridStart(day);
  const since = dayStart(start);
  const db = getDb();
  const [mocks, practice, reading, charges, words, deckWords, tasks] = await Promise.all([
    db.mockAttempt.findMany({ where: { userId, createdAt: { gte: since } }, select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: EVENT_CAP }),
    db.practiceSession.findMany({ where: { userId, updatedAt: { gte: since } }, select: { updatedAt: true }, take: EVENT_CAP }),
    db.readingPractice.findMany({ where: { userId, updatedAt: { gte: since } }, select: { updatedAt: true }, take: EVENT_CAP }),
    db.creditCharge.findMany({ where: { userId, status: "SPENT", createdAt: { gte: since } }, select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: EVENT_CAP }),
    db.vocabularyWord.findMany({ where: { userId, reviewedAt: { gte: since } }, select: { reviewedAt: true }, take: EVENT_CAP }),
    db.languageDeckProgress.findMany({ where: { userId, reviewedAt: { gte: since } }, select: { reviewedAt: true }, take: EVENT_CAP }),
    db.studyTask.findMany({ where: { userId, done: true, doneAt: { gte: since } }, select: { doneAt: true }, take: EVENT_CAP }),
  ]);
  const events: { kind: ActivityKind; at: Date }[] = [
    ...mocks.map(row => ({ kind: "mock" as const, at: row.createdAt })),
    ...practice.map(row => ({ kind: "practice" as const, at: row.updatedAt })),
    ...reading.map(row => ({ kind: "practice" as const, at: row.updatedAt })),
    ...charges.map(row => ({ kind: "ai" as const, at: row.createdAt })),
    ...[...words, ...deckWords].map(row => ({ kind: "words" as const, at: row.reviewedAt! })),
    ...tasks.map(row => ({ kind: "tasks" as const, at: row.doneAt! })),
  ];
  return activityGrid(bucketActivity(events, start, day), day);
}

// ---------------------------------------------------------------- Goal progress

/** Per goal level: how many mocks this site has for it and how the student has done on them (from their own snapshots). */
export async function goalProgress(userId: string, goals: readonly Goal[]): Promise<Record<string, GoalProgress>> {
  const slugs = allExamSlugs();
  const db = getDb();
  const entries = await Promise.all(goals.map(async goal => {
    const level = findGoalLevel(goal.exam, goal.level)!;
    const prefix = level.slugPrefix;
    const own = slugs.filter(slug => slug.startsWith(prefix));
    const where = { userId, status: "SUBMITTED", slug: { startsWith: prefix } };
    const [rows, finished, practice] = await Promise.all([
      db.mockAttempt.findMany({ where, orderBy: { updatedAt: "desc" }, take: 10, select: { state: true } }),
      db.mockAttempt.count({ where }),
      db.practiceSession.count({ where: { userId, slug: { startsWith: prefix } } }),
    ]);
    const percents = rows.map(row => {
      const report = makeReport(row.state as unknown as ExamState);
      return report.points.total ? Math.round((report.points.earned / report.points.total) * 100) : null;
    }).filter((value): value is number => value !== null);
    const progress: GoalProgress = {
      mocks: level.onSite ? own.filter(slug => !slug.endsWith("-free")).length : 0,
      free: level.onSite && own.some(slug => slug.endsWith("-free")),
      finished, practice,
      average: percents.length ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length) : null,
      last: percents[0] ?? null,
    };
    return [goal.id, progress] as const;
  }));
  return Object.fromEntries(entries);
}

// ---------------------------------------------------------------- Credit history

export const CREDIT_PAGE = 12;

const chargeSelect = { id: true, action: true, credits: true, status: true, parts: true, createdAt: true } as const;
function asEntry(row: { id: string; action: string; credits: number; status: string; parts: Prisma.JsonValue; createdAt: Date }): CreditEntry {
  const known = isAiAction(row.action) ? AI_ACTIONS[row.action] : null;
  const parts = Array.isArray(row.parts) ? row.parts : [];
  return {
    id: row.id, at: row.createdAt.toISOString(),
    label: known?.label ?? row.action, area: known?.area ?? "AI",
    credits: row.credits,
    status: row.status === "REFUNDED" ? "REFUNDED" : row.status === "HELD" ? "HELD" : "SPENT",
    yellow: parts.some(part => Boolean(part) && typeof part === "object" && (part as { kind?: unknown }).kind === "wallet"),
  };
}

/** One page of the student's AI charges, newest first; `before` is the last entry's id from the previous page. */
export async function creditEntries(userId: string, before?: string | null) {
  const db = getDb();
  let cursor: { createdAt: Date; id: string } | null = null;
  if (before) {
    cursor = await db.creditCharge.findFirst({ where: { id: before, userId }, select: { createdAt: true, id: true } });
    if (!cursor) throw new ApiError(404, "Түүх олдсонгүй.");
  }
  const rows = await db.creditCharge.findMany({
    where: { userId, ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: CREDIT_PAGE + 1, select: chargeSelect,
  });
  const entries = rows.slice(0, CREDIT_PAGE).map(asEntry);
  return { entries, next: rows.length > CREDIT_PAGE ? entries.at(-1)!.id : null };
}

export async function creditOverview(userId: string, now = new Date()): Promise<CreditOverview> {
  const db = getDb();
  const day = ubDay(now.getTime());
  const first = addDays(day, -29);
  const [summary, recent, grouped, purchases, page] = await Promise.all([
    creditSummary(userId, now).then(value => ({ balance: value.balance, allowance: value.allowance, used: value.used, yellow: value.yellow, resetsAt: value.resetsAt }), () => null),
    db.creditCharge.findMany({ where: { userId, status: "SPENT", createdAt: { gte: dayStart(first) } }, select: { createdAt: true, credits: true }, take: 5000 }),
    db.creditCharge.groupBy({ by: ["action"], where: { userId, status: "SPENT", period: creditPeriod(now.getTime()) }, _sum: { credits: true }, _count: { _all: true } }),
    db.creditOrder.findMany({ where: { userId, status: "PAID" }, orderBy: { paidAt: "desc" }, take: 5, select: { id: true, credits: true, amountMnt: true, paidAt: true, createdAt: true } }),
    creditEntries(userId),
  ]);
  const byDay = new Map<string, number>();
  for (const row of recent) {
    const key = ubDay(row.createdAt.getTime());
    byDay.set(key, (byDay.get(key) ?? 0) + row.credits);
  }
  const daily = Array.from({ length: 30 }, (_, index) => { const key = addDays(first, index); return { day: key, credits: byDay.get(key) ?? 0 }; });
  const areaMap = new Map<string, { credits: number; count: number }>();
  for (const row of grouped) {
    const area = isAiAction(row.action) ? AI_ACTIONS[row.action].area : "AI";
    const item = areaMap.get(area) ?? { credits: 0, count: 0 };
    item.credits += row._sum.credits ?? 0;
    item.count += row._count._all;
    areaMap.set(area, item);
  }
  const areas = [...areaMap].map(([area, item]) => ({ area, ...item })).sort((a, b) => b.credits - a.credits);
  return {
    summary, daily, areas,
    monthSpent: areas.reduce((sum, item) => sum + item.credits, 0),
    purchases: purchases.map(row => ({ id: row.id, at: (row.paidAt ?? row.createdAt).toISOString(), credits: row.credits, amountMnt: row.amountMnt })),
    ...page,
  };
}

export const taskWindow = (day = today()) => ({ from: addDays(day, -TASK_LIMITS.windowBefore), to: addDays(day, TASK_LIMITS.windowAfter) });
