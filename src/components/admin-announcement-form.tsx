"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { NOTIFICATION_LIMITS } from "@/modules/notifications/rules";

async function post(body: object) {
  const response = await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  return result as { audience?: string };
}

/** Sends a message to every member's inbox, or to one member by email. */
export function AdminAnnouncementForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { title, body, href } = NOTIFICATION_LIMITS;
  return <form className="admin-form admin-announce" onSubmit={async event => {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form), email = String(data.get("email") ?? "").trim();
    if (!window.confirm(email ? `${email} хаягтай хэрэглэгчид илгээх үү?` : "Бүх хэрэглэгчид илгээх үү?")) return;
    setBusy(true); setMessage("");
    try {
      await post({ action: "send", title: data.get("title"), body: data.get("body"), href: String(data.get("href") ?? "").trim(), email });
      form.reset(); setMessage(email ? "Илгээлээ." : "Бүх хэрэглэгчид илгээлээ."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }}>
    <label>Гарчиг<input name="title" required minLength={title.min} maxLength={title.max} /></label>
    <label>Текст<textarea name="body" required minLength={body.min} maxLength={body.max} rows={4} /></label>
    <div className="admin-form-pair">
      <label>Холбоос (заавал биш)<input name="href" maxLength={href} placeholder="/workspace/plans" pattern="/[^\s\\]*" /></label>
      <label>Нэг хэрэглэгчийн имэйл (хоосон бол бүгдэд)<input name="email" type="email" maxLength={254} autoComplete="off" /></label>
    </div>
    <div className="admin-form-actions">
      <button className="button primary" disabled={busy}>{busy ? "Илгээж байна…" : "Илгээх"}</button>
      {message && <p role="status">{message}</p>}
    </div>
  </form>;
}

/** Takes an announcement back from every inbox it reached. */
export function AdminAnnouncementWithdraw({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  return <>
    <button type="button" className="admin-small-button" disabled={busy} onClick={async () => {
      if (!window.confirm(`"${title}" мэдэгдлийг бүх хайрцгаас буцаах уу?`)) return;
      setBusy(true); setFailed("");
      try { await post({ action: "withdraw", id }); router.refresh(); }
      catch (error) { setFailed(error instanceof Error ? error.message : "Алдаа гарлаа."); setBusy(false); }
    }}>{busy ? "Буцааж байна…" : "Буцаах"}</button>
    {failed && <small role="status">{failed}</small>}
  </>;
}
