import test from "node:test";
import assert from "node:assert/strict";
import {pilotConfig} from "../src/lib/pilot-config.ts";
test("local demo rights never become hosted demo credentials",()=>{
 assert.deepEqual(pilotConfig({AUTH_LOCAL_PILOT:"true",BETTER_AUTH_URL:"http://localhost:3001"}),{local:true,hosted:false,payments:true,speaking:true});
 assert.deepEqual(pilotConfig({AUTH_LOCAL_PILOT:"true",BETTER_AUTH_URL:"https://education.example"}),{local:false,hosted:false,payments:false,speaking:false});
});
test("hosted pilot needs explicit HTTPS opt-ins with separate payment and speaking switches",()=>{
 const env={AUTH_HOSTED_PILOT:"true",BETTER_AUTH_URL:"https://education.example"};
 assert.deepEqual(pilotConfig(env),{local:false,hosted:true,payments:false,speaking:false});
 assert.deepEqual(pilotConfig({...env,HOSTED_MOCK_PAYMENTS:"true",SPEAKING_LAB_ENABLED:"true"}),{local:false,hosted:true,payments:true,speaking:true});
 for(const url of ["http://education.example","https://localhost","https://user:password@education.example","https://education.example/path","https://education.example/?x=1","not a URL"]){
  assert.equal(pilotConfig({...env,BETTER_AUTH_URL:url}).hosted,false,url);
 }
});
