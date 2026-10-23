import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { validateAnswers } from "./validation";
import type { SavedAttempt } from "./types";
import { getExercises,getExercise } from "@/modules/content/published";
import { exerciseSets as sourceExercises } from "@/modules/exercises/content";
import { requireSubscription } from "@/modules/subscriptions/access";

const withItems = { items: { orderBy: { position: "asc" as const } } };
type AttemptWithItems = Prisma.AttemptGetPayload<{ include: typeof withItems }>;

export function publicAttempt(attempt: AttemptWithItems): SavedAttempt {
  return {
    id: attempt.id, title: attempt.title, revision: attempt.revision, status: attempt.status,
    program: attempt.examId.startsWith("ielts-") ? "ielts" : attempt.examId.startsWith("entrance-") ? "entrance" : "sat",
    questions: attempt.items.map(item => ({ id: item.id, prompt: item.prompt, options: item.options })),
    answers: attempt.items.map(item => item.selected),
    result: attempt.status === "SUBMITTED" ? {
      score: attempt.score!, total: attempt.total,
      reviews: attempt.items.map(item => ({ id: item.id, selected: item.selected!, correct: item.correct, explanation: item.explanation })),
    } : null,
  };
}
export async function readAttempt(id: string, userId: string) {
  const attempt = await getDb().attempt.findFirst({ where: { id, userId }, include: withItems });
  if (!attempt) throw new ApiError(404, "Дасгал олдсонгүй.");
  return publicAttempt(attempt);
}
export async function startAttempt(userId: string, examId = "sat-algebra-demo-v1") {
  const db = getDb();
  const latest=examId==="sat-algebra-demo-v1"?[]:await getExercises();
  const exerciseSets=[...latest,...sourceExercises];
  if(!exerciseSets.some(set=>set.examId===examId)) {
    const slug=examId.replace(/-published-v\d+$/,"");
    if(sourceExercises.some(set=>set.slug===slug)){const historical=await getExercise(slug,examId);if(historical)exerciseSets.push(historical);}
  }
  if (examId !== "sat-algebra-demo-v1" && !exerciseSets.some(set => set.examId === examId)) throw new ApiError(404, "Дасгал олдсонгүй.");
  const set=exerciseSets.find(set=>set.examId===examId);
  const activeKey = userId + ":" + (set?.slug??examId);
  if(set){
    const open=await db.attempt.findFirst({where:{userId,status:"IN_PROGRESS",OR:[{examId:set.slug+"-v1"},{examId:{startsWith:set.slug+"-published-v"}}]},orderBy:{updatedAt:"desc"},select:{id:true}});
    if(open)return open;
  }
  const existing = await db.attempt.findUnique({ where: { activeKey }, select: { id: true } });
  if (existing) return existing;
  if(examId!=="sat-algebra-demo-v1")await requireSubscription(userId,exerciseSets.find(set=>set.examId===examId)!.program);
  const exam = await db.exam.findUnique({ where: { id: examId }, include: { items: { include: { questionVersion: true }, orderBy: { position: "asc" } } } });
  if (!exam || exam.items.length === 0) throw new ApiError(503, "Дасгал одоогоор бэлэн биш байна.");
  try {
    return await db.attempt.create({
      data: {
        userId, examId, activeKey, title: exam.title, examVersion: exam.version, scoringVersion: exam.scoringVersion, isDemo: exam.isDemo, total: exam.items.length,
        items: { create: exam.items.map(({ position, questionVersion: q }) => ({
          questionVersionId: q.id, position, type: q.type, prompt: q.prompt,
          options: q.options, correct: q.correct, explanation: q.explanation,
        })) },
      }, select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await db.attempt.findUnique({ where: { activeKey }, select: { id: true } });
      if (winner) return winner;
    }
    throw error;
  }
}

export async function writeAttempt(id: string, userId: string, input: unknown, submit: boolean) {
  const db = getDb();
  try {
    return await db.$transaction(async tx => {
      const attempt = await tx.attempt.findFirst({ where: { id, userId }, include: withItems });
      if (!attempt) throw new ApiError(404, "Дасгал олдсонгүй.");
      if (attempt.status === "SUBMITTED") {
        if (submit) return publicAttempt(attempt);
        throw new ApiError(409, "Энэ дасгалыг аль хэдийн дуусгасан байна.");
      }
      if (!validateAnswers(input, attempt.items.map(item => item.options.length), submit)) throw new ApiError(400, "Хариунуудын бүтэц буруу эсвэл дутуу байна.");
      const score = submit ? attempt.items.filter((item, index) => item.correct === input.answers[index]).length : null;
      const updated = await tx.attempt.updateMany({
        where: { id, userId, revision: input.revision, status: "IN_PROGRESS" },
        data: {
          revision: { increment: 1 },
          ...(submit ? { status: "SUBMITTED", score, submittedAt: new Date(), activeKey: null } : {}),
        },
      });
      if (updated.count !== 1) throw new ApiError(409, "Өөр цонхонд шинэ өөрчлөлт байна. Хуудсаа шинэчилнэ үү.");
      for (const [position, item] of attempt.items.entries()) {
        await tx.attemptItem.update({ where: { id: item.id }, data: { selected: input.answers[position] } });
      }
      const saved = await tx.attempt.findUniqueOrThrow({ where: { id }, include: withItems });
      return publicAttempt(saved);
    });
  } catch (error) {
    // A simultaneous successful submit wins. A retry returns that saved result.
    if (submit && error instanceof ApiError && error.status === 409) {
      const saved = await readAttempt(id, userId);
      if (saved.status === "SUBMITTED") return saved;
    }
    throw error;
  }
}

