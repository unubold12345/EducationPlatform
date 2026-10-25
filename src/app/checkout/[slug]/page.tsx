import { findOfficialPaper } from "@/modules/papers/catalog";
import { getExam } from "@/modules/content/published";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";

import { MockCheckout } from "@/modules/exams/checkout-client";
import { mockPaymentsEnabled } from "@/modules/exams/payments";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { hasSubscription } from "@/modules/subscriptions/access";

export const metadata:Metadata={title:"Шалгалтын эрх авах"};
export default async function CheckoutPage({params}:{params:Promise<{slug:string}>}) {
  const paper=findOfficialPaper((await params).slug);const exam=(await getExam((await params).slug))??paper; if(!exam)notFound();
  const user=await requireUser(`/checkout/${exam.slug}`);
  const order=await getDb().mockPurchase.findUnique({where:{userId_examSlug:{userId:user.id,examSlug:exam.slug}}});
  const subscribed=await hasSubscription(user.id,exam.program);
  if(subscribed&&order?.status!=="PAID")return <div className="container page-space checkout-page"><div className="settings-card checkout-success"><span className="success-seal" aria-hidden="true">✓</span><h1>Сарын багцад багтсан.</h1><p>{exam.title} шалгалтад тусдаа төлбөр шаардлагагүй.</p><Link className="button" href={"/exams/"+exam.slug}>Шалгалтаа нээх →</Link><Link className="text-link" href="/profile">Миний сарын багцууд ↗</Link></div></div>;
  return <div className="container page-space checkout-page"><Link className="text-link" href={"/exams/"+exam.slug}>← Шалгалт руу буцах</Link><div className="account-page-heading"><div><p className="eyebrow">ШАЛГАЛТЫН ЭРХ</p><h1>{order?.status==="PAID"?"Шалгалтын эрх нээлттэй.":"Дараагийн алхамдаа бэлэн үү?"}</h1><p>Нэг шалгалт. Бүх хэсэг. Хадгалагдах явц.</p></div></div><div className="checkout-layout">
    <section className="checkout-summary"><span className="status">{exam.program==="entrance"?(paper?.regional?"ДОРНОД · СОРИЛ 2026":`БҮТ · ЭЕШ ${paper?.year??2020}`):exam.program==="sat"?"DIGITAL SAT":"IELTS ACADEMIC"}</span><h2>{exam.title}</h2><p>{exam.program==="entrance"?`${paper?.slots?.filter(slot=>slot.kind==="choice").length??36} сонгох + ${paper?.slots?.filter(slot=>slot.kind==="digits").length??4} нөхөх · ${(paper?.seconds??6000)/60} минут · Оноо /${paper?.totalMarks??100}`:exam.program==="sat"?"98 асуулт · Reading & Writing, Math · Стандарт цаг, завсарлага":"40 Listening + 40 Reading · 2 Writing task · Speaking бичлэг"}</p><dl><div><dt>Шалгалтын эрх</dt><dd>{MOCK_PRICE_LABEL}</dd></div><div><dt>Валют</dt><dd>MNT · Төгрөг</dd></div><div><dt>Хамрах хүрээ</dt><dd>Зөвхөн энэ шалгалт</dd></div></dl><div className="checkout-total"><span>Нийт</span><strong>{MOCK_PRICE_LABEL}</strong></div><p className="fine-print">Хариу хадгалах, түлхүүртэй үр дүн, дахин өгөх боломж багтана. Шалгалтын цаг төлбөр төлөхөд эхлэхгүй.</p></section>
    <section className="checkout-panel">{order?.status==="PAID"?<div className="checkout-success"><span className="success-seal" aria-hidden="true">✓</span><h2>Эрх нээгдсэн</h2><p>{order.provider==="LEGACY"?"Өмнө хадгалсан шалгалтын эрхийг тань хадгаллаа. Дахин төлөх шаардлагагүй.":"Туршилтын төлбөр баталгаажлаа. Бодит мөнгө суутгаагүй."}</p><dl><div><dt>Төлбөрийн дүн</dt><dd>{order.amountMnt.toLocaleString("en-US")} MNT</dd></div><div><dt>Захиалгын дугаар</dt><dd>{order.id}</dd></div></dl><Link className="button" href={"/exams/"+exam.slug}>Шалгалтаа нээх →</Link><p className="fine-print">Эхлэхийн өмнө тоног төхөөрөмж, заавраа шалгаарай.</p></div>:<MockCheckout slug={exam.slug} declined={order?.status==="DECLINED"} enabled={mockPaymentsEnabled()}/>}
    <Link className="checkout-cancel" href={"/exams/"+exam.slug}>← {order?.status==="PAID"?"Заавар руу буцах":"Одоохондоо болих"}</Link></section>
  </div></div>;
}
