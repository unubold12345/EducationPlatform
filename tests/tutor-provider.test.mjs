import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
test("DeepSeek transport handles real API shapes, bounds requests and rejects partial/error/empty output without echoing secrets",()=>{
 const script=`
 import assert from 'node:assert/strict';
 import {deepseekTutor} from './src/modules/tutor/provider.ts';
 const input={target:{kind:'practice',slug:'demo',questionId:'q'},action:'hint',language:'mn',message:'help',history:[]};
 const context={title:'Algebra',prompt:'3x + 7 = 22',selected:'',review:false};
 process.env.DEEPSEEK_API_KEY='test-only-not-a-real-key';delete process.env.DEEPSEEK_MODEL;
 globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
  const body=JSON.parse(options.body);assert.equal(body.model,'deepseek-flash');assert.equal(body.max_tokens,1400);assert.equal(body.thinking.type,'disabled');
  assert.ok(!JSON.stringify(body).includes('test-only-not-a-real-key'));
  return Response.json({choices:[{finish_reason:'stop',message:{content:'Subtract 7 from both sides.'}}]});
 };
 assert.match(await deepseekTutor(input,context),/Subtract/);
 for(const [status,body] of [[401,{error:'PRIVATE_PROVIDER_DETAILS'}],[429,{}],[200,{choices:[{finish_reason:'length',message:{content:'partial'}}]}],[200,{choices:[{finish_reason:'stop',message:{content:''}}]}]]){
  globalThis.fetch=async()=>Response.json(body,{status});
  await assert.rejects(()=>deepseekTutor(input,context),error=>error.status===503&&!error.message.includes('PRIVATE_PROVIDER_DETAILS'));
 }
 globalThis.fetch=async()=>{throw Error('PRIVATE_CONNECTION_DETAILS')};
 await assert.rejects(()=>deepseekTutor(input,context),error=>error.status===503&&!error.message.includes('PRIVATE_CONNECTION_DETAILS'));
 delete process.env.DEEPSEEK_API_KEY;
 await assert.rejects(()=>deepseekTutor(input,context),error=>error.status===503);
 `;
 const result=spawnSync(process.execPath,["--conditions=react-server","--import","tsx","--input-type=module","-e",script],{cwd:process.cwd(),encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
