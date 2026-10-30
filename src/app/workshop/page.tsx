export const dynamic="force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { PartnerPortrait } from "@/modules/speaking-lab/partner";
export const metadata:Metadata={title:"Workshop"};
export default function WorkshopIndex(){
  const speaking=speakingLabEnabled(),writing=writingLabEnabled();
  return <div className="container page-space workshop-index"><div className="page-intro"><p className="eyebrow">IELTS · WORKSHOP</p><h1>Workshop</h1><p>AI хамтрагчтай ярилцаж, эссэгээ засуулж, англи хэлээ өдөр бүр хөгжүүлээрэй.</p></div>
    {speaking||writing?<div className="workshop-index-grid">
      {speaking&&<Link className="workshop-tile" href="/labs/ielts-speaking" prefetch={false}><div className="workshop-tile-art"><PartnerPortrait voice="af_heart" className="workshop-partner" label="Ярианы хамтрагч Ava"/></div><div className="workshop-tile-body"><p className="eyebrow">Speaking · AI хамтрагч</p><h2>Ярианы хамтрагч</h2><p>Ярианы 3 хэсгээр AI хамтрагчтайгаа ярилцаж бэлтгэнэ. Бичсэн хариултаар ч оролцож болно.</p><p className="fine-print">Туршилтын AI зөвлөмж · Албан ёсны IELTS band биш.</p><span className="text-link">Ярианы бэлтгэл эхлэх ↗</span></div></Link>}
      {writing&&<Link className="workshop-tile" href="/labs/ielts-writing" prefetch={false}><div className="workshop-tile-art"><svg className="workshop-paper" viewBox="0 0 240 200" role="img" aria-label="Засвар тэмдэглэсэн эссэгийн хуудас"><rect x="44" y="18" width="152" height="182" rx="14" className="sheet"/><rect x="62" y="44" width="92" height="7" rx="3.5" className="ink"/><rect x="62" y="66" width="116" height="5" rx="2.5" className="line"/><rect x="62" y="82" width="38" height="5" rx="2.5" className="line"/><rect x="106" y="80" width="40" height="9" rx="3" className="mark"/><path d="M106 84.5h40" className="strike"/><rect x="152" y="82" width="26" height="5" rx="2.5" className="line"/><rect x="104" y="96" width="46" height="8" rx="4" className="fix"/><rect x="62" y="116" width="108" height="5" rx="2.5" className="line"/><rect x="62" y="132" width="116" height="5" rx="2.5" className="line"/><rect x="62" y="148" width="70" height="5" rx="2.5" className="line"/><circle cx="190" cy="40" r="22" className="badge"/><text x="190" y="46" textAnchor="middle" className="band">7.0</text><path d="M28 150l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" className="spark"/></svg></div><div className="workshop-tile-body"><p className="eyebrow">Writing · AI засвар</p><h2>Эссэ бичих студи</h2><p>IELTS Task 2 эссэ, захидал эсвэл өөрийн сэдвээр бичээд дүрэм, үг хэллэг, бүтцээ AI-аар засуулна. Алдаа бүрийг нэг товшилтоор засна.</p><p className="fine-print">Туршилтын AI зөвлөмж · Албан ёсны IELTS band биш.</p><span className="text-link">Бичиж эхлэх ↗</span></div></Link>}
    </div>:<div className="admin-empty"><p>Workshop одоогоор идэвхгүй байна.</p></div>}
  </div>;
}
