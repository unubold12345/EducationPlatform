import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceTotal } from "@/modules/exams/entrance/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import "./plans.css";

export const metadata: Metadata = { title: "Сарын багцууд" };

const badges: Record<string, string> = {
  entrance: `${entranceTotal} MOCK`,
  ielts: "6 MOCK + 4 WORKSHOP",
  sat: "6 MOCK",
};

export default async function PlansPage() {
  const [session, plans] = await Promise.all([getSession(), pricedPlans()]);
  const now = new Date();
  const active = session ? await getDb().subscription.findMany({ where: { userId: session.user.id, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true, endsAt: true } }) : [];
  const owned = new Map(active.map(item => [item.program, item]));
  const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
  const totalMocks = examDefinitions.length + entranceTotal;
  const comparison: { label: string; values: string[] }[] = [
    { label: "Бүтэн mock", values: [`${entranceTotal}`, "6", "6"] },
    { label: "Хичээл, чадвар", values: ["Математик, физик, англи", "4 чадвар", "R&W + Math"] },
    { label: "Writing & Speaking workshop", values: ["—", "4", "—"] },
    { label: "Цаггүй дадлага + AI туслах", values: ["✓", "✓", "✓"] },
    { label: "Хадгалсан явц, үр дүн", values: ["✓", "✓", "✓"] },
  ];
  return <div className="container page-space pricing-page">
    <header className="pricing-min-head">
      <h1>Багцууд</h1>
      <p className="pricing-min-meta">{totalMocks} бүтэн шалгалт · 3 хөтөлбөр</p>
    </header>

    <section className="pricing-plans" id="plans" aria-labelledby="pricing-plans-heading">
      <h2 className="sr-only" id="pricing-plans-heading">Сарын эрх</h2>
      <div className="pricing-grid">
        {plans.map(plan => {
          const current = owned.get(plan.program);
          return <article key={plan.program} className="pricing-card" data-program={plan.program} data-featured={plan.program === "entrance" ? "" : undefined} data-active={current ? "" : undefined}>
            <header className="pricing-card-top">
              <span className="pricing-symbol" aria-hidden="true">{plan.symbol}</span>
              <span className={current ? "status access-unlocked" : "status"}>{current ? "✓ Идэвхтэй" : badges[plan.program]}</span>
            </header>
            <h3>{plan.title}</h3>
            <div className="pricing-price"><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong><span>/ сар</span></div>
            <ul className="pricing-features">{plan.features.map(feature => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
            <div className="pricing-card-foot">
              {current ? <p className="pricing-expiry">{date.format(current.endsAt)} хүртэл</p> : null}
              <Link className="button" href={"/subscribe/" + plan.program}>{current ? "Багцаа сунгах" : "Багц сонгох"} <span aria-hidden="true">→</span></Link>
            </div>
          </article>;
        })}
      </div>
    </section>

    <section className="pricing-compare" aria-labelledby="pricing-compare-heading">
      <div className="pricing-section-head"><h2 id="pricing-compare-heading">Харьцуулалт</h2></div>
      <div className="pricing-table-wrap">
        <table className="pricing-table">
          <caption className="sr-only">SAT, IELTS болон University Prep багцуудын харьцуулалт</caption>
          <thead><tr><th scope="col">Багц</th>{plans.map(plan => <th scope="col" key={plan.program}>{plan.shortTitle}</th>)}</tr></thead>
          <tbody>{comparison.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index} data-out={value === "—" ? "" : undefined}>{value === "✓" ? <span className="pricing-check" aria-label="Багтсан">✓</span> : value}</td>)}</tr>)}</tbody>
          <tfoot><tr><th scope="row">Сарын үнэ</th>{plans.map(plan => <td key={plan.program}><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong></td>)}</tr></tfoot>
        </table>
      </div>
    </section>

    <section className="pricing-single" aria-labelledby="pricing-single-heading">
      <div>
        <h2 id="pricing-single-heading">Нэг шалгалт</h2>
        <p>Бүх {totalMocks} mock-оос сонгож, нэг шалгалтын эрх авна.</p>
      </div>
      <div className="pricing-single-price"><strong>{MOCK_PRICE_LABEL}</strong><span>/ нэг mock</span></div>
      <Link className="button secondary" href="/exams">Шалгалт сонгох <span aria-hidden="true">→</span></Link>
    </section>

    <p className="pricing-terms-note">Нэг сар — төлбөр баталгаажсан мөчөөс дараагийн сарын ижил өдөр хүртэл; тэр өдөр байхгүй бол сарын сүүлийн өдөр. Хугацаа дуусахаас өмнө сунгавал үлдсэн хугацаан дээр нэмэгдэнэ. Туршилтын төлбөр: бодит мөнгө суутгахгүй, автоматаар сунгахгүй.</p>
  </div>;
}
