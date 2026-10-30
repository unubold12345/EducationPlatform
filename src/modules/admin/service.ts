import { allOfficialPapers,slotsForPaper } from "@/modules/papers/catalog";
import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { exerciseSets } from "@/modules/exercises/content";
import { examDefinitions } from "@/modules/exams/definitions";
import { guidedTasks } from "@/modules/exercises/guided";
import { addCalendarMonth, findSubscriptionPlan, validPlanPrice } from "@/modules/subscriptions/plans";
import { revalidatePath } from "next/cache";
import { authFeatures, isDemoEmail } from "@/lib/auth-features";

export async function isAdmin(userId: string) {
  const membership = await getDb().adminMembership.findUnique({where:{userId},select:{userId:true,user:{select:{email:true}}}});
  return Boolean(membership && !(authFeatures(process.env).hostedDemo && isDemoEmail(membership.user.email)));
}
export async function assertAdmin(userId: string) {
  if (!await isAdmin(userId)) throw new ApiError(403,"Зөвхөн админд нээлттэй.");
}
export function contentCatalog() {
  return [
    ...allOfficialPapers.map(paper=>({key:paper.slug,title:paper.title,program:paper.program,kind:"Албан материал",count:slotsForPaper(paper).length,href:"/exams/"+paper.slug})),
    ...exerciseSets.map(set=>({key:set.slug,title:set.title,program:set.program,kind:"Дасгал",count:set.questions.length,href:"/exercises/"+set.slug})),
    ...examDefinitions.map(exam=>({key:exam.slug,title:exam.title,program:exam.program,kind:"Бүтэн mock",count:exam.program==="sat"?98:80,href:"/exams/"+exam.slug})),
    ...guidedTasks.map(task=>({key:task.slug,title:task.title,program:"ielts",kind:"Workshop",count:1,href:"/workshops/"+task.slug})),
  ];
}
export async function adminMutation(actorId:string, input:unknown) {
  if(!input || typeof input!=="object" || Array.isArray(input))throw new ApiError(400,"Хүсэлтийн бүтэц буруу.");
  const body=input as Record<string,unknown>;
  const allowed=["action","target","reason","program","status","amount"];
  if(Object.keys(body).some(key=>!allowed.includes(key)))throw new ApiError(400,"Танигдаагүй талбар.");
  const {action,target,reason,program,status,amount}=body;
  if(typeof action!=="string"||typeof target!=="string"||!target||target.length>150||typeof reason!=="string"||reason.trim().length<5||reason.length>1000)throw new ApiError(400,"Шалтгааныг 5–1000 тэмдэгтээр бичнэ үү.");
  if(!["grant-month","expire-plan","revoke-sessions","review-content","suspend","unsuspend","add-note","set-price"].includes(action))throw new ApiError(400,"Үйлдэл зөвшөөрөгдөөгүй.");
  if(action==="set-price"&&(!findSubscriptionPlan(target)||!validPlanPrice(amount)))throw new ApiError(400,"Үнэ ₮1,000–₮1,000,000 хооронд, 100-д хуваагдах бүхэл тоо байна.");
  if(action==="review-content" && (!contentCatalog().some(item=>item.key===target)||!["PENDING","IN_REVIEW","REVIEWED","CHANGES_NEEDED"].includes(String(status))))throw new ApiError(400,"Контент эсвэл төлөв буруу.");
  if(["grant-month","expire-plan"].includes(action)&&!findSubscriptionPlan(program))throw new ApiError(400,"Багц буруу.");
  const result=await getDb().$transaction(async tx=>{
    // Recheck membership inside the same transaction as every privileged write.
    const membership = await tx.adminMembership.findUnique({where:{userId:actorId},select:{userId:true,user:{select:{email:true}}}});
    if(!membership || (authFeatures(process.env).hostedDemo && isDemoEmail(membership.user.email)))throw new ApiError(403,"Админ эрх шаардлагатай.");
    let details:Record<string,unknown>={};
    if(action==="set-price") {
      const plan=findSubscriptionPlan(target)!;
      const before=await tx.planPrice.findUnique({where:{program:plan.program}});
      await tx.planPrice.upsert({where:{program:plan.program},create:{program:plan.program,amountMnt:Number(amount),updatedBy:actorId},update:{amountMnt:Number(amount),updatedBy:actorId}});
      details={program:plan.program,before:before?.amountMnt??plan.amountMnt,after:amount,paidOrdersChanged:false};
    } else if(action==="review-content") {
      const before=await tx.contentReview.findUnique({where:{key:target}});
      await tx.contentReview.upsert({where:{key:target},create:{key:target,status:String(status),notes:reason.trim(),reviewerId:actorId},update:{status:String(status),notes:reason.trim(),reviewerId:actorId}});
      details={before:before?.status??"PENDING",after:status};
    } else {
      if(!await tx.user.findUnique({where:{id:target},select:{id:true}}))throw new ApiError(404,"Хэрэглэгч олдсонгүй.");
      const subject=await tx.user.findUniqueOrThrow({where:{id:target},select:{suspendedAt:true,adminMembership:{select:{userId:true}}}});
      if(action==="suspend") {
        if(target===actorId||subject.adminMembership)throw new ApiError(400,"Админ бүртгэлийг түр хаахгүй.");
        if(subject.suspendedAt)throw new ApiError(409,"Бүртгэл аль хэдийн хаагдсан.");
        await tx.user.update({where:{id:target},data:{suspendedAt:new Date(),suspendedReason:reason.trim()}});
        details={suspended:true,revoked:(await tx.session.deleteMany({where:{userId:target}})).count};
      } else if(action==="unsuspend") {
        if(!subject.suspendedAt)throw new ApiError(409,"Бүртгэл хаагдаагүй байна.");
        await tx.user.update({where:{id:target},data:{suspendedAt:null,suspendedReason:null}});
        details={suspended:false,since:subject.suspendedAt.toISOString()};
      } else if(action==="add-note") {
        const note=await tx.adminNote.create({data:{userId:target,authorId:actorId,text:reason.trim()}});
        details={note:note.id};
      } else if(action==="revoke-sessions") {
        if(target===actorId)throw new ApiError(400,"Өөрийн идэвхтэй удирдлагын сессийг эндээс хаахгүй.");
        details={revoked:(await tx.session.deleteMany({where:{userId:target}})).count};
      } else {
        const plan=String(program); const now=new Date();
        const before=await tx.subscription.findUnique({where:{userId_program:{userId:target,program:plan}}});
        if(action==="expire-plan"&&!before)throw new ApiError(404,"Сарын эрх олдсонгүй.");
        const active=before&&before.startsAt<=now&&before.endsAt>now;
        const end=action==="expire-plan"?now:addCalendarMonth(active?before.endsAt:now);
        const start=action==="expire-plan"?new Date(Math.min(before!.startsAt.getTime(),now.getTime())):active?before.startsAt:now;
        await tx.subscription.upsert({where:{userId_program:{userId:target,program:plan}},create:{userId:target,program:plan,startsAt:start,endsAt:end},update:{startsAt:start,endsAt:end}});
        details={program:plan,before:before?.endsAt.toISOString()??null,after:end.toISOString(),paymentCreated:false};
      }
    }
    await tx.adminAudit.create({data:{actorId,action,target,reason:reason.trim(),details:JSON.parse(JSON.stringify(details))}});
    return {ok:true};
  });
  if(action==="set-price"){revalidatePath("/plans");revalidatePath("/programs/[slug]","page");}
  return result;
}
// Round-trip time of a trivial query, shared by the health endpoint and the admin system panel.
export async function databaseLatency() {
  const started = performance.now();
  await getDb().$queryRaw`SELECT 1`;
  return Math.round(performance.now() - started);
}
