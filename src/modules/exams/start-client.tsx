"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_PRICE_LABEL } from "./pricing";
import type { ExamProgram } from "./types";
import { ExaminerPicker } from "./speaking-examiner-picker";
import { setExaminerChoice } from "./speaking-examiner-store";
import { MockPick, ubMonthDay, type PickState } from "@/modules/subscriptions/pick-client";
/** The plan on sale that opens this programme's mocks, for the "or take the plan" link. */
export type PlanOffer = { program: string; title: string; amountMnt: number; picks: number | null };
/** `examiner`: the AI examiner is enabled, so an IELTS mock offers it for the Speaking stages. */
/** `free`: a free mock (open to every signed-in account). `pick`: the Гадаад хэл plan can open it with this month's pick. */
export function ExamStart({slug,program,hasAccess,loggedIn,examiner=false,free=false,pick=null,plan=null,pickedUntil=null}:{slug:string;program:ExamProgram;hasAccess:boolean;loggedIn:boolean;examiner?:boolean;free?:boolean;pick?:PickState|null;plan?:PlanOffer|null;pickedUntil?:string|null}) {
  const router=useRouter();const busy=useRef(false);
  const [pending,setPending]=useState(false),[error,setError]=useState("");
  const [audioReady,setAudioReady]=useState(false),[micReady,setMicReady]=useState(false),[micBusy,setMicBusy]=useState(false),[agreed,setAgreed]=useState(false),[withExaminer,setWithExaminer]=useState(true);
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
      if(!response.ok)throw Error("start");const data=await response.json();
      // The choice stays in this browser; the Speaking stages read it and it can be changed there.
      if(program==="ielts"&&examiner)setExaminerChoice(slug,withExaminer?"on":"off");
      router.push("/exams/attempts/"+data.id);
    }catch{setError("Шалгалт нээгдсэнгүй. Холболтоо шалгаад дахин оролдоно уу.");}finally{busy.current=false;setPending(false);}
  }
  if(!hasAccess&&free)return <section className="exam-preflight exam-free-gate"><span className="status access-unlocked">ҮНЭГҮЙ MOCK</span><h2>Бүртгэлтэй бүх хүнд үнэгүй.</h2><p>Нэвтэрч ороод шууд эхлүүлнэ. Хэдэн ч удаа дахин өгч, цаггүй дадлагын горимд ажиллаж болно.</p><button className="button" onClick={()=>router.push("/login?next="+encodeURIComponent("/exams/"+slug))}>Нэвтэрч эхлэх →</button></section>;
  if(!hasAccess&&pick&&loggedIn)return <MockPick slug={slug} state={pick} checkoutHref={"/checkout/"+slug}/>;
  if(!hasAccess)return <section className="exam-preflight exam-purchase-gate"><span className="status">{MOCK_PRICE_LABEL} · НЭГ ШАЛГАЛТЫН ЭРХ</span><h2>Бүх хэсгийг нэг эрхээр.</h2><p>Энэ mock шалгалтын бүх хэсэг, хадгалсан явц, тайлбартай үр дүн болон дахин өгөх боломж багтана. Бусад шалгалтын эрх тусдаа.</p><button className="button" onClick={()=>router.push(loggedIn?"/checkout/"+slug:"/login?next="+encodeURIComponent("/checkout/"+slug))}>Эрх авах · {MOCK_PRICE_LABEL} →</button>{plan?<Link className="text-link subscription-alternative" href={"/subscribe/"+plan.program}>{plan.title} багц{plan.picks?` · сард ${plan.picks} mock`:" · бүх mock"} · ₮{plan.amountMnt.toLocaleString("en-US")} / сар ↗</Link>:null}<p className="fine-print">Одоогоор туршилтын төлбөр ашиглаж байна. Бодит мөнгө суутгахгүй. Төлбөр төлөх үед шалгалтын цаг эхлэхгүй.</p></section>;
  return <section className="exam-preflight"><span className="status access-unlocked">{free?"✓ ҮНЭГҮЙ MOCK":pickedUntil?"✓ ЭНЭ САР СОНГОСОН · "+ubMonthDay(pickedUntil).toUpperCase()+" ХҮРТЭЛ":"✓ ЭРХ НЭЭЛТТЭЙ"}</span><h2>Эхлэхээс өмнө</h2><p>Чимээгүй газар, тогтвортой холболттой төхөөрөмж бэлдээрэй. Хариулт бүртгэлд хадгалагдана. Эхэлсний дараа цаг зогсохгүй; хуудсыг хаасан ч хугацаа үргэлжилнэ.</p>
    {program==="jlpt"||program==="hsk"?<div className="equipment-check"><div><h3>Чихэвчээ шалгах</h3><audio controls preload="none" src="/api/exams/audio-check" aria-label="Headphone sound check"/><label><input type="checkbox" checked={audioReady} onChange={e=>setAudioReady(e.target.checked)}/>Дууг тод сонсож байна</label></div></div>:null}
    {program==="ielts"?<div className="equipment-check"><div><h3>1. Чихэвчээ шалгах</h3><audio controls preload="none" src="/api/exams/audio-check" aria-label="Headphone sound check"/><label><input type="checkbox" checked={audioReady} onChange={e=>setAudioReady(e.target.checked)}/>Дууг тод сонсож байна</label></div><div><h3>2. Микрофоноо шалгах</h3><p>Speaking хариуг зөвхөн өөрийн бүртгэлд бичиж хадгална. Дууссаны дараа сонсож, татаж авч болно.</p><button className="button secondary" onClick={testMic} disabled={micBusy}>{micReady?"Микрофон бэлэн ✓":micBusy?"Шалгаж байна…":"Микрофон шалгах"}</button></div>{examiner?<div><h3>3. Speaking · AI шалгагч</h3><p>AI шалгагч асуултуудыг чанга уншиж, таны хариуг сонсоно. Хариуг бичвэр болгохын тулд дууг манай сервер рүү илгээх (тэндээс яриа таних үйлчилгээнд дамжиж болно) бөгөөд бичвэр нь хариулт болж хадгалагдана.</p><label><input type="checkbox" checked={withExaminer} onChange={e=>setWithExaminer(e.target.checked)}/>Speaking-ийг AI шалгагчтай өгөх</label>{withExaminer?<><p>Шалгагчаа сонгоно уу:</p><ExaminerPicker/></>:null}</div>:null}</div>:null}
    <label className="exam-agreement"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>Хэсгийн хугацаа дуусахад хариу түгжигдэж, дараагийн хэсэг автоматаар эхлэхийг ойлголоо.</label>
    <button className="button" onClick={start} disabled={pending||!agreed||((program==="ielts"||program==="jlpt"||program==="hsk")&&!audioReady)||(program==="ielts"&&!micReady)}>{pending?"Нээж байна…":"Шалгалт эхлэх / үргэлжлүүлэх →"}</button>
    <p className="fine-print">Нээлттэй оролдлого байвал үргэлжилнэ.</p>{error?<p className="error-message" role="alert">{error}</p>:null}
  </section>;
}
