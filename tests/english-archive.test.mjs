import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const archive=JSON.parse(readFileSync(new URL("../assets/papers/english-archive.json",import.meta.url),"utf8"));
const expected={2006:"ABCDE",2007:"ABC",2008:"BCDEF",2009:"BDHI",2010:"ABCD",2011:"ABCD",2018:"ABCD",2019:"ABCD",2020:"ABCD"};
test("English archive includes every reviewed variation only with a matching complete answer key",()=>{
 assert.equal(archive.papers.length,37);
 assert.equal(new Set(archive.papers.map(paper=>paper.slug)).size,37);
 for(const [year,variants] of Object.entries(expected)){
  const papers=archive.papers.filter(paper=>paper.year===Number(year));
  assert.deepEqual(papers.map(paper=>paper.variant),variants.split(""));
  for(const paper of papers){
   assert.ok(paper.pages.length>0&&paper.keyPages.length>0);
   assert.ok(paper.keyVariants.includes(paper.variant));
   assert.ok(paper.sourceUrl&&paper.keySourceUrl);
   assert.equal(paper.slug,`eec-english-${year}-${paper.variant.toLowerCase()}`);
   assert.ok(paper.pages.every(page=>!paper.keyPages.includes(page)));
   for(const url of [...paper.pages,...paper.keyPages])assert.ok(archive.files.some(file=>file.url===url));
  }
 }
 for(const year of archive.excluded.flatMap(item=>item.years))assert.ok(!archive.papers.some(paper=>paper.year===year));
});
test("every English image matches its recorded bytes and original PDF provenance",()=>{
 assert.equal(archive.files.length,218);
 assert.equal(new Set(archive.files.map(file=>file.url)).size,218);
 for(const file of archive.files){
  assert.match(file.url,/^\/exam-assets\/eec-english\/[0-9]{4}\/(?:[A-I]|key)\/[1-9][0-9]*\.jpg$/);
  const bytes=readFileSync(new URL("../public"+file.url,import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"),file.sha256);
  assert.equal(bytes.length,file.bytes);assert.equal(bytes.readUInt16BE(0),0xffd8);
  assert.ok(file.width>=500&&file.height>0);
  if(file.sourcePage){
   const year=file.url.split("/")[3];
   const original=readFileSync(new URL(`../assets/papers/english-originals/${year}.pdf`,import.meta.url));
   assert.equal(createHash("sha256").update(original).digest("hex"),file.sourceSha256);
  }else assert.equal(file.sha256,file.sourceSha256);
 }
});
