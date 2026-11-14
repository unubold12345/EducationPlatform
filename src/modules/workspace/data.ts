import "server-only";
import { cache } from "react";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { makeReport } from "@/modules/exams/engine";
import { findExam } from "@/modules/exams/definitions";
import type { ExamProgram, ExamState } from "@/modules/exams/types";
import { findAnyPlan } from "@/modules/subscriptions/plans";
import { programOf, programPrefixes } from "./programs";
import { creditSummary } from "@/modules/credits/service";
import type { CreditBalance } from "@/modules/credits/client";

export type ShellAccount = {
  name: string; email: string; userKey: string;
  plans: { title: string; daysLeft: number }[];
  // This month's AI credits; null when the credit tables cannot be read, so the shell still renders.
  credits: CreditBalance;
} | null;

const DAY_MS = 864e5;

/** What the sidebar shows about the signed-in student. Null for guests. */
export const shellAccount = cache(async (): Promise<ShellAccount> => {
  const session = await getSession();
  if (!session) return null;
  const now = new Date();
  const [plans, credits] = await Promise.all([
    getDb().subscription.findMany({ where: { userId: session.user.id, startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { endsAt: "asc" }, select: { program: true, endsAt: true } }),
    creditSummary(session.user.id, now).then(summary => ({ balance: summary.balance, allowance: summary.allowance, yellow: summary.yellow }), () => null),
  ]);
  return {
    name: session.user.name, email: session.user.email, userKey: session.user.id,
    plans: plans.map(plan => ({ title: findAnyPlan(plan.program)?.shortTitle ?? plan.program, daysLeft: Math.ceil((plan.endsAt.getTime() - now.getTime()) / DAY_MS) })),
    credits,
  };
});

export type AttemptSummary = {
  id: string; slug: string; title: string; program: ExamProgram | null; finishedAt: string;
  earned: number; total: number; correct: number; graded: number; pending: number; percent: number | null;
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Finished mocks with their scores, newest first. Each row reads its own immutable snapshot. */
export async function finishedAttempts(userId: string, { skip = 0, take = 12, program }: { skip?: number; take?: number; program?: ExamProgram } = {}) {
  const where = { userId, status: "SUBMITTED", ...(program ? { slug: { startsWith: programPrefixes[program] } } : {}) };
  const db = getDb();
  const [rows, count] = await Promise.all([
    db.mockAttempt.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take, select: { id: true, slug: true, state: true, updatedAt: true } }),
    db.mockAttempt.count({ where }),
  ]);
  const items: AttemptSummary[] = rows.map(row => {
    const state = row.state as unknown as ExamState;
    const report = makeReport(state);
    const scored = report.reviews.filter(review => !review.pretest && review.correct !== null);
    const total = report.points.total;
    return {
      id: row.id, slug: row.slug, title: state.definition.title, program: programOf(row.slug),
      finishedAt: (state.finishedAt ?? row.updatedAt.toISOString()),
      earned: round(report.points.earned), total, graded: scored.length,
      correct: scored.filter(review => review.correct).length,
      pending: report.reviews.filter(review => !review.pretest && review.correct === null).length,
      percent: total ? Math.round((report.points.earned / total) * 100) : null,
    };
  });
  return { items, count };
}

export async function openAttempts(userId: string) {
  const rows = await getDb().mockAttempt.findMany({ where: { userId, status: "IN_PROGRESS" }, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, slug: true, updatedAt: true } });
  return rows.map(row => ({ id: row.id, slug: row.slug, title: findExam(row.slug)?.title ?? row.slug, program: programOf(row.slug), updatedAt: row.updatedAt.toISOString() }));
}
