import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {regionalPapers} from "../src/modules/papers/regional.ts";
import {findOfficialPaper} from "../src/modules/papers/catalog.ts";
import {keyForPaper} from "../src/modules/papers/key.ts";
import {gradePaper,validPaperResponses} from "../src/modules/papers/engine.ts";
const manifest=JSON.parse(readFileSync(new URL('../assets/papers/dornod-2026.json',import.meta.url),'utf8'));
test('both 2026 regional exams have source-specific counts, timing, keys and 100-point reports',()=>{
 assert.equal(regionalPapers.length,2);
 for(const p of regionalPapers){
  const math=p.subject==='math',key=keyForPaper(p);assert.equal(findOfficialPaper(p.slug),p);
  assert.equal(p.seconds,math?6000:4800);assert.equal(key.choices.length,math?36:47);
  assert.equal(key.choiceMarks.reduce((a,b)=>a+b),math?72:80);
  assert.deepEqual(key.fills.map(f=>f.digits.length),math?[7,8,8,7]:[8,8,4]);
  const responses=Object.fromEntries([...key.choices.map((a,i)=>[String(i+1),a]),...key.fills.map(f=>[f.id,f.digits])]);
  assert.ok(validPaperResponses(responses,key));assert.equal(gradePaper(key,responses).score,100);
  assert.equal(gradePaper(key,{}).total,100);assert.equal(gradePaper(key,{}).score,0);
  assert.ok(!JSON.stringify(p).includes(key.version));assert.equal(p.publisher,'Дорнод аймгийн Боловсролын газар');
 }
});
test('regional key transcription preserves source weights, eight-cell responses and Math all-or-nothing policy',()=>{
 const math=keyForPaper(regionalPapers[0]),eng=keyForPaper(regionalPapers[1]);
 assert.deepEqual(math.choiceMarks,[...Array(8).fill(1),...Array(20).fill(2),...Array(8).fill(3)]);
 assert.equal(math.choices.join(''),'ADECBDE CDED CDAA ADCADCEADCBD DDED AADC B'.replaceAll(' ',''));
 assert.equal(gradePaper(math,{'2.2':'12212243'}).score,7);assert.equal(gradePaper(math,{'2.2':'1221224_'}).score,0);
 assert.equal(gradePaper(eng,{'2.1':'41423214'}).score,8);assert.equal(gradePaper(eng,{'2.1':'4142321_'}).score,7);
 assert.ok(validPaperResponses({'2.1':'41423214'},eng));assert.equal(validPaperResponses({'2.1':'414232141'},eng),false);
 assert.equal(eng.choices[46],'D');assert.equal(eng.choiceMarks[33],1);assert.equal(eng.choiceMarks[35],2);
});
test('all regional student/key images and retained PDFs match reviewed provenance hashes',()=>{
 assert.equal(manifest.files.length,33);
 for(const file of manifest.files){const bytes=readFileSync(new URL('../public'+file.url,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);assert.equal(bytes.readUInt16BE(0),0xffd8);}
 for(const paper of manifest.papers){
  const bytes=readFileSync(new URL('../assets/papers/dornod-2026-originals/'+paper.subject+'.pdf',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),paper.originalSha256);
  assert.ok(paper.pages.every(url=>!paper.keyPages.includes(url)));
 }
 const mathPages=manifest.files.filter(f=>f.url.includes('/math/')&&!f.url.includes('/key/'));
 assert.equal(mathPages.length,9);assert.ok(mathPages.every(p=>p.clip[2]<870));
 assert.equal(mathPages.at(-2).clip[2],660);assert.equal(mathPages.at(-1).clip[2],610);
});
