import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hostedSpeechKey,hostedVoice,hostedTranscript,SpeechProviderError,HOSTED_VOICE_MODEL,HOSTED_TRANSCRIBE_MODEL} from "../src/modules/speaking-lab/speech-provider.ts";
import {encodeSpeechWav} from "../src/modules/speaking-lab/pcm.ts";

const mp3=()=>{const bytes=new Uint8Array(400);bytes[0]=0xff;bytes[1]=0xfb;return bytes;};
const audioReply=(bytes=mp3(),type="audio/mpeg")=>new Response(bytes,{status:200,headers:{"Content-Type":type}});
// Records every call and answers from a queue; a queued Error is thrown as a network failure.
function fakeFetch(...replies){
 const calls=[];
 const fetcher=async(url,init)=>{calls.push({url:String(url),init});const reply=replies.shift();if(reply instanceof Error)throw reply;return reply;};
 return {fetcher,calls};
}

test("hosted speech is used only when a key is configured",()=>{
 assert.equal(hostedSpeechKey({}),null);
 assert.equal(hostedSpeechKey({DEEPINFRA_API_KEY:"   "}),null);
 assert.equal(hostedSpeechKey({DEEPINFRA_API_KEY:" key "}),"key");
});

test("a voice request names the chosen Kokoro voice and returns the provider's audio",async()=>{
 const {fetcher,calls}=fakeFetch(audioReply());
 const audio=await hostedVoice("secret",{text:"Let's talk about your home town.",voice:"bm_george",speed:1},fetcher,0);
 assert.equal(audio.byteLength,400);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,`https://api.deepinfra.com/v1/inference/${HOSTED_VOICE_MODEL}`);
 assert.equal(calls[0].init.method,"POST");assert.equal(calls[0].init.redirect,"error");
 assert.equal(calls[0].init.headers.Authorization,"Bearer secret");
 assert.deepEqual(JSON.parse(calls[0].init.body),{text:"Let's talk about your home town.",preset_voice:["bm_george"],speed:1,output_format:"mp3"});
});

test("audio wrapped in JSON as base64 or a data URL is unwrapped",async()=>{
 const base64=Buffer.from(mp3()).toString("base64");
 for(const audio of [base64,`data:audio/mp3;base64,${base64}`]){
  const {fetcher}=fakeFetch(Response.json({audio,request_id:"r"}));
  const bytes=new Uint8Array(await hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},fetcher,0));
  assert.equal(bytes.length,400);assert.equal(bytes[0],0xff);
 }
});

test("a reply that is not audio is refused instead of being sent to the browser",async()=>{
 for(const reply of [audioReply(new TextEncoder().encode("<html>".padEnd(200,"x")),"text/html"),audioReply(new Uint8Array(10)),Response.json({audio:null}),Response.json({error:"x"}),audioReply(new Uint8Array(4_000_001).fill(0xff))]){
  const {fetcher}=fakeFetch(reply);
  await assert.rejects(hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},fetcher,0),error=>error instanceof SpeechProviderError&&error.reason==="shape");
 }
});

test("a busy or failing provider is retried once; a refused request is not",async()=>{
 let run=fakeFetch(new Response("busy",{status:429}),audioReply());
 assert.equal((await hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},run.fetcher,0)).byteLength,400);
 assert.equal(run.calls.length,2);
 run=fakeFetch(new TypeError("offline"),audioReply());
 assert.equal((await hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},run.fetcher,0)).byteLength,400);
 run=fakeFetch(new Response("down",{status:503}),new Response("down",{status:503}),audioReply());
 await assert.rejects(hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},run.fetcher,0),error=>error instanceof SpeechProviderError&&error.status===503);
 assert.equal(run.calls.length,2);
 run=fakeFetch(new TypeError("offline"),new TypeError("offline"));
 await assert.rejects(hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},run.fetcher,0),error=>error instanceof SpeechProviderError&&error.reason==="network");
 run=fakeFetch(new Response("bad key",{status:401}),audioReply());
 await assert.rejects(hostedVoice("k",{text:"Hi.",voice:"af_heart",speed:1},run.fetcher,0),error=>error instanceof SpeechProviderError&&error.status===401);
 assert.equal(run.calls.length,1);
 // The key never appears in an error that reaches the log.
 await assert.rejects(hostedVoice("secret-key",{text:"Hi.",voice:"af_heart",speed:1},fakeFetch(new Response("",{status:401})).fetcher,0),error=>!error.message.includes("secret-key"));
});

test("a transcription uploads the answer as WAV, fixes English and returns the text",async()=>{
 const wav=encodeSpeechWav(new Float32Array(16000).fill(.1));
 const {fetcher,calls}=fakeFetch(Response.json({text:" I usually study in the evening. ",segments:[]}));
 assert.equal(await hostedTranscript("secret",wav,fetcher,0)," I usually study in the evening. ");
 assert.equal(calls[0].url,`https://api.deepinfra.com/v1/inference/${HOSTED_TRANSCRIBE_MODEL}`);
 assert.equal(calls[0].init.headers.Authorization,"Bearer secret");
 const form=calls[0].init.body;assert.ok(form instanceof FormData);
 assert.deepEqual([...form.keys()].sort(),["audio","language"]);
 assert.equal(form.get("language"),"en");
 const file=form.get("audio");assert.equal(file.type,"audio/wav");assert.equal(file.size,wav.byteLength);
 for(const reply of [Response.json({segments:[]}),Response.json({text:5}),new Response("oops",{status:200})]){
  await assert.rejects(hostedTranscript("k",wav,fakeFetch(reply).fetcher,0),error=>error instanceof SpeechProviderError&&error.reason==="shape");
 }
});

test("the speech services choose the provider on the server and keep their access checks",()=>{
 const voice=readFileSync("src/modules/speaking-lab/voice.ts","utf8"),transcribe=readFileSync("src/modules/speaking-lab/transcribe.ts","utf8");
 // Access and the daily count run before either engine is chosen.
 assert.ok(voice.indexOf("await allow(userId)")<voice.indexOf("hostedSpeechKey()")&&voice.indexOf('reserveSpeakingRequest(userId,"voice")')<voice.indexOf("hostedSpeechKey()"));
 assert.ok(transcribe.indexOf("await allow(userId)")<transcribe.indexOf("hostedSpeechKey()")&&transcribe.indexOf('reserveSpeakingRequest(userId,"transcribe")')<transcribe.indexOf("hostedSpeechKey()"));
 // The access check still runs again after the transcript comes back.
 assert.ok(transcribe.lastIndexOf("await allow(userId)")>transcribe.indexOf("hostedTranscript("));
 // The key is read only on the server.
 for(const file of ["client.tsx","audio.ts","contracts.ts"])assert.ok(!readFileSync(`src/modules/speaking-lab/${file}`,"utf8").includes("DEEPINFRA"));
});
