import test from "node:test";
import assert from "node:assert/strict";
import { validateContentShape,validateAnswerKeys } from "../src/modules/content/validation.ts";
import { exerciseSets } from "../src/modules/exercises/content.ts";
import { examDefinitions } from "../src/modules/exams/definitions.ts";
import { adminUserScope,realPaymentScope } from "../src/modules/admin/data-scope.ts";
test("all existing exercises and full mocks survive validated publishing serialization",()=>{
  for(const source of [...exerciseSets,...examDefinitions]) {
    const candidate=JSON.parse(JSON.stringify(source));
    assert.ok(validateContentShape(source,candidate),source.slug);
    assert.ok(validateAnswerKeys(candidate),source.slug);
  }
});
test("publishing accepts editorial changes and rejects key errors or altered exam standards",()=>{
  const base=exerciseSets[0];const copy=structuredClone(base);copy.title="Reviewed algebra";copy.questions[0].prompt="An updated question";
  assert.ok(validateContentShape(base,copy));
  copy.questions[0].correct=999;assert.equal(validateAnswerKeys(copy),false);
  for(const field of ["seconds","id","kind"]){const exam=structuredClone(examDefinitions[0]);exam.stages[0][field]=field==="seconds"?30:"changed";assert.equal(validateContentShape(examDefinitions[0],exam),false);}
  const extra=structuredClone(base);extra.questions.push(extra.questions[0]);assert.equal(validateContentShape(base,extra),false);
  const injected=structuredClone(base);injected.role="admin";assert.equal(validateContentShape(base,injected),false);
  const duplicate=structuredClone(base);duplicate.questions[0].options[1]=duplicate.questions[0].options[0];assert.equal(validateAnswerKeys(duplicate),false);
  const numeric={kind:"number",answers:["1/0"]};assert.equal(validateAnswerKeys(numeric),false);
  assert.equal(validateAnswerKeys({kind:"number",answers:["2+3"]}),false);
  assert.equal(validateAnswerKeys({kind:"number",answers:["5","10/2"]}),true);
});
test("real and test reporting scopes are explicit and simulated transactions cannot be revenue",()=>{
  assert.deepEqual(adminUserScope(false),{NOT:{email:{endsWith:".invalid",mode:"insensitive"}}});
  assert.deepEqual(adminUserScope(true),{email:{endsWith:"@example.invalid",mode:"insensitive"}});
  assert.deepEqual(realPaymentScope,{provider:{notIn:["MOCK","LEGACY"]}});
});
