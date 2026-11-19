import "server-only";
import { getDb } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { AI_PROVIDERS, type AiProvider } from "./core";

/** The periods the admin page offers, newest first. */
export const AI_RANGES = [["1d", "24 цаг", 1], ["3d", "3 хоног", 3], ["7d", "7 хоног", 7], ["30d", "30 хоног", 30]] as const;
export type AiRange = typeof AI_RANGES[number][0];
export const aiRange = (value: string): AiRange => AI_RANGES.some(([key]) => key === value) ? value as AiRange : "3d";
export const rangeDays = (range: AiRange) => AI_RANGES.find(([key]) => key === range)![2];
/** Where the period begins, counted back from the request time. */
export const rangeStart = (range: AiRange) => new Date(Date.now() - rangeDays(range) * 864e5);

const sum = (value: number | null | undefined) => value ?? 0;

/** Everything the AI usage tab shows for one period. Only billable rows (real provider hosts) count as money. */
export async function aiUsageReport(since: Date) {
  const db = getDb();
  const window: Prisma.AiCallWhereInput = { createdAt: { gte: since } };
  const billable: Prisma.AiCallWhereInput = { ...window, billable: true };
  const [total, mock, failed, unknownCost, bySource, byProvider, byUserRaw, byEnvironment, byAgent, byDay] = await Promise.all([
    db.aiCall.aggregate({ where: billable, _count: true, _sum: { costMicroUsd: true, promptTokens: true, completionTokens: true } }),
    db.aiCall.count({ where: { ...window, billable: false } }),
    db.aiCall.count({ where: { ...billable, status: { not: "ok" } } }),
    // A timeout may still have been billed by the provider; its cost is not known.
    db.aiCall.count({ where: { ...billable, status: "timeout" } }),
    db.aiCall.groupBy({ by: ["origin", "source"], where: billable, _count: true, _sum: { costMicroUsd: true, promptTokens: true, completionTokens: true } }),
    db.aiCall.groupBy({ by: ["provider", "model"], where: billable, _count: true, _sum: { costMicroUsd: true } }),
    db.aiCall.groupBy({ by: ["userId"], where: { ...billable, userId: { not: null } }, _count: true, _sum: { costMicroUsd: true } }),
    db.aiCall.groupBy({ by: ["environment"], where: billable, _count: true, _sum: { costMicroUsd: true } }),
    db.aiCall.groupBy({ by: ["agent"], where: { ...billable, origin: "script" }, _count: true, _sum: { costMicroUsd: true } }),
    db.$queryRaw<{ day: string; calls: number; cost: number }[]>`
      SELECT to_char("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ulaanbaatar', 'YYYY-MM-DD') AS day,
             count(*)::int AS calls, coalesce(sum("costMicroUsd"), 0)::int AS cost
      FROM "AiCall" WHERE "createdAt" >= ${since} AND "billable" = true GROUP BY 1 ORDER BY 1 DESC`,
  ]);
  const topUsers = byUserRaw.sort((a, b) => sum(b._sum.costMicroUsd) - sum(a._sum.costMicroUsd)).slice(0, 10);
  const people = await db.user.findMany({ where: { id: { in: topUsers.map(row => row.userId!) } }, select: { id: true, email: true, name: true } });
  const app = bySource.filter(row => row.origin === "app").reduce((acc, row) => acc + sum(row._sum.costMicroUsd), 0);
  const scripts = bySource.filter(row => row.origin === "script").reduce((acc, row) => acc + sum(row._sum.costMicroUsd), 0);
  return {
    calls: total._count, costMicroUsd: sum(total._sum.costMicroUsd), promptTokens: sum(total._sum.promptTokens), completionTokens: sum(total._sum.completionTokens),
    appMicroUsd: app, scriptMicroUsd: scripts, mock, failed, unknownCost,
    bySource: bySource.map(row => ({ origin: row.origin, source: row.source, calls: row._count, costMicroUsd: sum(row._sum.costMicroUsd), promptTokens: sum(row._sum.promptTokens), completionTokens: sum(row._sum.completionTokens) }))
      .sort((a, b) => b.costMicroUsd - a.costMicroUsd || b.calls - a.calls),
    byProvider: byProvider.map(row => ({ provider: row.provider as AiProvider, model: row.model, calls: row._count, costMicroUsd: sum(row._sum.costMicroUsd) }))
      .sort((a, b) => b.costMicroUsd - a.costMicroUsd),
    byUser: topUsers.map(row => ({ userId: row.userId!, user: people.find(person => person.id === row.userId) ?? null, calls: row._count, costMicroUsd: sum(row._sum.costMicroUsd) })),
    byEnvironment: byEnvironment.map(row => ({ environment: row.environment, calls: row._count, costMicroUsd: sum(row._sum.costMicroUsd) })),
    byAgent: byAgent.map(row => ({ agent: row.agent ?? "", calls: row._count, costMicroUsd: sum(row._sum.costMicroUsd) })).sort((a, b) => b.costMicroUsd - a.costMicroUsd),
    byDay,
  };
}

export type BalanceSegment = { from: Date; to: Date; currency: string; dropMicros: number; trackedMicroUsd: number; topUp: boolean };

/**
 * Compares the DeepSeek balance readings with the DeepSeek calls recorded between them. Each pair of consecutive
 * readings is a segment: money that left the account, what the log priced in that time, and the difference (spend the
 * log never saw: another environment on the same key, a script that bypassed the helper). A rise is a top-up.
 * Readings show cents, so a segment's difference within ±$0.01 is rounding.
 */
export async function balanceCheck(since: Date) {
  const db = getDb();
  const before = await db.aiBalance.findFirst({ where: { provider: "deepseek", createdAt: { lt: since } }, orderBy: { createdAt: "desc" } });
  const inside = await db.aiBalance.findMany({ where: { provider: "deepseek", createdAt: { gte: since } }, orderBy: { createdAt: "asc" }, take: 500 });
  const readings = [...(before ? [before] : []), ...inside];
  const segments: BalanceSegment[] = [];
  for (let i = 1; i < readings.length; i++) {
    const a = readings[i - 1], b = readings[i];
    if (a.currency !== b.currency) continue;
    const drop = Number(a.totalMicros - b.totalMicros);
    const tracked = await db.aiCall.aggregate({ where: { provider: "deepseek", billable: true, createdAt: { gte: a.createdAt, lt: b.createdAt } }, _sum: { costMicroUsd: true } });
    segments.push({ from: a.createdAt, to: b.createdAt, currency: b.currency, dropMicros: drop, trackedMicroUsd: sum(tracked._sum.costMicroUsd), topUp: drop < 0 });
  }
  const spent = segments.filter(segment => !segment.topUp);
  const latest = readings.at(-1) ?? null;
  return {
    latest: latest && { at: latest.createdAt, currency: latest.currency, totalMicros: Number(latest.totalMicros) },
    readings: readings.length,
    first: readings[0]?.createdAt ?? null,
    dropMicros: spent.reduce((acc, segment) => acc + segment.dropMicros, 0),
    trackedMicroUsd: spent.reduce((acc, segment) => acc + segment.trackedMicroUsd, 0),
    currency: latest?.currency ?? "USD",
    segments: segments.reverse(),
  };
}

export type CallFilter = "" | "app" | "script" | "failed" | "mock" | AiProvider;
export const CALL_FILTERS: readonly (readonly [CallFilter, string])[] = [
  ["", "Бүх бодит дуудлага"], ["app", "Сайтын онцлог"], ["script", "Скрипт, агент"], ["failed", "Амжилтгүй"], ["mock", "Туршилтын сервер (төлбөргүй)"],
  ...AI_PROVIDERS.map(provider => [provider, provider === "deepseek" ? "DeepSeek" : provider === "anthropic" ? "Claude" : "DeepInfra"] as const),
];
export const callFilter = (value: string): CallFilter => CALL_FILTERS.some(([key]) => key === value) ? value as CallFilter : "";

/** One page of recorded calls, newest first. `q` matches a source, a model or a user's email. */
export async function aiCalls(since: Date, filter: CallFilter, q: string, skip: number, take: number) {
  const db = getDb();
  const people = q ? await db.user.findMany({ where: { email: { contains: q, mode: "insensitive" } }, select: { id: true }, take: 50 }) : [];
  const where: Prisma.AiCallWhereInput = {
    createdAt: { gte: since },
    ...(filter === "mock" ? { billable: false } : { billable: true }),
    ...(filter === "app" || filter === "script" ? { origin: filter } : {}),
    ...(filter === "failed" ? { status: { not: "ok" } } : {}),
    ...((AI_PROVIDERS as readonly string[]).includes(filter) ? { provider: filter } : {}),
    ...(q ? { OR: [{ source: { contains: q, mode: "insensitive" } }, { model: { contains: q, mode: "insensitive" } }, { agent: { contains: q, mode: "insensitive" } }, { userId: { in: people.map(person => person.id) } }] } : {}),
  };
  const [total, rows] = await Promise.all([db.aiCall.count({ where }), db.aiCall.findMany({ where, skip, take, orderBy: [{ createdAt: "desc" }, { id: "desc" }] })]);
  const users = await db.user.findMany({ where: { id: { in: [...new Set(rows.flatMap(row => row.userId ? [row.userId] : []))] } }, select: { id: true, email: true, name: true } });
  return { total, rows: rows.map(row => ({ ...row, user: users.find(user => user.id === row.userId) ?? null })) };
}
