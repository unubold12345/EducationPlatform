import "server-only";
import {randomUUID} from "node:crypto";
import {ApiError} from "@/lib/api";
import {getDb} from "@/lib/db";
import type {Prisma} from "@/generated/prisma/client";
import {tutorDay} from "@/modules/tutor/contracts";
import {hostedSpeechKey,hostedTranscript} from "@/modules/speaking-lab/speech-provider";
import {ownMock} from "../service";
import type {ExamState} from "../types";
import {
 GRADE_LIMITS,GRADE_PARTS,blankIeltsSpeaking,blankIeltsWriting,blankToeflWriting,gradableParts,ieltsSpeaking,ieltsSpeakingMessages,ieltsWritingMessages,
 readIeltsSpeaking,readIeltsWriting,readToeflSpeaking,readToeflWriting,spokenWords,toeflSpeaking,toeflSpeakingMessages,toeflWritingMessages,writingGrade,writingItems,
 type GradePart,type GradeView,type IeltsWritingTaskGrade,type Message,type MockGradeResult,type ToeflWritingTaskGrade,type WritingItem,
} from "./contracts";
import {aiFetch,aiFetcher,withAiContext} from "@/modules/ai-usage/server";

// Grading is part of the mock (owner 2026-11-18): no credits. It runs once per finished attempt and part, is saved on
// the server, and is bounded by tries per part and a daily cap per student, since the free mock can be retaken.

type Row={part:string;status:string;tries:number;leaseUntil:Date|null;result:Prisma.JsonValue|null;error:string|null};
type Usage={input:number;output:number;model:string};
const FAILED="AI үнэлгээ энэ удаа амжилтгүй боллоо. Дахин оролдоно уу.";

function view(row:Row,now:number):GradeView {
 const retry=row.tries<GRADE_LIMITS.tries;
 if(row.status==="done")return {status:"done",result:row.result as unknown as MockGradeResult,retry:false};
 if(row.status==="running"&&row.leaseUntil&&row.leaseUntil.getTime()>now)return {status:"running",retry:false};
 if(row.status==="running")return {status:"failed",error:FAILED,retry};
 if(row.status==="failed")return {status:"failed",error:row.error??FAILED,retry};
 return {status:"queued",error:row.error??undefined,retry:true};
}

async function finishedMock(id:string,userId:string) {
 const state=(await ownMock(id,userId)).state as unknown as ExamState;
 if(!state.finishedAt)throw new ApiError(409,"Шалгалт дууссаны дараа AI үнэлгээ гарна.");
 return state;
}
const recordingsOf=(attemptId:string)=>getDb().mockRecording.findMany({where:{attemptId},select:{stageId:true,mime:true}});

/** Speaking stages with neither the examiner's transcript nor a recording yet (a recording may still be uploading). */
function missingSpeech(state:ExamState,recorded:Set<string>) {
 if(state.definition.program==="ielts")return ieltsSpeaking(state).some(part=>!part.questions.some(q=>q.transcript)&&!recorded.has(part.stageId));
 return toeflSpeaking(state).some(item=>!recorded.has(item.stageId));
}
function waiting(state:ExamState,part:GradePart,recorded:Set<string>,now:number) {
 return part==="speaking"&&now<Date.parse(state.finishedAt!)+GRADE_LIMITS.recordingWaitMs&&missingSpeech(state,recorded);
}

/** The saved grades of a finished mock, part by part; a part with nothing saved yet is null (the page asks for it). */
export async function mockGrades(id:string,userId:string) {
 const state=await finishedMock(id,userId),now=Date.now();
 const parts=gradableParts(state);
 const [rows,recordings]=await Promise.all([getDb().mockGrade.findMany({where:{attemptId:id}}),recordingsOf(id)]);
 const recorded=new Set(recordings.map(r=>r.stageId));
 const grades:Partial<Record<GradePart,GradeView|null>>={};
 for(const part of parts){
  const row=rows.find(r=>r.part===part);
  grades[part]=row?view(row,now):waiting(state,part,recorded,now)?{status:"waiting",retry:false}:null;
 }
 return {parts,grades};
}

/** Grades one part of the student's own finished IELTS or TOEFL mock, or returns the grade already saved or running. */
export function gradeMock(id:string,userId:string,body:unknown):Promise<GradeView> {
 // Every provider call of this grading is logged for this student (`ai-usage`); an essay review inside sets its own action.
 return withAiContext({userId,source:"mock-grading"},()=>gradeMockNow(id,userId,body));
}
async function gradeMockNow(id:string,userId:string,body:unknown):Promise<GradeView> {
 const part=(body&&typeof body==="object"&&!Array.isArray(body)&&Object.keys(body).length===1?(body as {part?:unknown}).part:null) as GradePart;
 if(!GRADE_PARTS.includes(part))throw new ApiError(400,"Үнэлэх хэсгээ зөв сонгоно уу.");
 const state=await finishedMock(id,userId);
 if(!gradableParts(state).includes(part))throw new ApiError(404,"Энэ шалгалтад AI-аар үнэлэх ийм хэсэг алга.");
 const db=getDb(),now=Date.now();
 // Like every AI help: not while a timed sitting is open (another mock may be in progress in another tab).
 if(await db.mockAttempt.findFirst({where:{userId,status:"IN_PROGRESS"},select:{id:true}}))throw new ApiError(409,"Нээлттэй байгаа шалгалтаа дуусгасны дараа AI үнэлгээ гарна.");
 const where={attemptId_part:{attemptId:id,part}};
 const existing=await db.mockGrade.findUnique({where});
 if(existing?.status==="done")return view(existing,now);
 const recordings=await recordingsOf(id);
 if(waiting(state,part,new Set(recordings.map(r=>r.stageId)),now))return {status:"waiting",retry:false};
 if(!process.env.DEEPSEEK_API_KEY?.trim())throw new ApiError(503,"AI үнэлгээ одоогоор холбогдоогүй байна.");

 // Database CAS: one grading per attempt and part across workers; a dead worker's lease runs out.
 await db.mockGrade.upsert({where,create:{attemptId:id,part},update:{}});
 const claimed=await db.mockGrade.updateMany({where:{attemptId:id,part,status:{not:"done"},tries:{lt:GRADE_LIMITS.tries},OR:[{leaseUntil:null},{leaseUntil:{lt:new Date(now)}}]},
  data:{status:"running",tries:{increment:1},leaseUntil:new Date(now+GRADE_LIMITS.leaseMs),error:null}});
 if(!claimed.count)return view((await db.mockGrade.findUnique({where}))!,now);

 const limitKey=`education-mock-grade:${userId}:${tutorDay(now)}`;
 await db.rateLimit.upsert({where:{key:limitKey},create:{id:randomUUID(),key:limitKey,count:0,lastRequest:BigInt(0)},update:{}});
 const allowed=await db.rateLimit.updateMany({where:{key:limitKey,count:{lt:GRADE_LIMITS.daily}},data:{count:{increment:1},lastRequest:BigInt(now)}});
 if(!allowed.count){
  const error=`Өнөөдрийн ${GRADE_LIMITS.daily} AI үнэлгээний хязгаарт хүрсэн. Маргааш энэ хуудсыг нээхэд үргэлжилнэ.`;
  await db.mockGrade.updateMany({where:{attemptId:id,part,status:"running"},data:{status:"queued",tries:{decrement:1},leaseUntil:null,error}});
  return {status:"queued",error,retry:true};
 }

 const usage:Usage={input:0,output:0,model:""};
 try{
  const result=part==="writing"?await gradeWriting(state,usage):await gradeSpeaking(id,state,usage);
  const json=JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
  await db.mockGrade.updateMany({where:{attemptId:id,part,status:"running"},data:{status:"done",result:json,leaseUntil:null,error:null,model:usage.model.slice(0,60),inputTokens:usage.input,outputTokens:usage.output}});
  return {status:"done",result,retry:false};
 }catch(error){
  const message=error instanceof ApiError?error.message:FAILED;
  if(!(error instanceof ApiError))console.error("Mock grading failed",error instanceof Error?error.name:"Unknown");
  const row=await db.mockGrade.findUnique({where});
  await db.mockGrade.updateMany({where:{attemptId:id,part,status:"running"},data:{status:"failed",leaseUntil:null,error:message.slice(0,300),inputTokens:usage.input,outputTokens:usage.output}});
  return {status:"failed",error:message,retry:(row?.tries??GRADE_LIMITS.tries)<GRADE_LIMITS.tries};
 }
}

// ---- DeepSeek ----

/** One JSON answer from DeepSeek with thinking, parsed by `read`; asked once more when the reply is unusable. */
async function ask<T>(messages:Message[],read:(json:unknown)=>T|null,usage:Usage):Promise<T> {
 const key=process.env.DEEPSEEK_API_KEY!.trim();
 // Only the checks' mock server changes this; production always talks to DeepSeek.
 const base=(process.env.DEEPSEEK_BASE_URL?.trim()||"https://api.deepseek.com").replace(/\/+$/,"");
 for(let attempt=0;attempt<2;attempt++){
  let response:Response;
  try{
   response=await aiFetch("deepseek",`${base}/chat/completions`,{method:"POST",cache:"no-store",redirect:"error",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},
    body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||"deepseek-flash",thinking:{type:"enabled"},max_tokens:GRADE_LIMITS.maxTokens,response_format:{type:"json_object"},stream:false,messages}),
    signal:AbortSignal.timeout(GRADE_LIMITS.timeoutMs)});
  }catch(error){
   throw new ApiError(503,error instanceof Error&&error.name==="TimeoutError"?"AI үнэлгээ хэт удлаа. Дахин оролдоно уу.":"AI-тай холбогдож чадсангүй. Дахин оролдоно уу.");
  }
  // Never echo a provider error body: it can carry request or credential details.
  if(!response.ok){void response.body?.cancel().catch(()=>{});throw new ApiError(503,response.status===429?"AI ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу.":FAILED);}
  try{
   const data=await response.json();
   usage.input+=Number(data.usage?.prompt_tokens)||0;usage.output+=Number(data.usage?.completion_tokens)||0;
   if(typeof data.model==="string")usage.model=data.model;
   const choice=data.choices?.[0];
   if(choice?.finish_reason==="stop"&&typeof choice.message?.content==="string"&&choice.message.content.length<=60000){
    const value=read(JSON.parse(choice.message.content));
    if(value)return value;
   }
  }catch{/* asked once more below */}
 }
 throw new ApiError(503,"AI үнэлгээний хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
}

/** Fewer words than this is no answer: a blank grade, without asking the model. */
const MIN_WRITTEN=5,MIN_SPOKEN=8;

async function gradeWriting(state:ExamState,usage:Usage):Promise<MockGradeResult> {
 const program=state.definition.program as "ielts"|"toefl";
 const one=(item:WritingItem):Promise<IeltsWritingTaskGrade|ToeflWritingTaskGrade>=>program==="ielts"
  ?item.words<MIN_WRITTEN?Promise.resolve(blankIeltsWriting(item)):ask(ieltsWritingMessages(item),json=>readIeltsWriting(json,item),usage)
  :item.words<MIN_WRITTEN?Promise.resolve(blankToeflWriting(item)):ask(toeflWritingMessages(item),json=>readToeflWriting(json,item),usage);
 return writingGrade(program,await Promise.all(writingItems(state).map(one)));
}

// ---- Speech ----

/** Whisper's words for one stored stage recording (DeepInfra; the local model cannot read the browser's WebM).
 * `scripts/check.mjs` sets GRADING_TRANSCRIBE=off so browser suites never send their recordings to the provider. */
async function transcribeRecording(attemptId:string,stageId:string):Promise<string> {
 const key=process.env.GRADING_TRANSCRIBE==="off"?null:hostedSpeechKey();
 if(!key)throw new ApiError(503,"Speaking бичлэгийг бичвэрт буулгах үйлчилгээ холбогдоогүй байна.");
 const recording=await getDb().mockRecording.findUnique({where:{attemptId_stageId:{attemptId,stageId}},select:{data:true,mime:true}});
 if(!recording)return "";
 const bytes=new Uint8Array(recording.data);
 const mime=(["audio/webm","audio/ogg","audio/mp4"] as const).find(type=>type===recording.mime)??"audio/webm";
 try{
  const text=await hostedTranscript(key,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer,aiFetcher("deepinfra",{source:"mock-transcribe"}),400,mime);
  // Whisper writes bracketed non-speech tags such as [BLANK_AUDIO] or (music) on silence.
  return text.replace(/[[(][^\])]*[\])]/g," ").replace(/\s+/g," ").trim().slice(0,12000);
 }catch{
  throw new ApiError(503,"Speaking бичлэгийг бичвэрт буулгаж чадсангүй. Дахин оролдоно уу.");
 }
}
/** Runs `work` over `items` a few at a time, keeping their order. */
async function limited<T,R>(items:T[],size:number,work:(item:T)=>Promise<R>):Promise<R[]> {
 const out:R[]=[];
 for(let i=0;i<items.length;i+=size)out.push(...await Promise.all(items.slice(i,i+size).map(work)));
 return out;
}

async function gradeSpeaking(attemptId:string,state:ExamState,usage:Usage):Promise<MockGradeResult> {
 const recorded=new Set((await recordingsOf(attemptId)).map(r=>r.stageId));
 if(state.definition.program==="ielts"){
  const parts=ieltsSpeaking(state);
  // The examiner's per-question transcripts when it ran; otherwise the whole stage recording.
  await limited(parts,3,async part=>{if(!part.questions.some(q=>q.transcript))part.recording=recorded.has(part.stageId)?await transcribeRecording(attemptId,part.stageId):"";});
  if(spokenWords(parts)<MIN_SPOKEN)return blankIeltsSpeaking();
  return ask(ieltsSpeakingMessages(parts),json=>readIeltsSpeaking(json,parts),usage);
 }
 const items=toeflSpeaking(state);
 await limited(items,4,async item=>{if(recorded.has(item.stageId))item.transcript=await transcribeRecording(attemptId,item.stageId);});
 const spoken=items.some(item=>item.kind==="interview"&&item.transcript.split(/\s+/).filter(Boolean).length>=3);
 if(!spoken)return readToeflSpeaking(null,items)!;
 return ask(toeflSpeakingMessages(items),json=>readToeflSpeaking(json,items),usage);
}
