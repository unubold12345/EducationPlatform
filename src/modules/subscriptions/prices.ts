import "server-only";
import { getDb } from "@/lib/db";
import { chargedPrice, findSubscriptionPlan, subscriptionPlans, type PlanDefinition, type PlanSale } from "./plans";

// Current monthly prices: admin-set rows override the defaults. Orders store the amount they were
// created with, so a price change never rewrites a paid receipt. A plan may also carry a sale: `amountMnt` on a
// priced plan is always what is charged now (the sale price while a sale runs), `regularMnt` the price without it.
export type PlanPriceRow = { program: string; amountMnt: number } & PlanSale;
const priceFields = { program: true, amountMnt: true, saleAmountMnt: true, saleEndsAt: true } as const;

export function priceOf<T extends { program: string; amountMnt: number }>(plan: T, row: PlanPriceRow | null | undefined, now = new Date()) {
  const regularMnt = row?.amountMnt ?? plan.amountMnt;
  const amountMnt = chargedPrice(regularMnt, row, now);
  return { ...plan, amountMnt, regularMnt, onSale: amountMnt < regularMnt, saleEndsAt: amountMnt < regularMnt ? row?.saleEndsAt ?? null : null };
}
/** Regular monthly prices, with no sale applied (the admin form's "current price"). */
export async function planPrices(): Promise<Record<string, number>> {
  const rows = await getDb().planPrice.findMany({ select: { program: true, amountMnt: true } });
  return Object.fromEntries(subscriptionPlans.map(plan => [plan.program, rows.find(row => row.program === plan.program)?.amountMnt ?? plan.amountMnt]));
}
/** Every plan's stored sale (including an ended one), for the admin form. */
export async function planSales(): Promise<Record<string, PlanSale>> {
  const rows = await getDb().planPrice.findMany({ select: priceFields });
  return Object.fromEntries(rows.map(row => [row.program, { saleAmountMnt: row.saleAmountMnt, saleEndsAt: row.saleEndsAt }]));
}
export async function pricedPlans() {
  const rows = await getDb().planPrice.findMany({ select: priceFields });
  const now = new Date();
  return (subscriptionPlans as readonly PlanDefinition[]).map(plan => priceOf(plan, rows.find(row => row.program === plan.program), now));
}
// Pass the transaction client when called inside one, so the read uses the same connection.
export async function pricedPlan(program: unknown, db: Pick<ReturnType<typeof getDb>, "planPrice"> = getDb()) {
  const plan = findSubscriptionPlan(program);
  if (!plan) return undefined;
  const row = await db.planPrice.findUnique({ where: { program: plan.program }, select: priceFields });
  return priceOf(plan, row);
}
