"use client";
import {useEffect,useMemo,useRef,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {encodeSpeechWav} from "./pcm";
import {SpeakingAvatar,type AvatarGesture,type AvatarMood} from "./avatar";
import {VoicePlayer,startRecorder,type RecorderHandle} from "./audio";
import {
 HISTORY_LIMIT,REPORT_HISTORY_LIMIT,countWords,overallBand,speakingSpeeds,speakingTargets,speakingTopics,speakingVoices,
 type AnswerStats,type SpeakingAction,type SpeakingCue,type SpeakingHint,type SpeakingPart,type SpeakingReply,type SpeakingReport,
 type SpeakingSpeed,type SpeakingTip,type SpeakingTopic,type SpeakingVoice,
} from "./contracts";
import {getProgress,getServerProgress,removePhrase,savePhrase,subscribeProgress,updateProgress} from "./progress";
import {SpeakingReportView,Trend,type SessionStats} from "./report";

type Turn={id:number;role:"user"|"assistant";content:string;part:SpeakingPart;tip?:SpeakingTip|null;cue?:SpeakingCue|null;stats?:AnswerStats|null};
type Status="idle"|"thinking"|"voicing"|"speaking"|"listening"|"transcribing"|"reporting";
type Settings={mode:"mock"|"practice";part:SpeakingPart;topic:SpeakingTopic;target:number;language:"en"|"mn";voice:SpeakingVoice;speed:SpeakingSpeed;voiceOn:boolean;engine:"neural"|"device";handsFree:boolean};

const CHAT_URL="/api/labs/ielts-speaking",VOICE_URL="/api/labs/ielts-speaking/voice",TRANSCRIBE_URL="/api/labs/ielts-speaking/transcribe";
// Answers per part in a full mock before moving on (Part 2 = long turn + one rounding-off question).
const PLAN:Record<SpeakingPart,number>={1:4,2:2,3:4};
const TARGET_SECONDS:Record<SpeakingPart,[number,number]>={1:[15,35],2:[60,120],3:[30,60]};
const PART_NAMES:Record<SpeakingPart,string>={1:"Interview",2:"Long turn",3:"Discussion"};
const DEFAULTS:Settings={mode:"mock",part:1,topic:"everyday",target:6.5,language:"en",voice:"af_heart",speed:1,voiceOn:true,engine:"neural",handsFree:true};
const subscribeNothing=()=>()=>{};
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

 const micSupported=useSyncExternalStore(subscribeNothing,micAvailable,()=>false);
 const progress=useSyncExternalStore(subscribeProgress,getProgress,getServerProgress);
 const saved=useMemo(()=>new Set(progress.phrases.map(p=>p.id)),[progress.phrases]);

 const energy=useRef(0),player=useRef<VoicePlayer|null>(null),recorder=useRef<RecorderHandle|null>(null);
 const turnsRef=useRef<Turn[]>([]),statusRef=useRef<Status>("idle"),busy=useRef(false),sessionRun=useRef(0),speechRun=useRef(0),ids=useRef(0),startPart=useRef<SpeakingPart>(1);
 const chatAbort=useRef<AbortController|null>(null),voiceAbort=useRef<AbortController|null>(null),transcribeAbort=useRef<AbortController|null>(null);
 const deviceStop=useRef<(()=>void)|null>(null),cancelStart=useRef(false),levelRing=useRef<HTMLDivElement>(null),transcript=useRef<HTMLDivElement>(null),answerBox=useRef<HTMLTextAreaElement>(null);
 const settingsRef=useRef<Settings>(DEFAULTS),phaseRef=useRef<"setup"|"session"|"report">("setup"),micConsentRef=useRef(false);
 const keys=useRef<{space:()=>void;escape:()=>void}>({space:()=>{},escape:()=>{}});

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
   const voices=synth.getVoices();utterance.voice=voices.find(v=>v.lang===utterance.lang)??voices.find(v=>v.lang.startsWith("en"))??null;
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
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Natural voice is unavailable.");}
   const result=await getPlayer().play(response,{onStart:()=>{if(run===speechRun.current)changeStatus("speaking");},onCaption:line=>{if(run===speechRun.current)setCaption(line);}});
   return result==="ended"&&run===speechRun.current;
  }catch(reason){
   if(run!==speechRun.current||(reason instanceof DOMException&&reason.name==="AbortError"))return false;
   setNotice("Natural voice is unavailable right now — using your device voice.");
   return await speakDevice(text,run,voice);
  }finally{
   if(run===speechRun.current){setCaption("");if(statusRef.current==="voicing"||statusRef.current==="speaking")changeStatus("idle");}
  }
 }
 async function preview(voice:SpeakingVoice) {
  setPreviewing(true);getPlayer().ensure();
  try{await speak("Hi, I'm Milo. Take your time — I'm here to listen.",{force:true,voice});}finally{setPreviewing(false);}
 }

 // ---------- Model requests ----------
 async function request(action:SpeakingAction,options:{part:SpeakingPart;history:Turn[];message?:string;stats?:AnswerStats|null}):Promise<SpeakingReply|null> {
  const controller=new AbortController();chatAbort.current=controller;const run=sessionRun.current;
  const limit=action==="report"?REPORT_HISTORY_LIMIT:HISTORY_LIMIT;
  const timing=action==="report"?options.history.flatMap(t=>t.role==="user"&&t.stats?[{part:t.part,seconds:t.stats.seconds,words:t.stats.words,pauses:t.stats.pauses}]:[]).slice(-REPORT_HISTORY_LIMIT):[];
  const body={part:options.part,topic:cfg().topic,target:cfg().target,language:cfg().language,action,message:options.message??"",history:options.history.slice(-limit).map(({role,content})=>({role,content})),stats:options.stats??null,timing};
  const response=await fetch(CHAT_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(action==="report"?175000:70000)])});
  const data=await response.json().catch(()=>({error:"Milo couldn’t reply."}));
  if(!response.ok)throw new Error(data.error||"Milo couldn’t reply.");
  return run===sessionRun.current?data as SpeakingReply:null;
 }

 async function afterReply(reply:SpeakingReply) {
  const run=sessionRun.current,finished=await speak(reply.reply);
  if(run!==sessionRun.current)return;
  if(reply.cue){setNotes("");setPrep(nextId());return;}
  if(finished&&cfg().handsFree&&micConsentRef.current&&micSupported)void startListening();
 }

 async function startSession() {
  if(!consent||busy.current)return;
  getPlayer().ensure();stopVoice();recorder.current?.abort();recorder.current=null;
  sessionRun.current++;commitTurns([]);setReport(null);changePhase("session");setError("");setNotice("");setHint(null);setPrep(null);setDraft("");setDraftStats(null);
  const part:SpeakingPart=cfg().mode==="mock"?1:cfg().part;startPart.current=part;
  busy.current=true;changeStatus("thinking");
  try {
   const reply=await request("start",{part,history:[]});if(!reply)return;
   commitTurns([{id:nextId(),role:"assistant",content:reply.reply,part,cue:reply.cue}]);
   changeStatus("idle");busy.current=false;void afterReply(reply);
  }catch(reason){changeStatus("idle");setError(failure(reason,"Milo is taking too long to join. Please try again."));}
  finally{busy.current=false;}
 }

 async function submitAnswer(raw:string,stats:AnswerStats|null) {
  const text=raw.trim().slice(0,2000);if(!text||busy.current||phaseRef.current!=="session")return;
  busy.current=true;stopVoice();
  const before=turnsRef.current,part=currentPart(before);
  const user:Turn={id:nextId(),role:"user",content:text,part,stats:stats?{...stats,words:countWords(text)}:null,tip:null};
  commitTurns([...before,user]);setDraft("");setDraftStats(null);setHint(null);setError("");setNotice("");setPrep(null);
  const answered=before.filter(t=>t.role==="user"&&t.part===part).length+1;
  let action:SpeakingAction="answer",nextPart:SpeakingPart=part;
  if(cfg().mode==="mock"&&answered>=PLAN[part]){
   if(part===3){busy.current=false;await finishSession([...before,user]);return;}
   action="advance";nextPart=(part+1) as SpeakingPart;
  }
  changeStatus("thinking");
  try {
   const reply=await request(action,{part:nextPart,history:before,message:text,stats:user.stats});
   if(!reply)return;
   commitTurns([...turnsRef.current.map(t=>t.id===user.id?{...t,tip:reply.tip}:t),{id:nextId(),role:"assistant",content:reply.reply,part:nextPart,cue:reply.cue}]);
   if(!reply.tip)setGesture({name:"Yes",id:nextId()});
   changeStatus("idle");busy.current=false;void afterReply(reply);
  }catch(reason){
   commitTurns(before);setDraft(text);setDraftStats(stats);changeStatus("idle");
   setError(failure(reason,"Milo is taking longer than expected.")+" Your answer is in the box — send it again.");
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
  changeStatus("listening");
  try {
   const handle=await startRecorder(getPlayer().ensure(),{
    autoStop:cfg().handsFree,silenceMs:long?5000:part===3?2300:1800,maxMs:long?120000:90000,
    onLevel:level=>levelRing.current?.style.setProperty("--level",level.toFixed(3)),
    onSpeech:setHearing,
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
   const controller=new AbortController();transcribeAbort.current=controller;
   const response=await fetch(TRANSCRIBE_URL,{method:"POST",headers:{"Content-Type":"audio/wav"},body:encodeSpeechWav(recording.pcm),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(150000)])});
   const data=await response.json().catch(()=>({error:"Transcription failed."}));
   if(!response.ok)throw new Error(data.error||"Transcription failed.");
   if(run!==sessionRun.current)return;
   const text=String(data.text??"").trim();
   const stats:AnswerStats={seconds:Math.round(recording.seconds*10)/10,words:countWords(text),pauses:recording.pauses};
   changeStatus("idle");
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
 function download(kind:"transcript"|"report") {
  const lines=turnsRef.current.map(t=>`${t.role==="user"?"You":"Milo"} (Part ${t.part}): ${t.content}${t.tip?`\n   Tip: "${t.tip.said}" → "${t.tip.better}" — ${t.tip.why}`:""}`);
  if(kind==="report"&&report){
   const r=report.data;
   lines.unshift(`IELTS Speaking Lab report — ${speakingTopics[cfg().topic]}`,`Indicative (AI, transcript-only, not official): Fluency ${r.bands.fluency} · Lexical ${r.bands.lexical} · Grammar ${r.bands.grammar} · Overall ${overallBand([r.bands.fluency,r.bands.lexical,r.bands.grammar])} (pronunciation not assessed)`,`Measured: ${report.stats.answers} answers, ${report.stats.words} words, ${report.stats.wpm??"—"} wpm, ${report.stats.pauses} long pauses`,"",r.summary,"","Strengths:",...r.strengths.map(s=>`- ${s}`),"","Fix next:",...r.fixes.map(f=>`- ${f.issue}: "${f.said}" → "${f.better}"`),"","Vocabulary:",...r.vocabulary.map(v=>`- ${v.phrase}: ${v.meaning} (${v.example})`),"",`Model answer — ${r.model.question}`,r.model.answer,"",`Next: ${r.next}`,"","Transcript:");
  }
  const url=URL.createObjectURL(new Blob([lines.join("\n\n")],{type:"text/plain;charset=utf-8"})),link=document.createElement("a");
  link.href=url;link.download=`speaking-lab-${kind}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }

 // ---------- Derived view state ----------
 const part=phase==="setup"?(settings.mode==="mock"?1:settings.part):currentPartForView(turns,settings);
 const longTurn=phase==="session"&&!!turns.at(-1)?.cue&&turns.at(-1)?.role==="assistant";
 const mood:AvatarMood=status==="listening"?"listening":status==="speaking"?"speaking":["thinking","transcribing","reporting","voicing"].includes(status)?"thinking":"idle";
 const working=["thinking","transcribing","reporting"].includes(status);
 const canTalk=phase==="session"&&micConsent&&micSupported&&!working&&prep===null&&turns.length>0;
 const lastUserIndex=turns.findLastIndex(t=>t.role==="user");
 const answeredInPart=turns.filter(t=>t.role==="user"&&t.part===part).length;
 const statusLine=status==="listening"?(hearing?"I’m listening…":"Go ahead — I’m listening")
  :status==="transcribing"?"Catching your words…":status==="thinking"?(turns.length?"Milo is thinking…":"Milo is joining…")
  :status==="reporting"?"Writing your report…":status==="voicing"?"…":status==="speaking"?"":prep!==null?"Prepare your talk — make a few notes"
  :phase==="session"?(micConsent&&micSupported?"Your turn — tap the mic or press Space":"Your turn — type your answer below"):phase==="report"?"Session complete":"Ready when you are";

 if(!signedIn)return <div className="sl-root container page-space"><div className="sl-signin"><p className="sl-kicker">IELTS Speaking Lab</p><h1>Sign in to practise speaking with Milo.</h1><p>Нэвтэрсний дараа ярианы бэлтгэлдээ шууд буцаж ирнэ.</p><Link className="button primary" href="/login?next=%2Flabs%2Fielts-speaking">Нэвтрэх →</Link></div></div>;

 return <div className="sl-root container page-space">
  <header className="sl-top">
   <div><p className="sl-kicker">Experiment · IELTS Speaking Lab</p><h1>Speak first. <span>Perfect it after.</span></h1></div>
   {phase!=="setup"&&settings.mode==="mock"&&<ol className="sl-steps" aria-label="Mock test progress">
    {([1,2,3] as SpeakingPart[]).map(p=><li key={p} className={phase==="report"||p<part?"done":p===part?"active":""}><span>{p}</span>{PART_NAMES[p]}</li>)}
    <li className={phase==="report"?"active":""}><span>★</span>Report</li>
   </ol>}
  </header>

  <div className="sl-main">
   <section className={`sl-stage mood-${mood}`} aria-label="Your AI speaking partner">
    <div className="sl-stage-top"><span className="sl-live"/>{phase==="setup"?"AI speaking partner":phase==="report"?"Report ready":`Part ${part} · ${PART_NAMES[part]}`}{phase==="session"&&settings.mode==="mock"&&<em>{Math.min(answeredInPart+1,PLAN[part])}/{PLAN[part]}</em>}</div>
    <SpeakingAvatar level={energy} mood={mood} gesture={gesture}/>
    <div className="sl-caption" aria-live="polite">{status==="speaking"&&caption?<p>{caption}</p>:<p className="sl-status">{working&&<i className="sl-dots"><b/><b/><b/></i>}{statusLine}</p>}</div>
    <div className="sl-dock">
     {prep!==null&&<div className="sl-prep"><span>Preparation</span><Countdown key={prep} seconds={60} onDone={endPrep}/><button type="button" onClick={endPrep}>I’m ready</button></div>}
     {status==="listening"&&recordingKey>0&&<Elapsed key={recordingKey} target={TARGET_SECONDS[longTurn?2:part===2?1:part]} limit={longTurn?120:90}/>}
     <div className={`sl-mic-wrap ${status==="listening"?"on":""} ${hearing?"hearing":""}`} ref={levelRing}>
      <button type="button" className="sl-mic" onClick={toggleMic} disabled={!canTalk&&status!=="listening"} aria-pressed={status==="listening"} aria-label={status==="listening"?"Stop recording and send":"Start speaking"}>
       {status==="listening"?<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>:<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1a7 7 0 0 0 6-6.9h-2Z"/></svg>}
      </button>
     </div>
     <p className="sl-dock-hint">{phase!=="session"&&status!=="speaking"&&status!=="voicing"?(phase==="report"?"Great work today":micConsent?"Mic ready":"Enable the microphone below to talk"):status==="listening"?(settings.handsFree?"Pause to finish · Esc to cancel":"Tap again when you finish"):(status==="speaking"||status==="voicing")?"Tap the mic to interrupt":micConsent?"Space = talk · Esc = stop":"Microphone is off — enable it in setup"}</p>
    </div>
   </section>

   <section className="sl-panel">
    {phase==="setup"&&renderSetup()}
    {phase==="session"&&<div className="sl-session">
     <div className="sl-session-head">
      <div><strong>{speakingTopics[settings.topic]}</strong><span>Target {settings.target} · {settings.handsFree?"Hands-free":"Push to talk"}</span></div>
      <div>
       <button type="button" className="sl-link" onClick={()=>{if(settings.voiceOn)stopVoice();update({voiceOn:!settings.voiceOn});}}>{settings.voiceOn?"🔊 Voice on":"🔇 Voice off"}</button>
       <button type="button" className="button secondary sl-small" disabled={working||lastUserIndex<0} onClick={()=>void finishSession()}>Finish & report</button>
      </div>
     </div>
     <div className="sl-transcript" ref={transcript} role="log" aria-label="Conversation">
      {turns.map((turn,index)=><article key={turn.id} className={`sl-msg ${turn.role}`}>
       {turn.role==="assistant"?<>
        <div className="sl-msg-meta"><strong>Milo</strong><button type="button" className="sl-icon" aria-label="Replay this line" onClick={()=>void speak(turn.content,{force:true})} disabled={working}>↻</button></div>
        <p>{turn.content}</p>
        {turn.cue&&<div className="sl-cue">
         <span className="sl-cue-label">Cue card · Part 2</span>
         <h3>{turn.cue.title}</h3>
         <p>You should say:</p><ul>{turn.cue.points.map(point=><li key={point}>{point}</li>)}</ul>
         <p className="sl-cue-close">{turn.cue.closing}</p>
         {index===turns.length-1&&<label className="sl-notes">Your notes (only on this page)<textarea rows={3} value={notes} maxLength={600} onChange={event=>setNotes(event.target.value)} placeholder="Key words: who · when · why it matters…"/></label>}
        </div>}
       </>:<>
        <div className="sl-msg-meta"><strong>You</strong>{turn.stats&&<span className="sl-chip" title="Measured from your recording">{Math.round(turn.stats.seconds)}s · {turn.stats.words} words{turn.stats.seconds>=4?` · ${Math.round(turn.stats.words/turn.stats.seconds*60)} wpm`:""}{turn.stats.pauses?` · ${turn.stats.pauses} long pause${turn.stats.pauses>1?"s":""}`:""}</span>}</div>
        <p>{turn.content}</p>
        {turn.tip&&<div className="sl-tip">
         <span>💡 Quick upgrade</span>
         <div className="sl-diff"><s>{turn.tip.said}</s><span aria-hidden="true">→</span><ins>{turn.tip.better}</ins></div>
         <small>{turn.tip.why}</small>
         <button type="button" className="sl-link" disabled={saved.has(turn.tip.better.trim().toLowerCase())} onClick={()=>savePhrase(turn.tip!.better,turn.tip!.why)}>{saved.has(turn.tip.better.trim().toLowerCase())?"Saved ✓":"+ Phrasebook"}</button>
        </div>}
        {index===lastUserIndex&&index===turns.length-2&&!working&&<button type="button" className="sl-link sl-redo" onClick={redo}>↺ Answer this again, better</button>}
       </>}
      </article>)}
      {(status==="thinking"||status==="reporting")&&<p className="sl-typing"><i className="sl-dots"><b/><b/><b/></i>{status==="reporting"?"Milo is writing your report — about 20 seconds":"Milo is thinking"}</p>}
     </div>
     {hint&&<div className="sl-hint">
      <div><strong>Ideas to get you started</strong><button type="button" className="sl-icon" aria-label="Close ideas" onClick={()=>setHint(null)}>×</button></div>
      <ul>{hint.ideas.map(idea=><li key={idea}>{idea}</li>)}</ul>
      <p>Useful phrases</p>
      <div className="sl-phrases">{hint.phrases.map(phrase=><button type="button" key={phrase} onClick={()=>{setDraft(current=>(current.trim()?current.trim()+" ":"")+phrase);answerBox.current?.focus();}}>{phrase}</button>)}</div>
     </div>}
     {notice&&<p className="sl-notice" role="status">{notice}</p>}
     {error&&<p className="error-message" role="alert">{error}</p>}
     <form className="sl-compose" onSubmit={event=>{event.preventDefault();void submitAnswer(draft,draftStats);}}>
      <label htmlFor="speaking-answer" className="sr-only">Your answer</label>
      <textarea id="speaking-answer" ref={answerBox} rows={2} maxLength={2000} value={draft} disabled={working||status==="listening"} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void submitAnswer(draft,draftStats);}}} placeholder={micConsent?"Speak with the mic — or type here and press Enter":"Type your answer and press Enter"}/>
      <div className="sl-compose-actions">
       <button type="button" className="sl-link" disabled={working||hintPending||!turns.length} onClick={()=>void askHint()}>{hintPending?"Finding ideas…":"💭 I’m stuck"}</button>
       <button type="submit" className="button primary sl-small" disabled={working||!draft.trim()||status==="listening"}>Send ↵</button>
      </div>
     </form>
    </div>}
    {phase==="report"&&report&&<SpeakingReportView report={report.data} stats={report.stats} target={settings.target} language={settings.language} entries={progress.entries} saved={saved}
     onSave={savePhrase} onListen={text=>void speak(text,{force:true})} listening={status==="voicing"||status==="speaking"}
     onNew={resetToSetup} onAgain={()=>void startSession()} onDownload={()=>download("report")}/>}
    {phase==="report"&&!report&&<p className="sl-notice">No report yet.</p>}
   </section>
  </div>

  <footer className="sl-foot">
   <p>Isolated experimental pilot · Nothing is saved to your account. Practice history and phrasebook stay in this browser. Synthetic AI voices; AI estimates are not official IELTS scores.</p>
   <details><summary>Credits</summary><p>RobotExpressive by Tomás Laulhé (Quaternius), modified by Don McCurdy, CC0. Kokoro-82M (Apache-2.0) voices and Whisper (MIT) transcription run on the application server.</p></details>
  </footer>
 </div>;

 // Setup screen shares the component's state and handlers; called as a function, not a component.
 function renderSetup() {
  return <div className="sl-setup">
   <div className="sl-setup-head"><h2>Set up your session</h2><p>Milo talks with you like a real examiner, then shows you exactly how to improve.</p></div>
   <div className="sl-modes" role="radiogroup" aria-label="Session type">
    {([["mock","Full mock test","Parts 1 → 2 → 3 · about 12 minutes · band report"],["practice","Practise one part","Unlimited questions · finish whenever you like"]] as const).map(([value,title,sub])=>
     <button type="button" role="radio" aria-checked={settings.mode===value} key={value} className={settings.mode===value?"on":""} onClick={()=>update({mode:value})}><strong>{title}</strong><span>{sub}</span></button>)}
   </div>
   {settings.mode==="practice"&&<div className="sl-field"><span>Part</span><div className="sl-seg">{([1,2,3] as SpeakingPart[]).map(p=><button type="button" key={p} aria-pressed={settings.part===p} onClick={()=>update({part:p})}>Part {p} · {PART_NAMES[p]}</button>)}</div></div>}
   <div className="sl-field"><span>Topic</span><div className="sl-chips">{(Object.entries(speakingTopics) as [SpeakingTopic,string][]).map(([id,title])=><button type="button" key={id} aria-pressed={settings.topic===id} onClick={()=>update({topic:id})}>{title}</button>)}</div></div>
   <div className="sl-field"><span>Target band</span><div className="sl-seg">{speakingTargets.map(t=><button type="button" key={t} aria-pressed={settings.target===t} onClick={()=>update({target:t})}>{t}</button>)}</div></div>
   <div className="sl-field"><span>Milo’s voice</span><div className="sl-voices">{(Object.entries(speakingVoices) as [SpeakingVoice,(typeof speakingVoices)[SpeakingVoice]][]).map(([id,v])=>
    <div key={id} className={settings.voice===id?"on":""}><button type="button" aria-pressed={settings.voice===id} onClick={()=>update({voice:id})}><strong>{v.label}</strong><span>{v.accent} · {v.note}</span></button><button type="button" className="sl-icon" aria-label={`Preview ${v.label}`} disabled={previewing} onClick={()=>void preview(id)}>▶</button></div>)}</div></div>
   <div className="sl-toggles">
    <label className="sl-switch"><input type="checkbox" checked={settings.handsFree} onChange={event=>update({handsFree:event.target.checked})}/><span><strong>Hands-free conversation</strong><small>Mic opens after Milo speaks; pause to send</small></span></label>
    <label className="sl-switch"><input type="checkbox" checked={settings.voiceOn} onChange={event=>update({voiceOn:event.target.checked})}/><span><strong>Milo speaks aloud</strong><small>Turn off to read only</small></span></label>
    <label className="sl-select">Pace<select value={settings.speed} onChange={event=>update({speed:Number(event.target.value) as SpeakingSpeed})}>{speakingSpeeds.map(s=><option key={s} value={s}>{s===1?"Natural":s===.95?"Slightly slower":"Slower"}</option>)}</select></label>
    <label className="sl-select">Engine<select value={settings.engine} onChange={event=>update({engine:event.target.value as "neural"|"device"})}><option value="neural">Natural (Kokoro)</option><option value="device">Device voice</option></select></label>
    <label className="sl-select">Feedback in<select value={settings.language} onChange={event=>update({language:event.target.value as "en"|"mn"})}><option value="en">English</option><option value="mn">Монгол</option></select></label>
   </div>
   <div className="sl-consents">
    <label><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>My answers (as text) are sent to DeepSeek to generate Milo’s replies and feedback. I won’t share personal details.</label>
    <label><input type="checkbox" checked={micConsent} disabled={!micSupported} onChange={event=>toggleMicConsent(event.target.checked)}/>Use my microphone. Recordings are sent to the application server for transcription and never saved.</label>
    {!micSupported&&<small>Microphone recording isn’t available in this browser — try Chrome or Edge, or type your answers.</small>}
   </div>
   {error&&<p className="error-message" role="alert">{error}</p>}
   <button type="button" className="button primary sl-start" disabled={!consent||status==="thinking"} onClick={()=>void startSession()}>{status==="thinking"?"Meeting Milo…":settings.mode==="mock"?"Start mock test →":"Start practice →"}</button>
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
