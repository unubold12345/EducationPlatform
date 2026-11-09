import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceTotal } from "@/modules/exams/entrance/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { creditAllowances, creditHistory, creditSummary } from "@/modules/credits/service";
import { AI_ACTIONS, AI_ACTION_IDS, CREDIT_USD, DEEPSEEK_PRICE, creditRangeLabel, defaultAllowances, formatCredits, vocabularyImportCredits } from "@/modules/credits/pricing";
import "./plans.css";

export const metadata: Metadata = { title: "Сарын багцууд" };

const badges: Record<string, string> = {
  entrance: `${entranceTotal} MOCK`,
  ielts: "6 MOCK + 4 WORKSHOP",
  sat: "6 MOCK",
};

// The plans page moved from /plans into the Workspace on 2026-11-08; /plans redirects here. Guests can still compare plans.
export default async function PlansPage() {
  // Monthly credits are admin-editable; a database without the table falls back to the code defaults.
  const [session, plans, allowances] = await Promise.all([getSession(), pricedPlans(), creditAllowances().catch(() => defaultAllowances())]);
  const now = new Date();
  const active = session ? await getDb().subscription.findMany({ where: { userId: session.user.id, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true, endsAt: true } }) : [];
  const owned = new Map(active.map(item => [item.program, item]));
  // The credit tables may be missing on a database that has not run the latest migration; the page still renders.
  const [credits, history] = session ? await Promise.all([
    creditSummary(session.user.id, now).catch(() => null),
    creditHistory(session.user.id, 8).catch(() => []),
  ]) : [null, []];
  const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
  const stamp = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const totalMocks = examDefinitions.length + entranceTotal;
  const comparison: { label: string; values: string[] }[] = [
    { label: "Бүтэн mock", values: [`${entranceTotal}`, "6", "6"] },
    { label: "Хичээл, чадвар", values: ["Математик, физик, англи", "4 чадвар", "R&W + Math"] },
    { label: "Writing & Speaking workshop", values: ["—", "4", "—"] },
    { label: "Цаггүй дадлага + AI туслах", values: ["✓", "✓", "✓"] },
    { label: "AI кредит / сар", values: plans.map(plan => "+" + formatCredits(allowances[plan.program])) },
    { label: "Хадгалсан явц, үр дүн", values: ["✓", "✓", "✓"] },
  ];
  return <div className="container page-space pricing-page">
    <header className="wsp-page-head">
      <div><h1>Багцууд</h1><p>{totalMocks} бүтэн шалгалт · 3 хөтөлбөр. Сарын багцаар хөтөлбөрийн бүх mock-ийг нээх эсвэл нэг шалгалтын эрх авна.</p></div>
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
            <p className="pricing-credits"><Bolt /><strong>{formatCredits(allowances[plan.program])}</strong> AI кредит / сар</p>
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

    <section className="pricing-ai" id="credits" aria-labelledby="pricing-credits-heading">
      <div className="pricing-section-head">
        <h2 id="pricing-credits-heading">AI кредит</h2>
        <p>AI-тай үйлдэл бүр кредит зарцуулна; файлаас үг оруулах нь хадгалсан үгийн тоогоор тооцогдоно. Зардлыг үйлдэл бүрийн өмнө харуулна.</p>
      </div>
      {credits ? <div className="pricing-ai-balance" data-low={credits.allowance && credits.balance / credits.allowance < 0.15 ? "" : undefined}>
        <div>
          <span>Энэ сарын үлдэгдэл</span>
          <strong>{formatCredits(credits.balance)}<small> / {formatCredits(credits.allowance)}</small></strong>
          <i className="pricing-ai-bar" aria-hidden="true"><b style={{ transform: `scaleX(${credits.allowance ? Math.min(1, credits.balance / credits.allowance) : 0})` }} /></i>
        </div>
        <dl>
          <div><dt>Зарцуулсан</dt><dd>{formatCredits(credits.used)}</dd></div>
          <div><dt>Үнэгүй</dt><dd>{formatCredits(credits.free)}</dd></div>
          {credits.bonus ? <div><dt>Урамшуулал</dt><dd>+{formatCredits(credits.bonus)}</dd></div> : null}
          {credits.plans.map(plan => <div key={plan.program}><dt>{plan.title} багц</dt><dd>+{formatCredits(plan.credits)}</dd></div>)}
          <div><dt>Шинэчлэгдэх</dt><dd>{date.format(new Date(credits.resetsAt))}</dd></div>
        </dl>
      </div> : null}
      <div className="pricing-ai-grid">
        <div className="pricing-ai-costs">
          <h3>Үйлдэл бүрийн зардал</h3>
          <ul>{AI_ACTION_IDS.map(action => <li key={action}><span><small>{AI_ACTIONS[action].area}</small>{AI_ACTIONS[action].label}</span><strong>{creditRangeLabel(action)} кредит</strong></li>)}</ul>
        </div>
        <div className="pricing-ai-rules">
          <h3>Хэрхэн тооцдог вэ</h3>
          <ul>
            <li>Баталгаажсан бүртгэл бүр сард <strong>{formatCredits(allowances.free)}</strong> үнэгүй кредит авна. Сарын багц бүрийн кредит дээр нь нэмэгдэж, хэд хэдэн багц нийлнэ.</li>
            <li>Кредит Улаанбаатарын цагаар сар бүрийн 1-нд шинэчлэгдэнэ. Ашиглаагүй кредит дараа сард шилжихгүй.</li>
            <li>AI хариу ирээгүй, файлд хангалттай текст байгаагүй эсвэл хугацаатай шалгалт нээгдсэн бол кредит буцаагдана.</li>
            <li>Файлаас үг оруулахад AI-ийн уншсан текстийн урт ба шинээр хадгалсан үгийн тоогоор төлнө (богино жагсаалтаас 10 үг ≈ {vocabularyImportCredits(2_000, 10)} кредит). Сонгосон тооны дээд үнийг түр барьж, давхар болон зарцуулаагүй хэсгийг буцаана.</li>
            <li>Үнийг DeepSeek-ийн {DEEPSEEK_PRICE.model} загварын оргил цагийн токены үнээр тооцсон (оролт ${DEEPSEEK_PRICE.inputCacheMiss}, гаралт ${DEEPSEEK_PRICE.output} / 1M токен): 1 кредит ≈ ${CREDIT_USD} AI зардал.</li>
          </ul>
        </div>
      </div>
      {history.length ? <div className="pricing-ai-history">
        <h3>Сүүлийн AI үйлдлүүд</h3>
        <ul>{history.map(row => <li key={row.id} data-status={row.status}>
          <span><small>{AI_ACTIONS[row.action].area}</small>{AI_ACTIONS[row.action].label}</span>
          <time dateTime={row.createdAt}>{stamp.format(new Date(row.createdAt))}</time>
          <strong>{row.status === "REFUNDED" ? "Буцаасан" : row.status === "HELD" ? "Боловсруулж байна" : "−" + row.credits}</strong>
        </li>)}</ul>
      </div> : null}
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

function Bolt() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12Z" /></svg>;
}
