import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { sourceContent } from "./published";
import { findExercise } from "@/modules/exercises/content";
import { validateContentShape,validateAnswerKeys } from "./validation";
import { applyQuestionFix,fixChanges } from "./fix";
import type { ExerciseSet } from "@/modules/exercises/types";
import type { Prisma } from "@/generated/prisma/client";
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
export async function editContent(actorId:string,key:string,input:unknown) {
  const base=sourceContent(key);if(!base)throw new ApiError(404,"Материал олдсонгүй.");
  if(!input||typeof input!=="object"||Array.isArray(input))throw new ApiError(400,"Хүсэлт буруу.");
  const body=input as Record<string,unknown>;
  if(Object.keys(body).some(key=>!["action","revision","body","provenance","reason","path","patch"].includes(key)))throw new ApiError(400,"Танигдаагүй талбар.");
  const {action,revision,provenance,reason}=body;
  if(action==="fix")return fixQuestion(actorId,key,base,body);
  if(!["save","review","publish"].includes(String(action))||!Number.isInteger(revision)||Number(revision)<0||typeof reason!=="string"||reason.trim().length<5||reason.length>1000)throw new ApiError(400,"Үйлдэл, хувилбар эсвэл шалтгаан буруу.");
  if(action==="save"&&(typeof provenance!=="string"||provenance.trim().length<10||provenance.length>1000||!validateContentShape(base,body.body)||!validateAnswerKeys(body.body)))throw new ApiError(400,"Материалын бүтэц, хариу эсвэл эх сурвалж буруу. ID, асуултын тоо, шалгалтын стандарт хугацааг өөрчлөхгүй.");
  try{return await getDb().$transaction(async tx=>{
    if(!await tx.adminMembership.findUnique({where:{userId:actorId}}))throw new ApiError(403,"Админ эрх шаардлагатай.");
    const draft=await tx.contentDraft.findUnique({where:{key}});
    if((draft?.revision??0)!==revision)throw new ApiError(409,"Өөр хянагч шинэчилсэн байна. Хуудсаа шинэчилнэ үү.");
    if(action==="save") {
      if(draft){const change=await tx.contentDraft.updateMany({where:{key,revision:draft.revision},data:{body:json(body.body),provenance:String(provenance).trim(),editorId:actorId,reviewerId:null,status:"DRAFT",revision:{increment:1}}});if(!change.count)throw new ApiError(409,"Ноорог өөрчлөгдсөн байна.");}
      else await tx.contentDraft.create({data:{key,body:json(body.body),provenance:String(provenance).trim(),editorId:actorId}});
    }else{
      if(!draft||!validateContentShape(base,draft.body)||!validateAnswerKeys(draft.body))throw new ApiError(400,"Хүчинтэй ноорог эхлээд хадгална уу.");
      // Owner policy: one admin may publish a saved draft directly; review stays optional.
      if(action==="publish"&&draft.status==="PUBLISHED")throw new ApiError(409,"Энэ ноорог аль хэдийн нийтлэгдсэн.");
      if(action==="review"&&draft.status!=="DRAFT")throw new ApiError(409,"Зөвхөн хадгалсан ноорогийг хянана.");
      const reviewer=draft.reviewerId??actorId;
      const changed=await tx.contentDraft.updateMany({where:{key,revision:draft.revision,status:draft.status},data:{status:action==="review"?"REVIEWED":"PUBLISHED",reviewerId:action==="review"?actorId:reviewer,revision:{increment:1}}});
      if(!changed.count)throw new ApiError(409,"Ноорог өөрчлөгдсөн байна.");
      if(action==="publish")await publishVersion(tx,key,draft.body,draft.provenance,actorId,reviewer);
    }
    await tx.adminAudit.create({data:{actorId,action:"content-"+action,target:key,reason:reason.trim(),details:{fromRevision:Number(revision),toRevision:Number(revision)+1}}});
    return tx.contentDraft.findUniqueOrThrow({where:{key},select:{revision:true,status:true}});
  },{timeout:15000});}catch(error){
    if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")throw new ApiError(409,"Өөр хянагч шинэчилсэн байна. Хуудсаа шинэчилнэ үү.");
    throw error;
  }
}

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["$transaction"]>[0]>[0];
async function publishVersion(tx:Tx,key:string,body:Prisma.JsonValue,provenance:string,actorId:string,reviewerId:string) {
  const last=await tx.publishedContent.findFirst({where:{key},orderBy:{version:"desc"},select:{version:true}});
  const version=(last?.version??1)+1;
  await tx.publishedContent.create({data:{key,version,body:body as Prisma.InputJsonValue,provenance,publishedBy:actorId,reviewedBy:reviewerId}});
  await tx.contentReview.upsert({where:{key},create:{key,status:"REVIEWED",notes:provenance,reviewerId},update:{status:"REVIEWED",notes:provenance,reviewerId}});
  if(findExercise(key)) {
    const set=body as unknown as ExerciseSet;
    const ids:string[]=[];
    for(const q of set.questions){const stable=q.id.replace(/-v1$/,"");const id=stable+"-published-v"+version;ids.push(id);
      await tx.questionVersion.create({data:{id,questionId:stable,version,prompt:q.prompt,options:q.options,correct:q.correct,explanation:q.explanation,provenance}});
    }
    const examId=key+"-published-v"+version;
    await tx.exam.create({data:{id:examId,slug:examId,programId:set.program,title:set.title,version,scoringVersion:"raw-correct-v1",items:{create:ids.map((id,position)=>({questionVersionId:id,position}))}}});
  }
  return version;
}

// Fix one question and publish it as a new version in one step. Works from the latest published
// body; an unpublished draft must be published or saved over first so its edits are not lost.
async function fixQuestion(actorId:string,key:string,base:unknown,input:Record<string,unknown>) {
  const {revision,reason,path,patch}=input;
  if(!Number.isInteger(revision)||Number(revision)<0||typeof reason!=="string"||reason.trim().length<5||reason.length>1000)throw new ApiError(400,"Хувилбар эсвэл шалтгаан буруу.");
  try{return await getDb().$transaction(async tx=>{
    if(!await tx.adminMembership.findUnique({where:{userId:actorId}}))throw new ApiError(403,"Админ эрх шаардлагатай.");
    const draft=await tx.contentDraft.findUnique({where:{key}});
    if((draft?.revision??0)!==revision)throw new ApiError(409,"Өөр хянагч шинэчилсэн байна. Хуудсаа шинэчилнэ үү.");
    if(draft&&draft.status!=="PUBLISHED")throw new ApiError(409,"Нийтлээгүй ноорог байна. Эхлээд түүнийг нийтэлнэ үү.");
    const latest=await tx.publishedContent.findFirst({where:{key},orderBy:{version:"desc"},select:{body:true}});
    const current=latest?.body??JSON.parse(JSON.stringify(base));
    const next=applyQuestionFix(current,path,patch);
    if(!next||!validateContentShape(base,next)||!validateAnswerKeys(next))throw new ApiError(400,"Засвар буруу байна. Сонголтын тоо, ID өөрчлөгдөхгүй; зөв хариу сонголтуудын нэг байх ёстой.");
    const changes=fixChanges(current,next,path as (string|number)[]);
    if(!Object.keys(changes).length)throw new ApiError(400,"Өөрчлөлт алга.");
    const provenance="Асуултын засвар: "+reason.trim();
    const version=await publishVersion(tx,key,json(next) as Prisma.JsonValue,provenance,actorId,actorId);
    await tx.contentDraft.upsert({where:{key},create:{key,body:json(next),provenance,editorId:actorId,reviewerId:actorId,status:"PUBLISHED"},update:{body:json(next),provenance,editorId:actorId,reviewerId:actorId,status:"PUBLISHED",revision:{increment:1}}});
    await tx.adminAudit.create({data:{actorId,action:"content-fix",target:key,reason:reason.trim(),details:json({version,path,changes})}});
    return {...await tx.contentDraft.findUniqueOrThrow({where:{key},select:{revision:true,status:true}}),version};
  },{timeout:15000});}catch(error){
    if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")throw new ApiError(409,"Өөр хянагч шинэчилсэн байна. Хуудсаа шинэчилнэ үү.");
    throw error;
  }
}
