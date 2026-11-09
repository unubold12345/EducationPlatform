"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREDIT_GRANT_LIMITS } from "@/modules/credits/pricing";

const actions = {
  "add-note": { label: "Тэмдэглэл нэмэх", field: "Тэмдэглэл (зөвхөн админд харагдана)", confirm: "" },
  "grant-credits": { label: "AI кредит олгох (энэ сар)", field: "Шалтгаан", confirm: "Энэ сарын AI кредит нэмэх үү? Сарын эцэст бусад кредиттэй хамт дуусна." },
  "grant-month": { label: "Нэг сарын эрх олгох / сунгах", field: "Шалтгаан", confirm: "Сарын эрх олгох уу? Төлбөрийн баримт үүсэхгүй." },
  "expire-plan": { label: "Сарын эрхийг дуусгах", field: "Шалтгаан", confirm: "Сарын эрхийг одоо дуусгах уу?" },
  "revoke-sessions": { label: "Бүх төхөөрөмжөөс гаргах", field: "Шалтгаан", confirm: "Бүх идэвхтэй сессийг хаах уу?" },
  "suspend": { label: "Бүртгэлийг түр хаах", field: "Хаах шалтгаан (хэрэглэгчийн түүхэнд хадгална)", confirm: "Бүртгэлийг хааж, бүх сессээс гаргах уу? Нэвтрэх болон бүх үйлдэл хаагдана." },
  "unsuspend": { label: "Хаалтыг цуцлах", field: "Шалтгаан", confirm: "Бүртгэлийн хаалтыг цуцлах уу?" },
} as const;
type Action = keyof typeof actions;

export function AdminUserActions({ target, suspended, protectedUser }: { target: string; suspended: boolean; protectedUser: boolean }) {
  const router = useRouter();
  const available = (Object.keys(actions) as Action[]).filter(key => key === "suspend" ? !suspended && !protectedUser : key === "unsuspend" ? suspended : key === "revoke-sessions" ? !protectedUser : true);
  const [action, setAction] = useState<Action>("add-note");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const plan = action === "grant-month" || action === "expire-plan";
  const credits = action === "grant-credits";
  return <form className="admin-user-actions" onSubmit={async event => {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form);
    if (actions[action].confirm && !window.confirm(actions[action].confirm)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, target, reason: data.get("reason"), ...(plan ? { program: data.get("program") } : {}), ...(credits ? { amount: Number(data.get("amount")) } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      form.reset(); setAction("add-note"); setMessage("Хадгаллаа. Үйлдлийн түүхэнд бүртгэгдлээ."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }}>
    <label>Юу хийх вэ<select name="action" value={available.includes(action) ? action : "add-note"} onChange={event => { setAction(event.target.value as Action); setMessage(""); }}>{available.map(key => <option key={key} value={key}>{actions[key].label}</option>)}</select></label>
    {plan && <label>Хөтөлбөр<select name="program"><option value="sat">SAT</option><option value="ielts">IELTS</option><option value="entrance">University Prep</option></select></label>}
    {credits && <label>Кредитийн тоо<input name="amount" type="number" required min={CREDIT_GRANT_LIMITS.min} max={CREDIT_GRANT_LIMITS.max} step={1} defaultValue={50}/></label>}
    <label>{actions[action].field}<textarea name="reason" required minLength={5} maxLength={1000} rows={3}/></label>
    <button className={"button " + (action === "suspend" ? "danger" : "primary")} disabled={busy}>{busy ? "Хадгалж байна…" : actions[action].label}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
