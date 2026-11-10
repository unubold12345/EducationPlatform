import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
import {
  UsageMeter, creditCost, creditPeriod, creditResetAt, defaultAllowances, isAllowanceKey, maxCreditCost,
  type AiAction, type AllowanceKey, type AllowanceTable, type CreditReceipt,
} from "./pricing";
import { allocateCredits, available, creditTotals, planTermCredits, returnParts, totalsAfter, type Bucket, type ChargePart } from "./buckets";

export type CreditSummary = {
  period: string; allowance: number; used: number; balance: number;
  /** This month's free credits, admin bonus and what is left of them; they lapse at `resetsAt`. */
  free: number; bonus: number; monthLeft: number; resetsAt: string;
  /** Each active plan's credits for its current term; they lapse when the plan ends. */
  plans: { program: string; title: string; credits: number; left: number; endsAt: string }[];
  /** Purchased credits still unspent; they never lapse. */
  purchased: number;
};

export class NotEnoughCredits extends ApiError {
  constructor(public cost: number, public balance: number, upTo = false) {
    const need = upTo ? `энэ үйлдэлд хамгийн ихдээ ${cost} кредит урьдчилан барина (зарцуулаагүйг буцаана)` : `энэ үйлдэл ${cost} кредит`;
    super(402, `AI кредит хүрэлцэхгүй байна: ${need}, танд ${balance} үлдсэн. Багцууд хуудаснаас кредит нэмж авах эсвэл сарын багц авч болно.`);
  }
}

type Db = ReturnType<typeof getDb>;
type Reader = Pick<Db, "creditPeriod" | "creditPlanTerm" | "creditWallet">;
type Writer = Pick<Db, "$executeRaw">;

/** Current monthly amounts: admin-set rows over the code defaults. */
export async function creditAllowances(db: Pick<Db, "creditAllowance"> = getDb()): Promise<AllowanceTable> {
  const table = defaultAllowances();
  const rows = await db.creditAllowance.findMany({ select: { key: true, credits: true } });
  for (const row of rows) if (isAllowanceKey(row.key)) table[row.key] = row.credits;
  return table;
}

type ActivePlan = { program: AllowanceKey; startsAt: Date; endsAt: Date };
async function activePlans(userId: string, now: Date): Promise<ActivePlan[]> {
  const rows = await getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true, startsAt: true, endsAt: true } });
  return rows.flatMap(row => isAllowanceKey(row.program) && row.program !== "free" ? [{ ...row, program: row.program }] : []);
}

type PlanBucket = Bucket & { kind: "plan"; program: AllowanceKey; endsAt: number };
/** The student's buckets as stored now. A plan term that has no row yet counts with nothing used (id ""). */
async function readBuckets(db: Reader, userId: string, now: Date, plans: ActivePlan[], table: AllowanceTable) {
  const period = creditPeriod(now.getTime());
  const month = await db.creditPeriod.findUnique({ where: { userId_period: { userId, period } }, select: { used: true, bonus: true } });
  const terms = plans.length ? await db.creditPlanTerm.findMany({ where: { userId, OR: plans.map(plan => ({ program: plan.program, termStart: plan.startsAt })) }, select: { id: true, program: true, termStart: true, used: true } }) : [];
  const wallet = await db.creditWallet.findUnique({ where: { userId }, select: { purchased: true, used: true } });
  const bonus = month?.bonus ?? 0;
  const monthBucket: Bucket = { kind: "month", period, capacity: table.free + bonus, used: month?.used ?? 0, endsAt: creditResetAt(now.getTime()).getTime() };
  const planBuckets: PlanBucket[] = plans.map(plan => {
    const term = terms.find(row => row.program === plan.program && row.termStart.getTime() === plan.startsAt.getTime());
    return { kind: "plan", id: term?.id ?? "", program: plan.program, capacity: planTermCredits(table[plan.program], plan.startsAt.getTime(), plan.endsAt.getTime(), now.getTime()), used: term?.used ?? 0, endsAt: plan.endsAt.getTime() };
  });
  const walletBucket: Bucket = { kind: "wallet", capacity: wallet?.purchased ?? 0, used: wallet?.used ?? 0, endsAt: null };
  return { period, bonus, monthBucket, planBuckets, walletBucket, buckets: [monthBucket, ...planBuckets, walletBucket] };
}

/** Free credits for this month, each active plan's term credits and purchased credits, with the totals the meter shows. */
export async function creditSummary(userId: string, now = new Date()): Promise<CreditSummary> {
  const [plans, table] = await Promise.all([activePlans(userId, now), creditAllowances()]);
  const { period, bonus, monthBucket, planBuckets, walletBucket, buckets } = await readBuckets(getDb(), userId, now, plans, table);
  const totals = creditTotals(buckets);
  return {
    period, ...totals, free: table.free, bonus, monthLeft: available(monthBucket), resetsAt: creditResetAt(now.getTime()).toISOString(),
    plans: planBuckets.map(bucket => ({ program: bucket.program, title: findSubscriptionPlan(bucket.program)?.shortTitle ?? bucket.program, credits: bucket.capacity, left: available(bucket), endsAt: new Date(bucket.endsAt).toISOString() })),
    purchased: available(walletBucket),
  };
}

/** Moves credits into (`sign` 1) or out of (`sign` -1) a bucket's used count. Taking only succeeds while the bucket still holds them. */
async function moveCredits(db: Writer, userId: string, part: ChargePart, sign: 1 | -1, capacity = 0) {
  const n = part.credits;
  if (sign === -1) {
    if (part.kind === "month") return db.$executeRaw`UPDATE "CreditPeriod" SET "used" = GREATEST(0, "used" - ${n}), "updatedAt" = NOW() WHERE "userId" = ${userId} AND "period" = ${part.period}`;
    if (part.kind === "plan") return db.$executeRaw`UPDATE "CreditPlanTerm" SET "used" = GREATEST(0, "used" - ${n}), "updatedAt" = NOW() WHERE "id" = ${part.id} AND "userId" = ${userId}`;
    return db.$executeRaw`UPDATE "CreditWallet" SET "used" = GREATEST(0, "used" - ${n}), "updatedAt" = NOW() WHERE "userId" = ${userId}`;
  }
  // Compare-and-set: the counter only moves while the credits still fit (a monthly bonus or a purchase made
  // meanwhile counts, because those columns are read by the statement itself).
  if (part.kind === "month") return db.$executeRaw`UPDATE "CreditPeriod" SET "used" = "used" + ${n}, "updatedAt" = NOW() WHERE "userId" = ${userId} AND "period" = ${part.period} AND "used" + ${n} <= ${capacity} + "bonus"`;
  if (part.kind === "plan") return db.$executeRaw`UPDATE "CreditPlanTerm" SET "used" = "used" + ${n}, "updatedAt" = NOW() WHERE "id" = ${part.id} AND "userId" = ${userId} AND "used" + ${n} <= ${capacity}`;
  return db.$executeRaw`UPDATE "CreditWallet" SET "used" = "used" + ${n}, "updatedAt" = NOW() WHERE "userId" = ${userId} AND "used" + ${n} <= "purchased"`;
}

const asJson = (parts: ChargePart[]) => parts as unknown as Prisma.InputJsonValue;

type Hold = { id: string; userId: string; action: AiAction; credits: number; parts: ChargePart[]; before: { balance: number; allowance: number } };

async function holdCredits(userId: string, action: AiAction, credits: number, upTo: boolean): Promise<Hold> {
  // A hold is a whole number of credits and never more than the action's listed (maximum) price,
  // including the per-image surcharge of a conversation message that carries the most images.
  if (!Number.isSafeInteger(credits) || credits < 1 || credits > maxCreditCost(action)) throw new Error("Invalid credit hold");
  const now = new Date(), period = creditPeriod(now.getTime());
  const [plans, table] = await Promise.all([activePlans(userId, now), creditAllowances()]);
  const db = getDb();
  // ON CONFLICT DO NOTHING: safe when two first requests arrive together.
  await db.creditPeriod.createMany({ data: [{ userId, period }], skipDuplicates: true });
  await db.creditWallet.createMany({ data: [{ userId }], skipDuplicates: true });
  if (plans.length) await db.creditPlanTerm.createMany({ data: plans.map(plan => ({ userId, program: plan.program, termStart: plan.startsAt })), skipDuplicates: true });
  return db.$transaction(async tx => {
    // One row lock per student: holds queue here, so the balance read below cannot be spent twice.
    await tx.$queryRaw`SELECT "userId" FROM "CreditWallet" WHERE "userId" = ${userId} FOR UPDATE`;
    const { buckets } = await readBuckets(tx, userId, now, plans, table);
    const before = creditTotals(buckets);
    const parts = allocateCredits(buckets.filter(bucket => bucket.kind !== "plan" || bucket.id), credits);
    if (!parts) throw new NotEnoughCredits(credits, before.balance, upTo);
    for (const part of parts) {
      const capacity = part.kind === "month" ? table.free : part.kind === "plan" ? buckets.find(bucket => bucket.kind === "plan" && bucket.id === part.id)!.capacity : 0;
      if (!await moveCredits(tx, userId, part, 1, capacity)) throw new NotEnoughCredits(credits, before.balance, upTo);
    }
    const charge = await tx.creditCharge.create({ data: { userId, period, action, credits, parts: asJson(parts) }, select: { id: true } });
    return { id: charge.id, userId, action, credits, parts, before };
  });
}

const usageData = (meter: UsageMeter) => ({
  promptTokens: meter.prompt, cachedTokens: meter.cached, completionTokens: meter.completion, costMicroUsd: meter.costMicroUsd(),
});

async function refund(hold: Hold, meter: UsageMeter) {
  try {
    await getDb().$transaction(async tx => {
      const marked = await tx.creditCharge.updateMany({ where: { id: hold.id, status: "HELD" }, data: { status: "REFUNDED", settledAt: new Date(), ...usageData(meter) } });
      // Each part goes back where it came from: this month, the plan's term or the purchased credits.
      if (marked.count) for (const part of hold.parts) await moveCredits(tx, hold.userId, part, -1);
    });
  } catch {
    // A failed refund leaves the charge HELD (counted as used); the original error still reaches the student.
  }
}

/** Options for an action priced by its result rather than one fixed cost. */
export type ChargeOptions<T> = {
  /** Images on a conversation message; each adds `IMAGE_CREDITS` to the price. */
  images?: number;
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
 * Runs one AI action against the student's credits. The cost (or, with `settle`, the most it can cost) is
 * held before any provider call, taken first from this month's free credits, then plan credits, then
 * purchased credits (soonest to lapse first), kept only when `work` returns a result, and refunded to the
 * same places on every failure (busy, quota, provider error, malformed output, a timed exam opening
 * meanwhile). With `settle`, the charge drops to the result's price and the unused part of the hold returns
 * in the same transaction that marks it spent. The reply gains a `credits` receipt with what was spent.
 */
export async function chargeCredits<T extends object>(userId: string, action: AiAction, work: (meter: UsageMeter) => Promise<T>, options: ChargeOptions<T> = {}): Promise<T & { credits: CreditReceipt }> {
  const hold = await holdCredits(userId, action, options.hold ?? creditCost(action, options.images ?? 0), Boolean(options.settle));
  const meter = new UsageMeter();
  let result: T;
  try { result = await work(meter); }
  catch (error) { await refund(hold, meter); throw error; }
  let spent = settledPrice(hold, result, options.settle);
  const split = returnParts(hold.parts, hold.credits - spent);
  let kept = hold.parts;
  try {
    const settled = await getDb().$transaction(async tx => {
      const marked = await tx.creditCharge.updateMany({ where: { id: hold.id, status: "HELD" }, data: { status: "SPENT", credits: spent, parts: asJson(split.kept), settledAt: new Date(), ...usageData(meter) } });
      if (!marked.count) return false;
      for (const part of split.returned) await moveCredits(tx, hold.userId, part, -1);
      return true;
    });
    if (settled) kept = split.kept; else spent = hold.credits;
  } catch {
    // The whole hold was counted at hold time and stays spent; only the usage record is missing.
    spent = hold.credits;
  }
  const { balance, allowance } = totalsAfter(hold.before, kept);
  return { ...result, credits: { action, spent, balance, allowance } };
}
