import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
import {
  UsageMeter, creditCost, creditPeriod, creditResetAt, defaultAllowances, isAiAction, isAllowanceKey, monthlyAllowance,
  type AiAction, type AllowanceTable, type CreditReceipt,
} from "./pricing";

export type CreditSummary = {
  period: string; allowance: number; used: number; balance: number; free: number; bonus: number; resetsAt: string;
  plans: { program: string; title: string; credits: number }[];
};
export type CreditHistoryRow = { id: string; action: AiAction; credits: number; status: "HELD" | "SPENT" | "REFUNDED"; createdAt: string };

export class NotEnoughCredits extends ApiError {
  constructor(public cost: number, public balance: number, upTo = false) {
    const need = upTo ? `энэ үйлдэлд хамгийн ихдээ ${cost} кредит урьдчилан барина (зарцуулаагүйг буцаана)` : `энэ үйлдэл ${cost} кредит`;
    super(402, `AI кредит хүрэлцэхгүй байна: ${need}, танд ${balance} үлдсэн. Кредит сар бүрийн 1-нд шинэчлэгдэнэ; сарын багц авбал нэмэгдэнэ.`);
  }
}

type Db = ReturnType<typeof getDb>;

/** Current monthly amounts: admin-set rows over the code defaults. */
export async function creditAllowances(db: Pick<Db, "creditAllowance"> = getDb()): Promise<AllowanceTable> {
  const table = defaultAllowances();
  const rows = await db.creditAllowance.findMany({ select: { key: true, credits: true } });
  for (const row of rows) if (isAllowanceKey(row.key)) table[row.key] = row.credits;
  return table;
}

async function activePrograms(userId: string, now: Date) {
  const rows = await getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } });
  return rows.map(row => row.program);
}

/** This month's allowance (free + active plans + admin bonus), use and balance. */
export async function creditSummary(userId: string, now = new Date()): Promise<CreditSummary> {
  const period = creditPeriod(now.getTime());
  const [programs, row, table] = await Promise.all([
    activePrograms(userId, now),
    getDb().creditPeriod.findUnique({ where: { userId_period: { userId, period } }, select: { used: true, bonus: true } }),
    creditAllowances(),
  ]);
  const bonus = row?.bonus ?? 0, used = row?.used ?? 0;
  const allowance = monthlyAllowance(programs, table) + bonus;
  const plans = [...new Set(programs)].flatMap(program => {
    const plan = findSubscriptionPlan(program);
    return plan ? [{ program: plan.program, title: plan.shortTitle, credits: table[plan.program] }] : [];
  });
  return { period, allowance, used, balance: Math.max(0, allowance - used), free: table.free, bonus, resetsAt: creditResetAt(now.getTime()).toISOString(), plans };
}

/** The student's latest AI charges, newest first. */
export async function creditHistory(userId: string, take = 10): Promise<CreditHistoryRow[]> {
  const rows = await getDb().creditCharge.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take, select: { id: true, action: true, credits: true, status: true, createdAt: true } });
  return rows.flatMap(row => isAiAction(row.action) && (row.status === "HELD" || row.status === "SPENT" || row.status === "REFUNDED")
    ? [{ id: row.id, action: row.action, credits: row.credits, status: row.status, createdAt: row.createdAt.toISOString() }] : []);
}

type Hold = { id: string; userId: string; period: string; action: AiAction; credits: number; allowance: number; balance: number };

async function holdCredits(userId: string, action: AiAction, credits: number, upTo: boolean): Promise<Hold> {
  // A hold is a whole number of credits and never more than the action's listed (maximum) price.
  if (!Number.isSafeInteger(credits) || credits < 1 || credits > creditCost(action)) throw new Error("Invalid credit hold");
  const now = new Date(), period = creditPeriod(now.getTime());
  const [programs, table] = await Promise.all([activePrograms(userId, now), creditAllowances()]);
  const base = monthlyAllowance(programs, table);
  const db = getDb();
  // ON CONFLICT DO NOTHING: safe when two first requests of the month arrive together.
  await db.creditPeriod.createMany({ data: [{ userId, period }], skipDuplicates: true });
  return db.$transaction(async tx => {
    // Compare-and-set in one statement: the counter only moves while the cost still fits in the
    // month's allowance, including any bonus an admin granted meanwhile.
    const taken = await tx.$executeRaw`UPDATE "CreditPeriod" SET "used" = "used" + ${credits}, "updatedAt" = NOW() WHERE "userId" = ${userId} AND "period" = ${period} AND "used" + ${credits} <= ${base} + "bonus"`;
    const row = await tx.creditPeriod.findUnique({ where: { userId_period: { userId, period } }, select: { used: true, bonus: true } });
    const allowance = base + (row?.bonus ?? 0);
    if (!taken) throw new NotEnoughCredits(credits, Math.max(0, allowance - (row?.used ?? 0)), upTo);
    const charge = await tx.creditCharge.create({ data: { userId, period, action, credits }, select: { id: true } });
    return { id: charge.id, userId, period, action, credits, allowance, balance: Math.max(0, allowance - (row?.used ?? credits)) };
  });
}

const usageData = (meter: UsageMeter) => ({
  promptTokens: meter.prompt, cachedTokens: meter.cached, completionTokens: meter.completion, costMicroUsd: meter.costMicroUsd(),
});

async function refund(hold: Hold, meter: UsageMeter) {
  try {
    await getDb().$transaction(async tx => {
      const marked = await tx.creditCharge.updateMany({ where: { id: hold.id, status: "HELD" }, data: { status: "REFUNDED", settledAt: new Date(), ...usageData(meter) } });
      if (marked.count) await tx.creditPeriod.updateMany({ where: { userId: hold.userId, period: hold.period, used: { gte: hold.credits } }, data: { used: { decrement: hold.credits } } });
    });
  } catch {
    // A failed refund leaves the charge HELD (counted as used); the original error still reaches the student.
  }
}

/** Options for an action priced by its result rather than one fixed cost. */
export type ChargeOptions<T> = {
  /** Credits held before the call (at most the action's listed price); defaults to that price. */
  hold?: number;
  /** The final price once the result is known. It is capped at the hold and the difference is returned. */
  settle?: (result: T) => number;
};

/** The settled price: a whole number from one credit up to the hold; anything unusable keeps the hold. */
function settledPrice<T>(hold: Hold, result: T, settle: ((result: T) => number) | undefined) {
  if (!settle) return hold.credits;
  try {
    const price = settle(result);
    return Number.isFinite(price) ? Math.min(hold.credits, Math.max(1, Math.ceil(price))) : hold.credits;
  } catch {
    return hold.credits;
  }
}

/**
 * Runs one AI action against the student's monthly credits. The cost (or, with `settle`, the most it can
 * cost) is held before any provider call, kept only when `work` returns a result, and refunded on every
 * failure (busy, quota, provider error, malformed output, a timed exam opening meanwhile). With `settle`,
 * the charge drops to the result's price and the unused part of the hold returns to the month in the same
 * transaction that marks it spent. The reply gains a `credits` receipt with what was actually spent.
 */
export async function chargeCredits<T extends object>(userId: string, action: AiAction, work: (meter: UsageMeter) => Promise<T>, options: ChargeOptions<T> = {}): Promise<T & { credits: CreditReceipt }> {
  const hold = await holdCredits(userId, action, options.hold ?? creditCost(action), Boolean(options.settle));
  const meter = new UsageMeter();
  let result: T;
  try { result = await work(meter); }
  catch (error) { await refund(hold, meter); throw error; }
  let spent = settledPrice(hold, result, options.settle);
  try {
    await getDb().$transaction(async tx => {
      const marked = await tx.creditCharge.updateMany({ where: { id: hold.id, status: "HELD" }, data: { status: "SPENT", credits: spent, settledAt: new Date(), ...usageData(meter) } });
      const returned = hold.credits - spent;
      if (!marked.count) { spent = hold.credits; return; }
      if (returned > 0) await tx.creditPeriod.updateMany({ where: { userId: hold.userId, period: hold.period, used: { gte: returned } }, data: { used: { decrement: returned } } });
    });
  } catch {
    // The whole hold was counted at hold time and stays spent; only the usage record is missing.
    spent = hold.credits;
  }
  const balance = Math.min(hold.allowance, hold.balance + hold.credits - spent);
  return { ...result, credits: { action, spent, balance, allowance: hold.allowance } };
}
