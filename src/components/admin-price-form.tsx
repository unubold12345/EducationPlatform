"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminPriceForm({ program, title, amount, fallback }: { program: string; title: string; amount: number; fallback: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="admin-price" onSubmit={async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget), next = Number(data.get("amount"));
    if (!window.confirm(`${title}: ₮${amount.toLocaleString("en-US")} → ₮${next.toLocaleString("en-US")}. Шинэ захиалгад шууд үйлчилнэ. Хадгалах уу?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-price", target: program, amount: next, reason: data.get("reason") }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage("Үнэ шинэчлэгдлээ."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }}>
    <div><strong>{title}</strong><small>Одоо ₮{amount.toLocaleString("en-US")} / сар{amount !== fallback ? ` · анхны ₮${fallback.toLocaleString("en-US")}` : ""}</small></div>
    <label>Шинэ үнэ (₮)<input name="amount" type="number" required min={1000} max={1000000} step={100} defaultValue={amount}/></label>
    <label>Шалтгаан<input name="reason" required minLength={5} maxLength={1000} placeholder="Жишээ: 11-р сарын урамшуулал"/></label>
    <button className="button primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
