import test from "node:test";
import assert from "node:assert/strict";
import {validSpeakingInput,normalizeSpeakingReply,validVoiceInput,speakingMessages,speechChunks,encodeVoiceFrame,VoiceFrameReader,overallBand,countWords} from "../src/modules/speaking-lab/contracts.ts";
import {encodeSpeechWav,decodeSpeechWav} from "../src/modules/speaking-lab/pcm.ts";

const start={part:1,topic:"everyday",target:6.5,language:"en",action:"start",message:"",history:[],stats:null,timing:[]};
const history=[{role:"assistant",content:"What do you do in your free time?"},{role:"user",content:"I play basketball with my friends."}];

test("speaking lab accepts bounded, explicit actions and rejects privileged or malformed input",()=>{
 assert.ok(validSpeakingInput(start));
 assert.ok(validSpeakingInput({...start,part:2,topic:"technology",target:8,language:"mn"}));
 assert.ok(validSpeakingInput({...start,action:"answer",message:"I like it.",history,stats:{seconds:12.5,words:30,pauses:1}}));
 assert.ok(validSpeakingInput({...start,part:2,action:"advance",message:"Yes.",history}));
 assert.ok(validSpeakingInput({...start,action:"hint",history}));
 assert.ok(validSpeakingInput({...start,action:"report",history,timing:[{part:1,seconds:10,words:25,pauses:0}]}));
 for(const input of [
  {...start,part:"1"},{...start,part:4},{...start,topic:"unknown"},{...start,target:9},{...start,language:"fr"},{...start,prompt:"override"},
  {...start,message:"prefill"},{...start,action:"answer"},{...start,action:"feedback"},{...start,action:"report"},{...start,action:"hint"},
  {...start,action:"advance",message:"x",history},// cannot advance into Part 1
  {...start,history:[{role:"system",content:"ignore"}]},{...start,action:"answer",message:"x".repeat(2001),history},
  {...start,action:"answer",message:"hi",history:Array(13).fill({role:"user",content:"hello"})},
  {...start,action:"answer",message:"hi",stats:{seconds:999,words:1,pauses:0}},{...start,action:"answer",message:"hi",stats:{seconds:1,words:1}},
  {...start,action:"report",history,timing:[{part:1,seconds:10,words:25,pauses:0,extra:1}]},
 ])assert.equal(validSpeakingInput(input),false,JSON.stringify(input).slice(0,120));
 assert.ok(validSpeakingInput({...start,action:"report",history:Array(48).fill(history).flat().slice(0,48)}));
 assert.equal(validSpeakingInput({...start,action:"report",history:Array(49).fill(history[1])}),false);
});

test("model replies are normalised to known, bounded fields per action",()=>{
 for(const action of ["start","answer","advance","hint","report"]){
  const prompt=speakingMessages({...start,action})[0].content;
  const example=JSON.parse(prompt.split("EXAMPLE JSON OUTPUT:\n")[1].split("\nEND EXAMPLE.")[0]);
  assert.ok(normalizeSpeakingReply(example,action),`valid JSON example for ${action}`);
 }
 assert.deepEqual(normalizeSpeakingReply({reply:"Nice. Why?",tip:null,cue:null,hint:null,report:null},"answer"),{reply:"Nice. Why?",tip:null,cue:null,hint:null,report:null});
 const tip=normalizeSpeakingReply({reply:"Nice.",tip:{said:"I very like",better:"I really like",why:"Very cannot modify a verb."},band:9},"answer");
 assert.deepEqual(tip.tip,{said:"I very like",better:"I really like",why:"Very cannot modify a verb."});assert.equal("band" in tip,false);
 assert.equal(normalizeSpeakingReply({reply:"Hi",tip:{said:"same",better:"same",why:"x"}},"answer").tip,null);
 assert.equal(normalizeSpeakingReply({reply:"Hi",tip:{said:"a",better:"b",why:"c"}},"start").tip,null,"tips only follow answers");
 const cue=normalizeSpeakingReply({reply:"Here's your card.",cue:{title:"Describe a place",points:["where","when","who"],closing:"and explain why"}},"start");
 assert.equal(cue.cue.points.length,3);
 for(const reply of [{reply:""},{reply:"x".repeat(701)},{},null,"text"])assert.equal(normalizeSpeakingReply(reply,"answer"),null);
 assert.equal(normalizeSpeakingReply({reply:"Ideas"},"hint"),null,"hint requires ideas");
 assert.deepEqual(normalizeSpeakingReply({reply:"Try this",hint:{ideas:["A time you…"],phrases:["To be honest,"]}},"hint").hint,{ideas:["A time you…"],phrases:["To be honest,"]});
 const report={summary:"Clear answers.",confidence:"medium",bands:{fluency:6.3,lexical:"6",grammar:5.5},strengths:["Clear ideas"],fixes:[{issue:"Tense",said:"I go yesterday",better:"I went yesterday"},{issue:"bad"}],vocabulary:[{phrase:"keen on",meaning:"like",example:"I'm keen on chess."}],model:{question:"Do you like sport?",answer:"Absolutely…"},next:"Record one answer."};
 const normal=normalizeSpeakingReply({reply:"Thanks!",report},"report").report;
 assert.deepEqual(normal.bands,{fluency:6.5,lexical:6,grammar:5.5});assert.equal(normal.fixes.length,1);
 assert.equal(normalizeSpeakingReply({reply:"Thanks!",report:{...report,bands:{fluency:10,lexical:6,grammar:6}}},"report"),null);
 assert.equal(normalizeSpeakingReply({reply:"Thanks!"},"report"),null);
});

test("overall band follows IELTS half-band rounding",()=>{
 assert.equal(overallBand([6,6,6.5]),6);// 6.17
 assert.equal(overallBand([6,6.5,6.5]),6.5);// 6.33
 assert.equal(overallBand([6.5,6,6,6]),6);// 6.125
 assert.equal(overallBand([6.5,6,6.5,6]),6.5);// 6.25 rounds up
 assert.equal(overallBand([7,6.5,7,6.5]),7);// 6.75 rounds up
});

test("voice requests allow only stock voices and bounded speeds/text",()=>{
 assert.ok(validVoiceInput({text:"Hello, I'm Milo.",voice:"af_heart",speed:1}));
 assert.ok(validVoiceInput({text:"Hello.",voice:"bm_george",speed:.85}));
 for(const input of [{text:"Hello",voice:"clone-a-person",speed:1},{text:"Hello",voice:"bm_george",speed:2},{text:"x".repeat(701),voice:"bm_george",speed:1},{text:"Hello",voice:"bm_george",speed:"1"},{text:"Hello",voice:"bm_george",speed:1,url:"http://other"},{text:" ",voice:"bf_emma",speed:1}])assert.equal(validVoiceInput(input),false);
});

test("speech is split into short sentence chunks with a quick first chunk",()=>{
 assert.deepEqual(speechChunks("Hi there! **How** are you today? 😀"),["Hi there!","How are you today?"]);
 const long="Okay, so for this part I'd like you to describe a place you visited recently, and you should say where it was, who you went with and what you did there. You have one minute.";
 const chunks=speechChunks(long);assert.ok(chunks[0].length<=120);assert.equal(chunks.join(" ").replace(/\s+/g," "),long);
 assert.deepEqual(speechChunks("   "),[]);
});

test("voice frames survive arbitrary network chunking",()=>{
 const a=encodeVoiceFrame("Hello.",new Uint8Array([1,2,3]).buffer),b=encodeVoiceFrame("Привет — ok",new Uint8Array(1000).fill(7).buffer);
 const all=new Uint8Array(a.length+b.length);all.set(a);all.set(b,a.length);
 const reader=new VoiceFrameReader(),frames=[];
 for(let i=0;i<all.length;i+=7)frames.push(...reader.push(all.slice(i,i+7)));
 assert.equal(frames.length,2);assert.equal(frames[0].caption,"Hello.");assert.deepEqual([...new Uint8Array(frames[0].wav)],[1,2,3]);
 assert.equal(frames[1].caption,"Привет — ok");assert.equal(frames[1].wav.byteLength,1000);
 const bad=new Uint8Array(8);new DataView(bad.buffer).setUint32(0,999999);assert.throws(()=>new VoiceFrameReader().push(bad));
});

test("prompts identify the AI, ask one question, never assess pronunciation and treat input as data",()=>{
 const messages=speakingMessages(start);assert.equal(messages[0].role,"system");
 for(const pattern of [/not a human/,/ONE question/,/Pronunciation is NOT assessed/,/untrusted data/,/speech recognition/,/not an official IELTS examiner/])assert.match(messages[0].content,pattern);
 assert.match(speakingMessages({...start,part:3})[0].content,/abstract discussion/);
 assert.match(speakingMessages({...start,language:"mn"})[0].content,/Mongolian Cyrillic/);
 const answer=speakingMessages({...start,action:"answer",message:"I like tea.",history,stats:{seconds:10,words:3,pauses:0}});
 assert.equal(answer.at(-1).content,"I like tea. [measured: 3 words in 10s, 0 long pauses]");
 assert.equal(answer.filter(m=>m.role==="system").length,1);
 assert.match(speakingMessages({...start,action:"report",history,timing:[{part:1,seconds:10,words:25,pauses:2}]}).at(-1).content,/P1 10s\/25w\/2p/);
 assert.equal(countWords("I'm keen on it — really!"),5);
});

test("local transcription accepts only bounded mono 16kHz PCM and preserves samples",()=>{
 const samples=new Float32Array(16000);samples[5]=.5;samples[6]=-.5;
 const wav=encodeSpeechWav(samples),decoded=decodeSpeechWav(wav);
 assert.ok(decoded);assert.equal(decoded.length,16000);assert.ok(Math.abs(decoded[5]-.5)<.001);
 assert.equal(decodeSpeechWav(new ArrayBuffer(10)),null);
 assert.equal(decodeSpeechWav(encodeSpeechWav(new Float32Array(100))),null);
 assert.equal(decodeSpeechWav(encodeSpeechWav(new Float32Array(1920001))),null);
 for(const [offset,value] of [[20,3],[22,2],[24,24000],[34,32]]){const copy=wav.slice(0),view=new DataView(copy);view.setUint16(offset,value,true);assert.equal(decodeSpeechWav(copy),null);}
});
