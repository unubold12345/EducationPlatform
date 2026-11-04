import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const root=new URL("../",import.meta.url);
const text=path=>readFileSync(new URL(path,root),"utf8");
test("practice exercises stay removed while workshops remain",()=>{
 for(const path of ["src/app/exercises","src/app/practice","src/app/learn","src/app/api/exercises","src/app/api/practice","src/app/api/attempts","src/modules/exercises","src/modules/practice","src/modules/attempts","prisma/seed.ts"])assert.equal(existsSync(new URL(path,root)),false,path);
 for(const path of ["src/modules/workshops/guided.ts","src/modules/workshops/workshop-client.tsx","src/app/workshops/[slug]/page.tsx","src/app/workshop/page.tsx"])assert.ok(existsSync(new URL(path,root)),path);
});
test("deploys no longer seed the removed question bank",()=>{
 assert.equal(text("scripts/vercel-build.mjs").includes("seed"),false);
 assert.equal(text("prisma.config.ts").includes("seed.ts"),false);
});
test("schema keeps the old tables until the owner has purged their data",()=>{
 const schema=text("prisma/schema.prisma");
 for(const model of ["Attempt","AttemptItem","QuestionVersion","Exam"])assert.match(schema,new RegExp("model "+model+" "));
});
