import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NOTIFICATION_LIMITS, announcementKey, badgeText, creditsPaidNotice, mockPaidNotice, noticeDate, parseAnnouncement, parseMarkIds, planEndingDue, planEndingNotice, planGrantedNotice, planPaidNotice, safeHref, timeAgo } from "../src/modules/notifications/rules.ts";
const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const DAY = 864e5;

test("a notice opens only a path on this site", () => {
  for (const href of ["/workspace/plans", "/exams/sat-01", "/workspace/plans#credits", "/subscribe/language?x=1", "/"]) assert.equal(safeHref(href), href, href);
  for (const href of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "workspace", "", "/a b", "/a\nb", "/a\\b", null, 5, "/" + "a".repeat(NOTIFICATION_LIMITS.href)]) assert.equal(safeHref(href), null, String(href));
});

test("purchase notices name the event, link to it and are keyed by the order", () => {
  const end = new Date("2026-12-25T02:00:00Z");
  const bought = planPaidNotice("Гадаад хэл", end, false, "ord1");
  assert.deepEqual([bought.kind, bought.title, bought.href, bought.dedupeKey], ["plan-paid", "Багц идэвхжлээ", "/workspace/plans", "order:ord1"]);
  assert.match(bought.body, /Гадаад хэл багц 2026\.12\.25 хүртэл/);
  assert.deepEqual([planPaidNotice("ЭЕШ", end, true, "ord2").kind, planPaidNotice("ЭЕШ", end, true, "ord2").title], ["plan-renewed", "Багц сунгагдлаа"]);
  assert.deepEqual(mockPaidNotice("SAT 03", "sat-03", "p1"), { kind: "mock-paid", title: "Шалгалтын эрх нээгдлээ", body: "SAT 03", href: "/exams/sat-03", dedupeKey: "order:p1" });
  // A 7-day purchase names its end, and a repeat purchase of the same order row (after it lapsed) is a new notice.
  const first = mockPaidNotice("SAT 03", "sat-03", "p1", end), again = mockPaidNotice("SAT 03", "sat-03", "p1", new Date(end.getTime() + 8 * 86400_000));
  assert.match(first.body, /^SAT 03 · 2026\.12\.25 хүртэл$/);
  assert.notEqual(first.dedupeKey, again.dedupeKey);
  assert.equal(first.dedupeKey, mockPaidNotice("SAT 03", "sat-03", "p1", new Date(end)).dedupeKey);
  const credits = creditsPaidNotice(5000, "c1");
  assert.match(credits.body, /^5,000 кредит/);
  assert.deepEqual([credits.href, credits.dedupeKey], ["/workspace/plans#credits", "order:c1"]);
  // An admin may grant the same plan twice; each grant is its own notice.
  assert.equal(planGrantedNotice("ЭЕШ", end).dedupeKey, null);
  for (const notice of [bought, credits, planGrantedNotice("ЭЕШ", end)]) assert.equal(safeHref(notice.href), notice.href);
});

test("dates follow the Ulaanbaatar calendar", () => {
  assert.equal(noticeDate(new Date("2026-12-31T15:59:00Z")), "2026.12.31");
  assert.equal(noticeDate(new Date("2026-12-31T16:00:00Z")), "2027.01.01");
});

test("a plan gets one ending notice in its last three days, and another after a renewal", () => {
  const now = Date.parse("2026-11-15T00:00:00Z");
  assert.equal(NOTIFICATION_LIMITS.planEndingDays, 3);
  assert.ok(planEndingDue(now + 3 * DAY, now));
  assert.ok(planEndingDue(now + 1, now));
  assert.ok(!planEndingDue(now + 3 * DAY + 1, now), "more than three days left");
  assert.ok(!planEndingDue(now, now), "already ended");
  assert.ok(!planEndingDue(now - DAY, now));
  assert.ok(!planEndingDue(NaN, now));
  const end = new Date(now + 2 * DAY), renewedEnd = new Date(now + 32 * DAY);
  const notice = planEndingNotice("language", "Гадаад хэл", end, true);
  assert.deepEqual([notice.kind, notice.href], ["plan-ending", "/subscribe/language"]);
  assert.notEqual(notice.dedupeKey, planEndingNotice("language", "Гадаад хэл", renewedEnd, true).dedupeKey);
  assert.equal(notice.dedupeKey, planEndingNotice("language", "Гадаад хэл", new Date(end), true).dedupeKey);
  // A retired plan cannot be renewed, so its notice opens the plans page.
  assert.equal(planEndingNotice("ielts", "IELTS (хуучин багц)", end, false).href, "/workspace/plans");
});

test("an announcement is checked before it is stored", () => {
  const ok = parseAnnouncement({ action: "send", title: "  Шинэ mock  ", body: "SAT 10 нэмэгдлээ.", href: "/exams", email: "" });
  assert.deepEqual(ok, { ok: true, value: { title: "Шинэ mock", body: "SAT 10 нэмэгдлээ.", href: "/exams", email: null } });
  assert.deepEqual(parseAnnouncement({ title: "Сайн уу", body: "Танд зориулав.", email: " Student@Example.com " }).value, { title: "Сайн уу", body: "Танд зориулав.", href: null, email: "student@example.com" });
  const bad = [
    null, [], "text",
    { title: "ab", body: "Хангалттай урт" }, { title: "a".repeat(81), body: "Хангалттай урт" },
    { title: "Гарчиг", body: "abc" }, { title: "Гарчиг", body: "a".repeat(501) }, { title: 5, body: "Хангалттай урт" },
    { title: "Гарчиг", body: "Хангалттай урт", href: "https://evil.example" }, { title: "Гарчиг", body: "Хангалттай урт", href: "//evil.example" }, { title: "Гарчиг", body: "Хангалттай урт", href: 7 },
    { title: "Гарчиг", body: "Хангалттай урт", email: "not-an-email" }, { title: "Гарчиг", body: "Хангалттай урт", email: 5 },
    { title: "Гарчиг", body: "Хангалттай урт", userId: "someone" },
  ];
  for (const input of bad) assert.equal(parseAnnouncement(input).ok, false, JSON.stringify(input));
  assert.equal(announcementKey("abc"), "announcement:abc");
});

test("mark-as-read takes 1-50 short ids", () => {
  assert.deepEqual(parseMarkIds(["a", "b", "a"]), ["a", "b"]);
  for (const value of [[], "a", null, [1], [""], ["a".repeat(41)], Array.from({ length: 51 }, (_, i) => "id" + i)]) assert.equal(parseMarkIds(value), null, JSON.stringify(value));
});

test("the bell shows a count up to 99+ and recent times in words", () => {
  assert.deepEqual([badgeText(0), badgeText(-1), badgeText(1), badgeText(99), badgeText(100)], ["", "", "1", "99", "99+"]);
  const now = Date.parse("2026-11-15T12:00:00Z"), at = ms => new Date(now - ms).toISOString();
  assert.equal(timeAgo(at(20_000), now), "Дөнгөж сая");
  assert.equal(timeAgo(at(5 * 6e4), now), "5 минутын өмнө");
  assert.equal(timeAgo(at(3 * 36e5), now), "3 цагийн өмнө");
  assert.equal(timeAgo(at(2 * DAY), now), "2 өдрийн өмнө");
  assert.equal(timeAgo(at(10 * DAY), now), "2026.11.05");
  assert.equal(timeAgo("nonsense", now), "");
});

test("the inbox is the student's own, and every write is checked on the server", () => {
  const service = text("src/modules/notifications/service.ts");
  // Every read and write of a student's notices is scoped to that student.
  for (const call of service.match(/notification\.(findMany|count|updateMany)\(\{ where: \{[^}]*/g)) assert.match(call, /where: \{ userId/, call);
  assert.match(service, /skipDuplicates: true/);
  // Announcements: membership is rechecked inside the transaction and the send is audited.
  assert.equal(service.match(/await assertAdminIn\(tx, actorId\)/g).length, 2);
  assert.match(service, /action: "announce"/);
  assert.match(service, /action: "withdraw-announcement"/);
  const route = text("src/app/api/notifications/route.ts");
  assert.match(route, /export async function POST[\s\S]*checkOrigin\(request\);\s*const user = await apiUser\(request\)/);
  assert.match(route, /export async function GET[\s\S]*apiUser\(request\)/);
  const admin = text("src/app/api/admin/announcements/route.ts");
  assert.match(admin, /checkOrigin\(request\);\s*const user = await apiUser\(request\);\s*await assertAdmin\(user\.id\)/);
});

test("a purchase is reported once, by the request that marks it paid", () => {
  assert.match(text("src/modules/subscriptions/service.ts"), /if\(changed\.count\) \{[\s\S]*await notify\(tx,userId,planPaidNotice\(plan\.title,end,Boolean\(active\),id\)\);\s*\}/);
  assert.match(text("src/modules/credits/purchase.ts"), /if \(changed\.count\) await notify\(tx, userId, creditsPaidNotice\(order\.credits, id\)\);/);
  assert.match(text("src/modules/exams/payments.ts"), /if \(decision==="success"&&changed\.count\) await notify\(tx,userId,mockPaidNotice\(/);
  assert.match(text("src/modules/admin/service.ts"), /if\(action==="grant-month"\)await notify\(tx,target,planGrantedNotice\(/);
});

test("the migration only adds tables", () => {
  const sql = text("prisma/migrations/20261115200000_notifications/migration.sql");
  assert.match(sql, /CREATE TABLE "Notification"/);
  assert.match(sql, /CREATE TABLE "Announcement"/);
  assert.match(sql, /CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key"/);
  assert.doesNotMatch(sql, /\bDROP\b|\bDELETE FROM\b|\bTRUNCATE\b|\bALTER TABLE "(?!Notification")/i);
});
