import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { currentPicks } from "@/modules/subscriptions/mock-access";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceTotal } from "@/modules/exams/entrance/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { freeMocks } from "@/modules/exams/free/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { creditAllowances, creditSummary } from "@/modules/credits/service";
import { creditPack } from "@/modules/credits/purchase";
import { DEFAULT_CREDIT_PACK, defaultAllowances, formatCredits } from "@/modules/credits/pricing";
import { VOCABULARY_LIMITS } from "@/modules/vocabulary/contracts";
import { MY_EXAM_LIMITS } from "@/modules/my-exams/contracts";

const DAY_MS = 864e5;
const count = (program: string) => examDefinitions.filter(exam => exam.program === program).length;

// The mobile app's counterpart of /workspace/plans (src/app/workspace/plans/page.tsx): the same loaders, the same
// fallbacks and the same lines the page builds on the server, as JSON. Read-only; buying goes through the existing
// order routes. Dates are formatted here, as on the page, so the app shows the site's own wording.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const [plans, allowances, pack] = await Promise.all([pricedPlans(), creditAllowances().catch(() => defaultAllowances()), creditPack().catch(() => ({ ...DEFAULT_CREDIT_PACK }))]);
    const now = new Date();
    const active = await getDb().subscription.findMany({ where: { userId: user.id, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true, endsAt: true } });
    const owned = new Map(active.map(item => [item.program, item]));
    const [credits, picks] = await Promise.all([creditSummary(user.id, now).catch(() => null), currentPicks(user.id, now).catch(() => null)]);
    const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
    const words = (value: number) => value.toLocaleString("en-US");
    const language = plans.find(plan => plan.program === "language");
    const languageMocks = count("sat") + count("ielts") + jlptMocks.length + hskMocks.length;
    const badges: Record<string, string> = {
      entrance: `${entranceTotal} MOCK · ХЯЗГААРГҮЙ`,
      language: `${languageMocks} MOCK-ООС САРД 15`,
    };
    const freeFeatures = [
      `${freeMocks.length} үнэгүй хагас mock: SAT, IELTS, ЭЕШ-ийн 5 хичээл, JLPT, HSK`,
      "Workspace: AI туслах, үгсийн сан, файлаас шалгалт",
      `Үгсийн санд ${words(VOCABULARY_LIMITS.freeWords)} үг, файлаас ${MY_EXAM_LIMITS.freeExams} шалгалт`,
      `Бүтэн mock-ийг нэг бүрчлэн ${MOCK_PRICE_LABEL}-өөр авна`,
    ];
    const mocksCell = (program: string) => program === "entrance" ? `${entranceTotal} ЭЕШ mock, хязгааргүй` : `Сард ${language?.mockPicks ?? 15} mock (SAT, IELTS, JLPT, HSK)`;
    // Columns: the free account first, then the plans in their card order.
    const comparison: { label: string; values: string[] }[] = [
      { label: "Үнэгүй хагас mock", values: [String(freeMocks.length), ...plans.map(() => String(freeMocks.length))] },
      { label: "Бүтэн mock", values: [`${MOCK_PRICE_LABEL} / mock`, ...plans.map(plan => mocksCell(plan.program))] },
      { label: "Цаггүй дадлага + AI туслах", values: ["Авсан, үнэгүй mock-д", ...plans.map(plan => plan.mockPicks ? "Сонгосон mock-д" : "✓")] },
      { label: "Writing & Speaking workshop", values: ["—", ...plans.map(plan => plan.workshops ? "4" : "—")] },
      { label: "AI кредит / сар", values: [formatCredits(allowances.free), ...plans.map(plan => "+" + formatCredits(allowances[plan.program]))] },
      { label: "Үгсийн сан", values: [VOCABULARY_LIMITS.freeWords, ...plans.map(plan => plan.vocabularyWords)].map(value => `${words(value)} үг`) },
      { label: "Файлаас шалгалт хадгалах", values: [MY_EXAM_LIMITS.freeExams, ...plans.map(plan => plan.savedExams)].map(String) },
      { label: "Хадгалсан явц, үр дүн", values: ["✓", ...plans.map(() => "✓")] },
    ];
    return privateJson({
      free: { credits: allowances.free, features: freeFeatures },
      plans: plans.map(plan => {
        const current = owned.get(plan.program);
        const month = plan.mockPicks && picks?.program === plan.program ? picks : null;
        return {
          program: plan.program, title: plan.title, shortTitle: plan.shortTitle, symbol: plan.symbol, amountMnt: plan.amountMnt,
          credits: allowances[plan.program], badge: badges[plan.program],
          features: [
            ...plan.features,
            ...(plan.vocabularyWords > VOCABULARY_LIMITS.freeWords || plan.savedExams > MY_EXAM_LIMITS.freeExams
              ? [`Үгсийн санд ${words(plan.vocabularyWords)} үг, файлаас ${plan.savedExams} шалгалт`] : []),
          ],
          // The same day count the Workspace rail shows (modules/workspace/data.ts).
          active: current ? { until: date.format(current.endsAt), daysLeft: Math.ceil((current.endsAt.getTime() - now.getTime()) / DAY_MS) } : null,
          picks: month ? { used: month.slugs.length, limit: month.limit, renews: date.format(new Date(month.end)) } : null,
        };
      }),
      comparison,
      credits: credits ? { normal: Math.max(0, credits.balance - credits.yellow), yellow: credits.yellow } : null,
      pack: { credits: pack.credits, amountMnt: pack.amountMnt },
      mockPriceLabel: MOCK_PRICE_LABEL,
      enabled: mockPilotPaymentsEnabled(),
    });
  } catch (error) { return apiFailure(error); }
}
