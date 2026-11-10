"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { TutorInput, TutorTarget, TutorTurn } from "./contracts";
import styles from "./tutor.module.css";
import { CreditCost, useCredits } from "@/modules/credits/client";
import type { AiAction } from "@/modules/credits/pricing";
import { AttachButton, ImageStrip, SentImages, imageFiles, useImageAttachments } from "@/modules/ai-images/client";
import { IMAGE_ONLY_REQUEST } from "@/modules/ai-images/contracts";

type Phase = "closed" | "open" | "closing";
type Action = TutorInput["action"];
export type AssistantConfig = {
  url: string; payload: Record<string, unknown>; label: string; greeting: string; note: string; placeholder?: string;
  // The AI credit price list entry this assistant is charged at; shown beside the composer.
  credits: AiAction;
  suggestions: [Action, string][];
  // Practice keeps the question readable beside the chat; review dims the page behind it.
  plain?: boolean;
  beforeSend?: () => Promise<unknown>;
};
/** A drawer turn; a student's message may show previews of the photos it carried (never sent back as history). */
export type AssistantTurn = TutorTurn & { images?: string[] };
type TurnUpdate = (update: (current: AssistantTurn[]) => AssistantTurn[]) => void;

// AI assistant for one question: a button that slides a chat panel in from the right.
// Nothing is rendered or sent until the student opens it; the conversation survives closing and reopening.
export function AiAssistant({target,review=false,label}:{target:TutorTarget;review?:boolean;label:string}) {
  const [turns,setTurns]=useState<AssistantTurn[]>([]);
  return <AssistantButton turns={turns} setTurns={setTurns} config={{
    url:"/api/math-tutor",payload:{target},label,credits:"math-tutor",
    greeting:review?"Энэ бодлогын хариугаа хамт ойлгоё. Юу нь эргэлзээтэй байна?":"Сайн уу! Энэ бодлогоор хаана гацаж байна?",
    note:"Илгээхэд энэ бодлого, таны хариу AI руу очно.",
    suggestions:[[review?"review":"hint",review?"Алдаагаа тайлбарлуулах":"Санаа өгөх"],["explain","Алхам алхмаар"],["followup","Бататгах асуулт"]],
  }}/>;
}

export function AssistantButton({config,turns,setTurns}:{config:AssistantConfig;turns:AssistantTurn[];setTurns:TurnUpdate}) {
  const [phase,setPhase]=useState<Phase>("closed");
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
    {phase!=="closed"&&createPortal(<Drawer phase={phase} config={config} turns={turns} setTurns={setTurns} onClose={close}/>,document.body)}
  </>;
}

function Drawer({phase,config,turns,setTurns,onClose}:{phase:Phase;config:AssistantConfig;turns:AssistantTurn[];setTurns:TurnUpdate;onClose:()=>void}) {
  const titleId=useId(),input=useRef<HTMLTextAreaElement>(null),log=useRef<HTMLDivElement>(null),busy=useRef(false);
  const [language,setLanguage]=useState<"mn"|"en">("mn"),[text,setText]=useState(""),[pending,setPending]=useState(false),[error,setError]=useState(""),[login,setLogin]=useState(false);
  const closeRef=useRef(onClose);
  const {apply}=useCredits();
  const attachments=useImageAttachments();
  useEffect(()=>{closeRef.current=onClose;});
  useEffect(()=>{
    input.current?.focus();
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")closeRef.current();};
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    addEventListener("keydown",key);
    return()=>{removeEventListener("keydown",key);document.body.style.overflow=overflow;};
  },[]);
  useEffect(()=>{log.current?.scrollTo({top:log.current.scrollHeight,behavior:"smooth"});},[turns,pending]);
  async function ask(action:Action,label?:string) {
    if(busy.current||attachments.busy)return;
    // Attached photos (such as handwritten working) go with whichever request is sent next.
    const images=attachments.images;
    const typed=text.trim()||(images.length&&!label?IMAGE_ONLY_REQUEST:"");
    const message=typed||label||"";
    busy.current=true;setPending(true);setError("");setLogin(false);
    try {
      await config.beforeSend?.();
      // History is text only: the server accepts exactly a role and content per turn.
      const history=turns.slice(-4).map(turn=>({role:turn.role,content:turn.content.slice(0,1500)}));
      const response=await fetch(config.url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...config.payload,action,language,message:typed,history,...(images.length?{images:images.map(image=>image.url)}:{})}),signal:AbortSignal.timeout(70000)});
      const data=await response.json();
      if(response.status===401)setLogin(true);
      if(!response.ok)throw Error(data.error||"AI хариу ирсэнгүй.");
      apply(data);
      setTurns(current=>[...current.slice(-10),{role:"user",content:message,...(images.length?{images:images.map(image=>image.thumb)}:{})},{role:"assistant",content:data.message}]);setText("");attachments.clear();
    }catch(reason){setError(reason instanceof Error&&reason.name!=="TimeoutError"?reason.message:"Хариу удаж байна. Түр хүлээгээд дахин оролдоно уу.");}
    finally{busy.current=false;setPending(false);}
  }
  return <div className={styles.layer} data-phase={phase} data-plain={config.plain?"":undefined}>
    <button type="button" className={styles.backdrop} aria-label="AI туслахыг хаах" tabIndex={-1} onClick={onClose}/>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={"tutor-drawer "+styles.drawer}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">✦</span>
        <div><h2 id={titleId}>AI туслах</h2><p>{config.label}</p></div>
        <select aria-label="AI тайлбарын хэл" className={styles.language} value={language} onChange={e=>setLanguage(e.target.value as "mn"|"en")} disabled={pending}><option value="mn">MN</option><option value="en">EN</option></select>
        <button type="button" className={styles.close} aria-label="Хаах" onClick={onClose}>×</button>
      </header>
      <div ref={log} className={styles.log} role="log" aria-label="AI туслахтай ярилцах" aria-live="polite">
        <div className={styles.bubble+" "+styles.assistant}><p>{config.greeting}</p></div>
        {turns.map((turn,i)=><div key={i} data-turn={turn.role} className={styles.bubble+" "+(turn.role==="user"?styles.user:styles.assistant)}><SentImages urls={turn.images} className={styles.sentImages}/><p>{turn.content}</p></div>)}
        {pending&&<div className={styles.bubble+" "+styles.assistant+" "+styles.typing} role="status" aria-label="AI бичиж байна"><i/><i/><i/></div>}
        {error&&<div className={styles.error} role="alert"><p>{error}</p>{login&&<Link href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</Link>}</div>}
      </div>
      <footer className={styles.composer}>
        <div className={styles.chips}>{config.suggestions.map(([action,text])=><button key={action} type="button" disabled={pending} onClick={()=>ask(action,text)}>{text}</button>)}</div>
        <ImageStrip images={attachments.images} onRemove={attachments.remove} busy={attachments.busy} disabled={pending} error={attachments.error} className={styles.images}/>
        <form onSubmit={event=>{event.preventDefault();if(text.trim()||attachments.images.length)void ask("ask");}}>
          <AttachButton onFiles={files=>void attachments.add(files)} count={attachments.images.length} disabled={pending||attachments.busy} className={styles.attach}/>
          <textarea ref={input} aria-label="Таны асуулт" rows={1} maxLength={1000} value={text} onChange={event=>setText(event.target.value)}
            onPaste={event=>{const files=imageFiles(event.clipboardData);if(files.length){event.preventDefault();void attachments.add(files);}}}
            onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();if(text.trim()||attachments.images.length)void ask("ask");}}} placeholder={config.placeholder??"Асуултаа бичих…"} disabled={pending}/>
          <button type="submit" aria-label="Илгээх" disabled={pending||attachments.busy||(!text.trim()&&!attachments.images.length)}>↑</button>
        </form>
        <p className={styles.note}>{config.note}{attachments.images.length?" Хавсаргасан зураг ч мөн очно.":""} <CreditCost action={config.credits} images={attachments.images.length}/></p>
      </footer>
    </div>
  </div>;
}
