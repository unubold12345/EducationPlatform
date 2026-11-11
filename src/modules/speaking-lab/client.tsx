"use client";
import {useEffect,useMemo,useRef,useState,useSyncExternalStore,type CSSProperties} from "react";
import Link from "next/link";
import {encodeSpeechWav} from "./pcm";
import {SpeakingAvatar,type AvatarGesture,type AvatarMood} from "./avatar";
import {PartnerPortrait,partnerLooks} from "./partner";
import {VoicePlayer,audibleSeconds,deviceVoice,startRecorder,type RecorderHandle} from "./audio";
import {
 HISTORY_LIMIT,REPORT_HISTORY_LIMIT,countWords,isClarificationRequest,overallBand,speakingAcks,speakingSpeeds,speakingTargets,speakingTopics,speakingVoices,
 type AnswerStats,type SpeakingAction,type SpeakingCue,type SpeakingHint,type SpeakingPart,type SpeakingReply,type SpeakingReport,
 type SpeakingSpeed,type SpeakingTip,type SpeakingTopic,type SpeakingVoice,
} from "./contracts";
import {getProgress,getServerProgress,removePhrase,savePhrase,subscribeProgress,updateProgress} from "./progress";
import {SpeakingReportView,Trend,type SessionStats} from "./report";
import {CreditCost,useCredits} from "@/modules/credits/client";

// aside: a request to repeat or explain; it is answered but does not count as one of the mock test's questions.
type Turn={id:number;role:"user"|"assistant";content:string;part:SpeakingPart;tip?:SpeakingTip|null;cue?:SpeakingCue|null;stats?:AnswerStats|null;aside?:boolean};
type Status="idle"|"thinking"|"voicing"|"speaking"|"listening"|"transcribing"|"reporting";
type Settings={mode:"mock"|"practice";part:SpeakingPart;topic:SpeakingTopic;target:number;language:"en"|"mn";voice:SpeakingVoice;speed:SpeakingSpeed;voiceOn:boolean;engine:"neural"|"device";handsFree:boolean;captions:boolean};

const CHAT_URL="/api/labs/ielts-speaking",VOICE_URL="/api/labs/ielts-speaking/voice",TRANSCRIBE_URL="/api/labs/ielts-speaking/transcribe";
// Answers per part in a full mock before moving on (Part 2 = long turn + one rounding-off question).
const PLAN:Record<SpeakingPart,number>={1:4,2:2,3:4};
const TARGET_SECONDS:Record<SpeakingPart,[number,number]>={1:[15,35],2:[60,120],3:[30,60]};
const PART_NAMES:Record<SpeakingPart,string>={1:"Interview",2:"Long turn",3:"Discussion"};
const DEFAULTS:Settings={mode:"mock",part:1,topic:"everyday",target:6.5,language:"en",voice:"af_heart",speed:1,voiceOn:true,engine:"neural",handsFree:true,captions:true};
const MODES=[
 ["mock","Exam conditions","Full mock test","An AI examiner takes you through Parts 1, 2 and 3 in about 12 minutes. No help along the way; corrections and bands come in the report."],
 ["practice","Relaxed","Practise one part","An open conversation on one part. Live corrections, ideas when you’re stuck, and you can retry any answer."],
] as const;
const ICONS={
 mic:"M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1a7 7 0 0 0 6-6.9h-2Z",
 stop:"M9 7h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z",
 sound:"M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Z",
 muted:"M4 9v6h4l5 4V5L8 9H4Zm12.6-.4-1.4 1.4 2 2-2 2 1.4 1.4 2-2 2 2 1.4-1.4-2-2 2-2-1.4-1.4-2 2-2-2Z",
 captions:"M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z",
 repeat:"M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
 idea:"M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
} as const;
function Glyph({name}:{name:keyof typeof ICONS}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[name]}/></svg>;}
const subscribeNothing=()=>()=>{};
// Monotonic time for event handlers (acknowledgement and nod timing); never read while rendering.
const clockNow=()=>performance.now();
const micAvailable=()=>typeof MediaRecorder!=="undefined"&&!!navigator.mediaDevices?.getUserMedia;
const clock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;
const failure=(reason:unknown,fallback:string)=>reason instanceof Error&&!["TimeoutError","AbortError"].includes(reason.name)&&reason.message?reason.message:fallback;

function Elapsed({target,limit}:{target:[number,number];limit:number}) {
 const [seconds,setSeconds]=useState(0);
 useEffect(()=>{const start=performance.now();const id=setInterval(()=>setSeconds((performance.now()-start)/1000),200);return()=>clearInterval(id);},[]);
 const zone=seconds<target[0]?"short":seconds<=target[1]?"good":"long";
 return <div className={`sl-elapsed ${zone}`} aria-hidden="true">
  <span>{clock(seconds)}</span>
  <div><i style={{width:`${Math.min(100,seconds/limit*100)}%`}}/><b style={{left:`${target[0]/limit*100}%`,width:`${(target[1]-target[0])/limit*100}%`}}/></div>
  <small>{zone==="short"?`Aim for ${target[0]}–${target[1]}s`:zone==="good"?"Good length":"You can wrap up"}</small>
 </div>;
}

function SessionClock() {
 const [seconds,setSeconds]=useState(0);
 useEffect(()=>{const start=performance.now();const id=setInterval(()=>setSeconds((performance.now()-start)/1000),1000);return()=>clearInterval(id);},[]);
 return <>{clock(seconds)}</>;
}

function Countdown({seconds,onDone}:{seconds:number;onDone:()=>void}) {
 const [left,setLeft]=useState(seconds),done=useRef(onDone);
 useEffect(()=>{done.current=onDone;});
 useEffect(()=>{
  const start=performance.now();
  const id=setInterval(()=>{const remaining=Math.max(0,seconds-(performance.now()-start)/1000);setLeft(remaining);if(remaining<=0){clearInterval(id);done.current();}},250);
  return()=>clearInterval(id);
 },[seconds]);
 return <span className="sl-countdown">{clock(Math.ceil(left))}</span>;
}

export function SpeakingLab({signedIn}:{signedIn:boolean}) {
 const [settings,setSettings]=useState<Settings>(DEFAULTS);
 const [phase,setPhase]=useState<"setup"|"session"|"report">("setup");
 const [turns,setTurns]=useState<Turn[]>([]);
 const [status,setStatusState]=useState<Status>("idle");
 const [caption,setCaption]=useState("");
 const [draft,setDraft]=useState("");
 const [draftStats,setDraftStats]=useState<AnswerStats|null>(null);
 const [hint,setHint]=useState<SpeakingHint|null>(null);
 const [hintPending,setHintPending]=useState(false);
 const [prep,setPrep]=useState<number|null>(null);
 const [notes,setNotes]=useState("");
 const [report,setReport]=useState<{data:SpeakingReport;stats:SessionStats}|null>(null);
 const [consent,setConsent]=useState(false);
 const [micConsent,setMicConsent]=useState(false);
 const [hearing,setHearing]=useState(false);
 const [recordingKey,setRecordingKey]=useState(0);
 const [gesture,setGesture]=useState<AvatarGesture>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [previewing,setPreviewing]=useState(false);
 const [sessionKey,setSessionKey]=useState(0);

 const micSupported=useSyncExternalStore(subscribeNothing,micAvailable,()=>false);
 const progress=useSyncExternalStore(subscribeProgress,getProgress,getServerProgress);
 const saved=useMemo(()=>new Set(progress.phrases.map(p=>p.id)),[progress.phrases]);

 const energy=useRef(0),player=useRef<VoicePlayer|null>(null),recorder=useRef<RecorderHandle|null>(null);
 const turnsRef=useRef<Turn[]>([]),statusRef=useRef<Status>("idle"),busy=useRef(false),sessionRun=useRef(0),speechRun=useRef(0),ids=useRef(0),startPart=useRef<SpeakingPart>(1);
 const chatAbort=useRef<AbortController|null>(null),voiceAbort=useRef<AbortController|null>(null),transcribeAbort=useRef<AbortController|null>(null);
 const {apply}=useCredits();
 const deviceStop=useRef<(()=>void)|null>(null),cancelStart=useRef(false),stage=useRef<HTMLElement>(null),transcript=useRef<HTMLDivElement>(null),answerBox=useRef<HTMLTextAreaElement>(null);
 const settingsRef=useRef<Settings>(DEFAULTS),phaseRef=useRef<"setup"|"session"|"report">("setup"),micConsentRef=useRef(false);
 const keys=useRef<{space:()=>void;escape:()=>void}>({space:()=>{},escape:()=>{}});
 // Pre-loaded acknowledgement clips for the current partner, and when the one now playing ends.
 const acks=useRef<{key:string;clips:AudioBuffer[];next:number}>({key:"",clips:[],next:0}),ackUntil=useRef(0);
 const lastNod=useRef(0),listenStart=useRef(0);

 // Background warm-up of the local voice and transcription models.
 useEffect(()=>{if(signedIn)void fetch("/api/labs/ielts-speaking/warm",{method:"POST"}).catch(()=>{});},[signedIn]);
 useEffect(()=>{
  const recorderRef=recorder,playerRef=player,sessionRef=sessionRun,abortRefs=[chatAbort,voiceAbort,transcribeAbort];
  return()=>{sessionRef.current++;recorderRef.current?.abort();for(const ref of abortRefs)ref.current?.abort();playerRef.current?.close();window.speechSynthesis?.cancel();};
 },[]);
 useEffect(()=>{transcript.current?.scrollTo({top:transcript.current.scrollHeight,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});},[turns,status,hint]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null;
   if(target&&["INPUT","TEXTAREA","SELECT","BUTTON"].includes(target.tagName)&&event.key!=="Escape")return;
   if(event.code==="Space"&&!event.repeat){event.preventDefault();keys.current.space();}
   if(event.key==="Escape")keys.current.escape();
  };
  window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[]);

 const getPlayer=()=>player.current??=new VoicePlayer(energy);
 const nextId=()=>++ids.current;
 function changeStatus(next:Status){statusRef.current=next;setStatusState(next);}
 function commitTurns(next:Turn[]){turnsRef.current=next;setTurns(next);}
 const currentPart=(list=turnsRef.current)=>[...list].reverse().find(t=>t.role==="assistant")?.part??startPart.current;
 const awaitingLongTurn=(list=turnsRef.current)=>{const last=list.at(-1);return !!(last&&last.role==="assistant"&&last.cue);};
 const update=(patch:Partial<Settings>)=>{const next={...settingsRef.current,...patch};settingsRef.current=next;setSettings(next);};
 const cfg=()=>settingsRef.current;
 function changePhase(next:"setup"|"session"|"report"){phaseRef.current=next;setPhase(next);}

 // ---------- Voice ----------
 function stopVoice() {
  speechRun.current++;voiceAbort.current?.abort();player.current?.stop();
  deviceStop.current?.();deviceStop.current=null;window.speechSynthesis?.cancel();
  energy.current=0;setCaption("");
  if(statusRef.current==="voicing"||statusRef.current==="speaking")changeStatus("idle");
 }
 function speakDevice(text:string,run:number,voice:SpeakingVoice) {
  return new Promise<boolean>(resolve=>{
   const synth=window.speechSynthesis;if(!synth){resolve(true);return;}
   const utterance=new SpeechSynthesisUtterance(text);utterance.lang=speakingVoices[voice].accent==="British"?"en-GB":"en-US";utterance.rate=cfg().speed;
   utterance.voice=deviceVoice(synth.getVoices(),voice);
   let frame=0,settled=false;
   const finish=(value:boolean)=>{if(settled)return;settled=true;cancelAnimationFrame(frame);energy.current=0;resolve(value);};
   utterance.onstart=()=>{if(run!==speechRun.current)return;changeStatus("speaking");setCaption(text);const tick=()=>{energy.current=.06+Math.random()*.14;frame=requestAnimationFrame(tick);};tick();};
   utterance.onend=()=>finish(run===speechRun.current);utterance.onerror=()=>finish(false);
   deviceStop.current=()=>finish(false);synth.speak(utterance);
  });
 }
 async function speak(text:string,{force=false,voice=cfg().voice}:{force?:boolean;voice?:SpeakingVoice}={}):Promise<boolean> {
  stopVoice();
  if(!cfg().voiceOn&&!force)return true;
  const run=++speechRun.current;changeStatus("voicing");
  try {
   if(cfg().engine==="device")return await speakDevice(text,run,voice);
   const controller=new AbortController();voiceAbort.current=controller;
   const response=await fetch(VOICE_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text.slice(0,700),voice,speed:cfg().speed}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(150000)])});
   // A refusal carries the server's reason (for example an unfinished timed mock), which the student should see.
   if(!response.ok){const data=await response.json().catch(()=>({}));throw Object.assign(new Error("Natural voice is unavailable."),{refusal:typeof data.error==="string"?data.error:""});}
   const result=await getPlayer().play(response,{onStart:()=>{if(run===speechRun.current)changeStatus("speaking");},onCaption:line=>{if(run===speechRun.current)setCaption(line);}});
   return result==="ended"&&run===speechRun.current;
  }catch(reason){
   if(run!==speechRun.current||(reason instanceof DOMException&&reason.name==="AbortError"))return false;
   const refusal=(reason as {refusal?:string}).refusal;
   setNotice(refusal?`${refusal} You are hearing your device voice, not ${speakingVoices[voice].label}'s.`:"Natural voice is unavailable right now — using your device voice.");
   return await speakDevice(text,run,voice);
  }finally{
   if(run===speechRun.current){setCaption("");if(statusRef.current==="voicing"||statusRef.current==="speaking")changeStatus("idle");}
  }
 }
 async function preview(voice:SpeakingVoice) {
  setPreviewing(true);getPlayer().ensure();
  try{await speak(`Hi, I'm ${speakingVoices[voice].label}. Take your time — I'm here to listen.`,{force:true,voice});}finally{setPreviewing(false);}
 }

 // ---------- Acknowledgements ----------
 // A person says "okay" the moment you finish. These clips are synthesised once, while the student is
 // speaking, so one can play instantly while the real reply is still being written.
 const ackKey=()=>`${cfg().voice}:${cfg().speed}:${cfg().mode}`;
 async function loadAcks() {
  const key=ackKey();
  if(!cfg().voiceOn||cfg().engine!=="neural"||acks.current.key===key)return;
  const {voice,speed,mode}=cfg(),clips:AudioBuffer[]=[];acks.current={key,clips,next:0};
  try {
   for(const text of speakingAcks[mode]){
    const response=await fetch(VOICE_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,voice,speed}),signal:AbortSignal.timeout(60000)});
    if(!response.ok||acks.current.key!==key)return;
    clips.push(...(await getPlayer().load(response)).slice(0,1));
   }
  }catch{/* Acknowledgements are a nicety; the conversation works without them. */}
 }
 function acknowledge() {
  setGesture({name:"Yes",id:nextId()});
  if(!cfg().voiceOn)return;
  if(cfg().engine==="device"){
   const synth=window.speechSynthesis;if(!synth)return;
   const lines=speakingAcks[cfg().mode],utterance=new SpeechSynthesisUtterance(lines[acks.current.next++%lines.length]);
   utterance.lang=speakingVoices[cfg().voice].accent==="British"?"en-GB":"en-US";utterance.rate=cfg().speed;utterance.voice=deviceVoice(synth.getVoices(),cfg().voice);
   synth.speak(utterance);ackUntil.current=clockNow()+900;return;
  }
  const {key,clips}=acks.current;if(key!==ackKey()||!clips.length)return;
  const clip=clips[acks.current.next++%clips.length];
  getPlayer().playClip(clip);ackUntil.current=clockNow()+audibleSeconds(clip)*1000;
 }
 // The partner nods now and then while the student is talking, when they pause for breath.
 function listenerNod() {
  const now=clockNow();if(now-lastNod.current<7000||now-listenStart.current<3500)return;
  lastNod.current=now;setGesture({name:"Yes",id:nextId()});
 }

 // ---------- Model requests ----------
 async function request(action:SpeakingAction,options:{part:SpeakingPart;history:Turn[];message?:string;stats?:AnswerStats|null}):Promise<SpeakingReply|null> {
  const controller=new AbortController();chatAbort.current=controller;const run=sessionRun.current;
  const limit=action==="report"?REPORT_HISTORY_LIMIT:HISTORY_LIMIT;
  const timing=action==="report"?options.history.flatMap(t=>t.role==="user"&&t.stats?[{part:t.part,seconds:t.stats.seconds,words:t.stats.words,pauses:t.stats.pauses}]:[]).slice(-REPORT_HISTORY_LIMIT):[];
  const body={mode:cfg().mode,voice:cfg().voice,part:options.part,topic:cfg().topic,target:cfg().target,language:cfg().language,action,message:options.message??"",history:options.history.slice(-limit).map(({role,content})=>({role,content})),stats:options.stats??null,timing};
  const response=await fetch(CHAT_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(action==="report"?175000:70000)])});
  const data=await response.json().catch(()=>({error:"Your partner couldn’t reply."}));
  if(!response.ok)throw new Error(data.error||"Your partner couldn’t reply.");
  apply(data);
  return run===sessionRun.current?data as SpeakingReply:null;
 }

 async function afterReply(reply:SpeakingReply) {
  const run=sessionRun.current,gap=ackUntil.current-clockNow();
  // Let a playing acknowledgement finish, with a beat of silence, before the reply starts.
  if(gap>0)await new Promise(resolve=>setTimeout(resolve,gap+150));
  if(run!==sessionRun.current)return;
  const finished=await speak(reply.reply);
  if(run!==sessionRun.current)return;
  void loadAcks();
  if(reply.cue){setNotes("");setPrep(nextId());return;}
  if(finished&&cfg().handsFree&&micConsentRef.current&&micSupported)void startListening();
 }

 async function startSession() {
  if(!consent||busy.current)return;
  getPlayer().ensure();stopVoice();recorder.current?.abort();recorder.current=null;
  sessionRun.current++;commitTurns([]);setReport(null);changePhase("session");setSessionKey(nextId());ackUntil.current=0;setError("");setNotice("");setHint(null);setPrep(null);setDraft("");setDraftStats(null);
  const part:SpeakingPart=cfg().mode==="mock"?1:cfg().part;startPart.current=part;
  busy.current=true;changeStatus("thinking");
  try {
   const reply=await request("start",{part,history:[]});if(!reply)return;
   commitTurns([{id:nextId(),role:"assistant",content:reply.reply,part,cue:reply.cue}]);
   changeStatus("idle");busy.current=false;void afterReply(reply);
  }catch(reason){changeStatus("idle");setError(failure(reason,"Your partner is taking too long to join. Please try again."));}
  finally{busy.current=false;}
 }

 async function submitAnswer(raw:string,stats:AnswerStats|null) {
  const text=raw.trim().slice(0,2000);if(!text||busy.current||phaseRef.current!=="session")return;
  busy.current=true;
  // A spoken answer has just been acknowledged aloud; a typed one may interrupt the partner mid-sentence.
  if(clockNow()>ackUntil.current){stopVoice();if(!stats)setGesture({name:"Yes",id:nextId()});}
  const before=turnsRef.current,part=currentPart(before),aside=isClarificationRequest(text);
  const user:Turn={id:nextId(),role:"user",content:text,part,stats:stats?{...stats,words:countWords(text)}:null,tip:null,aside};
  commitTurns([...before,user]);setDraft("");setDraftStats(null);setHint(null);setError("");setNotice("");setPrep(null);
  const answered=before.filter(t=>t.role==="user"&&t.part===part&&!t.aside).length+(aside?0:1);
  // A cue card stays in force when the student only asked to hear it again.
  const carried=aside&&awaitingLongTurn(before)?before.at(-1)?.cue??null:null;
  let action:SpeakingAction="answer",nextPart:SpeakingPart=part;
  if(cfg().mode==="mock"&&!aside&&answered>=PLAN[part]){
   if(part===3){busy.current=false;await finishSession([...before,user]);return;}
   action="advance";nextPart=(part+1) as SpeakingPart;
  }
  changeStatus("thinking");
  try {
   const reply=await request(action,{part:nextPart,history:before,message:text,stats:user.stats});
   if(!reply)return;
   commitTurns([...turnsRef.current.map(t=>t.id===user.id?{...t,tip:reply.tip}:t),{id:nextId(),role:"assistant",content:reply.reply,part:nextPart,cue:reply.cue??carried}]);
   changeStatus("idle");busy.current=false;void afterReply(reply);
  }catch(reason){
   commitTurns(before);setDraft(text);setDraftStats(stats);changeStatus("idle");
   setError(failure(reason,"Your partner is taking longer than expected.")+" Your answer is in the box — send it again.");
  }finally{busy.current=false;}
 }

 function sessionStats(list:Turn[]):SessionStats {
  const answers=list.filter(t=>t.role==="user"),voiced=answers.filter(t=>t.stats);
  const seconds=voiced.reduce((sum,t)=>sum+(t.stats?.seconds??0),0),voicedWords=voiced.reduce((sum,t)=>sum+(t.stats?.words??0),0);
  return {answers:answers.length,voiced:voiced.length,words:answers.reduce((sum,t)=>sum+countWords(t.content),0),seconds,wpm:seconds>=10?Math.round(voicedWords/seconds*60):null,pauses:voiced.reduce((sum,t)=>sum+(t.stats?.pauses??0),0)};
 }

 async function finishSession(list=turnsRef.current) {
  if(!list.some(t=>t.role==="user")||busy.current)return;
  busy.current=true;stopVoice();recorder.current?.abort();recorder.current=null;setHint(null);setPrep(null);setError("");
  changeStatus("reporting");
  try {
   const reply=await request("report",{part:currentPart(list),history:list});
   if(!reply?.report)return;
   const stats=sessionStats(list),data=reply.report;
   setReport({data,stats});changePhase("report");setGesture({name:"ThumbsUp",id:nextId()});
   updateProgress(current=>({...current,entries:[...current.entries,{date:new Date().toISOString(),mode:cfg().mode,topic:cfg().topic,part:cfg().mode==="practice"?cfg().part:null,bands:data.bands,overall:overallBand([data.bands.fluency,data.bands.lexical,data.bands.grammar]),wpm:stats.wpm}].slice(-30)}));
   changeStatus("idle");busy.current=false;void speak(reply.reply);
  }catch(reason){changeStatus("idle");setError(failure(reason,"The report took too long.")+" Your conversation is kept — press Finish again.");}
  finally{busy.current=false;}
 }

 async function askHint() {
  if(busy.current||!turnsRef.current.length)return;
  if(recorder.current){recorder.current.abort();recorder.current=null;changeStatus("idle");setHearing(false);}
  stopVoice();busy.current=true;setHintPending(true);setError("");
  try{const reply=await request("hint",{part:currentPart(),history:turnsRef.current});if(reply?.hint)setHint(reply.hint);}
  catch(reason){setError(failure(reason,"Couldn’t load ideas right now."));}
  finally{busy.current=false;setHintPending(false);}
 }

 function redo() {
  const list=turnsRef.current,index=list.findLastIndex(t=>t.role==="user");
  if(index<0||busy.current)return;
  stopVoice();commitTurns(list.slice(0,index));setHint(null);setError("");
  setNotice("Answer that question again — try adding a reason and a personal example.");
  if(cfg().handsFree&&micConsentRef.current&&micSupported)void startListening();else answerBox.current?.focus();
 }

 // ---------- Microphone ----------
 async function startListening() {
  if(recorder.current||busy.current||!micConsentRef.current||!micSupported||phaseRef.current==="setup")return;
  if(["thinking","transcribing","reporting","listening"].includes(statusRef.current))return;
  stopVoice();setError("");setNotice("");setPrep(null);cancelStart.current=false;
  const part=currentPart(),long=awaitingLongTurn(),run=sessionRun.current;
  listenStart.current=clockNow();changeStatus("listening");
  try {
   const handle=await startRecorder(getPlayer().ensure(),{
    autoStop:cfg().handsFree,silenceMs:long?5000:part===3?2300:1800,maxMs:long?120000:90000,
    onLevel:level=>stage.current?.style.setProperty("--level",level.toFixed(3)),
    onSpeech:speaking=>{setHearing(speaking);if(!speaking)listenerNod();},
    onAutoStop:reason=>{void finishListening(reason);},
   });
   if(cancelStart.current||run!==sessionRun.current){handle.abort();changeStatus("idle");return;}
   recorder.current=handle;setRecordingKey(handle.startedAt);
  }catch(reason){
   changeStatus("idle");
   setError(reason instanceof DOMException&&reason.name==="NotAllowedError"?"Microphone permission was denied. Allow it in your browser’s site settings, or type your answer.":"Couldn’t start your microphone. Check it’s connected, or type your answer.");
  }
 }

 async function finishListening(reason:"silence"|"limit"|"quiet"|"manual") {
  const handle=recorder.current;
  if(!handle){if(statusRef.current==="listening")cancelStart.current=true;return;}
  recorder.current=null;setHearing(false);
  const run=sessionRun.current,long=awaitingLongTurn();changeStatus("transcribing");
  try {
   const recording=await handle.stop();
   if(run!==sessionRun.current)return;
   if(!recording||!recording.heardSpeech){changeStatus("idle");setNotice(reason==="quiet"?"I didn’t hear anything. Tap the mic or press Space when you’re ready.":"I didn’t catch that. Try again a little closer to the microphone.");return;}
   if(cfg().handsFree)acknowledge();
   const controller=new AbortController();transcribeAbort.current=controller;
   const response=await fetch(TRANSCRIBE_URL,{method:"POST",headers:{"Content-Type":"audio/wav"},body:encodeSpeechWav(recording.pcm),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(150000)])});
   const data=await response.json().catch(()=>({error:"Transcription failed."}));
   if(!response.ok)throw new Error(data.error||"Transcription failed.");
   if(run!==sessionRun.current)return;
   const text=String(data.text??"").trim();
   const stats:AnswerStats={seconds:Math.round(recording.seconds*10)/10,words:countWords(text),pauses:recording.pauses};
   changeStatus("idle");
   if(!text){setNotice("I couldn’t make out any words. Try again a little closer to the microphone, or type your answer.");return;}
   if(reason==="limit"&&long)setNotice("That’s two minutes — well done for keeping going.");
   if(cfg().handsFree)await submitAnswer(text,stats);
   else{setDraft(current=>[current.trim(),text].filter(Boolean).join(" ").slice(0,2000));setDraftStats(stats);answerBox.current?.focus();}
  }catch(reason){if(run===sessionRun.current){changeStatus("idle");setError(failure(reason,"Transcription took too long.")+" Try again, or type your answer.");}}
 }

 function toggleMic() {
  if(statusRef.current==="listening"){void finishListening("manual");return;}
  void startListening();
 }
 function cancelListening() {
  if(recorder.current){recorder.current.abort();recorder.current=null;setHearing(false);changeStatus("idle");}
  else if(statusRef.current==="listening")cancelStart.current=true;
 }
 function toggleMicConsent(on:boolean) {
  micConsentRef.current=on;setMicConsent(on);
  if(!on){cancelListening();return;}
  // Ask for permission during setup so the browser prompt never interrupts the conversation.
  void navigator.mediaDevices?.getUserMedia({audio:true}).then(stream=>stream.getTracks().forEach(track=>track.stop())).catch(()=>{micConsentRef.current=false;setMicConsent(false);setError("Microphone permission was denied. Allow it in your browser’s site settings, or type your answers.");});
 }
 function endPrep() {
  setPrep(null);
  if(cfg().handsFree&&micConsentRef.current&&micSupported)void startListening();
  else setNotice("Start your long turn now — you can speak for up to two minutes.");
 }
 useEffect(()=>{keys.current={space:()=>{if(phaseRef.current==="session")toggleMic();},escape:()=>{if(statusRef.current==="listening")cancelListening();else stopVoice();}};});

 function resetToSetup() {
  sessionRun.current++;stopVoice();recorder.current?.abort();recorder.current=null;chatAbort.current?.abort();transcribeAbort.current?.abort();
  busy.current=false;changeStatus("idle");commitTurns([]);changePhase("setup");setHint(null);setPrep(null);setError("");setNotice("");setDraft("");setDraftStats(null);
 }
 function leave() {
  if(turnsRef.current.some(t=>t.role==="user")&&!window.confirm("Leave now? This conversation will be discarded without a report."))return;
  resetToSetup();
 }
 function repeatQuestion() {
  const last=turnsRef.current.findLast(t=>t.role==="assistant");
  if(!last||busy.current||statusRef.current==="listening")return;
  void speak(last.content,{force:true}).then(finished=>{if(finished&&cfg().handsFree&&micConsentRef.current&&micSupported&&phaseRef.current==="session"&&prep===null)void startListening();});
 }
 function download(kind:"transcript"|"report") {
  const lines=turnsRef.current.map(t=>`${t.role==="user"?"You":speakingVoices[cfg().voice].label} (Part ${t.part}): ${t.content}${t.tip?`\n   Tip: "${t.tip.said}" → "${t.tip.better}" — ${t.tip.why}`:""}`);
  if(kind==="report"&&report){
   const r=report.data;
   lines.unshift(`IELTS Speaking Lab report — ${speakingTopics[cfg().topic]}`,`Indicative (AI, transcript-only, not official): Fluency ${r.bands.fluency} · Lexical ${r.bands.lexical} · Grammar ${r.bands.grammar} · Overall ${overallBand([r.bands.fluency,r.bands.lexical,r.bands.grammar])} (pronunciation not assessed)`,`Measured: ${report.stats.answers} answers, ${report.stats.words} words, ${report.stats.wpm??"—"} wpm, ${report.stats.pauses} long pauses`,"",r.summary,"","Strengths:",...r.strengths.map(s=>`- ${s}`),"","Fix next:",...r.fixes.map(f=>`- ${f.issue}: "${f.said}" → "${f.better}"`),"","Vocabulary:",...r.vocabulary.map(v=>`- ${v.phrase}: ${v.meaning} (${v.example})`),"",`Model answer — ${r.model.question}`,r.model.answer,"",`Next: ${r.next}`,"","Transcript:");
  }
  const url=URL.createObjectURL(new Blob([lines.join("\n\n")],{type:"text/plain;charset=utf-8"})),link=document.createElement("a");
  link.href=url;link.download=`speaking-lab-${kind}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }

 // ---------- Derived view state ----------
 const mock=settings.mode==="mock";
 const part=phase==="setup"?(mock?1:settings.part):currentPartForView(turns,settings);
 const activeCue=phase==="session"&&turns.at(-1)?.role==="assistant"?turns.at(-1)?.cue??null:null;
 const longTurn=!!activeCue;
 const mood:AvatarMood=status==="listening"?"listening":status==="speaking"?"speaking":["thinking","transcribing","reporting","voicing"].includes(status)?"thinking":"idle";
 const working=["thinking","transcribing","reporting"].includes(status);
 const micReady=micConsent&&micSupported;
 const canTalk=phase==="session"&&micReady&&!working&&prep===null&&turns.length>0;
 const lastUserIndex=turns.findLastIndex(t=>t.role==="user");
 const answeredInPart=turns.filter(t=>t.role==="user"&&t.part===part&&!t.aside).length;
 const chosen=speakingVoices[settings.voice],name=chosen.label;
 const manner=chosen.manner[0].toUpperCase()+chosen.manner.slice(1);
 const statusLine=status==="listening"?(hearing?"Listening…":longTurn?"Start whenever you’re ready":"Go ahead — I’m listening")
  :status==="transcribing"||status==="thinking"?(turns.length?`${name} is thinking`:`${name} is joining`)
  :status==="reporting"?"Writing your report":status==="voicing"?"":status==="speaking"?`${name} is speaking`
  :prep!==null?"Take a minute to plan your talk":phase==="session"?(longTurn?"Your turn — speak for one to two minutes":"Your turn"):`Hi, I’m ${name}. Ready when you are.`;
 const dockHint=status==="listening"?(settings.handsFree?"Pause when you finish · Esc to cancel":"Tap again when you finish")
  :status==="speaking"||status==="voicing"?(micReady?"Tap the mic to interrupt":"Esc to stop the voice"):prep!==null?"Your talk starts when the minute is up, or press I’m ready":micReady?"Tap the mic or press Space to answer":"Microphone is off — type your answer";

 if(!signedIn)return <div className="sl-root container page-space"><div className="sl-signin"><PartnerPortrait voice="af_heart" className="sl-signin-face"/><p className="sl-kicker">IELTS Speaking</p><h1>Sign in to practise speaking with your AI partner.</h1><p>Нэвтэрсний дараа ярианы бэлтгэлдээ шууд буцаж ирнэ.</p><Link className="button primary" href="/login?next=%2Flabs%2Fielts-speaking">Нэвтрэх →</Link></div></div>;

 return <div className={`sl-root container page-space phase-${phase}`}>
  <header className="sl-top">
   <div><p className="sl-kicker">IELTS Speaking · Experiment</p><h1>{phase==="setup"?"Speaking partner":mock?"Speaking mock test":`Talking with ${name}`}</h1></div>
   {phase!=="setup"&&mock&&<ol className="sl-steps" aria-label="Mock test progress">
    {([1,2,3] as SpeakingPart[]).map(p=><li key={p} className={phase==="report"||p<part?"done":p===part?"active":""}>Part {p}</li>)}
    <li className={phase==="report"?"active":""}>Report</li>
   </ol>}
  </header>

  <div className="sl-main">
   <section ref={stage} className={`sl-stage mood-${mood}`} style={{"--partner":partnerLooks[settings.voice].top} as CSSProperties} aria-label="Your AI speaking partner">
    <div className="sl-stage-top">
     <span className="sl-live"/><strong>{name}</strong>
     <span>{phase==="setup"?`AI speaking partner · ${chosen.accent} accent`:phase==="report"?"Report ready":`${mock?"AI examiner":"AI partner"} · Part ${part} ${PART_NAMES[part]}`}</span>
     {phase==="session"&&<em>{mock&&`Question ${Math.min(answeredInPart+1,PLAN[part])} of ${PLAN[part]} · `}<SessionClock key={sessionKey}/></em>}
    </div>
    <div className="sl-portrait">
     <SpeakingAvatar level={energy} mood={mood} gesture={gesture} voice={settings.voice}/>
     {phase==="session"&&micReady&&<div className={`sl-self ${status==="listening"?"on":""}`} aria-hidden="true"><span>You</span><div><i/><i/><i/><i/><i/></div></div>}
    </div>
    <div className="sl-caption" aria-live="polite">{status==="speaking"&&caption&&settings.captions?<p>{caption}</p>:<p className="sl-status">{(working||status==="voicing")&&<i className="sl-dots"><b/><b/><b/></i>}{statusLine}</p>}</div>
    {phase==="setup"&&<div className="sl-pick">
     <div className="sl-partners" role="radiogroup" aria-label="Speaking partner">
      {(Object.entries(speakingVoices) as [SpeakingVoice,(typeof speakingVoices)[SpeakingVoice]][]).map(([id,v])=><button type="button" role="radio" key={id} aria-checked={settings.voice===id} aria-label={`${v.label}, ${v.accent}`} onClick={()=>{update({voice:id});setGesture({name:"Wave",id:nextId()});}}><PartnerPortrait voice={id}/><span>{v.label}</span></button>)}
     </div>
     <p>{manner}. <button type="button" className="sl-link" disabled={previewing} onClick={()=>void preview(settings.voice)}>{previewing?"Playing…":`▶ Hear ${name}`}</button></p>
     {notice&&<p className="sl-notice" role="status">{notice}</p>}
    </div>}
    {phase==="session"&&<div className="sl-dock">
     {status==="listening"&&recordingKey>0&&<Elapsed key={recordingKey} target={TARGET_SECONDS[longTurn?2:part===2?1:part]} limit={longTurn?120:90}/>}
     <div className="sl-controls">
      <button type="button" className="sl-ctl" aria-pressed={settings.captions} onClick={()=>update({captions:!settings.captions})}><i><Glyph name="captions"/></i>Captions</button>
      <button type="button" className="sl-ctl" aria-pressed={settings.voiceOn} aria-label={settings.voiceOn?`Mute ${name}`:`Unmute ${name}`} onClick={()=>{if(settings.voiceOn)stopVoice();update({voiceOn:!settings.voiceOn});}}><i><Glyph name={settings.voiceOn?"sound":"muted"}/></i>Voice</button>
      {micReady&&<div className={`sl-mic-wrap ${status==="listening"?"on":""} ${hearing?"hearing":""}`}>
       <button type="button" className="sl-mic" onClick={toggleMic} disabled={!canTalk&&status!=="listening"} aria-pressed={status==="listening"} aria-label={status==="listening"?"Stop recording and send":"Start speaking"}><Glyph name={status==="listening"?"stop":"mic"}/></button>
      </div>}
      <button type="button" className="sl-ctl" disabled={working||status==="listening"||!turns.length} onClick={repeatQuestion}><i><Glyph name="repeat"/></i>Repeat</button>
      {!mock&&<button type="button" className="sl-ctl" disabled={working||hintPending||!turns.length} onClick={()=>void askHint()}><i><Glyph name="idea"/></i>{hintPending?"Finding…":"Ideas"}</button>}
     </div>
     <p className="sl-dock-hint">{dockHint}</p>
    </div>}
   </section>

   <section className="sl-panel">
    {phase==="setup"&&renderSetup()}
    {phase==="session"&&<div className="sl-session">
     <div className="sl-session-head">
      <div><strong>{speakingTopics[settings.topic]}</strong><span>{mock?"Mock test":`Practice · Part ${part}`} · Target {settings.target.toFixed(1)}</span></div>
      <div>
       <button type="button" className="sl-link" onClick={leave}>Leave</button>
       <button type="button" className="button secondary sl-small" disabled={working||lastUserIndex<0} onClick={()=>void finishSession()}>Finish & report <CreditCost action="speaking-report" english compact/></button>
      </div>
     </div>
     {activeCue&&<div className="sl-task">
      <div className="sl-task-head">
       <span className="sl-cue-label">Cue card · Part 2</span>
       {prep!==null?<span className="sl-prep">Preparation <Countdown key={prep} seconds={60} onDone={endPrep}/><button type="button" onClick={endPrep}>I’m ready</button></span>:<span className="sl-task-go">Speak for one to two minutes</span>}
      </div>
      <h3>{activeCue.title}</h3>
      <p>You should say:</p><ul>{activeCue.points.map(point=><li key={point}>{point}</li>)}</ul>
      <p className="sl-cue-close">{activeCue.closing}</p>
      <label className="sl-notes">Your notes (only on this page)<textarea rows={3} value={notes} maxLength={600} onChange={event=>setNotes(event.target.value)} placeholder="Key words: who · when · why it matters…"/></label>
     </div>}
     <div className="sl-transcript" ref={transcript} role="log" aria-label="Conversation">
      {mock&&<p className="sl-exam-note">Exam conditions — corrections and ideas come with your report.</p>}
      {turns.map((turn,index)=><article key={turn.id} className={`sl-msg ${turn.role}`}>
       {turn.role==="assistant"?<>
        <div className="sl-msg-meta"><strong>{name}</strong>{turn.cue&&<span className="sl-chip">Cue card</span>}</div>
        <p>{turn.content}</p>
        {turn.cue&&turn.cue!==activeCue&&<p className="sl-cue-line">{turn.cue.title}</p>}
       </>:<>
        <div className="sl-msg-meta"><strong>You</strong>{turn.stats&&<span className="sl-chip" title="Measured from your recording">{Math.round(turn.stats.seconds)}s · {turn.stats.words} words{turn.stats.seconds>=4?` · ${Math.round(turn.stats.words/turn.stats.seconds*60)} wpm`:""}{turn.stats.pauses?` · ${turn.stats.pauses} long pause${turn.stats.pauses>1?"s":""}`:""}</span>}</div>
        <p>{turn.content}</p>
        {!mock&&turn.tip&&<div className="sl-tip">
         <div className="sl-diff"><s>{turn.tip.said}</s><span aria-hidden="true">→</span><ins>{turn.tip.better}</ins></div>
         <small>{turn.tip.why}</small>
         <button type="button" className="sl-link" disabled={saved.has(turn.tip.better.trim().toLowerCase())} onClick={()=>savePhrase(turn.tip!.better,turn.tip!.why)}>{saved.has(turn.tip.better.trim().toLowerCase())?"Saved ✓":"+ Phrasebook"}</button>
        </div>}
        {!mock&&index===lastUserIndex&&index===turns.length-2&&!working&&<button type="button" className="sl-link sl-redo" onClick={redo}>↺ Try this answer again</button>}
       </>}
      </article>)}
      {(status==="thinking"||status==="reporting")&&<p className="sl-typing"><i className="sl-dots"><b/><b/><b/></i>{status==="reporting"?"Writing your report — about 20 seconds":`${name} is thinking`}</p>}
     </div>
     {hint&&<div className="sl-hint">
      <div><strong>Ideas to get you started</strong><button type="button" className="sl-icon" aria-label="Close ideas" onClick={()=>setHint(null)}>×</button></div>
      <ul>{hint.ideas.map(idea=><li key={idea}>{idea}</li>)}</ul>
      <div className="sl-phrases">{hint.phrases.map(phrase=><button type="button" key={phrase} onClick={()=>{setDraft(current=>(current.trim()?current.trim()+" ":"")+phrase);answerBox.current?.focus();}}>{phrase}</button>)}</div>
     </div>}
     {notice&&<p className="sl-notice" role="status">{notice}</p>}
     {error&&<p className="error-message" role="alert">{error}</p>}
     <form className="sl-compose" onSubmit={event=>{event.preventDefault();void submitAnswer(draft,draftStats);}}>
      <div className="sl-compose-box">
       <label htmlFor="speaking-answer" className="sr-only">Your answer</label>
       <textarea id="speaking-answer" ref={answerBox} rows={micReady?1:2} maxLength={2000} value={draft} disabled={working||status==="listening"} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void submitAnswer(draft,draftStats);}}} placeholder={micReady?"Or type your answer and press Enter":"Type your answer and press Enter"}/>
       <button type="submit" className="sl-send" aria-label="Send answer" disabled={working||!draft.trim()||status==="listening"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12m-5-5 5 5-5 5"/></svg></button>
      </div>
      <CreditCost action="speaking-turn" english suffix="per reply"/>
     </form>
    </div>}
    {phase==="report"&&report&&<SpeakingReportView report={report.data} stats={report.stats} target={settings.target} language={settings.language} entries={progress.entries} saved={saved}
     voice={settings.voice} mock={mock} review={turns}
     onSave={savePhrase} onListen={text=>void speak(text,{force:true})} listening={status==="voicing"||status==="speaking"}
     onNew={resetToSetup} onAgain={()=>void startSession()} onDownload={()=>download("report")}/>}
    {phase==="report"&&!report&&<p className="sl-notice">No report yet.</p>}
   </section>
  </div>

  <footer className="sl-foot">
   <p>Experimental pilot · Nothing is saved to your account; practice history and phrasebook stay in this browser. Synthetic AI voices (Kokoro-82M, Apache-2.0) and Whisper (MIT) transcription run on the application server. AI estimates are not official IELTS scores.</p>
  </footer>
 </div>;

 // Setup screen shares the component's state and handlers; called as a function, not a component.
 function renderSetup() {
  return <div className="sl-setup">
   <div className="sl-field">
    <span>What would you like to do?</span>
    <div className="sl-modes" role="radiogroup" aria-label="Session type">
     {MODES.map(([value,tag,title,text])=><button type="button" role="radio" className="sl-mode" aria-checked={settings.mode===value} key={value} onClick={()=>update({mode:value})}><em>{tag}</em><strong>{title}</strong><small>{text}</small></button>)}
    </div>
   </div>
   {!mock&&<div className="sl-field"><span>Part</span><div className="sl-seg">{([1,2,3] as SpeakingPart[]).map(p=><button type="button" key={p} aria-pressed={settings.part===p} onClick={()=>update({part:p})}>{p} · {PART_NAMES[p]}</button>)}</div></div>}
   <div className="sl-field">
    <span>Topic</span>
    <div className="sl-chips" role="radiogroup" aria-label="Topic">{(Object.entries(speakingTopics) as [SpeakingTopic,string][]).map(([id,title])=><button type="button" role="radio" key={id} aria-checked={settings.topic===id} onClick={()=>update({topic:id})}>{title}</button>)}</div>
   </div>
   <div className="sl-field">
    <span>Target band</span>
    <div className="sl-seg" role="radiogroup" aria-label="Target band">{speakingTargets.map(t=><button type="button" role="radio" key={t} aria-checked={settings.target===t} onClick={()=>update({target:t})}>{t.toFixed(1)}</button>)}</div>
   </div>
   <details className="sl-more">
    <summary>More settings</summary>
    <div className="sl-toggles">
     <label className="sl-switch"><input type="checkbox" checked={settings.handsFree} onChange={event=>update({handsFree:event.target.checked})}/><span><strong>Hands-free</strong><small>Mic opens after your partner speaks; pause to send</small></span></label>
     <label className="sl-switch"><input type="checkbox" checked={settings.voiceOn} onChange={event=>update({voiceOn:event.target.checked})}/><span><strong>Partner speaks aloud</strong><small>Turn off to read only</small></span></label>
     <label className="sl-switch"><input type="checkbox" checked={settings.captions} onChange={event=>update({captions:event.target.checked})}/><span><strong>Live captions</strong><small>Show the words under your partner as they speak</small></span></label>
     <label className="sl-select">Pace<select value={settings.speed} onChange={event=>update({speed:Number(event.target.value) as SpeakingSpeed})}>{speakingSpeeds.map(s=><option key={s} value={s}>{s===1?"Natural":s===.95?"Slightly slower":"Slower"}</option>)}</select></label>
     <label className="sl-select">Voice engine<select value={settings.engine} onChange={event=>update({engine:event.target.value as "neural"|"device"})}><option value="neural">Natural (Kokoro)</option><option value="device">Device voice</option></select></label>
     <label className="sl-select">Feedback in<select value={settings.language} onChange={event=>update({language:event.target.value as "en"|"mn"})}><option value="en">English</option><option value="mn">Монгол</option></select></label>
    </div>
   </details>
   <div className="sl-consents">
    <label><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>My answers (as text) are sent to an AI service to generate replies and feedback. I won’t share personal details.</label>
    <label><input type="checkbox" checked={micConsent} disabled={!micSupported} onChange={event=>toggleMicConsent(event.target.checked)}/>Use my microphone. Recordings are sent to the application server for transcription and never saved.</label>
    {!micSupported&&<small>Microphone recording isn’t available in this browser — try Chrome or Edge, or type your answers.</small>}
   </div>
   {error&&<p className="error-message" role="alert">{error}</p>}
   <button type="button" className="button primary sl-start" disabled={!consent||status==="thinking"} onClick={()=>void startSession()}>{status==="thinking"?`Calling ${name}…`:mock?"Start mock test →":"Start practice →"}</button>
   <p className="sl-credit-note"><CreditCost action="speaking-turn" english suffix="per partner reply"/> <CreditCost action="speaking-report" english suffix="for the report"/></p>
   {(progress.entries.length>0||progress.phrases.length>0)&&<div className="sl-progress">
    {progress.entries.length>0&&<div><h3>Recent sessions</h3><Trend entries={progress.entries}/>{progress.entries.length===1&&<p className="sl-muted">First report: {progress.entries[0].overall} — come back tomorrow to see your trend.</p>}</div>}
    {progress.phrases.length>0&&<details><summary>Your phrasebook ({progress.phrases.length})</summary><ul>{progress.phrases.slice().reverse().map(p=><li key={p.id}><strong>{p.text}</strong><small>{p.note}</small><button type="button" className="sl-icon" aria-label={`Remove ${p.text}`} onClick={()=>removePhrase(p.id)}>×</button></li>)}</ul></details>}
   </div>}
  </div>;
 }
}

function currentPartForView(turns:Turn[],settings:Settings):SpeakingPart {
 return [...turns].reverse().find(t=>t.role==="assistant")?.part??(settings.mode==="mock"?1:settings.part);
}
