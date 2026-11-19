import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { subscriptionPlans,legacyPlans,allPlans,findSubscriptionPlan,findAnyPlan,planCovers,salePlanFor,planMonth,addCalendarMonth,formatBillingDate,chargedPrice,validSalePrice,saleEndFromDate,planHomeHref,planWorkshopFor,workshopPlansFor,PRO_OF } from "../src/modules/subscriptions/plans.ts";
import { MOCK_PURCHASE_DAYS,MOCK_PURCHASE_MS,MOCK_PRICE_TERM } from "../src/modules/exams/pricing.ts";
import { DEFAULT_CREDIT_PACKS,validCreditPacks } from "../src/modules/credits/pricing.ts";
const text=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("five plans: ЭЕШ, Англи хэл Basic / Pro and Ази хэл Basic / Pro (owner rule 2026-11-19); Гадаад хэл, IELTS and SAT are retired",()=>{
  assert.deepEqual(subscriptionPlans.map(p=>[p.program,p.title,p.amountMnt]),[["entrance","ЭЕШ",29900],["english_basic","Англи хэл Basic",29900],["english_pro","Англи хэл Pro",59900],["asian_basic","Ази хэл Basic",29900],["asian_pro","Ази хэл Pro",59900]]);
  // What each plan includes: monthly AI credits, bank size, saved file exams (the same Basic and Pro limits as Гадаад хэл had).
  assert.deepEqual(subscriptionPlans.map(p=>[p.program,p.aiCredits,p.vocabularyWords,p.savedExams]),[["entrance",1200,500,5],["english_basic",1200,1500,5],["english_pro",3000,3000,15],["asian_basic",1200,1500,5],["asian_pro",3000,3000,15]]);
  assert.equal(findSubscriptionPlan("all"),undefined);
  assert.equal(findSubscriptionPlan("../../language"),undefined);
  // Retired plans are not sold or renewed, but a subscription bought before the change is still recognised.
  for(const program of ["language_basic","language","ielts","sat"]){assert.equal(findSubscriptionPlan(program),undefined,program);assert.equal(findAnyPlan(program)?.program,program);}
  assert.deepEqual(legacyPlans.map(p=>p.program),["language_basic","language","ielts","sat"]);
  // Every program a row may name is allowed by the latest CHECK constraint.
  const migration=text("prisma/migrations/20261119120000_english_asian_plans/migration.sql");
  for(const plan of allPlans)assert.match(migration,new RegExp(`'${plan.program}'.*'${plan.program}'`,"s"),plan.program);
});
test("ЭЕШ opens every ЭЕШ mock; Англи хэл SAT, IELTS and TOEFL, Ази хэл JLPT, HSK and TOPIK, each with its workshops and no monthly picks",()=>{
  const entrance=findSubscriptionPlan("entrance");
  assert.equal(entrance.mockPicks,null);assert.deepEqual(entrance.exams,["entrance"]);assert.equal(entrance.workshops,false);
  for(const [family,exams,others] of [["english",["sat","ielts","toefl"],["jlpt","hsk","topik"]],["asian",["jlpt","hsk","topik"],["sat","ielts","toefl"]]])for(const tier of ["basic","pro"]){
    const plan=findSubscriptionPlan(family+"_"+tier);
    assert.equal(plan.mockPicks,null);assert.equal(plan.workshops,true);assert.deepEqual(plan.exams,exams);
    for(const exam of exams){assert.ok(planCovers(plan,exam),exam);assert.ok(planWorkshopFor(plan,exam),exam);}
    for(const exam of [...others,"entrance"]){assert.ok(!planCovers(plan,exam),plan.program+" "+exam);assert.ok(!planWorkshopFor(plan,exam),plan.program+" "+exam);}
    assert.equal(planHomeHref(plan.program),"/exams");
  }
  // The "or take the plan" link offers the cheapest plan that covers the programme.
  for(const exam of ["sat","ielts","toefl"])assert.equal(salePlanFor(exam)?.program,"english_basic",exam);
  for(const exam of ["jlpt","hsk","topik"])assert.equal(salePlanFor(exam)?.program,"asian_basic",exam);
  assert.deepEqual(workshopPlansFor("jlpt").map(p=>p.program),["asian_basic","asian_pro"]);
  assert.deepEqual(workshopPlansFor("toefl").map(p=>p.program),["english_basic","english_pro"]);
  assert.deepEqual(workshopPlansFor("entrance"),[]);
  // A retired Гадаад хэл plan keeps every mock and workshop until it ends; the retired IELTS plan only IELTS.
  for(const program of ["language_basic","language"])for(const exam of ["sat","ielts","toefl","jlpt","hsk","topik"])assert.ok(planWorkshopFor(findAnyPlan(program),exam),program+" "+exam);
  assert.ok(planWorkshopFor(findAnyPlan("ielts"),"ielts"));assert.ok(!planWorkshopFor(findAnyPlan("ielts"),"toefl"));assert.ok(!planWorkshopFor(findAnyPlan("sat"),"sat"));
  assert.ok(!planWorkshopFor(undefined,"ielts"));
  assert.equal(planHomeHref("entrance"),"/programs/entrance");assert.equal(planHomeHref("language"),"/exams");assert.equal(planHomeHref("language_basic"),"/exams");
  assert.equal(salePlanFor("entrance")?.program,"entrance");
  assert.equal(salePlanFor("unknown"),undefined);
  // The retired plans keep their old rule: every mock of their own programme, no picks.
  assert.deepEqual([findAnyPlan("ielts").exams,findAnyPlan("ielts").mockPicks,findAnyPlan("ielts").workshops],[["ielts"],null,true]);
  assert.deepEqual([findAnyPlan("sat").exams,findAnyPlan("sat").mockPicks],[["sat"],null]);
});
test("a plan month is the subscription's billing month, renewals included, and ends with the plan",()=>{
  const at=text=>Date.parse(text);
  // Bought 2026-11-25 10:00 Ulaanbaatar for one month.
  const start=at("2026-11-25T02:00:00Z"),end=addCalendarMonth(new Date(start)).getTime();
  assert.deepEqual(planMonth(start,end,start),{start,end});
  assert.deepEqual(planMonth(start,end,at("2026-12-01T00:00:00Z")),{start,end},"the 1st of the month starts nothing");
  assert.equal(planMonth(start,end,end),null,"the plan has ended");
  assert.equal(planMonth(start,end,start-1),null,"not started yet");
  // Renewed before it ended: the next plan month starts where the first ended, with fresh picks.
  const renewed=addCalendarMonth(new Date(end)).getTime();
  assert.deepEqual(planMonth(start,renewed,end-1),{start,end});
  assert.deepEqual(planMonth(start,renewed,end),{start:end,end:renewed});
  // Short months follow the billing calendar (31 January -> 28 February -> 28 March).
  const jan31=at("2027-01-30T16:00:00Z"),feb28=addCalendarMonth(new Date(jan31)).getTime(),mar28=addCalendarMonth(new Date(feb28)).getTime();
  assert.deepEqual(planMonth(jan31,mar28,feb28+1),{start:feb28,end:mar28});
  // A plan ended early by an admin ends its month too.
  assert.deepEqual(planMonth(start,start+3600_000,start+60_000),{start,end:start+3600_000});
  assert.equal(planMonth(Number.NaN,end,start),null);
});
test("mock access is decided on the server: free, bought, an unlimited plan, or this plan month's pick",()=>{
  const access=text("src/modules/subscriptions/mock-access.ts");
  assert.match(access,/if \(isFreeMock\(slug\)\) return \{ kind: "free" \}/);
  // A purchase lapses 7 days after payment; an earlier permanent one (null expiry) stays open.
  assert.match(access,/mockPurchase\.findFirst\(\{ where: \{ userId, examSlug: slug, status: "PAID", OR: \[\{ expiresAt: null \}, \{ expiresAt: \{ gt: now \} \}\] \}/);
  assert.match(access,/if \(plan\.mockPicks === null\) return \{ kind: "plan", program: plan\.program \}/);
  // Picks for one subscription queue on its row lock and the month's count is read again under it.
  assert.match(access,/SELECT "id" FROM "Subscription" WHERE "id" = \$\{row\.id\} FOR UPDATE/);
  assert.match(access,/if \(state\.month\.used >= state\.month\.limit\) throw new PicksUsedUp/);
  assert.match(access,/if \(current\.kind !== "pickable" && current\.kind !== "full"\) return current;/,"an open mock never uses a pick");
  // Every sitting path and practice use the same rule; only plan and pick sittings may be finished after the plan or month ends.
  const exams=text("src/modules/exams/service.ts");
  assert.match(exams,/const access=await mockAccess\(userId,slug,definition\.program\);\n  if \(!opensMock\(access\)\) throw new MockAccessRequired\(slug\);/);
  assert.match(exams,/const subscriptionAccess=access\.kind==="plan"\|\|access\.kind==="picked"\|\|\(access\.kind==="purchase"&&access\.expiresAt!==null\);/);
  assert.equal((exams.match(/!row\.subscriptionAccess&&!await mayUseMock\(/g)??[]).length,3,"accessMock, skipMock and ownMock");
  assert.match(text("src/modules/exam-practice/service.ts"),/return mayUseMock\(userId, slug, definition\.program\);/);
  const route=text("src/app/api/mock-picks/route.ts");
  assert.ok(route.indexOf("checkOrigin(request)")<route.indexOf("apiUser(request)"));
  assert.match(route,/Object\.keys\(input\)\.length !== 1/);
  // Free mocks are never sold, and the workshops follow plans that include them.
  assert.match(text("src/modules/exams/payments.ts"),/if \(isFreeMock\(slug\)\) throw new ApiError\(409/);
  assert.match(text("src/app/workshops/[slug]/page.tsx"),/hasWorkshops\(session\.user\.id\)/);
  // A month is granted only on a plan on sale; a retired plan can still be ended.
  const admin=text("src/modules/admin/service.ts");
  assert.match(admin,/if\(action==="grant-month"&&!findSubscriptionPlan\(program\)\)/);
  assert.match(admin,/if\(action==="expire-plan"&&!findAnyPlan\(program\)\)/);
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
test("the database accepts every plan a subscription or an order can name",()=>{
  // Subscription and SubscriptionOrder carry CHECK constraints on "program"; the newest migration that sets them must
  // list every plan, on sale or retired (a missing "language" once made every Гадаад хэл order fail with a 503).
  const folders=readdirSync(new URL("../prisma/migrations/",import.meta.url),{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort();
  // The values inside the first `IN (...)` after a marker, or null when the marker is absent.
  const valuesAfter=(sql,marker,from=0)=>{
    const at=sql.indexOf(marker,from);if(at<0)return null;
    const open=sql.indexOf("IN (",at),close=sql.indexOf(")",open);
    return sql.slice(open+4,close).split(",").map(item=>item.trim().replace(/^'|'$/g,""));
  };
  for(const table of ["Subscription","SubscriptionOrder"]){
    let list=null;
    for(const folder of folders){
      const sql=text(`prisma/migrations/${folder}/migration.sql`);
      // A named constraint (added later), or the inline CHECK of the CREATE TABLE that first made it.
      const created=sql.indexOf(`CREATE TABLE "${table}" (`);
      const found=valuesAfter(sql,`ADD CONSTRAINT "${table}_program_check" CHECK ("program"`)??(created<0?null:valuesAfter(sql,`"program" TEXT NOT NULL CHECK ("program"`,created));
      if(found)list=found;
    }
    assert.ok(list,table);
    assert.deepEqual([...list].sort(),allPlans.map(plan=>plan.program).sort(),table);
  }
});
test("a one-time mock purchase lasts 7 days from payment and is bought again after that",()=>{
  assert.equal(MOCK_PURCHASE_DAYS,7);assert.equal(MOCK_PURCHASE_MS,7*24*3600_000);assert.equal(MOCK_PRICE_TERM,"₮10,000 / 7 хоног");
  const payments=text("src/modules/exams/payments.ts");
  // Payment sets the end; the create step reuses the one row per student and mock, and a lapsed purchase goes back to pending.
  assert.match(payments,/expiresAt=new Date\(paidAt\.getTime\(\)\+MOCK_PURCHASE_MS\)/);
  assert.match(payments,/data:decision==="success"\?\{status:"PAID",paidAt,expiresAt\}/);
  assert.match(payments,/if\(purchaseActive\(old\)\)return old;/);
  assert.match(payments,/if\(old\.status==="PAID"\)return tx\.mockPurchase\.update\(\{where:\{id:old\.id\},data:\{status:"PENDING",paidAt:null,expiresAt:null/);
  assert.match(payments,/mockPaidNotice\(.*,id,expiresAt\)\)/);
  // The schema column is nullable (earlier purchases never expire) and added by the newest migration.
  assert.match(text("prisma/schema.prisma"),/expiresAt DateTime\?\r?\n  @@unique\(\[userId, examSlug\]\)/);
  assert.match(text("prisma/migrations/20261117100000_basic_plan_sales_and_pack_list/migration.sql"),/ALTER TABLE "MockPurchase" ADD COLUMN "expiresAt" TIMESTAMP\(3\);/);
});
test("a plan sale charges the lower price until it ends, and never raises a price",()=>{
  const day=24*3600_000,now=new Date("2026-11-20T00:00:00Z");
  assert.equal(chargedPrice(59900,null,now),59900);
  assert.equal(chargedPrice(59900,{saleAmountMnt:null,saleEndsAt:null},now),59900);
  assert.equal(chargedPrice(59900,{saleAmountMnt:39900,saleEndsAt:null},now),39900,"no end date: until an admin cancels");
  assert.equal(chargedPrice(59900,{saleAmountMnt:39900,saleEndsAt:new Date(now.getTime()+day)},now),39900);
  assert.equal(chargedPrice(59900,{saleAmountMnt:39900,saleEndsAt:new Date(now.getTime()-1)},now),59900,"an ended sale no longer applies");
  assert.equal(chargedPrice(59900,{saleAmountMnt:59900,saleEndsAt:null},now),59900);
  assert.equal(chargedPrice(29900,{saleAmountMnt:39900,saleEndsAt:null},now),29900,"a stale sale above the regular price is ignored");
  // An admin sale price stays in whole hundreds, within the price limits and below the regular price.
  assert.ok(validSalePrice(39900,59900));
  for(const bad of [59900,60000,39950,500,"39900",null,Number.NaN])assert.ok(!validSalePrice(bad,59900),String(bad));
  // The last sale day is the end of that day in Ulaanbaatar; a past day or a malformed date is refused.
  assert.equal(saleEndFromDate("2026-11-30",now)?.toISOString(),"2026-11-30T15:59:59.999Z");
  for(const bad of ["2026-11-19","2026-13-01","30.11.2026","",null,undefined,5])assert.equal(saleEndFromDate(bad,now),null,String(bad));
  // The server prices every order and checks it again when it is confirmed; the page never sends a price.
  assert.match(text("src/modules/subscriptions/prices.ts"),/const amountMnt = chargedPrice\(regularMnt, row, now\);/);
  assert.match(text("src/modules/subscriptions/service.ts"),/order\.amountMnt!==plan\.amountMnt/);
  const admin=text("src/modules/admin/service.ts");
  assert.match(admin,/"set-price","set-sale",/);
  assert.match(admin,/if\(amount!==null&&!validSalePrice\(amount,regular\)\)throw new ApiError\(400/);
  assert.match(admin,/dropSale/,"a regular price at or below the sale clears the sale");
});
test("Basic is not sold on top of an active Pro of its family or the retired Гадаад хэл Pro",()=>{
  assert.deepEqual(PRO_OF,{english_basic:["english_pro","language"],asian_basic:["asian_pro","language"]});
  assert.match(text("src/modules/subscriptions/service.ts"),/for\(const pro of PRO_OF\[plan\.program\]\?\?\[\]\)if\(await hasSubscription\(userId,pro\)\)throw new ApiError\(409/);
});
test("credit packs are a list of 1-12 different sizes with a default set",()=>{
  assert.deepEqual(DEFAULT_CREDIT_PACKS.map(pack=>pack.credits),[200,500,1000]);
  // Owner rule 2026-11-20: ₮15 a credit for 200, ₮12 for 500 and 1,000 (no discount for the larger pack).
  assert.deepEqual(DEFAULT_CREDIT_PACKS.map(pack=>pack.amountMnt),[3000,6000,12000]);
  assert.ok(validCreditPacks(DEFAULT_CREDIT_PACKS.map(pack=>({...pack}))));
  assert.ok(validCreditPacks([{credits:10,amountMnt:1000}]));
  assert.ok(validCreditPacks(Array.from({length:12},(_,index)=>({credits:100*(index+1),amountMnt:1000+100*index}))));
  assert.ok(!validCreditPacks([]),"an empty list is the reset, handled before validation");
  assert.ok(!validCreditPacks(Array.from({length:13},(_,index)=>({credits:100*(index+1),amountMnt:1000}))),"13 packs");
  assert.ok(!validCreditPacks([{credits:500,amountMnt:2500},{credits:500,amountMnt:3000}]),"duplicate credits");
  assert.ok(!validCreditPacks([{credits:5,amountMnt:2500}]));assert.ok(!validCreditPacks([{credits:500,amountMnt:2550}]));
  assert.ok(!validCreditPacks([{credits:500,amountMnt:2500,extra:1}]));assert.ok(!validCreditPacks("packs"));assert.ok(!validCreditPacks([null]));
});
