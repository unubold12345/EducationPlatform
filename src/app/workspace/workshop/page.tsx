export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { listeningLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { PartnerPortrait } from "@/modules/speaking-lab/partner";
import { guidedTasks } from "@/modules/workshops/guided";
import { Icon } from "@/modules/workspace/icons";
export const metadata: Metadata = { title: "Workshop" };

export default function WorkspaceWorkshop() {
  const speaking = speakingLabEnabled(), writing = writingLabEnabled(), listening = listeningLabEnabled();
  return <div className="wsp-page workshop-index">
    <header className="wsp-page-head"><div><h1>Workshop</h1><p>AI хамтрагчтай ярих, эссэгээ засуулах, сонсголоо дасгалжуулах лабораториуд.</p></div></header>
    {speaking || writing || listening ? <div className="workshop-index-grid wsp-workshop-grid">
      {speaking && <Link className="workshop-tile" href="/labs/ielts-speaking" prefetch={false}><div className="workshop-tile-art"><PartnerPortrait voice="af_heart" className="workshop-partner" label="Ярианы хамтрагч Ava" /></div><div className="workshop-tile-body"><span className="wsp-tag tone-violet">Speaking · AI хамтрагч</span><h2>Ярианы хамтрагч</h2><p>IELTS Speaking-ийн 3 хэсгийг AI хамтрагчтай бодитоор ярьж дасгалжуулна.</p><span className="text-link">Ярианы бэлтгэл эхлэх ↗</span></div></Link>}
      {writing && <Link className="workshop-tile" href="/labs/ielts-writing" prefetch={false}><div className="workshop-tile-art"><svg className="workshop-paper" viewBox="0 0 240 200" role="img" aria-label="Засвар тэмдэглэсэн эссэгийн хуудас"><rect x="44" y="18" width="152" height="182" rx="14" className="sheet" /><rect x="62" y="44" width="92" height="7" rx="3.5" className="ink" /><rect x="62" y="66" width="116" height="5" rx="2.5" className="line" /><rect x="62" y="82" width="38" height="5" rx="2.5" className="line" /><rect x="106" y="80" width="40" height="9" rx="3" className="mark" /><path d="M106 84.5h40" className="strike" /><rect x="152" y="82" width="26" height="5" rx="2.5" className="line" /><rect x="104" y="96" width="46" height="8" rx="4" className="fix" /><rect x="62" y="116" width="108" height="5" rx="2.5" className="line" /><rect x="62" y="132" width="116" height="5" rx="2.5" className="line" /><rect x="62" y="148" width="70" height="5" rx="2.5" className="line" /><circle cx="190" cy="40" r="22" className="badge" /><text x="190" y="46" textAnchor="middle" className="band">7.0</text><path d="M28 150l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" className="spark" /></svg></div><div className="workshop-tile-body"><span className="wsp-tag tone-green">Writing · AI засвар</span><h2>Эссэ бичих студи</h2><p>Task 2 эссэ, захидал бичээд дүрэм, үгийн сан, бүтцийн засвар авна.</p><span className="text-link">Бичиж эхлэх ↗</span></div></Link>}
      {listening && <Link className="workshop-tile" href="/labs/ielts-listening" prefetch={false}><div className="workshop-tile-art"><svg className="workshop-listen" viewBox="0 0 240 200" role="img" aria-label="Чихэвч ба дууны долгион"><path d="M64 118v-18a56 56 0 0 1 112 0v18" className="band-arc" /><rect x="50" y="112" width="30" height="50" rx="12" className="cup" /><rect x="160" y="112" width="30" height="50" rx="12" className="cup" />{[0, 1, 2, 3, 4, 5, 6].map(i => <rect key={i} x={95 + i * 8} y={137 - [10, 18, 28, 36, 26, 16, 8][i] / 2} width="4" height={[10, 18, 28, 36, 26, 16, 8][i]} rx="2" className="wave" />)}<circle cx="190" cy="44" r="22" className="badge" /><path d="M184 34v20l16-10z" className="play" /></svg></div><div className="workshop-tile-body"><span className="wsp-tag tone-blue">Listening · IELTS Part 1–4</span><h2>Сонсгол лаб</h2><p>Хоёр бүтэн сонсголын тест: давтан сонсох, хурд тохируулах, текстээр шалгах.</p><span className="text-link">Сонсож эхлэх ↗</span></div></Link>}
    </div> : <div className="admin-empty"><p>Workshop одоогоор идэвхгүй байна.</p></div>}

    <section className="wsp-section" aria-labelledby="guided-heading">
      <div className="wsp-section-head"><h2 id="guided-heading">IELTS даалгавар</h2><span className="wsp-muted">IELTS багцад багтана</span></div>
      <div className="wsp-list">{guidedTasks.map(task => <Link key={task.slug} className="wsp-row" href={"/workshops/" + task.slug}>
        <span className="wsp-row-icon" aria-hidden="true"><Icon name={task.skill === "Writing" ? "pen" : "mic"} /></span>
        <span className="wsp-row-main"><strong lang="en">{task.title}</strong><small>{task.skill} · {task.minutes} минут</small></span>
        <Icon name="arrow" className="wsp-row-arrow" />
      </Link>)}</div>
    </section>
  </div>;
}
