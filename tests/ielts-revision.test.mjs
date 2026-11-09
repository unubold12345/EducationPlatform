import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { findExam } from '../src/modules/exams/definitions.ts';
import { additionalListening } from '../src/modules/exams/ielts-additional-listening.ts';
import { listeningFile, listeningParts, listeningPosition } from '../src/modules/exams/audio-files.ts';
import { mockPractice } from '../src/modules/exam-practice/form.ts';
import { validateContentShape } from '../src/modules/content/validation.ts';
import { createExamState, stageFor } from '../src/modules/exams/engine.ts';

const slug=n=>`ielts-academic-0${n}`;

test('revised IELTS banks keep full sections, fresh scored IDs and qualified review for productive skills',()=>{
 for(let n=1;n<=6;n++){
  const e=findExam(slug(n));assert.equal(e.version,2);
  assert.deepEqual(e.stages.map(s=>s.seconds),[1800,120,3600,3600,240,60,120,300]);
  assert.equal(e.stages[0].questions.length,40);assert.equal(e.stages[2].questions.length,40);
  assert.deepEqual(e.stages[0].questions,e.stages[1].questions);
  for(const q of [...e.stages[0].questions,...e.stages[2].questions]){
   assert.match(q.id,/-v2$/);
   assert.doesNotMatch(JSON.stringify(q.options??[]),/This detail was not stated|Neither option was selected|Every disagreement described|unrelated personal biography/);
   if(q.options){assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.includes(q.answers[0]));}
  }
  assert.deepEqual(e.stages[3].questions.map(q=>q.minWords),[150,250]);
  for(const q of e.stages[3].questions)assert.deepEqual(q.answers,[]);
  assert.equal(e.stages[5].questions[0].prompt,e.stages[6].questions[0].prompt);
  assert.equal(e.stages[7].questions.length,5);
  const source=mockPractice(e);assert.equal(source.audioRevision,e.audioRevision);
  assert.doesNotMatch(JSON.stringify(source.form),/"answers"|"transcript"|"explanation"/);
 }
});

test('new recordings retain legacy files and timing, with the revision held in each attempt snapshot',()=>{
 for(let n=2;n<=6;n++){
  const e=findExam(slug(n)),saved=createExamState(e,0);
  assert.equal(saved.definition.audioRevision,2);
  const edited=structuredClone(e);edited.audioRevision=1;assert.equal(validateContentShape(e,edited),false);
  e.audioRevision=1;assert.equal(saved.definition.audioRevision,2);e.audioRevision=2;
  assert.match(listeningFile(slug(n),1,2),/-v2-part-1\.mp3$/);
  assert.equal(listeningFile(slug(n),1,1),`ielts-0${n}-part-1.mp3`);
  const legacy=JSON.parse(readFileSync(new URL(`../assets/exams/manifest-0${n}.json`,import.meta.url),'utf8'));
  for(const p of legacy.parts){
   const bytes=readFileSync(new URL(`../assets/exams/ielts-0${n}-part-${p.part}.mp3`,import.meta.url));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256);
   assert.ok(Math.abs(listeningParts(slug(n),1)[p.part-1]-p.seconds)<0.01);
  }
  const at=listeningParts(slug(n),2)[0]+1;
  assert.equal(listeningPosition(slug(n),at,2).part,2);
  assert.ok(stageFor(saved).questions.every(q=>q.id.endsWith('-v2')));
 }
});

test('revised scripts remove answer announcements and maintain evidence for every short completion',()=>{
 for(let n=2;n<=6;n++){
  const {questions,scripts}=additionalListening(n);
  for(const [i,p] of scripts.entries()){
   const script=p.halves.flat().map(t=>t.text).join(' ');
   assert.doesNotMatch(script,/Please put .+ in your notes|the correct (detail|approach) is|The next point concerns/);
   for(const q of questions.slice(i*10,i*10+10).filter(q=>q.kind==='short')){
    assert.ok(q.answers.some(a=>script.toLowerCase().includes(a.toLowerCase())),q.id);
    assert.ok(q.answers.every(a=>a.split(/\s+/).length<=q.maxWords));
   }
  }
  const source=mockPractice(findExam(slug(n))),q=source.form.questions.find(q=>q.audioPart===3);
  const reveal=source.reveal(q.id,{correct:true});
  assert.ok(reveal.transcript.includes(scripts[2].halves[0][0].text));
  assert.doesNotMatch(reveal.transcript,/Please put .+ in your notes/);
 }
});

test('Reading uses passage-specific matching across multiple paragraphs rather than a fixed answer position',()=>{
 for(let n=2;n<=6;n++){
  const read=findExam(slug(n)).stages[2],matches=read.questions.filter(q=>q.options?.join('')==='ABCDEFGH');
  assert.equal(matches.length,13);
  assert.ok(new Set(matches.map(q=>q.answers[0])).size>=6);
  for(const q of matches){const passage=read.passages.find(p=>p.title===q.passage).text;assert.ok(passage.includes(q.answers[0]+'. '));assert.match(q.explanation,/Paragraph [A-H]:/);}
  const statuses=read.questions.filter(q=>q.options?.join(',')==='TRUE,FALSE,NOT GIVEN').map(q=>q.answers[0]);
  assert.equal(statuses.length,9);
  for(let i=0;i<9;i+=3)assert.deepEqual(new Set(statuses.slice(i,i+3)),new Set(['TRUE','FALSE','NOT GIVEN']));
 }
});
