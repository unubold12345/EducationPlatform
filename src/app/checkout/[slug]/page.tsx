import { entranceSubjectFormats } from "@/modules/exams/entrance/subjects";
import { getExam } from "@/modules/content/published";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";

import { MockCheckout } from "@/modules/exams/checkout-client";
import { mockPaymentsEnabled, purchaseActive } from "@/modules/exams/payments";
import { MOCK_PRICE_LABEL, MOCK_PURCHASE_DAYS } from "@/modules/exams/pricing";
import { mockAccess } from "@/modules/subscriptions/mock-access";
import { isFreeMock } from "@/modules/exams/free/catalog";

export const metadata:Metadata={title:"Шалгалтын эрх авах"};
export default async function CheckoutPage({params}:{params:Promise<{slug:string}>}) {
  const exam=await getExam((await params).slug); if(!exam)notFound();
  const user=await requireUser(`/checkout/${exam.slug}`);
  // A free mock is never sold: every signed-in account sits it at no cost.
  if(isFreeMock(exam.slug))return <div className="container page-space checkout-page"><div className="settings-card checkout-success"><span className="success-seal" aria-hidden="true">✓</span><h1>Үнэгүй шалгалт.</h1><p>{exam.title} бүртгэлтэй бүх хүнд үнэгүй. Төлбөр шаардлагагүй.</p><Link className="button" href={"/exams/"+exam.slug}>Шалгалтаа нээх →</Link></div></div>;
  const order=await getDb().mockPurchase.findUnique({where:{userId_examSlug:{userId:user.id,examSlug:exam.slug}}});
  const access=await mockAccess(user.id,exam.slug,exam.program);
  // A purchase counts while it runs: a 7-day one lapses and is then bought again (a permanent earlier one has no end).
  const paid=Boolean(order&&purchaseActive(order));
  const untilText=order?.expiresAt?new Intl.DateTimeFormat("mn-MN",{timeZone:"Asia/Ulaanbaatar",dateStyle:"long",timeStyle:"short"}).format(order.expiresAt):null;
  if((access.kind==="plan"||access.kind==="picked")&&!paid)return <div className="container page-space checkout-page"><div className="settings-card checkout-success"><span className="success-seal" aria-hidden="true">✓</span><h1>Сарын багцад багтсан.</h1><p>{exam.title} шалгалтад тусдаа төлбөр шаардлагагүй{access.kind==="picked"?" — энэ сард сонгосон":""}.</p><Link className="button" href={"/exams/"+exam.slug}>Шалгалтаа нээх →</Link><Link className="text-link" href="/workspace/profile">Миний сарын багцууд ↗</Link></div></div>;
  return <div className="container page-space checkout-page"><Link className="text-link" href={"/exams/"+exam.slug}>← Шалгалт руу буцах</Link><div className="account-page-heading"><div><p className="eyebrow">ШАЛГАЛТЫН ЭРХ</p><h1>{paid?"Шалгалтын эрх нээлттэй.":"Дараагийн алхамдаа бэлэн үү?"}</h1><p>Нэг шалгалт. Бүх хэсэг. Хадгалагдах явц.</p></div></div><div className="checkout-layout">
    <section className="checkout-summary"><span className="status">{exam.program==="toefl"?"TOEFL iBT":exam.program==="topik"?"TOPIK · СОЛОНГОС ХЭЛ":exam.program==="hsk"?"HSK · ХЯТАД ХЭЛ":exam.program==="jlpt"?"JLPT · N5/N4":exam.program==="entrance"?"ЭЕШ · MOCK":exam.program==="sat"?"DIGITAL SAT":"IELTS ACADEMIC"}</span><h2>{exam.title}</h2><p>{exam.program==="topik"?exam.stages.reduce((sum,stage)=>sum+stage.questions.length,0)+" асуулт · Солонгос audio-той сонсох · "+(exam.stages.length>2?"Бичих · ":"")+"Унших · "+exam.stages.reduce((sum,stage)=>sum+stage.seconds,0)/60+" минут":exam.program==="hsk"?exam.points+" асуулт · Хятад audio-той сонсох · Унших · "+exam.stages.reduce((sum,stage)=>sum+stage.seconds,0)/60+" минут":exam.program==="jlpt"?"Үгийн сан · Хэлзүй, унших · Япон Listening audio":exam.program==="entrance"?entranceSubjectFormats[exam.subject??"math"]:exam.program==="sat"?"98 асуулт · Reading & Writing, Math · Стандарт цаг, завсарлага":"40 Listening + 40 Reading · 2 Writing task · Speaking бичлэг"}</p><dl><div><dt>Шалгалтын эрх</dt><dd>{MOCK_PRICE_LABEL} · {MOCK_PURCHASE_DAYS} хоног</dd></div><div><dt>Валют</dt><dd>MNT · Төгрөг</dd></div><div><dt>Хамрах хүрээ</dt><dd>Зөвхөн энэ шалгалт</dd></div></dl><div className="checkout-total"><span>Нийт</span><strong>{MOCK_PRICE_LABEL}</strong></div><p className="fine-print">Төлсөн мөчөөс {MOCK_PURCHASE_DAYS} хоногийн турш хариу хадгалах, түлхүүртэй үр дүн, дахин өгөх, цаггүй дадлага багтана; хугацаа дуусвал дахин авна. Эхэлсэн оролдлогоо дараа нь ч дуусгаж, үр дүнгээ харна. Шалгалтын цаг төлбөр төлөхөд эхлэхгүй.</p></section>
    <section className="checkout-panel">{paid?<div className="checkout-success"><span className="success-seal" aria-hidden="true">✓</span><h2>Эрх нээгдсэн</h2><p>{order!.provider==="LEGACY"?"Өмнө хадгалсан шалгалтын эрхийг тань хадгаллаа. Дахин төлөх шаардлагагүй.":"Туршилтын төлбөр баталгаажлаа. Бодит мөнгө суутгаагүй."}</p><dl><div><dt>Төлбөрийн дүн</dt><dd>{order!.amountMnt.toLocaleString("en-US")} MNT</dd></div><div><dt>Захиалгын дугаар</dt><dd>{order!.id}</dd></div>{untilText?<div><dt>Хүчинтэй хүртэл ({MOCK_PURCHASE_DAYS} хоног)</dt><dd>{untilText}</dd></div>:null}</dl><Link className="button" href={"/exams/"+exam.slug}>Шалгалтаа нээх →</Link><p className="fine-print">Эхлэхийн өмнө тоног төхөөрөмж, заавраа шалгаарай.</p></div>:<MockCheckout slug={exam.slug} declined={order?.status==="DECLINED"} enabled={mockPaymentsEnabled()}/>}
    {access.kind==="pickable"&&!paid?<p className="fine-print checkout-pick-note">Гадаад хэл багцаараа энэ сард {access.month.limit-access.month.used} mock үнэгүй сонгох боломжтой. <Link className="text-link" href={"/exams/"+exam.slug}>Шалгалтын хуудаснаас сонгох ↗</Link></p>:null}
    <Link className="checkout-cancel" href={"/exams/"+exam.slug}>← {paid?"Заавар руу буцах":"Одоохондоо болих"}</Link></section>
  </div></div>;
}
