import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { DEFAULT_CREDIT_PACK, type CreditPackOffer } from "./pricing";

export const CREDIT_PACK_KEY = "default";

/** The credit pack on sale now: the admin-set row, or the code default. Pass the transaction client inside one. */
export async function creditPack(db: Pick<ReturnType<typeof getDb>, "creditPack"> = getDb()): Promise<CreditPackOffer> {
  const row = await db.creditPack.findUnique({ where: { key: CREDIT_PACK_KEY }, select: { credits: true, amountMnt: true } });
  return row ?? { ...DEFAULT_CREDIT_PACK };
}

const fields = { id: true, credits: true, amountMnt: true, currency: true, provider: true, status: true, createdAt: true, paidAt: true } as const;

/**
 * Opens (or reuses) the student's one unpaid credit order. The page sends the pack it showed; if an admin
 * changed it meanwhile the student is asked to reload instead of paying a different amount.
 */
export async function createCreditOrder(userId: string, shown: CreditPackOffer) {
  if (!mockPilotPaymentsEnabled()) throw new ApiError(403, "Туршилтын төлбөр идэвхгүй байна.");
  const pack = await creditPack();
  if (pack.credits !== shown.credits || pack.amountMnt !== shown.amountMnt) throw new ApiError(409, "Кредитийн багцын хэмжээ эсвэл үнэ өөрчлөгдсөн. Хуудсаа сэргээгээд дахин оролдоно уу.");
  const db = getDb(), activeKey = userId + ":credits";
  // An unpaid order follows the current pack; paid orders keep what they were bought at.
  await db.creditOrder.updateMany({ where: { activeKey, status: { not: "PAID" } }, data: { credits: pack.credits, amountMnt: pack.amountMnt } });
  return db.creditOrder.upsert({ where: { activeKey }, update: {}, create: { userId, credits: pack.credits, amountMnt: pack.amountMnt, activeKey }, select: fields });
}

/** Confirms the simulated payment once: a paid order adds its credits to the student's purchased credits. */
export async function confirmCreditOrder(id: string, userId: string, decision: "success" | "decline") {
  if (!mockPilotPaymentsEnabled()) throw new ApiError(403, "Туршилтын төлбөр идэвхгүй байна.");
  return getDb().$transaction(async tx => {
    const order = await tx.creditOrder.findFirst({ where: { id, userId }, select: fields });
    if (!order) throw new ApiError(404, "Захиалга олдсонгүй.");
    if (order.status === "PAID") return order;
    const pack = await creditPack(tx);
    if (order.credits !== pack.credits || order.amountMnt !== pack.amountMnt || order.currency !== "MNT" || order.provider !== "MOCK") throw new ApiError(409, "Захиалгын мэдээлэл зөрүүтэй байна. Хуудсаа сэргээгээд дахин оролдоно уу.");
    if (decision === "decline") {
      await tx.creditOrder.updateMany({ where: { id, userId, status: { not: "PAID" } }, data: { status: "DECLINED" } });
      return tx.creditOrder.findUniqueOrThrow({ where: { id }, select: fields });
    }
    // Only the request that flips the order to PAID adds credits, so a repeated confirm never adds twice.
    const changed = await tx.creditOrder.updateMany({ where: { id, userId, status: { not: "PAID" } }, data: { status: "PAID", activeKey: null, paidAt: new Date() } });
    if (changed.count) await tx.creditWallet.upsert({ where: { userId }, create: { userId, purchased: order.credits }, update: { purchased: { increment: order.credits } } });
    return tx.creditOrder.findUniqueOrThrow({ where: { id }, select: fields });
  });
}
