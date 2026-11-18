"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREDIT_ALLOWANCE_LIMITS } from "@/modules/credits/pricing";
import { AdminRow } from "./admin-row";

/** One monthly AI credit amount (free or a plan) as a list row, changed with a reason and recorded in the audit history. */
export function AdminCreditForm({ allowanceKey, title, credits, fallback }: { allowanceKey: string; title: string; credits: number; fallback: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const format = (value: number) => value.toLocaleString("en-US");
  return <AdminRow data={{ "data-credit-key": allowanceKey }} open={open} onToggle={() => { setOpen(!open); setMessage(""); }} cells={<>
    <strong className="admin-cell-title">{title}</strong>
    <span className="admin-cell" data-label="Сарын кредит"><b>{format(credits)} кредит</b> / сар</span>
    <span className="admin-cell" data-label="Анхны хэмжээ">{credits !== fallback ? `${format(fallback)} кредит` : "Өөрчлөөгүй"}</span>
  </>}>
    <form className="admin-row-form" onSubmit={async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget), next = Number(data.get("credits"));
      if (!window.confirm(`${title}: ${format(credits)} → ${format(next)} кредит / сар. Энэ сарын үлдэгдэлд шууд нөлөөлнө. Хадгалах уу?`)) return;
      setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-credits", target: allowanceKey, amount: next, reason: data.get("reason") }) });
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        setMessage("Кредитийн хэмжээ шинэчлэгдлээ."); router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
      finally { setBusy(false); }
    }}>
      <label>Шинэ хэмжээ (кредит / сар)<input name="credits" type="number" required min={CREDIT_ALLOWANCE_LIMITS.min} max={CREDIT_ALLOWANCE_LIMITS.max} step={1} defaultValue={credits}/></label>
      <label className="admin-field-wide">Шалтгаан<input name="reason" required minLength={5} maxLength={1000} placeholder="Жишээ: шалгалтын улиралд нэмэгдүүлэв"/></label>
      <button className="button primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </AdminRow>;
}
