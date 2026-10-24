"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function AuthRecoveryForm({ mode, enabled, token = "", email = "", verified = false }: {
  mode: "forgot" | "reset" | "verify"; enabled: boolean; token?: string; email?: string; verified?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || !enabled) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const address = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (mode === "reset" && password !== String(form.get("confirmPassword"))) { setError("Нууц үг хоорондоо таарахгүй байна."); return; }
    setPending(true);
    try {
      const result = mode === "forgot"
        ? await authClient.requestPasswordReset({ email: address, redirectTo: "/reset-password" })
        : mode === "verify"
          ? await authClient.sendVerificationEmail({ email: address, callbackURL: "/verify-email?verified=1" })
          : await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.status === 429 ? "Олон удаа оролдсон байна. Түр хүлээгээд дахин оролдоно уу." : mode === "reset" ? "Холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Шинэ холбоос авна уу." : "Хүсэлтийг илгээж чадсангүй. Дахин оролдоно уу.");
      } else setDone(true);
    } catch { setError("Холболт тасарлаа. Дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <div className="auth-recovery">
    {verified ? <p className="form-success" role="status">Имэйл дэх холбоосоо нээсэн бол нэвтэрч үргэлжлүүлээрэй.</p> : done ? <p className="form-success" role="status">{mode === "reset" ? "Нууц үг шинэчлэгдлээ. Бусад төхөөрөмжийн нэвтрэлт хаагдсан. Шинэ нууц үгээрээ нэвтрээрэй." : "Энэ хаягаар хүсэлт илгээх боломжтой бол холбоос очно. Ирсэн имэйл болон spam хавтсаа шалгаарай."}</p> : <>
      {!enabled && <p className="fine-print">Имэйлээр {mode === "verify" ? "баталгаажуулах" : "нууц үг сэргээх"} үйлчилгээ хараахан идэвхжээгүй байна.</p>}
      <form className="auth-form" onSubmit={submit}><fieldset disabled={pending || !enabled || (mode === "reset" && !token)}>
        {mode === "reset" ? <><label>Шинэ нууц үг<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label><label>Шинэ нууц үг давтах<input name="confirmPassword" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label><p className="fine-print">12–128 тэмдэгт ашиглана уу.</p></> : <label>Имэйл<input name="email" type="email" autoComplete="email" defaultValue={email} maxLength={254} required /></label>}
        <button className="button" type="submit">{pending ? "Илгээж байна…" : mode === "reset" ? "Нууц үг хадгалах" : "Холбоос авах"}</button>
      </fieldset></form>
      {mode === "reset" && !token && <p className="error-message">Баталгаатай холбоос шаардлагатай. <Link href="/forgot-password">Шинэ холбоос авах</Link></p>}
    </>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {mode === "reset" && error && <Link href="/forgot-password">Шинэ холбоос авах →</Link>}
    <p className="auth-switch"><Link href="/login">Нэвтрэх хэсэг рүү →</Link></p>
  </div>;
}
