import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { getExam } from "@/modules/content/published";
import { createExamState, editExam, expireStages, makeReport, stageFor, validateExamEdit } from "./engine";
import type { ExamState, PublicExamAttempt } from "./types";
import { MockAccessRequired } from "./payments";
import { hasSubscription } from "@/modules/subscriptions/access";

const withRecordings={recordings:{select:{stageId:true,mime:true}}};
type Row=Prisma.MockAttemptGetPayload<{include:typeof withRecordings}>;
function json(state:ExamState):Prisma.InputJsonValue {return JSON.parse(JSON.stringify(state));}
function publicMock(row:Row,state:ExamState,now:number):PublicExamAttempt {
  const current=stageFor(state);
  const stage=current ? {
    id:current.id,title:current.title,seconds:current.seconds,kind:current.kind,instructions:current.instructions,passages:current.passages,
    questions:current.questions.map(({id,domain,prompt,passage,options,kind,maxWords,minWords})=>({id,domain,prompt,passage,options,kind,maxWords,minWords})),
  } : null;
  return {id:row.id,slug:row.slug,title:state.definition.title,program:state.definition.program,revision:row.revision,stageIndex:state.stageIndex,
    stage,serverNow:new Date(now).toISOString(),deadline:state.deadline,stageStartedAt:state.stageStartedAt,responses:state.responses,flags:state.flags,
    completed:state.completed,finishedAt:state.finishedAt,timeline:state.definition.stages.map(({title,seconds,kind})=>({title,seconds,kind})),
    report:state.finishedAt ? makeReport(state) : null,recordings:row.recordings};
}
export async function startMock(slug:string,userId:string) {
  const definition=await getExam(slug);
  if (!definition) throw new ApiError(404,"Шалгалт олдсонгүй.");
  const db=getDb();const activeKey=userId+":"+slug;
  const old=await db.mockAttempt.findUnique({where:{activeKey},select:{id:true,subscriptionAccess:true}});
  if(old?.subscriptionAccess)return {id:old.id};
  const subscribed=await hasSubscription(userId,definition.program);
  if (!subscribed&&!await db.mockPurchase.findFirst({where:{userId,examSlug:slug,status:"PAID"},select:{id:true}})) throw new MockAccessRequired(slug);
  if (old) return {id:old.id};
  try {return await db.mockAttempt.create({data:{userId,slug,activeKey,subscriptionAccess:subscribed,state:json(createExamState(definition,Date.now()))},select:{id:true}});}
  catch(error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code==="P2002") {
      const winner=await db.mockAttempt.findUnique({where:{activeKey},select:{id:true}});if(winner)return winner;
    }
    throw error;
  }
}
export async function accessMock(id:string,userId:string,input?:unknown) {
  return getDb().$transaction(async tx=>{
    let row=await tx.mockAttempt.findFirst({where:{id,userId},include:withRecordings});
    if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
    if (!row.subscriptionAccess&&!await tx.mockPurchase.findFirst({where:{userId,examSlug:row.slug,status:"PAID"},select:{id:true}})&&!await hasSubscription(userId,(row.state as unknown as ExamState).definition.program,tx)) throw new MockAccessRequired(row.slug);
    const state=row.state as unknown as ExamState;const now=Date.now();
    const expired=expireStages(state,now);
    if(input!==undefined&&!expired) {
      if(state.finishedAt)throw new ApiError(409,"Дууссан шалгалтын хариуг өөрчлөх боломжгүй.");
      if(!validateExamEdit(state,input))throw new ApiError(400,"Одоогийн хэсгийн хариуг зөв хэлбэрээр илгээнэ үү.");
      if(input.revision!==row.revision)throw new ApiError(409,"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.");
      editExam(state,input);
    }
    if(expired||input!==undefined) {
      const changed=await tx.mockAttempt.updateMany({where:{id,userId,revision:row.revision},data:{state:json(state),revision:{increment:1},...(state.finishedAt?{status:"SUBMITTED",activeKey:null}:{})}});
      if(changed.count!==1)throw new ApiError(409,"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.");
      row={...row,revision:row.revision+1};
    }
    return publicMock(row,state,now);
  });
}
export async function ownMock(id:string,userId:string) {
  const row=await getDb().mockAttempt.findFirst({where:{id,userId}});
  if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
  if (!row.subscriptionAccess&&!await getDb().mockPurchase.findFirst({where:{userId,examSlug:row.slug,status:"PAID"},select:{id:true}})&&!await hasSubscription(userId,(row.state as unknown as ExamState).definition.program)) throw new MockAccessRequired(row.slug);
  return row;
}
