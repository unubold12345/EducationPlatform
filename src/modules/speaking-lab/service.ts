import "server-only";
import {randomUUID} from "node:crypto";
import {ApiError} from "@/lib/api";
import {getDb} from "@/lib/db";
import {speakingLabEnabled} from "@/lib/local-pilot";
import {tutorDay} from "@/modules/tutor/contracts";
import {normalizeSpeakingReply,speakingMessages,tipQuotesAnswer,validSpeakingInput} from "./contracts";
import {chargeCredits} from "@/modules/credits/service";
import {AI_ACTIONS,speakingCreditAction,type AiAction} from "@/modules/credits/pricing";

// Daily per-student limits. A full mock uses ~18 chat calls, one voice stream per reply and one transcription per answer.
const DAILY_LIMIT={chat:80,voice:200,transcribe:150} as const;

export async function requireSpeakingLab(userId:string) {
 if(!speakingLabEnabled())throw new ApiError(404,"Туршилтын хуудас идэвхгүй байна.");
 const db=getDb();
 const mock=await db.mockAttempt.findFirst({where:{userId,status:"IN_PROGRESS"},select:{id:true}});
 if(mock)throw new ApiError(403,"Хугацаатай шалгалтаа дуусгасны дараа Speaking Lab ашиглана уу.");
}

// Chat requests hold an exclusive lease (one in flight per student). Local voice/transcription
// requests are counted only; their CPU work is serialised by a process-wide queue instead.
export async function reserveSpeakingRequest(userId:string,kind:keyof typeof DAILY_LIMIT) {
 const db=getDb(),now=Date.now(),key=`education-speaking-${kind}:${userId}:${tutorDay(now)}`;
 await db.rateLimit.upsert({where:{key},create:{id:randomUUID(),key,count:0,lastRequest:BigInt(0)},update:{}});
 if(kind!=="chat"){
  const result=await db.rateLimit.updateMany({where:{key,count:{lt:DAILY_LIMIT[kind]}},data:{count:{increment:1}}});
  if(!result.count)throw new ApiError(429,"Өнөөдрийн дуу/бичлэгийн туршилтын хязгаарт хүрлээ. Маргааш дахин оролдоно уу.");
  return async()=>{};
 }
 const lease=BigInt(now+180000);
 const result=await db.rateLimit.updateMany({where:{key,count:{lt:DAILY_LIMIT.chat},lastRequest:{lte:BigInt(now)}},data:{count:{increment:1},lastRequest:lease}});
 if(!result.count)throw new ApiError(429,"Хүсэлт боловсруулж байна эсвэл өдрийн туршилтын хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.");
 return async()=>{await db.rateLimit.updateMany({where:{key,lastRequest:lease},data:{lastRequest:BigInt(Date.now()+400)}});};
}

// Serialises CPU-heavy local model work per queue name; waits rather than failing busy requests.
const queues=globalThis as unknown as {educationLabQueues?:Map<string,Promise<unknown>>};
export async function serialized<T>(name:string,waitMs:number,work:()=>Promise<T>):Promise<T> {
 const map=queues.educationLabQueues??=new Map();
 const previous=map.get(name)??Promise.resolve();
 let unlock!:()=>void;const mine=new Promise<void>(resolve=>{unlock=resolve;});
 const tail=previous.then(()=>mine,()=>mine);map.set(name,tail);
 try {
  let timer:ReturnType<typeof setTimeout>|undefined;
  const waited=await Promise.race([previous.then(()=>true,()=>true),new Promise<false>(resolve=>{timer=setTimeout(()=>resolve(false),waitMs);})]);
  clearTimeout(timer);
  if(!waited)throw new ApiError(429,"Local speech engine is busy. Please try again in a moment.");
  return await work();
 }finally{unlock();if(map.get(name)===tail)map.delete(name);}
}

type Completion<T>={messages:{role:string;content:string}[];maxTokens:number;temperature:number;timeoutMs:number;
 /** Turns the model's JSON into the reply, or null when it is malformed (one silent retry follows). */
 read:(json:unknown)=>T|null;
 /** The access check, repeated after the provider call so a result is never delivered into a state that forbids it. */
 recheck:()=>Promise<void>};

// One credit-charged DeepSeek call, shared by the Lab's replies and the report on a finished IELTS mock.
// Credits are held first and refunded if the daily budget, the provider or the access recheck fails.
export async function speakingCompletion<T extends object>(userId:string,action:AiAction,request:Completion<T>) {
 const key=process.env.DEEPSEEK_API_KEY?.trim();if(!key)throw new ApiError(503,"AI одоогоор холбогдоогүй байна.");
 return chargeCredits(userId,action,async meter=>{
 const release=await reserveSpeakingRequest(userId,"chat");
 try {
  for(let attempt=0;attempt<2;attempt++){
   let response:Response;
   try{response=await fetch("https://api.deepseek.com/chat/completions",{method:"POST",cache:"no-store",redirect:"error",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||"deepseek-flash",messages:request.messages,thinking:{type:"disabled"},max_tokens:request.maxTokens,temperature:request.temperature,response_format:{type:"json_object"},stream:false}),signal:AbortSignal.timeout(request.timeoutMs)});}
   catch{throw new ApiError(503,"AI-тай холбогдож чадсангүй. Хариу тань хэвээр байна.");}
   if(!response.ok)throw new ApiError(503,"AI түр ажиллахгүй байна. Дахин оролдоно уу.");
   let reply:T|null=null;
   try{const data=await response.json();meter.add(data.usage);const choice=data.choices?.[0];if(choice?.finish_reason==="stop"&&typeof choice.message?.content==="string"&&choice.message.content.length<=16000)reply=request.read(JSON.parse(choice.message.content));}
   catch{reply=null;}
   // One silent retry on malformed model output keeps the conversation flowing.
   if(reply){await request.recheck();return reply;}
  }
  throw new ApiError(503,"Ярианы хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
 }finally{await release();}
 });
}
/** A Mongolian report needs the action's whole output budget; an English one is shorter. */
export const reportTokens=(language:"en"|"mn")=>language==="mn"?AI_ACTIONS["speaking-report"].outputTokens:2400;

export async function speakingReply(userId:string,body:unknown) {
 if(!validSpeakingInput(body))throw new ApiError(400,"Ярианы хүсэлтийн бүтэц буруу байна.");
 await requireSpeakingLab(userId);
 const report=body.action==="report";
 return speakingCompletion(userId,speakingCreditAction(body.action),{
  messages:speakingMessages(body),
  maxTokens:report?reportTokens(body.language):AI_ACTIONS["speaking-turn"].outputTokens,
  temperature:report?0.3:0.8,timeoutMs:report?80000:45000,
  read:json=>{
   const reply=normalizeSpeakingReply(json,body.action);
   // A tip must quote the answer it is attached to.
   if(reply?.tip&&!tipQuotesAnswer(body.message,reply.tip))reply.tip=null;
   return reply;
  },
  recheck:()=>requireSpeakingLab(userId),
 });
}
