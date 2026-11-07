export type SubscriptionProgram = "entrance" | "ielts" | "sat";
export const subscriptionPlans = [
  { program:"entrance", title:"Их сургуулийн бэлтгэл", shortTitle:"University Prep", amountMnt:40000, symbol:"∑", description:"ЭЕШ-ийн бүх хичээлийн бүтэн mock шалгалтууд нэг эрхэд.", features:["Бүх 155 ЭЕШ mock: математик 55, физик 60, англи 40", "Цагтай шалгалт ба цаггүй дадлага", "AI туслах, тайлбартай үр дүн", "Хадгалсан явц, дахин өгөх боломж"] },
  { program:"ielts", title:"IELTS", shortTitle:"IELTS", amountMnt:60000, symbol:"Aa", description:"IELTS-ийн бүтэн mock шалгалт, workshop нэг эрхэд.", features:["6 бүтэн IELTS Academic mock", "4 Writing & Speaking workshop", "Listening audio, Reading, Writing, Speaking", "AI туслах, хадгалсан явц, үр дүн"] },
  { program:"sat", title:"SAT", shortTitle:"SAT", amountMnt:60000, symbol:"x²", description:"Digital SAT-ийн бүтэн mock шалгалтууд нэг эрхэд.", features:["6 бүтэн Digital SAT mock", "98 асуулт · 4 модуль", "Reading & Writing + Math, тоон хариулт", "AI туслах, тайлбар, хадгалсан явц"] },
] as const;
export function findSubscriptionPlan(program:unknown) { return subscriptionPlans.find(plan=>plan.program===program); }
export function addCalendarMonth(value:Date) {
  if(!Number.isFinite(value.getTime()))throw new RangeError("Invalid date");
  // Billing calendar follows Ulaanbaatar (UTC+08), preserving local day/time.
  const offset=8*60*60*1000;const next=new Date(value.getTime()+offset);const day=next.getUTCDate();next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+1);
  const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();next.setUTCDate(Math.min(day,last));return new Date(next.getTime()-offset);
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
