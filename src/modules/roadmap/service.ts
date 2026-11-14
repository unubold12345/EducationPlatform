import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { listeningLabEnabled, readingLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { examDefinitions } from "@/modules/exams/definitions";
import { mocksFor } from "@/modules/exams/entrance/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { finishedAttempts } from "@/modules/workspace/data";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { makeReport } from "@/modules/exams/engine";
import type { ExamProgram, ExamState } from "@/modules/exams/types";
import { chargeCredits } from "@/modules/credits/service";
import { roadmapCredits, roadmapOutputTokens, type UsageMeter } from "@/modules/credits/pricing";
import { tutorDay } from "@/modules/tutor/contracts";
import {
  buildRoadmap, findGoal, keepsAcrossPlans, readDone, readSettings, readToggle, taskIds, ubDay,
  type FinishedRef, type GoalId, type Lab, type MockRef, type PlanSettings, type Roadmap,
} from "./plan";
import {
  STRUCTURE_LIMITS, allowedTools, parseStructure, readGenerate, readStructure, structureMessages,
  type AiStructure, type PlannerMessage, type SkillStat,
} from "./structure";

/** The goal's mocks in the order a plan uses them: forms in number order, ЭЕШ papers newest year first. */
export function goalMocks(goal: GoalId): MockRef[] {
  const byProgram = (program: ExamProgram) => examDefinitions.filter(exam => exam.program === program)
    .map(exam => ({ slug: exam.slug, title: exam.title })).sort((a, b) => a.slug.localeCompare(b.slug, "en", { numeric: true }));
  if (goal === "sat") return byProgram("sat");
  if (goal === "ielts") return byProgram("ielts");
  if (goal === "jlpt-n5" || goal === "jlpt-n4") return jlptMocks.filter(mock => mock.level === (goal === "jlpt-n5" ? "N5" : "N4")).map(mock => ({ slug: mock.slug, title: mock.title }));
  if (goal === "hsk1") return hskMocks.map(mock => ({ slug: mock.slug, title: mock.title }));
  const subject = goal.slice("eesh-".length) as "math" | "physics" | "chemistry" | "biology" | "english";
  return mocksFor(subject).sort((a, b) => b.year - a.year || a.form.localeCompare(b.form, "en", { numeric: true }))
    .map(mock => ({ slug: mock.slug, title: mock.title }));
}
const goalProgram = (goal: GoalId): ExamProgram => goal.startsWith("eesh-") ? "entrance" : goal.startsWith("jlpt-") ? "jlpt" : goal === "hsk1" ? "hsk" : goal as ExamProgram;

function enabledLabs(): Lab[] {
  return [
    ...(readingLabEnabled() ? ["reading" as const] : []),
    ...(listeningLabEnabled() ? ["listening" as const] : []),
    ...(writingLabEnabled() ? ["writing" as const] : []),
    ...(speakingLabEnabled() ? ["speaking" as const] : []),
  ];
}

type PlanRow = { goal: string; examDate: string; target: string | null; daysPerWeek: number; minutesPerDay: number; done: unknown; structure: unknown; createdAt: Date };
const asJson = (value: unknown) => value as Prisma.InputJsonValue;

/** The goal's mocks and the student's finished sittings of them. */
async function goalSittings(userId: string, goal: GoalId) {
  const mocks = goalMocks(goal);
  const slugs = new Set(mocks.map(mock => mock.slug));
  // Scores come from the student's own submitted snapshots, never from the browser.
  const { items } = await finishedAttempts(userId, { take: 60, program: goalProgram(goal) });
  const finished: FinishedRef[] = items.filter(item => slugs.has(item.slug))
    .map(item => ({ slug: item.slug, attemptId: item.id, finishedDay: ubDay(new Date(item.finishedAt).getTime()), percent: item.percent }));
  return { mocks, finished };
}

async function roadmapFor(userId: string, row: PlanRow, now: number): Promise<Roadmap | null> {
  const goal = findGoal(row.goal);
  if (!goal) return null;
  const settings: PlanSettings = { goal: goal.id, examDate: row.examDate, target: row.target === null ? null : Number(row.target), daysPerWeek: row.daysPerWeek, minutesPerDay: row.minutesPerDay };
  const { mocks, finished } = await goalSittings(userId, goal.id);
  const labs = enabledLabs();
  // The stored AI structure is read like a fresh reply: bounded, cleaned and limited to the tools this goal has now.
  const structure = readStructure(row.structure, { minutesPerDay: row.minutesPerDay, tools: allowedTools(goal, labs) });
  return buildRoadmap({ settings, startDay: ubDay(row.createdAt.getTime()), today: ubDay(now), mocks, finished, done: readDone(row.done), labs, structure });
}

const planSelect = { goal: true, examDate: true, target: true, daysPerWeek: true, minutesPerDay: true, done: true, structure: true, createdAt: true } as const;

const SKILL_SITTINGS = 5;
/**
 * How the student did on each skill of the goal's exam, across their latest finished mocks, weakest first.
 * Read from their own submitted snapshots; questions still waiting for review (writing, speaking) are left out.
 */
export async function skillProfile(userId: string, goal: GoalId): Promise<SkillStat[]> {
  const slugs = goalMocks(goal).map(mock => mock.slug);
  if (!slugs.length) return [];
  const rows = await getDb().mockAttempt.findMany({ where: { userId, status: "SUBMITTED", slug: { in: slugs } }, orderBy: { updatedAt: "desc" }, take: SKILL_SITTINGS, select: { state: true } });
  const totals = new Map<string, { earned: number; points: number; questions: number }>();
  for (const row of rows) {
    let reviews: ReturnType<typeof makeReport>["reviews"];
    // A snapshot that no longer reads is skipped rather than breaking the page.
    try { reviews = makeReport(row.state as unknown as ExamState).reviews; } catch { continue; }
    for (const review of reviews) {
      if (review.pretest || review.correct === null || !review.domain) continue;
      const entry = totals.get(review.domain) ?? { earned: 0, points: 0, questions: 0 };
      entry.earned += review.earned ?? 0; entry.points += review.points; entry.questions++;
      totals.set(review.domain, entry);
    }
  }
  return [...totals].filter(([, value]) => value.questions >= 2 && value.points > 0)
    .map(([title, value]) => ({ title, percent: Math.round((value.earned / value.points) * 100), questions: value.questions }))
    .sort((a, b) => a.percent - b.percent || b.questions - a.questions)
    .slice(0, STRUCTURE_LIMITS.skills);
}

/** The student's roadmap, or null when they have not made one. */
export async function studentRoadmap(userId: string, now = Date.now()) {
  const row = await getDb().studyPlan.findUnique({ where: { userId }, select: planSelect });
  return row ? roadmapFor(userId, row, now) : null;
}

/** What the roadmap page needs: the plan (or null), the skill results behind it and today's Ulaanbaatar date for the form. */
export async function roadmapPage(userId: string, now = Date.now()) {
  const roadmap = await studentRoadmap(userId, now);
  const skills = roadmap ? await skillProfile(userId, roadmap.goal.id).catch(() => []) : [];
  return { roadmap, skills, today: ubDay(now) };
}

/**
 * Saves the settings as a plan built by the site's own schedule. The plan is re-anchored on today, so its weeks
 * start again from now; ticks of a different goal are cleared, and an AI structure written for the earlier
 * settings is dropped (`generateRoadmap` saves settings and a new structure together).
 */
export async function saveRoadmap(userId: string, body: unknown, now = Date.now()) {
  const read = readSettings(body, ubDay(now));
  if (!read.ok) throw new ApiError(400, read.error);
  const { settings } = read;
  const db = getDb();
  const existing = await db.studyPlan.findUnique({ where: { userId }, select: { goal: true, done: true } });
  const done = existing && existing.goal === settings.goal ? readDone(existing.done) : [];
  const values = { goal: settings.goal, examDate: settings.examDate, target: settings.target === null ? null : String(settings.target), daysPerWeek: settings.daysPerWeek, minutesPerDay: settings.minutesPerDay, done, structure: Prisma.DbNull, createdAt: new Date(now) };
  const row = await db.studyPlan.upsert({ where: { userId }, create: { userId, ...values }, update: values, select: planSelect });
  return { roadmap: await roadmapFor(userId, row, now) };
}

// ---- AI structure ----

const LEASE_MS = 200_000;
const PROVIDER_TIMEOUT_MS = 80_000;
const DAILY_LIMIT = STRUCTURE_LIMITS.daily;

async function ensureNoTimedExam(userId: string) {
  // Like every Workspace AI action, the planner is closed during an open timed sitting, before and after the provider call.
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа төлөвлөгөөгөө зохиолгоно уу.");
}

/**
 * Has DeepSeek write the plan's structure and saves it with the settings it was written for, in one write.
 * The body is `{ settings?, note? }`: with settings this makes (or replaces) the plan; without, it rebuilds
 * the saved plan from today. Either way the plan is re-anchored on today.
 *
 * The model receives only the plan's facts: the exam, the time left, the study load, the target, which weeks
 * hold a mock, the student's own mock percentages and skill results (read from their submitted snapshots) and
 * their optional note as data. No name, email or id. Its reply is read by `parseStructure`; the mocks, links,
 * dates and ticks stay with `buildRoadmap`. Credits are held first and refunded on every failure, and nothing
 * is saved unless a usable structure arrives, so a failed request leaves the earlier plan as it was.
 */
export async function generateRoadmap(userId: string, body: unknown, now = Date.now()) {
  const input = readGenerate(body);
  if (!input) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const today = ubDay(now);
  const db = getDb();
  const existing = await db.studyPlan.findUnique({ where: { userId }, select: planSelect });
  if (input.settings === null && !existing) throw new ApiError(404, "Төлөвлөгөө олдсонгүй. Эхлээд шалгалт, өдрөө сонгоно уу.");
  // The saved plan's own settings are checked again: its exam date may have passed since.
  const read = readSettings(input.settings ?? { goal: existing!.goal, examDate: existing!.examDate, target: existing!.target === null ? null : Number(existing!.target), daysPerWeek: existing!.daysPerWeek, minutesPerDay: existing!.minutesPerDay }, today);
  if (!read.ok) throw new ApiError(input.settings === null ? 409 : 400, read.error);
  const { settings } = read;
  const goal = findGoal(settings.goal)!;

  await ensureNoTimedExam(userId);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI төлөвлөгч одоогоор холбогдоогүй байна.");

  const labs = enabledLabs();
  const [{ mocks, finished }, skills, previous] = await Promise.all([
    goalSittings(userId, goal.id),
    skillProfile(userId, goal.id).catch(() => []),
    existing ? roadmapFor(userId, existing, now).catch(() => null) : null,
  ]);
  // The plan exactly as it will stand once saved (anchored on today, nothing ticked): its length and its mock
  // weeks are the facts the planner designs around.
  const draft = buildRoadmap({ settings, startDay: today, today, mocks, finished, done: [], labs });
  const weekCount = draft.weeks.length;
  const tools = allowedTools(goal, labs);
  const messages = structureMessages({
    goal, settings, daysLeft: draft.daysLeft, weekCount, labs, skills, note: input.note,
    mockWeeks: draft.weeks.filter(week => week.tasks.some(task => task.kind === "mock")).map(week => week.index + 1),
    scores: draft.history.map(item => item.percent),
    // Only a plan the student has actually worked on says something about their pace.
    progress: previous && !previous.passed && (previous.progress.done > 0 || previous.late > 0) ? { done: previous.progress.done, total: previous.progress.total, late: previous.late } : null,
  });

  const key = `education-roadmap-ai:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  // The price follows the plan's length, which is known now, so the hold is the charge.
  return chargeCredits(userId, "roadmap", async meter => {
    await db.rateLimit.upsert({ where: { key }, create: { id: randomUUID(), key, count: 0, lastRequest: BigInt(0) }, update: {} });
    // Database compare-and-set: a daily budget and one request in flight, across every server instance.
    const reserved = await db.rateLimit.updateMany({ where: { key, count: { lt: DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } }, data: { count: { increment: 1 }, lastRequest: lease } });
    if (!reserved.count) throw new ApiError(429, `Төлөвлөгөө зохиож байна эсвэл өдрийн ${DAILY_LIMIT} удаагийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);
    try {
      let structure: AiStructure | null = null;
      // One silent retry when the reply is malformed; the daily count and the credits are charged once.
      for (let attempt = 0; attempt < 2 && !structure; attempt++) {
        structure = parseStructure(await deepseekStructure(messages, roadmapOutputTokens(weekCount), meter), { weekCount, minutesPerDay: settings.minutesPerDay, tools, startDay: today, madeDay: today });
      }
      if (!structure) throw new ApiError(503, "AI төлөвлөгөө зохиож чадсангүй. Дахин оролдоно уу.");
      // Another tab may have started a timed exam while the provider was answering.
      await ensureNoTimedExam(userId);
      // Ticks named by a mock stay for the same goal; ticks named by a week's position belonged to other routines.
      const done = existing && existing.goal === settings.goal ? readDone(existing.done).filter(keepsAcrossPlans) : [];
      // `createdAt` is the moment this request began, so the plan starts on the day the structure was written for.
      const values = { goal: settings.goal, examDate: settings.examDate, target: settings.target === null ? null : String(settings.target), daysPerWeek: settings.daysPerWeek, minutesPerDay: settings.minutesPerDay, done, structure: asJson(structure), createdAt: new Date(now) };
      const row = await db.studyPlan.upsert({ where: { userId }, create: { userId, ...values }, update: values, select: planSelect });
      return { roadmap: await roadmapFor(userId, row, now), provider: "DeepSeek" as const };
    } finally {
      // Only release the lease this request holds; never shorten another request's lease.
      await db.rateLimit.updateMany({ where: { key, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
    }
  }, { hold: roadmapCredits(weekCount) });
}

/** DeepSeek JSON mode with the reply budget of this plan's length. */
async function deepseekStructure(messages: PlannerMessage[], maxTokens: number, meter: UsageMeter) {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503, "AI төлөвлөгч одоогоор холбогдоогүй байна.");
  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
        messages,
        thinking: { type: "disabled" },
        max_tokens: maxTokens,
        temperature: 0.4,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(503, "AI төлөвлөгчтэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
  }
  // Never echo provider error bodies: they can contain request or credential details.
  if (!response.ok) throw new ApiError(503, response.status === 429 ? "AI ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу." : "AI холболт түр ажиллахгүй байна. Дахин оролдоно уу.");
  try {
    const data = await response.json() as { choices?: { finish_reason?: string; message?: { content?: unknown } }[]; usage?: unknown };
    meter.add(data.usage);
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (choice?.finish_reason !== "stop" || typeof content !== "string" || !content.trim() || content.length > STRUCTURE_LIMITS.replyChars) throw new Error("Invalid completion");
    return content;
  } catch {
    throw new ApiError(503, "AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
  }
}

/** Ticks or unticks one task of the student's current plan. */
export async function toggleRoadmapTask(userId: string, body: unknown, now = Date.now()) {
  const toggle = readToggle(body);
  if (!toggle) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const db = getDb();
  const row = await db.studyPlan.findUnique({ where: { userId }, select: planSelect });
  if (!row) throw new ApiError(404, "Төлөвлөгөө олдсонгүй.");
  const roadmap = await roadmapFor(userId, row, now);
  if (!roadmap || !taskIds(roadmap).has(toggle.task)) throw new ApiError(404, "Ийм даалгавар төлөвлөгөөнд алга.");
  const current = readDone(row.done).filter(id => id !== toggle.task);
  const done = toggle.done ? [...current, toggle.task] : current;
  // Only ids the plan still has are kept, so the list cannot grow past the plan.
  const valid = taskIds(roadmap);
  const kept = done.filter(id => valid.has(id));
  const saved = await db.studyPlan.update({ where: { userId }, data: { done: kept }, select: planSelect });
  return { roadmap: await roadmapFor(userId, saved, now) };
}

export async function deleteRoadmap(userId: string) {
  await getDb().studyPlan.deleteMany({ where: { userId } });
  return { roadmap: null };
}
