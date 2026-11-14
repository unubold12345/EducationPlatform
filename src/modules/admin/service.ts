import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceMocks } from "@/modules/exams/entrance/catalog";
import { freeMocks } from "@/modules/exams/free/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { guidedTasks } from "@/modules/workshops/guided";
import { addCalendarMonth, findAnyPlan, findSubscriptionPlan, validPlanPrice } from "@/modules/subscriptions/plans";
import { revalidatePath } from "next/cache";
import { authFeatures, isDemoEmail } from "@/lib/auth-features";
import { CREDIT_ALLOWANCE_LIMITS, CREDIT_GRANT_LIMITS, CREDIT_PACK_LIMITS, creditPeriod, defaultAllowances, isAllowanceKey, validAllowance, validCreditPack, validGrant } from "@/modules/credits/pricing";
import { CREDIT_PACK_KEY, creditPack } from "@/modules/credits/purchase";

export async function isAdmin(userId: string) {
  const membership = await getDb().adminMembership.findUnique({where:{userId},select:{userId:true,user:{select:{email:true}}}});
  return Boolean(membership && !(authFeatures(process.env).hostedDemo && isDemoEmail(membership.user.email)));
}
export async function assertAdmin(userId: string) {
  if (!await isAdmin(userId)) throw new ApiError(403,"Зөвхөн админд нээлттэй.");
}
export function contentCatalog() {
  return [
    ...examDefinitions.map(exam=>({key:exam.slug,title:exam.title,program:exam.program,kind:"Бүтэн mock",count:exam.stages.reduce((sum,stage)=>sum+(stage.variants?stage.variants.lower.length:stage.questions.length),0),href:"/exams/"+exam.slug})),
    ...entranceMocks.map(exam=>({key:exam.slug,title:exam.title,program:"entrance" as const,kind:"ЭЕШ mock",count:exam.questionCount,href:"/exams/"+exam.slug})),
    ...jlptMocks.map(exam=>({key:exam.slug,title:exam.title,program:"jlpt" as const,kind:"JLPT mock",count:exam.questions,href:"/exams/"+exam.slug})),
    ...hskMocks.map(exam=>({key:exam.slug,title:exam.title,program:"hsk" as const,kind:"HSK mock",count:exam.questions,href:"/exams/"+exam.slug})),
    // The free half-length mocks can be fixed like any other mock (published versions, exact-version grading).
    ...freeMocks.map(exam=>({key:exam.slug,title:exam.title,program:exam.program,kind:"Үнэгүй хагас mock",count:exam.questions,href:"/exams/"+exam.slug})),
    ...guidedTasks.map(task=>({key:task.slug,title:task.title,program:"ielts",kind:"Workshop",count:1,href:"/workshops/"+task.slug})),
  ];
}
export async function adminMutation(actorId:string, input:unknown) {
  if(!input || typeof input!=="object" || Array.isArray(input))throw new ApiError(400,"Хүсэлтийн бүтэц буруу.");
  const body=input as Record<string,unknown>;
  const allowed=["action","target","reason","program","status","amount","credits"];
  if(Object.keys(body).some(key=>!allowed.includes(key)))throw new ApiError(400,"Танигдаагүй талбар.");
  const {action,target,reason,program,status,amount,credits}=body;
  if(typeof action!=="string"||typeof target!=="string"||!target||target.length>150||typeof reason!=="string"||reason.trim().length<5||reason.length>1000)throw new ApiError(400,"Шалтгааныг 5–1000 тэмдэгтээр бичнэ үү.");
  if(!["grant-month","expire-plan","revoke-sessions","review-content","suspend","unsuspend","add-note","set-price","grant-credits","set-credits","set-credit-pack"].includes(action))throw new ApiError(400,"Үйлдэл зөвшөөрөгдөөгүй.");
  if(action==="grant-credits"&&!validGrant(amount))throw new ApiError(400,`Кредит ${CREDIT_GRANT_LIMITS.min}–${CREDIT_GRANT_LIMITS.max.toLocaleString("en-US")} хооронд бүхэл тоо байна.`);
  if(action==="set-credits"&&(!isAllowanceKey(target)||!validAllowance(amount)))throw new ApiError(400,`Сарын кредит ${CREDIT_ALLOWANCE_LIMITS.min}–${CREDIT_ALLOWANCE_LIMITS.max.toLocaleString("en-US")} хооронд бүхэл тоо байна.`);
  if(action==="set-credit-pack"&&(target!==CREDIT_PACK_KEY||!validCreditPack(credits,amount)))throw new ApiError(400,`Кредит ${CREDIT_PACK_LIMITS.credits.min}–${CREDIT_PACK_LIMITS.credits.max.toLocaleString("en-US")}, үнэ ₮${CREDIT_PACK_LIMITS.amountMnt.min.toLocaleString("en-US")}–₮${CREDIT_PACK_LIMITS.amountMnt.max.toLocaleString("en-US")} (100-д хуваагдах) бүхэл тоо байна.`);
  if(action!=="set-credit-pack"&&credits!==undefined)throw new ApiError(400,"Танигдаагүй талбар.");
  if(action==="set-price"&&(!findSubscriptionPlan(target)||!validPlanPrice(amount)))throw new ApiError(400,"Үнэ ₮1,000–₮1,000,000 хооронд, 100-д хуваагдах бүхэл тоо байна.");
  if(action==="review-content" && (!contentCatalog().some(item=>item.key===target)||!["PENDING","IN_REVIEW","REVIEWED","CHANGES_NEEDED"].includes(String(status))))throw new ApiError(400,"Контент эсвэл төлөв буруу.");
  // A month is granted only on a plan that is on sale; a retired plan (IELTS, SAT) can still be ended early.
  if(action==="grant-month"&&!findSubscriptionPlan(program))throw new ApiError(400,"Багц буруу.");
  if(action==="expire-plan"&&!findAnyPlan(program))throw new ApiError(400,"Багц буруу.");
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
    } else if(action==="set-credits") {
      const key=target as keyof ReturnType<typeof defaultAllowances>;
      const before=await tx.creditAllowance.findUnique({where:{key}});
      await tx.creditAllowance.upsert({where:{key},create:{key,credits:Number(amount),updatedBy:actorId},update:{credits:Number(amount),updatedBy:actorId}});
      details={key,before:before?.credits??defaultAllowances()[key],after:amount};
    } else if(action==="set-credit-pack") {
      // Unpaid credit orders follow the new pack; paid orders keep the credits and amount they were bought at.
      const before=await creditPack(tx);
      await tx.creditPack.upsert({where:{key:CREDIT_PACK_KEY},create:{key:CREDIT_PACK_KEY,credits:Number(credits),amountMnt:Number(amount),updatedBy:actorId},update:{credits:Number(credits),amountMnt:Number(amount),updatedBy:actorId}});
      details={before,after:{credits,amountMnt:amount},paidOrdersChanged:false};
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
      } else if(action==="grant-credits") {
        // A bonus for the current Ulaanbaatar month only; it expires with the month like the allowance.
        const period=creditPeriod(Date.now());
        const before=await tx.creditPeriod.findUnique({where:{userId_period:{userId:target,period}},select:{bonus:true}});
        const row=await tx.creditPeriod.upsert({where:{userId_period:{userId:target,period}},create:{userId:target,period,bonus:Number(amount)},update:{bonus:{increment:Number(amount)}},select:{bonus:true}});
        details={period,amount,bonusBefore:before?.bonus??0,bonusAfter:row.bonus};
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
  if(action==="set-price"){revalidatePath("/workspace/plans");revalidatePath("/programs/[slug]","page");}
  if(action==="set-credits"||action==="set-credit-pack")revalidatePath("/workspace/plans");
  return result;
}
// Round-trip time of a trivial query, shared by the health endpoint and the admin system panel.
export async function databaseLatency() {
  const started = performance.now();
  await getDb().$queryRaw`SELECT 1`;
  return Math.round(performance.now() - started);
}
