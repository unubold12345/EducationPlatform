import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceMocks } from "@/modules/exams/entrance/catalog";
import { freeMocks } from "@/modules/exams/free/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { topikMocks } from "@/modules/exams/topik/catalog";
import { toeflMocks } from "@/modules/exams/toefl/catalog";
import { guidedTasks } from "@/modules/workshops/guided";
import { addCalendarMonth, findAnyPlan, findSubscriptionPlan, PLAN_SALE_MIN, saleEndFromDate, validPlanPrice, validSalePrice } from "@/modules/subscriptions/plans";
import { revalidatePath } from "next/cache";
import { authFeatures, isDemoEmail } from "@/lib/auth-features";
import { CREDIT_ALLOWANCE_LIMITS, CREDIT_GRANT_LIMITS, CREDIT_PACK_COUNT, CREDIT_PACK_LIMITS, creditPeriod, defaultAllowances, isAllowanceKey, validAllowance, validCreditPacks, validGrant } from "@/modules/credits/pricing";
import { creditPackKey, creditPacks } from "@/modules/credits/purchase";
import { notify } from "@/modules/notifications/service";
import { planGrantedNotice } from "@/modules/notifications/rules";

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
    ...topikMocks.map(exam=>({key:exam.slug,title:exam.title,program:"topik" as const,kind:"TOPIK mock",count:exam.questions,href:"/exams/"+exam.slug})),
    ...toeflMocks.map(exam=>({key:exam.slug,title:exam.title,program:"toefl" as const,kind:"TOEFL mock",count:exam.questions.reading+exam.questions.listening+exam.questions.writing+exam.questions.speaking,href:"/exams/"+exam.slug})),
    // The free half-length mocks can be fixed like any other mock (published versions, exact-version grading).
    ...freeMocks.map(exam=>({key:exam.slug,title:exam.title,program:exam.program,kind:"Үнэгүй хагас mock",count:exam.questions,href:"/exams/"+exam.slug})),
    ...guidedTasks.map(task=>({key:task.slug,title:task.title,program:"ielts",kind:"Workshop",count:1,href:"/workshops/"+task.slug})),
  ];
}
export async function adminMutation(actorId:string, input:unknown) {
  if(!input || typeof input!=="object" || Array.isArray(input))throw new ApiError(400,"Хүсэлтийн бүтэц буруу.");
  const body=input as Record<string,unknown>;
  const allowed=["action","target","reason","program","status","amount","packs","saleEndsAt"];
  if(Object.keys(body).some(key=>!allowed.includes(key)))throw new ApiError(400,"Танигдаагүй талбар.");
  const {action,target,reason,program,status,amount,packs,saleEndsAt}=body;
  if(typeof action!=="string"||typeof target!=="string"||!target||target.length>150||typeof reason!=="string"||reason.trim().length<5||reason.length>1000)throw new ApiError(400,"Шалтгааныг 5–1000 тэмдэгтээр бичнэ үү.");
  if(!["grant-month","expire-plan","revoke-sessions","review-content","suspend","unsuspend","add-note","set-price","set-sale","grant-credits","set-credits","set-credit-packs"].includes(action))throw new ApiError(400,"Үйлдэл зөвшөөрөгдөөгүй.");
  if(action==="grant-credits"&&!validGrant(amount))throw new ApiError(400,`Кредит ${CREDIT_GRANT_LIMITS.min}–${CREDIT_GRANT_LIMITS.max.toLocaleString("en-US")} хооронд бүхэл тоо байна.`);
  if(action==="set-credits"&&(!isAllowanceKey(target)||!validAllowance(amount)))throw new ApiError(400,`Сарын кредит ${CREDIT_ALLOWANCE_LIMITS.min}–${CREDIT_ALLOWANCE_LIMITS.max.toLocaleString("en-US")} хооронд бүхэл тоо байна.`);
  // The whole pack list is saved at once; an empty list goes back to the default packs.
  if(action==="set-credit-packs"&&(target!=="packs"||!Array.isArray(packs)||(packs.length>0&&!validCreditPacks(packs))))throw new ApiError(400,`${CREDIT_PACK_COUNT.min}–${CREDIT_PACK_COUNT.max} багц, тус бүр кредит ${CREDIT_PACK_LIMITS.credits.min}–${CREDIT_PACK_LIMITS.credits.max.toLocaleString("en-US")} (давтагдахгүй), үнэ ₮${CREDIT_PACK_LIMITS.amountMnt.min.toLocaleString("en-US")}–₮${CREDIT_PACK_LIMITS.amountMnt.max.toLocaleString("en-US")} (100-д хуваагдах) бүхэл тоо байна.`);
  if(action!=="set-credit-packs"&&packs!==undefined)throw new ApiError(400,"Танигдаагүй талбар.");
  if(action!=="set-sale"&&saleEndsAt!==undefined)throw new ApiError(400,"Танигдаагүй талбар.");
  if(action==="set-sale"&&(!findSubscriptionPlan(target)||(amount!==null&&typeof amount!=="number")||(amount===null&&saleEndsAt!==undefined&&saleEndsAt!==null)||(saleEndsAt!==undefined&&saleEndsAt!==null&&!saleEndFromDate(saleEndsAt))))throw new ApiError(400,"Хямдралын үнэ, дуусах өдрийг зөв оруулна уу (дуусах өдөр ирээдүйд байна).");
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
      // A sale that is no longer below the new regular price would never apply; clear it with the change.
      const dropSale=before?.saleAmountMnt!=null&&before.saleAmountMnt>=Number(amount);
      await tx.planPrice.upsert({where:{program:plan.program},create:{program:plan.program,amountMnt:Number(amount),updatedBy:actorId},update:{amountMnt:Number(amount),updatedBy:actorId,...(dropSale?{saleAmountMnt:null,saleEndsAt:null}:{})}});
      details={program:plan.program,before:before?.amountMnt??plan.amountMnt,after:amount,paidOrdersChanged:false,...(dropSale?{saleCleared:true}:{})};
    } else if(action==="set-sale") {
      const plan=findSubscriptionPlan(target)!;
      const before=await tx.planPrice.findUnique({where:{program:plan.program}});
      const regular=before?.amountMnt??plan.amountMnt;
      if(amount!==null&&!validSalePrice(amount,regular))throw new ApiError(400,`Хямдралын үнэ ₮${PLAN_SALE_MIN.toLocaleString("en-US")}-аас дээш, энгийн үнэ ₮${regular.toLocaleString("en-US")}-аас бага, 100-д хуваагдах бүхэл тоо байна.`);
      const endsAt=amount===null||saleEndsAt==null?null:saleEndFromDate(saleEndsAt);
      const data={saleAmountMnt:amount===null?null:Number(amount),saleEndsAt:endsAt};
      await tx.planPrice.upsert({where:{program:plan.program},create:{program:plan.program,amountMnt:regular,updatedBy:actorId,...data},update:{updatedBy:actorId,...data}});
      details={program:plan.program,regular,before:{amount:before?.saleAmountMnt??null,endsAt:before?.saleEndsAt?.toISOString()??null},after:{amount:data.saleAmountMnt,endsAt:endsAt?.toISOString()??null},paidOrdersChanged:false};
    } else if(action==="set-credits") {
      const key=target as keyof ReturnType<typeof defaultAllowances>;
      const before=await tx.creditAllowance.findUnique({where:{key}});
      await tx.creditAllowance.upsert({where:{key},create:{key,credits:Number(amount),updatedBy:actorId},update:{credits:Number(amount),updatedBy:actorId}});
      details={key,before:before?.credits??defaultAllowances()[key],after:amount};
    } else if(action==="set-credit-packs") {
      // The list is replaced whole. An unpaid credit order is checked against it when confirmed; paid orders keep what they were bought at.
      const before=await creditPacks(tx);
      const next=(packs as {credits:number;amountMnt:number}[]).map(pack=>({credits:pack.credits,amountMnt:pack.amountMnt})).sort((a,b)=>a.credits-b.credits);
      await tx.creditPack.deleteMany({});
      if(next.length)await tx.creditPack.createMany({data:next.map(pack=>({key:creditPackKey(pack.credits),credits:pack.credits,amountMnt:pack.amountMnt,updatedBy:actorId}))});
      details={before,after:next.length?next:"default",paidOrdersChanged:false};
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
        if(action==="grant-month")await notify(tx,target,planGrantedNotice(findAnyPlan(plan)?.title??plan,end));
        details={program:plan,before:before?.endsAt.toISOString()??null,after:end.toISOString(),paymentCreated:false};
      }
    }
    await tx.adminAudit.create({data:{actorId,action,target,reason:reason.trim(),details:JSON.parse(JSON.stringify(details))}});
    return {ok:true};
  });
  if(action==="set-price"||action==="set-sale"){revalidatePath("/workspace/plans");revalidatePath("/programs/[slug]","page");revalidatePath("/");}
  if(action==="set-credits"||action==="set-credit-packs")revalidatePath("/workspace/plans");
  return result;
}
// Round-trip time of a trivial query, shared by the health endpoint and the admin system panel.
export async function databaseLatency() {
  const started = performance.now();
  await getDb().$queryRaw`SELECT 1`;
  return Math.round(performance.now() - started);
}
