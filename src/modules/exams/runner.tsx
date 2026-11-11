"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AiAssistant } from "@/modules/tutor/panel";
import { MathScratchpad } from "@/components/math-scratchpad";
import "./speaking-examiner.css";
import { useCallback,useEffect,useRef,useState,useSyncExternalStore } from "react";
import { examinerChoice,setExaminerChoice,subscribeExaminer } from "./speaking-examiner-store";
import type { PublicExamAttempt } from "./types";
import { SpeakingRecorder } from "./speaking-recorder";
import { ListeningSection } from "./listening-section";
import { AnswerOptions, MathTools, PassagePane, QuestionStrip, shortcutHint, useEliminations, usePassageScale, useQuestionShortcuts } from "./session-tools";
import { questionFigure } from "./math-paper-model";
import { JlptSection } from "./jlpt/section";
import { JlptResults } from "./jlpt/results";
import { HskSection } from "./hsk/section";
import { HskResults } from "./hsk/results";
import { EntranceRunner } from "./entrance/session";

const MathText = dynamic(() => import("./math-text").then(module => module.MathText));
const MathFormula = dynamic(() => import("./math-text").then(module => module.MathFormula));
const MathFigure = dynamic(() => import("./figure").then(module => module.ExamFigureView));
// The AI examiner (IELTS Speaking stages) and its report load only when they are shown.
const SpeakingExaminer = dynamic(() => import("./speaking-examiner-view").then(module => module.SpeakingExaminer), { ssr: false });
const ExaminerInvitation = dynamic(() => import("./speaking-examiner-view").then(module => module.ExaminerInvitation), { ssr: false });
const MockSpeakingReport = dynamic(() => import("./speaking-examiner-view").then(module => module.MockSpeakingReport), { ssr: false });
const speakingStage=(stage:PublicExamAttempt["stage"])=>stage?.kind==="speaking"||stage?.kind==="preparation";

type ReviewFilter="all"|"wrong"|"blank"|"correct";
const reviewFilters:[ReviewFilter,string][]=[["all","Бүгд"],["wrong","Алдсан"],["blank","Хоосон"],["correct","Зөв"]];
function reviewGroup(review:{correct:boolean|null;selected:string}):ReviewFilter|null{
  if(review.correct===null)return null;
  return review.correct?"correct":review.selected.trim()?"wrong":"blank";
}

function time(seconds:number){return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
function downloadText(filename:string,text:string,type="text/plain;charset=utf-8"){
  const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement("a");link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
// Weakest skill first, so the result says what to work on next.
function DomainBreakdown({reviews}:{reviews:NonNullable<PublicExamAttempt["report"]>["reviews"]}){
  const domains=new Map<string,{correct:number;total:number}>();
  for(const review of reviews){
    if(review.pretest||review.correct===null)continue;
    const entry=domains.get(review.domain)??{correct:0,total:0};
    entry.total++;if(review.correct)entry.correct++;domains.set(review.domain,entry);
  }
  if(!domains.size)return null;
  const rows=[...domains].sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total);
  return <section className="review-domains" aria-label="Чадвар бүрийн үр дүн"><h2>Чадвар бүрийн үр дүн</h2>{rows.map(([domain,{correct,total}])=><div className="review-domain" key={domain}><span lang="en">{domain}</span><i aria-hidden="true"><b style={{width:Math.round(correct/total*100)+"%"}}/></i><span>{correct} / {total}</span></div>)}</section>;
}
/** `examiner`: the server says the Speaking Lab's AI examiner is enabled; it is offered in IELTS Speaking stages only. */
export function ExamRunner({initial,examiner=false}:{initial:PublicExamAttempt;examiner?:boolean}){
  return initial.program === "entrance" ? <EntranceRunner initial={initial}/> : <StandardExamRunner initial={initial} examiner={examiner&&initial.program==="ielts"}/>;
}

function StandardExamRunner({initial,examiner}:{initial:PublicExamAttempt;examiner:boolean}){
  const [attempt,setAttempt]=useState(initial),[answers,setAnswers]=useState(initial.responses),[flags,setFlags]=useState(initial.flags),[index,setIndex]=useState(0);
  const [remaining,setRemaining]=useState(Math.max(0,Math.ceil((Date.parse(initial.deadline)-Date.parse(initial.serverNow))/1000)));
  const [status,setStatus]=useState("Хадгалсан"),[error,setError]=useState(""),[conflict,setConflict]=useState(false),[grid,setGrid]=useState(false),[tools,setTools]=useState(false),[hiddenTimer,setHiddenTimer]=useState(false);
  const [recoveries,setRecoveries]=useState<{stageId:string;url:string;error:string}[]>([]);
  const latest=useRef(initial),draft=useRef({...initial.responses}),flagDraft=useRef(initial.flags),generation=useRef(0),savedGeneration=useRef(0),busy=useRef(false),paused=useRef(false);
  const anchor=useRef({server:Date.parse(initial.serverNow),performance:0}),debounce=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const worker=useRef<(mode:"save"|"sync",force?:boolean)=>Promise<void>>(async()=>{}),questionHeading=useRef<HTMLHeadingElement>(null);
  const endpoint="/api/mock-attempts/"+initial.id;
  const [reviewFilter,setReviewFilter]=useState<ReviewFilter>("all");
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
  useQuestionShortcuts(initial.program==="jlpt"||initial.program==="hsk"||listeningView(attempt.stage)||examining?{}:{
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
    if(moved||force){draft.current={...data.responses};flagDraft.current=data.flags;generation.current++;savedGeneration.current=generation.current;setAnswers(data.responses);setFlags(data.flags);setIndex(0);setGrid(false);setTools(false);setHiddenTimer(false);paused.current=false;setConflict(false);setError("");setStatus("Хадгалсан");}
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
      if(response.status===401){setError("Нэвтрэх хугацаа дууссан. Шинэ цонхонд нэвтэрч, дараа дахин хадгална уу.");return;}
      if(!response.ok)throw Error("network");
      const data=await response.json() as PublicExamAttempt;
      accept(data.stageUnchanged?{...data,stage:current.stage}:data,mode==="save"?snapshot:undefined,force);if(!paused.current)setError("");
    }catch(reason){setStatus("Хадгалагдаагүй");setError(reason instanceof Error&&reason.message==="conflict"?"Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу.":"Холболт тасарсан байна. Энэ хуудсыг нээлттэй байлгаж дахин хадгална уу. Шалгалтын цаг үргэлжилж байгаа.");}
    finally{busy.current=false;if(generation.current!==savedGeneration.current&&!paused.current&&!latest.current.finishedAt){clearTimeout(debounce.current);debounce.current=setTimeout(()=>void worker.current("save"),1500);}}
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
    function beforeUnload(event:BeforeUnloadEvent){if(generation.current!==savedGeneration.current||latest.current.stage?.kind==="speaking")event.preventDefault();}
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
  function navigate(next:number){setIndex(next);setGrid(false);requestAnimationFrame(()=>questionHeading.current?.focus());}
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

  if(attempt.report&&attempt.program==="jlpt")return <JlptResults attempt={attempt}/>;
  if(attempt.report&&attempt.program==="hsk")return <HskResults attempt={attempt}/>;
  if(attempt.report)return <div className="container page-space exam-results"><p className="eyebrow">Шалгалт дууссан · Хадгалсан үр дүн</p><h1>{attempt.title}</h1><p>Хугацаа дууссан хэсгүүдийн хариу өөрчлөгдөхгүй.</p>{recovery}
    <div className="exam-report-grid">{attempt.report.sections.map(section=><section key={section.title}><p className="eyebrow">{section.title}</p>{section.pending?<><strong>Хяналт хүлээгдэж байна</strong><p>{section.pending} хариу / prompt · Багшаар үнэлүүлнэ</p></>:<><strong>{section.correct}<span> / {section.total}</span></strong><p>Зөв хариулт · Raw count</p></>}</section>)}</div>
    <div className="notice">{attempt.program==="sat"?"SAT-ийн хоёрдугаар модуль нь 65%-ийн дадлагын босгоор сонгогдсон. Модуль бүрийн хоёр туршилтын асуултыг үндсэн raw тоонд оруулаагүй. Доор бүх 98 асуултын тайлбар бий. Үүнийг 400–1600 албан ёсны SAT оноонд хөрвүүлэхгүй.":attempt.program==="entrance"?"Зөв хариултын тоо (raw) гарлаа. Хариулт бүр нэг оноотой; албан ЭЕШ-ийн жинлэсэн оноо болон 800 онооны хөрвүүлэлт биш. Энэ mock-ийн даалгавруудыг энэ сайтад зориулж зохиосон.":"Listening болон Reading-ийн raw тоо гарлаа. Writing, Speaking нь task response, fluency, vocabulary, grammar болон pronunciation зэрэг шалгуураар багшийн үнэлгээ шаарддаг. Энэ mock нь band оноо зохиож гаргахгүй."}</div>
    {attempt.program==="ielts"?<section className="exam-recordings"><h2>Speaking бичлэгүүд</h2>{attempt.recordings.length?attempt.recordings.map(recording=><div key={recording.stageId}><h3>{recording.stageId.replace("ielts-","")}</h3><audio controls preload="none" src={endpoint+"/recordings/"+recording.stageId}/><a className="text-link" download={recording.stageId+(recording.mime.includes("mp4")?".m4a":".webm")} href={endpoint+"/recordings/"+recording.stageId}>Татах ↓</a></div>):<p>Хадгалсан бичлэг одоогоор алга. Илгээж буй бичлэг байвал дуусмагц шинэчилнэ.</p>}</section>:null}
    {examiner?<MockSpeakingReport attemptId={attempt.id} reviews={attempt.report.reviews}/>:null}
    <DomainBreakdown reviews={attempt.report.reviews}/>
    <div className="result-actions"><Link className="button" href={"/exams/"+attempt.slug+"/practice"}>Дадлагын горимд давтах →</Link><button className="button secondary" onClick={()=>downloadText("mock-exam-result.json",JSON.stringify(attempt,null,2),"application/json")}>Хариу, үр дүнгээ татах ↓</button><Link className="button secondary" href={"/workspace/review/"+attempt.id}>AI-тай задлах →</Link><Link className="button secondary" href="/exams">Бүх шалгалт →</Link><Link className="text-link" href="/workspace/review">Миний үр дүн</Link></div>
    <h2 className="exam-review-title">Хариу ба тайлбар</h2>
    <div className="review-filter" role="group" aria-label="Хариу шүүх">{reviewFilters.map(([name,label])=>{const count=name==="all"?attempt.report!.reviews.length:attempt.report!.reviews.filter(review=>reviewGroup(review)===name).length;return <button key={name} type="button" aria-pressed={reviewFilter===name} onClick={()=>setReviewFilter(name)}>{label} · {count}</button>;})}</div>
    <div className="exam-review-list">{attempt.report.reviews.map((review,i)=>reviewFilter!=="all"&&reviewGroup(review)!==reviewFilter?null:<details className="exam-review" key={review.id}><summary><span className={review.correct===null?"pending-label":review.correct?"correct":"incorrect"}>{review.pretest?"Pretest · ":""}{review.correct===null?"Хяналт":review.correct?"Зөв":"Алдсан / хоосон"}</span><span>{i+1}. {questionLang==="mn"?<MathText text={review.prompt}/>:<>{review.prompt.slice(0,140)}{review.prompt.length>140?"…":""}</>}</span></summary><p lang={questionLang}>{questionLang==="mn"?<MathText text={review.prompt}/>:review.prompt}</p>{questionFigure(review)?<MathFigure figure={questionFigure(review)!}/>:null}{review.passage?<details className="review-passage"><summary>Эх / өгөгдөл</summary><p lang="en">{review.passage}</p></details>:null}<p><strong>Таны хариу:</strong> {review.selected?(questionLang==="mn"?<MathFormula text={review.selected}/>:review.selected):"Хариулаагүй / аудио бичлэгийг үзнэ үү"}</p>{review.answer?<p><strong>Зөв хариу:</strong> {questionLang==="mn"?<MathFormula text={review.answer}/>:review.answer}</p>:null}<p className="explanation" lang={attempt.program==="entrance"?"mn":"en"}>{questionLang==="mn"?<MathText text={review.explanation}/>:review.explanation}</p>{review.id.startsWith("sat-math")&&<AiAssistant review label={"Асуулт "+(i+1)} target={{kind:"mock",attemptId:attempt.id,questionId:review.id}}/>}</details>)}</div>
  </div>;

  const stage=attempt.stage!;const question=stage.questions[index]??stage.questions[0];
  const hsk=attempt.program==="hsk";
  // JLPT and HSK draw their own section pages, so the generic strip, map and question panel stay off.
  const jlpt=attempt.program==="jlpt"||hsk;
  const math=/^sat-math/.test(stage.id),calculator=math;const elapsed=stage.seconds-remaining;const listening=listeningView(stage);
  const passage=question?.passage ? stage.passages?.find(p=>p.title===question.passage)?.text??question.passage : "";
  const answered=stage.questions.filter(q=>!!answers[q.id]?.trim()).length;
  // Changes only at the two thresholds, so a screen reader announces each one once.
  const timeNotice=remaining<=60?"1 минутаас бага хугацаа үлдлээ. "+(stage.questions.length-answered)+" асуултад хариулаагүй.":remaining<=300?"5 минутаас бага хугацаа үлдлээ.":"";
  return <div className="exam-session"><div className="exam-toolbar"><div><p className="eyebrow">{attempt.title}</p><h1>{stage.title}</h1></div><div className="exam-clock"><span role="timer" aria-label="Үлдсэн хугацаа" className={remaining<=300?"urgent":""}>{hiddenTimer&&remaining>300?"Цаг нуугдсан":time(remaining)}</span>{remaining>300?<button onClick={()=>setHiddenTimer(v=>!v)}>{hiddenTimer?"Харуулах":"Нуух"}</button>:null}</div></div>
    <div className="exam-session-meta"><p role="status">{status}</p><p>{attempt.stageIndex+1} / {attempt.timeline.length} хэсэг · {answered} / {stage.questions.length} хариулсан</p><div>{calculator?<button className="text-link" onClick={()=>setTools(v=>!v)}>Тооны машин / томьёо</button>:null}{jlpt||listening||examining?null:<button className="text-link" onClick={()=>setGrid(v=>!v)}>Асуултууд / Review</button>}</div></div>
    {error?<div className="container error-message" role="alert"><p>{error}</p><div className="result-actions">{conflict?<button className="button secondary" onClick={()=>void network("sync",true)}>Хадгалсан хувилбарыг ачаалах</button>:<button className="button secondary" onClick={()=>void network("save")}>Дахин хадгалах</button>}<a className="text-link" href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</a><button className="text-link" onClick={()=>downloadText("unsent-exam-answers.json",JSON.stringify(draft.current,null,2),"application/json")}>Хариугаа татах ↓</button></div></div>:null}{recovery}
    <p className="sr-only" aria-live="polite">{timeNotice}</p>
    <div className="container exam-workspace"><details className="exam-directions"><summary>Directions / Заавар</summary><p>{stage.instructions}</p></details>
      {hsk?<HskSection key={stage.id} stage={stage} slug={attempt.slug} attemptId={attempt.id} elapsed={Math.max(0,elapsed)} answers={answers} flags={flags} disabled={conflict} onChange={changeFor} onFlag={flagFor}/>:null}
      {jlpt&&!hsk?<JlptSection key={stage.id} stage={stage} slug={attempt.slug} attemptId={attempt.id} elapsed={Math.max(0,elapsed)} answers={answers} flags={flags} disabled={conflict} onChange={changeFor} onFlag={flagFor}/>:null}
      {!jlpt&&listening?<ListeningSection version={attempt.audioRevision??1} attemptId={attempt.id} slug={attempt.slug} stage={stage} elapsed={stage.kind==="listening"?Math.max(0,elapsed):null} answers={answers} flags={flags} disabled={conflict} onChange={changeFor} onFlag={flagFor}/>:null}
      {!jlpt&&!listening&&!examining&&stage.questions.length>1?<QuestionStrip current={question.id} onSelect={id=>navigate(stage.questions.findIndex(q=>q.id===id))} items={stage.questions.map((q,i)=>({id:q.id,label:String(i+1),state:answers[q.id]?.trim()?"answered":undefined,flagged:flags.includes(q.id)}))}/>:null}
      {!jlpt&&!listening&&!examining&&grid?<section className="exam-question-map"><h2>Асуултаа шалгах</h2><p>Тэмдэгтэй = дараа харах · Цэнхэр = хариулсан. Зөвхөн энэ хэсгийн асуултууд.</p><div>{stage.questions.map((q,i)=><button key={q.id} className={(answers[q.id]?"answered ":"")+(flags.includes(q.id)?"flagged":"")} onClick={()=>navigate(i)} aria-label={"Асуулт "+(i+1)+(flags.includes(q.id)?", тэмдэгтэй":"")}>{i+1}{flags.includes(q.id)?" ⚑":""}</button>)}</div><p className="fine-print">Хугацаа дуусахад дараагийн хэсэг автоматаар эхэлнэ. Эрт дуусгах боломжгүй.</p></section>:null}
      {stage.kind==="speaking"?<SpeakingRecorder key={stage.id} onComplete={blob=>void uploadRecording(blob,stage.id)}/>:null}
      {examiner&&speakingStage(stage)&&choice==="ask"?<ExaminerInvitation onChoose={value=>setExaminerChoice(attempt.slug,value)}/>:null}
      {examiner&&speakingStage(stage)&&choice==="off"?<p className="exam-examiner-switch">Асуултыг дэлгэцээс уншиж, чанга хариулна. <button className="text-link" onClick={()=>setExaminerChoice(attempt.slug,"on")}>AI шалгагчтай үргэлжлүүлэх →</button></p>:null}
      {/* Not keyed by stage: one examiner (and its audio) carries on through Parts 1, 2 and 3. */}
      {examining?<SpeakingExaminer base={endpoint} recordId={attempt.id} stage={stage} remaining={remaining} answers={answers} disabled={conflict} onChange={changeFor} onLeave={()=>setExaminerChoice(attempt.slug,"off")}/>:null}
      {math&&<MathScratchpad key={attempt.id} attemptId={attempt.id}/>}
      {tools&&calculator?<MathTools/>:null}
      {jlpt||listening||examining?null:stage.kind==="break"?<section className="exam-break"><p className="eyebrow">Scheduled break · 10 minutes</p><h2>Амраад, Math хэсэгт бэлдээрэй.</h2><p>Завсарлага дуусмагц дараагийн хэсэг эхэлнэ. Энэ цагийг урагшлуулах эсвэл дахин эхлүүлэх боломжгүй.</p><strong>{time(remaining)}</strong></section>:question?<div className={"exam-question-layout "+(passage?"with-passage":"")}>
        {passage?<PassagePane title={stage.passages?question.passage!:"Passage / Information"} text={passage} caption={question.kind==="essay"?"Academic Writing · Task 1 data":undefined} controls={passageControls} scale={scale}/>:null}
        <section className="exam-answer-panel"><div className="exam-question-number"><strong>{question.kind==="essay"?"Task":questionLang==="mn"?"Даалгавар":"Question"} {index+1} {questionLang==="mn"?"/":"of"} {stage.questions.length}</strong><button aria-pressed={flags.includes(question.id)} onClick={flag} disabled={conflict}>⚑ {flags.includes(question.id)?"Тэмдэглэсэн":"Дараа харах"}</button></div><h2 lang={questionLang} ref={questionHeading} tabIndex={-1}>{question.prompt}</h2>
          {question.figure?<MathFigure figure={question.figure}/>:null}
          {question.kind==="choice"?<AnswerOptions name={question.id} selected={answers[question.id]} disabled={conflict} onSelect={change} lang={questionLang} struck={struck[question.id]} onStrike={option=>strike(question.id,option)} labels={question.optionLabels} options={question.options!.map(option=>({value:option,content:option}))}/>:
          question.kind==="essay"||question.kind==="speaking"?<div className="exam-written-response"><label htmlFor="exam-text">{stage.kind==="speaking"?"Туслах тэмдэглэл (үнэлгээ нь ярианы бичлэгээр хийгдэнэ)":stage.kind==="preparation"?"Нэг минутын төлөвлөгөө":"Your response"}</label><textarea id="exam-text" lang="en" rows={question.kind==="essay"?17:5} maxLength={question.kind==="essay"?16000:4000} value={answers[question.id]??""} onChange={e=>change(e.target.value)} disabled={conflict}/><p className="fine-print">{(answers[question.id]??"").trim().split(/\s+/).filter(Boolean).length} words{question.minWords?" · Minimum "+question.minWords:""}</p></div>:
          <div className="exam-short-response"><label htmlFor="exam-short">{question.kind==="number"?(attempt.program==="entrance"?"Хариу: бүхэл тоо эсвэл энгийн бутархай (жишээ нь −3, 9/2)":"Numerical response — integer, decimal or fraction"):"Your answer — follow the word/number limit above"}</label><input id="exam-short" lang="en" autoComplete="off" maxLength={question.kind==="number"?32:120} value={answers[question.id]??""} onChange={e=>change(e.target.value)} disabled={conflict}/></div>}
          <div className="question-actions"><button className="button secondary" disabled={index===0} onClick={()=>navigate(index-1)}>← Өмнөх</button>{index<stage.questions.length-1?<button className="button" onClick={()=>navigate(index+1)}>Дараах →</button>:<button className="button" onClick={()=>setGrid(true)}>Хариугаа эргэн харах →</button>}</div>
          {question.kind==="choice"?<p className="shortcut-hint">{shortcutHint}</p>:null}
        </section></div>:null}
    </div><footer className="exam-session-footer"><Link href="/workspace">Workspace →</Link><p>Цаг зогсохгүй · Дууссан хэсэг түгжигдэнэ</p></footer>
  </div>;
}

