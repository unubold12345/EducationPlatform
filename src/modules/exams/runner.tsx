"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MathScratchpad } from "@/components/math-scratchpad";
import "./speaking-examiner.css";
import { useCallback,useEffect,useRef,useState,useSyncExternalStore } from "react";
import { examinerChoice,setExaminerChoice,subscribeExaminer } from "./speaking-examiner-store";
import type { PublicExamAttempt } from "./types";
import { SpeakingRecorder } from "./speaking-recorder";
import { ListeningSection } from "./listening-section";
import { AnswerOptions, MathTools, PassagePane, useEliminations, usePassageScale, useQuestionShortcuts } from "./session-tools";
import { JlptSection } from "./jlpt/section";
import { HskSection } from "./hsk/section";
import { ToeflSection } from "./toefl/section";
import { TopikSection } from "./topik/section";
import { EntranceRunner } from "./entrance/session";
import { EndMockButton } from "./end-mock";
import { AdminSkip, requestSkip, type SkipMode } from "./admin-skip";
import { SheetSitting, type SheetChrome } from "./sheet";
import { OpenReview } from "./open-review";

const MathFigure = dynamic(() => import("./figure").then(module => module.ExamFigureView));
// The AI examiner (IELTS Speaking stages) loads only when it is shown.
const SpeakingExaminer = dynamic(() => import("./speaking-examiner-view").then(module => module.SpeakingExaminer), { ssr: false });
const ExaminerInvitation = dynamic(() => import("./speaking-examiner-view").then(module => module.ExaminerInvitation), { ssr: false });
const speakingStage=(stage:PublicExamAttempt["stage"])=>stage?.kind==="speaking"||stage?.kind==="preparation";

function time(seconds:number){return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
function downloadText(filename:string,text:string,type="text/plain;charset=utf-8"){
  const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement("a");link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
/**
 * `examiner`: the server says the Speaking Lab's AI examiner is enabled; it is offered in IELTS Speaking stages only.
 * `admin`: the viewer is an admin, so the sitting shows the skip controls (the server checks again on every skip).
 */
export function ExamRunner({initial,examiner=false,admin=false}:{initial:PublicExamAttempt;examiner?:boolean;admin?:boolean}){
  return initial.program === "entrance" ? <EntranceRunner initial={initial} admin={admin}/> : <StandardExamRunner initial={initial} examiner={examiner&&initial.program==="ielts"} admin={admin}/>;
}

function StandardExamRunner({initial,examiner,admin}:{initial:PublicExamAttempt;examiner:boolean;admin:boolean}){
  const [attempt,setAttempt]=useState(initial),[answers,setAnswers]=useState(initial.responses),[flags,setFlags]=useState(initial.flags),[index,setIndex]=useState(0);
  const [remaining,setRemaining]=useState(Math.max(0,Math.ceil((Date.parse(initial.deadline)-Date.parse(initial.serverNow))/1000)));
  const [status,setStatus]=useState("Хадгалсан"),[error,setError]=useState(""),[conflict,setConflict]=useState(false),[tools,setTools]=useState(false),[hiddenTimer,setHiddenTimer]=useState(false);
  const [recoveries,setRecoveries]=useState<{stageId:string;url:string;error:string}[]>([]);
  const latest=useRef(initial),draft=useRef({...initial.responses}),flagDraft=useRef(initial.flags),generation=useRef(0),savedGeneration=useRef(0),busy=useRef(false),paused=useRef(false),leaving=useRef(false);
  const anchor=useRef({server:Date.parse(initial.serverNow),performance:0}),debounce=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const worker=useRef<(mode:"save"|"sync",force?:boolean)=>Promise<void>>(async()=>{}),questionHeading=useRef<HTMLHeadingElement>(null);
  const endpoint="/api/mock-attempts/"+initial.id;
  const router=useRouter();
  const {struck,toggle:strike}=useEliminations(initial.id);
  const {scale,controls:passageControls}=usePassageScale();
  // The student's examiner choice for this mock lives in this browser; "unknown" until the page has read it.
  const choice=useSyncExternalStore(subscribeExaminer,()=>examinerChoice(initial.slug),()=>"unknown" as const);
  const examining=examiner&&choice==="on"&&speakingStage(attempt.stage);
  const stageKind=attempt.stage?.kind;
  // Load the local speech models while the student is still writing, so the examiner's first line is not late.
  useEffect(()=>{
    if(!examiner||choice!=="on"||!stageKind||!["writing","speaking","preparation"].includes(stageKind))return;
    void fetch(endpoint+"/speaking/warm",{method:"POST"}).catch(()=>{});
  },[examiner,choice,stageKind,endpoint]);
  // The Listening layout shows a whole part at once, so single-question shortcuts are off there.
  const listeningView=(stage:PublicExamAttempt["stage"])=>stage?.kind==="listening"||stage?.id==="ielts-listening-check";
  useQuestionShortcuts(initial.program==="jlpt"||initial.program==="hsk"||initial.program==="toefl"||initial.program==="topik"||listeningView(attempt.stage)||examining?{}:{
    onPrevious:()=>{if(index>0&&latest.current.stage?.questions.length)navigate(index-1);},
    onNext:()=>{const count=latest.current.stage?.questions.length??0;if(index<count-1)navigate(index+1);},
    onFlag:()=>{if(latest.current.stage?.questions.length&&!paused.current)flag();},
    onOption:option=>{const value=latest.current.stage?.questions[index]?.options?.[option];if(value&&!paused.current)change(value);},
  });

  function accept(data:PublicExamAttempt,saved?:number,force=false){
    const old=latest.current;const moved=old.stage?.id!==data.stage?.id;
    if(!moved&&!force&&saved===undefined&&data.revision!==old.revision){paused.current=true;setConflict(true);setError("Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаалж үргэлжлүүлнэ үү.");return;}
    latest.current=data;anchor.current={server:Date.parse(data.serverNow),performance:performance.now()};setAttempt(data);
    // A new stage brings its own clock at once, so nothing reads the finished stage's zero as this stage's time.
    if(moved)setRemaining(Math.max(0,Math.ceil((Date.parse(data.deadline)-Date.parse(data.serverNow))/1000)));
    if(moved||force){draft.current={...data.responses};flagDraft.current=data.flags;generation.current++;savedGeneration.current=generation.current;setAnswers(data.responses);setFlags(data.flags);setIndex(0);setTools(false);setHiddenTimer(false);paused.current=false;setConflict(false);setError("");setStatus("Хадгалсан");}
    else if(saved!==undefined){savedGeneration.current=saved;if(generation.current===saved){draft.current={...data.responses};setAnswers(data.responses);}setStatus(generation.current===saved?"Хадгалсан":"Хадгалж байна…");}
  }
  async function network(mode:"save"|"sync",force=false){
    if(busy.current||(!force&&paused.current))return;
    if(mode==="save"&&generation.current===savedGeneration.current)return;
    busy.current=true;
    const current=latest.current,snapshot=generation.current;
    // Polls and saves skip the stage text the page already holds: a Reading stage is 30 KB every 10 seconds.
    const known=current.stage?endpoint+"?have="+encodeURIComponent(current.stage.id):endpoint;
    try{
      let response:Response;
      if(mode==="save"&&current.stage){
        setStatus("Хадгалж байна…");
        const ids=new Set(current.stage.questions.map(q=>q.id));
        response=await fetch(known,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision:current.revision,stageId:current.stage.id,responses:Object.fromEntries(Object.entries(draft.current).filter(([id])=>ids.has(id))),flags:flagDraft.current.filter(id=>ids.has(id))}),signal:AbortSignal.timeout(15000)});
      }else response=await fetch(known,{cache:"no-store",signal:AbortSignal.timeout(15000)});
      if(response.status===409){paused.current=true;setConflict(true);throw Error("conflict");}
      // Stopped (here or in another tab): nothing of it is kept, so the page goes back to the list.
      if(response.status===410){stopping();setError("Энэ шалгалтыг зогсоосон тул хариу, үр дүн хадгалагдаагүй.");router.replace("/workspace/review?ended=1");return;}
      if(response.status===401){setError("Нэвтрэх хугацаа дууссан. Шинэ цонхонд нэвтэрч, дараа дахин хадгална уу.");return;}
      if(!response.ok)throw Error("network");
      const data=await response.json() as PublicExamAttempt;
      accept(data.stageUnchanged?{...data,stage:current.stage}:data,mode==="save"?snapshot:undefined,force);if(!paused.current)setError("");
    }catch(reason){setStatus("Хадгалагдаагүй");setError(reason instanceof Error&&reason.message==="conflict"?"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.":"Холболт тасарсан байна. Энэ хуудсыг нээлттэй байлгаж дахин хадгална уу. Шалгалтын цаг үргэлжилж байгаа.");}
    finally{busy.current=false;if(generation.current!==savedGeneration.current&&!paused.current&&!latest.current.finishedAt){clearTimeout(debounce.current);debounce.current=setTimeout(()=>void worker.current("save"),1500);}}
  }
  // Stopping the sitting: autosave halts and leaving the page asks nothing (the answers are discarded anyway).
  function stopping(){leaving.current=true;paused.current=true;clearTimeout(debounce.current);}
  function resumeAfterFailedStop(){leaving.current=false;if(!conflict)paused.current=false;}
  // Admin testing: waits for an autosave in flight, then sends this stage's answers with the skip and loads the result.
  async function adminSkip(mode:SkipMode){
    paused.current=true;clearTimeout(debounce.current);
    for(let i=0;i<50&&busy.current;i++)await new Promise(resolve=>setTimeout(resolve,100));
    const current=latest.current;
    if(!current.stage){paused.current=false;return;}
    busy.current=true;
    try{
      const ids=new Set(current.stage.questions.map(q=>q.id));
      accept(await requestSkip<PublicExamAttempt>(endpoint,mode,{revision:current.revision,stageId:current.stage.id,responses:Object.fromEntries(Object.entries(draft.current).filter(([id])=>ids.has(id))),flags:flagDraft.current.filter(id=>ids.has(id))}),undefined,true);
    }catch(reason){if(!conflict)paused.current=false;throw reason;}
    finally{busy.current=false;}
  }
  useEffect(()=>{worker.current=network;});
  useEffect(()=>{
    anchor.current.performance=performance.now();
    const tick=setInterval(()=>{
      const state=latest.current;if(state.finishedAt)return;
      const now=anchor.current.server+performance.now()-anchor.current.performance;
      const seconds=Math.max(0,Math.ceil((Date.parse(state.deadline)-now)/1000));setRemaining(seconds);
      if(seconds===0)void worker.current(generation.current!==savedGeneration.current?"save":"sync");
    },250);
    const poll=setInterval(()=>{if(!latest.current.finishedAt)void worker.current(generation.current!==savedGeneration.current?"save":"sync");},10000);
    function beforeUnload(event:BeforeUnloadEvent){if(leaving.current)return;if(generation.current!==savedGeneration.current||latest.current.stage?.kind==="speaking")event.preventDefault();}
    window.addEventListener("beforeunload",beforeUnload);
    return()=>{clearInterval(tick);clearInterval(poll);clearTimeout(debounce.current);window.removeEventListener("beforeunload",beforeUnload);};
  },[]);
  useEffect(()=>{questionHeading.current?.focus();},[attempt.stage?.id]);

  const changeFor=useCallback((id:string,value:string)=>{
    if(paused.current||latest.current.finishedAt||!latest.current.stage?.questions.some(question=>question.id===id))return;
    draft.current={...draft.current,[id]:value};generation.current++;setAnswers(draft.current);setStatus("Хадгалж байна…");clearTimeout(debounce.current);debounce.current=setTimeout(()=>void worker.current("save"),500);
  },[]);
  function change(value:string){const question=latest.current.stage?.questions[index];if(question)changeFor(question.id,value);}
  const flagFor=useCallback((id:string)=>{
    if(paused.current||latest.current.finishedAt||!latest.current.stage?.questions.some(question=>question.id===id))return;
    flagDraft.current=flagDraft.current.includes(id)?flagDraft.current.filter(q=>q!==id):[...flagDraft.current,id];generation.current++;setFlags(flagDraft.current);setStatus("Хадгалж байна…");clearTimeout(debounce.current);debounce.current=setTimeout(()=>void worker.current("save"),500);
  },[]);
  function flag(){const question=latest.current.stage?.questions[index];if(question)flagFor(question.id);}
  function navigate(next:number){setIndex(next);requestAnimationFrame(()=>questionHeading.current?.focus());}
  async function uploadRecording(blob:Blob,stageId:string){
    const url=URL.createObjectURL(blob);setRecoveries(current=>[...current,{stageId,url,error:"Бичлэг хадгалж байна…"}]);
    try{
      const response=await fetch(endpoint+"/recordings/"+stageId,{method:"PUT",headers:{"Content-Type":blob.type},body:blob,signal:AbortSignal.timeout(60000)});
      if(!response.ok)throw Error("upload");setRecoveries(current=>current.filter(item=>item.url!==url));URL.revokeObjectURL(url);setTimeout(()=>void worker.current("sync"),1000);
    }catch{setRecoveries(current=>current.map(item=>item.url===url?{...item,error:"Бичлэг илгээгдсэнгүй. Алдахгүйн тулд татаж аваарай."}:item));}
  }
  // ЭЕШ Mathematics is in Mongolian; every other mock's questions are in English.
  const questionLang:string="en";
  const recovery=<>{recoveries.map(item=><div className="notice" key={item.url}><p>{item.error}</p><a className="text-link" href={item.url} download={item.stageId+".webm"}>Бичлэгээ татах ↓</a></div>)}</>;

  // A finished sitting opens its result on the Review page, once no recording is still uploading or waiting to be saved.
  if(attempt.report)return <OpenReview attempt={attempt} hold={recoveries.length>0}>{recovery}</OpenReview>;

  const stage=attempt.stage!;const question=stage.questions[index]??stage.questions[0];
  const hsk=attempt.program==="hsk",toefl=attempt.program==="toefl",topik=attempt.program==="topik";
  const math=/^sat-math/.test(stage.id),calculator=math;const elapsed=stage.seconds-remaining;const listening=listeningView(stage);
  const passage=question?.passage ? stage.passages?.find(p=>p.title===question.passage)?.text??question.passage : "";
  const answered=stage.questions.filter(q=>!!answers[q.id]?.trim()).length;
  // Changes only at the two thresholds, so a screen reader announces each one once.
  const timeNotice=remaining<=60?"1 минутаас бага хугацаа үлдлээ. "+(stage.questions.length-answered)+" асуултад хариулаагүй.":remaining<=300?"5 минутаас бага хугацаа үлдлээ.":"";
  const clock=<div className="exam-clock"><span role="timer" aria-label="Үлдсэн хугацаа" className={remaining<=300?"urgent":""}>{hiddenTimer&&remaining>300?"Цаг нуугдсан":time(remaining)}</span>{remaining>300?<button onClick={()=>setHiddenTimer(v=>!v)}>{hiddenTimer?"Харуулах":"Нуух"}</button>:null}</div>;
  const skipButtons=admin?<AdminSkip attemptId={attempt.id} last={attempt.stageIndex>=attempt.timeline.length-1} onSkip={adminSkip} className="text-link"/>:null;
  const endButton=<EndMockButton attemptId={attempt.id} title={attempt.title} className="text-link exam-end-link" onEnding={stopping} onFailed={resumeAfterFailedStop}/>;
  const alerts=<>{error?<div className="container error-message" role="alert"><p>{error}</p><div className="result-actions">{conflict?<button className="button secondary" onClick={()=>void network("sync",true)}>Хадгалсан хувилбарыг ачаалах</button>:<button className="button secondary" onClick={()=>void network("save")}>Дахин хадгалах</button>}<a className="text-link" href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</a><button className="text-link" onClick={()=>downloadText("unsent-exam-answers.json",JSON.stringify(draft.current,null,2),"application/json")}>Хариугаа татах ↓</button></div></div>:null}{recovery}
    <p className="sr-only" aria-live="polite">{timeNotice}</p></>;
  // JLPT draws the whole sitting itself (answer-sheet sidebar with the clock); the shared toolbar and meta row stay off.
  if(attempt.program==="jlpt")return <div className="exam-session jlpt-session">{alerts}
    <JlptSection key={stage.id} stage={stage} slug={attempt.slug} attemptId={attempt.id} version={attempt.audioRevision??1} elapsed={Math.max(0,elapsed)} answers={answers} flags={flags} disabled={conflict} onChange={changeFor} onFlag={flagFor} title={attempt.title} stageIndex={attempt.stageIndex} timeline={attempt.timeline} instructions={stage.instructions} clock={clock} status={status} end={<>{skipButtons}{endButton}</>}/>
  </div>;
  // Every timed programme but ЭЕШ now sits in the answer-sheet layout; JLPT, HSK, TOPIK and TOEFL draw their own pages in it.
  const chrome:SheetChrome={title:attempt.title,stageIndex:attempt.stageIndex,timeline:attempt.timeline,instructions:stage.instructions,clock,status,end:<>{skipButtons}{endButton}</>};
  const shared={stage,slug:attempt.slug,attemptId:attempt.id,elapsed:Math.max(0,elapsed),answers,flags,disabled:conflict,onChange:changeFor,onFlag:flagFor,chrome};
  if(hsk)return <div className="exam-session sheet-session">{alerts}<HskSection key={stage.id} {...shared}/></div>;
  if(topik)return <div className="exam-session sheet-session">{alerts}<TopikSection key={stage.id} {...shared}/></div>;
  if(toefl)return <div className="exam-session sheet-session">{alerts}<ToeflSection key={stage.id} {...shared} remaining={remaining} onRecording={blob=>void uploadRecording(blob,stage.id)}/></div>;
  // SAT and IELTS: one sheet row for the stage; Listening follows the recording, so its sheet only shows progress.
  const items=stage.questions.map((q,i)=>({id:q.id,label:String(i+1),state:answers[q.id]?.trim()?"answered" as const:undefined,flagged:flags.includes(q.id)}));
  const groups=stage.kind==="break"||examining||stage.questions.length<2?[]:[{id:stage.id,title:stage.title,items}];
  return <div className="exam-session sheet-session">{alerts}
    <SheetSitting chrome={chrome} heading={stage.title} groups={groups} current={listening?undefined:question?.id} onJump={listening?undefined:id=>navigate(stage.questions.findIndex(q=>q.id===id))}
      tools={calculator?<button type="button" aria-pressed={tools} onClick={()=>setTools(v=>!v)}>Тооны машин / томьёо</button>:null}
      note={listening?"Хуудас бичлэгийг дагана. Хариулсан асуулт энд тэмдэглэгдэнэ.":undefined}>
    <div className="exam-workspace">
      {listening?<ListeningSection version={attempt.audioRevision??1} attemptId={attempt.id} slug={attempt.slug} stage={stage} elapsed={stage.kind==="listening"?Math.max(0,elapsed):null} answers={answers} flags={flags} disabled={conflict} onChange={changeFor} onFlag={flagFor}/>:null}
      {stage.kind==="speaking"&&!toefl?<SpeakingRecorder key={stage.id} onComplete={blob=>void uploadRecording(blob,stage.id)}/>:null}
      {examiner&&speakingStage(stage)&&choice==="ask"?<ExaminerInvitation onChoose={value=>setExaminerChoice(attempt.slug,value)}/>:null}
      {examiner&&speakingStage(stage)&&choice==="off"?<p className="exam-examiner-switch">Асуултыг дэлгэцээс уншиж, чанга хариулна. <button className="text-link" onClick={()=>setExaminerChoice(attempt.slug,"on")}>AI шалгагчтай үргэлжлүүлэх →</button></p>:null}
      {/* Not keyed by stage: one examiner (and its audio) carries on through Parts 1, 2 and 3. */}
      {examining?<SpeakingExaminer base={endpoint} recordId={attempt.id} stage={stage} remaining={remaining} answers={answers} disabled={conflict} onChange={changeFor} onLeave={()=>setExaminerChoice(attempt.slug,"off")}/>:null}
      {math&&<MathScratchpad key={attempt.id} attemptId={attempt.id}/>}
      {tools&&calculator?<MathTools/>:null}
      {listening||examining?null:stage.kind==="break"?<section className="exam-break"><p className="eyebrow">Scheduled break · 10 minutes</p><h2>Амраад, Math хэсэгт бэлдээрэй.</h2><p>Завсарлага дуусмагц дараагийн хэсэг эхэлнэ. Энэ цагийг урагшлуулах эсвэл дахин эхлүүлэх боломжгүй.</p><strong>{time(remaining)}</strong></section>:question?<div className={"exam-question-layout "+(passage?"with-passage":"")}>
        {passage?<PassagePane title={stage.passages?question.passage!:"Passage / Information"} text={passage} caption={question.kind==="essay"?"Academic Writing · Task 1 data":undefined} controls={passageControls} scale={scale}/>:null}
        <section className="exam-answer-panel"><div className="exam-question-number"><strong>{question.kind==="essay"?"Task":questionLang==="mn"?"Даалгавар":"Question"} {index+1} {questionLang==="mn"?"/":"of"} {stage.questions.length}</strong><button aria-pressed={flags.includes(question.id)} onClick={flag} disabled={conflict}>⚑ {flags.includes(question.id)?"Тэмдэглэсэн":"Дараа харах"}</button></div><h2 lang={questionLang} ref={questionHeading} tabIndex={-1}>{question.prompt}</h2>
          {question.figure?<MathFigure figure={question.figure}/>:null}
          {question.kind==="choice"?<AnswerOptions name={question.id} selected={answers[question.id]} disabled={conflict} onSelect={change} lang={questionLang} struck={struck[question.id]} onStrike={option=>strike(question.id,option)} labels={question.optionLabels} options={question.options!.map(option=>({value:option,content:option}))}/>:
          question.kind==="essay"||question.kind==="speaking"?<div className="exam-written-response"><label htmlFor="exam-text">{stage.kind==="speaking"?"Туслах тэмдэглэл (үнэлгээ нь ярианы бичлэгээр хийгдэнэ)":stage.kind==="preparation"?"Нэг минутын төлөвлөгөө":"Your response"}</label><textarea id="exam-text" lang="en" rows={question.kind==="essay"?17:5} maxLength={question.kind==="essay"?16000:4000} value={answers[question.id]??""} onChange={e=>change(e.target.value)} disabled={conflict}/><p className="fine-print">{(answers[question.id]??"").trim().split(/\s+/).filter(Boolean).length} words{question.minWords?" · Minimum "+question.minWords:""}</p></div>:
          <div className="exam-short-response"><label htmlFor="exam-short">{question.kind==="number"?(attempt.program==="entrance"?"Хариу: бүхэл тоо эсвэл энгийн бутархай (жишээ нь −3, 9/2)":"Numerical response — integer, decimal or fraction"):"Your answer — follow the word/number limit above"}</label><input id="exam-short" lang="en" autoComplete="off" maxLength={question.kind==="number"?32:120} value={answers[question.id]??""} onChange={e=>change(e.target.value)} disabled={conflict}/></div>}
          <div className="question-actions"><button className="button secondary" disabled={index===0} onClick={()=>navigate(index-1)}>← Өмнөх</button>{index<stage.questions.length-1?<button className="button" onClick={()=>navigate(index+1)}>Дараах →</button>:<span className="fine-print exam-last-note">Сүүлийн асуулт · хариугаа хуудаснаас шалгана уу</span>}</div>
        </section></div>:null}
    </div>
    </SheetSitting>
  </div>;
}

