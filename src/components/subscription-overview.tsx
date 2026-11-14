import Link from "next/link";
import { getDb } from "@/lib/db";
import { findAnyPlan, findSubscriptionPlan } from "@/modules/subscriptions/plans";

export async function SubscriptionOverview({userId}:{userId:string}) {
  const rows=await getDb().subscription.findMany({where:{userId},orderBy:{createdAt:"asc"}});const now=new Date();
  const date=new Intl.DateTimeFormat("mn-MN",{timeZone:"Asia/Ulaanbaatar",dateStyle:"medium"});
  const isActive=(row:{startsAt:Date;endsAt:Date})=>row.startsAt<=now&&row.endsAt>now;
  const ordered=[...rows].sort((a,b)=>Number(isActive(b))-Number(isActive(a)));
  return <section className="ws-card subscription-overview">
    <div className="ws-card-head"><h2>Багцууд</h2><Link className="text-link" href="/workspace/plans">Бүх багц</Link></div>
    {ordered.length?<div className="profile-rows">{ordered.map(row=>{const plan=findAnyPlan(row.program);const onSale=Boolean(findSubscriptionPlan(row.program));const active=isActive(row);return <article className={"subscription-row profile-row profile-plan "+(active?"is-active":"is-expired")} key={row.id}>
      <div><div className="profile-plan-head"><h3>{plan?.title??row.program}</h3><span className={"ws-pill "+(active?"ok":"")}>{active?"Идэвхтэй":"Дууссан"}</span></div><p>{date.format(row.endsAt)} хүртэл</p></div>
      {/* Retired plans (IELTS, SAT) cannot be renewed; the Гадаад хэл plan replaces them. */}
      <div className="profile-plan-actions"><Link className="text-link" href={row.program==="language"?"/exams":"/programs/"+row.program}>Нээх</Link><Link className="text-link" href={"/subscribe/"+(onSale?row.program:"language")}>{onSale?"Сунгах":"Гадаад хэл авах"}</Link></div>
    </article>})}</div>:<div className="profile-empty"><p>Идэвхтэй багц алга.</p><Link className="text-link" href="/workspace/plans">Багц сонгох</Link></div>}
  </section>;
}
