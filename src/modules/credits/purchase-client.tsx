"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCredits } from "./pricing";

const LOGIN = "/login?next=" + encodeURIComponent("/workspace/plans");

/**
 * Buys the AI credit pack with the simulated payment, inline on the plans page. The order is created once and
 * reused on retry, so a repeated click never adds credits twice; a success refreshes the page and the rail meter.
 */
export function CreditTopUp({ credits, amountMnt, signedIn, enabled }: { credits: number; amountMnt: number; signedIn: boolean; enabled: boolean }) {
  const router = useRouter();
  const orderId = useRef<string | null>(null);
  const busy = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<number | null>(null);
  const price = "₮" + amountMnt.toLocaleString("en-US");

  async function post(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    if (response.status === 401) { router.push(LOGIN); return null; }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(typeof data.error === "string" ? data.error : "");
    return data as { id: string; credits: number; status: string };
  }

  async function pay(decision: "success" | "decline") {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      if (!orderId.current) {
        const order = await post("/api/credits/orders", { credits, amountMnt });
        if (!order) return;
        orderId.current = order.id;
      }
      const result = await post(`/api/credits/orders/${encodeURIComponent(orderId.current)}/confirm`, { decision });
      if (!result) return;
      if (result.status === "PAID") { orderId.current = null; setAdded(result.credits); setOpen(false); router.refresh(); }
      else setError("Туршилтын төлбөр амжилтгүй. Кредит нэмэгдээгүй. Дахин оролдож болно.");
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : "Баталгаажуулж чадсангүй. Дахин оролдоход энэ захиалгыг шалгана, давхар нэмэхгүй.");
    } finally { busy.current = false; setPending(false); }
  }

  if (!signedIn) return <div className="pricing-topup-buy"><Link className="button" href={LOGIN}>Нэвтэрч авах <span aria-hidden="true">→</span></Link></div>;
  if (added !== null) return <div className="pricing-topup-buy" data-open="">
    <p className="pricing-topup-done" role="status"><span aria-hidden="true">✓</span> {formatCredits(added)} кредит нэмэгдлээ. Туршилтын төлбөр, бодит мөнгө суутгаагүй.</p>
    <button type="button" className="text-link" onClick={() => setAdded(null)}>Дахин авах</button>
  </div>;
  if (!open) return <div className="pricing-topup-buy">
    <button type="button" className="button" disabled={!enabled} onClick={() => setOpen(true)}>Кредит авах <span aria-hidden="true">→</span></button>
    {!enabled ? <p className="error-message">Туршилтын төлбөр идэвхгүй байна.</p> : null}
  </div>;
  return <div className="pricing-topup-buy" data-open="">
    <p className="pricing-topup-notice"><span className="status">ТУРШИЛТЫН ТӨЛБӨР</span> Бодит мөнгө суутгахгүй, карт шаардахгүй. {formatCredits(credits)} кредит үлдэгдэлд тань нэмэгдэнэ.</p>
    {error ? <p className="error-message" role="alert">{error}</p> : null}
    <div className="pricing-topup-actions">
      <button type="button" className="button" disabled={pending} onClick={() => pay("success")}>{pending ? "Баталгаажуулж байна…" : `Төлөх · ${price}`}</button>
      <button type="button" className="text-link" disabled={pending} onClick={() => pay("decline")}>Амжилтгүй төлбөр турших</button>
      <button type="button" className="text-link" disabled={pending} onClick={() => { setOpen(false); setError(""); }}>Болих</button>
    </div>
  </div>;
}
