"use client";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { TutorInput, TutorTarget, TutorTurn } from "./contracts";

export function MathTutor({target,review=false}:{target:TutorTarget;review?:boolean}) {
  const id=useId(),busy=useRef(false);
  const [open,setOpen]=useState(false),[consent,setConsent]=useState(false),[language,setLanguage]=useState<"mn"|"en">("mn");
  const [turns,setTurns]=useState<TutorTurn[]>([]),[text,setText]=useState(""),[pending,setPending]=useState(false),[error,setError]=useState(""),[login,setLogin]=useState(false);
  async function ask(action:TutorInput["action"]) {
    if(busy.current||!consent)return;
    const message=text.trim()||({hint:"Санаа өгөх",explain:"Алхам алхмаар тайлбарлах",review:"Алдаагаа ойлгох",followup:"Төстэй нэг бодлого",ask:"Миний бодолтыг шалгах"}[action]);
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
  return <section className="math-tutor">
    <button type="button" className="tutor-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><span className="tutor-monogram" aria-hidden="true">✦</span><span><strong>{review?"Алдаагаа ойлгох":"AI математикийн багш"}</strong><small>{review?"Өөрийн бодолтоо тайлбарлаж, бататгаарай":"Санаа авах · Алхмаа тайлбарлуулах"}</small></span><span aria-hidden="true">{open?"−":"+"}</span></button>
    <div id={id} hidden={!open} className="tutor-body">
      <div className="tutor-topline"><span className="eyebrow">DEEPSEEK · СУРАЛЦАХ ТУСЛАХ</span><label>Хэл <select aria-label="AI тайлбарын хэл" value={language} onChange={e=>setLanguage(e.target.value as "mn"|"en")} disabled={pending}><option value="mn">Монгол</option><option value="en">English</option></select></label></div>
      <p className="fine-print">AI тайлбар алдаатай байж болно. Эх тайлбартай харьцуулж шалгаарай. Оноог өөрчлөхгүй. Өдөрт 30 хүсэлт.</p>
      <label className="tutor-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} disabled={pending}/>Энэ бодлого, миний хариу болон бичсэн яриаг DeepSeek рүү илгээж тусламж авна. Хувийн мэдээлэл бичихгүй.</label>
      <div className="tutor-conversation" role="log" aria-label="AI багштай ярилцах" aria-live="polite">{turns.map((turn,i)=><div key={i} className={"tutor-turn "+turn.role}><strong>{turn.role==="user"?"Та":"AI багш"}</strong><p>{turn.content}</p></div>)}</div>
      <div className="tutor-quick-actions"><button type="button" disabled={!consent||pending} onClick={()=>ask(review?"review":"hint")}>{review?"Алдаагаа тайлбарлуулах":"Санаа өгөх"}</button><button type="button" disabled={!consent||pending} onClick={()=>ask("explain")}>Алхам алхмаар</button><button type="button" disabled={!consent||pending} onClick={()=>ask("followup")}>Бататгах асуулт</button></div>
      <form onSubmit={event=>{event.preventDefault();void ask("ask");}}><label className="tutor-input">Таны бодолт эсвэл асуулт<textarea rows={3} maxLength={1000} value={text} onChange={event=>setText(event.target.value)} placeholder="Би эхлээд хоёр талаас 7-г хассан. Дараа нь…" disabled={pending}/></label><button className="button secondary" type="submit" disabled={!consent||pending||!text.trim()}>{pending?"Тайлбар бэлдэж байна…":"Асуух →"}</button></form>
      {pending&&<p role="status" className="fine-print">AI багш бодлогыг тайлбарлаж байна…</p>}
      {error&&<div className="error-message" role="alert"><p>{error}</p>{login&&<Link href="/login" target="_blank" rel="noopener noreferrer">Нэвтэрч орно уу ↗</Link>}</div>}
      <p className="fine-print">Яриа энэ хуудсанд түр хадгалагдана. AI-ийн бататгах асуулт үнэлгээнд орохгүй.</p>
    </div>
  </section>;
}
