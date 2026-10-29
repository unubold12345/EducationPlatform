"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_PRICE_LABEL } from "./pricing";
export function ExamStart({slug,program,hasAccess,loggedIn}:{slug:string;program:"sat"|"ielts";hasAccess:boolean;loggedIn:boolean}) {
  const router=useRouter();const busy=useRef(false);
  const [pending,setPending]=useState(false),[error,setError]=useState("");
  const [audioReady,setAudioReady]=useState(false),[micReady,setMicReady]=useState(false),[micBusy,setMicBusy]=useState(false),[agreed,setAgreed]=useState(false);
  async function testMic(){
    setMicBusy(true);setError("");
    try{if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error("unsupported");const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());setMicReady(true);}
    catch{setError("Микрофонд хандах эрх өгч, холболтоо шалгана уу. Speaking хэсэгт бичлэг шаардлагатай.");}finally{setMicBusy(false);}
  }
  async function start(){
    if(busy.current)return;busy.current=true;setPending(true);setError("");
    try{
      const response=await fetch("/api/mock-attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug}),signal:AbortSignal.timeout(15000)});
      if(response.status===401){router.push("/login?next="+encodeURIComponent("/exams/"+slug));return;}
      if(response.status===402){router.push("/checkout/"+slug);return;}
      if(!response.ok)throw Error("start");const data=await response.json();router.push("/exams/attempts/"+data.id);
    }catch{setError("Шалгалт нээгдсэнгүй. Холболтоо шалгаад дахин оролдоно уу.");}finally{busy.current=false;setPending(false);}
  }
  if(!hasAccess)return <section className="exam-preflight exam-purchase-gate"><span className="status">{MOCK_PRICE_LABEL} · НЭГ ШАЛГАЛТЫН ЭРХ</span><h2>Бүх хэсгийг нэг эрхээр.</h2><p>Энэ mock шалгалтын бүх хэсэг, хадгалсан явц, тайлбартай үр дүн болон дахин өгөх боломж багтана. Бусад шалгалтын эрх тусдаа.</p><button className="button" onClick={()=>router.push(loggedIn?"/checkout/"+slug:"/login?next="+encodeURIComponent("/checkout/"+slug))}>Эрх авах · {MOCK_PRICE_LABEL} →</button><Link className="text-link subscription-alternative" href={"/subscribe/"+program}>Бүх дасгал + mock · ₮60,000 / сар ↗</Link><p className="fine-print">Одоогоор туршилтын төлбөр ашиглаж байна. Бодит мөнгө суутгахгүй. Төлбөр төлөх үед шалгалтын цаг эхлэхгүй.</p></section>;
  return <section className="exam-preflight"><span className="status access-unlocked">✓ ЭРХ НЭЭЛТТЭЙ</span><h2>Эхлэхээс өмнө</h2><p>Чимээгүй газар, тогтвортой холболттой төхөөрөмж бэлдээрэй. Хариулт бүртгэлд хадгалагдана. Эхэлсний дараа цаг зогсохгүй; хуудсыг хаасан ч хугацаа үргэлжилнэ.</p>
    {program==="ielts"?<div className="equipment-check"><div><h3>1. Чихэвчээ шалгах</h3><audio controls preload="none" src="/api/exams/audio-check" aria-label="Headphone sound check"/><label><input type="checkbox" checked={audioReady} onChange={e=>setAudioReady(e.target.checked)}/>Дууг тод сонсож байна</label></div><div><h3>2. Микрофоноо шалгах</h3><p>Speaking хариуг зөвхөн өөрийн бүртгэлд бичиж хадгална. Дууссаны дараа сонсож, татаж авч болно.</p><button className="button secondary" onClick={testMic} disabled={micBusy}>{micReady?"Микрофон бэлэн ✓":micBusy?"Шалгаж байна…":"Микрофон шалгах"}</button></div></div>:null}
    <label className="exam-agreement"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>Хэсгийн хугацаа дуусахад хариу түгжигдэж, дараагийн хэсэг автоматаар эхлэхийг ойлголоо.</label>
    <button className="button" onClick={start} disabled={pending||!agreed||(program==="ielts"&&(!audioReady||!micReady))}>{pending?"Нээж байна…":"Шалгалт эхлэх / үргэлжлүүлэх →"}</button>
    <p className="fine-print">Нээлттэй оролдлого байвал үргэлжилнэ.</p>{error?<p className="error-message" role="alert">{error}</p>:null}
  </section>;
}
