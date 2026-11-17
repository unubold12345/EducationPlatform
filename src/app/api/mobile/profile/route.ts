import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { authFeatures, isDemoEmail } from "@/lib/auth-features";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/modules/admin/service";
import { findExam } from "@/modules/exams/definitions";
import { findAnyPlan, findSubscriptionPlan } from "@/modules/subscriptions/plans";

// The mobile app's counterpart of /workspace/profile (src/app/workspace/profile/page.tsx and the subscription
// overview it renders): the same rows and the same demo-account and Google rules, as JSON. Read-only; the name,
// the password, Google linking, the verification email and sign-out go through Better Auth, as on the page.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const administrator = await isAdmin(user.id);
    const features = authFeatures(process.env);
    const sharedDemo = features.hostedDemo && isDemoEmail(user.email);
    const [exams, purchases, officialExams, googleAccount, subscriptions] = await Promise.all([
      getDb().mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
      getDb().mockPurchase.findMany({ where: { userId: user.id, status: "PAID" }, orderBy: { createdAt: "desc" }, select: { id: true, examSlug: true, provider: true, amountMnt: true } }),
      getDb().paperAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
      features.google && !sharedDemo ? getDb().account.findFirst({ where: { userId: user.id, providerId: "google" }, select: { id: true } }) : Promise.resolve(null),
      getDb().subscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    ]);
    const now = new Date();
    const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
    const isActive = (row: { startsAt: Date; endsAt: Date }) => row.startsAt <= now && row.endsAt > now;
    return privateJson({
      user: {
        name: user.name, email: user.email, emailVerified: user.emailVerified,
        joined: new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "long" }).format(user.createdAt),
      },
      administrator, sharedDemo,
      features: { google: features.google, email: features.email },
      googleLinked: !!googleAccount,
      finishedExams: exams + officialExams,
      // Active plans first, then the order they were bought in (subscription-overview.tsx).
      subscriptions: [...subscriptions].sort((a, b) => Number(isActive(b)) - Number(isActive(a))).map(row => ({
        id: row.id, program: row.program, title: findAnyPlan(row.program)?.title ?? row.program,
        active: isActive(row), until: date.format(row.endsAt),
        // Retired plans (IELTS, SAT) cannot be renewed; the Гадаад хэл plan replaces them.
        onSale: Boolean(findSubscriptionPlan(row.program)),
      })),
      purchases: purchases.map(purchase => ({
        id: purchase.id, slug: purchase.examSlug, title: findExam(purchase.examSlug)?.title ?? null,
        legacy: purchase.provider === "LEGACY", amountMnt: purchase.amountMnt,
      })),
    });
  } catch (error) { return apiFailure(error); }
}
