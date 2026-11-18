import "server-only";
import {randomUUID} from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import type {Prisma} from "@/generated/prisma/client";
import {ApiError} from "@/lib/api";
import {getDb} from "@/lib/db";
import {planMonth} from "@/modules/subscriptions/plans";
import {chargeCredits} from "@/modules/credits/service";
import {AI_ACTIONS} from "@/modules/credits/pricing";
import {tutorDay} from "@/modules/tutor/contracts";
import {countWords} from "./contracts";
import {
 EXPERT_LIMITS,EXPERT_MODEL,EXPERT_SCHEMA,STRONG_LIMITS,expertPlan,expertSpentMessage,expertSystem,normalizeExpertReview,readExpertReview,reviewUser,strongSystem,subjectOf,validExpertInput,
 type EssayReviewKind,type ExpertQuota,type ExpertReview,type ExpertSummary,type ReviewSubject,type ReviewTask,type SavedExpertReview,
} from "./expert";
import {requireWritingLab} from "./service";

/** One review in flight per student; a review takes up to about three minutes. */
const LEASE_MS=300_000;
/** The provider call stops before the route's own limit (300 s) so the lease and the reply are always settled. */
const PROVIDER_TIMEOUT_MS=270_000;
const NOT_FOUND="Энэ үнэлгээ олдсонгүй.";

/** The list's columns: the band is its own column, so listing never reads the review JSON (about 15 KB each). */
const LIST={id:true,createdAt:true,kind:true,task:true,title:true,words:true,overall:true} as const;
type Row={id:string;createdAt:Date;kind:string;task:string;title:string;words:number;overall:number};
const isTask=(value:string):value is ReviewTask=>value==="essay"||value==="letter"||value==="free"||value==="report";

function summary(row:Row):ExpertSummary|null {
 return isTask(row.task)?{id:row.id,createdAt:row.createdAt.getTime(),kind:row.kind==="strong"?"strong":"expert",task:row.task,title:row.title,words:row.words,overall:row.overall}:null;
}

/**
 * Reviews left for the student. With an active plan that adds reviews (the largest wins), the count is the reviews made in
 * that plan's current month; without one it is the one free review, counted over the account's whole life.
 */
export async function expertQuota(userId:string,now=new Date()):Promise<ExpertQuota> {
 const db=getDb();
 const subscriptions=await db.subscription.findMany({where:{userId,startsAt:{lte:now},endsAt:{gt:now}},select:{program:true,startsAt:true,endsAt:true}});
 const plan=expertPlan(subscriptions.map(row=>row.program));
 if(plan){
  // Several rows of the same plan (a renewal bought early) count from the one in force now.
  const row=subscriptions.filter(item=>item.program===plan.program).sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime())[0];
  const month=planMonth(row.startsAt.getTime(),row.endsAt.getTime(),now.getTime());
  if(month){
   const used=await db.essayReview.count({where:{userId,kind:"expert",createdAt:{gte:new Date(month.start),lt:new Date(month.end)}}});
   return {plan:plan.title,limit:plan.reviews,used,remaining:Math.max(0,plan.reviews-used),resetsAt:month.end,planEnds:month.end>=row.endsAt.getTime()};
  }
 }
 // Only Claude reviews count; the DeepSeek review is paid with credits.
 const used=await db.essayReview.count({where:{userId,kind:"expert"}});
 return {plan:null,limit:EXPERT_LIMITS.freeReviews,used,remaining:Math.max(0,EXPERT_LIMITS.freeReviews-used),resetsAt:null,planEnds:false};
}

/** The page's first read: what is left and the student's past reviews, newest first. */
export async function expertLibrary(userId:string) {
 const [quota,rows]=await Promise.all([
  expertQuota(userId),
  getDb().essayReview.findMany({where:{userId},orderBy:{createdAt:"desc"},take:EXPERT_LIMITS.history,select:LIST}),
 ]);
 return {quota,reviews:rows.flatMap(row=>summary(row)??[])};
}

const FULL={...LIST,review:true,prompt:true,essay:true,language:true,model:true} as const;
type FullRow=Row&{review:Prisma.JsonValue;prompt:string;essay:string;language:string;model:string};
function full(row:FullRow):SavedExpertReview|null {
 const head=summary(row),review=readExpertReview(row.review);
 return head&&review?{...head,overall:review.overall,prompt:row.prompt,essay:row.essay,language:row.language==="en"?"en":"mn",model:row.model,review}:null;
}

/** One of the student's own reviews, with the text it reviewed. */
export async function openExpertReview(userId:string,id:string):Promise<SavedExpertReview> {
 if(!/^[a-z0-9]{20,40}$/i.test(id))throw new ApiError(400,"Үнэлгээний түлхүүр буруу байна.");
 const row=await getDb().essayReview.findFirst({where:{id,userId},select:FULL});
 const review=row&&full(row);
 if(!review)throw new ApiError(404,NOT_FOUND);
 return review;
}

/** The student's reviews of one mock attempt's essays, newest first (they also list in the studio). */
export async function attemptReviews(userId:string,attemptId:string):Promise<(SavedExpertReview&{questionId:string})[]> {
 const rows=await getDb().essayReview.findMany({where:{userId,attemptId},orderBy:{createdAt:"desc"},take:12,select:{...FULL,questionId:true}});
 return rows.flatMap(row=>{const review=full(row);return review&&row.questionId?[{...review,questionId:row.questionId}]:[];});
}

/** Never echo a provider error body: it can carry request or credential details. */
function providerFailure(error:unknown):never {
 if(error instanceof ApiError)throw error;
 if(error instanceof Anthropic.RateLimitError||(error instanceof Anthropic.APIError&&error.status===529))throw new ApiError(503,"Шинжээч одоогоор ачаалалтай байна. Хэдэн минутын дараа дахин оролдоно уу. Үнэлгээ хасагдаагүй.");
 if(error instanceof Anthropic.AuthenticationError||error instanceof Anthropic.PermissionDeniedError)throw new ApiError(503,"Шинжээчийн үнэлгээ одоогоор холбогдоогүй байна.");
 if(error instanceof Anthropic.APIConnectionTimeoutError)throw new ApiError(504,"Шинжээчийн үнэлгээ хэт удлаа. Дахин оролдоно уу. Үнэлгээ хасагдаагүй.");
 throw new ApiError(503,"Шинжээчтэй холбогдож чадсангүй. Дахин оролдоно уу. Үнэлгээ хасагдаагүй.");
}

/**
 * Write one expert review. The quota is read inside a one-at-a-time lease, so two tabs cannot both spend the last review,
 * and a review only counts once it is saved: a refusal, a timeout or an unusable reply costs the student nothing.
 */
export async function createExpertReview(userId:string,body:unknown) {
 if(!validExpertInput(body))throw new ApiError(400,`Бичвэрийн хүсэлт буруу байна. Шинжээчийн үнэлгээнд дор хаяж ${EXPERT_LIMITS.minWords} үг, сэдэв хэрэгтэй.`);
 return expertReview(userId,subjectOf(body));
}

/** The Claude review of a resolved text: from the studio above, or a mock essay read from its attempt (`ai-grading`). */
export async function expertReview(userId:string,body:ReviewSubject) {
 await requireWritingLab(userId);
 const key=process.env.ANTHROPIC_API_KEY?.trim();
 if(!key)throw new ApiError(503,"Шинжээчийн үнэлгээ одоогоор холбогдоогүй байна.");
 const db=getDb(),now=Date.now(),lockKey=`education-expert-review:${userId}`,lease=BigInt(now+LEASE_MS);
 await db.rateLimit.upsert({where:{key:lockKey},create:{id:randomUUID(),key:lockKey,count:0,lastRequest:BigInt(0)},update:{}});
 const reserved=await db.rateLimit.updateMany({where:{key:lockKey,lastRequest:{lte:BigInt(now)}},data:{count:{increment:1},lastRequest:lease}});
 if(!reserved.count)throw new ApiError(429,"Өмнөх шинжээчийн үнэлгээ хийгдэж байна. Дуусахыг хүлээнэ үү.");
 try{
  const quota=await expertQuota(userId);
  if(quota.remaining<=0)throw new ApiError(403,expertSpentMessage(quota));
  const client=new Anthropic({apiKey:key,timeout:PROVIDER_TIMEOUT_MS,maxRetries:1});
  let message:Anthropic.Beta.BetaMessage;
  try{
   // Streamed so a long review never meets an HTTP timeout; only the finished message is used.
   const stream=client.beta.messages.stream({
    model:EXPERT_MODEL,max_tokens:EXPERT_LIMITS.maxTokens,
    // A declined request is re-run once on Anthropic's recommended fallback model instead of failing.
    betas:["server-side-fallback-2026-07-01"],fallbacks:"default",
    output_config:{effort:"high",format:{type:"json_schema",schema:EXPERT_SCHEMA}},
    system:expertSystem(body.language),
    messages:[{role:"user",content:reviewUser(body)}],
   });
   message=await stream.finalMessage();
  }catch(error){providerFailure(error);}
  if(message.stop_reason==="refusal")throw new ApiError(422,"Шинжээч энэ бичвэрийг үнэлэхээс татгалзлаа. Бичвэрээ шалгаад дахин оролдоно уу. Үнэлгээ хасагдаагүй.");
  if(message.stop_reason!=="end_turn")throw new ApiError(503,"Шинжээчийн хариу бүрэн ирсэнгүй. Дахин оролдоно уу. Үнэлгээ хасагдаагүй.");
  const raw=message.content.flatMap(block=>block.type==="text"?[block.text]:[]).join("");
  let parsed:unknown=null;
  try{parsed=JSON.parse(raw);}catch{parsed=null;}
  const review=normalizeExpertReview(parsed,body.essay);
  if(!review)throw new ApiError(503,"Шинжээчийн хариу бүрэн ирсэнгүй. Дахин оролдоно уу. Үнэлгээ хасагдаагүй.");
  // A timed exam may have started in another tab while the examiner was writing.
  await requireWritingLab(userId);
  const saved=await saveReview(userId,body,"expert",review,message.model,
   message.usage.input_tokens+(message.usage.cache_creation_input_tokens??0)+(message.usage.cache_read_input_tokens??0),message.usage.output_tokens);
  return {review:saved,quota:await expertQuota(userId)};
 }finally{
  // Only release the lease this request holds.
  await db.rateLimit.updateMany({where:{key:lockKey,lastRequest:lease},data:{lastRequest:BigInt(Date.now()+1000)}});
 }
}

async function saveReview(userId:string,body:ReviewSubject,kind:EssayReviewKind,review:ExpertReview,model:string,inputTokens:number,outputTokens:number):Promise<SavedExpertReview> {
 const row=await getDb().essayReview.create({
  data:{
   userId,kind,task:body.task,promptId:body.promptId,title:body.title,prompt:body.prompt,essay:body.essay,
   words:countWords(body.essay),language:body.language,review:review as unknown as Prisma.InputJsonValue,overall:review.overall,model,inputTokens,outputTokens,
   attemptId:body.attemptId??null,questionId:body.questionId??null,
  },
  select:LIST,
 });
 return {...summary(row)!,prompt:body.prompt,essay:body.essay,language:body.language,model,review};
}

/** The DeepSeek call stops well before the route's limit (240 s); a review usually takes about a minute. */
const STRONG_TIMEOUT_MS=200_000;
const STRONG_LEASE_MS=230_000;

/**
 * The studio's full review ("Бүрэн үнэлгээ"): the expert examiner's prompt and report on DeepSeek with thinking, paid
 * with credits. Credits are held first and returned if the provider, the reply or the exam check fails; one review is in
 * flight per student and the day has a cap. The review is saved with the Claude ones but never counts against their quota.
 */
export function createStrongReview(userId:string,body:unknown) {
 if(!validExpertInput(body,STRONG_LIMITS.minWords))throw new ApiError(400,`Бичвэрийн хүсэлт буруу байна. Бүрэн үнэлгээнд дор хаяж ${STRONG_LIMITS.minWords} үг, сэдэв хэрэгтэй.`);
 return strongReview(userId,subjectOf(body));
}

/** The credit-paid review of a resolved text: from the studio above, or a mock essay read from its attempt (`ai-grading`). */
export async function strongReview(userId:string,body:ReviewSubject) {
 await requireWritingLab(userId);
 const key=process.env.DEEPSEEK_API_KEY?.trim();
 if(!key)throw new ApiError(503,"AI туслах одоогоор холбогдоогүй байна.");
 // Only the checks' mock server changes this; production always talks to DeepSeek.
 const base=(process.env.DEEPSEEK_BASE_URL?.trim()||"https://api.deepseek.com").replace(/\/+$/,"");
 const db=getDb(),now=Date.now(),limitKey=`education-strong-review:${userId}:${tutorDay(now)}`,lease=BigInt(now+STRONG_LEASE_MS);
 await db.rateLimit.upsert({where:{key:limitKey},create:{id:randomUUID(),key:limitKey,count:0,lastRequest:BigInt(0)},update:{}});
 return chargeCredits(userId,"writing-review",async meter=>{
  // Database CAS: one review in flight across workers and a daily cap.
  const reserved=await db.rateLimit.updateMany({where:{key:limitKey,count:{lt:STRONG_LIMITS.daily},lastRequest:{lte:BigInt(now)}},data:{count:{increment:1},lastRequest:lease}});
  if(!reserved.count)throw new ApiError(429,`Өмнөх үнэлгээ хийгдэж байна эсвэл өдрийн ${STRONG_LIMITS.daily} үнэлгээний хязгаарт хүрсэн. Кредит хасагдаагүй.`);
  try{
   let response:Response;
   try{
    response=await fetch(`${base}/chat/completions`,{method:"POST",cache:"no-store",redirect:"error",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},
     body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||"deepseek-flash",thinking:{type:"enabled"},max_tokens:AI_ACTIONS["writing-review"].outputTokens,
      response_format:{type:"json_object"},stream:false,messages:[{role:"system",content:strongSystem(body.language)},{role:"user",content:reviewUser(body)}]}),
     signal:AbortSignal.timeout(STRONG_TIMEOUT_MS)});
   }catch(error){
    throw new ApiError(error instanceof Error&&error.name==="TimeoutError"?504:503,error instanceof Error&&error.name==="TimeoutError"?"Үнэлгээ хэт удлаа. Дахин оролдоно уу. Кредит хасагдаагүй.":"AI туслахтай холбогдож чадсангүй. Кредит хасагдаагүй.");
   }
   // Never echo a provider error body: it can carry request or credential details.
   if(!response.ok)throw new ApiError(503,response.status===429?"AI туслах ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу. Кредит хасагдаагүй.":"AI туслах түр ажиллахгүй байна. Дахин оролдоно уу. Кредит хасагдаагүй.");
   let review:ExpertReview|null=null,usage:{prompt_tokens?:number;completion_tokens?:number}={},model="";
   try{
    const data=await response.json();
    meter.add(data.usage);usage=data.usage??{};model=typeof data.model==="string"?data.model.slice(0,60):"";
    const choice=data.choices?.[0];
    if(choice?.finish_reason==="stop"&&typeof choice.message?.content==="string"&&choice.message.content.length<=80000)review=normalizeExpertReview(JSON.parse(choice.message.content),body.essay);
   }catch{review=null;}
   if(!review)throw new ApiError(503,"Үнэлгээний хариу бүрэн ирсэнгүй. Дахин оролдоно уу. Кредит хасагдаагүй.");
   // A timed exam may have started in another tab while the review was written.
   await requireWritingLab(userId);
   const saved=await saveReview(userId,body,"strong",review,model||process.env.DEEPSEEK_MODEL||"deepseek-flash",Number(usage.prompt_tokens)||0,Number(usage.completion_tokens)||0);
   return {review:saved};
  }finally{
   await db.rateLimit.updateMany({where:{key:limitKey,lastRequest:lease},data:{lastRequest:BigInt(Date.now()+1000)}});
  }
 });
}
