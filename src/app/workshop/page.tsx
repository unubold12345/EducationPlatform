export const dynamic="force-dynamic";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { speakingLabEnabled } from "@/lib/local-pilot";
export const metadata:Metadata={title:"Workshop"};
export default function WorkshopIndex(){
  const speaking=speakingLabEnabled();
  return <div className="container page-space workshop-index"><div className="page-intro"><p className="eyebrow">IELTS · WORKSHOP</p><h1>Workshop</h1><p>AI хамтрагчтай ярилцаж, англиар чөлөөтэй ярих дадлаа хөгжүүлээрэй.</p></div>
    {speaking?<div className="workshop-index-grid">
      <Link className="workshop-tile" href="/labs/ielts-speaking" prefetch={false}><div className="workshop-tile-art"><Image src="/characters/milo/milo-wave.webp" alt="Ярианы хамтрагч Milo гараа даллаж байна" width={456} height={480}/></div><div className="workshop-tile-body"><p className="eyebrow">Speaking · AI хамтрагч</p><h2>Ярианы хамтрагч</h2><p>Ярианы 3 хэсгээр AI хамтрагчтайгаа ярилцаж бэлтгэнэ. Бичсэн хариултаар ч оролцож болно.</p><p className="fine-print">Нэвтрэх шаардлагатай · Туршилтын AI зөвлөмж · Албан ёсны IELTS band биш.</p><span className="text-link">Ярианы бэлтгэл эхлэх ↗</span></div></Link>
    </div>:<div className="admin-empty"><p>Workshop одоогоор идэвхгүй байна.</p></div>}
  </div>;
}
