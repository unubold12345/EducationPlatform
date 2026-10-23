import { findOfficialPaper } from "@/modules/papers/catalog";
import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { findExam } from "./definitions";
import { MOCK_PRICE_MNT } from "./pricing";
import { localPilotEnabled } from "@/lib/local-pilot";
export class MockAccessRequired extends ApiError {
  constructor(public slug:string) { super(402,"Энэ шалгалтын эрхийг ₮10,000-өөр нээнэ үү."); }
}

export const mockPaymentsEnabled = localPilotEnabled;
const purchaseFields = { id:true, examSlug:true, amountMnt:true, currency:true, provider:true, status:true, createdAt:true, paidAt:true } as const;
export async function createMockOrder(slug:string,userId:string) {
  if (!mockPaymentsEnabled()) throw new ApiError(403,"Туршилтын төлбөр идэвхгүй байна.");
  if (!findExam(slug)&&!findOfficialPaper(slug)) throw new ApiError(404,"Шалгалт олдсонгүй.");
  return getDb().mockPurchase.upsert({where:{userId_examSlug:{userId,examSlug:slug}},update:{},create:{userId,examSlug:slug,amountMnt:MOCK_PRICE_MNT},select:purchaseFields});
}
export async function confirmMockOrder(id:string,userId:string,decision:"success"|"decline") {
  if (!mockPaymentsEnabled()) throw new ApiError(403,"Туршилтын төлбөр идэвхгүй байна.");
  return getDb().$transaction(async tx=>{
    const order=await tx.mockPurchase.findFirst({where:{id,userId},select:purchaseFields});
    if (!order) throw new ApiError(404,"Захиалга олдсонгүй.");
    if (order.status==="PAID") return order;
    if (order.provider!=="MOCK"||order.amountMnt!==MOCK_PRICE_MNT||order.currency!=="MNT"||(!findExam(order.examSlug)&&!findOfficialPaper(order.examSlug))) throw new ApiError(409,"Захиалгын мэдээлэл зөрүүтэй байна.");
    await tx.mockPurchase.updateMany({where:{id,userId,status:{not:"PAID"}},data:decision==="success"?{status:"PAID",paidAt:new Date()}:{status:"DECLINED"}});
    return tx.mockPurchase.findUniqueOrThrow({where:{id},select:purchaseFields});
  });
}
