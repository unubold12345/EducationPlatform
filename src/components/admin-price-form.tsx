"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminRow } from "./admin-row";

/** One plan's monthly price as a list row; the editor opens inside the row. Saved with a reason and audited. */
export function AdminPriceForm({ program, title, amount, fallback, sale }: { program: string; title: string; amount: number; fallback: number; sale: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const format = (value: number) => value.toLocaleString("en-US");
  return <AdminRow open={open} onToggle={() => { setOpen(!open); setMessage(""); }} cells={<>
    <strong className="admin-cell-title">{title}</strong>
    <span className="admin-cell" data-label="Одоогийн үнэ"><b>₮{format(amount)}</b> / сар{amount !== fallback ? <small>анхны ₮{format(fallback)}</small> : null}</span>
    <span className="admin-cell" data-label="Хямдрал">{sale}</span>
  </>}>
    <form className="admin-row-form" onSubmit={async event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget), next = Number(data.get("amount"));
      if (!window.confirm(`${title}: ₮${format(amount)} → ₮${format(next)}. Шинэ захиалгад шууд үйлчилнэ. Хадгалах уу?`)) return;
      setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-price", target: program, amount: next, reason: data.get("reason") }) });
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        setMessage("Үнэ шинэчлэгдлээ."); router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
      finally { setBusy(false); }
    }}>
      <label>Шинэ үнэ (₮)<input name="amount" type="number" required min={1000} max={1000000} step={100} defaultValue={amount}/></label>
      <label className="admin-field-wide">Шалтгаан<input name="reason" required minLength={5} maxLength={1000} placeholder="Жишээ: 11-р сарын урамшуулал"/></label>
      <button className="button primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </AdminRow>;
}
