import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { findExam } from "./definitions";
import { MOCK_PRICE_MNT, MOCK_PURCHASE_DAYS, MOCK_PURCHASE_MS } from "./pricing";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { isFreeMock } from "./free/catalog";
import { notify } from "@/modules/notifications/service";
import { mockPaidNotice } from "@/modules/notifications/rules";
export class MockAccessRequired extends ApiError {
  constructor(public slug:string) { super(402,`Энэ шалгалтын эрхийг ₮10,000-өөр ${MOCK_PURCHASE_DAYS} хоногоор нээнэ үү.`); }
}

export const mockPaymentsEnabled = mockPilotPaymentsEnabled;
const purchaseFields = { id:true, examSlug:true, amountMnt:true, currency:true, provider:true, status:true, createdAt:true, paidAt:true, expiresAt:true } as const;
/** A paid purchase that still opens its mock: a permanent earlier one (no expiry) or one inside its 7 days. */
export const purchaseActive=(row:{status:string;expiresAt:Date|null},now=new Date())=>row.status==="PAID"&&(row.expiresAt===null||row.expiresAt.getTime()>now.getTime());
export async function createMockOrder(slug:string,userId:string) {
  if (!mockPaymentsEnabled()) throw new ApiError(403,"Туршилтын төлбөр идэвхгүй байна.");
  if (!findExam(slug)) throw new ApiError(404,"Шалгалт олдсонгүй.");
  // Free mocks are open to every signed-in account and are never sold.
  if (isFreeMock(slug)) throw new ApiError(409,"Энэ шалгалт үнэгүй. Төлбөр шаардлагагүй.");
  return getDb().$transaction(async tx=>{
    const old=await tx.mockPurchase.findUnique({where:{userId_examSlug:{userId,examSlug:slug}},select:purchaseFields});
    if(!old)return tx.mockPurchase.create({data:{userId,examSlug:slug,amountMnt:MOCK_PRICE_MNT},select:purchaseFields});
    // Still open: nothing to buy. A lapsed 7-day purchase is bought again on the same row (one row per student and mock).
    if(purchaseActive(old))return old;
    if(old.status==="PAID")return tx.mockPurchase.update({where:{id:old.id},data:{status:"PENDING",paidAt:null,expiresAt:null,amountMnt:MOCK_PRICE_MNT,provider:"MOCK"},select:purchaseFields});
    return old;
  });
}
export async function confirmMockOrder(id:string,userId:string,decision:"success"|"decline") {
  if (!mockPaymentsEnabled()) throw new ApiError(403,"Туршилтын төлбөр идэвхгүй байна.");
  return getDb().$transaction(async tx=>{
    const order=await tx.mockPurchase.findFirst({where:{id,userId},select:purchaseFields});
    if (!order) throw new ApiError(404,"Захиалга олдсонгүй.");
    if (order.status==="PAID") return order;
    if (order.provider!=="MOCK"||order.amountMnt!==MOCK_PRICE_MNT||order.currency!=="MNT"||!findExam(order.examSlug)||isFreeMock(order.examSlug)) throw new ApiError(409,"Захиалгын мэдээлэл зөрүүтэй байна.");
    const paidAt=new Date(),expiresAt=new Date(paidAt.getTime()+MOCK_PURCHASE_MS);
    const changed=await tx.mockPurchase.updateMany({where:{id,userId,status:{not:"PAID"}},data:decision==="success"?{status:"PAID",paidAt,expiresAt}:{status:"DECLINED"}});
    // Only the request that flips the order to PAID reports it.
    if (decision==="success"&&changed.count) await notify(tx,userId,mockPaidNotice(findExam(order.examSlug)!.title,order.examSlug,id,expiresAt));
    return tx.mockPurchase.findUniqueOrThrow({where:{id},select:purchaseFields});
  });
}
