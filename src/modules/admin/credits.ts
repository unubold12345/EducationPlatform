import "server-only";
import { getDb } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { AI_ACTION_IDS, creditPeriod, creditValueMicroUsd, isAiAction, type AiAction } from "@/modules/credits/pricing";

export type ActionUsage = { action: AiAction; spent: number; credits: number; refunded: number; held: number; costMicroUsd: number; promptTokens: number; completionTokens: number };
export type CreditUsage = {
  period: string; spentCredits: number; spentCount: number; refundedCount: number; refundedCredits: number; heldCount: number;
  costMicroUsd: number; valueMicroUsd: number; users: number; byAction: ActionUsage[];
  top: { userId: string; email: string; name: string; credits: number; actions: number; costMicroUsd: number }[];
};

/** Months that have AI charges, newest first, always including the current one. */
export async function creditMonths(limit = 6) {
  const rows = await getDb().creditCharge.findMany({ distinct: ["period"], orderBy: { period: "desc" }, take: limit, select: { period: true } });
  return [...new Set([creditPeriod(Date.now()), ...rows.map(row => row.period)])].sort().reverse().slice(0, limit);
}

/**
 * One month of AI spending for the admin: credits kept, refunds, and what DeepSeek actually charged
 * (failed calls included, since the provider bills them too), by action and by student.
 */
export async function creditUsage(period: string, users: Prisma.UserWhereInput): Promise<CreditUsage> {
  const db = getDb();
  const where: Prisma.CreditChargeWhereInput = { period, user: users };
  const [groups, people, topRows] = await Promise.all([
    db.creditCharge.groupBy({ by: ["action", "status"], where, _count: { _all: true }, _sum: { credits: true, costMicroUsd: true, promptTokens: true, completionTokens: true } }),
    db.creditCharge.groupBy({ by: ["userId"], where: { ...where, status: "SPENT" } }),
    db.creditCharge.groupBy({ by: ["userId"], where: { ...where, status: "SPENT" }, _count: { _all: true }, _sum: { credits: true, costMicroUsd: true }, orderBy: { _sum: { credits: "desc" } }, take: 10 }),
  ]);
  const byAction = new Map<AiAction, ActionUsage>(AI_ACTION_IDS.map(action => [action, { action, spent: 0, credits: 0, refunded: 0, held: 0, costMicroUsd: 0, promptTokens: 0, completionTokens: 0 }]));
  for (const group of groups) {
    if (!isAiAction(group.action)) continue;
    const row = byAction.get(group.action)!;
    const count = group._count._all, credits = group._sum.credits ?? 0;
    if (group.status === "SPENT") { row.spent += count; row.credits += credits; }
    else if (group.status === "REFUNDED") row.refunded += count;
    else row.held += count;
    row.costMicroUsd += group._sum.costMicroUsd ?? 0;
    row.promptTokens += group._sum.promptTokens ?? 0;
    row.completionTokens += group._sum.completionTokens ?? 0;
  }
  const rows = [...byAction.values()];
  const sum = (pick: (row: ActionUsage) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const refundedCredits = groups.filter(group => group.status === "REFUNDED").reduce((total, group) => total + (group._sum.credits ?? 0), 0);
  const accounts = topRows.length ? await db.user.findMany({ where: { id: { in: topRows.map(row => row.userId) } }, select: { id: true, email: true, name: true } }) : [];
  const spentCredits = sum(row => row.credits);
  return {
    period, spentCredits, spentCount: sum(row => row.spent), refundedCount: sum(row => row.refunded), refundedCredits, heldCount: sum(row => row.held),
    costMicroUsd: sum(row => row.costMicroUsd), valueMicroUsd: creditValueMicroUsd(spentCredits), users: people.length,
    byAction: rows.filter(row => row.spent || row.refunded || row.held).sort((a, b) => b.credits - a.credits),
    top: topRows.map(row => {
      const account = accounts.find(item => item.id === row.userId);
      return { userId: row.userId, email: account?.email ?? row.userId, name: account?.name ?? "", credits: row._sum.credits ?? 0, actions: row._count._all, costMicroUsd: row._sum.costMicroUsd ?? 0 };
    }),
  };
}
