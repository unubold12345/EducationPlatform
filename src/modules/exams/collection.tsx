import Link from "next/link";
import { examDefinitions } from "./definitions";
import { getExam } from "@/modules/content/published";
import { MOCK_PRICE_LABEL } from "./pricing";
import styles from "./collection.module.css";

export type MockCollectionKey = "sat" | "ielts";
const copy: Record<MockCollectionKey, { title: string; eyebrow: string; summary: string; card: string; plan: string }> = {
  sat: { title: "Digital SAT шалгалтууд", eyebrow: "Digital SAT · БҮТЭН MOCK", summary: "98 асуулт · 2ц 14м + 10м завсарлага", card: "54 Reading & Writing · 44 Math", plan: "SAT" },
  ielts: { title: "IELTS Academic шалгалтууд", eyebrow: "IELTS Academic · БҮТЭН MOCK", summary: "Listening, Reading, Writing, Speaking · 2ц 44м", card: "40 Listening · 40 Reading + Writing, Speaking", plan: "IELTS" },
};

export async function MockCollection({collection}:{collection:MockCollectionKey}) {
  const text=copy[collection];
  const definitions=examDefinitions.filter(exam=>exam.program===collection);
  const exams=await Promise.all(definitions.map(exam=>getExam(exam.slug).then(value=>value!)));
  return <div className={"container page-space english-archive mock-collection "+styles.collection}>
    <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
    <div className="page-intro">
      <p className="eyebrow">{text.eyebrow}</p>
      <h1>{text.title}</h1>
      <p>{exams.length} бүтэн mock · {text.summary}</p>
    </div>
    <section className="english-year" aria-labelledby="mock-choices">
      <div className="section-heading"><h2 id="mock-choices">Шалгалтаа сонгох</h2><p>Хугацаа, хадгалалт, хувийн үр дүн</p></div>
      <div className={"english-variation-grid "+styles.grid}>{exams.map(exam=><Link key={exam.slug} href={"/exams/"+exam.slug} className="english-variation mock-variant" aria-label={exam.title}>
        <strong>Full Mock {exam.slug.slice(-2)}</strong>
        <span>{text.card}</span>
        <span className="text-link">Танилцах →</span>
      </Link>)}</div>
    </section>
    <p className="fine-print">Нэг mock-ийн эрх {MOCK_PRICE_LABEL} · Эсвэл {text.plan} сарын багц. Эрхэд цагтай шалгалт болон цаггүй, AI туслахтай дадлагын горим хоёул багтана.</p>
  </div>;
}
