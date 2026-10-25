import { findOfficialPaper } from "@/modules/papers/catalog";
import { OfficialPaperBriefing } from "@/modules/papers/briefing";
export const dynamic="force-dynamic";
import { getExam } from "@/modules/content/published";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { examDefinitions } from "@/modules/exams/definitions";
import { ExamStart } from "@/modules/exams/start-client";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { hasSubscription } from "@/modules/subscriptions/access";
export function generateStaticParams(){return examDefinitions.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{return{title:findOfficialPaper((await params).slug)?.title??(await getExam((await params).slug))?.title??"Шалгалт олдсонгүй"};}
export default async function ExamPage({params}:{params:Promise<{slug:string}>}){
  const paper=findOfficialPaper((await params).slug);
  if(paper)return <OfficialPaperBriefing paper={paper}/>;
  const exam=await getExam((await params).slug);if(!exam)notFound();
  const session=await getSession();
  const access=session?await getDb().mockPurchase.findFirst({where:{userId:session.user.id,examSlug:exam.slug,status:"PAID"},select:{id:true}}):null;
  const subscribed=session?await hasSubscription(session.user.id,exam.program):false;
  const subscriptionSitting=session?await getDb().mockAttempt.findFirst({where:{userId:session.user.id,slug:exam.slug,status:"IN_PROGRESS",subscriptionAccess:true},select:{id:true}}):null;
  return <div className="container page-space exam-detail"><Link className="text-link" href="/exams">← Бүх шалгалт</Link><div className="page-intro"><p className="eyebrow">Full Mock 01 · Standard time</p><h1>{exam.title}</h1><p>{exam.description}</p></div>
    <div className="exam-detail-grid"><section><h2>Хэсэг ба хугацаа</h2><ol className="exam-stage-plan">{exam.stages.map(stage=><li key={stage.id}><div><strong>{stage.title}</strong><p>{stage.kind==="break"?"Асуултгүй завсарлага":stage.variants?stage.variants.lower.length+" асуулт":stage.questions.length+ (stage.kind==="writing"?" даалгавар":" асуулт / prompt")}</p></div><span>{stage.seconds/60} минут</span></li>)}</ol></section>
      <aside className="exam-rules"><h2>Шалгалтын горим</h2><ul><li>Цаг серверт хадгалагдана. Refresh хийсэн ч дахин эхлэхгүй.</li><li>Одоогийн хэсэгт буцаж, хариугаа засаж болно. Дууссан хэсэг рүү буцахгүй.</li><li>Стандарт хугацаа дуусахаас өмнө хэсэг алгасах, шалгалтыг дуусгах боломжгүй.</li><li>Хариулаагүй асуулт байж болно. Цаг дуусахад хадгалсан хариу эцэслэгдэнэ.</li>{exam.program==="sat"?<li>Math-ийн турш тооны машин ашиглаж болно. Томьёоны лавлах болон Desmos нээгдэнэ.</li>:<li>Listening бичлэг нэг удаа тоглоно. Speaking нь микрофонтой, prompt-д суурилсан 12 минутын simulation.</li>}</ul><p className="fine-print">Энэ mock нь албан ёсны шалгалт эсвэл баталгаажсан оноо биш. SAT raw үр дүн, IELTS Listening/Reading зөв хариултын тоо гарна. IELTS Writing/Speaking-д автомат band өгөхгүй.</p></aside></div>
    <p className="exam-detail-price">{MOCK_PRICE_LABEL}<span> / тусдаа эрх · Эсвэл {exam.program.toUpperCase()} сарын багцад багтсан</span></p><ExamStart slug={exam.slug} program={exam.program} hasAccess={Boolean(access)||subscribed||Boolean(subscriptionSitting)} loggedIn={Boolean(session)}/><section className="exam-sources"><h2>Бүтцийн эх сурвалж</h2>{exam.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</section>
  </div>;
}
