"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MathScratchpad } from "@/components/math-scratchpad";
import { AnswerOptions, MathTools, PassagePane, QuestionStrip, shortcutHint, useEliminations, usePassageScale, useQuestionShortcuts, type StripItem } from "@/modules/exams/session-tools";
import { RichText } from "@/modules/exams/rich-text";
import { ExamFigureView } from "@/modules/exams/figure";
import { AssistantButton, type AssistantConfig, type AssistantTurn } from "@/modules/tutor/panel";
import type { PracticeQuestion, PracticeReveal, PracticeView } from "./types";
import { ListeningPracticeView } from "./listening-view";
import { audioPath } from "@/modules/exams/audio-files";
import { JapaneseText } from "@/modules/exams/jlpt/text";
import { JlptPracticeAudio } from "@/modules/exams/jlpt/practice-audio";
import { HskPracticeAudio } from "@/modules/exams/hsk/practice-audio";
import { ChineseText, HskMaterial, HskQuestion, hskPart, transcriptLines } from "@/modules/exams/hsk/view";
import { examinerName, isTranscript, transcriptText } from "@/modules/exams/speaking-examiner";
import { ExaminerPicker, useExaminerVoice } from "@/modules/exams/speaking-examiner-picker";
import "./practice.css";

const MathText = dynamic(() => import("@/modules/exams/math-text").then(module => module.MathText));
const MathFormula = dynamic(() => import("@/modules/exams/math-text").then(module => module.MathFormula));
// The Speaking Lab's AI examiner for the IELTS Speaking sections, loaded only when the student opens it.
const SpeakingExaminer = dynamic(() => import("@/modules/exams/speaking-examiner-view").then(module => module.SpeakingExaminer), { ssr: false });
const SpeakingReportCard = dynamic(() => import("@/modules/exams/speaking-examiner-view").then(module => module.SpeakingReportCard), { ssr: false });

type Filter = "all" | "open" | "wrong" | "flagged";
const filterNames: Record<Filter, string> = { all: "Бүгд", open: "Шалгаагүй", wrong: "Алдсан", flagged: "Тэмдэгтэй" };

const reviewedByPerson = (question: PracticeQuestion) => question.kind === "essay" || question.kind === "speaking";
const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function stateOf(question: PracticeQuestion, reveal: PracticeReveal | undefined, response: string | undefined): StripItem["state"] {
  if (reveal) return reveal.correct === null ? "review" : reveal.correct ? "correct" : "wrong";
  return response?.replace(/_/g, "").trim() ? "answered" : undefined;
}

export function PracticeWorkspace({initial,speakingLab,initialSection}:{initial:PracticeView;speakingLab?:boolean;initialSection?:string}) {
  const {form}=initial;
  const url="/api/exam-practice/"+form.slug;
  const [responses,setResponses]=useState(initial.responses),[flags,setFlags]=useState(initial.flags),[reveals,setReveals]=useState(initial.reveals);
  const [currentId,setCurrentId]=useState(()=>{const list=form.questions.filter(q=>q.section===initialSection);return ((list.length?list:form.questions).find(question=>!initial.reveals[question.id])??list[0]??form.questions[0]).id;});
  const [readings,setReadings]=useState(true);
  const [filter,setFilter]=useState<Filter>("all"),[status,setStatus]=useState("Хадгалсан"),[error,setError]=useState(""),[checking,setChecking]=useState(false),[tools,setTools]=useState(false);
  const [conversations,setConversations]=useState<Record<string,AssistantTurn[]>>({});
  // Opened by a click, which is also what lets the browser play the examiner's voice.
  const [examiner,setExaminer]=useState(false);
  const examinerVoice=useExaminerVoice();
  const pending=useRef<Record<string,string>>({}),flagsDirty=useRef(false),flagsLatest=useRef(initial.flags),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),saving=useRef<Promise<boolean>|null>(null),heading=useRef<HTMLDivElement>(null);
  const {struck,toggle}=useEliminations("practice-"+form.slug);
  const {scale,controls}=usePassageScale();

  const question=form.questions.find(item=>item.id===currentId)??form.questions[0];
  const section=form.sections.find(item=>item.id===question.section)!;
  const sectionQuestions=useMemo(()=>form.questions.filter(item=>item.section===question.section),[form.questions,question.section]);
  const reveal=reveals[question.id];
  const examinerOffered=Boolean(speakingLab)&&form.subject==="ielts"&&section.kind==="speaking";
  const examining=examinerOffered&&examiner;
  const examinerStage=useMemo(()=>({id:section.id,kind:"speaking",questions:sectionQuestions.map(item=>({id:item.id,prompt:item.prompt??""}))}),[section.id,sectionQuestions]);
  const spoken=useMemo(()=>form.questions.filter(item=>item.kind==="speaking"&&isTranscript(responses[item.id])).map(item=>transcriptText(responses[item.id])).filter(Boolean),[form.questions,responses]);

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
  function changeFor(target:PracticeQuestion,value:string){
    if(reveals[target.id]&&!reviewedByPerson(target))return;
    pending.current={...pending.current,[target.id]:value};setResponses(current=>({...current,[target.id]:value}));queueSave();
  }
  function change(value:string){changeFor(question,value);}
  function flagFor(id:string){
    const next=flagsLatest.current.includes(id)?flagsLatest.current.filter(item=>item!==id):[...flagsLatest.current,id];
    flagsLatest.current=next;flagsDirty.current=true;setFlags(next);queueSave();
  }
  function toggleFlag(){flagFor(question.id);}
  // Checks several questions in order through the same per-question endpoint (used for a Listening part).
  async function checkMany(ids:string[]){
    if(checking||!ids.length)return;
    setChecking(true);setError("");
    try{
      for(const id of ids){
        if(reveals[id])continue;
        const rest={...pending.current};delete rest[id];pending.current=rest;
        const response=await fetch(url+"/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({questionId:id,response:responses[id]??""}),signal:AbortSignal.timeout(15000)});
        const data=await response.json();
        if(!response.ok)throw Error(data.error);
        setReveals(current=>({...current,[id]:data.reveal}));
      }
    }catch(reason){setError(reason instanceof Error&&reason.message&&reason.name!=="TimeoutError"?reason.message:"Холболтоо шалгаад дахин оролдоно уу.");}
    finally{setChecking(false);}
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
  const choices=question.kind==="choice"?question.options??[]:[];
  // IELTS Listening shows a whole part in the Listening Lab layout, so single-question shortcuts are off there.
  const listening=form.subject!=="jlpt"&&form.subject!=="hsk"&&sectionQuestions.length>1&&sectionQuestions.every(item=>item.audioPart);
  useQuestionShortcuts(listening||examining?{}:{
    onPrevious:()=>{if(previous)go(previous.id);},
    onNext:()=>{if(next)go(next.id);},
    onFlag:toggleFlag,
    onOption:index=>{if(choices[index]&&!reveal)change(choices[index]);},
    onSubmit:()=>{if(!reveal)void check();},
  });

  const summary=useMemo(()=>{
    const known=form.questions.filter(item=>reveals[item.id]);
    const graded=known.filter(item=>reveals[item.id].correct!==null);
    return {checked:known.length,graded:graded.length,correct:graded.filter(item=>reveals[item.id].correct).length,
      points:graded.reduce((sum,item)=>sum+(item.points??1),0),
      earned:graded.filter(item=>reveals[item.id].correct).reduce((sum,item)=>sum+(item.points??1),0)};
  },[form.questions,reveals]);
  const wrongHere=sectionQuestions.filter(item=>reveals[item.id]?.correct===false).map(item=>item.id);
  const passage=question.passage?form.passages.find(item=>item.title===question.passage)?.text??question.passage:"";
  const passageTitle=question.passage&&form.passages.some(item=>item.title===question.passage)?question.passage:"Passage / Information";
  const value=responses[question.id]??"";
  const person=reviewedByPerson(question);
  // Math and physics mocks are Mongolian; the English paper keeps its English questions and answers. Every ЭЕШ explanation is Mongolian.
  const mathPaper=form.subject==="eesh-math",physicsPaper=form.subject==="eesh-physics",entrance=form.subject.startsWith("eesh-");
  const jlpt=form.subject==="jlpt",hsk=form.subject==="hsk",part=hsk?hskPart(question.section):undefined;
  const answerLang=jlpt?"ja":hsk?"zh-CN":entrance&&form.subject!=="eesh-english"?"mn":"en",explainLang=entrance?"mn":"en";
  const hasAnswer=Boolean(value.replace(/_/g,"").trim());
  const optionContent=(option:string)=>jlpt?<JapaneseText text={option} readings={readings}/>:mathPaper?<MathFormula text={option}/>:form.subject==="eesh-english"?<RichText text={option}/>:option;

  const assistant:AssistantConfig={
    url:url+"/assistant",payload:{questionId:question.id},plain:true,beforeSend:flush,credits:"practice-assistant",
    label:section.title+" · "+(person?"Даалгавар ":"Асуулт ")+question.label,
    greeting:person?"Сайн уу! Санаа, бүтэц эсвэл бичсэн зүйлийнхээ талаар асуугаарай.":reveal?"Энэ асуултыг хамт ойлгоё. Юу нь эргэлзээтэй байна?":"Сайн уу! Хариуг шууд хэлэхгүй, харин өөрөө олоход тань тусална.",
    note:"Илгээхэд энэ даалгавар, таны хадгалсан хариу AI руу очно. Албан ёсны үнэлгээ биш.",
    suggestions:person?[["hint","Санаа, бүтэц"],["review","Бичсэнд минь санал өг"],["followup","Төстэй даалгавар"]]:reveal?[["review","Алдаагаа ойлгох"],["explain","Алхам алхмаар"],["followup","Төстэй асуулт"]]:[["hint","Санаа өгөх"],["explain","Арга заах"],["followup","Төстэй асуулт"]],
  };

  return <div className="exam-session practice-session">
    <div className="exam-toolbar">
      <div><p className="eyebrow">Дадлагын горим · Цаггүй · {form.title}</p><h1>{section.title}</h1></div>
      <div className="practice-score">{entrance?<><strong>{summary.earned}<span> / {summary.points} оноо</span></strong><small>{summary.correct} / {summary.graded} зөв · {summary.checked} / {form.questions.length} шалгасан</small></>:<><strong>{summary.correct}<span> / {summary.graded}</span></strong><small>зөв · {summary.checked} / {form.questions.length} шалгасан</small></>}</div>
    </div>
    <div className="exam-session-meta">
      <p role="status">{status}</p>
      <p className="practice-progress">{sectionQuestions.filter(item=>reveals[item.id]).length} / {sectionQuestions.length} энэ хэсэгт</p>
      <div>
        {jlpt?<button type="button" className="text-link" aria-pressed={readings} onClick={()=>setReadings(!readings)}>ふりがな {readings?"✓":"—"}</button>:null}
        {hsk?<button type="button" className="text-link" aria-pressed={readings} onClick={()=>setReadings(!readings)}>Pinyin {readings?"✓":"—"}</button>:null}
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
      {examinerOffered&&!examining?<div className="practice-examiner-offer"><div><strong>AI шалгагчтай ярих</strong><p>{examinerName(examinerVoice)} энэ хэсгийн асуултуудыг чанга уншиж, таны хариуг сонсоод бичвэр болгон хадгална. Цаггүй; хэсгийг дахин хийж болно. Хариуг бичвэр болгохын тулд дууг манай сервер рүү илгээнэ (тэндээс яриа таних үйлчилгээнд дамжиж болно).</p><ExaminerPicker/></div><button type="button" className="button" onClick={()=>setExaminer(true)}>AI шалгагчтай эхлэх →</button></div>:null}
      {examining?<SpeakingExaminer base={url} recordId={"practice:"+form.slug} stage={examinerStage} answers={responses} disabled={false}
        onChange={(id,value)=>{const target=sectionQuestions.find(item=>item.id===id);if(target)changeFor(target,value);}}
        onRestart={ids=>{for(const id of ids){const target=sectionQuestions.find(item=>item.id===id);if(target)changeFor(target,"");}}}
        onLeave={()=>setExaminer(false)}/>:null}
      {examinerOffered?<SpeakingReportCard base={url} recordId={"practice:"+form.slug} transcripts={spoken} note="дадлагын үр дүнд орохгүй"/>:null}
      {examining?null:listening?<ListeningPracticeView audio={url+audioPath(form.slug)} questions={sectionQuestions} currentId={question.id} responses={responses} reveals={reveals} flags={flags} checking={checking}
        onSelect={setCurrentId} onChange={(id,value)=>{const target=sectionQuestions.find(item=>item.id===id);if(target)changeFor(target,value);}} onFlag={flagFor}
        onCheck={ids=>void checkMany(ids)} onRetry={ids=>void retry(ids)}
        assistant={<AssistantButton config={assistant} turns={conversations[question.id]??[]} setTurns={update=>setConversations(current=>({...current,[question.id]:update(current[question.id]??[])}))}/>}/>:<>
      <div className="practice-filter" role="group" aria-label="Асуулт шүүх">
        {(Object.keys(filterNames) as Filter[]).map(name=><button key={name} type="button" aria-pressed={filter===name} onClick={()=>setFilter(name)}>{filterNames[name]}</button>)}
        {wrongHere.length?<button type="button" className="practice-retry-all" onClick={()=>void retry(wrongHere)}>Алдсан {wrongHere.length} асуултаа дахин ажиллах</button>:null}
      </div>
      <QuestionStrip current={question.id} onSelect={go} items={strip.map(item=>({id:item.id,label:item.label,state:stateOf(item,reveals[item.id],responses[item.id]),flagged:flags.includes(item.id)}))}/>
      {section.math?<MathScratchpad key={"practice-"+form.slug} attemptId={"practice-"+form.slug}/>:null}
      {tools?<MathTools/>:null}
      {jlpt&&question.audioPart?<JlptPracticeAudio key={question.id} slug={form.slug} questionId={question.id} part={question.audioPart}/>:null}
      {hsk&&question.audioPart?<HskPracticeAudio key={question.id} slug={form.slug} questionId={question.id} part={question.audioPart}/>:null}
      {!jlpt&&!hsk&&question.audioPart?<section className="listening-player practice-audio"><div><strong>Listening · Part {question.audioPart} / 4</strong></div><audio key={question.audioPart} controls preload="none" src={url+audioPath(form.slug)+"?part="+question.audioPart} aria-label={"Listening recording part "+question.audioPart}/></section>:null}
      <div className={"exam-question-layout "+(passage?"with-passage":"")}>
        {passage&&jlpt?<aside className="jlpt-passage" aria-label="Унших эх"><JapaneseText text={passage} readings={readings}/></aside>:null}
        {passage&&!jlpt?<PassagePane title={passageTitle} text={passage} caption={question.kind==="essay"?"Academic Writing · Task 1 data":undefined} controls={controls} scale={scale}/>:null}
        <section className="exam-answer-panel">
          <div className="exam-question-number" ref={heading} tabIndex={-1}><strong>{person?"Task":answerLang==="en"?"Question":"Даалгавар"} {question.label}{hsk?"":" / "+sectionQuestions.length}{question.points?<span className="practice-points"> · {question.points} оноо</span>:null}</strong><button aria-pressed={flags.includes(question.id)} onClick={toggleFlag}>⚑ {flags.includes(question.id)?"Тэмдэглэсэн":"Дараа харах"}</button></div>
          {question.instructions?<section className="practice-context practice-task"><p className="eyebrow">{jlpt?"問題":hsk?"说明 · Заавар":form.subject==="eesh-english"?(/^\d/.test(question.task??"")?"Task "+question.task:question.task??"Task"):"Даалгавар "+(question.task??"")}</p><div lang={answerLang}>{mathPaper||physicsPaper?<MathText text={question.instructions}/>:<RichText text={question.instructions}/>}</div></section>:null}
          {question.groupFigure?<ExamFigureView figure={question.groupFigure}/>:null}
          {question.context?<section className="practice-context"><p className="eyebrow">{question.contextTitle??"Өгөгдөл"}</p><div lang="en"><RichText text={question.context}/></div></section>:null}
          {question.wordBank?.length?<section className="practice-bank" aria-label="Сонголтын сан"><p className="eyebrow">СОНГОЛТУУД</p><ol>{question.wordBank.map(item=><li key={item.label}><span>{item.label}</span><RichText text={item.text}/></li>)}</ol></section>:null}
          {hsk&&part?<div className="practice-hsk"><HskMaterial group={question.hskGroup} readings={readings}/><HskQuestion question={question} part={part} value={value} disabled={Boolean(reveal)} readings={readings} correct={reveal?.answerValue} onChange={change}/></div>:null}
          {!hsk&&question.prompt?<h2 lang={answerLang}>{mathPaper||physicsPaper?<MathText text={question.prompt}/>:jlpt?<JapaneseText text={question.prompt} readings={readings}/>:form.subject==="eesh-english"?<RichText text={question.prompt}/>:question.prompt}</h2>:null}
          {!hsk&&question.figure?<ExamFigureView figure={question.figure}/>:null}
          {!hsk&&choices.length?<AnswerOptions name={question.id} selected={value} disabled={Boolean(reveal)} lang={answerLang} labels={question.optionLabels} onSelect={change} struck={struck[question.id]} onStrike={option=>toggle(question.id,option)} correctValue={reveal?.answerValue??reveal?.answer} options={choices.map(option=>({value:option,content:optionContent(option)}))}/>:null}
          {person?<div className="exam-written-response"><label htmlFor="practice-text">{question.kind==="speaking"?"Санаа, тэмдэглэл":"Your response"}</label><textarea id="practice-text" lang="en" rows={question.kind==="essay"?15:5} maxLength={question.kind==="essay"?16000:4000} value={value} onChange={event=>change(event.target.value)}/><p className="fine-print">{words(value)} words{question.minWords?" · Minimum "+question.minWords:""}</p></div>:null}
          {question.kind==="short"||question.kind==="number"?<div className="exam-short-response"><label htmlFor="practice-short">{entrance?"Хариу":question.kind==="number"?"Numerical response — integer, decimal or fraction":"Your answer — follow the word/number limit above"}</label><input id="practice-short" lang={answerLang} autoComplete="off" spellCheck={false} disabled={Boolean(reveal)} maxLength={160} value={value} onChange={event=>change(event.target.value)}/></div>:null}

          {reveal?<section className="practice-feedback" data-result={reveal.correct===null?"review":reveal.correct?"correct":"wrong"} role="status">
            <strong>{reveal.correct===null?"Зөвлөмж":reveal.correct?"Зөв":hasAnswer?"Буруу":"Хариулаагүй"}</strong>
            {reveal.answer?<p>Зөв хариу: <b lang={answerLang}>{mathPaper?<MathFormula text={reveal.answer}/>:reveal.answer}</b></p>:null}
            {reveal.explanation?<p lang={explainLang}>{mathPaper||physicsPaper?<MathText text={reveal.explanation}/>:reveal.explanation}</p>:null}
            {reveal.transcript?<details className="practice-transcript"><summary>Бичлэгийн текст</summary><div lang={answerLang}>{hsk?transcriptLines(reveal.transcript).map((line,i)=><p key={i}><ChineseText line={line} readings={readings}/></p>):reveal.transcript.split("\n\n").map((line,i)=><p key={i}>{line}</p>)}</div></details>:null}
            {person?null:<button type="button" className="text-link" onClick={()=>void retry([question.id])}>Энэ асуултыг дахин ажиллах</button>}
          </section>:null}

          <div className="practice-actions">
            {reveal?null:<button type="button" className="button" disabled={checking} onClick={()=>void check()}>{checking?"Шалгаж байна…":person?"Зөвлөмж харах":hasAnswer?"Шалгах":"Хариуг харах"}</button>}
            <AssistantButton config={assistant} turns={conversations[question.id]??[]} setTurns={update=>setConversations(current=>({...current,[question.id]:update(current[question.id]??[])}))}/>
          </div>
          <div className="question-actions"><button className="button secondary" disabled={!previous} onClick={()=>previous&&go(previous.id)}>← Өмнөх</button>{next?<button className="button" onClick={()=>go(next.id)}>Дараах →</button>:nextSection?<button className="button" onClick={()=>openSection(nextSection.id)}>Дараагийн хэсэг →</button>:<Link className="button" href="/workspace">Дуусгах →</Link>}</div>
          <p className="shortcut-hint">{entrance?null:<>{shortcutHint} · Enter шалгах</>}</p>
        </section>
      </div>
      </>}
    </div>
    <footer className="exam-session-footer"><Link href="/workspace">Workspace →</Link><p>Дадлагын үр дүн шалгалтын түүхэнд орохгүй · Албан ёсны оноо биш</p></footer>
  </div>;
}
