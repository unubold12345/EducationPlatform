// Monthly plans (owner rules 2026-11-13 and 2026-11-17): the free account plus three plans.
// - entrance (ЭЕШ, 29,900): every ЭЕШ mock and its practice mode, no limit.
// - language_basic (Гадаад хэл Basic, 29,900): every mock that is not ЭЕШ (SAT, IELTS, JLPT, HSK), no limit, the IELTS
//   workshops, 1,200 AI credits, a 1,500-word bank and 5 saved file exams.
// - language (Гадаад хэл Pro, 59,900): the same mocks and workshops with 3,000 AI credits, a 3,000-word bank and 15 saved
//   file exams. The key stays "language" so subscriptions bought before the rename keep working. Until 2026-11-17 this
//   plan opened 15 picked mocks a month; the pick machinery (`mockPicks`, mock-access.ts) stays for any plan that sets it.
// The IELTS and SAT plans are retired: they are no longer sold or renewed, and a subscription bought before the
// change keeps its access, AI credits and limits until it ends (`legacyPlans`).
//
// aiCredits: monthly AI credits the plan adds to the free allowance (see src/modules/credits/pricing.ts).
// vocabularyWords: the vocabulary bank size while the plan is active; the largest active plan wins and the
// free bank is VOCABULARY_LIMITS.freeWords (see src/modules/vocabulary/contracts.ts).
// savedExams: how many exams made from a file the student keeps while the plan is active; the largest active
// plan wins and a free account keeps MY_EXAM_LIMITS.freeExams (see src/modules/my-exams/contracts.ts).
// readingPractices: how many Reading Lab practices the student keeps (owner rule 2026-11-17: Basic 5, Pro 15); the
// largest active plan wins and a free account keeps READING_LIMITS.freePractices (see reading-lab/state.ts).
// expertReviews: Essay Studio expert reviews by Claude Opus a plan month (owner rule 2026-11-17, revised the same day: Basic 2,
// Pro 5); 0 means the plan adds none, and an account without one gets EXPERT_LIMITS.freeReviews (now 0; see writing-lab/expert.ts).
// exams: the exam programmes whose mocks the plan opens. mockPicks: mocks a student may pick per plan month,
// null when every covered mock is open. workshops: the IELTS Writing & Speaking workshops.
export type SubscriptionProgram = "entrance" | "language" | "language_basic" | "ielts" | "sat";
type ExamKey = "sat" | "ielts" | "entrance" | "jlpt" | "hsk" | "toefl" | "topik";
type PlanDefinition = {
  program: SubscriptionProgram; title: string; shortTitle: string; amountMnt: number; aiCredits: number;
  vocabularyWords: number; savedExams: number; readingPractices: number; expertReviews: number; symbol: string; description: string; features: readonly string[];
  exams: readonly ExamKey[]; mockPicks: number | null; workshops: boolean;
};

export const subscriptionPlans = [
  { program:"entrance", title:"ЭЕШ", shortTitle:"ЭЕШ", amountMnt:29900, aiCredits:1200, vocabularyWords:500, savedExams:5, readingPractices:5, expertReviews:0, symbol:"∑", exams:["entrance"], mockPicks:null, workshops:false,
    description:"ЭЕШ-ийн бүх хичээлийн бүтэн mock шалгалт, дадлага хязгааргүй.",
    features:["Бүх 194 ЭЕШ mock: математик 55, физик 60, хими 18, биологи 21, англи 40", "Хязгааргүй өгөх, цаггүй дадлага", "AI туслах, тайлбартай үр дүн", "Хадгалсан явц, дахин өгөх боломж"] },
  { program:"language_basic", title:"Гадаад хэл Basic", shortTitle:"Гадаад хэл Basic", amountMnt:29900, aiCredits:1200, vocabularyWords:1500, savedExams:5, readingPractices:5, expertReviews:2, symbol:"Aa", exams:["sat","ielts","toefl","jlpt","hsk","topik"], mockPicks:null, workshops:true,
    description:"SAT, IELTS, TOEFL, JLPT, HSK, TOPIK-ийн бүх mock, IELTS workshop. Үндсэн багц.",
    features:["ЭЕШ-ээс бусад бүх mock: SAT, IELTS, TOEFL, JLPT, HSK, TOPIK", "Хязгааргүй өгөх, цаггүй дадлага", "Бүх IELTS Writing & Speaking workshop", "Шинжээчийн эссэ үнэлгээ: сард 2", "AI туслах, тайлбартай үр дүн"] },
  { program:"language", title:"Гадаад хэл Pro", shortTitle:"Гадаад хэл Pro", amountMnt:59900, aiCredits:3000, vocabularyWords:3000, savedExams:15, readingPractices:15, expertReviews:5, symbol:"Aa+", exams:["sat","ielts","toefl","jlpt","hsk","topik"], mockPicks:null, workshops:true,
    description:"Basic-ийн бүх боломж, нэмээд 3,000 AI кредит, 3,000 үгийн сан, 15 файлаас шалгалт.",
    features:["ЭЕШ-ээс бусад бүх mock: SAT, IELTS, TOEFL, JLPT, HSK, TOPIK", "Хязгааргүй өгөх, цаггүй дадлага", "Бүх IELTS Writing & Speaking workshop", "Шинжээчийн эссэ үнэлгээ: сард 5", "AI туслах, тайлбартай үр дүн"] },
] as const satisfies readonly PlanDefinition[];

/** Retired 2026-11-13: not sold or renewed; active subscriptions keep these rules until they end. */
export const legacyPlans = [
  { program:"ielts", title:"IELTS (хуучин багц)", shortTitle:"IELTS", amountMnt:60000, aiCredits:3000, vocabularyWords:3000, savedExams:15, readingPractices:15, expertReviews:5, symbol:"Aa", exams:["ielts"], mockPicks:null, workshops:true,
    description:"Хуучин IELTS багц: хугацаа дуустал IELTS mock, workshop нээлттэй.", features:["12 бүтэн IELTS Academic mock", "4 Writing & Speaking workshop"] },
  { program:"sat", title:"SAT (хуучин багц)", shortTitle:"SAT", amountMnt:60000, aiCredits:2000, vocabularyWords:3000, savedExams:15, readingPractices:15, expertReviews:0, symbol:"x²", exams:["sat"], mockPicks:null, workshops:false,
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
/** The cheapest plan on sale that opens an exam programme's mocks, for "or take the plan" links. */
export function salePlanFor(examProgram:string) { return subscriptionPlans.filter(plan=>planCovers(plan,examProgram)).sort((a,b)=>a.amountMnt-b.amountMnt)[0]; }
/** Where a student goes to use a plan: the ЭЕШ programme page, or the exams hub for the language plans. */
export function planHomeHref(program:string) { return program==="entrance"||program==="ielts"||program==="sat" ? "/programs/"+program : "/exams"; }

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
export const PLAN_SALE_MIN = PLAN_PRICE_LIMITS.min;
export function validPlanPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= PLAN_PRICE_LIMITS.min && value <= PLAN_PRICE_LIMITS.max && value % PLAN_PRICE_LIMITS.step === 0;
}

/** A stored sale on a plan price: the sale price and when it ends (null = until an admin removes it). */
export type PlanSale = { saleAmountMnt: number | null; saleEndsAt: Date | null };
/**
 * The price charged now: the sale price while a sale is set, cheaper than the regular price and not ended; otherwise
 * the regular price. The sale never raises a price, so a stale row cannot overcharge.
 */
export function chargedPrice(regularMnt: number, sale: PlanSale | null | undefined, now = new Date()) {
  if (!sale || sale.saleAmountMnt === null || sale.saleAmountMnt >= regularMnt) return regularMnt;
  if (sale.saleEndsAt && sale.saleEndsAt.getTime() <= now.getTime()) return regularMnt;
  return sale.saleAmountMnt;
}
/** A sale price an admin may set: whole hundreds, within the price limits and below the regular price. */
export function validSalePrice(value: unknown, regularMnt: number): value is number {
  return validPlanPrice(value) && value < regularMnt;
}
/** The end of a sale day (23:59:59.999 Ulaanbaatar) from a "YYYY-MM-DD" date; null for anything else or a past day. */
export function saleEndFromDate(value: unknown, now = new Date()): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const end = new Date(`${value}T23:59:59.999+08:00`);
  return Number.isFinite(end.getTime()) && end.getTime() > now.getTime() ? end : null;
}
