import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";

const run=overrides=>spawnSync(process.execPath,["scripts/vercel-build.mjs"],{
 encoding:"utf8",env:{...process.env,DATABASE_URL:"",BETTER_AUTH_URL:"",BETTER_AUTH_SECRET:"",...overrides},
});
test("Vercel build rejects missing secrets and local databases before running migrations",()=>{
 const missing=run({});assert.notEqual(missing.status,0);assert.match(missing.stderr,/Missing deployment setting: DATABASE_URL/);
 const local=run({DATABASE_URL:"postgres://test:test@127.0.0.1:51214/template1",BETTER_AUTH_URL:"https://education.example",BETTER_AUTH_SECRET:"s".repeat(32)});
 assert.notEqual(local.status,0);assert.match(local.stderr,/hosted PostgreSQL/);
 assert.ok(!local.stderr.includes("postgres://test:test"),"connection strings are not exposed");
});
test("Vercel build rejects unsafe canonical auth URLs and short secrets",()=>{
 const base={DATABASE_URL:"postgresql://test:test@db.example/education",BETTER_AUTH_SECRET:"s".repeat(32)};
 for(const url of ["http://education.example","https://education.example/path","https://user:password@education.example","https://education.example/?next=other"]){
  const result=run({...base,BETTER_AUTH_URL:url});assert.notEqual(result.status,0);assert.match(result.stderr,/canonical HTTPS site origin/);
 }
 const short=run({...base,BETTER_AUTH_URL:"https://education.example",BETTER_AUTH_SECRET:"short"});assert.notEqual(short.status,0);assert.match(short.stderr,/at least 32/);
});
test("a pooled Neon DATABASE_URL requires a direct, non-pooled migration URL",()=>{
 const base={BETTER_AUTH_URL:"https://education.example",BETTER_AUTH_SECRET:"s".repeat(32)};
 const pooled="postgresql://test:test@ep-x-pooler.ap-southeast-1.aws.neon.tech/education";
 const missing=run({...base,DATABASE_URL:pooled,DIRECT_DATABASE_URL:""});assert.notEqual(missing.status,0);assert.match(missing.stderr,/needs DIRECT_DATABASE_URL/);
 const wrong=run({...base,DATABASE_URL:pooled,DIRECT_DATABASE_URL:pooled});assert.notEqual(wrong.status,0);assert.match(wrong.stderr,/non-pooled/);
 assert.ok(!wrong.stderr.includes("test:test"),"connection strings are not exposed");
});
