import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { findExam, allExamSlugs } from '../src/modules/exams/definitions.ts';
import { hskMocks } from '../src/modules/exams/hsk/catalog.ts';
import { createExamState, expireStages, makeReport, stageFor, validateExamEdit, editExam } from '../src/modules/exams/engine.ts';
import { mockPractice } from '../src/modules/exam-practice/form.ts';
import { audioPath, audioSetOf, listeningFile, listeningParts, listeningPosition, hskQuestionAudio } from '../src/modules/exams/audio-files.ts';
import { validateContentShape, validateAnswerKeys } from '../src/modules/content/validation.ts';
import { hskChoices, hskDescription } from '../src/modules/exams/hsk/describe.ts';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=body=>createHash('sha256').update(body).digest('hex');
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const parts=['L1','L2','L3','L4','R1','R2','R3','R4'];
const part=groupId=>{const m=/^hsk-([lr])-([1-4])$/.exec(groupId);return m[1].toUpperCase()+m[2];};

test('HSK 1 has three 40-item forms: Listening 20 in 15 minutes, Reading 20 in 17, eight five-item parts',()=>{
 assert.equal(hskMocks.length,3);const ids=new Set();
 for(const meta of hskMocks){
  assert.ok(allExamSlugs().includes(meta.slug));
  const exam=findExam(meta.slug);assert.equal(exam.program,'hsk');assert.equal(exam.points,40);
  assert.deepEqual(exam.stages.map(s=>s.id),['hsk-l','hsk-r']);assert.deepEqual(exam.stages.map(s=>s.seconds),[900,1020]);
  assert.deepEqual(exam.stages.map(s=>s.questions.length),[20,20]);
  assert.deepEqual(exam.stages.flatMap(s=>s.groups.map(g=>part(g.id))),parts);
  assert.ok(validateAnswerKeys(exam));assert.ok(validateContentShape(exam,structuredClone(exam)));
  exam.stages.flatMap(s=>s.questions).forEach((q,i)=>{
   assert.equal(q.number,String(i+1));assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(q.points,1);assert.equal(q.kind,'choice');
   assert.ok(q.options.includes(q.answers[0]),q.id);
   const p=part(q.groupId);
   if(p==='L1'||p==='R1'){assert.deepEqual(q.options,['√','×']);assert.equal(q.figure.kind,'image');}
   else if(p==='L2'||p==='L4')assert.deepEqual(q.options,['A','B','C']);
   else assert.deepEqual(q.options,['A','B','C','D','E','F']);
   assert.equal(Boolean(q.listening),p.startsWith('L'));
  });
 }
 assert.equal(ids.size,120);
});

test('HSK pictures are served answer-free files, and printed Chinese always carries pinyin',()=>{
 const files=new Set();
 for(const meta of hskMocks){
  const exam=findExam(meta.slug);
  const pictures=[];const lines=[];
  for(const stage of exam.stages){
   for(const group of stage.groups){pictures.push(...(group.hsk.pictures??[]),...(group.hsk.example?.pictures??[]));lines.push(...(group.hsk.choices??[]),...(group.hsk.example?.choices??[]));if(group.hsk.example?.line)lines.push(group.hsk.example.line);}
   for(const q of stage.questions){if(q.figure)pictures.push(q.figure);pictures.push(...(q.hsk?.pictures??[]));lines.push(...(q.hsk?.choices??[]));if(q.hsk?.line)lines.push(q.hsk.line);}
  }
  for(const picture of pictures){
   assert.match(picture.src,/^\/exam-assets\/hsk\/(hsk1-mock-0[1-3]|examples)\/[a-z0-9-]+\.svg$/);
   const file='public'+picture.src;assert.ok(existsSync(file),file);files.add(file);
   const body=readFileSync(file,'utf8');assert.ok(!/[一-鿿]/.test(body),file+' prints Chinese');assert.ok(!/<script|href=|xlink/i.test(body),file);
   assert.ok(picture.alt.length>3);
  }
  for(const line of lines){assert.ok(/[一-鿿]/.test(line.text),line.text);assert.ok(line.pinyin.trim().length>0,line.text);}
  // The six shared pictures, answers and words keep one extra choice, as on the paper.
  for(const group of exam.stages.flatMap(s=>s.groups).filter(g=>g.hsk.pictures||g.hsk.choices)){
   const used=new Set(exam.stages.flatMap(s=>s.questions).filter(q=>q.groupId===group.id).map(q=>q.answers[0]));
   assert.equal((group.hsk.pictures??group.hsk.choices).length,6);assert.equal(used.size,5,group.id);
  }
 }
 const served=readdirSync('public/exam-assets/hsk',{recursive:true}).filter(name=>String(name).endsWith('.svg'));
 assert.equal(served.length,files.size,'every served picture is used');
});

test('HSK snapshots grade both sections, lock Listening after its deadline and keep transcripts for review',()=>{
 for(const meta of hskMocks){
  const exam=findExam(meta.slug),state=createExamState(exam,0);
  for(let i=0;i<2;i++){
   const stage=stageFor(state),responses=Object.fromEntries(stage.questions.map(q=>[q.id,q.answers[0]]));
   assert.ok(validateExamEdit(state,{revision:0,stageId:stage.id,responses,flags:[]}));
   assert.equal(validateExamEdit(state,{revision:0,stageId:stage.id,responses:{[stage.questions[0].id]:'G'},flags:[]}),false);
   editExam(state,{responses,flags:[]});
   const oldId=stage.questions[0].id;
   expireStages(state,Date.parse(state.deadline));
   if(i===0)assert.equal(validateExamEdit(state,{revision:0,stageId:stageFor(state).id,responses:{[oldId]:'√'},flags:[]}),false);
  }
  const report=makeReport(state);
  assert.equal(report.points.earned,40);assert.deepEqual(report.sections.map(s=>[s.correct,s.total]),[[20,20],[20,20]]);
  assert.ok(report.reviews.filter(q=>q.groupId.startsWith('hsk-l-')).every(q=>q.transcript&&/[一-鿿]/.test(q.transcript)));
  assert.ok(report.reviews.filter(q=>q.groupId.startsWith('hsk-r-')).every(q=>!q.transcript));
  assert.ok(report.reviews.every(q=>q.hskGroup));
  const blank=makeReport(createExamState(exam,0));assert.equal(blank.points.earned,0);
 }
});

test('HSK practice carries pictures and pinyin without keys or heard text, and reveals only after checking',()=>{
 for(const meta of hskMocks){
  const exam=findExam(meta.slug),source=mockPractice(exam);
  // Reading sentences may share words with what is heard, so the leak check reads the Listening pages only.
  const payload=JSON.stringify(source.form.questions.filter(item=>item.section.startsWith('hsk-l-')));
  assert.equal(source.form.subject,'hsk');assert.equal(source.form.questions.length,40);assert.equal(source.form.sections.length,8);
  for(const stage of exam.stages)for(const q of stage.questions){
   const publicQuestion=source.form.questions.find(item=>item.id===q.id);
   for(const field of ['answers','answerDisplay','explanation','listening','script'])assert.equal(field in publicQuestion,false,field);
   assert.ok(publicQuestion.hskGroup,q.id);
   const wrong=q.options.find(option=>option!==q.answers[0]);
   assert.equal(source.grade(q.id,wrong).correct,false);
   const result=source.grade(q.id,q.answers[0]);assert.equal(result.correct,true);
   assert.equal(source.reveal(q.id,result).answerValue,q.answers[0]);
   const material=source.material(q.id);
   assert.equal(material.transcript,undefined);
   if(q.listening){
    // What is heard (every Chinese line of the script) never reaches the page before a check.
    for(const line of q.listening.script.split('\n').filter((_,i)=>i%2===0))assert.ok(!payload.includes(line.replace(/^[男女]：/,'').replace(/^问：/,'')),q.id+' leaks '+line);
    assert.equal(source.reveal(q.id,result).transcript,q.listening.script);
    assert.equal(publicQuestion.audioPart,q.listening.part);
    assert.ok(!JSON.stringify(material).includes(q.listening.script.split('\n')[0].replace(/^[男女]：/,'')));
   }
   // Picture tasks reach the assistant as descriptions, never as bare letters.
   const p=part(q.groupId);
   if(['L2','L3','R2'].includes(p))assert.ok(material.options.every(option=>/^[A-F]: picture of /.test(option)),q.id);
   if(['L4','R3','R4'].includes(p))assert.ok(material.options.every(option=>/^[A-F]: .+\(.+\)$/.test(option)),q.id);
   if(p==='L1'||p==='R1')assert.match(material.context,/Picture: /);
  }
 }
 assert.equal(hskDescription({}),'');assert.equal(hskChoices({}),undefined);
});

test('Twelve Mandarin tracks match the pack, their hashes, item timings, own route and allowlisted paths',()=>{
 for(const meta of hskMocks){
  const manifest=json('assets/hsk-audio/'+meta.slug+'-audio.json');
  const offline=json(`MockExmps/HSK/mock-0${meta.number}/mock.json`);
  assert.equal(manifest.parts.length,4);assert.deepEqual(listeningParts(meta.slug),manifest.parts.map(p=>p.seconds));
  assert.ok(manifest.parts.reduce((sum,p)=>sum+p.seconds,0)<840);
  assert.equal(audioSetOf(meta.slug),'hsk');assert.equal(audioPath(meta.slug),'/audio/hsk');
  for(const part of manifest.parts){
   assert.equal(hash(stable([offline.listening['part'+part.part],offline.examples.listening['part'+part.part]])),part.scriptSha256);
   const filename=listeningFile(meta.slug,part.part);assert.equal(filename,part.file);
   assert.ok(existsSync('assets/hsk-audio/'+filename));assert.equal(hash(readFileSync('assets/hsk-audio/'+filename)),part.sha256);
  }
  const exam=findExam(meta.slug);
  for(const q of exam.stages[0].questions){
   const range=hskQuestionAudio(meta.slug,q.id);assert.ok(range,q.id);assert.equal(range.part,q.listening.part);
   assert.ok(range.end>range.start);assert.ok(range.end<manifest.parts[range.part-1].seconds);
  }
  assert.equal(hskQuestionAudio(meta.slug,'hsk1-01-21'),undefined);
  assert.equal(listeningPosition(meta.slug,0).part,1);assert.equal(listeningPosition(meta.slug,9999).ended,true);
 }
 assert.equal(listeningFile('../hsk1-mock-01',1),undefined);assert.equal(listeningFile('hsk1-mock-01',5),undefined);
 assert.equal(audioSetOf('jlpt-n5-01'),'base');assert.equal(audioSetOf('ielts-academic-07'),'forms');
});

test('HSK slugs, pictures and audio stay out of the offline pack, and the pack stays out of deployment',()=>{
 assert.match(readFileSync('.vercelignore','utf8'),/^MockExmps\/HSK\/$/m);
 const config=readFileSync('next.config.ts','utf8');
 assert.ok(config.includes('"./assets/hsk/*.json"'));assert.ok(config.includes('"/api/mock-attempts/*/audio/hsk":["./assets/hsk-audio/*.mp3"]'));
 for(const meta of hskMocks)assert.ok(!JSON.stringify(meta).match(/answer|script/i));
});
