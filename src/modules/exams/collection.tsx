import Link from "next/link";
import { examDefinitions } from "./definitions";
import { getExam } from "@/modules/content/published";
import { MOCK_PRICE_LABEL } from "./pricing";
import styles from "./collection.module.css";

export async function MockCollection({program}:{program:"sat"|"ielts"}) {
  const sat=program==="sat";
  const title=sat?"Digital SAT":"IELTS Academic";
  const exams=await Promise.all(examDefinitions.filter(exam=>exam.program===program).map(exam=>getExam(exam.slug).then(value=>value!)));
  return <div className={"container page-space english-archive mock-collection "+styles.collection}>
    <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
    <div className="page-intro">
      <p className="eyebrow">{title} · БҮТЭН MOCK</p>
      <h1>{title} шалгалтууд</h1>
      <p>{exams.length} бүтэн mock · {sat?"98 асуулт · 2ц 14м + 10м завсарлага":"Listening, Reading, Writing, Speaking · 2ц 44м"}</p>
    </div>
    <section className="english-year" aria-labelledby="mock-choices">
      <div className="section-heading"><h2 id="mock-choices">Шалгалтаа сонгох</h2><p>Хугацаа, хадгалалт, хувийн үр дүн</p></div>
      <div className={"english-variation-grid "+styles.grid}>{exams.map(exam=><Link key={exam.slug} href={"/exams/"+exam.slug} className="english-variation mock-variant" aria-label={exam.title}>
        <strong>Full Mock {exam.slug.slice(-2)}</strong>
        <span>{sat?"54 Reading & Writing · 44 Math":"40 Listening · 40 Reading + Writing, Speaking"}</span>
        <span className="text-link">Танилцах →</span>
      </Link>)}</div>
    </section>
    <p className="fine-print">Нэг mock-ийн эрх {MOCK_PRICE_LABEL} · Эсвэл {sat?"SAT":"IELTS"} сарын багц. Хувилбараа сонгоод нөхцөл, агуулгатай танилцаж эхлүүлээрэй.</p>
  </div>;
}
