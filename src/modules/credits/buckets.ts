/**
 * Where a student's AI credits come from and the order they are spent in. Pure module (no server or browser
 * APIs): the ledger in `service.ts` loads the rows and applies these rules, and the unit tests import it.
 *
 * - month: the free credits plus any admin bonus for this Ulaanbaatar month; they lapse on the 1st.
 * - plan: one active plan's credits for its current subscription term. Each month of the term adds the
 *   plan's credits when that month begins; unused credits carry over while the plan is renewed and lapse
 *   only when the subscription ends (owner rule, 2026-11-09).
 * - wallet: purchased credits; they never lapse.
 *
 * Credits are taken from whatever lapses first, purchased credits last, and a refund returns them to the
 * place they came from.
 */
import { addCalendarMonth } from "../subscriptions/plans.ts";

export type BucketRef = { kind: "month"; period: string } | { kind: "plan"; id: string } | { kind: "wallet" };
export type Bucket = BucketRef & {
  /** Credits this bucket holds right now. */
  capacity: number;
  used: number;
  /** When its credits lapse (epoch ms); null never. */
  endsAt: number | null;
};
export type ChargePart = BucketRef & { credits: number };

/** A guard against a malformed subscription row; 20 years of months. */
const MAX_TERM_MONTHS = 240;

/**
 * Months of a subscription term that have begun by `now`. The term's months are the billing calendar's
 * (`addCalendarMonth` from its start, the same steps a renewal adds), so a one-month plan has one month and
 * a plan renewed before it ended gains its next month's credits when that month starts.
 */
export function termMonthsStarted(startsAt: number, endsAt: number, now: number) {
  if (![startsAt, endsAt, now].every(Number.isFinite)) return 0;
  let months = 0, start = startsAt;
  while (start <= now && start < endsAt && months < MAX_TERM_MONTHS) {
    months += 1;
    start = addCalendarMonth(new Date(start)).getTime();
  }
  return months;
}
/** A plan's credits so far in its current term: its monthly credits for every month that has begun. */
export function planTermCredits(monthly: number, startsAt: number, endsAt: number, now: number) {
  return Math.max(0, monthly) * termMonthsStarted(startsAt, endsAt, now);
}

export function available(bucket: Bucket) { return Math.max(0, bucket.capacity - bucket.used); }

/** Soonest-lapsing first; purchased credits (no end) last. Ties keep their given order. */
export function spendOrder(buckets: readonly Bucket[]) {
  return buckets.map((bucket, index) => ({ bucket, index }))
    .sort((a, b) => (a.bucket.endsAt ?? Infinity) - (b.bucket.endsAt ?? Infinity) || a.index - b.index)
    .map(item => item.bucket);
}

const ref = (bucket: BucketRef): BucketRef => bucket.kind === "month" ? { kind: "month", period: bucket.period } : bucket.kind === "plan" ? { kind: "plan", id: bucket.id } : { kind: "wallet" };

/** Splits a charge over the buckets in spending order, or null when they do not hold enough together. */
export function allocateCredits(buckets: readonly Bucket[], credits: number): ChargePart[] | null {
  if (!Number.isSafeInteger(credits) || credits < 1) return null;
  let need = credits;
  const parts: ChargePart[] = [];
  for (const bucket of spendOrder(buckets)) {
    const take = Math.min(need, available(bucket));
    if (take > 0) { parts.push({ ...ref(bucket), credits: take }); need -= take; }
    if (!need) return parts;
  }
  return null;
}

/**
 * Gives `amount` credits of a charge back, last-taken first, so purchased credits return before credits that
 * lapse sooner. `kept` is what stays spent; `returned` is what goes back to each bucket.
 */
export function returnParts(parts: readonly ChargePart[], amount: number) {
  let left = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  const kept: ChargePart[] = [], returned: ChargePart[] = [];
  for (const part of [...parts].reverse()) {
    const back = Math.min(left, part.credits);
    left -= back;
    if (back) returned.push({ ...ref(part), credits: back });
    if (part.credits - back) kept.unshift({ ...ref(part), credits: part.credits - back });
  }
  return { kept, returned };
}

/**
 * The figures the page shows: `balance` is every credit available now; `allowance` is what the month and
 * the plan terms hold plus the purchased credits still unspent (so buying more fills the meter rather than
 * stretching it), and `used` is what the month and plan terms have spent.
 */
export function creditTotals(buckets: readonly Bucket[]) {
  let balance = 0, allowance = 0, used = 0;
  for (const bucket of buckets) {
    balance += available(bucket);
    if (bucket.kind === "wallet") allowance += available(bucket);
    else { allowance += Math.max(0, bucket.capacity); used += Math.max(0, bucket.used); }
  }
  return { balance, allowance, used };
}

/** The meter after a charge keeps `parts`: spent credits leave the balance; spent purchased credits also leave the allowance. */
export function totalsAfter(before: { balance: number; allowance: number }, parts: readonly ChargePart[]) {
  const spent = parts.reduce((sum, part) => sum + part.credits, 0);
  const wallet = parts.reduce((sum, part) => sum + (part.kind === "wallet" ? part.credits : 0), 0);
  return { balance: Math.max(0, before.balance - spent), allowance: Math.max(0, before.allowance - wallet) };
}
