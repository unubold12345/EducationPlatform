import "server-only";
import { getDb } from "./db";
import { nextAttempt } from "./account-throttle-rule";

// Sign-in attempts per email address, stored beside Better Auth's own rate-limit rows. A database
// error never blocks sign-in; the per-IP limit still applies.
export async function allowAccountAttempt(email: string) {
  const key = "account-sign-in:" + email.trim().toLowerCase().slice(0, 200);
  try {
    const db = getDb(), now = Date.now();
    const row = await db.rateLimit.findUnique({ where: { key }, select: { count: true, lastRequest: true } });
    const next = nextAttempt(row ? { count: row.count, last: Number(row.lastRequest) } : null, now);
    if (!next.allowed) return false;
    await db.rateLimit.upsert({ where: { key }, create: { id: crypto.randomUUID(), key, count: next.count, lastRequest: BigInt(next.last) }, update: { count: next.count, lastRequest: BigInt(next.last) } });
    return true;
  } catch {
    return true;
  }
}
