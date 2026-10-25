import type { Metadata } from "next";
import Link from "next/link";
import { englishPapers,englishYears } from "@/modules/papers/english-catalog";

export const metadata:Metadata={title:"ЭЕШ · Англи хэл · Өмнөх оны шалгалтууд"};
export default function EnglishArchivePage(){
 return <div className="container page-space english-archive">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <div className="page-intro"><p className="eyebrow">ЭЕШ · АНГЛИ ХЭЛ</p><h1>Англи хэлний шалгалтууд</h1><p>Таймер, хадгалалт, дүнтэй {englishPapers.length} хувилбар · {englishYears.length} он.</p></div>
  <section className="program-exam-banner regional-english-entry"><div><h2>2026 · Дорнод · Англи хэл</h2><p>Онлайн сорил-4 · 80 минут · 100 оноо · 47 сонгох + 3 нөхөх даалгавар.</p></div><Link className="button" href="/exams/dornod-2026-english-online-4">Шалгалттай танилцах →</Link></section>
  <nav className="english-year-nav" aria-label="Шалгалтын он">{englishYears.map(year=><a key={year} href={"#year-"+year}>{year}</a>)}</nav>
  {englishYears.map(year=><section key={year} id={"year-"+year} className="english-year"><div className="section-heading"><h2>{year} · Англи хэл</h2><p>{englishPapers.filter(paper=>paper.year===year).length} хувилбар · Хариутай</p></div><div className="english-variation-grid">{englishPapers.filter(paper=>paper.year===year).map(paper=><Link key={paper.slug} href={"/exams/eec-english/"+paper.slug} className="english-variation"><strong>{paper.variant} хувилбар</strong><span>{paper.pages.length} хуудас · 80 минут</span><span className="text-link">Нээх →</span></Link>)}</div></section>)}
  <p className="fine-print">Хувилбараа сонгоод шалгалтаа эхлүүлээрэй. Хариулт автоматаар хадгалагдаж, хугацаа дуусахад сервер дээр эцэслэгдэнэ. Хариугүй эсвэл эхтэйгээ таараагүй материалыг оруулаагүй. University Prep сарын багц эсвэл тухайн хувилбарын эрх шаардлагатай.</p>
 </div>;
}
