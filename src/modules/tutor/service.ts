import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { getExercise } from "@/modules/content/published";
import { requireSubscription } from "@/modules/subscriptions/access";
import { questions } from "@/modules/practice/questions";
import { gradePractice } from "@/modules/practice/grading";
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
  const target=input.target, db=getDb();
  if(target.kind==="mock") {
    const row=await ownMock(target.attemptId!,userId),state=row.state as unknown as ExamState;
    if(row.status!=="SUBMITTED"||!state.finishedAt)throw new ApiError(403,"AI тусламжийг шалгалт дууссаны дараа ашиглана уу.");
    const q=makeReport(state).reviews.find(q=>q.id===target.questionId&&q.id.startsWith("sat-math"));
    if(!q)throw new ApiError(404,"Математикийн бодлого олдсонгүй.");
    return {title:state.definition.title,prompt:q.prompt,selected:q.selected,answer:q.answer,explanation:q.explanation,review:true};
  }
  if(target.kind==="saved") {
    const row=await db.attempt.findFirst({where:{id:target.attemptId,userId},include:{items:{where:{id:target.questionId}}}});
    const q=row?.items[0];
    if(!row||!q||row.examId.startsWith("ielts-"))throw new ApiError(404,"Математикийн бодлого олдсонгүй.");
    return {title:row.title,prompt:q.prompt,options:q.options,selected:q.selected===null?"":q.options[q.selected],...(row.status==="SUBMITTED"?{answer:q.options[q.correct],explanation:q.explanation}:{}),review:row.status==="SUBMITTED"};
  }
  if(target.slug==="demo") {
    const i=questions.findIndex(q=>q.id===target.questionId);if(i<0)throw new ApiError(404,"Бодлого олдсонгүй.");
    const q=questions[i];if(target.selected!=null&&target.selected>=q.options.length)throw new ApiError(400,"Сонголт буруу байна.");
    const review=gradePractice({answers:[0,0,0]})!.reviews[i];
    return {title:"SAT Algebra · Practice",prompt:q.prompt,options:q.options,selected:target.selected==null?"":q.options[target.selected],...(input.action!=="hint"?{answer:q.options[review.correct],explanation:review.explanation}:{}),review:false};
  }
  const set=await getExercise(target.slug!,target.examId);
  if(!set||set.program==="ielts")throw new ApiError(404,"Математикийн дасгал олдсонгүй.");
  await requireSubscription(userId,set.program);
  const q=set.questions.find(q=>q.id===target.questionId);if(!q)throw new ApiError(404,"Бодлого олдсонгүй.");
  if(target.selected!=null&&target.selected>=q.options.length)throw new ApiError(400,"Сонголт буруу байна.");
  return {title:set.title,prompt:q.prompt,options:q.options,selected:target.selected==null?"":q.options[target.selected],...(input.action!=="hint"?{answer:q.options[q.correct],explanation:q.explanation}:{}),review:false};
}
export async function tutorReply(userId:string,body:unknown) {
  if(!validTutorInput(body))throw new ApiError(400,"AI хүсэлтийн бүтэц буруу байна.");
  const db=getDb(),now=Date.now();
  await ensureNoTimedExam(userId);
  const context=await contextFor(body,userId);
  if(body.action==="review"&&!context.review&&body.target.kind!=="practice")throw new ApiError(403,"Алдааны тайлбарыг дасгалаа дуусгасны дараа нээнэ.");
  // Never include hidden saved-attempt keys in hints, even after a prior review.
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

