import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { addCalendarMonth } from "./plans";
import { pricedPlan } from "./prices";

const fields={id:true,program:true,amountMnt:true,currency:true,provider:true,status:true,createdAt:true,paidAt:true,periodStart:true,periodEnd:true} as const;
export async function createSubscriptionOrder(program:string,userId:string) {
  if(!mockPilotPaymentsEnabled())throw new ApiError(403,"Туршилтын төлбөр идэвхгүй байна.");
  const plan=await pricedPlan(program);if(!plan)throw new ApiError(404,"Багц олдсонгүй.");
  // An unpaid order follows the current price; paid orders keep the amount they were paid at.
  await getDb().subscriptionOrder.updateMany({where:{activeKey:userId+":"+program,status:{not:"PAID"},amountMnt:{not:plan.amountMnt}},data:{amountMnt:plan.amountMnt}});
  return getDb().subscriptionOrder.upsert({where:{activeKey:userId+":"+program},update:{},create:{userId,program,amountMnt:plan.amountMnt,activeKey:userId+":"+program},select:fields});
}
export async function confirmSubscriptionOrder(id:string,userId:string,decision:"success"|"decline") {
  if(!mockPilotPaymentsEnabled())throw new ApiError(403,"Туршилтын төлбөр идэвхгүй байна.");
  return getDb().$transaction(async tx=>{
    const order=await tx.subscriptionOrder.findFirst({where:{id,userId},select:fields});
    if(!order)throw new ApiError(404,"Захиалга олдсонгүй.");
    if(order.status==="PAID")return order;
    const plan=await pricedPlan(order.program,tx);
    if(!plan||order.amountMnt!==plan.amountMnt||order.currency!=="MNT"||order.provider!=="MOCK")throw new ApiError(409,"Захиалгын мэдээлэл зөрүүтэй байна.");
    if(decision==="decline") {
      await tx.subscriptionOrder.updateMany({where:{id,userId,status:{not:"PAID"}},data:{status:"DECLINED"}});
      return tx.subscriptionOrder.findUniqueOrThrow({where:{id},select:fields});
    }
    const changed=await tx.subscriptionOrder.updateMany({where:{id,userId,status:{not:"PAID"}},data:{status:"PAID",activeKey:null,paidAt:new Date()}});
    if(changed.count) {
      const current=await tx.subscription.findUnique({where:{userId_program:{userId,program:order.program}}});
      const now=new Date();const active=current&&current.startsAt<=now&&current.endsAt>now;
      const start=active?current.endsAt:now;const end=addCalendarMonth(start);
      await tx.subscription.upsert({where:{userId_program:{userId,program:order.program}},create:{userId,program:order.program,startsAt:start,endsAt:end},update:{startsAt:active?current.startsAt:start,endsAt:end}});
      await tx.subscriptionOrder.update({where:{id},data:{periodStart:start,periodEnd:end}});
    }
    return tx.subscriptionOrder.findUniqueOrThrow({where:{id},select:fields});
  });
}
