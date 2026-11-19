"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import { formatCredits } from "@/modules/credits/pricing";
import styles from "./dashboard.module.css";
import { mnDate, mnDateTime, ubDay } from "./dates";
import type { CreditEntry, CreditOverview } from "./types";
import { send } from "./send";

/** AI credits: what is left, the last 30 days of spending, this month by tool, and every charge (newest first, paged). */
export function CreditHistory({ data }: { data: CreditOverview }) {
  const [entries, setEntries] = useState(data.entries);
  const [next, setNext] = useState(data.next);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const summary = data.summary;
  const normal = summary ? { left: Math.max(0, summary.balance - summary.yellow), size: Math.max(0, summary.allowance - summary.yellow) } : null;
  const topArea = Math.max(1, ...data.areas.map(area => area.credits));

  async function more() {
    if (!next) return;
    setBusy(true);
    setError("");
    try {
      const page = await send<{ entries: CreditEntry[]; next: string | null }>(`/api/workspace/dashboard/credits?before=${encodeURIComponent(next)}`, "GET");
      setEntries(list => [...list, ...page.entries.filter(entry => !list.some(item => item.id === entry.id))]);
      setNext(page.next);
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }

  return <section className={styles.section} aria-labelledby="dash-credits">
    <div className={styles.sectionHead}>
      <h2 id="dash-credits"><Icon name="bolt" />AI кредитийн түүх</h2>
      <Link className="wsp-link" href="/workspace/plans#credits">Кредит авах<Icon name="arrow" size={15} /></Link>
    </div>
    <dl className={styles.creditTiles}>
      <div><dt>AI кредит үлдэгдэл</dt><dd>{normal ? <>{formatCredits(normal.left)}<small> / {formatCredits(normal.size)}</small></> : "—"}</dd>
        {normal ? <i className={styles.meter} aria-hidden="true"><b style={{ width: (normal.size ? Math.min(100, (normal.left / normal.size) * 100) : 0) + "%" }} /></i> : null}</div>
      <div data-yellow=""><dt>Кредит</dt><dd>{summary ? formatCredits(summary.yellow) : "—"}</dd></div>
      <div><dt>Энэ сард зарцуулсан</dt><dd>{formatCredits(data.monthSpent)}</dd></div>
      <div><dt>Сарын кредит сэргэх</dt><dd>{summary ? mnDate(ubDay(Date.parse(summary.resetsAt))) : "—"}</dd></div>
    </dl>
    <div className={styles.creditGrid}>
      <div className={styles.card}>
        <h3 className={styles.subhead}>Сүүлийн 30 хоног</h3>
        <DailyBars daily={data.daily} />
        <h3 className={styles.subhead}>Энэ сар, хэрэгслээр</h3>
        {data.areas.length ? <ul className={styles.areas}>{data.areas.map(area => <li key={area.area}>
          <span className={styles.areaName}>{area.area}<small>{area.count} удаа</small></span>
          <i aria-hidden="true"><b style={{ width: Math.max(2, (area.credits / topArea) * 100) + "%" }} /></i>
          <strong>{formatCredits(area.credits)}</strong>
        </li>)}</ul> : <p className={styles.muted}>Энэ сард AI ашиглаагүй байна.</p>}
      </div>
      <div className={styles.card}>
        <h3 className={styles.subhead}>Үйлдлүүд</h3>
        {entries.length ? <ol className={styles.entries}>{entries.map(entry => <li key={entry.id} data-status={entry.status}>
          <span className={styles.entryMain}><strong>{entry.label}</strong><small>{entry.area} · {mnDateTime(entry.at)}</small></span>
          <span className={styles.entryCredits}>
            {entry.status === "REFUNDED" ? <><s>−{formatCredits(entry.credits)}</s><em>Буцаасан</em></>
              : entry.status === "HELD" ? <>−{formatCredits(entry.credits)}<em>Хүлээгдэж буй</em></>
                : <>−{formatCredits(entry.credits)}{entry.yellow ? <em data-yellow="">Кредит</em> : null}</>}
          </span>
        </li>)}</ol> : <p className={styles.muted}>AI үйлдэл хараахан алга.</p>}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {next ? <button type="button" className={"wsp-ghost " + styles.more} onClick={more} disabled={busy}>{busy ? "Ачаалж байна…" : "Цааш үзэх"}</button> : null}
        {data.purchases.length ? <>
          <h3 className={styles.subhead}>Худалдан авалт</h3>
          <ul className={styles.purchases}>{data.purchases.map(order => <li key={order.id}>
            <strong>+{formatCredits(order.credits)} кредит</strong><span>₮{order.amountMnt.toLocaleString("en-US")} · {mnDateTime(order.at)}</span>
          </li>)}</ul>
        </> : null}
      </div>
    </div>
  </section>;
}

function DailyBars({ daily }: { daily: CreditOverview["daily"] }) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(0, ...daily.map(item => item.credits));
  const total = daily.reduce((sum, item) => sum + item.credits, 0);
  const peak = daily.reduce((best, item) => (item.credits > best.credits ? item : best), daily[0]);
  const shown = active === null ? null : daily[active];
  return <div className={styles.bars}>
    <p className={styles.barsHead}>
      <span>Нийт <strong>{formatCredits(total)}</strong> кредит</span>
      <span className={styles.barsTip} aria-live="polite">{shown ? `${mnDate(shown.day)}: ${formatCredits(shown.credits)} кредит` : top ? `Оргил: ${mnDate(peak.day)} · ${formatCredits(top)}` : ""}</span>
    </p>
    <div className={styles.barTrack} role="img" aria-label={`Сүүлийн 30 хоногт ${total} кредит${top ? `, хамгийн их нь ${mnDate(peak.day)}-нд ${top}` : ""}`} onMouseLeave={() => setActive(null)}>
      {daily.map((item, index) => <span key={item.day} className={styles.bar} data-active={active === index ? "" : undefined} onMouseEnter={() => setActive(index)}>
        <b style={{ height: item.credits && top ? Math.max(4, (item.credits / top) * 100) + "%" : 0 }} />
      </span>)}
    </div>
    <p className={styles.barAxis} aria-hidden="true"><span>{mnDate(daily[0].day)}</span><span>Өнөөдөр</span></p>
  </div>;
}
