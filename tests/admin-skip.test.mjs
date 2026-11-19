import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findExam } from "../src/modules/exams/definitions.ts";
import { createExamState, makeReport, skipStages, stageFor } from "../src/modules/exams/engine.ts";

// Admin skip/finish in timed mocks (owner request 2026-11-19): admin-only, server-checked, recorded, own sittings only.
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const service = read("src/modules/exams/service.ts");
const skipMock = service.slice(service.indexOf("export async function skipMock"), service.indexOf("export async function ownMock"));
const route = read("src/app/api/mock-attempts/[id]/skip/route.ts");
const start = Date.parse("2026-11-19T00:00:00Z");

test("skipping a stage closes it now and starts the next one with its full time", () => {
  const exam = findExam("sat-full-01");
  const state = createExamState(exam, start);
  const now = start + 60_000;
  skipStages(state, now, "stage");
  assert.equal(state.stageIndex, 1);
  assert.deepEqual(state.completed, [exam.stages[0].id]);
  assert.equal(state.stageStartedAt, new Date(now).toISOString());
  assert.equal(Date.parse(state.deadline), now + exam.stages[1].seconds * 1000);
  assert.deepEqual(state.skipped, [{ stageId: exam.stages[0].id, at: new Date(now).toISOString() }]);
  assert.equal(state.finishedAt, null);
  // Module 2 is routed from the answers exactly as on expiry.
  assert.ok(state.routes[exam.stages[1].id]);
});

test("finishing closes every remaining stage, records each and produces the report", () => {
  const exam = findExam("ielts-academic-01");
  const state = createExamState(exam, start);
  const first = stageFor(state).questions[0];
  state.responses[first.id] = first.answers[0];
  skipStages(state, start + 5_000, "finish");
  assert.ok(state.finishedAt);
  assert.equal(state.skipped.length, exam.stages.length);
  assert.ok(makeReport(state).points.earned >= 1);
});

test("a stage whose time already ran out is not recorded as skipped", () => {
  const exam = findExam("sat-full-01");
  const state = createExamState(exam, start);
  skipStages(state, start + exam.stages[0].seconds * 1000 + 1, "stage");
  assert.equal(state.stageIndex, 1);
  assert.equal(state.skipped, undefined);
});

test("the server checks admin membership first, saves the page's answers under the revision check and audits the skip", () => {
  assert.match(route, /checkOrigin\(request\)/);
  assert.match(route, /skipMock\(\(await params\)\.id,user\.id,/);
  assert.ok(skipMock.indexOf("if(!await isAdmin(userId))throw new ApiError(403") < skipMock.indexOf("$transaction"));
  assert.match(skipMock, /findFirst\(\{where:\{id,userId\}/);
  assert.match(skipMock, /if\(row\.status===ENDED_STATUS\)throw ENDED\(\);/);
  assert.match(skipMock, /validateExamEdit\(state,input,now\)/);
  assert.match(skipMock, /input\.revision!==row\.revision/);
  assert.match(skipMock, /adminAudit\.create/);
  assert.match(skipMock, /where:\{id,userId,revision:row\.revision\}/);
  // isAdmin excludes hosted demo accounts.
  assert.match(read("src/modules/admin/service.ts"), /hostedDemo && isDemoEmail/);
});
