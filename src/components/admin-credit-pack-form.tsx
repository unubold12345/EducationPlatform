"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREDIT_PACK_COUNT, CREDIT_PACK_LIMITS, type CreditPackOffer } from "@/modules/credits/pricing";

type Row = { credits: string; amount: string };
const toRows = (packs: readonly CreditPackOffer[]): Row[] => packs.map(pack => ({ credits: String(pack.credits), amount: String(pack.amountMnt) }));
const perCredit = (row: Row) => {
  const credits = Number(row.credits), amount = Number(row.amount);
  return credits > 0 && amount > 0 ? "₮" + (amount / credits).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
};

/**
 * The AI credit packs on sale: add, change or remove any number of them (1–12), changed with a reason and audited.
 * The list is saved as a whole; "Анхны багцууд" saves the code defaults back.
 */
export function AdminCreditPacksForm({ packs, defaults, custom }: { packs: readonly CreditPackOffer[]; defaults: readonly CreditPackOffer[]; custom: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => toRows(packs));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const format = (value: number) => value.toLocaleString("en-US");
  const summary = (list: readonly CreditPackOffer[]) => list.map(pack => `${format(pack.credits)} / ₮${format(pack.amountMnt)}`).join(", ");
  const change = (index: number, key: keyof Row, value: string) => setRows(current => current.map((row, at) => at === index ? { ...row, [key]: value } : row));

  async function save(list: CreditPackOffer[], reason: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-credit-packs", target: "packs", packs: list, reason }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setMessage(list.length ? "Кредит багцууд шинэчлэгдлээ." : "Анхны багцууд сэргэлээ.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }

  return <form className="admin-form admin-credit-pack" onSubmit={event => {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    const list = rows.map(row => ({ credits: Number(row.credits), amountMnt: Number(row.amount) }));
    if (!window.confirm(`AI кредит багцууд: ${summary(packs)} → ${summary(list)}. Шинэ болон төлөгдөөгүй захиалгад шууд үйлчилнэ. Хадгалах уу?`)) return;
    void save(list, reason);
  }}>
    <div className="admin-form-head">
      <strong>Зарагдаж буй багцууд</strong>
      <span className={"ws-pill " + (custom ? "info" : "")}>{custom ? "Өөрчилсөн" : "Анхны багцууд"}</span>
    </div>
    <div className="admin-pack-rows">
      <div className="admin-pack-head" aria-hidden="true"><span>Кредит</span><span>Үнэ (₮)</span><span>1 кредит</span><span/></div>
      {rows.map((row, index) => <div className="admin-pack-row" key={index}>
        <input type="number" aria-label="Кредит" required min={CREDIT_PACK_LIMITS.credits.min} max={CREDIT_PACK_LIMITS.credits.max} step={1} value={row.credits} onChange={event => change(index, "credits", event.target.value)}/>
        <input type="number" aria-label="Үнэ (₮)" required min={CREDIT_PACK_LIMITS.amountMnt.min} max={CREDIT_PACK_LIMITS.amountMnt.max} step={CREDIT_PACK_LIMITS.amountMnt.step} value={row.amount} onChange={event => change(index, "amount", event.target.value)}/>
        <span className="admin-pack-rate">{perCredit(row)}</span>
        <button type="button" className="admin-small-button" aria-label={`${row.credits || "Шинэ"} кредитийн багцыг хасах`} disabled={busy || rows.length <= CREDIT_PACK_COUNT.min} onClick={() => setRows(current => current.filter((_, at) => at !== index))}>Хасах</button>
      </div>)}
      <button type="button" className="admin-small-button admin-pack-add" disabled={busy || rows.length >= CREDIT_PACK_COUNT.max} onClick={() => setRows(current => [...current, { credits: "", amount: "" }])}>+ Багц нэмэх</button>
    </div>
    <label>Шалтгаан<input name="reason" required minLength={5} maxLength={1000} placeholder="Жишээ: шалгалтын улиралд олон хэмжээтэй багц нэмэв"/></label>
    <div className="admin-form-actions">
      <button className="button primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      {custom ? <button type="button" className="button secondary" disabled={busy} onClick={event => {
        const reason = String(new FormData(event.currentTarget.form!).get("reason") ?? "").trim();
        if (reason.length < 5) { setMessage("Шалтгаанаа бичнэ үү (5-аас дээш тэмдэгт)."); return; }
        if (window.confirm(`Анхны багцууд руу буцаах уу? ${summary(defaults)}`)) { setRows(toRows(defaults)); void save([], reason); }
      }}>Анхны багцууд</button> : null}
    </div>
    {message && <p role="status">{message}</p>}
  </form>;
}
