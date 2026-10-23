import Link from "next/link";
import { getDb } from "@/lib/db";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
export async function SubscriptionOverview({userId}:{userId:string}) {
  const rows=await getDb().subscription.findMany({where:{userId},orderBy:{createdAt:"asc"}});const now=new Date();
  const date=new Intl.DateTimeFormat("mn-MN",{timeZone:"Asia/Ulaanbaatar",dateStyle:"medium",timeStyle:"short"});
  return <section className="settings-card subscription-overview"><div className="subscription-overview-heading"><h2>Миний сарын багцууд</h2><Link className="text-link" href="/plans">Бүх багц ↗</Link></div>{rows.length?rows.map(row=>{const active=row.startsAt<=now&&row.endsAt>now;return <div className="subscription-row" key={row.id}><div><h3>{findSubscriptionPlan(row.program)?.title??row.program}</h3><p>{date.format(row.endsAt)} хүртэл</p><span className={"status "+(active?"plan-active":"")}>{active?"Идэвхтэй":"Хугацаа дууссан"}</span></div><div><Link className="text-link" href={"/programs/"+row.program}>Нээх ↗</Link><Link className="text-link" href={"/subscribe/"+row.program}>Сунгах →</Link></div></div>}):<p>Сарын эрх хараахан аваагүй байна. <Link href="/plans">Өөрт тохирох багцаа сонгоорой →</Link></p>}<p className="fine-print">Автоматаар мөнгө суутгахгүй. Сунгах бүрд нэг календарь сар нэмэгдэнэ.</p></section>;
}
