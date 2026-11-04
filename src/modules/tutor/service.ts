import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { ownMock } from "@/modules/exams/service";
import { makeReport } from "@/modules/exams/engine";
import type { ExamState } from "@/modules/exams/types";
import { validTutorInput, tutorDay, type TutorInput, type TutorContext } from "./contracts";
import { deepseekTutor } from "./provider";

async function ensureNoTimedExam(userId:string) {
  const db=getDb();
  const [mock,paper]=await Promise.all([
    db.mockAttempt.findFirst({where:{userId,status:"IN_PROGRESS"},select:{id:true}}),
    db.paperAttempt.findFirst({where:{userId,status:"IN_PROGRESS",deadline:{gt:new Date()}},select:{id:true}}),
  ]);
  if(mock||paper)throw new ApiError(403,"Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа AI багшийг ашиглана уу.");
}

async function contextFor(input: TutorInput,userId: string):Promise<TutorContext> {
  const target=input.target;
  const row=await ownMock(target.attemptId,userId),state=row.state as unknown as ExamState;
  if(row.status!=="SUBMITTED"||!state.finishedAt)throw new ApiError(403,"AI тусламжийг шалгалт дууссаны дараа ашиглана уу.");
  const q=makeReport(state).reviews.find(q=>q.id===target.questionId&&q.id.startsWith("sat-math"));
  if(!q)throw new ApiError(404,"Математикийн бодлого олдсонгүй.");
  return {title:state.definition.title,prompt:q.prompt,selected:q.selected,answer:q.answer,explanation:q.explanation,review:true};
}
export async function tutorReply(userId:string,body:unknown) {
  if(!validTutorInput(body))throw new ApiError(400,"AI хүсэлтийн бүтэц буруу байна.");
  const db=getDb(),now=Date.now();
  await ensureNoTimedExam(userId);
  const context=await contextFor(body,userId);
  // Hints never carry the key, even after a prior review.
  if(body.action==="hint"){delete context.answer;delete context.explanation;}
  if(!process.env.DEEPSEEK_API_KEY?.trim())throw new ApiError(503,"AI багш одоогоор холбогдоогүй байна.");
  const key=`education-tutor:${userId}:${tutorDay(now)}`;
  await db.rateLimit.upsert({where:{key},create:{id:randomUUID(),key,count:0,lastRequest:BigInt(0)},update:{}});
  // Database CAS enforces a daily budget and one in-flight request across workers.
  const reserved=await db.rateLimit.updateMany({where:{key,count:{lt:30},lastRequest:{lte:BigInt(now)}},data:{count:{increment:1},lastRequest:BigInt(now+90000)}});
  if(!reserved.count)throw new ApiError(429,"AI хүсэлт боловсруулж байна эсвэл өдрийн 30 хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.");
  try {
    const message=await deepseekTutor(body,context);
    // Another tab may start an exam while a provider response is in flight.
    await ensureNoTimedExam(userId);
    return {message,provider:"DeepSeek"};
  }
  finally {await db.rateLimit.update({where:{key},data:{lastRequest:BigInt(Date.now()+3000)}});}
}

