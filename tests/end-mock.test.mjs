import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { findExam } from "../src/modules/exams/definitions.ts";
import { createExamState, expireStages } from "../src/modules/exams/engine.ts";

// Stopping an open timed mock (owner request 2026-11-18): the sitting is discarded, never reviewed or graded.
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const service = read("src/modules/exams/service.ts");
const endMock = service.slice(service.indexOf("export async function endMock"));

test("a stopped sitting is refused by both by-id readers, so no page, review, grade or tutor reads it", () => {
  assert.match(service, /export const ENDED_STATUS="ABANDONED"/);
  for (const name of ["accessMock", "ownMock"]) {
    const body = service.slice(service.indexOf("export async function " + name), service.indexOf("export async function " + name) + 500);
    assert.match(body, /if\(row\.status===ENDED_STATUS\)throw ENDED\(\);/, name);
  }
  assert.match(service, /new ApiError\(410,/);
});

test("stopping discards only an open sitting, under the revision check, and drops its recordings and grades", () => {
  assert.match(endMock, /where:\{id,userId\}/);
  assert.match(endMock, /where:\{id,userId,status:"IN_PROGRESS",revision:row\.revision\}/);
  assert.match(endMock, /status:ENDED_STATUS,activeKey:null/);
  assert.match(endMock, /mockRecording\.deleteMany\(\{where:\{attemptId:id\}\}\)/);
  assert.match(endMock, /mockGrade\.deleteMany\(\{where:\{attemptId:id\}\}\)/);
  // A finished sitting is never thrown away, and one whose time already ran out is saved as finished instead.
  assert.match(endMock, /if\(row\.status!=="IN_PROGRESS"\|\|state\.finishedAt\)return \{status:"finished"/);
  assert.match(endMock, /expireStages\(state,Date\.now\(\)\)&&Boolean\(state\.finishedAt\)/);
  assert.match(endMock, /status:"SUBMITTED",activeKey:null/);
});

test("a sitting whose last stage deadline has passed counts as finished, so stopping keeps its result", () => {
  const start = Date.parse("2026-11-18T00:00:00Z");
  const state = createExamState(findExam("ielts-academic-01"), start);
  assert.equal(expireStages(state, start + 1000), false);
  assert.equal(state.finishedAt, null);
  assert.equal(expireStages(state, start + 24 * 3600 * 1000), true);
  assert.ok(state.finishedAt);
});

test("the stop route is same-origin and acts only for the signed-in owner", () => {
  const route = read("src/app/api/mock-attempts/[id]/end/route.ts");
  assert.match(route, /export async function POST/);
  assert.match(route, /checkOrigin\(request\);const user=await apiUser\(request\);return privateJson\(await endMock\(\(await params\)\.id,user\.id\)\)/);
});

test("the exam screens offer the stop and leave a stopped sitting; the reviews page offers it beside each open sitting", () => {
  for (const path of ["src/modules/exams/runner.tsx", "src/modules/exams/entrance/session.tsx"]) {
    const source = read(path);
    assert.match(source, /<EndMockButton attemptId=\{attempt\.id\}/, path);
    assert.match(source, /response\.status ?=== ?410/, path);
  }
  const list = read("src/app/workspace/review/page.tsx");
  assert.match(list, /<\/Link>\s*<EndMockButton attemptId=\{item\.id\}/);
  assert.match(list, /query\.ended === "1"/);
  for (const path of ["src/app/exams/attempts/[id]/page.tsx", "src/app/workspace/review/[id]/page.tsx"])
    assert.match(read(path), /status ?=== ?410\) ?redirect\("\/workspace\/review\?ended=1"\)/, path);
  const button = read("src/modules/exams/end-mock.tsx");
  assert.match(button, /хадгалагдахгүй/);
  assert.match(button, /method: "POST"/);
});

test("results, counts and the open list never include a stopped sitting", () => {
  const data = read("src/modules/workspace/data.ts");
  assert.match(data, /status: ?"SUBMITTED"/);
  assert.match(data, /status: ?"IN_PROGRESS"/);
  assert.doesNotMatch(data, /ABANDONED/);
});
