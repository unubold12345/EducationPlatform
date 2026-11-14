// Monthly plans (owner rule 2026-11-13): three plans in all — the free account, ЭЕШ and Гадаад хэл.
// - entrance (ЭЕШ): every ЭЕШ mock and its practice mode, no limit.
// - language (Гадаад хэл): any mock that is not ЭЕШ (SAT, IELTS, JLPT, HSK), at most `mockPicks` (15) per plan
//   month; a picked mock can be sat again and practised for the rest of that plan month (see mock-access.ts).
// The IELTS and SAT plans are retired: they are no longer sold or renewed, and a subscription bought before the
// change keeps its access, AI credits and limits until it ends (`legacyPlans`).
//
// aiCredits: monthly AI credits the plan adds to the free allowance (see src/modules/credits/pricing.ts).
// vocabularyWords: the vocabulary bank size while the plan is active; the largest active plan wins and the
// free bank is VOCABULARY_LIMITS.freeWords (see src/modules/vocabulary/contracts.ts).
// savedExams: how many exams made from a file the student keeps while the plan is active; the largest active
// plan wins and a free account keeps MY_EXAM_LIMITS.freeExams (see src/modules/my-exams/contracts.ts).
// exams: the exam programmes whose mocks the plan opens. mockPicks: mocks a student may pick per plan month,
// null when every covered mock is open. workshops: the IELTS Writing & Speaking workshops.
export type SubscriptionProgram = "entrance" | "language" | "ielts" | "sat";
type ExamKey = "sat" | "ielts" | "entrance" | "jlpt" | "hsk";
type PlanDefinition = {
  program: SubscriptionProgram; title: string; shortTitle: string; amountMnt: number; aiCredits: number;
  vocabularyWords: number; savedExams: number; symbol: string; description: string; features: readonly string[];
  exams: readonly ExamKey[]; mockPicks: number | null; workshops: boolean;
};

/** Mocks a Гадаад хэл student may pick in one plan month (owner rule 2026-11-13). */
export const LANGUAGE_MOCK_PICKS = 15;

export const subscriptionPlans = [
  { program:"entrance", title:"ЭЕШ", shortTitle:"ЭЕШ", amountMnt:40000, aiCredits:1500, vocabularyWords:100, savedExams:5, symbol:"∑", exams:["entrance"], mockPicks:null, workshops:false,
    description:"ЭЕШ-ийн бүх хичээлийн бүтэн mock шалгалт, дадлага хязгааргүй.",
    features:["Бүх 194 ЭЕШ mock: математик 55, физик 60, хими 18, биологи 21, англи 40", "Хязгааргүй өгөх, цаггүй дадлага", "AI туслах, тайлбартай үр дүн", "Хадгалсан явц, дахин өгөх боломж"] },
  { program:"language", title:"Гадаад хэл", shortTitle:"Гадаад хэл", amountMnt:60000, aiCredits:3000, vocabularyWords:3000, savedExams:15, symbol:"Aa", exams:["sat","ielts","jlpt","hsk"], mockPicks:LANGUAGE_MOCK_PICKS, workshops:true,
    description:"SAT, IELTS, JLPT, HSK-ийн mock-оос сар бүр 15-ыг сонгож өгнө.",
    features:["ЭЕШ-ээс бусад бүх mock: SAT, IELTS, JLPT, HSK", `Сар бүр ${LANGUAGE_MOCK_PICKS} mock сонгоно; сонгосон mock-оо тэр сардаа дахин өгч, дадлага хийнэ`, "IELTS Writing & Speaking workshop", "AI туслах, тайлбартай үр дүн"] },
] as const satisfies readonly PlanDefinition[];

/** Retired 2026-11-13: not sold or renewed; active subscriptions keep these rules until they end. */
export const legacyPlans = [
  { program:"ielts", title:"IELTS (хуучин багц)", shortTitle:"IELTS", amountMnt:60000, aiCredits:3000, vocabularyWords:3000, savedExams:15, symbol:"Aa", exams:["ielts"], mockPicks:null, workshops:true,
    description:"Хуучин IELTS багц: хугацаа дуустал IELTS mock, workshop нээлттэй.", features:["12 бүтэн IELTS Academic mock", "4 Writing & Speaking workshop"] },
  { program:"sat", title:"SAT (хуучин багц)", shortTitle:"SAT", amountMnt:60000, aiCredits:2000, vocabularyWords:3000, savedExams:15, symbol:"x²", exams:["sat"], mockPicks:null, workshops:false,
    description:"Хуучин SAT багц: хугацаа дуустал SAT mock нээлттэй.", features:["6 бүтэн Digital SAT mock"] },
] as const satisfies readonly PlanDefinition[];

/** Every plan a subscription row can name: on sale first, then retired. */
export const allPlans: readonly PlanDefinition[] = [...subscriptionPlans, ...legacyPlans];
export type SalePlan = (typeof subscriptionPlans)[number];

/** A plan on sale now (buy, renew, price, grant). Retired plans return undefined. */
export function findSubscriptionPlan(program:unknown) { return subscriptionPlans.find(plan=>plan.program===program); }
/** Any plan a stored subscription can name, retired ones included (access, credits, limits, titles). */
export function findAnyPlan(program:unknown): PlanDefinition | undefined { return allPlans.find(plan=>plan.program===program); }
/** Whether a plan opens mocks of an exam programme (picked or not). */
export function planCovers(plan:Pick<PlanDefinition,"exams">, examProgram:string) { return (plan.exams as readonly string[]).includes(examProgram); }
/** The plan on sale that opens an exam programme's mocks, for "or take the plan" links. */
export function salePlanFor(examProgram:string) { return subscriptionPlans.find(plan=>planCovers(plan,examProgram)); }

export function addCalendarMonth(value:Date) {
  if(!Number.isFinite(value.getTime()))throw new RangeError("Invalid date");
  // Billing calendar follows Ulaanbaatar (UTC+08), preserving local day/time.
  const offset=8*60*60*1000;const next=new Date(value.getTime()+offset);const day=next.getUTCDate();next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+1);
  const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();next.setUTCDate(Math.min(day,last));return new Date(next.getTime()-offset);
}
/** A guard against a malformed subscription row; 20 years of months. */
const MAX_PLAN_MONTHS = 240;
/**
 * The plan month that contains `now` (epoch ms): the subscription's start stepped by billing months, the same steps
 * a renewal adds, so a renewed plan keeps its month boundaries. The month ends at the next step or when the plan
 * ends, whichever is first. Null outside the subscription.
 */
export function planMonth(startsAt:number, endsAt:number, now:number): { start:number; end:number } | null {
  if(![startsAt,endsAt,now].every(Number.isFinite)||now<startsAt||now>=endsAt)return null;
  let start=startsAt;
  for(let months=0;months<MAX_PLAN_MONTHS;months++){
    const next=addCalendarMonth(new Date(start)).getTime();
    if(next>now)return { start, end:Math.min(next,endsAt) };
    start=next;
  }
  return null;
}
export function formatBillingDate(value:string) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Ulaanbaatar",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value)).map(part=>[part.type,part.value]));
  return `${parts.year}.${parts.month}.${parts.day} · ${parts.hour}:${parts.minute}`;
}
// Admin price edits stay in whole hundreds of tugrik within a sane monthly range.
export const PLAN_PRICE_LIMITS = { min: 1000, max: 1000000, step: 100 } as const;
export function validPlanPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= PLAN_PRICE_LIMITS.min && value <= PLAN_PRICE_LIMITS.max && value % PLAN_PRICE_LIMITS.step === 0;
}
