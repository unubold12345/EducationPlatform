import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { englishPapers,findEnglishPaper } from "@/modules/papers/english-catalog";
import { EnglishPaperViewer } from "@/modules/papers/english-viewer";

export function generateStaticParams(){return englishPapers.map(({slug})=>({slug}));}
export const dynamicParams=false;
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const paper=findEnglishPaper((await params).slug);
 return {title:paper?`ЭЕШ ${paper.year} · Англи хэл · ${paper.variant} хувилбар`:"Материал олдсонгүй"};
}
export default async function EnglishPaperPage({params}:{params:Promise<{slug:string}>}){
 const paper=findEnglishPaper((await params).slug);if(!paper)notFound();
 return <div className="container page-space english-paper">
  <Link className="text-link" href={"/exams/eec-english#year-"+paper.year}>← Англи хэл · Бүх хувилбар</Link>
  <div className="page-intro"><p className="eyebrow">ЭЕШ · ЭХ МАТЕРИАЛ + ХАРИУ</p><h1>{paper.year} · Англи хэл · {paper.variant} хувилбар</h1><p>{paper.pages.length} хуудас. Хариуны хүснэгтийн {paper.variant} баганаар шалгана.</p></div>
  <EnglishPaperViewer key={paper.slug} year={paper.year} variant={paper.variant} pages={paper.pages} keyPages={paper.keyPages}/>
  <p className="fine-print english-provenance">Эх сурвалж: <a href={paper.sourceUrl} target="_blank" rel="noreferrer">{paper.sourceLabel} ↗</a> · <a href={paper.keySourceUrl} target="_blank" rel="noreferrer">Хариуны эх сурвалж ↗</a>. Хуучин эмхэтгэлийн эх хуудсыг хувилбарын заагаар салгаж харуулсан; асуулт, хариуг өөрчлөөгүй.</p>
 </div>;
}
