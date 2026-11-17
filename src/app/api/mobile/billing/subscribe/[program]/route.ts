import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { pricedPlan } from "@/modules/subscriptions/prices";

// The mobile app's counterpart of /subscribe/[program] (src/app/subscribe/[program]/page.tsx): the plan on sale at
// its current price and the student's own subscription to it. Read-only; the order is created and confirmed
// through /api/subscriptions/orders. A retired or unknown plan is a 404, as on the page.
export async function GET(request: Request, { params }: { params: Promise<{ program: string }> }) {
  try {
    const user = await apiUser(request);
    const { program } = await params;
    const plan = program.length > 30 ? undefined : await pricedPlan(program);
    if (!plan) throw new ApiError(404, "Багц олдсонгүй.");
    const current = await getDb().subscription.findUnique({ where: { userId_program: { userId: user.id, program: plan.program } } });
    const now = new Date();
    const active = Boolean(current && current.startsAt <= now && current.endsAt > now);
    return privateJson({
      plan: { program: plan.program, title: plan.title, symbol: plan.symbol, description: plan.description, features: plan.features, amountMnt: plan.amountMnt, mockPicks: plan.mockPicks },
      current: current ? { active, until: new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "long", timeStyle: "short" }).format(current.endsAt) } : null,
      enabled: mockPilotPaymentsEnabled(),
    });
  } catch (error) { return apiFailure(error); }
}
