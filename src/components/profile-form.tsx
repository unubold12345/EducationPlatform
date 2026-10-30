"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const nextName = String(new FormData(form).get("name") ?? "").trim();
    setError(""); setMessage("");
    if (nextName.length < 2 || nextName.length > 100) { setError("Нэр 2–100 тэмдэгттэй байна."); return; }
    setPending(true);
    try {
      const result = await authClient.updateUser({ name: nextName });
      if (result.error) throw new Error("save");
      setMessage("Профайл хадгалагдлаа."); router.refresh();
    } catch { setError("Хадгалж чадсангүй. Дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <form className="profile-form" onSubmit={save}>
    <div className="profile-field">
      <label htmlFor="profile-name">Харагдах нэр</label>
      <input id="profile-name" name="name" defaultValue={name} minLength={2} maxLength={100} autoComplete="name" required disabled={pending}/>
      <p className="fine-print">Мэндчилгээ болон таны профайлд харагдана.</p>
    </div>
    <div className="profile-form-actions">
      <button className="button" disabled={pending}>{pending ? "Хадгалж байна…" : "Өөрчлөлт хадгалах"}</button>
      {message && <p className="form-success" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  </form>;
}

export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const newPassword = String(values.get("newPassword"));
    setMessage(""); setError("");
    if (newPassword !== values.get("confirmPassword")) { setError("Шинэ нууц үгүүд таарахгүй байна."); return; }
    setPending(true);
    try {
      const result = await authClient.changePassword({ currentPassword: String(values.get("currentPassword")), newPassword, revokeOtherSessions: true });
      if (result.error) { setError(result.error.status === 429 ? "Түр хүлээгээд дахин оролдоно уу." : "Одоогийн нууц үгээ шалгана уу. Шинэ нууц үг 12–128 тэмдэгттэй байна."); }
      else { form.reset(); setMessage("Нууц үг шинэчлэгдлээ. Бусад төхөөрөмжөөс гаргалаа."); }
    } catch { setError("Холболтоо шалгаад дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <form className="profile-form" onSubmit={save}>
    <fieldset disabled={pending}>
      <div className="profile-field">
        <label htmlFor="current-password">Одоогийн нууц үг</label>
        <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required/>
      </div>
      <div className="password-pair">
        <div className="profile-field">
          <label htmlFor="new-password">Шинэ нууц үг</label>
          <input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
        </div>
        <div className="profile-field">
          <label htmlFor="confirm-password">Шинэ нууц үг давтах</label>
          <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
        </div>
      </div>
      <p className="fine-print">12–128 тэмдэгт ашиглана уу. Шинэчилсний дараа бусад төхөөрөмжийн нэвтрэлт хаагдана.</p>
      <div className="profile-form-actions">
        <button className="button secondary">{pending ? "Шинэчилж байна…" : "Нууц үг шинэчлэх"}</button>
        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
    </fieldset>
  </form>;
}
