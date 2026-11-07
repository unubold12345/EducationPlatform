import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {examDefinitions,findExam} from "../src/modules/exams/definitions.ts";
// The owner removed the 2026 Dornod practice papers entirely on 2026-10-29: no catalog entry, key or bundled file.
test('2026 Dornod papers are gone from the catalog, keys and bundled assets',()=>{
 for(const slug of ['dornod-2026-math-online-4','dornod-2026-english-online-4'])assert.equal(findExam(slug),undefined);
 assert.ok(examDefinitions.every(exam=>!exam.slug.startsWith('dornod')&&!exam.title.includes('Дорнод')));
 for(const path of ['../src/modules/papers/regional.ts','../src/modules/papers/regional-keys.json','../assets/papers/dornod-2026.json','../assets/papers/dornod-2026-originals','../public/exam-assets/dornod-2026','../src/app/exams/dornod-2026'])
  assert.equal(existsSync(new URL(path,import.meta.url)),false,path);
});
