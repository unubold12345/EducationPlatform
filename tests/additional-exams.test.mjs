import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,statSync } from "node:fs";
import { createHash } from "node:crypto";
import { examDefinitions,findExam } from "../src/modules/exams/definitions.ts";
import { additionalListening } from "../src/modules/exams/ielts-additional-listening.ts";
import { additionalMath } from "../src/modules/exams/sat-additional.ts";
import { listeningFile } from "../src/modules/exams/audio-files.ts";
import { createExamState,stageFor,expireStages,editExam,validateExamEdit,makeReport,isCorrect } from "../src/modules/exams/engine.ts";

const papers=[2,3,4,5,6];
const slug=(program,n)=>`${program==='sat'?'sat-full':'ielts-academic'}-${String(n).padStart(2,'0')}`;

test("six distinct full mocks per program preserve existing slugs and timing",()=>{
  assert.equal(examDefinitions.length,12);
  assert.equal(new Set(examDefinitions.map(e=>e.slug)).size,12);
  for(const program of ['sat','ielts']){
    assert.equal(examDefinitions.filter(e=>e.program===program).length,6);
    const original=findExam(slug(program,1));
    for(const n of papers){
      const exam=findExam(slug(program,n));assert.ok(exam);assert.equal(exam.version,1);
      assert.deepEqual(exam.stages.map(s=>[s.id,s.seconds,s.kind]),original.stages.map(s=>[s.id,s.seconds,s.kind]));
      assert.notEqual(exam.stages[0].questions[0].id,original.stages[0].questions[0].id);
      assert.notEqual(exam.stages[0].questions[0].prompt+exam.stages[0].questions[0].passage,original.stages[0].questions[0].prompt+original.stages[0].questions[0].passage);
    }
  }
});

test("new SAT banks have 147 distinct IDs per form, valid options, numeric keys and all four domains",()=>{
  const ids=new Set();
  for(const n of papers){
    const exam=findExam(slug('sat',n));
    const rw=[exam.stages[0].questions,...Object.values(exam.stages[1].variants)];
    const math=[exam.stages[3].questions,...Object.values(exam.stages[4].variants)];
    for(const bank of rw){assert.equal(bank.length,27);assert.equal(new Set(bank.map(q=>q.domain)).size,4);}
    for(const [i,bank] of math.entries()){assert.equal(bank.length,22);assert.equal(new Set(bank.map(q=>q.domain)).size,4);assert.equal(bank.filter(q=>q.kind==='number').length,i===0?5:6);}
    for(const bank of [...rw,...math]){
      assert.equal(bank.filter(q=>q.pretest).length,2);
      for(const q of bank){
        assert.ok(!ids.has(q.id),q.id);ids.add(q.id);
        assert.equal(q.answers.length,1);assert.ok(q.explanation.trim());
        assert.equal(isCorrect(q,q.answers[0]),true,q.id);
        if(q.options){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4,q.id);assert.ok(q.options.includes(q.answers[0]));}
      }
    }
  }
  assert.equal(ids.size,735);
});

test("new SAT numeric answers agree with independent arithmetic and reject extraneous radical roots",()=>{
  for(const p of papers)for(const [route,r] of [['lower',0],['first',1],['higher',2]]){
    const qs=additionalMath(p,route),a=p*3+r+2,b=a+3;
    const expected=route==='higher'?{3:b,7:a+b,12:2*a-1,17:a/(a+b),20:4*p,21:8*a}:{3:p+r+2,7:b+2*p,12:((2*p+1)**2-1)/2,17:a/(a+b),20:4*p,21:2*(a+b)};
    for(const [i,value] of Object.entries(expected))assert.equal(isCorrect(qs[i],String(value)),true,`${p}/${route}/${i}`);
    if(route==='higher'){
      const root=Number(qs[12].answers[0]);assert.equal(Math.sqrt(root+(a-1)**2),root-(a-1));assert.equal(isCorrect(qs[12],'0'),false);
      const k=Number(qs[0].answers[0]);assert.equal(k,6);assert.notEqual(19,2*8);
    }
  }
});

test("every additional SAT form completes both routes with exactly 98 reviews and 90 operational marks",()=>{
  for(const p of papers)for(const route of ['lower','higher']){
    const state=createExamState(findExam(slug('sat',p)),0);
    while(!state.finishedAt){
      const stage=stageFor(state);
      // Lower routing is selected by blank first modules; score totals below reflect that.
      const skip=route==='lower'&&(stage.id==='sat-rw-1'||stage.id==='sat-math-1');
      const responses=skip?{}:Object.fromEntries(stage.questions.map(q=>[q.id,q.answers[0]]));
      const input={revision:0,stageId:stage.id,responses,flags:[]};assert.ok(validateExamEdit(state,input));editExam(state,input);
      expireStages(state,Date.parse(state.deadline));
    }
    assert.equal(state.routes['sat-rw-2'],route);assert.equal(state.routes['sat-math-2'],route);
    const report=makeReport(state);assert.equal(report.reviews.length,98);assert.equal(report.reviews.filter(q=>q.pretest).length,8);
    assert.deepEqual(report.sections.map(s=>s.total),[50,40]);
    assert.deepEqual(report.sections.map(s=>s.correct),route==='higher'?[50,40]:[25,20]);
    assert.equal(Date.parse(state.finishedAt),8640000);
  }
});

test("new IELTS forms have distinct full-length readings, evidence-based completions and 40+40 scored items",()=>{
  const texts=new Set(),writing=new Set(),cues=new Set();
  for(const p of papers){
    const e=findExam(slug('ielts',p)),[listen,check,read,write,,prep,long]=e.stages;
    assert.equal(listen.questions.length,40);assert.deepEqual(listen.questions,check.questions);assert.equal(read.questions.length,40);
    assert.equal(read.passages.length,3);
    const words=read.passages.reduce((n,p)=>n+p.text.split(/\s+/).length,0);assert.ok(words>=2150&&words<=2750,`${e.slug}: ${words}`);
    for(const passage of read.passages){assert.ok(!texts.has(passage.text));texts.add(passage.text);}
    for(const q of read.questions){
      const text=read.passages.find(p=>p.title===q.passage)?.text;assert.ok(text,q.id);
      if(q.kind==='short'){assert.equal(q.maxWords,1);assert.ok(new RegExp(`\\b${q.answers[0]}\\b`,'i').test(text),`${q.id}: ${q.answers[0]}`);}
      assert.equal(isCorrect(q,q.answers[0]),true,q.id);
      if(q.options){assert.equal(new Set(q.options).size,q.options.length,q.id);assert.ok(q.options.includes(q.answers[0]));}
    }
    assert.deepEqual(write.questions.map(q=>q.minWords),[150,250]);
    for(const q of write.questions){assert.ok(!writing.has(q.prompt));writing.add(q.prompt);}
    assert.equal(prep.questions[0].prompt,long.questions[0].prompt);assert.ok(!cues.has(long.questions[0].prompt));cues.add(long.questions[0].prompt);
    const state=createExamState(e,0);
    while(!state.finishedAt){for(const q of stageFor(state).questions)if(q.answers.length)state.responses[q.id]=q.answers[0];expireStages(state,Date.parse(state.deadline));}
    const report=makeReport(state);assert.deepEqual(report.sections.map(s=>[s.correct,s.total,s.pending]),[[40,40,0],[40,40,0],[0,0,2],[0,0,12]]);
  }
  assert.equal(texts.size,15);assert.equal(writing.size,10);assert.equal(cues.size,5);
});

test("new Listening recordings match their own scripts, file hashes and 30-minute timeline",()=>{
  const hashes=new Set();
  for(const p of papers){
    const number=String(p).padStart(2,'0'),{questions,scripts}=additionalListening(p);
    const manifest=JSON.parse(readFileSync(new URL(`../assets/exams/manifest-${number}.json`,import.meta.url),'utf8').replace(/^\uFEFF/,''));
    assert.equal(manifest.scriptsSha256,createHash('sha256').update(JSON.stringify(scripts)).digest('hex'));assert.equal(manifest.parts.length,4);
    for(const [index,part] of manifest.parts.entries()){
      assert.equal(part.part,index+1);assert.ok(Math.abs(part.seconds-450)<0.2);
      const file=new URL(`../assets/exams/${listeningFile(slug('ielts',p),part.part)}`,import.meta.url),bytes=readFileSync(file);
      assert.equal(statSync(file).size,part.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),part.sha256);
      assert.ok(!hashes.has(part.sha256));hashes.add(part.sha256);
      const text=scripts[index].halves.flat().map(t=>t.text).join(' ').toLowerCase();
      for(const q of questions.slice(index*10,index*10+10))assert.ok(text.includes(q.answers[0].toLowerCase()),q.id);
    }
  }
  assert.equal(hashes.size,20);
  assert.equal(listeningFile('ielts-academic-01',1),'ielts-01-part-1.mp3');
  for(const s of ['../ielts-academic-02','sat-full-02','ielts-academic-07','__proto__','ielts-academic-02/..'])assert.equal(listeningFile(s,1),undefined);
  for(const n of [0,5,1.5,NaN])assert.equal(listeningFile('ielts-academic-02',n),undefined);
});
