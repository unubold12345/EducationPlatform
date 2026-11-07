import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { getExam } from "@/modules/content/published";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { practiceDuringMockAllowed } from "@/lib/local-pilot";
import { hasSubscription } from "@/modules/subscriptions/access";
import { deepseekChat } from "@/modules/tutor/provider";
import { tutorDay } from "@/modules/tutor/contracts";
import { PRACTICE_AI_DAILY_LIMIT, practiceMessages, validAssistantInput } from "./assistant-contract";
import { applyPracticeCheck, applyPracticeEdit, mockPractice, practiceStats, validPracticeCheck, validPracticeEdit, type PracticeSource } from "./form";
import type { PracticeProgress, PracticeResult, PracticeView } from "./types";

export class TimedSittingOpen extends ApiError {
  constructor(public href: string) { super(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа дадлагын горимыг ашиглана уу."); }
}
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

async function sourceFor(slug: string): Promise<PracticeSource | null> {
  const definition = await getExam(slug);
  return definition ? mockPractice(definition) : null;
}
export async function practiceAllowed(userId: string, slug: string) {
  const definition = await getExam(slug);
  if (!definition) return false;
  return Boolean(await getDb().mockPurchase.findFirst({ where: { userId, examSlug: slug, status: "PAID" }, select: { id: true } })) || await hasSubscription(userId, definition.program);
}
// Entitlement and the open-sitting block are checked on every read, save, check, audio and AI request.
async function requirePractice(userId: string, slug: string): Promise<PracticeSource> {
  const source = await sourceFor(slug);
  if (!source) throw new ApiError(404, "Шалгалт олдсонгүй.");
  if (!await practiceAllowed(userId, slug)) throw new ApiError(402, "Энэ шалгалтын эрх эсвэл сарын багц шаардлагатай.");
  // A local developer can switch this block off (DEV_PRACTICE_DURING_MOCK); a hosted server never can.
  const sitting = practiceDuringMockAllowed() ? null : await activeTimedSitting(userId);
  if (sitting) throw new TimedSittingOpen(sitting.href);
  return source;
}

type Row = { responses: unknown; flags: unknown; results: unknown };
const progressOf = (row: Row | null): PracticeProgress => ({
  responses: (row?.responses ?? {}) as Record<string, string>,
  flags: (row?.flags ?? []) as string[],
  results: (row?.results ?? {}) as Record<string, PracticeResult>,
});
function viewOf(source: PracticeSource, progress: PracticeProgress): PracticeView {
  const known = new Set(source.form.questions.map(question => question.id));
  const reveals = Object.fromEntries(Object.entries(progress.results).filter(([id]) => known.has(id)).map(([id, result]) => [id, source.reveal(id, result)]));
  return { form: source.form, responses: progress.responses, flags: progress.flags, reveals };
}
// Compare-and-set on the revision, so two tabs saving different questions cannot lose each other's work.
async function changeProgress(userId: string, slug: string, change: (progress: PracticeProgress) => PracticeProgress) {
  const db = getDb();
  for (let tries = 0; tries < 4; tries++) {
    try {
      const row = await db.practiceSession.upsert({ where: { userId_slug: { userId, slug } }, create: { id: randomUUID(), userId, slug }, update: {} });
      const next = change(progressOf(row));
      const saved = await db.practiceSession.updateMany({ where: { id: row.id, revision: row.revision }, data: { responses: json(next.responses), flags: json(next.flags), results: json(next.results), revision: { increment: 1 } } });
      if (saved.count === 1) return next;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  throw new ApiError(409, "Хадгалж чадсангүй. Дахин оролдоно уу.");
}

export async function practiceView(userId: string, slug: string) {
  const source = await requirePractice(userId, slug);
  const row = await getDb().practiceSession.findUnique({ where: { userId_slug: { userId, slug } } });
  return viewOf(source, progressOf(row));
}
export async function savePractice(userId: string, slug: string, input: unknown) {
  const source = await requirePractice(userId, slug);
  if (!validPracticeEdit(source.form, input)) throw new ApiError(400, "Хариултын бүтэц буруу.");
  await changeProgress(userId, slug, progress => applyPracticeEdit(source.form, progress, input));
  return { saved: true };
}
export async function checkPractice(userId: string, slug: string, input: unknown) {
  const source = await requirePractice(userId, slug);
  if (!validPracticeCheck(source.form, input)) throw new ApiError(400, "Хариултын бүтэц буруу.");
  const next = await changeProgress(userId, slug, progress => applyPracticeCheck(source, progress, input.questionId, input.response));
  return { reveal: source.reveal(input.questionId, next.results[input.questionId]) };
}
export async function resetPractice(userId: string, slug: string) {
  await requirePractice(userId, slug);
  await getDb().practiceSession.deleteMany({ where: { userId, slug } });
  return { reset: true };
}
/** Throws unless this student may hear this exam's practice audio right now. */
export async function authorizePracticeAudio(userId: string, slug: string) {
  await requirePractice(userId, slug);
}
export async function practiceSummaries(userId: string) {
  const rows = await getDb().practiceSession.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 20, select: { slug: true, results: true, updatedAt: true } });
  const items = await Promise.all(rows.map(async row => {
    const source = await sourceFor(row.slug);
    return source ? { slug: row.slug, title: source.form.title, updatedAt: row.updatedAt, ...practiceStats(source.form, progressOf({ responses: {}, flags: [], results: row.results }).results) } : null;
  }));
  return items.filter(item => item !== null);
}

const ASSISTANT_LEASE_MS = 90000;
export async function practiceAssistantReply(userId: string, slug: string, body: unknown) {
  if (!validAssistantInput(body)) throw new ApiError(400, "AI хүсэлтийн бүтэц буруу байна.");
  const source = await requirePractice(userId, slug);
  if (!source.form.questions.some(question => question.id === body.questionId)) throw new ApiError(404, "Даалгавар олдсонгүй.");
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI туслах одоогоор холбогдоогүй байна.");
  const db = getDb(), now = Date.now();
  const row = await db.practiceSession.findUnique({ where: { userId_slug: { userId, slug } } });
  const progress = progressOf(row);
  const result = progress.results[body.questionId];
  const reveal = result ? source.reveal(body.questionId, result) : null;
  const material = source.material(body.questionId);
  // Only the server decides what the model may see: no key or transcript before the student has checked.
  const context = {
    title: source.form.title, subject: source.form.subject, checked: Boolean(result), selected: progress.responses[body.questionId] ?? "",
    ...(reveal ? { answer: reveal.answer, explanation: reveal.explanation } : {}),
    material: { ...material, ...(reveal?.transcript ? { transcript: reveal.transcript } : {}) },
  };
  const key = `education-practice-ai:${userId}:${tutorDay(now)}`;
  await db.rateLimit.upsert({ where: { key }, create: { id: randomUUID(), key, count: 0, lastRequest: BigInt(0) }, update: {} });
  // Database compare-and-set: a daily budget and one request in flight, across every server instance.
  const reserved = await db.rateLimit.updateMany({ where: { key, count: { lt: PRACTICE_AI_DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } }, data: { count: { increment: 1 }, lastRequest: BigInt(now + ASSISTANT_LEASE_MS) } });
  if (!reserved.count) throw new ApiError(429, `AI хүсэлт боловсруулж байна эсвэл өдрийн ${PRACTICE_AI_DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);
  try {
    const message = await deepseekChat(practiceMessages(body, context), 2000);
    // Another tab may have started a timed exam while the provider was answering.
    const sitting = practiceDuringMockAllowed() ? null : await activeTimedSitting(userId);
    if (sitting) throw new TimedSittingOpen(sitting.href);
    return { message, provider: "DeepSeek" };
  } finally {
    await db.rateLimit.update({ where: { key }, data: { lastRequest: BigInt(Date.now() + 3000) } });
  }
}
