import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceTotal } from "@/modules/exams/entrance/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { mockPilotPaymentsEnabled } from "@/lib/local-pilot";
import { creditAllowances, creditSummary } from "@/modules/credits/service";
import { creditPack } from "@/modules/credits/purchase";
import { CreditTopUp } from "@/modules/credits/purchase-client";
import { DEFAULT_CREDIT_PACK, defaultAllowances, formatCredits } from "@/modules/credits/pricing";
import { VOCABULARY_LIMITS } from "@/modules/vocabulary/contracts";
import { MY_EXAM_LIMITS } from "@/modules/my-exams/contracts";
import "./plans.css";

export const metadata: Metadata = { title: "Сарын багцууд" };

const count = (program: string) => examDefinitions.filter(exam => exam.program === program).length;
const badges: Record<string, string> = {
  entrance: `${entranceTotal} MOCK`,
  ielts: `${count("ielts")} MOCK + 4 WORKSHOP`,
  sat: `${count("sat")} MOCK`,
};

// The plans page moved from /plans into the Workspace on 2026-11-08; /plans redirects here. Guests can still compare plans.
export default async function PlansPage() {
  // Credit amounts and the pack are admin-editable; a database without those tables falls back to the code defaults.
  const [session, plans, allowances, pack] = await Promise.all([getSession(), pricedPlans(), creditAllowances().catch(() => defaultAllowances()), creditPack().catch(() => ({ ...DEFAULT_CREDIT_PACK }))]);
  const now = new Date();
  const active = session ? await getDb().subscription.findMany({ where: { userId: session.user.id, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true, endsAt: true } }) : [];
  const owned = new Map(active.map(item => [item.program, item]));
  // The credit tables may be missing on a database that has not run the latest migration; the page still renders.
  const credits = session ? await creditSummary(session.user.id, now).catch(() => null) : null;
  const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
  const totalMocks = examDefinitions.length + entranceTotal + jlptMocks.length + hskMocks.length;
  const words = (value: number) => value.toLocaleString("en-US");
  // What every verified account gets without a plan. The numbers are the ones the server enforces.
  const freeFeatures = [
    "Workspace: AI туслах, үгсийн сан, файлаас шалгалт",
    `Үгсийн санд ${words(VOCABULARY_LIMITS.freeWords)} үг`,
    `Файлаас үүсгэсэн ${MY_EXAM_LIMITS.freeExams} шалгалт хадгална`,
    "Reading, Listening Lab-ийн жишээ дасгал",
    `Бүтэн mock-ийг нэг бүрчлэн ${MOCK_PRICE_LABEL}-өөр авна`,
  ];
  // Columns: the free account first, then the plans in their card order.
  const comparison: { label: string; values: string[] }[] = [
    { label: "Бүтэн mock", values: [`${MOCK_PRICE_LABEL} / mock`, `${entranceTotal}`, `${count("ielts")}`, `${count("sat")}`] },
    { label: "Хичээл, чадвар", values: ["—", "Математик, физик, хими, биологи, англи", "4 чадвар", "R&W + Math"] },
    { label: "Writing & Speaking workshop", values: ["—", "—", "4", "—"] },
    { label: "Цаггүй дадлага + AI туслах", values: ["Авсан mock-д", "✓", "✓", "✓"] },
    { label: "AI кредит / сар", values: [formatCredits(allowances.free), ...plans.map(plan => "+" + formatCredits(allowances[plan.program]))] },
    { label: "Үгсийн сан", values: [VOCABULARY_LIMITS.freeWords, ...plans.map(plan => plan.vocabularyWords)].map(value => `${words(value)} үг`) },
    { label: "Файлаас шалгалт хадгалах", values: [MY_EXAM_LIMITS.freeExams, ...plans.map(plan => plan.savedExams)].map(String) },
    { label: "Хадгалсан явц, үр дүн", values: ["✓", "✓", "✓", "✓"] },
  ];
  return <div className="container page-space pricing-page">
    <header className="wsp-page-head">
      <div><h1>Багцууд</h1><p>{totalMocks} бүтэн шалгалт · 5 хөтөлбөр. Үнэгүй эхлээд, сарын багцаар хөтөлбөрийн бүх mock-ийг нээх эсвэл нэг шалгалтын эрх авна. JLPT, HSK нь зөвхөн нэг шалгалтын эрхээр.</p></div>
    </header>

    <section className="pricing-plans" id="plans" aria-labelledby="pricing-plans-heading">
      <h2 className="sr-only" id="pricing-plans-heading">Үнэгүй ба сарын эрх</h2>
      <div className="pricing-grid">
        {/* The free account is not a purchase: every verified account has it, with or without a plan. */}
        <article className="pricing-card" data-program="free" data-active={session ? "" : undefined}>
          <header className="pricing-card-top">
            <span className="pricing-symbol" aria-hidden="true">✦</span>
            <span className={session ? "status access-unlocked" : "status"}>{session ? "✓ Идэвхтэй" : "БҮРТГЭЛТЭЙ БҮХ ХҮНД"}</span>
          </header>
          <h3>Үнэгүй</h3>
          <div className="pricing-price"><strong>₮0</strong><span>/ сар</span></div>
          <p className="pricing-credits"><Bolt /><strong>{formatCredits(allowances.free)}</strong> AI кредит / сар</p>
          <ul className="pricing-features">{freeFeatures.map(feature => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
          <div className="pricing-card-foot">
            <Link className="button secondary" href={session ? "/workspace" : "/register"}>{session ? "Workspace нээх" : "Үнэгүй бүртгүүлэх"} <span aria-hidden="true">→</span></Link>
          </div>
        </article>
        {plans.map(plan => {
          const current = owned.get(plan.program);
          return <article key={plan.program} className="pricing-card" data-program={plan.program} data-featured={plan.program === "entrance" ? "" : undefined} data-active={current ? "" : undefined}>
            <header className="pricing-card-top">
              <span className="pricing-symbol" aria-hidden="true">{plan.symbol}</span>
              <span className={current ? "status access-unlocked" : "status"}>{current ? "✓ Идэвхтэй" : badges[plan.program]}</span>
            </header>
            <h3>{plan.title}</h3>
            <div className="pricing-price"><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong><span>/ сар</span></div>
            <p className="pricing-credits"><Bolt /><strong>{formatCredits(allowances[plan.program])}</strong> AI кредит / сар</p>
            <ul className="pricing-features">
              {plan.features.map(feature => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
              {plan.vocabularyWords > VOCABULARY_LIMITS.freeWords || plan.savedExams > MY_EXAM_LIMITS.freeExams
                ? <li><span aria-hidden="true">✓</span>Үгсийн санд {words(plan.vocabularyWords)} үг, файлаас {plan.savedExams} шалгалт</li> : null}
            </ul>
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
          <caption className="sr-only">Үнэгүй бүртгэл болон SAT, IELTS, University Prep багцуудын харьцуулалт</caption>
          <thead><tr><th scope="col">Багц</th><th scope="col">Үнэгүй</th>{plans.map(plan => <th scope="col" key={plan.program}>{plan.shortTitle}</th>)}</tr></thead>
          <tbody>{comparison.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index} data-out={value === "—" ? "" : undefined}>{value === "✓" ? <span className="pricing-check" aria-label="Багтсан">✓</span> : value}</td>)}</tr>)}</tbody>
          <tfoot><tr><th scope="row">Сарын үнэ</th><td><strong>₮0</strong></td>{plans.map(plan => <td key={plan.program}><strong>₮{plan.amountMnt.toLocaleString("en-US")}</strong></td>)}</tr></tfoot>
        </table>
      </div>
    </section>

    {/* The rail's credit meter links here (#credits). The price list and rules were removed at the owner's request
        (2026-11-09); every AI button still shows its own cost. */}
    <section className="pricing-single pricing-topup" id="credits" aria-labelledby="pricing-topup-heading">
      <div>
        <h2 id="pricing-topup-heading">AI кредит нэмэх</h2>
        <p>Кредит дуусвал нэмж аваарай. Худалдаж авсан кредит хугацаагүй.</p>
        {credits ? <p className="pricing-topup-balance"><Bolt />Үлдэгдэл <strong>{formatCredits(credits.balance)}</strong> кредит{credits.purchased ? <small> · үүнээс худалдаж авсан {formatCredits(credits.purchased)}</small> : null}</p> : null}
      </div>
      <div className="pricing-single-price"><strong>₮{pack.amountMnt.toLocaleString("en-US")}</strong><span>/ {formatCredits(pack.credits)} кредит</span></div>
      <CreditTopUp credits={pack.credits} amountMnt={pack.amountMnt} signedIn={Boolean(session)} enabled={mockPilotPaymentsEnabled()} />
    </section>

    <section className="pricing-single" aria-labelledby="pricing-single-heading">
      <div>
        <h2 id="pricing-single-heading">Нэг шалгалт</h2>
        <p>Бүх {totalMocks} mock-оос сонгож, нэг шалгалтын эрх авна.</p>
      </div>
      <div className="pricing-single-price"><strong>{MOCK_PRICE_LABEL}</strong><span>/ нэг mock</span></div>
      <Link className="button secondary" href="/exams">Шалгалт сонгох <span aria-hidden="true">→</span></Link>
    </section>

    <p className="pricing-terms-note">Нэг сар — төлбөр баталгаажсан мөчөөс дараагийн сарын ижил өдөр хүртэл; тэр өдөр байхгүй бол сарын сүүлийн өдөр. Хугацаа дуусахаас өмнө сунгавал үлдсэн хугацаан дээр нэмэгдэнэ. Багцын AI кредит сар бүр нэмэгдэж, ашиглаагүй нь багц дуустал хадгалагдана; багц дуусахад тэглэгдэнэ. Туршилтын төлбөр: бодит мөнгө суутгахгүй, автоматаар сунгахгүй.</p>
  </div>;
}

function Bolt() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12Z" /></svg>;
}
