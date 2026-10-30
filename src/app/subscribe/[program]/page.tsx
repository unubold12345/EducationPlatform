import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { pricedPlan } from "@/modules/subscriptions/prices";
import { SubscriptionCheckout } from "@/modules/subscriptions/checkout-client";
export const metadata:Metadata={title:"Сарын эрх нээх"};
export default async function SubscribePage({params}:{params:Promise<{program:string}>}) {
  const plan=await pricedPlan((await params).program);if(!plan)notFound();
  const user=await requireUser(`/subscribe/${plan.program}`);
  const current=await getDb().subscription.findUnique({where:{userId_program:{userId:user.id,program:plan.program}}});const now=new Date();const active=Boolean(current&&current.startsAt<=now&&current.endsAt>now);
  return <div className="container page-space checkout-page subscribe-page"><Link className="text-link" href="/plans">← Бүх багц</Link><div className="account-page-heading"><div><p className="eyebrow">САРЫН БАГЦ</p><h1>{plan.title}</h1><p>Хөтөлбөрийн бүх бэлтгэл, нэг сарын эрх.</p></div></div>{current&&<div className={"subscription-current "+(active?"active":"expired")}><span className="status">{active?"ИДЭВХТЭЙ":"ХУГАЦАА ДУУССАН"}</span><p>Хүчинтэй хүртэл: <strong>{new Intl.DateTimeFormat("mn-MN",{timeZone:"Asia/Ulaanbaatar",dateStyle:"long",timeStyle:"short"}).format(current.endsAt)}</strong></p><Link href={"/programs/"+plan.program}>Хөтөлбөр рүү ↗</Link></div>}<div className="checkout-layout"><section className="checkout-summary"><span className="subject-symbol" aria-hidden="true">{plan.symbol}</span><h2>{plan.title}</h2><p>{plan.description}</p><ul className="subscription-includes">{plan.features.map(feature=><li key={feature}>✓ {feature}</li>)}</ul><div className="checkout-total"><span>Нэг календарь сар</span><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong></div><p className="fine-print">Зөвхөн энэ хөтөлбөрийн эрх. Хугацаа дууссан ч эхэлсэн оролдлогоо дуусгаж, өөрийн үр дүнг харж болно. Шинэ дасгал, mock эхлэхэд идэвхтэй эрх шаардлагатай.</p></section><section className="checkout-panel"><SubscriptionCheckout program={plan.program} amountMnt={plan.amountMnt} renew={active} enabled={mockPilotPaymentsEnabled()}/><Link className="checkout-cancel" href="/plans">← Одоохондоо болих</Link></section></div></div>;
}
