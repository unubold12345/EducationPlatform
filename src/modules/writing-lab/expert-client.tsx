"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ProcessingOverlay} from "@/modules/workspace/processing";
import {countWords,type WritingExam,type WritingFix,type WritingKind,type WritingTask} from "./contracts";
import {EXPERT_LIMITS,criterionLabel,expertMinWords,expertSpentMessage,reviewExam,scoreScale,scoreText,type EssayReviewKind,type ExpertQuota,type ExpertSummary,type SavedExpertReview} from "./expert";
import styles from "./expert.module.css";
import {subscriptionPlans} from "@/modules/subscriptions/plans";

const API="/api/labs/ielts-writing/expert";
const basicReviews=subscriptionPlans.find(plan=>plan.program==="english_basic")?.expertReviews??0;
const proReviews=subscriptionPlans.find(plan=>plan.program==="english_pro")?.expertReviews??0;
const KIND_LABEL:Record<WritingKind,string>={grammar:"Дүрэм",spelling:"Үсэг",punctuation:"Цэг тэмдэг",vocabulary:"Үг",style:"Найруулга"};
// Students see the kind of review, never the provider or model name (owner rule 2026-11-18).
const modelLabel=(kind:EssayReviewKind)=>kind==="strong"?"Бүрэн үнэлгээ":"Шинжээчийн үнэлгээ";
const KIND_TAG:Record<EssayReviewKind,string>={strong:"Бүрэн",expert:"Шинжээч"};
// The same text on the server and in the browser (a locale-formatted date differs between them and breaks hydration).
const DAY=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ulaanbaatar",year:"numeric",month:"2-digit",day:"2-digit"});
const day=(at:number)=>DAY.format(new Date(at)).replaceAll("-",".");

export type ExpertInitial={quota:ExpertQuota;reviews:ExpertSummary[]};
type Draft={task:WritingTask;promptId:string|null;topic:string;essay:string;language:"mn"|"en"};

async function jsonObject(response:Response):Promise<Record<string,unknown>> {
 const data=await response.json().catch(()=>null);
 return data&&typeof data==="object"&&!Array.isArray(data)?data as Record<string,unknown>:{};
}

const listed=(saved:SavedExpertReview):ExpertSummary=>({id:saved.id,createdAt:saved.createdAt,kind:saved.kind,task:saved.task,title:saved.title,words:saved.words,overall:saved.review.overall});

/**
 * The review section under the studio: the Claude expert review (what is left and its button), every saved review of
 * both kinds and the open one. `latest` is a DeepSeek full review the studio just received; it opens here. The server
 * decides the quota; the counter here only follows its replies.
 */
export function ExpertPanel({exam="ielts",signedIn,initial,latest=null,draft,onApply}:{exam?:WritingExam;signedIn:boolean;initial:ExpertInitial|null;latest?:SavedExpertReview|null;draft:Draft;onApply:(fix:WritingFix)=>void}) {
 const toefl=exam==="toefl",least=expertMinWords(draft.task);
 const [quota,setQuota]=useState(initial?.quota??null);
 const [reviews,setReviews]=useState(initial?.reviews??[]);
 const [open,setOpen]=useState<SavedExpertReview|null>(null);
 // Adopt a new review from the studio during render (not in an effect), once per review.
 const [adopted,setAdopted]=useState<string|null>(null);
 if(latest&&latest.id!==adopted){
  setAdopted(latest.id);setOpen(latest);
  setReviews(list=>[listed(latest),...list.filter(item=>item.id!==latest.id)].slice(0,EXPERT_LIMITS.history));
 }
 const [busy,setBusy]=useState<"review"|"open"|null>(null);
 const [error,setError]=useState("");
 const report=useRef<HTMLDivElement>(null);
 // A review handed over from the studio is shown at once: bring its report into view.
 useEffect(()=>{if(adopted)report.current?.scrollIntoView({behavior:"smooth",block:"start"});},[adopted]);
 const words=countWords(draft.essay);
 const missing=words<least?`Шинжээчийн үнэлгээнд дор хаяж ${least} үг хэрэгтэй (одоо ${words}).`:draft.task==="free"&&!draft.topic.trim()?"Эхлээд сэдвээ бичнэ үү.":"";
 const spent=!!quota&&quota.remaining<=0;
 // A free account has no Claude reviews at all: the section offers the plans instead of a counter.
 const none=!!quota&&quota.plan===null&&quota.limit===0;

 const show=(review:SavedExpertReview)=>{setOpen(review);requestAnimationFrame(()=>report.current?.scrollIntoView({behavior:"smooth",block:"start"}));};

 async function review() {
  if(busy||!quota||spent||missing)return;
  const left=quota.remaining-1;
  if(!window.confirm(`Шинжээчийн үнэлгээ 1 удаа зарцуулна (${left} үлдэнэ). Үргэлжлүүлэх үү?`))return;
  setBusy("review");setError("");
  try{
   const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft),signal:AbortSignal.timeout(295_000)});
   const data=await jsonObject(response);
   if(response.status===401)throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
   if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Шинжээчийн үнэлгээ хийж чадсангүй. Дахин оролдоно уу.");
   const saved=data.review as SavedExpertReview;
   setQuota(data.quota as ExpertQuota);
   setReviews(list=>[listed(saved),...list.filter(item=>item.id!==saved.id)].slice(0,EXPERT_LIMITS.history));
   show(saved);
  }catch(reason){
   setError(reason instanceof Error&&reason.name!=="TimeoutError"&&reason.name!=="AbortError"?reason.message:"Шинжээчийн үнэлгээ хэт удлаа. Хуудсаа дахин ачаалж, доорх жагсаалтаас шалгана уу.");
  }finally{setBusy(null);}
 }

 async function reopen(id:string) {
  if(busy)return;
  if(open?.id===id){show(open);return;}
  setBusy("open");setError("");
  try{
   const response=await fetch(`${API}/${id}`,{signal:AbortSignal.timeout(30_000)});
   const data=await jsonObject(response);
   if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Үнэлгээг нээж чадсангүй.");
   show(data.review as SavedExpertReview);
  }catch(reason){setError(reason instanceof Error?reason.message:"Үнэлгээг нээж чадсангүй.");}
  finally{setBusy(null);}
 }

 return <section className={styles.expert} aria-labelledby="expert-heading">
  <ProcessingOverlay open={busy==="review"} title="Шинжээч бичвэрийг уншиж байна…" detail="Хамгийн хүчтэй AI дөрвөн шалгуур бүрээр нарийвчлан үнэлж, засвар, жишээ хариулт бичиж байна. 1–3 минут орно."/>
  <div className={styles.head}>
   <div>
    <p className={styles.badge}><span aria-hidden="true">✦</span> Хамгийн хүчтэй AI</p>
    <h2 id="expert-heading">Шинжээчийн үнэлгээ</h2>
    <p className={styles.lead}>{toefl
     ?"Хамгийн хүчтэй загвар хоёр дахь үзлэг хийнэ: шалгуур бүрийн оноо (0–5) ба яагаад, догол мөр бүрийн тайлбар, дараагийн оноонд хүрэх 3 алхам, 25 хүртэл засвар, 5 онооны жишээ хариулт. Энгийн “Бүрэн үнэлгээ” ижил тайланг кредитээр гаргана."
     :"Хамгийн хүчтэй загвар хоёр дахь үзлэг хийнэ: шалгуур бүрийн band ба яагаад, догол мөр бүрийн тайлбар, дараагийн band-д хүрэх 3 алхам, 25 хүртэл засвар, band 8+ жишээ хариулт. Энгийн “Бүрэн үнэлгээ” ижил тайланг кредитээр гаргана."}</p>
   </div>
   <div className={styles.cta}>
    {!signedIn?<Link className={styles.primary} href={toefl?"/login?next=%2Flabs%2Ftoefl-writing":"/login?next=%2Flabs%2Fielts-writing"}>Нэвтэрч үнэлүүлэх →</Link>
    :none?<Link className={styles.primary} href="/workspace/plans">Basic, Pro багцад →</Link>
    :quota&&<>
     <p className={styles.quota} data-spent={spent?"":undefined}>
      <strong>{quota.remaining}</strong> / {quota.limit} үлдсэн
      <small>{quota.plan?`${quota.plan} · ${quota.resetsAt&&!quota.planEnds?`${day(quota.resetsAt)}-нд шинэчлэгдэнэ`:"энэ сар"}`:"Үнэгүй · нэг удаа"}</small>
     </p>
     <button type="button" className={styles.primary} onClick={()=>void review()} disabled={!!busy||spent||!!missing} aria-busy={busy==="review"}>{busy==="review"?"Үнэлж байна…":"Шинжээчээр үнэлүүлэх"}</button>
    </>}
   </div>
  </div>
  {signedIn&&quota&&(spent?<p className={styles.note} role="status">{expertSpentMessage(quota)}{!none&&<> <Link href="/workspace/plans">Багц харах</Link></>}</p>
   :missing?<p className={styles.note}>{missing}</p>:null)}
  {error&&<p className={styles.error} role="alert">{error}</p>}

  {reviews.length>0&&<ol className={styles.past} aria-label="Хадгалсан үнэлгээнүүд">
   {reviews.map(item=><li key={item.id}><button type="button" onClick={()=>void reopen(item.id)} aria-current={open?.id===item.id?"true":undefined} disabled={busy==="open"}>
    <strong>{scoreText(item.overall,item.task)}</strong><span>{item.title}<small>{KIND_TAG[item.kind]} · {day(item.createdAt)} · {item.words} үг</small></span>
   </button></li>)}
  </ol>}

  <div ref={report}>{open&&<ExpertReport saved={open} currentEssay={draft.essay} onApply={onApply} onClose={()=>setOpen(null)}/>}</div>
  <p className={styles.fine}>Илгээхэд даалгавар, бичвэр тань AI үйлчилгээ рүү очно. {toefl?"Оноо нь албан ёсны TOEFL оноо биш, дадлагын тооцоо.":"Band нь албан ёсны IELTS үнэлгээ биш, дадлагын тооцоо."} Үнэлгээ бүр таны бүртгэлд хадгалагдана. Алдаа, татгалзал, хугацаа хэтэрсэн тохиолдолд үнэлгээ, кредит хасагдахгүй. Шинжээчийн үнэлгээ: Англи хэл Basic сард {basicReviews}, Pro сард {proReviews}, IELTS ба TOEFL-д нийтдээ.</p>
 </section>;
}

/** One saved review in full. A finished mock's results show it too (`ai-grading/panel.tsx`): no draft there, so no apply button. */
export function ExpertReport({saved,currentEssay="",onApply,onClose}:{saved:SavedExpertReview;currentEssay?:string;onApply?:(fix:WritingFix)=>void;onClose:()=>void}) {
 const review=saved.review,toefl=reviewExam(saved.task)==="toefl",scale=scoreScale(saved.task);
 const [copied,setCopied]=useState(false);
 const copy=async()=>{try{await navigator.clipboard.writeText(review.modelAnswer);setCopied(true);window.setTimeout(()=>setCopied(false),1800);}catch{setCopied(false);}};
 return <article className={styles.report} aria-label={saved.kind==="strong"?"Бүрэн үнэлгээ":"Шинжээчийн үнэлгээ"}>
  <header className={styles.reportHead}>
   <div className={styles.overall}><strong>{scoreText(review.overall,saved.task)}</strong><span>{toefl?"Тооцоолсон оноо · 0–5":"Тооцоолсон band"}</span></div>
   <div className={styles.reportMeta}>
    <h3>{saved.title}</h3>
    <p>{day(saved.createdAt)} · {saved.words} үг · {modelLabel(saved.kind)}</p>
    <p className={styles.summary}>{review.summary}</p>
   </div>
   <button type="button" className={styles.close} onClick={onClose} aria-label="Үнэлгээг хаах">✕</button>
  </header>

  <div className={styles.criteria}>{review.criteria.map(note=><section key={note.criterion} className={styles.criterion}>
   <h4><span>{criterionLabel(note.criterion,saved.task)}</span><em>{scoreText(note.band,saved.task)}</em></h4>
   <i className={styles.bar} aria-hidden="true"><b style={{transform:`scaleX(${note.band/scale})`}}/></i>
   {note.evidence&&<p>{note.evidence}</p>}
   {note.next&&<p className={styles.next}><strong>Дараагийн түвшинд:</strong> {note.next}</p>}
  </section>)}</div>

  {review.priorities.length>0&&<section className={styles.block}>
   <h4>Эхлээд засах {review.priorities.length} зүйл</h4>
   <ol className={styles.priorities}>{review.priorities.map((item,i)=><li key={i}>{item}</li>)}</ol>
  </section>}

  {review.paragraphs.length>0&&<section className={styles.block}>
   <h4>Догол мөр бүрээр</h4>
   <ol className={styles.paragraphs}>{review.paragraphs.map((p,i)=><li key={i}><b>{p.paragraph}</b><div><strong>{p.role}</strong><p>{p.comment}</p>{p.suggestion&&<p className={styles.next}>→ {p.suggestion}</p>}</div></li>)}</ol>
  </section>}

  {review.corrections.length>0&&<section className={styles.block}>
   <h4>Засвар <small>{review.corrections.length}</small></h4>
   <ul className={styles.fixes}>{review.corrections.map((fix,i)=>{
    const present=currentEssay.includes(fix.original);
    return <li key={i}>
     <span className={styles.kind} data-kind={fix.kind}>{KIND_LABEL[fix.kind]}</span>
     <p className={styles.diff}><s>{fix.original}</s><span aria-hidden="true">→</span><ins>{fix.better||"(устгах)"}</ins></p>
     {fix.why&&<p className={styles.why}>{fix.why}</p>}
     {!onApply?null:present?<button type="button" className={styles.apply} onClick={()=>onApply(fix)}>Бичвэрт засах</button>:<span className={styles.done}>Бичвэрт байхгүй</span>}
    </li>;
   })}</ul>
  </section>}

  {review.vocabulary.length>0&&<section className={styles.block}>
   <h4>Үг хэллэг</h4>
   <ul className={styles.words}>{review.vocabulary.map((w,i)=><li key={i}><p><s>{w.word}</s><span aria-hidden="true">→</span><strong>{w.better}</strong></p>{w.example&&<p className={styles.why}>“{w.example}”</p>}</li>)}</ul>
  </section>}

  <details className={styles.model}>
   <summary>{toefl?"5 онооны жишээ хариулт":"Band 8+ жишээ хариулт"} <small>· таны санаагаар</small></summary>
   <div className={styles.modelText}>{review.modelAnswer.split("\n\n").map((part,i)=><p key={i}>{part}</p>)}</div>
   <button type="button" className={styles.secondary} onClick={()=>void copy()}>{copied?"Хуулсан ✓":"Хуулах"}</button>
  </details>

  <details className={styles.original}>
   <summary>Үнэлсэн бичвэр</summary>
   <p className={styles.promptText}>{saved.prompt}</p>
   <div className={styles.modelText}>{saved.essay.split(/\n\s*\n|\n/).filter(part=>part.trim()).map((part,i)=><p key={i}>{part}</p>)}</div>
  </details>
 </article>;
}
