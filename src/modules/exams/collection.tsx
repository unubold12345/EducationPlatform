import Link from "next/link";
import { examDefinitions } from "./definitions";
import { getExam } from "@/modules/content/published";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { mockPractice, practiceStats } from "@/modules/exam-practice/form";
import type { PracticeResult } from "@/modules/exam-practice/types";
import { hubAccess, hubLabel } from "@/modules/subscriptions/mock-access";
import { MOCK_PRICE_LABEL, MOCK_PURCHASE_DAYS } from "./pricing";
import { freeMocksOf } from "./free/catalog";
import { FreeMockTile } from "./free/tile";
import type { ExamDefinition } from "./types";
import styles from "./collection.module.css";

export type MockCollectionKey = "sat" | "ielts";
const copy: Record<MockCollectionKey, { title: string; eyebrow: string; name: string; summary: string; questions: string; sections: string; plan: string }> = {
  sat: { title: "Digital SAT шалгалтууд", eyebrow: "Digital SAT · БҮТЭН MOCK", name: "Digital SAT", summary: "98 асуулт · 2ц 14м + 10м завсарлага", questions: "98", sections: "R&W · Math", plan: "Англи хэл" },
  ielts: { title: "IELTS Academic шалгалтууд", eyebrow: "IELTS Academic · БҮТЭН MOCK", name: "IELTS Academic", summary: "Listening, Reading, Writing, Speaking · 2ц 44м", questions: "80 + 2 эссэ", sections: "L · R · W · S", plan: "Англи хэл" },
};
// Timed minutes without the SAT's scheduled break (the break is named in the page summary).
const minutesOf = (exam: ExamDefinition) => Math.round(exam.stages.filter(stage => stage.kind !== "break").reduce((sum, stage) => sum + stage.seconds, 0) / 60);
// IELTS forms 02–12 name their reading passages; that is the card's theme line, as the other hubs show a theme.
const themeOf = (exam: ExamDefinition) => exam.stages.flatMap(stage => stage.passages ?? [])
  .map(passage => passage.title.replace(/^Reading passage \d+\s*·\s*/, "")).filter(title => !/^Reading passage \d+$/.test(title)).join(" · ");

/** The SAT and IELTS hubs (owner 2026-11-19): the same cards as the JLPT, HSK, TOEFL and TOPIK hubs. */
export async function MockCollection({collection}:{collection:MockCollectionKey}) {
  const text=copy[collection];
  const definitions=examDefinitions.filter(exam=>exam.program===collection);
  const slugs=definitions.map(exam=>exam.slug);
  const userId=(await getSession())?.user.id;
  const [exams,[practice,attempts],access]=await Promise.all([
    Promise.all(definitions.map(exam=>getExam(exam.slug).then(value=>value!))),
    userId?Promise.all([
      getDb().practiceSession.findMany({where:{userId,slug:{in:slugs}},select:{slug:true,results:true}}),
      getDb().mockAttempt.findMany({where:{userId,slug:{in:slugs},status:"IN_PROGRESS"},select:{id:true,slug:true}}),
    ]):Promise.resolve([[],[]] as [{slug:string;results:unknown}[],{id:string;slug:string}[]]),
    // Bought, a plan, or this Гадаад хэл month's pick; the briefing and the API decide again.
    hubAccess(userId,slugs,collection),
  ]);
  return <div className={"container page-space "+styles.collection}>
    <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
    <header className={styles.head}>
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p>{exams.length} бүтэн mock · {text.summary}. Хариу, бичлэг, дадлагын явц таны бүртгэлд хадгалагдана.</p>
    </header>
    {freeMocksOf(collection).map(mock=><FreeMockTile key={mock.slug} mock={mock}/>)}
    <section aria-labelledby="mock-choices">
      <h2 className={styles.heading} id="mock-choices">Шалгалтаа сонгох</h2>
      <div className={styles.cards}>{exams.map(exam=>{
        const number=exam.slug.slice(-2),theme=themeOf(exam);
        const owned=access.practice(exam.slug),active=attempts.find(attempt=>attempt.slug===exam.slug);
        const results=practice.find(item=>item.slug===exam.slug)?.results;
        const stats=results&&typeof results==="object"&&Object.keys(results).length?practiceStats(mockPractice(exam).form,results as Record<string,PracticeResult>):null;
        return <article className={styles.card+" mock-card"} key={exam.slug}>
          <span className="eyebrow">{text.name} · MOCK {number}</span>
          <h2>Full Mock {number}</h2>
          {theme?<p lang="en">{theme}</p>:null}
          <dl><div><dt>Асуулт</dt><dd>{text.questions}</dd></div><div><dt>Хугацаа</dt><dd>{minutesOf(exam)} мин</dd></div><div><dt>Хэсэг</dt><dd>{text.sections}</dd></div><div><dt>Эрх</dt><dd>{hubLabel(access.state(exam.slug),MOCK_PRICE_LABEL)}</dd></div></dl>
          {stats&&stats.checked>0?<div><progress max={stats.total} value={stats.checked} aria-label="Дадлагын явц"/><p>{stats.checked}/{stats.total} шалгасан</p></div>:null}
          <Link className="button" href={active?"/exams/attempts/"+active.id:"/exams/"+exam.slug}>{active?"Шалгалтаа үргэлжлүүлэх":"Танилцах / эхлэх"} →</Link>
          {owned?<Link className="text-link" href={"/exams/"+exam.slug+"/practice"}>{stats?.checked?"Дадлагаа үргэлжлүүлэх":"Цаггүй дадлага"} →</Link>:null}
        </article>;
      })}</div>
    </section>
    <p className={"fine-print "+styles.fine}>Нэг mock-ийн эрх {MOCK_PRICE_LABEL} / {MOCK_PURCHASE_DAYS} хоног · Эсвэл {text.plan} сарын багцаар бүх mock хязгааргүй. Эрхэд цагтай шалгалт болон цаггүй, AI туслахтай дадлагын горим хоёул багтана.</p>
  </div>;
}
