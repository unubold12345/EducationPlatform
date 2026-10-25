import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { hasSubscription } from "@/modules/subscriptions/access";
import { findOfficialPaper,type OfficialPaper } from "./catalog";
import { keyForPaper } from "./key";
import { validPaperResponses,gradePaper,type PaperKey,type PaperResponses } from "./engine";
const json=(value:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(value));
export async function paperAccess(userId:string,slug:string){return Boolean(await getDb().mockPurchase.findFirst({where:{userId,examSlug:slug,status:"PAID"},select:{id:true}}))||await hasSubscription(userId,"entrance");}
export async function startPaper(userId:string,slug:string){
 const officialPaper=findOfficialPaper(slug);if(!officialPaper)throw new ApiError(404,"Шалгалт олдсонгүй.");
 const db=getDb();const activeKey=userId+":"+officialPaper.slug;
 const old=await db.paperAttempt.findUnique({where:{activeKey},select:{id:true}});if(old)return old;
 if(!await paperAccess(userId,slug))throw new ApiError(402,"Энэ шалгалтын эрх эсвэл University Prep сарын багц шаардлагатай.");
 try{return await db.paperAttempt.create({data:{userId,slug:officialPaper.slug,activeKey,deadline:new Date(Date.now()+officialPaper.seconds*1000),snapshot:json({paper:officialPaper,key:keyForPaper(officialPaper)}),responses:{}},select:{id:true}});}catch(error){
  if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002"){const winner=await db.paperAttempt.findUnique({where:{activeKey},select:{id:true}});if(winner)return winner;}throw error;
 }
}
export async function paperAttempt(id:string,userId:string,input?:unknown){
 try{return await getDb().$transaction(async tx=>{
  let row=await tx.paperAttempt.findFirst({where:{id,userId}});if(!row)throw new ApiError(404,"Шалгалт олдсонгүй.");
  const snapshot=row.snapshot as unknown as {paper:OfficialPaper;key:PaperKey};
  const now=new Date();const expired=now>=row.deadline;
  if(row.status==="IN_PROGRESS"&&(expired||input!==undefined)){
   let responses=row.responses as PaperResponses;let submit=expired;
   if(!expired){
    if(!input||typeof input!=="object"||Array.isArray(input))throw new ApiError(400,"Хүсэлт буруу.");
    const body=input as Record<string,unknown>;
    if(Object.keys(body).sort().join(",")!=="responses,revision,submit"||!Number.isInteger(body.revision)||typeof body.submit!=="boolean"||!validPaperResponses(body.responses,snapshot.key))throw new ApiError(400,"Хариултын бүтэц буруу.");
    if(body.revision!==row.revision)throw new ApiError(409,"Өөр цонхонд шинэ хадгалалт байна. Хадгалсан хувилбарыг ачаална уу.");
    responses=body.responses;submit=body.submit;
   }
   const changed=await tx.paperAttempt.updateMany({where:{id,userId,status:"IN_PROGRESS",revision:row.revision},data:{responses:json(responses),revision:{increment:1},...(submit?{status:"SUBMITTED",activeKey:null,finishedAt:expired?row.deadline:now}:{})}});
   if(changed.count!==1)throw new ApiError(409,"Өөр цонхонд шинэ хадгалалт байна.");
   row=await tx.paperAttempt.findUniqueOrThrow({where:{id}});
  }
  return {id:row.id,paper:snapshot.paper,status:row.status,revision:row.revision,deadline:row.deadline.toISOString(),serverNow:now.toISOString(),responses:row.responses as PaperResponses,finishedAt:row.finishedAt?.toISOString()??null,report:row.status==="SUBMITTED"?gradePaper(snapshot.key,row.responses as PaperResponses):null,keySources:row.status==="SUBMITTED"?snapshot.key.sourceUrls:[]};
 });}catch(error){
  if(error instanceof ApiError&&error.status===409&&input&&typeof input==="object"&&"submit" in input&&input.submit===true){
   const saved=await getDb().paperAttempt.findFirst({where:{id,userId,status:"SUBMITTED"},select:{id:true}});if(saved)return paperAttempt(id,userId);
  }
  throw error;
 }
}
