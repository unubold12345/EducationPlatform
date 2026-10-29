import "server-only";
import {randomUUID} from "node:crypto";
import {ApiError} from "@/lib/api";
import {getDb} from "@/lib/db";
import {writingLabEnabled} from "@/lib/local-pilot";
import {tutorDay} from "@/modules/tutor/contracts";
import {normalizeWritingReply,validWritingInput,writingMessages} from "./contracts";

const DAILY_LIMIT=40;

async function requireWritingLab(userId:string) {
 if(!writingLabEnabled())throw new ApiError(404,"Туршилтын хуудас идэвхгүй байна.");
 const db=getDb();
 const [mock,paper]=await Promise.all([db.mockAttempt.findFirst({where:{userId,status:"IN_PROGRESS"},select:{id:true}}),db.paperAttempt.findFirst({where:{userId,status:"IN_PROGRESS",deadline:{gt:new Date()}},select:{id:true}})]);
 if(mock||paper)throw new ApiError(403,"Хугацаатай шалгалтаа дуусгасны дараа бичгийн AI туслахыг ашиглана уу.");
}

export async function writingReply(userId:string,body:unknown) {
 if(!validWritingInput(body))throw new ApiError(400,"Бичвэрийн хүсэлт буруу байна. Үгийн тоо болон сэдвээ шалгана уу.");
 await requireWritingLab(userId);
 const key=process.env.DEEPSEEK_API_KEY?.trim();if(!key)throw new ApiError(503,"AI туслах одоогоор холбогдоогүй байна.");
 const db=getDb(),now=Date.now(),limitKey=`education-writing:${userId}:${tutorDay(now)}`,lease=BigInt(now+120000);
 await db.rateLimit.upsert({where:{key:limitKey},create:{id:randomUUID(),key:limitKey,count:0,lastRequest:BigInt(0)},update:{}});
 // Database CAS enforces a daily budget and one in-flight request across workers.
 const reserved=await db.rateLimit.updateMany({where:{key:limitKey,count:{lt:DAILY_LIMIT},lastRequest:{lte:BigInt(now)}},data:{count:{increment:1},lastRequest:lease}});
 if(!reserved.count)throw new ApiError(429,`Өмнөх шалгалт боловсруулж байна эсвэл өдрийн ${DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);
 try {
  const maxTokens=body.action==="feedback"?3600:body.action==="grammar"?2400:1200;
  for(let attempt=0;attempt<2;attempt++){
   let response:Response;
   try{response=await fetch("https://api.deepseek.com/chat/completions",{method:"POST",cache:"no-store",redirect:"error",headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||"deepseek-flash",messages:writingMessages(body),thinking:{type:"disabled"},max_tokens:maxTokens,temperature:body.action==="ideas"?0.7:0.2,response_format:{type:"json_object"},stream:false}),signal:AbortSignal.timeout(body.action==="feedback"?90000:60000)});}
   catch{throw new ApiError(503,"AI туслахтай холбогдож чадсангүй. Бичвэр тань хадгалагдсан хэвээр байна.");}
   // Never echo provider error bodies: they can contain request/credential details.
   if(!response.ok)throw new ApiError(503,response.status===429?"AI туслах ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу.":"AI туслах түр ажиллахгүй байна. Дахин оролдоно уу.");
   let reply=null;
   try{const data=await response.json();const choice=data.choices?.[0];if(choice?.finish_reason==="stop"&&typeof choice.message?.content==="string"&&choice.message.content.length<=24000)reply=normalizeWritingReply(JSON.parse(choice.message.content),body.action,body.essay);}
   catch{reply=null;}
   // One silent retry on malformed model output.
   if(reply){await requireWritingLab(userId);return {...reply,provider:"DeepSeek"};}
  }
  throw new ApiError(503,"AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
 }finally{await db.rateLimit.updateMany({where:{key:limitKey,lastRequest:lease},data:{lastRequest:BigInt(Date.now()+1000)}});}
}
