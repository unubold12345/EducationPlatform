import { notFound } from "next/navigation";
import { findOfficialPaper } from "@/modules/papers/catalog";
import { OfficialPaperBriefing } from "@/modules/papers/briefing";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return {title:findOfficialPaper((await params).slug)?.title??"Шалгалт олдсонгүй"};}
export default async function EnglishPaperPage({params}:{params:Promise<{slug:string}>}){
 const paper=findOfficialPaper((await params).slug);if(!paper||paper.subject!=="english")notFound();
 return <OfficialPaperBriefing paper={paper}/>;
}
