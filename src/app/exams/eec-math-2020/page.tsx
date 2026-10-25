import type { Metadata } from "next";
import Link from "next/link";
import { officialPaperCategory,officialPapers } from "@/modules/papers/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";

export const metadata:Metadata={title:officialPaperCategory.title};

export default function Mathematics2020Page(){
 return <div className="container page-space exams-library">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <div className="page-intro"><p className="eyebrow">БҮТ · 2020 · МАТЕМАТИК</p><h1>{officialPaperCategory.title}</h1><p>2020 оны математикийн шалгалтын бүх хувилбар. A, B, C, D-ээс сонгож, БҮТ-ийн эх материалаар бэлдээрэй.</p></div>
  <div className="exam-library-label"><h2>Хувилбараа сонгох</h2><span>4 хувилбар · Тус бүр 100 минут</span></div>
  <div className="exam-grid paper-variants">{officialPapers.map(paper=><article key={paper.slug} className="exam-card entrance paper-variant-card">
   <div className="exam-card-top"><span className="exam-subject">МАТЕМАТИК · 2020</span><span className="status">{paper.variant} хувилбар</span></div>
   <h2>{paper.variant} хувилбар</h2><p>Томьёо, зураг бүхий эх 8 хуудас. Энэ хувилбарын албан түлхүүрээр дүгнэнэ. Хариулт, хугацаа тусдаа хадгалагдана.</p>
   <dl className="exam-card-facts"><div><dt>Агуулга</dt><dd>36 сонгох + 4 нөхөх даалгавар</dd></div><div><dt>Хугацаа</dt><dd>100 минут · 100 анхны оноо</dd></div></dl>
   <div className="exam-price"><strong>{MOCK_PRICE_LABEL}</strong><span>Энэ хувилбарын эрх · Эсвэл University Prep сарын багц</span></div>
   <Link className="button" href={"/exams/"+paper.slug}>{paper.variant} хувилбар нээх →</Link>
  </article>)}</div>
  <p className="fine-print">Эх материал <a href={officialPapers[0].sourceUrl} target="_blank" rel="noreferrer">БҮТ-ийн архивт</a> үнэгүй. University Prep сарын багцад дөрвөн хувилбар багтана. Өмнөх А хувилбарын эрх, хадгалсан оролдлого хэвээр.</p>
 </div>;
}
