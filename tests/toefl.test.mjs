import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { findExam, allExamSlugs, examDefinitions } from '../src/modules/exams/definitions.ts';
import { toeflMocks, toeflSlugs, toeflListening, toeflSpeaking, toeflClips, toeflPlayingClip } from '../src/modules/exams/toefl/catalog.ts';
import { createExamState, expireStages, makeReport, stageFor, stageSeconds, validateExamEdit, editExam, isCorrect } from '../src/modules/exams/engine.ts';
import { mockPractice } from '../src/modules/exam-practice/form.ts';
import { validateContentShape, validateAnswerKeys } from '../src/modules/content/validation.ts';
import { subscriptionPlans, planCovers } from '../src/modules/subscriptions/plans.ts';
import { programOf } from '../src/modules/workspace/programs.ts';
import { buildSlots } from '../src/modules/exams/toefl/slots.ts';

const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const allQuestions=exam=>exam.stages.flatMap(stage=>[...stage.questions,...(stage.variants?[...stage.variants.lower,...stage.variants.higher]:[])]);
const keyFor=question=>question.answers[0]??'';
/** Run a sitting to its end: answer with `answer(question)` in every stage, then move the clock past the deadline. */
function sit(slug,answer){
 const exam=findExam(slug);let now=Date.parse('2026-11-18T00:00:00Z');
 const state=createExamState(exam,now);
 while(!state.finishedAt){
  const stage=stageFor(state);
  for(const question of stage.questions)state.responses[question.id]=answer(question,stage);
  now=Date.parse(state.deadline);expireStages(state,now);
 }
 return state;
}

test('nine TOEFL forms load by slug, outside the in-memory list, with 20 stages in the 2026 order',()=>{
 assert.equal(toeflMocks.length,9);
 for(const slug of toeflSlugs()){
  assert.ok(allExamSlugs().includes(slug));assert.ok(!examDefinitions.some(exam=>exam.slug===slug));
  const exam=findExam(slug);assert.equal(exam.program,'toefl');assert.equal(exam.audioRevision,1);
  assert.deepEqual(exam.stages.map(stage=>stage.id),['toefl-r1','toefl-r2','toefl-l1','toefl-l2','toefl-w-build','toefl-w-email','toefl-w-discussion','toefl-s-repeat-intro',...[1,2,3,4,5,6,7].map(n=>'toefl-s-repeat-'+n),'toefl-s-interview-intro',...[1,2,3,4].map(n=>'toefl-s-interview-'+n)]);
  const stage=id=>exam.stages.find(item=>item.id===id);
  assert.deepEqual([stage('toefl-r1').questions.length,stage('toefl-r2').variants.lower.length,stage('toefl-r2').variants.higher.length],[35,15,15]);
  assert.deepEqual([stage('toefl-l1').questions.length,stage('toefl-l2').variants.lower.length,stage('toefl-l2').variants.higher.length],[32,15,15]);
  assert.deepEqual([stage('toefl-r1').seconds,stage('toefl-r2').seconds,stage('toefl-w-build').seconds,stage('toefl-w-email').seconds,stage('toefl-w-discussion').seconds],[1200,540,360,420,600]);
  assert.equal(stage('toefl-r2').routeAt,21);assert.equal(stage('toefl-l2').routeAt,20);
  assert.ok(stage('toefl-l2').variantSeconds.higher>stage('toefl-l2').variantSeconds.lower);
  const ids=allQuestions(exam).map(question=>question.id);assert.equal(new Set(ids).size,ids.length);assert.equal(ids.length,150);
  assert.ok(validateAnswerKeys(exam),slug);assert.ok(validateContentShape(exam,structuredClone(exam)),slug);
  for(const question of allQuestions(exam)){
   if(question.kind==='choice')assert.ok(question.options.includes(question.answers[0]),question.id);
   assert.ok(question.id.startsWith('toefl'+slug.slice(6)+'-'),question.id);
  }
 }
});

test('the build is repeatable and copies every recording unchanged',()=>{
 const before=readFileSync('src/modules/exams/toefl/catalog.json','utf8')+readFileSync('src/modules/exams/toefl/timeline.json','utf8')+readFileSync('assets/toefl/toefl-05.json','utf8');
 execFileSync(process.execPath,['scripts/build-toefl-mocks.mjs'],{stdio:'pipe'});
 const after=readFileSync('src/modules/exams/toefl/catalog.json','utf8')+readFileSync('src/modules/exams/toefl/timeline.json','utf8')+readFileSync('assets/toefl/toefl-05.json','utf8');
 assert.equal(after,before);
 const manifest=JSON.parse(readFileSync('assets/toefl-audio/manifest.json','utf8'));
 assert.equal(manifest.length,459);assert.equal(readdirSync('assets/toefl-audio').filter(name=>name.endsWith('.mp3')).length,459);
 for(const entry of manifest.filter((_,at)=>at%23===0))assert.equal(hash('assets/toefl-audio/'+entry.file),entry.sha256,entry.file);
 for(const slug of toeflSlugs())for(const clip of toeflClips(slug))assert.ok(manifest.some(entry=>entry.file===`${slug}-${clip}.mp3`),clip);
});

test('client files and display fields hold no key, script or model answer',()=>{
 const client=readFileSync('src/modules/exams/toefl/catalog.json','utf8')+readFileSync('src/modules/exams/toefl/timeline.json','utf8');
 for(const slug of toeflSlugs()){
  const exam=findExam(slug);
  const shown=JSON.stringify(exam.stages.map(stage=>({groups:(stage.groups??[]).map(group=>group.toefl),items:allQuestions({stages:[stage]}).map(({toefl,prompt,options})=>({toefl,prompt,options}))})));
  for(const question of allQuestions(exam)){
   if(question.listening){for(const line of question.listening.script.split('\n').map(text=>text.replace(/^[A-Za-z]+: /,'')).filter(text=>text.length>=16)){assert.ok(!client.includes(line),question.id);assert.ok(!shown.includes(line),question.id);}}
   if(question.kind==='essay'||question.kind==='speaking')assert.ok(!shown.includes(question.explanation.slice(15,70)),question.id);
   if(question.toefl?.build)assert.ok(!shown.includes(question.answerDisplay),question.id);
  }
 }
});

test('Complete the Words and Build a Sentence grade their keys; a Build response maps back to its boxes',()=>{
 const exam=findExam('toefl-04');const all=allQuestions(exam);
 const gap=all.find(question=>question.toefl?.gap);
 assert.equal(isCorrect(gap,gap.answers[0].toUpperCase()),true);assert.equal(isCorrect(gap,gap.answers[0].slice(1)),false);
 const comma=all.find(question=>question.id==='toefl04-w-10');
 assert.equal(comma.answerDisplay,'If I had known about the deadline, I would have applied earlier.');
 assert.equal(isCorrect(comma,'I had known about the deadline I would have applied earlier'),true);
 assert.equal(isCorrect(comma,'I would have applied earlier I had known about the deadline'),false);
 for(const question of all.filter(item=>item.toefl?.build)){
  assert.deepEqual(buildSlots(question.answers[0],question.toefl.build.chips).join(' '),question.answers[0],question.id);
  assert.equal(question.toefl.build.slots,buildSlots(question.answers[0],question.toefl.build.chips).length);
 }
});

test('routing uses each form\'s counts: 21 of 35 for Reading, 20 of 32 for Listening; Module 2 lengths follow the route',()=>{
 const exam=findExam('toefl-01');
 for(const [correct,route] of [[20,'lower'],[21,'higher']]){
  const state=createExamState(exam,0);
  stageFor(state).questions.forEach((question,at)=>{state.responses[question.id]=at<correct?keyFor(question):'zz';});
  expireStages(state,Date.parse(state.deadline));
  assert.equal(state.routes['toefl-r2'],route);
 }
 for(const [correct,route] of [[19,'lower'],[20,'higher']]){
  const state=createExamState(exam,0);let now=0;
  while(stageFor(state).id!=='toefl-l1'){now=Date.parse(state.deadline);expireStages(state,now);}
  stageFor(state).questions.forEach((question,at)=>{state.responses[question.id]=at<correct?keyFor(question):'';});
  const start=Date.parse(state.deadline);expireStages(state,start);
  assert.equal(state.routes['toefl-l2'],route);
  const l2=exam.stages.find(stage=>stage.id==='toefl-l2');
  assert.equal(Date.parse(state.deadline)-start,l2.variantSeconds[route]*1000);
  assert.equal(stageSeconds(state,state.stageIndex),l2.variantSeconds[route]);
  assert.ok(l2.variantSeconds[route]>=toeflListening('toefl-01','toefl-l2',stageFor(state).questions.map(question=>question.id)).at(-1).windowEnd);
 }
});

test('SAT still routes at 65 % with its fixed module lengths',()=>{
 const sat=findExam('sat-full-01');const state=createExamState(sat,0);
 const first=stageFor(state).questions.filter(question=>!question.pretest);
 stageFor(state).questions.forEach(question=>{state.responses[question.id]=question.pretest?'':'';});
 first.slice(0,Math.ceil(first.length*0.65)).forEach(question=>{state.responses[question.id]=question.answers[0];});
 const start=Date.parse(state.deadline);expireStages(state,start);
 assert.equal(state.routes['sat-rw-2'],'higher');assert.equal(Date.parse(state.deadline)-start,1920000);
});

test('a listening answer changes only inside its window (plus 5 s); an unchanged value always passes',()=>{
 const exam=findExam('toefl-02');const state=createExamState(exam,0);
 while(stageFor(state).id!=='toefl-l1')expireStages(state,Date.parse(state.deadline));
 const start=Date.parse(state.stageStartedAt);
 const [first,second]=toeflListening('toefl-02','toefl-l1',[]);
 const question=stageFor(state).questions.find(item=>item.id===first.questions[0]);
 const edit=value=>({revision:0,stageId:'toefl-l1',responses:{[question.id]:value},flags:[]});
 assert.equal(validateExamEdit(state,edit(question.options[1]),start+(first.start+first.seconds+1)*1000),true);
 assert.equal(validateExamEdit(state,edit(question.options[1]),start+(first.windowEnd+4)*1000),true);
 assert.equal(validateExamEdit(state,edit(question.options[1]),start+(first.windowEnd+6)*1000),false);
 assert.equal(validateExamEdit(state,edit(question.options[1]),start+(second.windowEnd)*1000),false);
 editExam(state,edit(question.options[2]));
 assert.equal(validateExamEdit(state,edit(question.options[2]),start+(second.windowEnd)*1000),true);
 assert.equal(validateExamEdit(state,edit(''),start+(second.windowEnd)*1000),false);
 // Without a clock (older callers) nothing changes.
 assert.equal(validateExamEdit(state,edit(question.options[0])),true);
});

test('only the clip playing now is served during a sitting; speaking stages serve their clip in its first seconds',()=>{
 const clips=toeflListening('toefl-03','toefl-l1',[]);
 assert.equal(toeflPlayingClip('toefl-03','toefl-l1',[],clips[0].start+0.5),clips[0].clip);
 assert.equal(toeflPlayingClip('toefl-03','toefl-l1',[],clips[2].start+1),clips[2].clip);
 assert.equal(toeflPlayingClip('toefl-03','toefl-l1',[],clips[2].start+clips[2].seconds+10),undefined);
 const upper=toeflListening('toefl-03','toefl-l2',['toefl03-l2u-33']);
 assert.equal(toeflPlayingClip('toefl-03','toefl-l2',['toefl03-l2u-33'],1),upper[0].clip);
 assert.ok(upper[0].clip.includes('upper'));
 const repeat=toeflSpeaking('toefl-03','toefl-s-repeat-2');
 assert.equal(toeflPlayingClip('toefl-03','toefl-s-repeat-2',[],1),repeat.clip);
 assert.equal(toeflPlayingClip('toefl-03','toefl-s-repeat-2',[],repeat.seconds+6),undefined);
 assert.equal(toeflPlayingClip('toefl-03','toefl-r1',[],1),undefined);
});

test('a full key earns 50 Reading and 47 Listening on the Upper routes; an empty sitting earns 0 on the Lower routes',()=>{
 const full=sit('toefl-06',question=>keyFor(question));
 assert.deepEqual(full.routes,{'toefl-r2':'higher','toefl-l2':'higher'});
 const report=makeReport(full);const section=title=>report.sections.find(item=>item.title===title);
 assert.deepEqual([section('Reading').correct,section('Reading').total,section('Listening').correct,section('Listening').total],[50,50,47,47]);
 assert.deepEqual([section('Writing').correct,section('Writing').total,section('Writing').pending,section('Speaking').pending],[10,10,2,11]);
 const empty=sit('toefl-06',()=> '');
 assert.deepEqual(empty.routes,{'toefl-r2':'lower','toefl-l2':'lower'});
 assert.equal(makeReport(empty).points.earned,0);
});

test('practice lists both routes, keeps keys server-side and shows transcripts after a check',()=>{
 const source=mockPractice(findExam('toefl-07'));
 assert.equal(source.form.subject,'toefl');assert.equal(source.form.questions.length,150);
 assert.deepEqual(source.form.sections.filter(section=>section.kind==='speaking').map(section=>source.form.questions.filter(question=>question.section===section.id).length),[7,4]);
 assert.equal(source.form.questions.find(question=>question.id==='toefl07-s-03').toefl.clip,'speaking-03-repeat');
 assert.ok(source.form.sections.some(section=>section.title.startsWith('Reading 2 Upper')));
 const text=JSON.stringify(source.form);
 for(const question of allQuestions(findExam('toefl-07')).filter(item=>item.listening))assert.ok(!text.includes(question.listening.script.split('\n')[0].replace(/^[A-Za-z]+: /,'').slice(0,40)),question.id);
 const gap=source.form.questions.find(question=>question.toefl?.gap);
 assert.ok(gap.toeflGroup.segments.some(part=>typeof part==='object'&&part.prefix));
 const listening=source.form.questions.find(question=>question.id==='toefl07-l1-13');
 const reveal=source.reveal(listening.id,source.grade(listening.id,''));
 assert.ok(reveal.transcript.length>40);assert.ok(listening.options.includes(reveal.answerValue));
});

test('Basic and Pro plans open TOEFL; the workspace and review lists know the programme',()=>{
 for(const plan of subscriptionPlans.filter(item=>item.program.startsWith('language')))assert.ok(planCovers(plan,'toefl'),plan.program);
 assert.ok(!planCovers(subscriptionPlans.find(item=>item.program==='entrance'),'toefl'));
 assert.equal(programOf('toefl-03'),'toefl');
});
