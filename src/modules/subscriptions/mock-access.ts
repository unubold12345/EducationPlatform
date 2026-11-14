import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { isFreeMock } from "@/modules/exams/free/catalog";
import { findAnyPlan, planCovers, planMonth } from "./plans";

/**
 * Who may sit or practise a mock, decided on the server for every start, read, save, check, audio and AI path.
 * In order: a free mock (every signed-in account), a per-mock purchase, a plan that opens every mock of its exam
 * programme (ЭЕШ; the retired IELTS and SAT plans until they end), or a Гадаад хэл pick for the current plan month.
 */
export type MockMonth = { start: string; end: string; used: number; limit: number };
export type MockAccess =
  | { kind: "free" }
  | { kind: "purchase" }
  | { kind: "plan"; program: string }
  /** Picked this plan month: sittings (retakes too) and practice are open until `month.end`. */
  | { kind: "picked"; program: string; month: MockMonth }
  /** The plan covers the mock and picks are left this month; picking it opens it. */
  | { kind: "pickable"; program: string; month: MockMonth }
  /** The plan covers the mock but this plan month's picks are used up. */
  | { kind: "full"; program: string; month: MockMonth }
  | { kind: "none" };

/** Access kinds that open the timed sitting and practice mode now. */
export function opensMock(access: MockAccess) {
  return access.kind === "free" || access.kind === "purchase" || access.kind === "plan" || access.kind === "picked";
}

type Reader = Pick<Prisma.TransactionClient, "subscription" | "mockPurchase" | "mockPick">;
type ActiveRow = { id: string; program: string; startsAt: Date; endsAt: Date };
const iso = (ms: number) => new Date(ms).toISOString();

async function monthOf(db: Reader, userId: string, row: ActiveRow, slug: string, limit: number, now: number) {
  const month = planMonth(row.startsAt.getTime(), row.endsAt.getTime(), now);
  if (!month) return null;
  const monthStart = new Date(month.start);
  const [mine, used] = await Promise.all([
    db.mockPick.findUnique({ where: { userId_program_monthStart_slug: { userId, program: row.program, monthStart, slug } }, select: { id: true } }),
    db.mockPick.count({ where: { userId, program: row.program, monthStart } }),
  ]);
  return { picked: Boolean(mine), month: { start: iso(month.start), end: iso(month.end), used, limit } };
}

/** The student's access to one mock of `examProgram` right now. Pass the transaction client inside one. */
export async function mockAccess(userId: string, slug: string, examProgram: string, db: Reader = getDb(), now = new Date()): Promise<MockAccess> {
  if (isFreeMock(slug)) return { kind: "free" };
  if (await db.mockPurchase.findFirst({ where: { userId, examSlug: slug, status: "PAID" }, select: { id: true } })) return { kind: "purchase" };
  const rows = await db.subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { id: true, program: true, startsAt: true, endsAt: true } });
  let picks: MockAccess | null = null;
  for (const row of rows) {
    const plan = findAnyPlan(row.program);
    if (!plan || !planCovers(plan, examProgram)) continue;
    // A plan that opens every covered mock wins over picks.
    if (plan.mockPicks === null) return { kind: "plan", program: plan.program };
    const state = await monthOf(db, userId, row, slug, plan.mockPicks, now.getTime());
    if (!state) continue;
    const program = plan.program;
    picks = state.picked ? { kind: "picked", program, month: state.month }
      : state.month.used < state.month.limit ? { kind: "pickable", program, month: state.month }
      : { kind: "full", program, month: state.month };
  }
  return picks ?? { kind: "none" };
}

/** True when the mock opens now (free, bought, a plan, or picked this plan month). */
export async function mayUseMock(userId: string, slug: string, examProgram: string, db: Reader = getDb()) {
  return opensMock(await mockAccess(userId, slug, examProgram, db));
}

export class PicksUsedUp extends ApiError {
  constructor(limit: number, end: string) {
    super(409, `Энэ сарын ${limit} mock-ийн сонголт дууссан. ${new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" }).format(new Date(end))}-нд шинэ сонголт нээгдэнэ. Эсвэл энэ шалгалтын эрхийг тусад нь авч болно.`);
  }
}

/**
 * Picks a mock for the current plan month under a plan with monthly picks (Гадаад хэл). Picking a mock that is
 * already open (free, bought, an unlimited plan, or already picked) changes nothing and uses no pick. Picks for one
 * subscription queue on its row lock, so two tabs cannot both take the last pick.
 */
export async function pickMock(userId: string, slug: string, examProgram: string): Promise<MockAccess> {
  return getDb().$transaction(async tx => {
    const now = new Date();
    const current = await mockAccess(userId, slug, examProgram, tx, now);
    if (current.kind === "none") throw new ApiError(402, "Энэ шалгалтыг сонгоход Гадаад хэл багц шаардлагатай.");
    if (current.kind !== "pickable" && current.kind !== "full") return current;
    const row = await tx.subscription.findFirst({ where: { userId, program: current.program, startsAt: { lte: now }, endsAt: { gt: now } }, select: { id: true, program: true, startsAt: true, endsAt: true } });
    const plan = findAnyPlan(current.program);
    if (!row || !plan?.mockPicks) throw new ApiError(402, "Энэ шалгалтыг сонгоход Гадаад хэл багц шаардлагатай.");
    await tx.$queryRaw`SELECT "id" FROM "Subscription" WHERE "id" = ${row.id} FOR UPDATE`;
    const state = await monthOf(tx, userId, row, slug, plan.mockPicks, now.getTime());
    if (!state) throw new ApiError(402, "Энэ шалгалтыг сонгоход Гадаад хэл багц шаардлагатай.");
    if (state.picked) return { kind: "picked", program: row.program, month: state.month };
    if (state.month.used >= state.month.limit) throw new PicksUsedUp(state.month.limit, state.month.end);
    try {
      await tx.mockPick.create({ data: { userId, program: row.program, slug, monthStart: new Date(state.month.start), monthEnd: new Date(state.month.end) } });
    } catch (error) {
      // Another request picked the same mock first; it is open either way.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      return { kind: "picked", program: row.program, month: state.month };
    }
    return { kind: "picked", program: row.program, month: { ...state.month, used: state.month.used + 1 } };
  });
}

/** The student's Гадаад хэл picks for the current plan month, for the plan and library pages. */
export async function currentPicks(userId: string, now = new Date()) {
  const db = getDb();
  const rows = await db.subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { id: true, program: true, startsAt: true, endsAt: true } });
  for (const row of rows) {
    const plan = findAnyPlan(row.program);
    if (!plan?.mockPicks) continue;
    const month = planMonth(row.startsAt.getTime(), row.endsAt.getTime(), now.getTime());
    if (!month) continue;
    const picks = await db.mockPick.findMany({ where: { userId, program: row.program, monthStart: new Date(month.start) }, orderBy: { createdAt: "asc" }, select: { slug: true } });
    return { program: plan.program, title: plan.title, start: iso(month.start), end: iso(month.end), limit: plan.mockPicks, slugs: picks.map(pick => pick.slug) };
  }
  return null;
}

/** Whether an active plan includes the IELTS Writing & Speaking workshops (Гадаад хэл, or the retired IELTS plan). */
export async function hasWorkshops(userId: string, now = new Date()) {
  const rows = await getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } });
  return rows.some(row => findAnyPlan(row.program)?.workshops);
}

export type HubState = "bought" | "plan" | "picked" | "pickable" | null;
/**
 * What a programme hub shows per mock: bought, open with a plan, picked this Гадаад хэл month, pickable (the plan is
 * active and picks are left) or nothing. Display only; every start and practice request is checked again.
 */
export async function hubAccess(userId: string | undefined, slugs: string[], examProgram: string) {
  const none = { state: (_slug: string): HubState => null, practice: (_slug: string) => false };
  if (!userId) return none;
  const now = new Date();
  const db = getDb();
  const [purchases, rows] = await Promise.all([
    db.mockPurchase.findMany({ where: { userId, examSlug: { in: slugs }, status: "PAID" }, select: { examSlug: true } }),
    db.subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { id: true, program: true, startsAt: true, endsAt: true } }),
  ]);
  const bought = new Set(purchases.map(row => row.examSlug));
  let unlimited = false, picked = new Set<string>(), left = 0;
  for (const row of rows) {
    const plan = findAnyPlan(row.program);
    if (!plan || !planCovers(plan, examProgram)) continue;
    if (plan.mockPicks === null) { unlimited = true; continue; }
    const month = planMonth(row.startsAt.getTime(), row.endsAt.getTime(), now.getTime());
    if (!month) continue;
    const picks = await db.mockPick.findMany({ where: { userId, program: row.program, monthStart: new Date(month.start) }, select: { slug: true } });
    picked = new Set(picks.map(pick => pick.slug));
    left = Math.max(0, plan.mockPicks - picks.length);
  }
  const state = (slug: string): HubState => bought.has(slug) ? "bought" : unlimited ? "plan" : picked.has(slug) ? "picked" : left > 0 ? "pickable" : null;
  return { state, practice: (slug: string) => { const value = state(slug); return value === "bought" || value === "plan" || value === "picked"; } };
}
/** The hub's short label for a mock's access. */
export function hubLabel(state: HubState, price: string) {
  return state === "bought" ? "Нээлттэй" : state === "plan" ? "Багцад" : state === "picked" ? "Энэ сар сонгосон" : state === "pickable" ? "Багцаар сонгох" : price;
}
