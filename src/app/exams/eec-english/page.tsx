import type { Metadata } from "next";
import Link from "next/link";
import { englishPapers,englishYears } from "@/modules/papers/english-catalog";

export const metadata:Metadata={title:"ЭЕШ · Англи хэл · Өмнөх оны шалгалтууд"};
export default function EnglishArchivePage(){
 return <div className="container page-space english-archive">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <div className="page-intro"><p className="eyebrow">ЭЕШ · АНГЛИ ХЭЛ</p><h1>Англи хэлний шалгалтууд</h1><p>Эх материал, таарсан хариуны түлхүүртэй {englishPapers.length} хувилбар · {englishYears.length} он.</p></div>
  <nav className="english-year-nav" aria-label="Шалгалтын он">{englishYears.map(year=><a key={year} href={"#year-"+year}>{year}</a>)}</nav>
  {englishYears.map(year=><section key={year} id={"year-"+year} className="english-year"><div className="section-heading"><h2>{year} · Англи хэл</h2><p>{englishPapers.filter(paper=>paper.year===year).length} хувилбар · Хариутай</p></div><div className="english-variation-grid">{englishPapers.filter(paper=>paper.year===year).map(paper=><Link key={paper.slug} href={"/exams/eec-english/"+paper.slug} className="english-variation"><strong>{paper.variant} хувилбар</strong><span>{paper.pages.length} хуудас · Хариуны түлхүүр</span><span className="text-link">Нээх →</span></Link>)}</div></section>)}
  <p className="fine-print">Эх материалаар ажиллаад, хариуны түлхүүрээр өөрийгөө шалгаарай. Хариу нь олдоогүй эсвэл эхтэйгээ таараагүй материалыг оруулаагүй. Энэ архивт онлайн таймер, автомат дүн тооцохгүй.</p>
 </div>;
}
