import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { getExam } from "@/modules/content/published";
import { createExamState, editExam, expireStages, makeReport, stageFor, stageSeconds, validateExamEdit } from "./engine";
import type { ExamState, PublicExamAttempt } from "./types";
import { MockAccessRequired } from "./payments";
import { mayUseMock, mockAccess, opensMock } from "@/modules/subscriptions/mock-access";

const withRecordings={recordings:{select:{stageId:true,mime:true}}};
type Row=Prisma.MockAttemptGetPayload<{include:typeof withRecordings}>;
function json(state:ExamState):Prisma.InputJsonValue {return JSON.parse(JSON.stringify(state));}
function publicMock(row:Row,state:ExamState,now:number,knownStage?:string):PublicExamAttempt {
  const current=stageFor(state);
  const unchanged=Boolean(current&&knownStage===current.id);
  const stage=current&&!unchanged ? {
    // A routed stage sends only its own route's pages (TOEFL Module 2 holds both routes' texts) and its own length.
    id:current.id,title:current.title,seconds:stageSeconds(state,state.stageIndex),kind:current.kind,instructions:current.instructions,passages:current.passages,
    groups:current.variants?current.groups?.filter(group=>current.questions.some(question=>question.groupId===group.id)):current.groups,
    questions:current.questions.map(({id,number,domain,prompt,passage,options,kind,maxWords,minWords,figure,points,groupId,optionLabels,compactOptions,matcher,context,hsk,toefl,window})=>({id,number,domain,prompt,passage,options,kind,maxWords,minWords,points,groupId,optionLabels,compactOptions,matcher,context,...(figure?{figure}:{}),...(hsk?{hsk}:{}),...(toefl?{toefl}:{}),...(window?{window}:{})})),
  } : null;
  return {id:row.id,slug:row.slug,title:state.definition.title,program:state.definition.program,subject:state.definition.subject,audioRevision:state.definition.audioRevision??1,revision:row.revision,stageIndex:state.stageIndex,
    stage,serverNow:new Date(now).toISOString(),deadline:state.deadline,stageStartedAt:state.stageStartedAt,responses:state.responses,flags:state.flags,
    completed:state.completed,finishedAt:state.finishedAt,timeline:state.definition.stages.map(({title,kind},index)=>({title,seconds:stageSeconds(state,index),kind})),
    report:state.finishedAt ? makeReport(state) : null,recordings:row.recordings,...(unchanged?{stageUnchanged:true}:{})};
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
export async function ownMock(id:string,userId:string) {
  const row=await getDb().mockAttempt.findFirst({where:{id,userId}});
  if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
  if (!row.subscriptionAccess&&!await mayUseMock(userId,row.slug,(row.state as unknown as ExamState).definition.program)) throw new MockAccessRequired(row.slug);
  return row;
}
