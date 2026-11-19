import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { getExam } from "@/modules/content/published";
import { createExamState, editExam, expireStages, makeReport, skipStages, stageFor, stageSeconds, validateExamEdit } from "./engine";
import { isAdmin } from "@/modules/admin/service";
import type { ExamState, PublicExamAttempt } from "./types";
import { MockAccessRequired } from "./payments";
import { mayUseMock, mockAccess, opensMock } from "@/modules/subscriptions/mock-access";

const withRecordings={recordings:{select:{stageId:true,mime:true}}};
type Row=Prisma.MockAttemptGetPayload<{include:typeof withRecordings}>;
function json(state:ExamState):Prisma.InputJsonValue {return JSON.parse(JSON.stringify(state));}
/**
 * A sitting the student stopped before its time ran out (owner request 2026-11-18). It is discarded: no result, no
 * review, no AI grading, its recordings deleted, and every reader below refuses it, so it can never show its key.
 * Starting the same mock again opens a new sitting. Plan-month picks are separate rows, so stopping refunds nothing.
 */
export const ENDED_STATUS="ABANDONED";
const ENDED=()=>new ApiError(410,"Энэ шалгалтыг зогсоосон тул хариу, үр дүн хадгалагдаагүй.");
function publicMock(row:Row,state:ExamState,now:number,knownStage?:string):PublicExamAttempt {
  const current=stageFor(state);
  const unchanged=Boolean(current&&knownStage===current.id);
  const stage=current&&!unchanged ? {
    // A routed stage sends only its own route's pages (TOEFL Module 2 holds both routes' texts) and its own length.
    id:current.id,title:current.title,seconds:stageSeconds(state,state.stageIndex),kind:current.kind,instructions:current.instructions,passages:current.passages,
    groups:current.variants?current.groups?.filter(group=>current.questions.some(question=>question.groupId===group.id)):current.groups,
    questions:current.questions.map(({id,number,domain,prompt,passage,options,kind,maxWords,minWords,figure,points,groupId,optionLabels,compactOptions,matcher,context,hsk,toefl,topik,window})=>({id,number,domain,prompt,passage,options,kind,maxWords,minWords,points,groupId,optionLabels,compactOptions,matcher,context,...(figure?{figure}:{}),...(hsk?{hsk}:{}),...(toefl?{toefl}:{}),...(topik?{topik}:{}),...(window?{window}:{})})),
  } : null;
  return {id:row.id,slug:row.slug,title:state.definition.title,program:state.definition.program,subject:state.definition.subject,audioRevision:state.definition.audioRevision??1,revision:row.revision,stageIndex:state.stageIndex,
    stage,serverNow:new Date(now).toISOString(),deadline:state.deadline,stageStartedAt:state.stageStartedAt,responses:state.responses,flags:state.flags,
    completed:state.completed,finishedAt:state.finishedAt,timeline:state.definition.stages.map(({title,kind},index)=>({title,seconds:stageSeconds(state,index),kind})),
    report:state.finishedAt ? makeReport(state) : null,recordings:row.recordings,
    ...(state.skipped?.length?{skipped:state.skipped.map(item=>state.definition.stages.find(stage=>stage.id===item.stageId)?.title??item.stageId)}:{}),...(unchanged?{stageUnchanged:true}:{})};
}
export async function startMock(slug:string,userId:string) {
  const definition=await getExam(slug);
  if (!definition) throw new ApiError(404,"Шалгалт олдсонгүй.");
  const db=getDb();const activeKey=userId+":"+slug;
  const old=await db.mockAttempt.findUnique({where:{activeKey},select:{id:true,subscriptionAccess:true}});
  if(old?.subscriptionAccess)return {id:old.id};
  // Free, bought, an unlimited plan or this plan month's pick (mock-access.ts). Picking is a separate, explicit step.
  const access=await mockAccess(userId,slug,definition.program);
  if (!opensMock(access)) throw new MockAccessRequired(slug);
  if (old) return {id:old.id};
  // A sitting started under a plan (or a plan month's pick, or a 7-day purchase) may be finished and reviewed after the
  // plan, month or purchase ends. A purchase from before the 7-day rule never ends, so it needs no such flag.
  const subscriptionAccess=access.kind==="plan"||access.kind==="picked"||(access.kind==="purchase"&&access.expiresAt!==null);
  try {return await db.mockAttempt.create({data:{userId,slug,activeKey,subscriptionAccess,state:json(createExamState(definition,Date.now()))},select:{id:true}});}
  catch(error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code==="P2002") {
      const winner=await db.mockAttempt.findUnique({where:{activeKey},select:{id:true}});if(winner)return winner;
    }
    throw error;
  }
}
export async function accessMock(id:string,userId:string,input?:unknown,knownStage?:string) {
  return getDb().$transaction(async tx=>{
    let row=await tx.mockAttempt.findFirst({where:{id,userId},include:withRecordings});
    if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
    if(row.status===ENDED_STATUS)throw ENDED();
    if (!row.subscriptionAccess&&!await mayUseMock(userId,row.slug,(row.state as unknown as ExamState).definition.program,tx)) throw new MockAccessRequired(row.slug);
    const state=row.state as unknown as ExamState;const now=Date.now();
    const expired=expireStages(state,now);
    if(input!==undefined&&!expired) {
      if(state.finishedAt)throw new ApiError(409,"Дууссан шалгалтын хариуг өөрчлөх боломжгүй.");
      if(!validateExamEdit(state,input,now))throw new ApiError(400,"Одоогийн хэсгийн хариуг зөв хэлбэрээр илгээнэ үү.");
      if(input.revision!==row.revision)throw new ApiError(409,"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.");
      editExam(state,input);
    }
    if(expired||input!==undefined) {
      const changed=await tx.mockAttempt.updateMany({where:{id,userId,revision:row.revision},data:{state:json(state),revision:{increment:1},...(state.finishedAt?{status:"SUBMITTED",activeKey:null}:{})}});
      if(changed.count!==1)throw new ApiError(409,"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.");
      row={...row,revision:row.revision+1};
    }
    return publicMock(row,state,now,knownStage);
  });
}
/**
 * Admin testing only (owner request 2026-11-19, a stated exception to the no-timer-bypass rule): an admin closes the
 * current stage of their own open sitting ("stage") or every remaining stage ("finish") and gets the next stage or the
 * result. Admin membership is checked here on every call (hosted demo accounts never count); the open page's answers
 * for the current stage are saved first with the usual validation and revision check; the skip is recorded on the
 * sitting and in the admin audit log.
 */
export async function skipMock(id:string,userId:string,input:unknown) {
  if(!await isAdmin(userId))throw new ApiError(403,"Зөвхөн админд нээлттэй.");
  const mode=input&&typeof input==="object"?(input as {mode?:unknown}).mode:undefined;
  if(mode!=="stage"&&mode!=="finish")throw new ApiError(400,"Алгасах хэлбэрийг сонгоно уу.");
  return getDb().$transaction(async tx=>{
    const row=await tx.mockAttempt.findFirst({where:{id,userId},include:withRecordings});
    if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
    if(row.status===ENDED_STATUS)throw ENDED();
    if (!row.subscriptionAccess&&!await mayUseMock(userId,row.slug,(row.state as unknown as ExamState).definition.program,tx)) throw new MockAccessRequired(row.slug);
    const state=row.state as unknown as ExamState;const now=Date.now();
    const from=state.stageIndex;
    // Time already ran out: the stage closes as usual and nothing is skipped.
    if(!expireStages(state,now)&&!state.finishedAt){
      if(!validateExamEdit(state,input,now))throw new ApiError(400,"Одоогийн хэсгийн хариуг зөв хэлбэрээр илгээнэ үү.");
      if(input.revision!==row.revision)throw new ApiError(409,"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.");
      editExam(state,input);
      skipStages(state,now,mode);
      await tx.adminAudit.create({data:{actorId:userId,action:"skip-mock-stage",target:id,reason:mode==="finish"?"Цагтай mock-ийг эрт дуусгаж дүнг нээсэн":"Цагтай mock-ийн хэсгийг алгассан",details:{slug:row.slug,mode,fromStage:from,toStage:state.stageIndex,finished:Boolean(state.finishedAt)}}});
    }
    const changed=await tx.mockAttempt.updateMany({where:{id,userId,revision:row.revision},data:{state:json(state),revision:{increment:1},...(state.finishedAt?{status:"SUBMITTED",activeKey:null}:{})}});
    if(changed.count!==1)throw new ApiError(409,"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.");
    return publicMock({...row,revision:row.revision+1},state,now);
  });
}
export async function ownMock(id:string,userId:string) {
  const row=await getDb().mockAttempt.findFirst({where:{id,userId}});
  if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
  if(row.status===ENDED_STATUS)throw ENDED();
  if (!row.subscriptionAccess&&!await mayUseMock(userId,row.slug,(row.state as unknown as ExamState).definition.program)) throw new MockAccessRequired(row.slug);
  return row;
}

/**
 * Stops the student's own open sitting and discards it. A sitting whose time has already run out is not discarded:
 * it is saved as finished, like any read would, and the page opens its results. Ending needs no plan or purchase.
 */
export async function endMock(id:string,userId:string):Promise<{status:"ended"|"finished";slug:string}> {
  const db=getDb();
  for(let attempt=0;attempt<3;attempt++){
    const row=await db.mockAttempt.findFirst({where:{id,userId},select:{status:true,revision:true,slug:true,state:true}});
    if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
    if(row.status===ENDED_STATUS)return {status:"ended",slug:row.slug};
    const state=row.state as unknown as ExamState;
    if(row.status!=="IN_PROGRESS"||state.finishedAt)return {status:"finished",slug:row.slug};
    const finished=expireStages(state,Date.now())&&Boolean(state.finishedAt);
    // Revision CAS: an autosave from the open page between the read and this write retries the read.
    const changed=await db.mockAttempt.updateMany({where:{id,userId,status:"IN_PROGRESS",revision:row.revision},
      data:finished?{state:json(state),revision:{increment:1},status:"SUBMITTED",activeKey:null}:{status:ENDED_STATUS,activeKey:null,revision:{increment:1}}});
    if(changed.count!==1)continue;
    if(finished)return {status:"finished",slug:row.slug};
    await Promise.all([db.mockRecording.deleteMany({where:{attemptId:id}}),db.mockGrade.deleteMany({where:{attemptId:id}})]);
    return {status:"ended",slug:row.slug};
  }
  throw new ApiError(409,"Шалгалт яг одоо хадгалагдаж байна. Дахин оролдоно уу.");
}
