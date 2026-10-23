import type { Metadata } from "next";
import { programs } from "@/modules/programs/catalog";
import { ProgramCard } from "@/components/program-card";
import { LawTestRecommendation } from "@/components/lawtest";
export const metadata: Metadata = { title: "Хөтөлбөрүүд" };
export default function ProgramsPage() {
  return <div className="container page-space"><div className="page-intro"><p className="eyebrow">Хөтөлбөрүүд</p><h1>Зорилго бүрд<br /><span>өөрийн зам бий.</span></h1><p>SAT, IELTS, элсэлтийн бэлтгэлийн 80 асуулт, бичих болон ярих 4 даалгавраас сонгоорой.</p></div>
    <div className="program-grid">{programs.map(program => <ProgramCard key={program.slug} program={program} />)}</div>
    <LawTestRecommendation />
  </div>;
}

