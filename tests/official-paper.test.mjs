import test from "node:test";
import assert from "node:assert/strict";
import { officialPaper,officialPapers,findOfficialPaper,paperSlots } from "../src/modules/papers/catalog.ts";
import { officialKey,officialKeys } from "../src/modules/papers/key.ts";
import { gradePaper,validPaperResponses } from "../src/modules/papers/engine.ts";
test("official 2020 A paper retains 8 original pages, 100 minutes and the official 72+28 weighting",()=>{
 assert.equal(officialPaper.seconds,6000);assert.equal(officialPaper.pageUrls.length,8);assert.equal(paperSlots.length,40);
 assert.equal(officialKey.choices.length,36);assert.equal(officialKey.choiceMarks.reduce((a,b)=>a+b),72);
 assert.deepEqual(officialKey.choiceMarks,[...Array(11).fill(1),...Array(14).fill(2),...Array(11).fill(3)]);
 assert.deepEqual(officialKey.fills.map(q=>q.digits),["8660834","9544553","5835874","2693423"]);
 assert.equal(officialKey.fills.flatMap(q=>q.groups).reduce((sum,g)=>sum+g.marks,0),28);
});
test("official key gives 100 points and blank answers give zero",()=>{
 const answers=Object.fromEntries([...officialKey.choices.map((a,i)=>[String(i+1),a]),...officialKey.fills.map(q=>[q.id,q.digits])]);
 assert.equal(gradePaper(officialKey,answers).score,100);assert.equal(gradePaper(officialKey,{}).score,0);
 assert.ok(validPaperResponses(answers));
});
test("paired digits are scored as a group and preserve leading zeroes",()=>{
 assert.equal(gradePaper(officialKey,{"2.1":"8660834"}).score,7);
 assert.equal(gradePaper(officialKey,{"2.1":"866_834"}).score,5);
 assert.equal(gradePaper(officialKey,{"2.3":"5835894"}).score,5);
 assert.equal(gradePaper(officialKey,{"2.2":"954455_"}).score,6);
});
test("paper answer validation rejects forged IDs, invalid options and malformed digit cells",()=>{
 for(const value of [null,[],{"0":"A"},{"37":"B"},{"1":"F"},{"2.1":"12345678"},{"2.1":"8 60834"},{"2.5":"1234567"},{"1":1}])assert.equal(validPaperResponses(value),false);
 assert.ok(validPaperResponses({"1":"","36":"E","2.1":"___0___"}));
});

test("all four 2020 variants resolve to distinct source pages and official keys",()=>{
 assert.deepEqual(officialPapers.map(p=>p.variant),["A","B","C","D"]);
 for(const paper of officialPapers){
  assert.equal(findOfficialPaper(paper.slug),paper);
  assert.equal(paper.seconds,6000);assert.equal(paper.pageUrls.length,8);
  assert.ok(paper.pageUrls.every((url,i)=>url.endsWith(`/2020/mat/${paper.variant}/${i+1}.jpg`)));
  const key=officialKeys[paper.variant];
  assert.equal(key.choices.length,36);
  assert.equal(key.choiceMarks.reduce((a,b)=>a+b),72);
  assert.equal(key.fills.flatMap(q=>q.groups).reduce((sum,g)=>sum+g.marks,0),28);
  const answers=Object.fromEntries([...key.choices.map((a,i)=>[String(i+1),a]),...key.fills.map(q=>[q.id,q.digits])]);
  assert.equal(gradePaper(key,answers).score,100);
  assert.equal(gradePaper(key,{}).score,0);
  assert.equal(key.version,`eec-2020-${paper.variant}-key-v1`);
 }
 assert.equal(findOfficialPaper("eec-math-2020-e"),undefined);
 assert.equal(findOfficialPaper("eec-math-2020"),undefined);
});
test("variant-specific official digits and paired marks do not reuse A's key",()=>{
 assert.deepEqual(officialKeys.B.fills.map(q=>q.digits),["8644828","9544555","4035827","2693633"]);
 assert.deepEqual(officialKeys.C.fills.map(q=>q.digits),["8660834","9544555","5835874","2693633"]);
 assert.deepEqual(officialKeys.D.fills.map(q=>q.digits),["8644828","9544553","4035827","2693423"]);
 for(const variant of ["B","D"]){
  assert.equal(gradePaper(officialKeys[variant],{"2.1":"864_828"}).score,6);
  assert.equal(gradePaper(officialKeys[variant],{"2.3":"40358_7"}).score,5);
 }
 assert.equal(gradePaper(officialKeys.C,{"2.1":"866_834"}).score,5);
 const aAnswers=Object.fromEntries([...officialKey.choices.map((a,i)=>[String(i+1),a]),...officialKey.fills.map(q=>[q.id,q.digits])]);
 for(const variant of ["B","C","D"])assert.ok(gradePaper(officialKeys[variant],aAnswers).score<100);
});
