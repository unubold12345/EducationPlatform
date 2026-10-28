"use client";
import Link from "next/link";
import { AiAssistant } from "@/modules/tutor/panel";
import { MathScratchpad } from "@/components/math-scratchpad";
import { useEffect,useRef,useState } from "react";
import type { PublicExamAttempt } from "./types";
import { SpeakingRecorder } from "./speaking-recorder";
import { ListeningPlayer } from "./listening-player";

function time(seconds:number){return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
function downloadText(filename:string,text:string,type="text/plain;charset=utf-8"){
  const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement("a");link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function ExamRunner({initial}:{initial:PublicExamAttempt}){
  const [attempt,setAttempt]=useState(initial),[answers,setAnswers]=useState(initial.responses),[flags,setFlags]=useState(initial.flags),[index,setIndex]=useState(0);
  const [remaining,setRemaining]=useState(Math.max(0,Math.ceil((Date.parse(initial.deadline)-Date.parse(initial.serverNow))/1000)));
  const [status,setStatus]=useState("Хадгалсан"),[error,setError]=useState(""),[conflict,setConflict]=useState(false),[grid,setGrid]=useState(false),[tools,setTools]=useState(false),[hiddenTimer,setHiddenTimer]=useState(false);
  const [recoveries,setRecoveries]=useState<{stageId:string;url:string;error:string}[]>([]);
  const latest=useRef(initial),draft=useRef({...initial.responses}),flagDraft=useRef(initial.flags),generation=useRef(0),savedGeneration=useRef(0),busy=useRef(false),paused=useRef(false);
  const anchor=useRef({server:Date.parse(initial.serverNow),performance:0}),debounce=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const worker=useRef<(mode:"save"|"sync",force?:boolean)=>Promise<void>>(async()=>{}),questionHeading=useRef<HTMLHeadingElement>(null);
  const endpoint="/api/mock-attempts/"+initial.id;

  function accept(data:PublicExamAttempt,saved?:number,force=false){
    const old=latest.current;const moved=old.stage?.id!==data.stage?.id;
    if(!moved&&!force&&saved===undefined&&data.revision!==old.revision){paused.current=true;setConflict(true);setError("Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаалж үргэлжлүүлнэ үү.");return;}
    latest.current=data;anchor.current={server:Date.parse(data.serverNow),performance:performance.now()};setAttempt(data);
    if(moved||force){draft.current={...data.responses};flagDraft.current=data.flags;generation.current++;savedGeneration.current=generation.current;setAnswers(data.responses);setFlags(data.flags);setIndex(0);setGrid(false);setTools(false);setHiddenTimer(false);paused.current=false;setConflict(false);setError("");setStatus("Хадгалсан");}
    else if(saved!==undefined){savedGeneration.current=saved;if(generation.current===saved){draft.current={...data.responses};setAnswers(data.responses);}setStatus(generation.current===saved?"Хадгалсан":"Хадгалж байна…");}
  }
  async function network(mode:"save"|"sync",force=false){
    if(busy.current||(!force&&paused.current))return;
    if(mode==="save"&&generation.current===savedGeneration.current)return;
    busy.current=true;
    const current=latest.current,snapshot=generation.current;
    try{
      let response:Response;
      if(mode==="save"&&current.stage){
        setStatus("Хадгалж байна…");
        const ids=new Set(current.stage.questions.map(q=>q.id));
        response=await fetch(endpoint,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({revision:current.revision,stageId:current.stage.id,responses:Object.fromEntries(Object.entries(draft.current).filter(([id])=>ids.has(id))),flags:flagDraft.current.filter(id=>ids.has(id))}),signal:AbortSignal.timeout(15000)});
      }else response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(15000)});
      if(response.status===409){paused.current=true;setConflict(true);throw Error("conflict");}
      if(response.status===401){setError("Нэвтрэх хугацаа дууссан. Шинэ цонхонд нэвтэрч, дараа дахин хадгална уу.");return;}
      if(!response.ok)throw Error("network");
      accept(await response.json(),mode==="save"?snapshot:undefined,force);if(!paused.current)setError("");
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

  function change(value:string){
    const question=latest.current.stage!.questions[index];draft.current={...draft.current,[question.id]:value};generation.current++;setAnswers(draft.current);setStatus("Хадгалж байна…");clearTimeout(debounce.current);debounce.current=setTimeout(()=>void worker.current("save"),500);
  }
  function flag(){
    const id=latest.current.stage!.questions[index].id;
    flagDraft.current=flagDraft.current.includes(id)?flagDraft.current.filter(q=>q!==id):[...flagDraft.current,id];generation.current++;setFlags(flagDraft.current);setStatus("Хадгалж байна…");clearTimeout(debounce.current);debounce.current=setTimeout(()=>void worker.current("save"),500);
  }
  function navigate(next:number){setIndex(next);setGrid(false);requestAnimationFrame(()=>questionHeading.current?.focus());}
  async function uploadRecording(blob:Blob,stageId:string){
    const url=URL.createObjectURL(blob);setRecoveries(current=>[...current,{stageId,url,error:"Бичлэг хадгалж байна…"}]);
    try{
      const response=await fetch(endpoint+"/recordings/"+stageId,{method:"PUT",headers:{"Content-Type":blob.type},body:blob,signal:AbortSignal.timeout(60000)});
      if(!response.ok)throw Error("upload");setRecoveries(current=>current.filter(item=>item.url!==url));URL.revokeObjectURL(url);setTimeout(()=>void worker.current("sync"),1000);
    }catch{setRecoveries(current=>current.map(item=>item.url===url?{...item,error:"Бичлэг илгээгдсэнгүй. Алдахгүйн тулд татаж аваарай."}:item));}
  }
  const recovery=<>{recoveries.map(item=><div className="notice" key={item.url}><p>{item.error}</p><a className="text-link" href={item.url} download={item.stageId+".webm"}>Бичлэгээ татах ↓</a></div>)}</>;

  if(attempt.report)return <div className="container page-space exam-results"><p className="eyebrow">Шалгалт дууссан · Хадгалсан үр дүн</p><h1>{attempt.title}</h1><p>Хугацаа дууссан хэсгүүдийн хариу өөрчлөгдөхгүй.</p>{recovery}
    <div className="exam-report-grid">{attempt.report.sections.map(section=><section key={section.title}><p className="eyebrow">{section.title}</p>{section.pending?<><strong>Хяналт хүлээгдэж байна</strong><p>{section.pending} хариу / prompt · Багшаар үнэлүүлнэ</p></>:<><strong>{section.correct}<span> / {section.total}</span></strong><p>Зөв хариулт · Raw count</p></>}</section>)}</div>
    <div className="notice">{attempt.program==="sat"?"SAT-ийн хоёрдугаар модуль нь 65%-ийн дадлагын босгоор сонгогдсон. Модуль бүрийн хоёр туршилтын асуултыг үндсэн raw тоонд оруулаагүй. Доор бүх 98 асуултын тайлбар бий. Үүнийг 400–1600 албан ёсны SAT оноонд хөрвүүлэхгүй.":"Listening болон Reading-ийн raw тоо гарлаа. Writing, Speaking нь task response, fluency, vocabulary, grammar болон pronunciation зэрэг шалгуураар багшийн үнэлгээ шаарддаг. Энэ mock нь band оноо зохиож гаргахгүй."}</div>
    {attempt.program==="ielts"?<section className="exam-recordings"><h2>Speaking бичлэгүүд</h2>{attempt.recordings.length?attempt.recordings.map(recording=><div key={recording.stageId}><h3>{recording.stageId.replace("ielts-","")}</h3><audio controls preload="none" src={endpoint+"/recordings/"+recording.stageId}/><a className="text-link" download={recording.stageId+(recording.mime.includes("mp4")?".m4a":".webm")} href={endpoint+"/recordings/"+recording.stageId}>Татах ↓</a></div>):<p>Хадгалсан бичлэг одоогоор алга. Илгээж буй бичлэг байвал дуусмагц шинэчилнэ.</p>}</section>:null}
    <div className="result-actions"><button className="button" onClick={()=>downloadText("mock-exam-result.json",JSON.stringify(attempt,null,2),"application/json")}>Хариу, үр дүнгээ татах ↓</button><Link className="button secondary" href="/exams">Бүх шалгалт →</Link><Link className="text-link" href="/dashboard">Миний бэлтгэл</Link></div>
    <h2 className="exam-review-title">Хариу ба тайлбар</h2><div className="exam-review-list">{attempt.report.reviews.map((review,i)=><details className="exam-review" key={review.id}><summary><span className={review.correct===null?"pending-label":review.correct?"correct":"incorrect"}>{review.pretest?"Pretest · ":""}{review.correct===null?"Хяналт":review.correct?"Зөв":"Алдсан / хоосон"}</span><span>{i+1}. {review.prompt.slice(0,140)}{review.prompt.length>140?"…":""}</span></summary><p lang="en">{review.prompt}</p>{review.passage?<details className="review-passage"><summary>Эх / өгөгдөл</summary><p lang="en">{review.passage}</p></details>:null}<p><strong>Таны хариу:</strong> {review.selected||"Хариулаагүй / аудио бичлэгийг үзнэ үү"}</p>{review.answer?<p><strong>Зөв хариу:</strong> {review.answer}</p>:null}<p className="explanation" lang="en">{review.explanation}</p>{review.id.startsWith("sat-math")&&<AiAssistant review label={"Асуулт "+(i+1)} target={{kind:"mock",attemptId:attempt.id,questionId:review.id}}/>}</details>)}</div>
  </div>;

  const stage=attempt.stage!;const question=stage.questions[index]??stage.questions[0];
  const math=stage.id.startsWith("sat-math");const elapsed=stage.seconds-remaining;
  const passage=question?.passage ? stage.passages?.find(p=>p.title===question.passage)?.text??question.passage : "";
  const tableRows=question?.kind==="essay"&&passage.includes(" | ") ? passage.split("\n").map(row=>row.split(" | ")) : null;
  const answered=stage.questions.filter(q=>!!answers[q.id]?.trim()).length;
  return <div className="exam-session"><div className="exam-toolbar"><div><p className="eyebrow">{attempt.program==="sat"?"Digital SAT":"IELTS Academic"} · Full Mock 01</p><h1>{stage.title}</h1></div><div className="exam-clock"><span role="timer" aria-label="Үлдсэн хугацаа" className={remaining<=300?"urgent":""}>{hiddenTimer&&remaining>300?"Цаг нуугдсан":time(remaining)}</span>{remaining>300?<button onClick={()=>setHiddenTimer(v=>!v)}>{hiddenTimer?"Харуулах":"Нуух"}</button>:null}</div></div>
    <div className="exam-session-meta"><p role="status">{status}</p><p>{attempt.stageIndex+1} / {attempt.timeline.length} хэсэг · {answered} / {stage.questions.length} хариулсан</p><div>{math?<button className="text-link" onClick={()=>setTools(v=>!v)}>Тооны машин / томьёо</button>:null}<button className="text-link" onClick={()=>setGrid(v=>!v)}>Асуултууд / Review</button></div></div>
    {error?<div className="container error-message" role="alert"><p>{error}</p><div className="result-actions">{conflict?<button className="button secondary" onClick={()=>void network("sync",true)}>Хадгалсан хувилбарыг ачаалах</button>:<button className="button secondary" onClick={()=>void network("save")}>Дахин хадгалах</button>}<a className="text-link" href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</a><button className="text-link" onClick={()=>downloadText("unsent-exam-answers.json",JSON.stringify(draft.current,null,2),"application/json")}>Хариугаа татах ↓</button></div></div>:null}{recovery}
    <div className="container exam-workspace"><details className="exam-directions"><summary>Directions / Заавар</summary><p>{stage.instructions}</p></details>
      {grid?<section className="exam-question-map"><h2>Асуултаа шалгах</h2><p>Тэмдэгтэй = дараа харах · Цэнхэр = хариулсан. Зөвхөн энэ хэсгийн асуултууд.</p><div>{stage.questions.map((q,i)=><button key={q.id} className={(answers[q.id]?"answered ":"")+(flags.includes(q.id)?"flagged":"")} onClick={()=>navigate(i)} aria-label={"Асуулт "+(i+1)+(flags.includes(q.id)?", тэмдэгтэй":"")}>{i+1}{flags.includes(q.id)?" ⚑":""}</button>)}</div><p className="fine-print">Хугацаа дуусахад дараагийн хэсэг автоматаар эхэлнэ. Эрт дуусгах боломжгүй.</p></section>:null}
      {stage.kind==="listening"?<ListeningPlayer attemptId={attempt.id} elapsed={Math.max(0,elapsed)}/>:null}
      {stage.kind==="speaking"?<SpeakingRecorder key={stage.id} onComplete={blob=>void uploadRecording(blob,stage.id)}/>:null}
      {math&&<MathScratchpad key={attempt.id} attemptId={attempt.id}/>}
      {tools&&math?<section className="exam-tools"><div><h2>Desmos graphing calculator</h2><p className="fine-print">Интернет шаардлагатай. Өөрийн зөвшөөрөгдсөн тооны машиныг мөн ашиглаж болно.</p><iframe title="Desmos graphing calculator" src="https://www.desmos.com/calculator?embed" loading="lazy"/></div><div><h2>Reference</h2><p>Circle: A = πr², C = 2πr<br/>Rectangle: A = ℓw<br/>Triangle: A = ½bh<br/>Right triangle: a² + b² = c²<br/>45°–45°–90°: x, x, x√2<br/>30°–60°–90°: x, x√3, 2x<br/>Rectangular prism: V = ℓwh<br/>Cylinder: V = πr²h<br/>Cone: V = ⅓πr²h<br/>Sphere: V = ⁴⁄₃πr³<br/>Rectangular pyramid: V = ⅓ℓwh<br/>Triangle angles: 180°<br/>Full circle: 360° = 2π radians</p></div></section>:null}
      {stage.kind==="break"?<section className="exam-break"><p className="eyebrow">Scheduled break · 10 minutes</p><h2>Амраад, Math хэсэгт бэлдээрэй.</h2><p>Завсарлага дуусмагц дараагийн хэсэг эхэлнэ. Энэ цагийг урагшлуулах эсвэл дахин эхлүүлэх боломжгүй.</p><strong>{time(remaining)}</strong></section>:question?<div className={"exam-question-layout "+(passage?"with-passage":"")}>
        {passage?<section className="exam-passage" lang="en"><h2>{stage.passages?question.passage:"Passage / Information"}</h2>{tableRows?<div className="table-scroll"><table><caption>Commuting in a fictional town</caption><thead><tr>{tableRows[0].map(cell=><th scope="col" key={cell}>{cell}</th>)}</tr></thead><tbody>{tableRows.slice(1).map(row=><tr key={row[0]}>{row.map((cell,i)=>i===0?<th scope="row" key={i}>{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>:passage.split("\n\n").map((p,i)=><p key={i}>{p}</p>)}</section>:null}
        <section className="exam-answer-panel"><div className="exam-question-number"><strong>{question.kind==="essay"?"Task":"Question"} {index+1} of {stage.questions.length}</strong><button aria-pressed={flags.includes(question.id)} onClick={flag} disabled={conflict}>⚑ {flags.includes(question.id)?"Тэмдэглэсэн":"Дараа харах"}</button></div><h2 lang="en" ref={questionHeading} tabIndex={-1}>{question.prompt}</h2>
          {question.kind==="choice"?<fieldset disabled={conflict}><legend className="sr-only">Select one answer</legend>{question.options!.map((option,i)=><label className={"answer-option "+(answers[question.id]===option?"selected":"")} key={option}><input type="radio" name={question.id} checked={answers[question.id]===option} onChange={()=>change(option)}/><span className="option-letter">{String.fromCharCode(65+i)}</span><span lang="en">{option}</span></label>)}</fieldset>:
          question.kind==="essay"||question.kind==="speaking"?<div className="exam-written-response"><label htmlFor="exam-text">{stage.kind==="speaking"?"Туслах тэмдэглэл (үнэлгээ нь ярианы бичлэгээр хийгдэнэ)":stage.kind==="preparation"?"Нэг минутын төлөвлөгөө":"Your response"}</label><textarea id="exam-text" lang="en" rows={question.kind==="essay"?17:5} maxLength={question.kind==="essay"?16000:4000} value={answers[question.id]??""} onChange={e=>change(e.target.value)} disabled={conflict}/><p className="fine-print">{(answers[question.id]??"").trim().split(/\s+/).filter(Boolean).length} words{question.minWords?" · Minimum "+question.minWords:""}</p></div>:
          <div className="exam-short-response"><label htmlFor="exam-short">{question.kind==="number"?"Numerical response — integer, decimal or fraction":"Your answer — follow the word/number limit above"}</label><input id="exam-short" lang="en" autoComplete="off" maxLength={question.kind==="number"?32:120} value={answers[question.id]??""} onChange={e=>change(e.target.value)} disabled={conflict}/></div>}
          <div className="question-actions"><button className="button secondary" disabled={index===0} onClick={()=>navigate(index-1)}>← Өмнөх</button>{index<stage.questions.length-1?<button className="button" onClick={()=>navigate(index+1)}>Дараах →</button>:<button className="button" onClick={()=>setGrid(true)}>Хариугаа эргэн харах →</button>}</div>
        </section></div>:null}
    </div><footer className="exam-session-footer"><Link href="/dashboard">Хадгалсан шалгалтууд →</Link><p>Цаг зогсохгүй · Дууссан хэсэг түгжигдэнэ</p></footer>
  </div>;
}

