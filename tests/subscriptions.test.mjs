import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { subscriptionPlans,legacyPlans,allPlans,findSubscriptionPlan,findAnyPlan,planCovers,salePlanFor,planMonth,addCalendarMonth,formatBillingDate,LANGUAGE_MOCK_PICKS } from "../src/modules/subscriptions/plans.ts";
const text=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("three plans: free, ЭЕШ and Гадаад хэл (owner rule 2026-11-13); IELTS and SAT are retired",()=>{
  assert.deepEqual(subscriptionPlans.map(p=>[p.program,p.title,p.amountMnt]),[["entrance","ЭЕШ",40000],["language","Гадаад хэл",60000]]);
  assert.equal(findSubscriptionPlan("all"),undefined);
  assert.equal(findSubscriptionPlan("../../language"),undefined);
  // Retired plans are not sold or renewed, but a subscription bought before the change is still recognised.
  for(const program of ["ielts","sat"]){assert.equal(findSubscriptionPlan(program),undefined,program);assert.equal(findAnyPlan(program)?.program,program);}
  assert.deepEqual(legacyPlans.map(p=>p.program),["ielts","sat"]);
});
test("ЭЕШ opens every ЭЕШ mock; Гадаад хэл opens 15 non-ЭЕШ mocks a plan month and the workshops",()=>{
  const entrance=findSubscriptionPlan("entrance"),language=findSubscriptionPlan("language");
  assert.equal(entrance.mockPicks,null);assert.deepEqual(entrance.exams,["entrance"]);assert.equal(entrance.workshops,false);
  assert.equal(LANGUAGE_MOCK_PICKS,15);assert.equal(language.mockPicks,15);assert.equal(language.workshops,true);
  for(const exam of ["sat","ielts","jlpt","hsk"]){assert.ok(planCovers(language,exam),exam);assert.equal(salePlanFor(exam)?.program,"language",exam);}
  assert.ok(!planCovers(language,"entrance"),"Гадаад хэл never opens ЭЕШ mocks");
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
  assert.match(access,/mockPurchase\.findFirst\(\{ where: \{ userId, examSlug: slug, status: "PAID" \}/);
  assert.match(access,/if \(plan\.mockPicks === null\) return \{ kind: "plan", program: plan\.program \}/);
  // Picks for one subscription queue on its row lock and the month's count is read again under it.
  assert.match(access,/SELECT "id" FROM "Subscription" WHERE "id" = \$\{row\.id\} FOR UPDATE/);
  assert.match(access,/if \(state\.month\.used >= state\.month\.limit\) throw new PicksUsedUp/);
  assert.match(access,/if \(current\.kind !== "pickable" && current\.kind !== "full"\) return current;/,"an open mock never uses a pick");
  // Every sitting path and practice use the same rule; only plan and pick sittings may be finished after the plan or month ends.
  const exams=text("src/modules/exams/service.ts");
  assert.match(exams,/const access=await mockAccess\(userId,slug,definition\.program\);\n  if \(!opensMock\(access\)\) throw new MockAccessRequired\(slug\);/);
  assert.match(exams,/const subscriptionAccess=access\.kind==="plan"\|\|access\.kind==="picked";/);
  assert.equal((exams.match(/!row\.subscriptionAccess&&!await mayUseMock\(/g)??[]).length,2,"accessMock and ownMock");
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
