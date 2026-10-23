import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,statSync } from "node:fs";
import { createHash } from "node:crypto";
import { examDefinitions,findExam } from "../src/modules/exams/definitions.ts";
import { readingModule } from "../src/modules/exams/sat-reading.ts";
import { mathModule } from "../src/modules/exams/sat-math.ts";
import { readingPassages,ieltsReading } from "../src/modules/exams/ielts-reading.ts";
import { ieltsListening,listeningScripts } from "../src/modules/exams/ielts-listening.ts";
import { createExamState,expireStages,stageFor,isCorrect,validateExamEdit,editExam,makeReport } from "../src/modules/exams/engine.ts";

test("SAT has standard module counts, timing, pretests, response types and distinct adaptive banks",()=>{
 const sat=findExam("sat-full-01");assert.deepEqual(sat.stages.map(s=>s.seconds),[1920,1920,600,2100,2100]);
 const ids=[];
 for(const route of ["first","lower","higher"]){
  const rw=readingModule(route),math=mathModule(route);assert.equal(rw.length,27);assert.equal(math.length,22);
  assert.equal(rw.filter(q=>q.pretest).length,2);assert.equal(math.filter(q=>q.pretest).length,2);
  assert.equal(math.filter(q=>q.kind==="number").length,route==="first"?5:6);
  assert.equal(new Set(math.map(q=>q.domain)).size,4);
  for(const q of [...rw,...math]){assert.ok(q.explanation.trim());assert.equal(q.answers.length,1);if(q.options){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answers[0]));}ids.push(q.id);}
 }
 assert.equal(ids.length,147);assert.equal(new Set(ids).size,147);
});
test("IELTS has 40+40 questions, full-length reading, two writing tasks and standard speaking phases",()=>{
 const exam=findExam("ielts-academic-01");assert.deepEqual(exam.stages.map(s=>s.seconds),[1800,120,3600,3600,240,60,120,300]);
 assert.equal(ieltsListening.length,40);assert.equal(ieltsReading.length,40);assert.equal(listeningScripts.length,4);assert.equal(readingPassages.length,3);
 const words=readingPassages.map(p=>p.text.trim().split(/\s+/).length).reduce((a,b)=>a+b,0);
 assert.ok(words>=2150&&words<=2750,`Reading text length ${words}`);
 assert.deepEqual(exam.stages[3].questions.map(q=>q.minWords),[150,250]);
 assert.equal(new Set(ieltsReading.map(q=>q.id)).size,40);
 for(const q of ieltsReading.filter(q=>q.kind==="short")){
  const passage=readingPassages.find(p=>p.title===q.passage).text;
  assert.ok(q.answers.every(a=>passage.toLowerCase().includes(a.toLowerCase())),`Completion answer absent: ${q.id}`);
 }
 for(const part of listeningScripts)assert.equal(part.halves.length,2);
});
test("strict deadlines do not move early and elapsed offline time is never refunded",()=>{
 const state=createExamState(findExam("sat-full-01"),0);const deadline=state.deadline;
 assert.equal(expireStages(state,1919999),false);assert.equal(state.stageIndex,0);assert.equal(state.deadline,deadline);
 assert.equal(expireStages(state,1920000),true);assert.equal(state.stageIndex,1);assert.equal(Date.parse(state.stageStartedAt),1920000);
 expireStages(state,3840000);assert.equal(stageFor(state).kind,"break");assert.equal(Date.parse(state.deadline),4440000);
 expireStages(state,4440000);assert.equal(stageFor(state).id,"sat-math-1");
 expireStages(state,8640000);assert.ok(state.finishedAt);assert.equal(Date.parse(state.finishedAt),8640000);
 assert.equal(new Set(state.completed).size,5);
});
test("routing uses scored first-module work and does not count pretest items",()=>{
 const state=createExamState(findExam("sat-full-01"),0);const first=stageFor(state);
 for(const q of first.questions.filter(q=>q.pretest))state.responses[q.id]=q.answers[0];
 expireStages(state,1920000);assert.equal(state.routes["sat-rw-2"],"lower");
 const better=createExamState(findExam("sat-full-01"),0);
 for(const q of stageFor(better).questions.filter(q=>!q.pretest).slice(0,17))better.responses[q.id]=q.answers[0];
 expireStages(better,1920000);assert.equal(better.routes["sat-rw-2"],"higher");
});
test("response edits cannot reach locked or future modules, and enforce choice/length limits",()=>{
 const state=createExamState(findExam("sat-full-01"),0);const q=stageFor(state).questions[0];
 const valid={revision:0,stageId:"sat-rw-1",responses:{[q.id]:q.answers[0]},flags:[q.id]};assert.ok(validateExamEdit(state,valid));editExam(state,valid);assert.equal(state.responses[q.id],q.answers[0]);
 for(const invalid of [null,{}, {...valid,revision:-1},{...valid,stageId:"sat-math-1"},{...valid,responses:{[q.id]:"not an option"}},{...valid,flags:["future"]},{...valid,responses:{future:"x"}},{...valid,responses:{[q.id]:"x".repeat(121)}}])assert.equal(validateExamEdit(state,invalid),false);
 expireStages(state,1920000);assert.equal(validateExamEdit(state,valid),false);
});
test("numeric responses accept equivalent fractions/decimals but reject expressions and forged values",()=>{
 const q=mathModule("higher")[17];assert.equal(q.answers[0],"8/17");
 for(const v of ["8/17","16/34","0.4706",".4705882353"])assert.equal(isCorrect(q,v),true,v);
 for(const v of ["8/0","Infinity","8/17+1","0.47","", "NaN"])assert.equal(isCorrect(q,v),false,v);
 const short=ieltsListening[11];assert.equal(isCorrect(short,"gravel pit"),true);assert.equal(isCorrect(short,"a gravel pit"),false);
});
test("finished SAT report covers exactly 98 delivered questions, 90 operational and 8 pretests",()=>{
 const state=createExamState(findExam("sat-full-01"),0);
 while(!state.finishedAt){const stage=stageFor(state);const responses=Object.fromEntries(stage.questions.map(q=>[q.id,q.answers[0]]));const input={revision:0,stageId:stage.id,responses,flags:[]};assert.ok(validateExamEdit(state,input),stage.id);editExam(state,input);expireStages(state,Date.parse(state.deadline));}
 const report=makeReport(state);assert.equal(report.reviews.length,98);assert.equal(report.reviews.filter(q=>q.pretest).length,8);
 assert.deepEqual(report.sections.map(s=>[s.correct,s.total,s.pending]),[[50,50,0],[40,40,0]]);
});
test("IELTS report deduplicates final Listening check and leaves writing/speaking for human review",()=>{
 const state=createExamState(findExam("ielts-academic-01"),0);
 while(!state.finishedAt){for(const q of stageFor(state).questions)if(q.answers.length)state.responses[q.id]=q.answers[0];expireStages(state,Date.parse(state.deadline));}
 const report=makeReport(state);assert.deepEqual(report.sections.slice(0,2).map(s=>[s.correct,s.total]),[[40,40],[40,40]]);
 assert.equal(report.sections[2].pending,2);assert.equal(report.sections[3].pending,12);assert.equal(report.reviews.length,94);
});
test("exam snapshots are isolated from later definition changes",()=>{
 const definition=structuredClone(examDefinitions[0]);const state=createExamState(definition,0);const prompt=stageFor(state).questions[0].prompt;
 definition.stages[0].questions[0].prompt="edited later";assert.equal(stageFor(state).questions[0].prompt,prompt);
});
test("four bundled Listening recordings cover thirty minutes and match the authored script version",()=>{
 const manifest=JSON.parse(readFileSync(new URL("../assets/exams/manifest.json",import.meta.url),"utf8").replace(/^\uFEFF/,""));
 const hash=createHash("sha256").update(readFileSync(new URL("../src/modules/exams/ielts-listening.ts",import.meta.url))).digest("hex");
 assert.equal(manifest.sourceSha256,hash);assert.equal(manifest.parts.length,4);
 for(const part of manifest.parts){assert.ok(Math.abs(part.seconds-450)<0.2);assert.equal(statSync(new URL(`../assets/exams/ielts-01-part-${part.part}.mp3`,import.meta.url)).size,part.bytes);}
});
