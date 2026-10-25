import test from "node:test";
import assert from "node:assert/strict";
import {englishExams} from "../src/modules/papers/english-exams.ts";
import {findOfficialPaper,slotsForPaper} from "../src/modules/papers/catalog.ts";
import {keyForPaper} from "../src/modules/papers/key.ts";
import {gradePaper,validPaperResponses} from "../src/modules/papers/engine.ts";

test("all 37 English variants have their own timed paper, complete answer layout and private key",()=>{
 assert.equal(englishExams.length,37);
 for(const paper of englishExams){
  assert.equal(findOfficialPaper(paper.slug),paper);assert.equal(paper.seconds,4800);
  const key=keyForPaper(paper),slots=slotsForPaper(paper);
  assert.equal(slots.filter(s=>s.kind==="choice").length,key.choices.length);
  assert.equal(slots.filter(s=>s.kind==="digits").length,key.fills.length);
  for(const fill of key.fills)assert.equal(slots.find(s=>s.id===fill.id).length,fill.digits.length);
  assert.ok(!JSON.stringify(paper).includes(key.version));
  const perfect=Object.fromEntries([...key.choices.map((a,i)=>[String(i+1),a]),...key.fills.map(f=>[f.id,f.digits])]);
  assert.ok(validPaperResponses(perfect,key));assert.equal(gradePaper(key,perfect).score,paper.totalMarks);
  assert.equal(gradePaper(key,{}).score,0);assert.equal(gradePaper(key,perfect).total,paper.totalMarks);
  assert.equal(validPaperResponses({[String(key.choices.length+1)]:"A"},key),false);
  assert.equal(validPaperResponses({"01":"A"},key),false);
  assert.equal(validPaperResponses({"1":"F"},key),false);
  for(const fill of key.fills)assert.equal(validPaperResponses({[fill.id]:"1".repeat(fill.digits.length+1)},key),false);
 }
});
test("English layouts preserve changing historical question counts and cell counts",()=>{
 const expected={2006:[60,[]],2007:[58,[7,7]],2008:[62,[4,3,3]],2009:[56,[4,5,5]],2010:[37,[5,3,5]],2011:[42,[7,5]],2018:[46,[5,5,5,5]],2019:[46,[5,5,5,5]],2020:[46,[5,5,5,5]]};
 for(const paper of englishExams){const key=keyForPaper(paper);assert.equal(key.choices.length,expected[paper.year][0]);assert.deepEqual(key.fills.map(f=>f.digits.length),expected[paper.year][1]);}
});
test("English partial credit uses its own key and never Mathematics digit grouping",()=>{
 const a=findOfficialPaper("eec-english-2020-a"),b=findOfficialPaper("eec-english-2020-b");
 assert.equal(gradePaper(keyForPaper(a),{"2.1":"36147"}).score,5);
 assert.equal(gradePaper(keyForPaper(a),{"2.1":"_6147"}).score,4);
 assert.ok(gradePaper(keyForPaper(b),{"2.1":"36147"}).score<5);
 const legacy=findOfficialPaper("eec-english-2010-a");assert.equal(gradePaper(keyForPaper(legacy),{"2.2":"314"}).score,3);
 assert.equal(gradePaper(keyForPaper(legacy),{}).total,50);
 assert.match(legacy.scoringNote,/албан жинлэсэн оноо биш/);
});
test("ambiguous printed 2020 D 2.3e receives no invented answer or mark",()=>{
 const paper=findOfficialPaper("eec-english-2020-d"),key=keyForPaper(paper);
 assert.equal(paper.totalMarks,99);assert.match(paper.scoringNote,/e17/);
 assert.equal(gradePaper(key,{"2.3":"26411"}).score,4);
 assert.equal(gradePaper(key,{"2.3":"26417"}).score,4);
 assert.equal(key.fills[2].digits,"2641_");
});

test("missing 2019 listening recording cannot lower the written-paper score",()=>{
 for(const paper of englishExams.filter(p=>p.year===2019)){
  const key=keyForPaper(paper);assert.deepEqual(key.choiceMarks.slice(40),Array(6).fill(0));
  assert.equal(paper.totalMarks,88);assert.match(paper.scoringNote,/41–46/);
  assert.equal(gradePaper(key,Object.fromEntries(key.choices.slice(40).map((a,i)=>[String(41+i),a]))).score,0);
 }
});
