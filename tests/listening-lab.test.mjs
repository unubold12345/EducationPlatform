import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {listeningDrills,numberedQuestions,totalMarks,recordingLines,evidenceOf,gapCorrect,questionMarks,questionCorrect,normalizeListeningAnswer} from "../src/modules/listening-lab/drills.ts";
import {drillAudioKey} from "../src/modules/listening-lab/audio-key.ts";

const timings=JSON.parse(readFileSync(new URL("../src/modules/listening-lab/timings.json",import.meta.url),"utf8"));

test("two full tests: Parts 1–4 each, 10 marks per part, numbered like IELTS",()=>{
 assert.equal(new Set(listeningDrills.map(d=>d.id)).size,listeningDrills.length);
 for(const t of [1,2])assert.deepEqual(listeningDrills.filter(d=>d.test===t).map(d=>d.part),[1,2,3,4]);
 for(const drill of listeningDrills){
  assert.equal(totalMarks(drill),10,drill.id);
  const items=numberedQuestions(drill),start=(drill.part-1)*10+1;
  assert.equal(items[0].number,start);assert.equal(items.at(-1).number+items.at(-1).marks-1,start+9);
  const lines=recordingLines(drill);
  assert.match(lines[0].text,new RegExp(`^Part ${drill.part}\\. .*questions ${start} to ${start+4}\\.$`));
  assert.ok(lines.some(l=>l.text===`Now look at questions ${start+5} to ${start+9}.`),drill.id);
  assert.match(lines.at(-1).text,/You now have time to check your answers\.$/);
 }
});

test("every recording is current and has a start time for each transcript line",()=>{
 for(const drill of listeningDrills){
  const timing=timings[drill.id],lines=recordingLines(drill);
  assert.ok(timing,`${drill.id}: run scripts/generate-listening-lab-audio.py`);
  assert.equal(timing.key,drillAudioKey(drill),`${drill.id}: script changed; regenerate its audio`);
  assert.equal(timing.starts.length,lines.length);
  assert.ok(timing.starts.every((s,i)=>i===0||s>timing.starts[i-1])&&timing.duration>timing.starts.at(-1));
  assert.ok(existsSync(new URL(`../public/listening-lab/${drill.id}.mp3`,import.meta.url)));
 }
});

test("each question is answerable and its evidence appears once in the conversation",()=>{
 for(const drill of listeningDrills){
  const transcript=drill.halves.flat().map(l=>l.text);
  for(const {question,group} of numberedQuestions(drill)){
   for(const e of evidenceOf(question))assert.equal(transcript.filter(t=>t.includes(e)).length,1,`${drill.id}: evidence "${e}"`);
   if(question.kind==="gap"){assert.equal(question.prompt.split("______").length,2,question.prompt);assert.ok(question.answers.every(a=>gapCorrect(question,a)));}
   if(question.kind==="choice")assert.ok(question.options.length===3&&question.answer>=0&&question.answer<3);
   if(question.kind==="match")assert.ok(group.options.length>group.questions.length&&question.answer<group.options.length);
   if(question.kind==="two")assert.ok(question.options.length===5&&question.answers[0]!==question.answers[1]);
  }
  const matches=drill.groups.filter(g=>g.options);
  for(const g of matches)assert.equal(new Set(g.questions.map(q=>q.answer)).size,g.questions.length,`${drill.id}: matching answers repeat`);
 }
});

test("answers ignore case, spacing and symbols; choose-TWO scores each letter",()=>{
 const cottage=numberedQuestions(listeningDrills.find(d=>d.id==="t1-cottage")).map(q=>q.question);
 assert.equal(normalizeListeningAnswer(" Text  Message. "),"textmessage");
 assert.ok(gapCorrect(cottage[0],"ellingham")&&gapCorrect(cottage[2],"9th")&&gapCorrect(cottage[6],"£720")&&gapCorrect(cottage[8],"20%")&&gapCorrect(cottage[9],"Text message"));
 for(const [q,wrong] of [[cottage[0],"Elingham"],[cottage[2],"2nd"],[cottage[6],"850"],[cottage[3],""]])assert.equal(gapCorrect(q,wrong),false,wrong);
 const two=numberedQuestions(listeningDrills.find(d=>d.id==="t2-language-app")).find(q=>q.question.kind==="two").question;
 assert.equal(questionMarks(two,[3,2]),2);assert.equal(questionMarks(two,[2,0]),1);assert.equal(questionMarks(two,[2,2]),1);assert.equal(questionMarks(two,undefined),0);
 assert.ok(questionCorrect(two,[2,3]));assert.equal(questionCorrect(two,[2]),false);
 const choice=cottage.find(q=>q.kind==="choice")??numberedQuestions(listeningDrills[1])[0].question;
 assert.equal(questionCorrect(choice,String(choice.answer)),false);
});

test("mock listening prompts show their title and instruction once per part",async()=>{
 const {splitListeningPrompt,listeningPartInfo}=await import("../src/modules/exams/listening-prompt.ts");
 assert.deepEqual(splitListeningPrompt("Part 1 · Joining a photography course\nParticipant's surname: Complete the notes. Write NO MORE THAN TWO WORDS AND/OR A NUMBER."),
  {title:"Joining a photography course",text:"Participant's surname",instruction:"Complete the notes. Write NO MORE THAN TWO WORDS AND/OR A NUMBER."});
 assert.deepEqual(splitListeningPrompt("Part 3 · A study\nWhy did they change: Choose ONE answer."),{title:"A study",text:"Why did they change",instruction:"Choose ONE answer."});
 assert.deepEqual(splitListeningPrompt("Class day (ONE WORD)"),{title:null,text:"Class day (ONE WORD)",instruction:null});
 assert.deepEqual(splitListeningPrompt("Recommended public car park: the ____ car park (ONE WORD)"),{title:null,text:"Recommended public car park: the ____ car park (ONE WORD)",instruction:null});
 const info=listeningPartInfo(["Part 2 · Tour\nA: Complete the notes. Write ONE.","Part 2 · Tour\nB: Choose ONE answer.","Part 2 · Tour\nC: Choose ONE answer."]);
 assert.equal(info.title,"Tour");assert.deepEqual(info.instructions,["Complete the notes. Write ONE.","Choose ONE answer."]);
});
