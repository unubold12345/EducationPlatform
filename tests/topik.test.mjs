import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { findExam, allExamSlugs, examDefinitions } from '../src/modules/exams/definitions.ts';
import { topikMocks, topikLevel, topikGrade, TOPIK_LEVELS } from '../src/modules/exams/topik/catalog.ts';
import { topikChoices, topikDescription } from '../src/modules/exams/topik/describe.ts';
import { createExamState, expireStages, makeReport, stageFor, validateExamEdit, editExam } from '../src/modules/exams/engine.ts';
import { mockPractice } from '../src/modules/exam-practice/form.ts';
import { audioSetOf, listeningFile, listeningParts, topikQuestionAudio, topikPlayingItem } from '../src/modules/exams/audio-files.ts';
import { validateContentShape, validateAnswerKeys } from '../src/modules/content/validation.ts';
import { subscriptionPlans, planCovers } from '../src/modules/subscriptions/plans.ts';
import { compose, decompose, pronounce, romanize, letterRoman } from '../src/modules/language-decks/hangul.ts';
import { LANGUAGE_DECKS, WORKSHOP_EXAMS } from '../src/modules/language-decks/catalog.ts';
import { deckDrillItems, typedMatches } from '../src/modules/language-decks/drill.ts';
import { buildKanaTest } from '../src/modules/language-decks/kana-test.ts';

const json=path=>JSON.parse(readFileSync(path,'utf8'));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const questions=exam=>exam.stages.flatMap(stage=>stage.questions);
const CIRCLED=['①','②','③','④'];
// The official paper: stages, item counts, minutes and total points per level.
const SHAPE={1:{stages:[['topik-l',30,40],['topik-r',40,60]],total:200},2:{stages:[['topik-l',50,60],['topik-w',4,50],['topik-r',50,70]],total:300}};

test('TOPIK mocks follow the official paper: sections, counts, minutes, points and numbering',()=>{
 assert.ok(topikMocks.length>=2);
 for(const meta of topikMocks){
  const exam=findExam(meta.slug),shape=SHAPE[meta.level];
  assert.ok(allExamSlugs().includes(meta.slug));assert.ok(!examDefinitions.some(item=>item.slug===meta.slug));
  assert.equal(exam.program,'topik');assert.equal(topikLevel(meta.slug),meta.level);
  assert.deepEqual(exam.stages.map(stage=>[stage.id,stage.questions.length,stage.seconds/60]),shape.stages);
  assert.equal(questions(exam).reduce((sum,q)=>sum+q.points,0),shape.total);assert.equal(exam.points??shape.total,shape.total);
  const ids=questions(exam).map(q=>q.id);assert.equal(new Set(ids).size,ids.length);
  assert.ok(validateAnswerKeys(exam),meta.slug);assert.ok(validateContentShape(exam,structuredClone(exam)),meta.slug);
  for(const stage of exam.stages){
   // Listening and Reading restart at 1 on TOPIK Ⅱ; TOPIK Ⅰ Reading continues from 31; Writing is 51–54.
   const first=stage.id==='topik-w'?51:stage.id==='topik-r'&&meta.level===1?31:1;
   assert.deepEqual(stage.questions.map(q=>Number(q.number)),stage.questions.map((_,i)=>first+i),stage.id);
   for(const q of stage.questions){
    assert.ok(q.groupId.startsWith(stage.id+'-'),q.id);
    if(q.kind==='essay'){assert.equal(stage.id,'topik-w');assert.ok(q.answerDisplay&&q.explanation,q.id);continue;}
    assert.deepEqual(q.options,CIRCLED,q.id);assert.ok(CIRCLED.includes(q.answers[0]),q.id);assert.ok(q.answerDisplay.startsWith(q.answers[0]),q.id);
    assert.ok(/[Ѐ-ӿ]/.test(q.explanation),q.id+' explanation in Mongolian');
    if(stage.id==='topik-l')assert.ok(q.listening?.script&&/[가-힣]/.test(q.listening.script),q.id);
   }
  }
  // Answers spread over ①–④ in each choice section.
  for(const stage of exam.stages.filter(item=>item.id!=='topik-w')){
   const counts=CIRCLED.map(mark=>stage.questions.filter(q=>q.answers[0]===mark).length);
   assert.ok(Math.max(...counts)-Math.min(...counts)<=3,`${meta.slug} ${stage.id} ${counts}`);
  }
 }
});

test('TOPIK writing 51–54: two gaps, a 200–300 chart report and a 600–700 essay, worth 10/10/30/50',()=>{
 for(const meta of topikMocks.filter(item=>item.level===2)){
  const writing=findExam(meta.slug).stages.find(stage=>stage.id==='topik-w').questions;
  assert.deepEqual(writing.map(q=>[q.number,q.points,q.kind]),[['51',10,'essay'],['52',10,'essay'],['53',30,'essay'],['54',50,'essay']]);
  assert.deepEqual(writing[0].topik.gaps.length,2);assert.deepEqual(writing[1].topik.gaps.length,2);
  assert.deepEqual(writing[2].topik.chars,[200,300]);assert.ok(writing[2].topik.charts.length>=1);
  assert.deepEqual(writing[3].topik.chars,[600,700]);
  const length=text=>text.replace(/\n/g,'').length;
  assert.ok(length(writing[2].answerDisplay)>=200&&length(writing[2].answerDisplay)<=300,'53 model');
  assert.ok(length(writing[3].answerDisplay)>=600&&length(writing[3].answerDisplay)<=700,'54 model');
 }
});

test('TOPIK snapshots grade by points, leave Writing for self-scoring and keep transcripts for review',()=>{
 for(const meta of topikMocks){
  const exam=findExam(meta.slug),state=createExamState(exam,0);
  while(!state.finishedAt){
   const stage=stageFor(state);
   const responses=Object.fromEntries(stage.questions.map(q=>[q.id,q.kind==='essay'?'저는 이 문제에 대해 생각해 보았다.':q.answers[0]]));
   assert.ok(validateExamEdit(state,{revision:0,stageId:stage.id,responses,flags:[]}));
   if(stage.questions[0].kind==='choice')assert.equal(validateExamEdit(state,{revision:0,stageId:stage.id,responses:{[stage.questions[0].id]:'⑤'},flags:[]}),false);
   editExam(state,{responses,flags:[]});expireStages(state,Date.parse(state.deadline));
  }
  // Every choice item right: 200 on both levels (TOPIK Ⅱ Writing, 100 points, waits for self-scoring).
  const report=makeReport(state);
  assert.equal(report.points.earned,200);
  assert.deepEqual(report.sections.map(section=>section.title.slice(0,2)),meta.level===1?['듣기','읽기']:['듣기','쓰기','읽기']);
  assert.ok(report.reviews.filter(q=>q.groupId.startsWith('topik-l-')).every(q=>q.transcript&&/[가-힣]/.test(q.transcript)));
  assert.ok(report.reviews.filter(q=>!q.groupId.startsWith('topik-l-')).every(q=>!q.transcript));
  assert.ok(report.reviews.every(q=>q.topikGroup),meta.slug);
  assert.equal(makeReport(createExamState(exam,0)).points.earned,0);
 }
 assert.equal(topikGrade(1,79),null);assert.equal(topikGrade(1,80),1);assert.equal(topikGrade(1,140),2);
 assert.equal(topikGrade(2,119),null);assert.deepEqual([120,150,190,230,300].map(score=>topikGrade(2,score)),[3,4,5,6,6]);
 assert.deepEqual(TOPIK_LEVELS[2].map(item=>item.min),[120,150,190,230]);
});

test('TOPIK practice carries the printed paper without keys, models or heard text, and reveals only after a check',()=>{
 for(const meta of topikMocks){
  const exam=findExam(meta.slug),source=mockPractice(exam);
  assert.equal(source.form.subject,'topik');assert.equal(source.form.questions.length,questions(exam).length);
  const listeningPayload=JSON.stringify(source.form.questions.filter(item=>item.section.startsWith('topik-l-')));
  const payload=JSON.stringify(source.form);
  for(const q of questions(exam)){
   const shown=source.form.questions.find(item=>item.id===q.id);
   for(const field of ['answers','answerDisplay','explanation','listening','script'])assert.equal(field in shown,false,field);
   assert.ok(shown.topikGroup,q.id);
   if(q.kind==='essay'){assert.ok(!payload.includes(q.answerDisplay.slice(0,40)),q.id+' leaks its model');continue;}
   const wrong=q.options.find(option=>option!==q.answers[0]);
   assert.equal(source.grade(q.id,wrong).correct,false);
   const result=source.grade(q.id,q.answers[0]);assert.equal(result.correct,true);assert.equal(source.reveal(q.id,result).answerValue,q.answers[0]);
   const material=source.material(q.id);assert.equal(material.transcript,undefined);
   if(q.listening){
    // No spoken line reaches the page before a check (options may quote short phrases, so lines of 12+ characters).
    for(const line of q.listening.script.split('\n').map(text=>text.replace(/^(남자|여자): /,'')).filter(text=>text.length>=12))
     assert.ok(!listeningPayload.includes(line),q.id+' leaks '+line);
    assert.equal(source.reveal(q.id,result).transcript,q.listening.script);assert.equal(shown.audioPart,q.listening.part);
   }
   // The assistant sees the printed choices, never the bare circled marks.
   if(q.topik?.choices)assert.ok(material.options.every((option,i)=>option.startsWith(CIRCLED[i]+' ')),q.id);
  }
 }
 assert.equal(topikDescription({}),'');assert.equal(topikChoices({}),undefined);
});

test('TOPIK pictures are 480×360 drawings with no words, and every picture item has its four files',()=>{
 for(const meta of topikMocks){
  const dir=`public/exam-assets/topik/${meta.slug}`;
  const exam=findExam(meta.slug);
  for(const q of questions(exam).filter(item=>item.topik?.pictures)){
   assert.equal(q.topik.pictures.length,4,q.id);
   for(const picture of q.topik.pictures){
    assert.match(picture.src,new RegExp(`^/exam-assets/topik/${meta.slug}/l\\d{2}-[1-4]\\.svg$`));
    const file='public'+picture.src;
    if(!meta.audio&&!existsSync(file))continue; // a form still being drawn is built with --allow-missing-audio
    const body=readFileSync(file,'utf8');
    assert.match(body,/viewBox="0 0 480 360"/);assert.ok(!/<text\b|[가-힣]|<script|href=/i.test(body),file);
   }
  }
  if(existsSync(dir))for(const name of readdirSync(dir))assert.match(name,/^l\d{2}-[1-4]\.svg$/);
 }
});

test('TOPIK listening audio: four parts per mock, own route set, item timings inside each part',()=>{
 const timing=json('src/modules/exams/topik/audio-catalog.json');
 for(const meta of topikMocks.filter(item=>item.audio)){
  const exam=findExam(meta.slug),bounds=meta.level===1?[[1,14],[15,21],[22,26],[27,30]]:[[1,16],[17,30],[31,40],[41,50]];
  assert.equal(audioSetOf(meta.slug,1),'topik');
  const seconds=listeningParts(meta.slug);assert.equal(seconds.length,4);
  assert.ok(seconds.reduce((sum,value)=>sum+value,0)<=exam.stages[0].seconds-60);
  const manifest=json(`assets/topik-audio/${meta.slug}-audio.json`);assert.equal(manifest.humanListeningReview,false);
  manifest.parts.forEach((part,index)=>{
   assert.equal(listeningFile(meta.slug,index+1),`${meta.slug}-part-${index+1}.mp3`);
   assert.equal(hash(`assets/topik-audio/${part.file}`),part.sha256,part.file);
   assert.ok(Math.abs(part.seconds-seconds[index])<0.01);
  });
  for(const q of exam.stages[0].questions){
   const n=Number(q.number),part=bounds.findIndex(([from,to])=>n>=from&&n<=to)+1;
   assert.equal(q.listening.part,part,q.id);
   const at=topikQuestionAudio(meta.slug,q.id);assert.equal(at.part,part);assert.ok(at.start<at.end&&at.end<=seconds[part-1]+0.01,q.id);
   // The page follows the recording: halfway through an item, the item playing is this one (or its set partner).
   assert.equal(topikQuestionAudio(meta.slug,topikPlayingItem(meta.slug,part,(at.start+at.end)/2)).start,at.start,q.id);
  }
  assert.deepEqual(Object.keys(timing[meta.slug].questions).sort(),exam.stages[0].questions.map(q=>q.id).sort());
 }
});

test('TOPIK stays out of the offline pack and deployment, and is sold with Гадаад хэл Basic and Pro',()=>{
 const ignore=readFileSync('.vercelignore','utf8');assert.match(ignore,/^MockExmps\/TOPIK\/$/m);assert.match(ignore,/^assets\/topik-audio\/voices\/$/m);
 for(const meta of topikMocks)assert.ok(!JSON.stringify(meta).match(/answer|script/i));
 for(const program of ['language_basic','language'])assert.ok(planCovers(subscriptionPlans.find(plan=>plan.program===program),'topik'),program);
});

test('Hangul: composition and a pronunciation-based romanization in Revised Romanization letters',()=>{
 assert.deepEqual(decompose('한'),{initial:'ㅎ',vowel:'ㅏ',final:'ㄴ'});assert.equal(compose({initial:'ㄱ',vowel:'ㅡ',final:'ㄹ'}),'글');
 const cases={'한국어':'hangugeo','읽어요':'ilgeoyo','같이':'gachi','합니다':'hamnida','좋아요':'joayo','많이':'mani','없어요':'eopseoyo','여덟':'yeodeol',
  '밟다':'bapda','먹는':'meongneun','독립':'dongnip','설날':'seollal','신라':'silla','축하':'chuka','좋습니다':'josseumnida','읽다':'ikda','종로':'jongno',
  '의사':'uisa','라면':'ramyeon','감사합니다':'gamsahamnida','안녕하세요':'annyeonghaseyo','학교':'hakgyo','몇 시예요?':'myeot siyeyo?'};
 for(const [word,roman] of Object.entries(cases))assert.equal(romanize(word),roman,word);
 assert.equal(pronounce('한국어'),'한구거');assert.equal(pronounce('합니다'),'함니다');assert.equal(pronounce('좋아요'),'조아요');
 assert.deepEqual(['ㄱ','ㄹ','ㅇ','ㅋ','ㅏ'].map(letterRoman),['g / k','r / l','– / ng','k','a']);
});

test('TOPIK Workshop: its own tab, a Hangul chart test and word decks with romanization',()=>{
 assert.deepEqual(WORKSHOP_EXAMS.map(exam=>exam.id),['ielts','jlpt','hsk','topik']);
 assert.deepEqual(LANGUAGE_DECKS.filter(deck=>deck.exam==='topik').map(deck=>[deck.id,deck.kind]),[['topik-1','words'],['topik-2','words'],['hangul','hangul']]);
 const hangul=json('assets/language-decks/hangul.json');
 assert.equal(hangul.lessons.length,21);assert.equal(hangul.lessons.flatMap(lesson=>lesson.words).length,208);
 for(const lesson of hangul.lessons){
  const meanings=lesson.words.map(word=>word.meaning);assert.equal(new Set(meanings).size,meanings.length,lesson.id);
  for(const word of lesson.words){assert.equal(word.meaning,romanize(word.term));assert.match(word.id,/^[0-9a-f]{10}$/);}
 }
 // The Hangul test is the Kana test: every syllable once, four distinct romanizations, the right one among them.
 const letters=hangul.lessons.flatMap(lesson=>lesson.words.map(word=>({id:word.id,deckId:'hangul',kana:word.term,romaji:word.answers[0],row:lesson.id,section:'basic'})));
 let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const questions=buildKanaTest(letters,'all',letters,random);
 assert.equal(questions.length,208);assert.equal(new Set(questions.map(question=>question.letter.id)).size,208);
 for(const question of questions){assert.equal(question.options.length,4);assert.equal(new Set(question.options).size,4);assert.equal(question.options[question.answer],romanize(question.letter.kana));}
 for(const id of ['topik-1','topik-2']){
  const path=`assets/language-decks/${id}.json`;if(!existsSync(path))continue;
  const deck=json(path),words=deck.lessons.flatMap(lesson=>lesson.words);
  assert.ok(words.length>=450,id);assert.equal(new Set(words.map(word=>word.term)).size,words.length);
  // A few words are romanized from a respelling (`sounds` in the draft) where the rules miss the dictionary
  // pronunciation (닭고기 [닥꼬기] → dakgogi, not dalgogi); the respelling applies to their example too.
  const respelled=words.filter(word=>word.reading!==romanize(word.term));
  assert.ok(respelled.length<=10&&respelled.every(word=>word.pronunciation&&word.exampleReading!==romanize(word.example)),id);
  if(id==='topik-1')assert.equal(words.find(word=>word.term==='닭고기')?.reading,'dakgogi');
  for(const word of words){
   assert.match(word.term,/^[가-힣 ]+$/);assert.match(word.reading,/^[a-z]+( [a-z]+)*$/);assert.match(word.meaning,/[Ѐ-ӿ]/);
   if(!respelled.includes(word))assert.equal(word.exampleReading,romanize(word.example));assert.match(word.exampleMeaning,/[Ѐ-ӿ]/);
  }
  const quiz=deckDrillItems({...LANGUAGE_DECKS.find(deck=>deck.id===id),...deck},{});
  assert.ok(quiz.every(item=>typedMatches(item.term,item.typed)&&typedMatches(item.reading,item.typed)));
 }
});
