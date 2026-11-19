"use client";
// Workshop → TOEFL → Ярих (2026-11-19): the two TOEFL iBT Speaking tasks on the Speaking Lab's voices, microphone and
// transcription. Listen and Repeat is scored here by word match, with no AI; Take an Interview ends in one paid AI report.
import {useEffect,useRef,useState,useSyncExternalStore,type RefObject} from "react";
import Link from "next/link";
import {VoicePlayer,deviceVoice,startRecorder,type RecorderHandle,type Recording} from "@/modules/speaking-lab/audio";
import {encodeSpeechWav} from "@/modules/speaking-lab/pcm";
import {speakingSpeeds,speakingVoices,type SpeakingSpeed,type SpeakingVoice} from "@/modules/speaking-lab/contracts";
import {playBeep} from "@/modules/exams/toefl/view";
import {CreditCost,useCredits} from "@/modules/credits/client";
import {
 INTERVIEWS,INTERVIEW_MIN_WORDS,INTERVIEW_SECONDS,REPEAT_SECONDS,REPEAT_SETS,TRANSCRIPT_LIMIT,findInterview,findRepeatSet,interviewScenario,repeatDiff,scoreRepeat,spokenSeconds,voiceLabel,
 type InterviewAnswer,type InterviewReport,type RepeatResult,
} from "./contracts";
import styles from "./toefl-speaking.module.css";

const VOICE_URL="/api/labs/ielts-speaking/voice",TRANSCRIBE_URL="/api/labs/ielts-speaking/transcribe",REPORT_URL="/api/labs/toefl-speaking";
const HOME="/labs/toefl-speaking";
type Tab="repeat"|"interview";

// ---------- Saved progress (this browser only) ----------
type Saved={tab:Tab;repeat:Record<string,number>;interview:Record<string,number>};
const KEY="education-toefl-speaking-v1",EMPTY:Saved={tab:"repeat",repeat:{},interview:{}};
let cached:{raw:string|null;value:Saved}|null=null;
const listeners=new Set<()=>void>();
const scores=(v:unknown)=>Object.fromEntries(Object.entries(v&&typeof v==="object"?v:{}).filter(([,n])=>typeof n==="number"&&n>=0&&n<=5)) as Record<string,number>;
function readSaved():Saved {
 let raw:string|null=null;try{raw=localStorage.getItem(KEY);}catch{/* storage blocked */}
 if(cached&&cached.raw===raw)return cached.value;
 let value=EMPTY;
 try{const data=raw?JSON.parse(raw):null;if(data&&typeof data==="object")value={tab:data.tab==="interview"?"interview":"repeat",repeat:scores(data.repeat),interview:scores(data.interview)};}catch{value=EMPTY;}
 cached={raw,value};return value;
}
function save(change:(saved:Saved)=>Saved) {
 const value=change(readSaved()),raw=JSON.stringify(value);
 try{localStorage.setItem(KEY,raw);}catch{/* storage blocked: the page still works */}
 cached={raw,value};listeners.forEach(listener=>listener());
}
const subscribe=(listener:()=>void)=>{listeners.add(listener);const onStorage=(event:StorageEvent)=>{if(event.key===KEY)listener();};window.addEventListener("storage",onStorage);return()=>{listeners.delete(listener);window.removeEventListener("storage",onStorage);};};
const serverSaved=()=>EMPTY;

const subscribeNothing=()=>()=>{};
const micAvailable=()=>typeof MediaRecorder!=="undefined"&&!!navigator.mediaDevices?.getUserMedia;
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const failure=(reason:unknown,fallback:string)=>reason instanceof Error&&!["TimeoutError","AbortError"].includes(reason.name)&&reason.message?reason.message:fallback;
const words=(value:string)=>(value.trim().match(/[A-Za-z0-9'’-]+/g)??[]).length;
const one=(n:number)=>n.toFixed(1).replace(/\.0$/,"");

// ---------- Voice and microphone ----------
// One player per task. Clips are kept for the visit, so "listen again" is instant and costs no voice request.
function useAudio(onNotice:(text:string)=>void) {
 const energy=useRef(0),player=useRef<VoicePlayer|null>(null),run=useRef(0),device=useRef(false);
 const clips=useRef(new Map<string,Promise<ArrayBuffer>>());
 const recorder=useRef<RecorderHandle|null>(null),transcribing=useRef<AbortController|null>(null);
 useEffect(()=>{
  const runRef=run,recorderRef=recorder,abortRef=transcribing,playerRef=player;
  return()=>{runRef.current++;recorderRef.current?.abort();abortRef.current?.abort();playerRef.current?.close();window.speechSynthesis?.cancel();};
 },[]);
 const getPlayer=()=>player.current??=new VoicePlayer(energy);
 function load(text:string,voice:SpeakingVoice,speed:SpeakingSpeed) {
  const key=`${voice}:${speed}:${text}`,known=clips.current.get(key);if(known)return known;
  const pending=(async()=>{
   const response=await fetch(VOICE_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,voice,speed}),signal:AbortSignal.timeout(120000)});
   // A refusal carries the server's reason (for example an unfinished timed mock), which the student should see.
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(typeof data.error==="string"?data.error:"");}
   return response.arrayBuffer();
  })();
  clips.current.set(key,pending);pending.catch(()=>clips.current.delete(key));
  return pending;
 }
 function speakDevice(text:string,voice:SpeakingVoice,speed:SpeakingSpeed,mine:number) {
  return new Promise<boolean>(resolve=>{
   const synth=window.speechSynthesis;if(!synth){resolve(false);return;}
   const utterance=new SpeechSynthesisUtterance(text);
   utterance.lang=speakingVoices[voice].accent==="British"?"en-GB":"en-US";utterance.rate=speed;utterance.voice=deviceVoice(synth.getVoices(),voice);
   utterance.onend=()=>resolve(mine===run.current);utterance.onerror=()=>resolve(false);
   synth.speak(utterance);
  });
 }
 function stop(){run.current++;player.current?.stop();window.speechSynthesis?.cancel();}
 /** Plays the sentence; true when it was heard to the end. Falls back to the device voice once the natural one fails. */
 async function say(text:string,voice:SpeakingVoice,speed:SpeakingSpeed):Promise<boolean> {
  stop();const mine=++run.current;getPlayer().ensure();
  if(!device.current){
   try {
    const bytes=await load(text,voice,speed);
    if(mine!==run.current)return false;
    return await getPlayer().play(new Response(bytes),{onStart:()=>{},onCaption:()=>{}})==="ended"&&mine===run.current;
   }catch(reason){
    if(mine!==run.current)return false;
    device.current=true;
    const refusal=reason instanceof Error?reason.message:"";
    onNotice(refusal?`${refusal} Одоо төхөөрөмжийн дуугаар уншиж байна.`:"Байгалийн дуу одоогоор ажиллахгүй байна. Төхөөрөмжийн дуугаар уншиж байна.");
   }
  }
  return speakDevice(text,voice,speed,mine);
 }
 const prefetch=(text:string,voice:SpeakingVoice,speed:SpeakingSpeed)=>{if(!device.current)void load(text,voice,speed).catch(()=>{});};
 async function record(options:{autoStop:boolean;silenceMs:number;maxMs:number;onLevel:(level:number)=>void;onAutoStop:()=>void}) {
  stop();
  const handle=await startRecorder(getPlayer().ensure(),{...options,onSpeech:()=>{},onAutoStop:()=>options.onAutoStop()});
  recorder.current=handle;return handle;
 }
 async function finish():Promise<Recording|null> {
  const handle=recorder.current;recorder.current=null;
  return handle?handle.stop():null;
 }
 function cancel(){recorder.current?.abort();recorder.current=null;transcribing.current?.abort();}
 async function transcribe(recording:Recording):Promise<string> {
  const controller=new AbortController();transcribing.current=controller;
  const response=await fetch(TRANSCRIBE_URL,{method:"POST",headers:{"Content-Type":"audio/wav"},body:encodeSpeechWav(recording.pcm),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(150000)])});
  const data=await response.json().catch(()=>({error:"Бичлэгийг текст болгож чадсангүй."}));
  if(!response.ok)throw new Error(data.error||"Бичлэгийг текст болгож чадсангүй.");
  return String(data.text??"").trim();
 }
 return {say,stop,prefetch,record,finish,cancel,transcribe,recording:()=>!!recorder.current};
}

function Meter({level}:{level:RefObject<HTMLSpanElement|null>}) {
 return <span className={styles.meter} ref={level} aria-hidden="true"><i/><i/><i/><i/><i/></span>;
}

function Countdown({seconds}:{seconds:number}) {
 const [left,setLeft]=useState(seconds);
 useEffect(()=>{
  const start=performance.now();
  const id=setInterval(()=>{const remaining=Math.max(0,seconds-(performance.now()-start)/1000);setLeft(remaining);if(remaining<=0)clearInterval(id);},250);
  return()=>clearInterval(id);
 },[seconds]);
 const shown=Math.ceil(left);
 return <span className={styles.countdown} data-low={shown<=10?"":undefined}>0:{String(shown).padStart(2,"0")}</span>;
}

function SpeedPicker({speed,onChange,disabled}:{speed:SpeakingSpeed;onChange:(speed:SpeakingSpeed)=>void;disabled?:boolean}) {
 return <label className={styles.speed}>Хурд
  <select value={speed} disabled={disabled} onChange={event=>onChange(Number(event.target.value) as SpeakingSpeed)}>
   {[...speakingSpeeds].reverse().map(value=><option key={value} value={value}>{value===1?"Шалгалтын (1×)":`${value}×`}</option>)}
  </select>
 </label>;
}

// ---------- Listen and Repeat ----------
type RepeatStatus="idle"|"playing"|"listening"|"transcribing";

function ListenRepeat({mic,saved}:{mic:boolean;saved:Saved}) {
 const [setId,setSetId]=useState(REPEAT_SETS[0].id);
 const [at,setAt]=useState(0);
 const [results,setResults]=useState<Record<number,RepeatResult>>({});
 const [status,setStatusState]=useState<RepeatStatus>("idle");
 const [played,setPlayed]=useState<Record<number,boolean>>({});
 const [typed,setTyped]=useState("");
 const [speed,setSpeed]=useState<SpeakingSpeed>(1);
 const [peek,setPeek]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const audio=useAudio(setNotice),level=useRef<HTMLSpanElement>(null),statusRef=useRef<RepeatStatus>("idle"),round=useRef(0);
 const set=findRepeatSet(setId)??REPEAT_SETS[0],done=at>=set.sentences.length;
 const sentence=done?"":set.sentences[at],result=results[at];
 const status_=(next:RepeatStatus)=>{statusRef.current=next;setStatusState(next);};
 const busy=status!=="idle";

 function score(index:number,said:string) {
  const next={...results,[index]:scoreRepeat(set.sentences[index],said)};
  setResults(next);
  if(set.sentences.every((_,i)=>next[i])){
   const average=Math.round(set.sentences.reduce((sum,_,i)=>sum+next[i].score,0)/set.sentences.length*10)/10;
   save(s=>({...s,repeat:{...s.repeat,[set.id]:average}}));
  }
  const following=set.sentences[index+1];
  if(following)audio.prefetch(following,set.voice,speed);
 }
 async function listen(index=at) {
  if(statusRef.current!=="idle")return;
  const mine=++round.current;setError("");setNotice("");setTyped("");
  status_("playing");
  const heard=await audio.say(set.sentences[index],set.voice,speed);
  if(mine!==round.current)return;
  setPlayed(current=>({...current,[index]:true}));
  if(!heard){status_("idle");setNotice("Дууг тоглуулж чадсангүй. Дахин оролдоно уу.");return;}
  if(!mic){status_("idle");return;}
  playBeep();await wait(450);
  if(mine!==round.current)return;
  try {
   status_("listening");
   await audio.record({autoStop:true,silenceMs:1400,maxMs:REPEAT_SECONDS*1000,onLevel:value=>level.current?.style.setProperty("--level",value.toFixed(3)),onAutoStop:()=>void stopListening(index,mine)});
   if(mine!==round.current)audio.cancel();
  }catch(reason){
   status_("idle");
   setError(reason instanceof DOMException&&reason.name==="NotAllowedError"?"Микрофоны зөвшөөрөл хаалттай байна. Хөтчийн тохиргооноос зөвшөөрнө үү, эсвэл сонссоноо бичээрэй.":"Микрофон асаж чадсангүй. Холбогдсон эсэхийг шалгана уу.");
  }
 }
 async function stopListening(index:number,mine=round.current) {
  if(!audio.recording()||mine!==round.current)return;
  status_("transcribing");
  try {
   const recording=await audio.finish();
   if(mine!==round.current)return;
   if(!recording?.heardSpeech){status_("idle");setNotice("Дуу сонсогдсонгүй. Микрофондоо ойртож дахин оролдоно уу.");return;}
   const text=await audio.transcribe(recording);
   if(mine!==round.current)return;
   status_("idle");
   if(!text){setNotice("Үг танигдсангүй. Дахин, арай чанга хэлээд үзээрэй.");return;}
   score(index,text);
  }catch(reason){if(mine===round.current){status_("idle");setError(failure(reason,"Бичлэгийг текст болгоход удаан байна.")+" Дахин оролдоно уу.");}}
 }
 function reset(next:string=set.id){round.current++;audio.stop();audio.cancel();status_("idle");setSetId(next);setAt(0);setResults({});setPlayed({});setTyped("");setNotice("");setError("");}
 function retry(){const next={...results};delete next[at];setResults(next);void listen(at);}
 function go(index:number){round.current++;audio.stop();audio.cancel();status_("idle");setAt(index);setTyped("");setNotice("");setError("");}

 const average=Object.keys(results).length?Math.round(Object.values(results).reduce((sum,r)=>sum+r.score,0)/Object.keys(results).length*10)/10:0;
 const nextSet=REPEAT_SETS[(REPEAT_SETS.findIndex(entry=>entry.id===set.id)+1)%REPEAT_SETS.length];

 return <section className={styles.task} aria-label="Listen and Repeat">
  <div className={styles.head}>
   <div>
    <h2>Listen and Repeat</h2>
    <p>Нэг нөхцөл байдалд 7 өгүүлбэр сонсоод тус бүрийг яг сонссоноороо давтана. Өгүүлбэр богиноос урт руу явна. Таны хэлснийг текст болгоод үг бүрээр харьцуулж 0–5 оноо өгнө. AI ашиглахгүй, кредит зарцуулахгүй.</p>
   </div>
   <div className={styles.sets} role="tablist" aria-label="Нөхцөл байдал">
    {REPEAT_SETS.map(entry=><button key={entry.id} type="button" role="tab" aria-selected={entry.id===set.id} disabled={busy} onClick={()=>entry.id!==set.id&&reset(entry.id)}>
     {entry.title}<small>{saved.repeat[entry.id]!==undefined?`Сүүлд ${one(saved.repeat[entry.id])}/5`:"7 өгүүлбэр"}</small>
    </button>)}
   </div>
  </div>

  <div className={styles.card}>
   <div className={styles.scene}>
    <p lang="en">{set.scenario}</p>
    <div className={styles.tools}>
     <span className={styles.voice}>{voiceLabel(set.voice)}</span>
     <SpeedPicker speed={speed} onChange={setSpeed} disabled={busy}/>
     <label className={styles.toggle}><input type="checkbox" checked={peek} onChange={event=>setPeek(event.target.checked)}/>Өгүүлбэрийг урьдчилан харах</label>
    </div>
   </div>
   <ol className={styles.dots} aria-label="Өгүүлбэрүүд">
    {set.sentences.map((_,index)=><li key={index} data-state={index===at&&!done?"current":results[index]?(results[index].score>=4?"right":results[index].score>=2?"close":"wrong"):undefined}>
     <button type="button" disabled={busy} aria-current={index===at&&!done?"step":undefined} aria-label={`Өгүүлбэр ${index+1}${results[index]?`, ${results[index].score}/5`:""}`} onClick={()=>go(index)}>{index+1}</button>
    </li>)}
   </ol>

   {!done?<div className={styles.item}>
    <p className={styles.count}>ӨГҮҮЛБЭР {at+1} / {set.sentences.length}</p>
    {result?<RepeatOutcome sentence={sentence} result={result}/>:peek||(!mic&&played[at])?null:<p className={styles.hidden}>Өгүүлбэр далд байна. Сонсоод шууд давтана: шалгалтад текст харагдахгүй.</p>}
    {!result&&peek?<p className={styles.sentence} lang="en">{sentence}</p>:null}
    {!result&&!mic&&played[at]?<form className={styles.typed} onSubmit={event=>{event.preventDefault();if(typed.trim())score(at,typed);}}>
     <label htmlFor="repeat-typed">Микрофонгүй үед: сонссон өгүүлбэрээ бичнэ үү</label>
     <input id="repeat-typed" lang="en" value={typed} maxLength={400} autoComplete="off" spellCheck={false} onChange={event=>setTyped(event.target.value)}/>
     <button type="submit" className="button primary" disabled={!typed.trim()}>Шалгах</button>
    </form>:null}
    <div className={styles.actions}>
     {status==="listening"?<>
      <span className={styles.live}><Meter level={level}/>Давтаж хэлээрэй…</span>
      <button type="button" className="button secondary" onClick={()=>void stopListening(at)}>Дууслаа</button>
     </>:status==="transcribing"?<span className={styles.live}>Шалгаж байна…</span>
     :status==="playing"?<span className={styles.live}>Сонсож байна…</span>
     :result?<>
      <button type="button" className="button secondary" onClick={retry}>Дахин оролдох</button>
      <button type="button" className="button primary" onClick={()=>go(at+1)}>{at+1<set.sentences.length?"Дараагийн →":"Дүнг харах →"}</button>
     </>:<button type="button" className="button primary" onClick={()=>void listen()}>{played[at]?"↻ Дахин сонсох":"▶ Сонсох"}{mic?" ба давтах":""}</button>}
    </div>
    {notice?<p className={styles.notice} role="status">{notice}</p>:null}
    {error?<p className={styles.error} role="alert">{error}</p>:null}
   </div>:<div className={styles.item}>
    <p className={styles.summary}><strong>{one(average)}</strong> / 5 дундаж · {Object.keys(results).length}/{set.sentences.length} өгүүлбэр</p>
    <ol className={styles.review}>
     {set.sentences.map((line,index)=><li key={index} data-score={results[index]?.score??0}><b>{results[index]?`${results[index].score}/5`:"—"}</b><p lang="en">{line}</p></li>)}
    </ol>
    <p className={styles.note}>Шалгалтад өгүүлбэр бүр 0–5 оноотой. 5 оноо: яг адил давтсан; 4: бараг бүх үг зөв; 3: утга хадгалагдсан ч хэдэн үг дутуу. Урт өгүүлбэрийг хэсэг хэсгээр нь санаж, хэмнэлийг дагаж хэлэх нь тустай.</p>
    <div className={styles.actions}>
     <button type="button" className="button secondary" onClick={()=>reset()}>Дахин эхлэх</button>
     <button type="button" className="button primary" onClick={()=>reset(nextSet.id)}>Дараагийн нөхцөл: {nextSet.title} →</button>
    </div>
   </div>}
  </div>
 </section>;
}

function RepeatOutcome({sentence,result}:{sentence:string;result:RepeatResult}) {
 const parts=repeatDiff(sentence,result.said);
 return <div className={styles.outcome} data-score={result.score}>
  <p className={styles.score}><strong>{result.score}</strong>/5 · {Math.round(result.accuracy*100)}% үг таарсан</p>
  <p className={styles.sentence} lang="en">{parts.map((part,index)=><span key={index}>{index?" ":""}{part.heard?part.text:<mark title="Дутуу эсвэл өөр үг">{part.text}</mark>}</span>)}</p>
  <p className={styles.said}>Таны хэлсэн: <q lang="en">{result.said}</q></p>
 </div>;
}

// ---------- Take an Interview ----------
type InterviewStatus="idle"|"asking"|"listening"|"transcribing"|"reporting";

function TakeInterview({mic,saved}:{mic:boolean;saved:Saved}) {
 const [topicId,setTopicId]=useState(INTERVIEWS[0].id);
 const [at,setAt]=useState(-1);
 const [answers,setAnswers]=useState<Record<number,InterviewAnswer>>({});
 const [status,setStatusState]=useState<InterviewStatus>("idle");
 const [asked,setAsked]=useState<Record<number,boolean>>({});
 const [showText,setShowText]=useState(false);
 const [typed,setTyped]=useState("");
 const [speed,setSpeed]=useState<SpeakingSpeed>(1);
 const [language,setLanguage]=useState<"mn"|"en">("mn");
 const [consent,setConsent]=useState(false);
 const [report,setReport]=useState<InterviewReport|null>(null);
 const [recordingKey,setRecordingKey]=useState(0);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const {apply}=useCredits();
 const audio=useAudio(setNotice),level=useRef<HTMLSpanElement>(null),statusRef=useRef<InterviewStatus>("idle"),round=useRef(0);
 const topic=findInterview(topicId)??INTERVIEWS[0],total=topic.questions.length;
 const finished=at>=total,question=at>=0&&!finished?topic.questions[at]:"",answer=answers[at+1];
 const status_=(next:InterviewStatus)=>{statusRef.current=next;setStatusState(next);};
 const busy=status!=="idle";
 const list=Object.values(answers).sort((a,b)=>a.question-b.question);
 const spoken=list.reduce((sum,entry)=>sum+words(entry.transcript),0);

 async function ask(index:number) {
  if(statusRef.current!=="idle")return;
  const mine=++round.current;setError("");setNotice("");setTyped("");
  status_("asking");
  const heard=await audio.say(topic.questions[index],topic.voice,speed);
  if(mine!==round.current)return;
  setAsked(current=>({...current,[index]:true}));
  const following=topic.questions[index+1];
  if(following)audio.prefetch(following,topic.voice,speed);
  if(!heard){status_("idle");setNotice("Асуултыг тоглуулж чадсангүй. Дахин оролдоно уу.");return;}
  if(!mic){status_("idle");return;}
  playBeep();await wait(450);
  if(mine!==round.current)return;
  try {
   status_("listening");
   const handle=await audio.record({autoStop:false,silenceMs:INTERVIEW_SECONDS*1000,maxMs:INTERVIEW_SECONDS*1000,onLevel:value=>level.current?.style.setProperty("--level",value.toFixed(3)),onAutoStop:()=>void stopAnswer(index,mine)});
   if(mine!==round.current){audio.cancel();return;}
   setRecordingKey(handle.startedAt);
  }catch(reason){
   status_("idle");
   setError(reason instanceof DOMException&&reason.name==="NotAllowedError"?"Микрофоны зөвшөөрөл хаалттай байна. Хөтчийн тохиргооноос зөвшөөрнө үү, эсвэл хариултаа бичээрэй.":"Микрофон асаж чадсангүй. Холбогдсон эсэхийг шалгана уу.");
  }
 }
 async function stopAnswer(index:number,mine=round.current) {
  if(!audio.recording()||mine!==round.current)return;
  status_("transcribing");
  try {
   const recording=await audio.finish();
   if(mine!==round.current)return;
   if(!recording?.heardSpeech){status_("idle");setNotice("Хариулт сонсогдсонгүй. «Дахин хариулах»-аар асуултыг дахин сонсоно уу.");return;}
   const text=(await audio.transcribe(recording)).slice(0,TRANSCRIPT_LIMIT);
   if(mine!==round.current)return;
   status_("idle");
   if(!text){setNotice("Үг танигдсангүй. Дахин, арай чанга хариулаад үзээрэй.");return;}
   setAnswers(current=>({...current,[index+1]:{question:index+1,transcript:text,seconds:Math.min(120,Math.round(recording.seconds))}}));
  }catch(reason){if(mine===round.current){status_("idle");setError(failure(reason,"Бичлэгийг текст болгоход удаан байна.")+" Дахин оролдоно уу.");}}
 }
 function submitTyped() {
  const text=typed.trim().slice(0,TRANSCRIPT_LIMIT);if(!text)return;
  setAnswers(current=>({...current,[at+1]:{question:at+1,transcript:text,seconds:spokenSeconds(text)}}));setTyped("");
 }
 function begin(index:number){round.current++;audio.stop();audio.cancel();status_("idle");setAt(index);setShowText(false);setTyped("");setNotice("");setError("");if(index<total&&!answers[index+1])void ask(index);}
 function redo(){const next={...answers};delete next[at+1];setAnswers(next);void ask(at);}
 function reset(next:string=topic.id){round.current++;audio.stop();audio.cancel();status_("idle");setTopicId(next);setAt(-1);setAnswers({});setAsked({});setReport(null);setTyped("");setNotice("");setError("");}
 async function requestReport() {
  if(statusRef.current!=="idle"||!consent)return;
  status_("reporting");setError("");
  try {
   const response=await fetch(REPORT_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:topic.id,language,answers:list}),signal:AbortSignal.timeout(170000)});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Тайлан гарсангүй.");
   apply(data);
   const value=data.report as InterviewReport;
   setReport(value);save(s=>({...s,interview:{...s.interview,[topic.id]:value.average}}));
  }catch(reason){setError(failure(reason,"Тайлан удаан байна.")+" Хариултууд тань хэвээр байна, дахин оролдоно уу.");}
  finally{status_("idle");}
 }

 return <section className={styles.task} aria-label="Take an Interview">
  <div className={styles.head}>
   <div>
    <h2>Take an Interview</h2>
    <p>Судалгааны ярилцлага: ярилцагч нэг сэдвээр 4 асуулт асууна, хувийн туршлагаас санал бодол руу шилжинэ. Асуулт бүрт бэлтгэх хугацаагүй, {INTERVIEW_SECONDS} секунд хариулна. Төгсгөлд AI таны хариултын текстийг ETS-ийн 0–5 шалгуураар үнэлж, алдаа, үг хэллэг, 5 онооны жишээ хариулт өгнө.</p>
   </div>
   <div className={styles.sets} role="tablist" aria-label="Сэдэв">
    {INTERVIEWS.map(entry=><button key={entry.id} type="button" role="tab" aria-selected={entry.id===topic.id} disabled={busy} onClick={()=>entry.id!==topic.id&&reset(entry.id)}>
     {entry.title}<small>{saved.interview[entry.id]!==undefined?`Сүүлд ${one(saved.interview[entry.id])}/5`:"4 асуулт"}</small>
    </button>)}
   </div>
  </div>

  <div className={styles.card}>
   <div className={styles.scene}>
    <p lang="en">{interviewScenario(topic)}</p>
    <div className={styles.tools}>
     <span className={styles.voice}>{voiceLabel(topic.voice)}</span>
     <SpeedPicker speed={speed} onChange={setSpeed} disabled={busy}/>
    </div>
   </div>

   {at<0?<div className={styles.item}>
    <p className={styles.note}>Асуултыг зөвхөн сонсоно: шалгалтад асуултын текст харагдахгүй. Дохионы дараа {INTERVIEW_SECONDS} секунд бичлэг явж, хугацаа дуусахад автоматаар зогсоно. Эрт дуусгаж болно.{mic?"":" Микрофон асаагаагүй тул хариултаа бичнэ."}</p>
    <div className={styles.actions}><button type="button" className="button primary" onClick={()=>begin(0)}>Ярилцлага эхлэх →</button></div>
   </div>:!finished?<div className={styles.item}>
    <ol className={styles.dots} aria-label="Асуултууд">
     {topic.questions.map((_,index)=><li key={index} data-state={index===at?"current":answers[index+1]?"right":undefined}><span>{index+1}</span></li>)}
    </ol>
    <p className={styles.count}>АСУУЛТ {at+1} / {total}</p>
    {showText||answer?<p className={styles.sentence} lang="en">{question}</p>:asked[at]?<button type="button" className={styles.link} onClick={()=>setShowText(true)}>Асуултын текстийг харах</button>:null}
    {answer?<div className={styles.answer}><p className={styles.said}>Таны хариулт ({mic?"":"ярихад ≈"}{answer.seconds} сек, {words(answer.transcript)} үг):</p><p lang="en">{answer.transcript}</p></div>:null}
    {!answer&&!mic&&asked[at]&&status==="idle"?<form className={styles.typed} onSubmit={event=>{event.preventDefault();submitTyped();}}>
     <label htmlFor="interview-typed">Микрофонгүй үед: хариултаа англиар бичнэ үү (≈{INTERVIEW_SECONDS} секундын яриа ≈ 90–110 үг)</label>
     <textarea id="interview-typed" lang="en" rows={5} value={typed} maxLength={TRANSCRIPT_LIMIT} onChange={event=>setTyped(event.target.value)}/>
     <button type="submit" className="button primary" disabled={!typed.trim()}>Хариулт хадгалах</button>
    </form>:null}
    <div className={styles.actions}>
     {status==="listening"?<>
      <span className={styles.live}><Meter level={level}/>Хариулж байна · <Countdown key={recordingKey} seconds={INTERVIEW_SECONDS}/></span>
      <button type="button" className="button secondary" onClick={()=>void stopAnswer(at)}>Эрт дуусгах</button>
     </>:status==="transcribing"?<span className={styles.live}>Хариултыг текст болгож байна…</span>
     :status==="asking"?<span className={styles.live}>Ярилцагч асууж байна…</span>
     :answer?<>
      <button type="button" className="button secondary" onClick={redo}>Дахин хариулах</button>
      <button type="button" className="button primary" onClick={()=>begin(at+1)}>{at+1<total?"Дараагийн асуулт →":"Дуусгах →"}</button>
     </>:<button type="button" className="button primary" onClick={()=>void ask(at)}>{asked[at]?"↻ Асуултыг дахин сонсох":"▶ Асуултыг сонсох"}</button>}
    </div>
    {notice?<p className={styles.notice} role="status">{notice}</p>:null}
    {error?<p className={styles.error} role="alert">{error}</p>:null}
   </div>:report?<InterviewReportView report={report} topic={topic.id} answers={list} onAgain={()=>reset()} onNext={()=>reset(INTERVIEWS[(INTERVIEWS.findIndex(entry=>entry.id===topic.id)+1)%INTERVIEWS.length].id)}/>
   :<div className={styles.item}>
    <p className={styles.count}>ЯРИЛЦЛАГА ДУУСЛАА · {list.length}/{total} ХАРИУЛТ · {spoken} ҮГ</p>
    <ol className={styles.review}>
     {topic.questions.map((line,index)=><li key={index}><b>{index+1}</b><div><p lang="en">{line}</p><p className={styles.said}>{answers[index+1]?<q lang="en">{answers[index+1].transcript}</q>:"Хариулаагүй"}</p></div></li>)}
    </ol>
    {spoken<INTERVIEW_MIN_WORDS?<p className={styles.notice}>Тайланд нийт дор хаяж {INTERVIEW_MIN_WORDS} үг хэрэгтэй. Асуултаа дахин сонсоод хариулна уу.</p>:null}
    <label className={styles.consent}><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>Хариултын текстийг AI үйлчилгээнд илгээж тайлан гаргахыг зөвшөөрч байна. Хувийн мэдээлэл оруулаагүй.</label>
    <div className={styles.actions}>
     <label className={styles.speed}>Тайлбарын хэл
      <select value={language} disabled={busy} onChange={event=>setLanguage(event.target.value==="en"?"en":"mn")}><option value="mn">Монгол</option><option value="en">English</option></select>
     </label>
     <button type="button" className="button secondary" disabled={busy} onClick={()=>begin(Math.max(0,topic.questions.findIndex((_,index)=>!answers[index+1])))}>Хариулт засах</button>
     <button type="button" className="button primary" disabled={busy||!consent||spoken<INTERVIEW_MIN_WORDS} onClick={()=>void requestReport()}>{status==="reporting"?"Үнэлж байна…":"Тайлан авах"} <CreditCost action="speaking-report" compact/></button>
    </div>
    {error?<p className={styles.error} role="alert">{error}</p>:null}
   </div>}
  </div>
 </section>;
}

function InterviewReportView({report,topic,answers,onAgain,onNext}:{report:InterviewReport;topic:string;answers:InterviewAnswer[];onAgain:()=>void;onNext:()=>void}) {
 const questions=findInterview(topic)?.questions??[];
 return <div className={styles.report}>
  <div className={styles.overall}>
   <p><strong>{one(report.average)}</strong> / 5</p>
   <span>Тооцоолсон дундаж оноо · Take an Interview</span>
  </div>
  <p className={styles.lead}>{report.summary}</p>
  <ol className={styles.review}>
   {report.answers.map(entry=><li key={entry.question} data-score={entry.score}><b>{entry.score}/5</b><div><p lang="en">{questions[entry.question-1]}</p>{entry.comment?<p className={styles.said}>{entry.comment}</p>:<p className={styles.said}>Хариулаагүй</p>}</div></li>)}
  </ol>
  {report.strengths.length?<section><h3>Сайн тал</h3><ul>{report.strengths.map(item=><li key={item}>{item}</li>)}</ul></section>:null}
  {report.fixes.length?<section><h3>Засах зүйл</h3><ul className={styles.fixes}>{report.fixes.map(fix=><li key={fix.said}><p><s lang="en">{fix.said}</s> → <b lang="en">{fix.better}</b></p>{fix.why?<p className={styles.said}>{fix.why}</p>:null}</li>)}</ul></section>:null}
  {report.vocabulary.length?<section><h3>Хэрэгтэй хэллэг</h3><ul className={styles.vocab}>{report.vocabulary.map(item=><li key={item.phrase}><b lang="en">{item.phrase}</b><span>{item.meaning}</span><i lang="en">{item.example}</i></li>)}</ul></section>:null}
  <section><h3>5 онооны жишээ хариулт · Асуулт {report.model.question}</h3><p className={styles.said} lang="en">{questions[report.model.question-1]}</p><p className={styles.model} lang="en">{report.model.answer}</p></section>
  <section><h3>Маргаашийн дасгал</h3><p>{report.next}</p></section>
  <details className={styles.transcripts}><summary>Таны хариултууд ({answers.length})</summary>{answers.map(entry=><p key={entry.question} lang="en"><b>{entry.question}.</b> {entry.transcript}</p>)}</details>
  <p className={styles.note}>Оноо нь таны хариултын текст дээр суурилсан тооцоо: дуудлага, аялгууг сонсдоггүй тул бодит шалгалтын оноо өөр байж болно.</p>
  <div className={styles.actions}>
   <button type="button" className="button secondary" onClick={onAgain}>Энэ сэдвийг дахин</button>
   <button type="button" className="button primary" onClick={onNext}>Дараагийн сэдэв →</button>
  </div>
 </div>;
}

// ---------- Page ----------
export function ToeflSpeaking({signedIn}:{signedIn:boolean}) {
 const saved=useSyncExternalStore(subscribe,readSaved,serverSaved);
 const micSupported=useSyncExternalStore(subscribeNothing,micAvailable,()=>false);
 const [mic,setMic]=useState(false);
 const [micError,setMicError]=useState("");
 const tab=saved.tab;
 useEffect(()=>{if(signedIn)void fetch("/api/labs/ielts-speaking/warm",{method:"POST"}).catch(()=>{});},[signedIn]);
 function toggleMic(on:boolean) {
  setMic(on);setMicError("");
  // Asked here, so the browser prompt never interrupts an answer.
  if(on)void navigator.mediaDevices?.getUserMedia({audio:true}).then(stream=>stream.getTracks().forEach(track=>track.stop())).catch(()=>{setMic(false);setMicError("Микрофоны зөвшөөрөл хаалттай байна. Хөтчийн тохиргооноос зөвшөөрнө үү, эсвэл бичгээр дадлага хийнэ үү.");});
 }
 const tabs=[["repeat","Listen and Repeat","7 өгүүлбэр · AI-гүй"],["interview","Take an Interview","4 асуулт · AI тайлан"]] as const;

 return <div className={`container page-space ${styles.root}`}>
  <header className={styles.top}>
   <div><p className={styles.kicker}><Link href="/workspace/workshop?exam=toefl">Workshop</Link> · TOEFL Speaking</p><h1 className="sr-only">TOEFL Speaking дадлага</h1></div>
   <div className={styles.tabs} role="tablist" aria-label="Даалгавар">
    {tabs.map(([id,label,note])=><button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>save(s=>({...s,tab:id}))}>{label}<small>{note}</small></button>)}
   </div>
  </header>
  {!signedIn?<div className={styles.card}>
   <div className={styles.item}>
    <p className={styles.note}>TOEFL iBT Speaking-ийн хоёр даалгавар: Listen and Repeat (сонсоод давтах) ба Take an Interview (ярилцлага). Дуу болон бичлэгийг текст болгох нь нэвтэрсэн үед ажиллана.</p>
    <div className={styles.actions}><Link className="button primary" href={"/login?next="+encodeURIComponent(HOME)}>Нэвтэрч дадлага хийх →</Link></div>
   </div>
  </div>:<>
   <div className={styles.micBar}>
    <label className={styles.consent}><input type="checkbox" checked={mic} disabled={!micSupported} onChange={event=>toggleMic(event.target.checked)}/>Микрофон ашиглах. Бичлэгийг зөвхөн текст болгох зорилгоор серверт илгээнэ (яриа танилтын үйлчилгээ ашиглаж болно), хадгалахгүй.</label>
    {!micSupported?<span className={styles.note}>Энэ хөтөч бичлэг дэмжихгүй: сонссоноо бичиж дадлага хийнэ.</span>:null}
    {micError?<p className={styles.error} role="alert">{micError}</p>:null}
   </div>
   {tab==="repeat"?<ListenRepeat mic={mic} saved={saved}/>:<TakeInterview mic={mic} saved={saved}/>}
  </>}
 </div>;
}
