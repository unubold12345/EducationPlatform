import Link from "next/link";
import { getDb } from "@/lib/db";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
export async function SubscriptionOverview({userId}:{userId:string}) {
  const rows=await getDb().subscription.findMany({where:{userId},orderBy:{createdAt:"asc"}});const now=new Date();
  const date=new Intl.DateTimeFormat("mn-MN",{timeZone:"Asia/Ulaanbaatar",dateStyle:"medium",timeStyle:"short"});
  return <section className="settings-card subscription-overview">
    <div className="settings-heading subscription-overview-heading">
      <span className="settings-icon" aria-hidden="true">◇</span>
      <div><span className="settings-kicker">00 · БАГЦ</span><h2>Миний сарын багцууд</h2><p>Идэвхтэй болон дууссан багцууд.</p></div>
      <Link className="text-link" href="/plans">Бүх багц <span aria-hidden="true">↗</span></Link>
    </div>
    {rows.length?<div className="profile-plan-list">{rows.map(row=>{const plan=findSubscriptionPlan(row.program);const active=row.startsAt<=now&&row.endsAt>now;return <article className={"subscription-row profile-plan "+(active?"is-active":"is-expired")} key={row.id}>
      <span className="profile-plan-symbol" aria-hidden="true">{plan?.symbol??"◇"}</span>
      <div className="profile-plan-main"><div className="profile-plan-head"><h3>{plan?.title??row.program}</h3><span className={"status "+(active?"plan-active":"")}>{active?"Идэвхтэй":"Дууссан"}</span></div><p>{date.format(row.endsAt)} хүртэл</p></div>
      <div className="profile-plan-actions"><Link className="text-link" href={"/programs/"+row.program}>Нээх <span aria-hidden="true">↗</span></Link><Link className="text-link" href={"/subscribe/"+row.program}>Сунгах <span aria-hidden="true">→</span></Link></div>
    </article>})}</div>:<div className="profile-empty"><span aria-hidden="true">◇</span><div><h3>Идэвхтэй багц алга.</h3><p>Сарын эрх аваад бүх дасгал, бүтэн mock-д хандаарай.</p></div><Link className="button secondary" href="/plans">Багц сонгох <span aria-hidden="true">→</span></Link></div>}
    <p className="fine-print">Автоматаар мөнгө суутгахгүй. Сунгах бүрд нэг календарь сар нэмэгдэнэ.</p>
  </section>;
}
