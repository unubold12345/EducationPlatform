import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { addDays, dayNumber, firstSunday, mnDate, mnDateTime, mnWeekday, nextJlptDay, ubDay, weekdayIndex } from "../src/modules/dashboard/dates.ts";
import { GOAL_EXAMS, GOAL_LIMITS, findGoalLevel, goalHub, goalTitle, mainGoal, readGoal } from "../src/modules/dashboard/exams.ts";
import { TASK_LIMITS, cleanTitle, readNewTask, readTaskPatch, taskIdeas } from "../src/modules/dashboard/tasks.ts";
import { ACTIVITY_WEEKS, activityGrid, activityLevel, bucketActivity, cellLabel, gridStart } from "../src/modules/dashboard/activity.ts";
import { examInfo } from "../src/modules/dashboard/exam-info.ts";
import { workspaceTab } from "../src/modules/workspace/paths.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const today = "2026-11-20";

test("Ulaanbaatar days and Mongolian labels", () => {
  assert.equal(ubDay(Date.UTC(2026, 10, 19, 16, 0)), "2026-11-20", "UTC 16:00 is midnight in Ulaanbaatar");
  assert.equal(ubDay(Date.UTC(2026, 10, 19, 15, 59)), "2026-11-19");
  assert.equal(dayNumber("2026-02-31"), null);
  assert.equal(dayNumber(20261120), null);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(weekdayIndex("2026-11-16"), 0, "Monday first");
  assert.equal(weekdayIndex("2026-11-22"), 6);
  assert.equal(mnDate("2026-11-20", true), "2026 оны 11-р сарын 20, Баасан");
  assert.equal(mnWeekday("2026-11-22"), "Ням");
  assert.equal(mnDateTime("2026-11-20T06:05:00.000Z"), "11-р сарын 20, 14:05");
});

test("the next JLPT is the first Sunday of July or December", () => {
  assert.equal(firstSunday(2026, 12), "2026-12-06");
  assert.equal(firstSunday(2027, 7), "2027-07-04");
  assert.equal(nextJlptDay(today), "2026-12-06");
  assert.equal(nextJlptDay("2026-12-06"), "2026-12-06");
  assert.equal(nextJlptDay("2026-12-07"), "2027-07-04");
  assert.equal(nextJlptDay("2026-03-01"), "2026-07-05");
});

test("goals take a known exam, one of its levels and a date from today to two years on", () => {
  assert.deepEqual(readGoal({ exam: "jlpt", level: "n4", examDate: "2026-12-06" }, today), { ok: true, goal: { exam: "jlpt", level: "n4", examDate: "2026-12-06" } });
  assert.equal(readGoal({ exam: "ielts", level: "academic", examDate: null }, today).ok, true);
  assert.equal(readGoal({ exam: "jlpt", level: "academic", examDate: null }, today).ok, false, "levels belong to their exam");
  assert.equal(readGoal({ exam: "gre", level: "", examDate: null }, today).ok, false);
  assert.equal(readGoal({ exam: "sat", level: "digital", examDate: "2026-11-19" }, today).ok, false, "no past dates");
  assert.equal(readGoal({ exam: "sat", level: "digital", examDate: addDays(today, GOAL_LIMITS.aheadDays) }, today).ok, true);
  assert.equal(readGoal({ exam: "sat", level: "digital", examDate: addDays(today, GOAL_LIMITS.aheadDays + 1) }, today).ok, false);
  assert.equal(readGoal({ exam: "sat", level: "digital", examDate: "2026-02-30" }, today).ok, false);
  assert.equal(readGoal({ exam: "sat", level: "digital" }, today).ok, false, "exact shape");
  assert.equal(readGoal({ exam: "sat", level: "digital", examDate: null, userId: "x" }, today).ok, false, "no extra fields");
  assert.equal(readGoal(null, today).ok, false);
});

test("every goal level is reachable and named", () => {
  for (const exam of GOAL_EXAMS) {
    assert.ok(exam.levels.length >= 1, exam.id);
    for (const level of exam.levels) {
      assert.equal(findGoalLevel(exam.id, level.id), level);
      assert.ok(goalTitle(exam.id, level.id).length > 1);
      assert.match(goalHub(exam.id, level.id), /^\/exams\//);
    }
  }
  assert.equal(goalTitle("jlpt", "n4"), "JLPT N4");
  assert.equal(goalTitle("eesh", "math"), "ЭЕШ · Математик");
  assert.equal(goalTitle("topik", "topik2"), "TOPIK Ⅱ");
  assert.equal(goalHub("eesh", "physics"), "/exams/eesh?subject=physics");
  assert.equal(findGoalLevel("hsk", "hsk3").onSite, false, "HSK 3 has no mocks on the site");
  assert.equal(findGoalLevel("hsk", "hsk2").slugPrefix, "hsk2-");
});

test("the dashboard opens on the nearest booked exam, otherwise the first goal", () => {
  const goals = [
    { id: "a", examDate: null }, { id: "b", examDate: "2027-06-01" }, { id: "c", examDate: "2026-12-06" }, { id: "d", examDate: "2026-01-01" },
  ];
  assert.equal(mainGoal(goals, today).id, "c");
  assert.equal(mainGoal([{ id: "a", examDate: null }, { id: "d", examDate: "2026-01-01" }], today).id, "a", "a past date does not win");
  assert.equal(mainGoal([], today), null);
});

test("to-do tasks: one clean line on an allowed day", () => {
  assert.equal(cleanTitle("  Listening​  хэсэг\n2 "), "Listening хэсэг 2");
  assert.equal(cleanTitle("‮"), null, "invisible only");
  assert.equal(cleanTitle("x".repeat(TASK_LIMITS.title)), "x".repeat(TASK_LIMITS.title));
  assert.equal(cleanTitle("x".repeat(TASK_LIMITS.title + 1)), null);
  assert.deepEqual(readNewTask({ day: today, title: " 20 үг " }, today), { ok: true, day: today, title: "20 үг" });
  assert.equal(readNewTask({ day: addDays(today, -TASK_LIMITS.pastDays), title: "a" }, today).ok, true);
  assert.equal(readNewTask({ day: addDays(today, -TASK_LIMITS.pastDays - 1), title: "a" }, today).ok, false);
  assert.equal(readNewTask({ day: addDays(today, TASK_LIMITS.aheadDays + 1), title: "a" }, today).ok, false);
  assert.equal(readNewTask({ day: today, title: "a", done: true }, today).ok, false, "exact shape");
  assert.deepEqual(readTaskPatch({ done: true }, today), { ok: true, patch: { done: true } });
  assert.deepEqual(readTaskPatch({ title: "b", day: "2026-11-21" }, today), { ok: true, patch: { title: "b", day: "2026-11-21" } });
  assert.equal(readTaskPatch({}, today).ok, false);
  assert.equal(readTaskPatch({ done: "yes" }, today).ok, false);
  assert.equal(readTaskPatch({ userId: "x" }, today).ok, false);
  for (const exam of [null, ...GOAL_EXAMS.map(item => item.id)]) assert.ok(taskIdeas(exam).length >= 2);
});

test("activity grid: 53 Monday-first weeks ending today, fixed shades", () => {
  assert.equal(gridStart(today), "2025-11-17", "the Monday 52 weeks before this week's Monday");
  assert.equal(weekdayIndex(gridStart(today)), 0);
  assert.deepEqual([0, 1, 2, 3, 5, 6, 9, 10, 40].map(activityLevel), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
  const at = (day, hour = 4) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), hour);
  const days = bucketActivity([
    { kind: "mock", at: at(today) }, { kind: "ai", at: at(today) }, { kind: "ai", at: new Date(at(today)) },
    { kind: "words", at: at("2026-11-18") }, { kind: "tasks", at: at("2024-01-01") },
    { kind: "ai", at: Date.UTC(2026, 10, 19, 17) },
  ], gridStart(today), today);
  const grid = activityGrid(days, today);
  assert.equal(grid.weeks.length, ACTIVITY_WEEKS);
  assert.ok(grid.weeks.every(week => week.length === 7));
  assert.equal(grid.weeks.at(-1)[weekdayIndex(today)].day, today);
  assert.equal(grid.weeks.at(-1)[6], null, "no squares after today");
  assert.equal(grid.weeks.at(-1)[weekdayIndex(today)].total, 4, "UTC 17:00 the day before is today in Ulaanbaatar");
  assert.equal(grid.total, 5, "events before the grid start are dropped");
  assert.equal(grid.activeDays, 2);
  assert.equal(grid.byKind.ai, 3);
  assert.equal(grid.best.day, today);
  assert.equal(cellLabel(grid.weeks.at(-1)[weekdayIndex(today)]), "11-р сарын 20: 4 үйлдэл (Mock шалгалт 1, AI хэрэгсэл 3)");
  assert.ok(grid.months.length >= 12 && grid.months.every(month => /^\d+-р сар$/.test(month.label)));
});

test("exam information covers every level with structure, scoring and sources", () => {
  for (const exam of GOAL_EXAMS) for (const level of exam.levels) {
    const info = examInfo(exam.id, level.id, today);
    const name = `${exam.id}/${level.id}`;
    assert.ok(info.title && info.organizer && info.summary, name);
    assert.ok(info.parts.length >= 2, name + " parts");
    assert.ok(info.totalTime && info.scale, name);
    assert.ok(info.tips.length >= 3, name + " tips");
    assert.ok(info.links.some(link => link.href.startsWith("https://")), name + " official link");
    assert.ok(info.stats.items.length ? Boolean(info.stats.source) : Boolean(info.stats.note), name + " stats are sourced or explained");
  }
  assert.equal(examInfo("jlpt", "n4", today).pass, "Нийт ≥90; 言語知識・読解 ≥38, 聴解 ≥19");
  assert.equal(examInfo("jlpt", "n1", today).totalTime, "165 мин");
  assert.ok(examInfo("jlpt", "n5", today).facts.some(fact => fact.value === "2026 оны 12-р сарын 6, Ням"), "next sitting is computed");
  assert.equal(examInfo("topik", "topik2", today).totalTime, "180 мин");
  assert.match(examInfo("hsk", "hsk4", today).note, /HSK 2\.0/);
  assert.ok(examInfo("eesh", "math", today).links.some(link => link.href === "/labs/eesh/math"));
});

test("the dashboard is a Workspace tab behind sign-in, with an additive migration", () => {
  assert.equal(workspaceTab("/workspace/dashboard"), "dashboard");
  assert.match(text("src/modules/workspace/shell.tsx"), /href: "\/workspace\/dashboard", label: "Хянах самбар"/);
  assert.match(text("src/modules/workspace/shell.tsx"), /active === "dashboard"/, "no guest chrome while the sign-in redirect resolves");
  assert.match(text("src/lib/return-path.ts"), /"\/workspace\/dashboard"/);
  assert.match(text("src/app/workspace/dashboard/page.tsx"), /requireUser\("\/workspace\/dashboard"\)/);
  for (const route of ["goals/route.ts", "goals/[id]/route.ts", "tasks/route.ts", "tasks/[id]/route.ts"]) {
    const source = text("src/app/api/workspace/dashboard/" + route);
    assert.match(source, /checkOrigin\(request\)/, route + " checks the origin");
    assert.match(source, /apiUser\(request\)/, route + " needs a verified session");
  }
  assert.match(text("src/app/api/workspace/dashboard/credits/route.ts"), /apiUser\(request\)/);
  const service = text("src/modules/dashboard/service.ts");
  assert.match(service, /deleteMany\(\{ where: \{ id, userId \} \}\)/, "deletes are scoped to the student");
  assert.match(service, /findFirst\(\{ where: \{ id, userId \}/, "updates are scoped to the student");
  const migration = new URL("../prisma/migrations/20261120120000_student_dashboard/migration.sql", import.meta.url);
  assert.ok(existsSync(migration));
  const sql = readFileSync(migration, "utf8");
  assert.doesNotMatch(sql, /\bDROP\b|ALTER TABLE "User"/i, "additive only");
  assert.match(sql, /CREATE TABLE "ExamGoal"/);
  assert.match(sql, /CREATE TABLE "StudyTask"/);
  assert.doesNotMatch(text("src/modules/workspace/shell.tsx"), /Streak/, "the removed streak stays removed");
});
