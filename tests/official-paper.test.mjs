import test from "node:test";
import assert from "node:assert/strict";
import { officialPaper,paperSlots } from "../src/modules/papers/catalog.ts";
import { officialKey } from "../src/modules/papers/key.ts";
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
