import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { paperImageUrl } from "../src/modules/papers/images.ts";
import { officialPapers } from "../src/modules/papers/catalog.ts";

test("all 32 official pages resolve to bundled JPEGs with the reviewed source hashes",()=>{
 const manifest=JSON.parse(readFileSync(new URL("../assets/papers/eec-math-2020.json",import.meta.url),"utf8"));
 assert.equal(manifest.pages.length,32);
 assert.equal(new Set(manifest.pages.map(page=>page.path)).size,32);
 for(const paper of officialPapers)for(const sourceUrl of paper.pageUrls){
  const path=paperImageUrl(sourceUrl);
  const entry=manifest.pages.find(page=>page.sourceUrl===sourceUrl);
  assert.equal(path,entry.path);
  const bytes=readFileSync(new URL("../public"+path,import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.sha256);
  assert.equal(bytes.length,entry.bytes);
  assert.equal(bytes.readUInt16BE(0),0xffd8);
 }
});

test("legacy snapshots keep provenance while only exact approved pages are mapped",()=>{
 const source="http://help.eec.mn/modelItems/2020/mat/A/1.jpg";
 const snapshot={paper:{pageUrls:[source]}};
 const before=JSON.stringify(snapshot);
 assert.equal(paperImageUrl(snapshot.paper.pageUrls[0]),"/exam-assets/eec-math-2020/A/1.jpg");
 assert.equal(paperImageUrl(source.replace("http:","https:")),"/exam-assets/eec-math-2020/A/1.jpg");
 assert.equal(JSON.stringify(snapshot),before);
 for(const url of [source+"?url=https://other.invalid",source.replace("/A/","/E/"),source.replace("1.jpg","9.jpg"),source.replace("2020","2021"),source.replace("help.eec.mn","help.eec.mn.evil.invalid"),"/exam-assets/eec-math-2020/A/1.jpg"]){
  assert.equal(paperImageUrl(url),url);
 }
});
