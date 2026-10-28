"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { TutorInput, TutorTarget, TutorTurn } from "./contracts";
import styles from "./tutor.module.css";

type Phase = "closed" | "open" | "closing";

// AI assistant for one question: a button that slides a chat panel in from the right.
// Nothing is rendered or sent until the student opens it; the conversation survives closing and reopening.
export function AiAssistant({target,review=false,label}:{target:TutorTarget;review?:boolean;label:string}) {
  const [phase,setPhase]=useState<Phase>("closed"),[turns,setTurns]=useState<TutorTurn[]>([]);
  const trigger=useRef<HTMLButtonElement>(null),timer=useRef(0);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function open(){clearTimeout(timer.current);setPhase("open");}
  // The exit animation lasts 260ms; finish on a timer so a missed animationend can never strand the overlay.
  function close(){
    clearTimeout(timer.current);
    const done=()=>{setPhase("closed");trigger.current?.focus();};
    if(matchMedia("(prefers-reduced-motion: reduce)").matches)done();
    else{setPhase("closing");timer.current=window.setTimeout(done,260);}
  }
  return <>
    <button ref={trigger} type="button" className={"tutor-launch "+styles.launch} aria-haspopup="dialog" aria-expanded={phase==="open"} onClick={open}><span className={styles.spark} aria-hidden="true">✦</span>AI туслах</button>
    {phase!=="closed"&&createPortal(<Drawer phase={phase} review={review} label={label} target={target} turns={turns} setTurns={setTurns} onClose={close}/>,document.body)}
  </>;
}

function Drawer({phase,review,label,target,turns,setTurns,onClose}:{phase:Phase;review:boolean;label:string;target:TutorTarget;turns:TutorTurn[];setTurns:(update:(current:TutorTurn[])=>TutorTurn[])=>void;onClose:()=>void}) {
  const titleId=useId(),input=useRef<HTMLTextAreaElement>(null),log=useRef<HTMLDivElement>(null),busy=useRef(false);
  const [language,setLanguage]=useState<"mn"|"en">("mn"),[text,setText]=useState(""),[pending,setPending]=useState(false),[error,setError]=useState(""),[login,setLogin]=useState(false);
  const closeRef=useRef(onClose);
  useEffect(()=>{closeRef.current=onClose;});
  useEffect(()=>{
    input.current?.focus();
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")closeRef.current();};
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    addEventListener("keydown",key);
    return()=>{removeEventListener("keydown",key);document.body.style.overflow=overflow;};
  },[]);
  useEffect(()=>{log.current?.scrollTo({top:log.current.scrollHeight,behavior:"smooth"});},[turns,pending]);
  async function ask(action:TutorInput["action"],label?:string) {
    if(busy.current)return;
    const message=text.trim()||label||"";
    busy.current=true;setPending(true);setError("");setLogin(false);
    try {
      const response=await fetch("/api/math-tutor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({target,action,language,message:text.trim(),history:turns.slice(-4).map(turn=>({...turn,content:turn.content.slice(0,1500)}))}),signal:AbortSignal.timeout(70000)});
      const data=await response.json();
      if(response.status===401)setLogin(true);
      if(!response.ok)throw Error(data.error||"AI хариу ирсэнгүй.");
      setTurns(current=>[...current.slice(-10),{role:"user",content:message},{role:"assistant",content:data.message}]);setText("");
    }catch(reason){setError(reason instanceof Error&&reason.name!=="TimeoutError"?reason.message:"Хариу удаж байна. Түр хүлээгээд дахин оролдоно уу.");}
    finally{busy.current=false;setPending(false);}
  }
  const suggestions:[TutorInput["action"],string][]=[[review?"review":"hint",review?"Алдаагаа тайлбарлуулах":"Санаа өгөх"],["explain","Алхам алхмаар"],["followup","Бататгах асуулт"]];
  return <div className={styles.layer} data-phase={phase}>
    <button type="button" className={styles.backdrop} aria-label="AI туслахыг хаах" tabIndex={-1} onClick={onClose}/>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={"tutor-drawer "+styles.drawer}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">✦</span>
        <div><h2 id={titleId}>AI туслах</h2><p>{label}</p></div>
        <select aria-label="AI тайлбарын хэл" className={styles.language} value={language} onChange={e=>setLanguage(e.target.value as "mn"|"en")} disabled={pending}><option value="mn">MN</option><option value="en">EN</option></select>
        <button type="button" className={styles.close} aria-label="Хаах" onClick={onClose}>×</button>
      </header>
      <div ref={log} className={styles.log} role="log" aria-label="AI туслахтай ярилцах" aria-live="polite">
        <div className={styles.bubble+" "+styles.assistant}><p>{review?"Энэ бодлогын хариугаа хамт ойлгоё. Юу нь эргэлзээтэй байна?":"Сайн уу! Энэ бодлогоор хаана гацаж байна?"}</p></div>
        {turns.map((turn,i)=><div key={i} data-turn={turn.role} className={styles.bubble+" "+(turn.role==="user"?styles.user:styles.assistant)}><p>{turn.content}</p></div>)}
        {pending&&<div className={styles.bubble+" "+styles.assistant+" "+styles.typing} role="status" aria-label="AI бичиж байна"><i/><i/><i/></div>}
        {error&&<div className={styles.error} role="alert"><p>{error}</p>{login&&<Link href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</Link>}</div>}
      </div>
      <footer className={styles.composer}>
        <div className={styles.chips}>{suggestions.map(([action,text])=><button key={action} type="button" disabled={pending} onClick={()=>ask(action,text)}>{text}</button>)}</div>
        <form onSubmit={event=>{event.preventDefault();if(text.trim())void ask("ask");}}>
          <textarea ref={input} aria-label="Таны асуулт" rows={1} maxLength={1000} value={text} onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();if(text.trim())void ask("ask");}}} placeholder="Асуултаа бичих…" disabled={pending}/>
          <button type="submit" aria-label="Илгээх" disabled={pending||!text.trim()}>↑</button>
        </form>
        <p className={styles.note}>Илгээхэд энэ бодлого, таны хариу DeepSeek руу очно.</p>
      </footer>
    </div>
  </div>;
}
