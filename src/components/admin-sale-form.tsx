"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_PRICE_LIMITS } from "@/modules/subscriptions/plans";
import { AdminRow } from "./admin-row";

const ubDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/**
 * A plan's sale as a list row: the price charged instead of the regular one, with an optional last day (Ulaanbaatar).
 * The plans page shows the sale price beside the struck-through regular price. Saved with a reason and audited; paid
 * orders never change.
 */
export function AdminSaleForm({ program, title, regular, sale, saleEndsAt, ended }: { program: string; title: string; regular: number; sale: number | null; saleEndsAt: string | null; ended: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const format = (value: number) => value.toLocaleString("en-US");
  const live = sale !== null && sale < regular && !ended;
  async function save(form: HTMLFormElement, clear: boolean) {
    const data = new FormData(form), raw = String(data.get("sale") ?? "").trim(), until = String(data.get("until") ?? "").trim();
    const amount = clear || raw === "" ? null : Number(raw);
    if (!window.confirm(amount === null ? `${title}: хямдралыг цуцлах уу? Үнэ ₮${format(regular)} болно.` : `${title}: хямдрал ₮${format(amount)} (энгийн ₮${format(regular)})${until ? ` · ${until} хүртэл` : ""}. Шинэ болон төлөгдөөгүй захиалгад шууд үйлчилнэ. Хадгалах уу?`)) return;
    setBusy(true); setMessage("");
    try {
      const body: Record<string, unknown> = { action: "set-sale", target: program, amount, reason: data.get("reason") };
      if (amount !== null && until) body.saleEndsAt = until;
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage(amount === null ? "Хямдрал цуцлагдлаа." : "Хямдрал хадгалагдлаа."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }
  return <AdminRow className="admin-sale" data={{ "data-live": live ? "" : undefined }} open={open} onToggle={() => { setOpen(!open); setMessage(""); }} cells={<>
    <strong className="admin-cell-title">{title}</strong>
    <span className="admin-cell" data-label="Энгийн үнэ"><b>₮{format(regular)}</b> / сар</span>
    <span className="admin-cell" data-label="Хямдрал">{live
      ? <><span className="ws-pill info">Хямдарсан ₮{format(sale!)}</span><small>{saleEndsAt ? `${ubDay(saleEndsAt)} хүртэл` : "Цуцлах хүртэл"}</small></>
      : ended ? <>Хямдрал дууссан<small>{ubDay(saleEndsAt!)}</small></> : "Хямдралгүй"}</span>
  </>}>
    <form className="admin-row-form" onSubmit={event => { event.preventDefault(); void save(event.currentTarget, false); }}>
      <label>Хямдралтай үнэ (₮)<input name="sale" type="number" min={PLAN_PRICE_LIMITS.min} max={regular - PLAN_PRICE_LIMITS.step} step={PLAN_PRICE_LIMITS.step} defaultValue={live ? sale! : ""} placeholder={`₮${format(regular)}-аас бага`}/></label>
      <label>Дуусах өдөр (заавал биш)<input name="until" type="date" defaultValue={live && saleEndsAt ? ubDay(saleEndsAt) : ""}/></label>
      <label className="admin-field-wide">Шалтгаан<input name="reason" required minLength={5} maxLength={1000} placeholder="Жишээ: шинэ жилийн хямдрал"/></label>
      <div className="admin-form-actions">
        <button className="button primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хямдрал хадгалах"}</button>
        {live ? <button type="button" className="button secondary" disabled={busy} onClick={event => { const form = event.currentTarget.form!; if (form.reportValidity()) void save(form, true); }}>Хямдрал цуцлах</button> : null}
      </div>
      {message && <p role="status">{message}</p>}
    </form>
  </AdminRow>;
}
