import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { ownMock } from "@/modules/exams/service";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { makeReport } from "@/modules/exams/engine";
import type { ExamQuestion, ExamState } from "@/modules/exams/types";
import { deepseekChat } from "@/modules/tutor/provider";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS } from "@/modules/credits/pricing";
import { tutorDay } from "@/modules/tutor/contracts";
import { chatMessages, validChatInput, WORKSPACE_AI_DAILY_LIMIT, type ChatSubject, type ChatTarget, type ReviewContext } from "./chat-contract";

const LEASE_MS = 90000;
const clip = (text: string | undefined, max: number) => text ? (text.length > max ? text.slice(0, max) + "…" : text) : undefined;

async function ensureNoTimedExam(userId: string) {
  // Workspace AI is closed during any open timed sitting, before and after the provider call.
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа AI туслахыг ашиглана уу.");
}

function questionIn(state: ExamState, questionId: string): ExamQuestion | undefined {
  for (const stage of state.definition.stages) {
    for (const question of [...stage.questions, ...(stage.variants?.lower ?? []), ...(stage.variants?.higher ?? [])]) if (question.id === questionId) return question;
  }
}
function subjectOf(state: ExamState): ChatSubject {
  const definition = state.definition;
  if (definition.program === "entrance") return definition.subject === "physics" ? "eesh-physics" : definition.subject === "english" ? "eesh-english" : "eesh-math";
  return definition.program;
}

/** Only the server decides what the model sees: the student's own finished attempt, read from its snapshot. */
async function reviewContext(userId: string, target: ChatTarget): Promise<ReviewContext> {
  const row = await ownMock(target.attemptId, userId);
  const state = row.state as unknown as ExamState;
  if (row.status !== "SUBMITTED" || !state.finishedAt) throw new ApiError(403, "AI тайлбарыг шалгалт дууссаны дараа ашиглана уу.");
  const review = makeReport(state).reviews.find(item => item.id === target.questionId);
  if (!review) throw new ApiError(404, "Асуулт олдсонгүй.");
  const options = questionIn(state, review.id)?.options;
  return {
    exam: state.definition.title, subject: subjectOf(state), number: review.number ?? "", domain: review.domain,
    result: review.correct === null ? "pending" : review.correct ? "correct" : review.selected.trim() ? "wrong" : "blank",
    prompt: clip(review.prompt, 4000) ?? "",
    ...(options?.length ? { options: options.map(option => clip(option, 400)!) } : {}),
    ...(review.instructions ? { instructions: clip(review.instructions, 2000) } : {}),
    ...(review.context || review.passage ? { material: clip(review.context ?? review.passage, 8000) } : {}),
    ...(review.transcript ? { transcript: clip(review.transcript, 6000) } : {}),
    savedAnswer: clip(review.selected, 6000) ?? "", referenceAnswer: clip(review.answer, 1000) ?? "", referenceExplanation: clip(review.explanation, 4000) ?? "",
    points: review.points, earned: review.earned,
  };
}

export async function workspaceChatReply(userId: string, body: unknown) {
  if (!validChatInput(body)) throw new ApiError(400, "AI хүсэлтийн бүтэц буруу байна.");
  await ensureNoTimedExam(userId);
  const review = "target" in body ? await reviewContext(userId, body.target) : undefined;
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI туслах одоогоор холбогдоогүй байна.");
  const db = getDb(), now = Date.now();
  const key = `education-workspace-ai:${userId}:${tutorDay(now)}`;
  const action = review ? "review-coach" : "chat";
  // Credits are held first and refunded if the daily budget, the provider or the exam check fails.
  // Each attached image adds its DeepSeek input cost to this reply's price.
  return chargeCredits(userId, action, async meter => {
    await db.rateLimit.upsert({ where: { key }, create: { id: randomUUID(), key, count: 0, lastRequest: BigInt(0) }, update: {} });
    // Database compare-and-set: a daily budget and one request in flight, across every server instance.
    const reserved = await db.rateLimit.updateMany({ where: { key, count: { lt: WORKSPACE_AI_DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } }, data: { count: { increment: 1 }, lastRequest: BigInt(now + LEASE_MS) } });
    if (!reserved.count) throw new ApiError(429, `AI хүсэлт боловсруулж байна эсвэл өдрийн ${WORKSPACE_AI_DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);
    try {
      const message = await deepseekChat(chatMessages(body, review), AI_ACTIONS[action].outputTokens, meter);
      // Another tab may have started a timed exam while the provider was answering.
      await ensureNoTimedExam(userId);
      return { message, provider: "DeepSeek" };
    } finally {
      await db.rateLimit.update({ where: { key }, data: { lastRequest: BigInt(Date.now() + 3000) } });
    }
  }, { images: body.images?.length ?? 0 });
}
