import "server-only";
import { getDb } from "@/lib/db";
import { findSubscriptionPlan, subscriptionPlans } from "./plans";

// Current monthly prices: admin-set rows override the defaults. Orders store the amount they were
// created with, so a price change never rewrites a paid receipt.
export async function planPrices(): Promise<Record<string, number>> {
  const rows = await getDb().planPrice.findMany({ select: { program: true, amountMnt: true } });
  return Object.fromEntries(subscriptionPlans.map(plan => [plan.program, rows.find(row => row.program === plan.program)?.amountMnt ?? plan.amountMnt]));
}
export async function pricedPlans() {
  const prices = await planPrices();
  return subscriptionPlans.map(plan => ({ ...plan, amountMnt: prices[plan.program] }));
}
// Pass the transaction client when called inside one, so the read uses the same connection.
export async function pricedPlan(program: unknown, db: Pick<ReturnType<typeof getDb>, "planPrice"> = getDb()) {
  const plan = findSubscriptionPlan(program);
  if (!plan) return undefined;
  const row = await db.planPrice.findUnique({ where: { program: plan.program }, select: { amountMnt: true } });
  return { ...plan, amountMnt: row?.amountMnt ?? plan.amountMnt };
}
