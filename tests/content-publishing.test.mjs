import test from "node:test";
import assert from "node:assert/strict";
import { validateContentShape,validateAnswerKeys } from "../src/modules/content/validation.ts";
import { examDefinitions } from "../src/modules/exams/definitions.ts";
import { adminUserScope,realPaymentScope } from "../src/modules/admin/data-scope.ts";
test("all full mocks survive validated publishing serialization",()=>{
  for(const source of examDefinitions) {
    const candidate=JSON.parse(JSON.stringify(source));
    assert.ok(validateContentShape(source,candidate),source.slug);
    assert.ok(validateAnswerKeys(candidate),source.slug);
  }
});
test("publishing accepts editorial changes and rejects key errors or altered exam standards",()=>{
  // Admin bodies arrive as JSON, which drops the undefined fields a definition may hold.
  const fromJson=value=>JSON.parse(JSON.stringify(value));
  const base=examDefinitions.find(exam=>exam.program==="sat");const copy=fromJson(base);
  const firstChoice=exam=>exam.stages.flatMap(stage=>stage.questions).find(question=>question.kind==="choice");
  copy.title="Reviewed mock";firstChoice(copy).prompt="An updated question";
  assert.ok(validateContentShape(base,copy));
  firstChoice(copy).answers=["not an option"];assert.equal(validateAnswerKeys(copy),false);
  for(const field of ["seconds","id","kind"]){const exam=fromJson(examDefinitions[0]);exam.stages[0][field]=field==="seconds"?30:"changed";assert.equal(validateContentShape(examDefinitions[0],exam),false);}
  const extra=fromJson(base);extra.stages[0].questions.push(extra.stages[0].questions[0]);assert.equal(validateContentShape(base,extra),false);
  const injected=fromJson(base);injected.role="admin";assert.equal(validateContentShape(base,injected),false);
  const duplicate=fromJson(base);firstChoice(duplicate).options[1]=firstChoice(duplicate).options[0];assert.equal(validateAnswerKeys(duplicate),false);
  const numeric={kind:"number",answers:["1/0"]};assert.equal(validateAnswerKeys(numeric),false);
  assert.equal(validateAnswerKeys({kind:"number",answers:["2+3"]}),false);
  assert.equal(validateAnswerKeys({kind:"number",answers:["5","10/2"]}),true);
});
test("real and test reporting scopes are explicit and simulated transactions cannot be revenue",()=>{
  assert.deepEqual(adminUserScope(false),{NOT:{email:{endsWith:".invalid",mode:"insensitive"}}});
  assert.deepEqual(adminUserScope(true),{email:{endsWith:"@example.invalid",mode:"insensitive"}});
  assert.deepEqual(realPaymentScope,{provider:{notIn:["MOCK","LEGACY"]}});
});
