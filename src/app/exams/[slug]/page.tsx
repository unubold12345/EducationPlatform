import "../briefing.css";
import { findOfficialPaper } from "@/modules/papers/catalog";
import { OfficialPaperBriefing } from "@/modules/papers/briefing";
export const dynamic="force-dynamic";
import { getExam } from "@/modules/content/published";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { examDefinitions } from "@/modules/exams/definitions";
import type { ExamStage } from "@/modules/exams/types";
import { ExamStart } from "@/modules/exams/start-client";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { hasSubscription } from "@/modules/subscriptions/access";
import { mockBriefingSummary } from "@/modules/exams/briefing-summary";

export function generateStaticParams(){return examDefinitions.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{return{title:findOfficialPaper((await params).slug)?.title??(await getExam((await params).slug))?.title??"Шалгалт олдсонгүй"};}

function stageDetail(stage: ExamStage) {
  if (stage.kind === "break") return "Асуултгүй завсарлага";
  if (stage.kind === "preparation") return "Бэлтгэлийн минут";
  if (stage.kind === "writing") return stage.questions.length + " даалгавар";
  if (stage.kind === "speaking") return stage.questions.length + " асуулт";
  if (stage.id === "ielts-listening-check") return "40 хариултаа шалгах";
  return (stage.variants ? stage.variants.lower.length : stage.questions.length) + " асуулт";
}

export default async function ExamPage({params}:{params:Promise<{slug:string}>}){
  const paper=findOfficialPaper((await params).slug);
  if(paper)return <OfficialPaperBriefing paper={paper}/>;
  const exam=await getExam((await params).slug);if(!exam)notFound();
  const session=await getSession();
  const access=session?await getDb().mockPurchase.findFirst({where:{userId:session.user.id,examSlug:exam.slug,status:"PAID"},select:{id:true}}):null;
  const subscribed=session?await hasSubscription(session.user.id,exam.program):false;
  const subscriptionSitting=session?await getDb().mockAttempt.findFirst({where:{userId:session.user.id,slug:exam.slug,status:"IN_PROGRESS",subscriptionAccess:true},select:{id:true}}):null;
  const activeAttempt=session?await getDb().mockAttempt.findFirst({where:{userId:session.user.id,slug:exam.slug,status:"IN_PROGRESS"},select:{id:true}}):null;
  const hasAccess=Boolean(access)||subscribed||Boolean(subscriptionSitting);
  const summary=mockBriefingSummary(exam);
  const sat=exam.program==="sat";

  return <div className="container page-space exam-detail exam-briefing-page">
    <div className="briefing-breadcrumb" role="navigation" aria-label="Шалгалтын зам">
      <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
      <span aria-hidden="true">/</span>
      <span>{sat ? "Digital SAT" : "IELTS Academic"}</span>
    </div>

    <div className="exam-briefing-layout">
      <div className={"exam-briefing-copy " + exam.program}>
        <p className="eyebrow">{summary.eyebrow}</p>
        <h1>{exam.title}</h1>
        <p>{exam.description}</p>
        <ul className="briefing-chips" aria-label="Шалгалтын товч">{summary.chips.map(chip => <li key={chip}>{chip}</li>)}</ul>
      </div>

      <aside className="exam-briefing-rail" aria-label="Шалгалтын товч ба эхлэх">
        <div className="briefing-facts">
          <div className="briefing-facts-head"><span className="eyebrow">ШАЛГАЛТЫН ТОВЧ</span><span className={hasAccess ? "status access-unlocked" : "status"}>{hasAccess ? "✓ Эрх нээлттэй" : "Эрх шаардлагатай"}</span></div>
          <dl>{summary.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          <p className="briefing-price">{summary.priceNote}</p>
          {activeAttempt ? <Link className="briefing-resume" href={"/exams/attempts/" + activeAttempt.id}>Нээлттэй оролдлого · үргэлжлүүлэх <span aria-hidden="true">→</span></Link> : null}
        </div>
        <div className="briefing-start"><ExamStart slug={exam.slug} program={exam.program} hasAccess={hasAccess} loggedIn={Boolean(session)}/></div>
      </aside>

      <section className="briefing-section exam-stages" aria-labelledby="exam-stages-heading">
        <div className="briefing-section-head"><span aria-hidden="true">01</span><div><p className="eyebrow">ДАРААЛАЛ БА ХУГАЦАА</p><h2 id="exam-stages-heading">Хэсэг ба хугацаа</h2></div></div>
        <ol className="exam-stage-plan briefing-timeline">{exam.stages.map((stage, index) => <li key={stage.id} data-kind={stage.kind}>
          <span className="timeline-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{stage.title}</strong><p>{stageDetail(stage)}</p></div>
          <span className="timeline-duration">{stage.seconds / 60} мин</span>
        </li>)}</ol>
      </section>
    </div>

    <section className="briefing-section exam-rules" aria-labelledby="exam-rules-heading">
        <div className="briefing-section-head"><span aria-hidden="true">02</span><div><p className="eyebrow">ЭХЛЭХЭЭС ӨМНӨ</p><h2 id="exam-rules-heading">Шалгалтын горим</h2></div></div>
        <div className="briefing-rule-grid">
          <div><h3>Цаг ба хадгалалт</h3><ul><li>Цаг серверт хадгалагдана. Refresh хийсэн ч дахин эхлэхгүй.</li><li>Хариу автоматаар хадгалагдана. Цаг дуусахад эцэслэгдэнэ.</li><li>Нээлттэй оролдлого байвал үргэлжилнэ.</li></ul></div>
          <div><h3>Хэсгийн дүрэм</h3><ul><li>Одоогийн хэсэгт буцаж, хариугаа засаж болно. Дууссан хэсэг рүү буцахгүй.</li><li>Стандарт хугацаа дуусахаас өмнө хэсэг алгасах, шалгалтыг дуусгах боломжгүй.</li><li>Хариулаагүй асуулт байж болно.</li>{sat ? <li>Math-ийн турш тооны машин, томьёоны лавлах болон Desmos нээлттэй.</li> : <li>Listening бичлэг нэг удаа тоглоно. Speaking нь микрофонтой, 12 минутын simulation.</li>}</ul></div>
          <div><h3>Үр дүн</h3><ul>{sat ? <><li>SAT raw оноо; 1600 хөрвүүлэлтгүй.</li><li>Албан ёсны College Board оноо биш.</li></> : <><li>Listening, Reading-ийн зөв хариултын тоо.</li><li>Writing, Speaking-д автомат band өгөхгүй.</li></>}<li>Эцсийн дүн таны бүртгэлд хадгалагдана.</li></ul></div>
        </div>
        <p className="briefing-caveat">Энэ mock нь албан ёсны шалгалт эсвэл баталгаажсан оноо биш.</p>
    </section>

    <details className="briefing-notes">
      <summary>Бүтцийн эх сурвалж</summary>
      <div className="briefing-sources">{exam.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</div>
    </details>
  </div>;
}
