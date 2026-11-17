import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { DEFAULT_CREDIT_PACK, DEFAULT_CREDIT_PACKS, type CreditPackOffer } from "./pricing";
import { notify } from "@/modules/notifications/service";
import { creditsPaidNotice } from "@/modules/notifications/rules";

/** A pack's row key, named after its credits (a pack's credit amount is unique in the list). */
export const creditPackKey = (credits: number) => "p" + credits;

/** The credit packs on sale now, smallest first: the admin-set rows, or the code defaults. Pass the transaction client inside one. */
export async function creditPacks(db: Pick<ReturnType<typeof getDb>, "creditPack"> = getDb()): Promise<CreditPackOffer[]> {
  const rows = await db.creditPack.findMany({ select: { credits: true, amountMnt: true }, orderBy: { credits: "asc" } });
  return rows.length ? rows : DEFAULT_CREDIT_PACKS.map(pack => ({ ...pack }));
}
/** One pack for callers that show a single offer (the mobile plans route): the 1,000-credit pack, else the first. */
export async function creditPack(db: Pick<ReturnType<typeof getDb>, "creditPack"> = getDb()): Promise<CreditPackOffer> {
  const packs = await creditPacks(db);
  return packs.find(pack => pack.credits === DEFAULT_CREDIT_PACK.credits) ?? packs[0];
}

const fields = { id: true, credits: true, amountMnt: true, currency: true, provider: true, status: true, createdAt: true, paidAt: true } as const;
const offered = (packs: CreditPackOffer[], credits: number, amountMnt: number) => packs.some(pack => pack.credits === credits && pack.amountMnt === amountMnt);

/**
 * Opens (or reuses) the student's one unpaid credit order. The page sends the pack the student chose; if an admin
 * removed or changed it meanwhile the student is asked to reload instead of paying a different amount.
 */
export async function createCreditOrder(userId: string, shown: CreditPackOffer) {
  if (!mockPilotPaymentsEnabled()) throw new ApiError(403, "Туршилтын төлбөр идэвхгүй байна.");
  if (!offered(await creditPacks(), shown.credits, shown.amountMnt)) throw new ApiError(409, "Кредитийн багцын хэмжээ эсвэл үнэ өөрчлөгдсөн. Хуудсаа сэргээгээд дахин оролдоно уу.");
  const db = getDb(), activeKey = userId + ":credits";
  // The one unpaid order follows the pack just chosen; paid orders keep what they were bought at.
  await db.creditOrder.updateMany({ where: { activeKey, status: { not: "PAID" } }, data: { credits: shown.credits, amountMnt: shown.amountMnt } });
  return db.creditOrder.upsert({ where: { activeKey }, update: {}, create: { userId, credits: shown.credits, amountMnt: shown.amountMnt, activeKey }, select: fields });
}

/** Confirms the simulated payment once: a paid order adds its credits to the student's purchased credits. */
export async function confirmCreditOrder(id: string, userId: string, decision: "success" | "decline") {
  if (!mockPilotPaymentsEnabled()) throw new ApiError(403, "Туршилтын төлбөр идэвхгүй байна.");
  return getDb().$transaction(async tx => {
    const order = await tx.creditOrder.findFirst({ where: { id, userId }, select: fields });
    if (!order) throw new ApiError(404, "Захиалга олдсонгүй.");
    if (order.status === "PAID") return order;
    if (!offered(await creditPacks(tx), order.credits, order.amountMnt) || order.currency !== "MNT" || order.provider !== "MOCK") throw new ApiError(409, "Захиалгын мэдээлэл зөрүүтэй байна. Хуудсаа сэргээгээд дахин оролдоно уу.");
    if (decision === "decline") {
      await tx.creditOrder.updateMany({ where: { id, userId, status: { not: "PAID" } }, data: { status: "DECLINED" } });
      return tx.creditOrder.findUniqueOrThrow({ where: { id }, select: fields });
    }
    // Only the request that flips the order to PAID adds credits, so a repeated confirm never adds twice.
    const changed = await tx.creditOrder.updateMany({ where: { id, userId, status: { not: "PAID" } }, data: { status: "PAID", activeKey: null, paidAt: new Date() } });
    if (changed.count) await tx.creditWallet.upsert({ where: { userId }, create: { userId, purchased: order.credits }, update: { purchased: { increment: order.credits } } });
    if (changed.count) await notify(tx, userId, creditsPaidNotice(order.credits, id));
    return tx.creditOrder.findUniqueOrThrow({ where: { id }, select: fields });
  });
}
