"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MathScratchpad } from "@/components/math-scratchpad";
import { AnswerOptions, MathTools, PassagePane, QuestionStrip, shortcutHint, useEliminations, usePassageScale, useQuestionShortcuts, type StripItem } from "@/modules/exams/session-tools";
import { paperImageUrl } from "@/modules/papers/images";
import { AssistantButton, type AssistantConfig } from "@/modules/tutor/panel";
import type { TutorTurn } from "@/modules/tutor/contracts";
import type { PracticeQuestion, PracticeReveal, PracticeView } from "./types";
import "./practice.css";

export type RenderedQuestion = { body: ReactNode; options?: ReactNode[] };
type Filter = "all" | "open" | "wrong" | "flagged";
const filterNames: Record<Filter, string> = { all: "Бүгд", open: "Шалгаагүй", wrong: "Алдсан", flagged: "Тэмдэгтэй" };

const reviewedByPerson = (question: PracticeQuestion) => question.kind === "essay" || question.kind === "speaking";
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function stateOf(question: PracticeQuestion, reveal: PracticeReveal | undefined, response: string | undefined): StripItem["state"] {
  if (reveal) return reveal.correct === null ? "review" : reveal.correct ? "correct" : "wrong";
  return response?.replace(/_/g, "").trim() ? "answered" : undefined;
}

export function PracticeWorkspace({initial,rendered,formulas,speakingLab}:{initial:PracticeView;rendered?:Record<string,RenderedQuestion>;formulas?:ReactNode;speakingLab?:boolean}) {
  const {form}=initial;
  const url="/api/exam-practice/"+form.slug;
  const [responses,setResponses]=useState(initial.responses),[flags,setFlags]=useState(initial.flags),[reveals,setReveals]=useState(initial.reveals);
  const [currentId,setCurrentId]=useState(()=>(form.questions.find(question=>!initial.reveals[question.id])??form.questions[0]).id);
  const [filter,setFilter]=useState<Filter>("all"),[status,setStatus]=useState("Хадгалсан"),[error,setError]=useState(""),[checking,setChecking]=useState(false),[tools,setTools]=useState(false);
  const [page,setPage]=useState(0),[zoom,setZoom]=useState(1),[conversations,setConversations]=useState<Record<string,TutorTurn[]>>({});
  const pending=useRef<Record<string,string>>({}),flagsDirty=useRef(false),flagsLatest=useRef(initial.flags),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),saving=useRef<Promise<boolean>|null>(null),heading=useRef<HTMLDivElement>(null);
  const {struck,toggle}=useEliminations("practice-"+form.slug);
  const {scale,controls}=usePassageScale();

  const question=form.questions.find(item=>item.id===currentId)??form.questions[0];
  const section=form.sections.find(item=>item.id===question.section)!;
  const sectionQuestions=useMemo(()=>form.questions.filter(item=>item.section===question.section),[form.questions,question.section]);
  const reveal=reveals[question.id];

  const flush=useCallback(async():Promise<boolean>=>{
    clearTimeout(timer.current);
    if(saving.current)await saving.current;
    const body=pending.current,dirty=flagsDirty.current;
    if(!Object.keys(body).length&&!dirty){setStatus("Хадгалсан");return true;}
    pending.current={};flagsDirty.current=false;setStatus("Хадгалж байна…");
    const run=(async()=>{
      try{
        const response=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({responses:body,...(dirty?{flags:flagsLatest.current}:{})}),signal:AbortSignal.timeout(15000)});
        const data=await response.json();
        if(!response.ok)throw Error(data.error);
        if(!Object.keys(pending.current).length)setStatus("Хадгалсан");
        setError("");return true;
      }catch(reason){
        pending.current={...body,...pending.current};flagsDirty.current=flagsDirty.current||dirty;
        setStatus("Хадгалагдаагүй");setError(reason instanceof Error&&reason.message&&reason.name!=="TimeoutError"?reason.message:"Холболтоо шалгана уу. Хариу хадгалагдаагүй байна.");return false;
      }finally{saving.current=null;}
    })();
    saving.current=run;return run;
  },[url]);
  useEffect(()=>{
    function beforeUnload(event:BeforeUnloadEvent){if(Object.keys(pending.current).length||flagsDirty.current)event.preventDefault();}
    window.addEventListener("beforeunload",beforeUnload);
    return()=>{window.removeEventListener("beforeunload",beforeUnload);clearTimeout(timer.current);};
  },[]);
  function queueSave(){setStatus("Хадгалж байна…");clearTimeout(timer.current);timer.current=setTimeout(()=>void flush(),600);}
  function change(value:string){
    if(reveal&&!reviewedByPerson(question))return;
    pending.current={...pending.current,[question.id]:value};setResponses(current=>({...current,[question.id]:value}));queueSave();
  }
  function toggleFlag(){
    const next=flags.includes(question.id)?flags.filter(id=>id!==question.id):[...flags,question.id];
    flagsLatest.current=next;flagsDirty.current=true;setFlags(next);queueSave();
  }
  async function check(){
    if(checking||(reveal&&!reviewedByPerson(question)))return;
    setChecking(true);setError("");
    try{
      const value=responses[question.id]??"";
      const rest={...pending.current};delete rest[question.id];pending.current=rest;
      const response=await fetch(url+"/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionId:question.id,response:value}),signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok)throw Error(data.error);
      setReveals(current=>({...current,[question.id]:data.reveal}));
    }catch(reason){setError(reason instanceof Error&&reason.message&&reason.name!=="TimeoutError"?reason.message:"Холболтоо шалгаад дахин оролдоно уу.");}
    finally{setChecking(false);}
  }
  async function retry(ids:string[]){
    if(!ids.length)return;
    setError("");await flush();
    try{
      const response=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({retry:ids}),signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok)throw Error(data.error);
      setReveals(current=>Object.fromEntries(Object.entries(current).filter(([id])=>!ids.includes(id))));
      setResponses(current=>Object.fromEntries(Object.entries(current).filter(([id])=>!ids.includes(id))));
    }catch(reason){setError(reason instanceof Error&&reason.message?reason.message:"Холболтоо шалгана уу.");}
  }
  async function resetAll(){
    if(!confirm("Энэ шалгалтын дадлагын бүх хариу, шалгасан үр дүн устана. Үргэлжлүүлэх үү?"))return;
    clearTimeout(timer.current);pending.current={};flagsDirty.current=false;
    try{
      const response=await fetch(url,{method:"DELETE",signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok)throw Error(data.error);
      setResponses({});setFlags([]);flagsLatest.current=[];setReveals({});setConversations({});setFilter("all");setCurrentId(form.questions[0].id);setStatus("Хадгалсан");setError("");
    }catch(reason){setError(reason instanceof Error&&reason.message?reason.message:"Холболтоо шалгана уу.");}
  }

  const visible=useMemo(()=>sectionQuestions.filter(item=>{
    if(filter==="open")return !reveals[item.id];
    if(filter==="wrong")return reveals[item.id]?.correct===false;
    if(filter==="flagged")return flags.includes(item.id);
    return true;
  }),[sectionQuestions,filter,reveals,flags]);
  // The question in view always stays on the strip, so checking it never makes it vanish.
  const strip=visible.some(item=>item.id===question.id)?visible:[...visible,question].sort((a,b)=>sectionQuestions.indexOf(a)-sectionQuestions.indexOf(b));
  const stripIndex=strip.findIndex(item=>item.id===question.id);
  const previous=strip[stripIndex-1],next=strip[stripIndex+1];
  const nextSection=form.sections[form.sections.indexOf(section)+1];

  function go(id:string){setCurrentId(id);setTools(false);requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"nearest"});});}
  function openSection(id:string){const list=form.questions.filter(item=>item.section===id);go((list.find(item=>!reveals[item.id])??list[0]).id);}
  const choices=question.kind==="choice"||question.kind==="paper-choice"?question.options??[]:[];
  useQuestionShortcuts({
    onPrevious:()=>{if(previous)go(previous.id);},
    onNext:()=>{if(next)go(next.id);},
    onFlag:toggleFlag,
    onOption:index=>{if(choices[index]&&!reveal)change(choices[index]);},
    onSubmit:()=>{if(!reveal)void check();},
  });

  const summary=useMemo(()=>{
    const known=form.questions.filter(item=>reveals[item.id]);
    const graded=known.filter(item=>reveals[item.id].correct!==null&&!item.ungraded);
    return {checked:known.length,graded:graded.length,correct:graded.filter(item=>reveals[item.id].correct).length};
  },[form.questions,reveals]);
  const wrongHere=sectionQuestions.filter(item=>reveals[item.id]?.correct===false).map(item=>item.id);
  const passage=question.passage?form.passages.find(item=>item.title===question.passage)?.text??question.passage:"";
  const passageTitle=question.passage&&form.passages.some(item=>item.title===question.passage)?question.passage:"Passage / Information";
  const value=responses[question.id]??"";
  const english=form.subject==="eec-english";
  const person=reviewedByPerson(question);
  const custom=rendered?.[question.id];
  const answerLang=form.subject==="sat"||form.subject==="ielts"?"en":"mn";
  const hasAnswer=Boolean(value.replace(/_/g,"").trim());

  const assistant:AssistantConfig={
    url:url+"/assistant",payload:{questionId:question.id},plain:true,beforeSend:flush,
    label:section.title+" · "+(person?"Даалгавар ":"Асуулт ")+question.label,
    greeting:english?"Энэ шалгалтын хуудас зураг хэлбэртэй тул би асуултыг харж чадахгүй. Асуулт, хариултын сонголтуудаа бичээд илгээгээрэй.":person?"Сайн уу! Санаа, бүтэц эсвэл бичсэн зүйлийнхээ талаар асуугаарай.":reveal?"Энэ асуултыг хамт ойлгоё. Юу нь эргэлзээтэй байна?":"Сайн уу! Хариуг шууд хэлэхгүй, харин өөрөө олоход тань тусална.",
    note:"Илгээхэд энэ даалгавар, таны хадгалсан хариу DeepSeek руу очно. Албан ёсны үнэлгээ биш.",
    placeholder:english?"Асуултын текстээ бичих…":undefined,
    suggestions:person?[["hint","Санаа, бүтэц"],["review","Бичсэнд минь санал өг"],["followup","Төстэй даалгавар"]]:reveal?[["review","Алдаагаа ойлгох"],["explain","Алхам алхмаар"],["followup","Төстэй асуулт"]]:[["hint","Санаа өгөх"],["explain","Арга заах"],["followup","Төстэй асуулт"]],
  };

  return <div className="exam-session practice-session">
    <div className="exam-toolbar">
      <div><p className="eyebrow">Дадлагын горим · Цаггүй · {form.title}</p><h1>{section.title}</h1></div>
      <div className="practice-score"><strong>{summary.correct}<span> / {summary.graded}</span></strong><small>зөв · {summary.checked} / {form.questions.length} шалгасан</small></div>
    </div>
    <div className="exam-session-meta">
      <p role="status">{status}</p>
      <p className="practice-progress">{sectionQuestions.filter(item=>reveals[item.id]).length} / {sectionQuestions.length} энэ хэсэгт</p>
      <div>
        {section.math&&form.subject==="sat"?<button className="text-link" onClick={()=>setTools(open=>!open)}>Тооны машин / томьёо</button>:null}
        <Link className="text-link" href={form.briefingHref}>Цагтай шалгалт</Link>
        <button className="text-link" onClick={()=>void resetAll()}>Дахин эхлэх</button>
      </div>
    </div>
    {error?<div className="container error-message" role="alert"><p>{error}</p></div>:null}
    <div className="container exam-workspace">
      <nav className="practice-sections" aria-label="Хэсгүүд">{form.sections.map(item=>{
        const list=form.questions.filter(q=>q.section===item.id);
        return <button key={item.id} type="button" aria-current={item.id===section.id?"true":undefined} onClick={()=>openSection(item.id)}><span>{item.title}</span><small>{list.filter(q=>reveals[q.id]).length} / {list.length}</small></button>;
      })}</nav>
      <p className="practice-hint">{section.hint}{section.kind==="speaking"&&speakingLab?<> <Link className="text-link" href="/labs/ielts-speaking">Speaking Lab-д чанга ярьж дасгал хийх →</Link></>:null}</p>
      <div className="practice-filter" role="group" aria-label="Асуулт шүүх">
        {(Object.keys(filterNames) as Filter[]).map(name=><button key={name} type="button" aria-pressed={filter===name} onClick={()=>setFilter(name)}>{filterNames[name]}</button>)}
        {wrongHere.length?<button type="button" className="practice-retry-all" onClick={()=>void retry(wrongHere)}>Алдсан {wrongHere.length} асуултаа дахин ажиллах</button>:null}
      </div>
      <QuestionStrip current={question.id} onSelect={go} items={strip.map(item=>({id:item.id,label:item.label,state:stateOf(item,reveals[item.id],responses[item.id]),flagged:flags.includes(item.id)}))}/>
      {section.math?<MathScratchpad key={"practice-"+form.slug} attemptId={"practice-"+form.slug}/>:null}
      {formulas&&section.math?formulas:null}
      {tools?<MathTools/>:null}
      {question.audioPart?<section className="listening-player practice-audio"><div><strong>Listening · Part {question.audioPart} / 4</strong></div><audio key={question.audioPart} controls preload="none" src={url+"/audio?part="+question.audioPart} aria-label={"Listening recording part "+question.audioPart}/></section>:null}
      <div className={"exam-question-layout "+(passage||english?"with-passage":"")}>
        {english?<section className="exam-passage practice-pages" aria-label="Эх хуудас">
          <div className="paper-page-controls"><div><button className="admin-small-button" disabled={page===0} onClick={()=>setPage(page-1)} aria-label="Өмнөх хуудас">←</button><span>{page+1} / {form.pages.length}</span><button className="admin-small-button" disabled={page===form.pages.length-1} onClick={()=>setPage(page+1)} aria-label="Дараагийн хуудас">→</button></div><button className="admin-small-button" onClick={()=>setZoom(zoom===1?1.5:zoom===1.5?2:1)}>Томруулах · {Math.round(zoom*100)}%</button></div>
          {/* Same-origin copies preserve the original bytes of the source pages. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="official-page-image" src={paperImageUrl(form.pages[page])} alt={form.title+" · "+(page+1)+"-р эх хуудас"} style={{width:zoom*100+"%",maxWidth:"none"}} referrerPolicy="no-referrer"/>
        </section>:passage?<PassagePane title={passageTitle} text={passage} caption={question.kind==="essay"?"Academic Writing · Task 1 data":undefined} controls={controls} scale={scale}/>:null}
        <section className="exam-answer-panel">
          <div className="exam-question-number" ref={heading} tabIndex={-1}><strong>{person?"Task":answerLang==="en"?"Question":"Даалгавар"} {question.label} / {sectionQuestions.length}{question.ungraded?" · үнэлэхгүй":""}</strong><button aria-pressed={flags.includes(question.id)} onClick={toggleFlag}>⚑ {flags.includes(question.id)?"Тэмдэглэсэн":"Дараа харах"}</button></div>
          {custom?<div className="practice-rendered">{custom.body}</div>:question.prompt?<h2 lang={answerLang}>{question.prompt}</h2>:<h2>{question.label}-р даалгаврыг эх хуудаснаас уншаад хариултаа оруулна уу.</h2>}
          {choices.length?<AnswerOptions name={question.id} selected={value} disabled={Boolean(reveal)} lang={answerLang} onSelect={change} compact={english} struck={struck[question.id]} onStrike={english?undefined:option=>toggle(question.id,option)} correctValue={reveal?.answer} options={choices.map((option,i)=>({value:option,content:question.kind==="paper-choice"?custom?.options?.[i]??"":option}))}/>:null}
          {question.kind==="paper-digits"?<div className="paper-fill practice-digits"><div>{question.cells!.map((cell,i)=><label key={cell}>{cell}<input aria-label={question.label+" · "+cell} inputMode="numeric" pattern="[0-9]" maxLength={1} disabled={Boolean(reveal)} value={value[i]&&value[i]!=="_"?value[i]:""} onChange={event=>{const digit=event.target.value.replace(/\D/g,"").slice(-1);const cells=value.padEnd(question.cells!.length,"_").split("");cells[i]=digit||"_";change(cells.join(""));}}/></label>)}</div></div>:null}
          {person?<div className="exam-written-response"><label htmlFor="practice-text">{question.kind==="speaking"?"Санаа, тэмдэглэл":"Your response"}</label><textarea id="practice-text" lang="en" rows={question.kind==="essay"?15:5} maxLength={question.kind==="essay"?16000:4000} value={value} onChange={event=>change(event.target.value)}/><p className="fine-print">{words(value)} words{question.minWords?" · Minimum "+question.minWords:""}</p></div>:null}
          {question.kind==="short"||question.kind==="number"?<div className="exam-short-response"><label htmlFor="practice-short">{question.kind==="number"?"Numerical response — integer, decimal or fraction":"Your answer — follow the word/number limit above"}</label><input id="practice-short" lang="en" autoComplete="off" disabled={Boolean(reveal)} maxLength={question.kind==="number"?32:120} value={value} onChange={event=>change(event.target.value)}/></div>:null}

          {reveal?<section className="practice-feedback" data-result={reveal.correct===null?"review":reveal.correct?"correct":"wrong"} role="status">
            <strong>{reveal.correct===null?"Зөвлөмж":reveal.correct?"Зөв":hasAnswer?"Буруу":"Хариулаагүй"}{reveal.maxMarks?" · "+reveal.marks+" / "+reveal.maxMarks+" оноо":""}</strong>
            {reveal.answer?<p>Зөв хариу: <b lang={answerLang}>{reveal.answer}</b></p>:null}
            {reveal.explanation?<p lang={answerLang}>{reveal.explanation}</p>:reveal.correct!==null&&!person&&answerLang==="mn"?<p>Албан түлхүүрт бодолт байхгүй. AI туслахаас алхам алхмаар асууж болно.</p>:null}
            {reveal.transcript?<details className="practice-transcript"><summary>Бичлэгийн текст</summary><div lang="en">{reveal.transcript.split("\n\n").map((line,i)=><p key={i}>{line}</p>)}</div></details>:null}
            {person?null:<button type="button" className="text-link" onClick={()=>void retry([question.id])}>Энэ асуултыг дахин ажиллах</button>}
          </section>:null}

          <div className="practice-actions">
            {reveal?null:<button type="button" className="button" disabled={checking} onClick={()=>void check()}>{checking?"Шалгаж байна…":person?"Зөвлөмж харах":hasAnswer?"Шалгах":"Хариуг харах"}</button>}
            <AssistantButton config={assistant} turns={conversations[question.id]??[]} setTurns={update=>setConversations(current=>({...current,[question.id]:update(current[question.id]??[])}))}/>
          </div>
          <div className="question-actions"><button className="button secondary" disabled={!previous} onClick={()=>previous&&go(previous.id)}>← Өмнөх</button>{next?<button className="button" onClick={()=>go(next.id)}>Дараах →</button>:nextSection?<button className="button" onClick={()=>openSection(nextSection.id)}>Дараагийн хэсэг →</button>:<Link className="button" href="/dashboard">Дуусгах →</Link>}</div>
          <p className="shortcut-hint">{shortcutHint} · Enter шалгах</p>
        </section>
      </div>
    </div>
    <footer className="exam-session-footer"><Link href="/dashboard">Миний бэлтгэл →</Link><p>Дадлагын үр дүн шалгалтын түүхэнд орохгүй · Албан ёсны оноо биш</p></footer>
  </div>;
}
