import "server-only";
import { getDb } from "@/lib/db";
import { isFreeMock } from "@/modules/exams/free/catalog";
import type { ExamProgram } from "@/modules/exams/types";
import type { PickState } from "./pick-client";
import type { PlanOffer } from "@/modules/exams/start-client";
import { mockAccess, opensMock, type MockAccess } from "./mock-access";
import { salePlanFor } from "./plans";
import { pricedPlan } from "./prices";

export type BriefingAccess = {
  /** The timed start is open: the mock opens now, or a sitting started under a plan is still open. */
  hasAccess: boolean;
  /** Practice mode opens (the same rule the practice API applies). */
  practice: boolean;
  free: boolean;
  pick: PickState | null;
  /** When this plan month's pick ends, for a picked mock. */
  pickedUntil: string | null;
  plan: PlanOffer | null;
  activeAttemptId?: string;
  /** Why practice is closed, when it is. */
  locked?: string;
  access: MockAccess;
};

/** What a mock's briefing page shows about access. Every decision is re-made by the API on start, read and practice. */
export async function briefingAccess(userId: string | null, slug: string, program: ExamProgram): Promise<BriefingAccess> {
  const free = isFreeMock(slug);
  const sale = free ? undefined : salePlanFor(program);
  const priced = sale ? await pricedPlan(sale.program) : undefined;
  const plan = priced ? { program: priced.program, title: priced.title, amountMnt: priced.amountMnt, picks: priced.mockPicks } : null;
  if (!userId) return { hasAccess: false, practice: false, free, pick: null, pickedUntil: null, plan, locked: free ? "Нэвтэрсний дараа үнэгүй нээгдэнэ." : undefined, access: { kind: "none" } };
  const [access, sitting] = await Promise.all([
    mockAccess(userId, slug, program),
    getDb().mockAttempt.findFirst({ where: { userId, slug, status: "IN_PROGRESS" }, select: { id: true, subscriptionAccess: true } }),
  ]);
  const opens = opensMock(access);
  const pick = access.kind === "pickable" || access.kind === "full" ? { kind: access.kind, used: access.month.used, limit: access.month.limit, end: access.month.end } : null;
  return {
    hasAccess: opens || Boolean(sitting?.subscriptionAccess), practice: opens, free, pick,
    pickedUntil: access.kind === "picked" ? access.month.end : null, plan, activeAttemptId: sitting?.id,
    locked: pick ? (pick.kind === "full" ? "Энэ сарын сонголт дууссан." : "Энэ mock-ийг сонгосны дараа нээгдэнэ.") : undefined,
    access,
  };
}
