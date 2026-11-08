import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { findExam, allExamSlugs } from '../src/modules/exams/definitions.ts';
import { jlptMocks } from '../src/modules/exams/jlpt/catalog.ts';
import { createExamState, expireStages, makeReport, stageFor, validateExamEdit, editExam } from '../src/modules/exams/engine.ts';
import { mockPractice } from '../src/modules/exam-practice/form.ts';
import { listeningFile, listeningParts, listeningPosition, jlptQuestionAudio } from '../src/modules/exams/audio-files.ts';
import { validateContentShape, validateAnswerKeys } from '../src/modules/content/validation.ts';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=body=>createHash('sha256').update(body).digest('hex');
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);

test('JLPT has three full N5 and N4 forms, official section windows and 456 unique items',()=>{
 assert.equal(jlptMocks.length,6);const ids=new Set();
 for(const meta of jlptMocks){
  assert.ok(allExamSlugs().includes(meta.slug));
  const exam=findExam(meta.slug);assert.equal(exam.program,'jlpt');
  assert.equal(exam.points,meta.level==='N5'?67:85);
  assert.deepEqual(exam.stages.map(s=>s.seconds),meta.level==='N5'?[1200,2400,1800]:[1500,3300,2100]);
  assert.deepEqual(exam.stages.map(s=>s.questions.length),meta.level==='N5'?[21,22,24]:[28,29,28]);
  assert.ok(validateAnswerKeys(exam));assert.ok(validateContentShape(exam,structuredClone(exam)));
  for(const stage of exam.stages)for(const q of stage.questions){assert.ok(!ids.has(q.id));ids.add(q.id);assert.ok(q.options.includes(q.answers[0]));assert.equal(q.points,1);}
 }
 assert.equal(ids.size,456);
});

test('JLPT snapshots grade all three sections exactly and lock previous-stage responses',()=>{
 for(const meta of jlptMocks){
  const exam=findExam(meta.slug),state=createExamState(exam,0);
  for(let i=0;i<3;i++){
   const stage=stageFor(state),responses=Object.fromEntries(stage.questions.map(q=>[q.id,q.answers[0]]));
   assert.ok(validateExamEdit(state,{revision:0,stageId:stage.id,responses,flags:[]}));
   editExam(state,{responses,flags:[]});
   const oldId=stage.questions[0].id;
   expireStages(state,Date.parse(state.deadline));
   if(i<2)assert.equal(validateExamEdit(state,{revision:0,stageId:stageFor(state).id,responses:{[oldId]:'forged'},flags:[]}),false);
  }
  const report=makeReport(state);
  assert.equal(report.points.earned,exam.points);assert.deepEqual(report.sections.map(s=>s.total),meta.level==='N5'?[21,22,24]:[28,29,28]);
  assert.ok(report.reviews.filter(q=>q.number.startsWith('L')).every(q=>q.transcript));
  assert.ok(report.reviews.every(q=>q.groupId));
 }
});

test('JLPT practice carries skill groups without keys or scripts and reveals only after checking',()=>{
 for(const meta of jlptMocks){
  const exam=findExam(meta.slug),source=mockPractice(exam),payload=JSON.stringify(source.form);
  assert.equal(source.form.questions.length,exam.points);assert.equal(source.form.subject,'jlpt');
  assert.equal(source.form.sections.length,meta.level==='N5'?14:15);
  for(const stage of exam.stages)for(const q of stage.questions){
   const publicQuestion=source.form.questions.find(item=>item.id===q.id);
   for(const field of ['answers','answerDisplay','explanation','listening','script','orderedChunks'])assert.equal(field in publicQuestion,false,field);
   const result=source.grade(q.id,q.answers[0]);assert.equal(result.correct,true);
   assert.equal(source.reveal(q.id,result).answerValue,q.answers[0]);
   if(q.listening){
    assert.ok(!payload.includes(q.listening.script));
    assert.equal(source.reveal(q.id,result).transcript,q.listening.script);
    assert.equal(publicQuestion.audioPart,q.listening.part);
    assert.equal(source.material(q.id).transcript,undefined);
   }
  }
 }
});

test('24 Japanese tracks match authored scripts, hashes, item timings and allowlisted paths',()=>{
 for(const meta of jlptMocks){
  const manifest=json('assets/jlpt/'+meta.slug+'-audio.json');
  const offline=json(`MockExmps/JLPT/${meta.level}/mock-0${meta.number}/mock.json`);
  assert.equal(manifest.parts.length,4);assert.deepEqual(listeningParts(meta.slug),manifest.parts.map(p=>p.seconds));
  assert.ok(manifest.parts.reduce((sum,p)=>sum+p.seconds,0)<(meta.level==='N5'?1800:2100));
  for(const part of manifest.parts){
   assert.equal(hash(stable(offline.sections[2].groups[part.part-1])),part.scriptSha256);
   const filename=listeningFile(meta.slug,part.part);assert.equal(filename,part.file);
   assert.ok(existsSync('assets/exams/'+filename));assert.equal(hash(readFileSync('assets/exams/'+filename)),part.sha256);
   for(const [id,range] of Object.entries(part.questions)){assert.ok(range.end>range.start);assert.ok(range.end<part.seconds);assert.deepEqual(jlptQuestionAudio(meta.slug,id),{...range,part:part.part});}
  }
  assert.equal(listeningPosition(meta.slug,0).part,1);assert.equal(listeningPosition(meta.slug,9999).ended,true);
 }
 assert.equal(listeningFile('../jlpt-n5-01',1),undefined);assert.equal(listeningFile('jlpt-n5-01',5),undefined);
});
