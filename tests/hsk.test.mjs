import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { findExam, allExamSlugs } from '../src/modules/exams/definitions.ts';
import { hskMocks, hskLevel } from '../src/modules/exams/hsk/catalog.ts';
import { createExamState, expireStages, makeReport, stageFor, validateExamEdit, editExam, isCorrect } from '../src/modules/exams/engine.ts';
import { mockPractice } from '../src/modules/exam-practice/form.ts';
import { audioPath, audioSetOf, listeningFile, listeningParts, listeningPosition, hskQuestionAudio, hskPlayingItem } from '../src/modules/exams/audio-files.ts';
import { validateContentShape, validateAnswerKeys } from '../src/modules/content/validation.ts';
import { hskChoices, hskDescription } from '../src/modules/exams/hsk/describe.ts';
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=body=>createHash('sha256').update(body).digest('hex');
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const han=/[一-鿿]/;

// The HSK 3.0 paper (2026) as built from MockExmps/HSK3: groups, their layouts and sizes, stages and minutes.
const PAPER={
 1:{points:40,minutes:40,stages:['hsk-l','hsk-r'],seconds:[900,1500],counts:[20,20],tracks:4,
  groups:['hsk-l-1','hsk-l-2','hsk-l-3','hsk-l-4','hsk-r-1','hsk-r-2','hsk-r-3','hsk-r-4'],
  layouts:['L2','L4','L3','L4','R2','R3','R4','RQ'],sizes:[5,5,5,5,5,5,5,5]},
 2:{points:60,minutes:60,stages:['hsk-l','hsk-r','hsk-w'],seconds:[1200,1800,600],counts:[25,25,10],tracks:3,
  groups:['hsk-l-1','hsk-l-2a','hsk-l-2b','hsk-l-3','hsk-r-1','hsk-r-2','hsk-r-3a','hsk-r-3b','hsk-r-4','hsk-w-1','hsk-w-2'],
  layouts:['L2','L3','L3','L4','R2','R4','R3','R3','RQ','W1','W2'],sizes:[5,5,5,10,5,5,5,5,5,5,5]},
};
const layoutOf=(exam,q)=>exam.stages.flatMap(s=>s.groups).find(g=>g.id===q.groupId).hsk.layout;
const wrongFor=q=>q.kind==='short'?(q.answers[0]==='我'?'你':'我'):q.options.find(option=>option!==q.answers[0]);

test('HSK 1 and HSK 2 follow the HSK 3.0 paper: stages, minutes, groups, layouts and numbering',()=>{
 assert.equal(hskMocks.length,12);const ids=new Set();
 for(const meta of hskMocks){
  const paper=PAPER[meta.level];
  assert.ok(allExamSlugs().includes(meta.slug));assert.equal(hskLevel(meta.slug),meta.level);
  assert.equal(meta.questions,paper.points);assert.equal(meta.minutes,paper.minutes);
  const exam=findExam(meta.slug);assert.equal(exam.program,'hsk');assert.equal(exam.points,paper.points);assert.equal(exam.version,2);
  assert.deepEqual(exam.stages.map(s=>s.id),paper.stages);assert.deepEqual(exam.stages.map(s=>s.seconds),paper.seconds);
  assert.deepEqual(exam.stages.map(s=>s.questions.length),paper.counts);
  const groups=exam.stages.flatMap(s=>s.groups);
  assert.deepEqual(groups.map(g=>g.id),paper.groups);assert.deepEqual(groups.map(g=>g.hsk.layout),paper.layouts);
  assert.ok(validateAnswerKeys(exam));assert.ok(validateContentShape(exam,structuredClone(exam)));
  const all=exam.stages.flatMap(s=>s.questions);
  assert.deepEqual(groups.map(g=>all.filter(q=>q.groupId===g.id).length),paper.sizes);
  all.forEach((q,i)=>{
   assert.equal(q.number,String(i+1));assert.equal(q.id,`hsk${meta.level}-0${meta.number}-${String(i+1).padStart(2,'0')}`);
   assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(q.points,1);
   const group=groups.find(g=>g.id===q.groupId),layout=group.hsk.layout;
   assert.equal(Boolean(q.listening),q.groupId.startsWith('hsk-l-'));
   if(layout==='W2'){
    // Writing 2: one character typed from its pinyin, graded as text.
    assert.equal(q.kind,'short');assert.equal(q.matcher,'text');assert.equal(q.options,undefined);
    assert.equal([...q.answers[0]].length,1);assert.ok(han.test(q.answers[0]));
    assert.ok(q.hsk.blank.hint&&q.hsk.blank.pinyin&&q.hsk.blank.before+q.hsk.blank.after);assert.ok(q.prompt.includes('（'+q.hsk.blank.hint+'）'));
    return;
   }
   assert.equal(q.kind,'choice');assert.ok(q.options.includes(q.answers[0]),q.id);
   if(layout==='L2'){assert.deepEqual(q.options,['A','B','C']);assert.deepEqual(q.hsk.pictures.map(p=>p.label),['A','B','C']);}
   else if(layout==='L4'){assert.deepEqual(q.options,['A','B','C']);assert.equal(q.hsk.choices.length,3);}
   else if(layout==='RQ'){assert.deepEqual(q.options,['A','B','C']);assert.ok(q.hsk.line.text&&q.hsk.statement.text&&q.hsk.choices.length===3);assert.ok(q.prompt.includes('★ '+q.hsk.statement.text));}
   else assert.deepEqual(q.options,(group.hsk.pictures??group.hsk.choices).map(entry=>entry.label));
   if(layout==='W1'){assert.ok(q.hsk.compose.word.length>=1&&q.hsk.compose.given&&['left','right','top','bottom'].includes(q.hsk.compose.gap));assert.ok(q.prompt.includes(q.hsk.compose.pinyin));}
  });
  // A six-entry bank gives one entry to its worked example, or keeps one spare when the example prints its own picture
  // or answer (the HSK 1 examples kept from the 2.0 paper); a five-entry bank uses every entry once.
  for(const group of groups.filter(g=>g.hsk.pictures||g.hsk.choices)){
   const entries=(group.hsk.pictures??group.hsk.choices);
   const used=all.filter(q=>q.groupId===group.id).map(q=>q.answers[0]);
   assert.equal(new Set(used).size,5,group.id);
   const ownPicture=group.hsk.example?.pictures?.every(picture=>!entries.some(entry=>entry.src===picture.src));
   if(ownPicture||group.hsk.example?.answerLine){assert.equal(entries.length,6,group.id);if(ownPicture)assert.ok(group.hsk.example.pictures[0].src.includes('/examples/'));}
   else if(entries.length===6){
    assert.ok(group.hsk.example,group.id);
    const example=entries.find(entry=>entry.label===group.hsk.example.answer||entry.text===group.hsk.example.answer).label;
    assert.deepEqual([...used,example].sort(),entries.map(entry=>entry.label),group.id);
   }else{assert.equal(entries.length,5);assert.deepEqual([...used].sort(),entries.map(entry=>entry.label));}
  }
 }
 assert.equal(ids.size,600);
});

test('HSK pictures are served answer-free files, and printed Chinese carries pinyin (Writing components excepted)',()=>{
 const files=new Set();
 for(const meta of hskMocks){
  const exam=findExam(meta.slug);
  const pictures=[];const lines=[];
  for(const stage of exam.stages){
   for(const group of stage.groups){
    const example=group.hsk.example;
    pictures.push(...(group.hsk.pictures??[]),...(example?.pictures??[]));
    if(group.hsk.layout!=='W1')lines.push(...(group.hsk.choices??[]));
    lines.push(...(example?.choices??[]),...[example?.line,example?.statement].filter(Boolean));
   }
   for(const q of stage.questions){if(q.figure)pictures.push(q.figure);pictures.push(...(q.hsk?.pictures??[]));lines.push(...(q.hsk?.choices??[]),...[q.hsk?.line,q.hsk?.statement].filter(Boolean));}
  }
  for(const picture of pictures){
   assert.match(picture.src,/^\/exam-assets\/hsk\/(hsk[12]-mock-0[1-6]|examples)\/[a-z0-9-]+\.svg$/);
   const file='public'+picture.src;assert.ok(existsSync(file),file);files.add(file);
   const body=readFileSync(file,'utf8');assert.ok(!han.test(body),file+' prints Chinese');assert.ok(!/<script|href=|xlink/i.test(body),file);
   assert.ok(picture.alt.length>3);
  }
  for(const line of lines){assert.ok(han.test(line.text),line.text);assert.ok(line.pinyin.trim().length>0,line.text);}
  // Writing 1 banks are components (亻, 氵 …), printed without pinyin; each item's word carries its pinyin.
  for(const group of exam.stages.flatMap(s=>s.groups).filter(g=>g.hsk.layout==='W1'))for(const entry of group.hsk.choices)assert.ok(han.test(entry.text)&&[...entry.text].length===1,entry.text);
 }
 // The free HSK 1 mock still shows the shared HSK 2.0 example pictures that this build copies.
 for(const name of readFileSync('assets/free-mocks/hsk1-free.json','utf8').matchAll(/\/exam-assets\/hsk\/examples\/[a-z0-9-]+\.svg/g))files.add('public'+name[0]);
 const served=readdirSync('public/exam-assets/hsk',{recursive:true}).filter(name=>String(name).endsWith('.svg'));
 assert.equal(served.length,files.size,'every served picture is used');
});

test('HSK snapshots grade every section, lock Listening after its deadline and keep transcripts for review',()=>{
 for(const meta of hskMocks){
  const paper=PAPER[meta.level];
  const exam=findExam(meta.slug),state=createExamState(exam,0);
  for(let i=0;i<paper.stages.length;i++){
   const stage=stageFor(state),responses=Object.fromEntries(stage.questions.map(q=>[q.id,q.answers[0]]));
   assert.equal(stage.id,paper.stages[i]);
   assert.ok(validateExamEdit(state,{revision:0,stageId:stage.id,responses,flags:[]}));
   assert.equal(validateExamEdit(state,{revision:0,stageId:stage.id,responses:{[stage.questions[0].id]:'G'},flags:[]}),false);
   editExam(state,{responses,flags:[]});
   const oldId=stage.questions[0].id;
   expireStages(state,Date.parse(state.deadline));
   if(i===0)assert.equal(validateExamEdit(state,{revision:0,stageId:stageFor(state).id,responses:{[oldId]:'A'},flags:[]}),false);
  }
  const report=makeReport(state);
  assert.equal(report.points.earned,paper.points);assert.deepEqual(report.sections.map(s=>[s.correct,s.total]),paper.counts.map(count=>[count,count]));
  assert.equal(report.sections.length,paper.stages.length);
  if(meta.level===2)assert.equal(report.sections[2].title,'书写 · Бичих');
  assert.ok(report.reviews.filter(q=>q.groupId.startsWith('hsk-l-')).every(q=>q.transcript&&han.test(q.transcript)));
  assert.ok(report.reviews.filter(q=>!q.groupId.startsWith('hsk-l-')).every(q=>!q.transcript));
  assert.ok(report.reviews.every(q=>q.hskGroup?.layout));
  assert.equal(makeReport(createExamState(exam,0)).points.earned,0);
 }
 // Typed characters: width and spaces do not matter, another character is wrong.
 const typed=findExam('hsk2-mock-01').stages[2].questions.find(q=>q.kind==='short');
 assert.equal(isCorrect(typed,' '+typed.answers[0]+' '),true);assert.equal(isCorrect(typed,wrongFor(typed)),false);assert.equal(isCorrect(typed,''),false);
});

test('HSK practice carries pictures and pinyin without keys or heard text, and reveals only after checking',()=>{
 for(const meta of hskMocks){
  const paper=PAPER[meta.level];
  const exam=findExam(meta.slug),source=mockPractice(exam);
  // Reading sentences may share words with what is heard, so the leak check reads the Listening pages only.
  const payload=JSON.stringify(source.form.questions.filter(item=>item.section.startsWith('hsk-l-')));
  assert.equal(source.form.subject,'hsk');assert.equal(source.form.questions.length,paper.points);assert.equal(source.form.sections.length,paper.groups.length);
  if(meta.level===2)assert.ok(source.form.sections.filter(s=>s.id.startsWith('hsk-w-')).every(s=>s.title.startsWith('书写 · ')));
  for(const q of exam.stages.flatMap(s=>s.questions)){
   const publicQuestion=source.form.questions.find(item=>item.id===q.id);
   for(const field of ['answers','answerDisplay','explanation','listening','script'])assert.equal(field in publicQuestion,false,field);
   assert.ok(publicQuestion.hskGroup?.layout,q.id);
   assert.equal(source.grade(q.id,wrongFor(q)).correct,false);
   const result=source.grade(q.id,q.answers[0]);assert.equal(result.correct,true);
   assert.equal(source.reveal(q.id,result).answerValue,q.answers[0]);
   const material=source.material(q.id);
   assert.equal(material.transcript,undefined);
   if(q.listening){
    // What is heard (every Chinese line of the script) never reaches the page before a check: not on its own page, and
    // a sentence not on any Listening page (a one-word line may be another item's printed choice).
    const own=JSON.stringify(publicQuestion);
    for(const line of q.listening.script.split('\n').filter((_,i)=>i%2===0)){
     const heard=line.replace(/^[男女]：/,'').replace(/^问：/,'');
     assert.ok(!own.includes(heard),q.id+' shows '+line);
     if([...heard].length>=4)assert.ok(!payload.includes(heard),q.id+' leaks '+line);
    }
    assert.equal(source.reveal(q.id,result).transcript,q.listening.script);
    assert.equal(publicQuestion.audioPart,q.listening.part);
   }
   // Pictures and printed lines reach the assistant as descriptions, never as bare letters, and never with the key.
   const layout=layoutOf(exam,q);
   if(['L2','L3','R2'].includes(layout))assert.ok(material.options.every(option=>/^[A-F]: picture of /.test(option)),q.id);
   if(['L4','R3','R4','RQ'].includes(layout))assert.ok(material.options.every(option=>/^[A-F]: .+\(.+\)$/.test(option)),q.id);
   if(layout==='RQ')assert.match(material.context,/Question: ★ /);
   if(layout==='W1'){assert.ok(material.options.every(option=>/^[A-F]: \S$/u.test(option)),q.id);assert.match(material.context,/missing (left|right|top|bottom) component/);assert.ok(!hskDescription({hsk:q.hsk}).includes(q.hsk.compose.word),q.id);}
   if(layout==='W2')assert.match(material.context,/Sentence with one missing character: .*＿/);
  }
 }
 assert.equal(hskDescription({}),'');assert.equal(hskChoices({}),undefined);
});

test('HSK 3.0 Mandarin tracks (four for HSK 1, three for HSK 2) match the pack, their hashes and item timings',()=>{
 for(const meta of hskMocks){
  const paper=PAPER[meta.level];
  const manifest=json('assets/hsk-audio/'+meta.slug+'-audio.json');
  const sets=json(`MockExmps/HSK3/${meta.slug}/mock.json`).stages.find(s=>s.id==='hsk-l').sets;
  assert.equal(manifest.paper,'HSK 3.0');assert.equal(manifest.humanListeningReview,false);
  assert.equal(manifest.parts.length,paper.tracks);assert.deepEqual(listeningParts(meta.slug),manifest.parts.map(p=>p.seconds));
  assert.ok(manifest.parts.reduce((sum,p)=>sum+p.seconds,0)<paper.seconds[0]-60);
  assert.equal(audioSetOf(meta.slug),'hsk');assert.equal(audioPath(meta.slug),'/audio/hsk');
  for(const part of manifest.parts){
   assert.equal(hash(stable(sets.filter(set=>Number(set.key[1])===part.part))),part.scriptSha256,meta.slug+' part '+part.part);
   const filename=listeningFile(meta.slug,part.part);assert.equal(filename,part.file);
   assert.ok(existsSync('assets/hsk-audio/'+filename));assert.equal(hash(readFileSync('assets/hsk-audio/'+filename)),part.sha256);
  }
  // No track past the paper's last part is served or kept.
  assert.equal(listeningFile(meta.slug,paper.tracks+1),undefined);assert.equal(existsSync(`assets/hsk-audio/${meta.slug}-part-${paper.tracks+1}.mp3`),false);
  const exam=findExam(meta.slug);let before=-1;
  for(const q of exam.stages[0].questions){
   const range=hskQuestionAudio(meta.slug,q.id);assert.ok(range,q.id);assert.equal(range.part,q.listening.part);
   assert.ok(range.end>range.start);assert.ok(range.end<manifest.parts[range.part-1].seconds);
   assert.equal(hskPlayingItem(meta.slug,range.part,range.start+1),q.id);
   if(range.part===before)assert.equal(hskPlayingItem(meta.slug,range.part,range.start-0.5)===q.id,false);
   before=range.part;
  }
  assert.equal(hskQuestionAudio(meta.slug,exam.stages[1].questions[0].id),undefined);
  assert.equal(listeningPosition(meta.slug,0).part,1);assert.equal(listeningPosition(meta.slug,9999).ended,true);
 }
 // HSK 2 Part 2 opens on its first set (item 6); the page turns to the second set when item 11 starts.
 assert.equal(hskPlayingItem('hsk2-mock-01',2,0),'hsk2-01-06');
 assert.equal(listeningFile('../hsk1-mock-01',1),undefined);assert.equal(hskPlayingItem('sat-01',1,0),undefined);
 assert.equal(audioSetOf('jlpt-n5-01',1),'base');assert.equal(audioSetOf('jlpt-n5-01'),'jlpt');assert.equal(audioSetOf('ielts-academic-07'),'forms');
});

test('HSK slugs, pictures and audio stay out of the offline packs, and the packs stay out of deployment',()=>{
 const ignore=readFileSync('.vercelignore','utf8');
 for(const pack of ['HSK','HSK2','HSK3'])assert.match(ignore,new RegExp('^MockExmps/'+pack+'/$','m'));
 const config=readFileSync('next.config.ts','utf8');
 assert.ok(config.includes('"./assets/hsk/*.json"'));assert.ok(config.includes('"/api/mock-attempts/*/audio/hsk":["./assets/hsk-audio/*.mp3"]'));
 for(const meta of hskMocks)assert.ok(!JSON.stringify(meta).match(/answer|script/i));
});
