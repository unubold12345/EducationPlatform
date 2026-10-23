import test from "node:test";
import assert from "node:assert/strict";
import { subscriptionPlans,findSubscriptionPlan,addCalendarMonth,formatBillingDate } from "../src/modules/subscriptions/plans.ts";
test("program plans have the exact three independent monthly prices",()=>{
  assert.deepEqual(subscriptionPlans.map(p=>[p.program,p.amountMnt]),[["entrance",40000],["ielts",60000],["sat",60000]]);
  assert.equal(findSubscriptionPlan("all"),undefined);
  assert.equal(findSubscriptionPlan("../../ielts"),undefined);
});
test("billing receipt dates use Ulaanbaatar time without browser locale fallback",()=>{
  assert.equal(formatBillingDate("2026-01-31T00:30:00Z"),"2026.01.31 · 08:30");
});
test("monthly billing clamps Ulaanbaatar month ends and preserves local clock time",()=>{
  assert.equal(addCalendarMonth(new Date("2026-01-31T12:34:56.123+08:00")).toISOString(),new Date("2026-02-28T12:34:56.123+08:00").toISOString());
  assert.equal(addCalendarMonth(new Date("2028-01-31T01:00:00+08:00")).toISOString(),new Date("2028-02-29T01:00:00+08:00").toISOString());
  assert.equal(addCalendarMonth(new Date("2026-12-23T21:20:00+08:00")).toISOString(),new Date("2027-01-23T21:20:00+08:00").toISOString());
  assert.equal(addCalendarMonth(new Date("2026-01-30T23:30:00Z")).toISOString(),new Date("2026-02-27T23:30:00Z").toISOString());
  assert.throws(()=>addCalendarMonth(new Date("invalid")),RangeError);
});
