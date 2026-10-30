// Pure fixed-window rule for per-account sign-in attempts (unit tested).
export const ACCOUNT_ATTEMPTS = 10;
export const ACCOUNT_WINDOW_MS = 60_000;
export function nextAttempt(previous: { count: number; last: number } | null, now: number) {
  if (!previous || now - previous.last >= ACCOUNT_WINDOW_MS) return { allowed: true, count: 1, last: now };
  if (previous.count >= ACCOUNT_ATTEMPTS) return { allowed: false, count: previous.count, last: previous.last };
  return { allowed: true, count: previous.count + 1, last: previous.last };
}
