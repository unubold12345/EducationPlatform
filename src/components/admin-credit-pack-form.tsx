"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREDIT_PACK_LIMITS } from "@/modules/credits/pricing";

/** The AI credit pack on sale: how many credits it adds and what it costs, changed with a reason and audited. */
export function AdminCreditPackForm({ credits, amountMnt, fallback }: { credits: number; amountMnt: number; fallback: { credits: number; amountMnt: number } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const format = (value: number) => value.toLocaleString("en-US");
  const changed = credits !== fallback.credits || amountMnt !== fallback.amountMnt;
  return <form className="admin-price admin-credit-pack" onSubmit={async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget), nextCredits = Number(data.get("credits")), nextAmount = Number(data.get("amount"));
    if (!window.confirm(`AI кредит багц: ${format(credits)} кредит / ₮${format(amountMnt)} → ${format(nextCredits)} кредит / ₮${format(nextAmount)}. Шинэ захиалгад шууд үйлчилнэ. Хадгалах уу?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-credit-pack", target: "default", credits: nextCredits, amount: nextAmount, reason: data.get("reason") }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage("Кредит багц шинэчлэгдлээ."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }}>
    <div><strong>AI кредит багц</strong><small>Одоо {format(credits)} кредит · ₮{format(amountMnt)}{changed ? ` · анхны ${format(fallback.credits)} кредит · ₮${format(fallback.amountMnt)}` : ""}</small></div>
    <label>Кредит<input name="credits" type="number" required min={CREDIT_PACK_LIMITS.credits.min} max={CREDIT_PACK_LIMITS.credits.max} step={1} defaultValue={credits}/></label>
    <label>Үнэ (₮)<input name="amount" type="number" required min={CREDIT_PACK_LIMITS.amountMnt.min} max={CREDIT_PACK_LIMITS.amountMnt.max} step={CREDIT_PACK_LIMITS.amountMnt.step} defaultValue={amountMnt}/></label>
    <label>Шалтгаан<input name="reason" required minLength={5} maxLength={1000} placeholder="Жишээ: шалгалтын улиралд хямдруулав"/></label>
    <button className="button primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
