"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
type DemoAccount = { name: string; email: string; password: string };
export function AuthForm({ register, nextPath = "/dashboard", demoAccounts = [], hostedDemo = false, googleEnabled = false, verificationRequired = false }: { register: boolean; nextPath?: string; demoAccounts?: DemoAccount[]; hostedDemo?: boolean; googleEnabled?: boolean; verificationRequired?: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedDemo, setSelectedDemo] = useState("");
  async function googleSignIn() {
    if (pending || !googleEnabled) return;
    setPending(true); setError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: nextPath, errorCallbackURL: "/login?next=" + encodeURIComponent(nextPath) });
      if (result.error) { setError("Google-ээр нэвтэрч чадсангүй. Дахин оролдоно уу."); setPending(false); }
    } catch { setError("Google-ээр нэвтэрч чадсангүй. Дахин оролдоно уу."); setPending(false); }
  }
  function fillDemo(account: DemoAccount) {
    if (pending || !formRef.current) return;
    const email = formRef.current.elements.namedItem("email");
    const password = formRef.current.elements.namedItem("password");
    if (!(email instanceof HTMLInputElement) || !(password instanceof HTMLInputElement)) return;
    email.value = account.email;
    password.value = account.password;
    setError(""); setSelectedDemo(account.email);
    formRef.current.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
  }
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    try {
      const result = register
        ? await authClient.signUp.email({ name: String(form.get("name")).trim(), email, password, callbackURL: "/verify-email?verified=1" })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") { router.push("/verify-email?email=" + encodeURIComponent(email)); return; }
        if (result.error.code === "ACCOUNT_SUSPENDED") { setError("Энэ бүртгэлийг түр хаасан байна. Дэмжлэгтэй холбогдоно уу."); return; }
        setError(result.error.status === 429 ? "Олон удаа оролдсон байна. Түр хүлээгээд дахин оролдоно уу." : register ? "Бүртгэл үүсгэж чадсангүй. Мэдээллээ шалгах эсвэл нэвтрэх хэсгийг ашиглана уу." : "Имэйл эсвэл нууц үг буруу байна.");
      } else if (register && verificationRequired) { router.push("/verify-email?email=" + encodeURIComponent(email)); }
      else { router.push(nextPath); router.refresh(); }
    } catch { setError("Холболт тасарлаа. Дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <form className="auth-form" ref={formRef} onSubmit={submit}>
    {!register && demoAccounts.length > 0 && <section className="demo-accounts" aria-labelledby="demo-accounts-heading"><div className="demo-accounts-title"><h3 id="demo-accounts-heading">Туршилтын бүртгэлээр нэвтрэх</h3><span className="status">{hostedDemo ? "SHARED DEMO" : "LOCAL DEMO"}</span></div><p>{hostedDemo ? "Нийтэд нээлттэй, хамтран ашиглах 5 бүртгэл. Бусад хүн хадгалсан ажлыг харж болно. Хувийн мэдээлэл бүү оруулаарай." : "Бүртгэлээ сонгоод, «Нэвтрэх» товчийг дараарай."}</p><div className="demo-account-grid">{demoAccounts.map((account,index)=><button className="demo-account-button" type="button" key={account.email} disabled={pending} aria-pressed={selectedDemo===account.email} onClick={()=>fillDemo(account)}><span className="demo-account-avatar" aria-hidden="true">{String(index+1).padStart(2,"0")}</span><span><strong>{account.name}</strong><small>{account.email}</small></span><span className="demo-account-check" aria-hidden="true">{selectedDemo===account.email?"✓":"↗"}</span></button>)}</div>{selectedDemo && <p className="demo-selected" role="status">Имэйл, нууц үг бөглөгдлөө. Нэвтрэхэд бэлэн.</p>}</section>}
    {googleEnabled && <button className="button secondary google-sign-in" type="button" aria-label="Google-ээр үргэлжлүүлэх" aria-busy={pending} disabled={pending} onClick={googleSignIn}>
      <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17v5h6.6c3.86-3.55 6.09-8.78 6.09-14.67Z"/>
        <path fill="#34A853" d="M24 44c5.5 0 10.11-1.82 13.52-4.87l-6.6-5c-1.83 1.23-4.17 1.96-6.92 1.96-5.31 0-9.8-3.59-11.41-8.42H5.77v5.15A20 20 0 0 0 24 44Z"/>
        <path fill="#FBBC05" d="M12.59 27.67A12 12 0 0 1 12 24c0-1.27.22-2.5.59-3.67v-5.15H5.77A20 20 0 0 0 4 24c0 3.22.77 6.27 1.77 8.82l6.82-5.15Z"/>
        <path fill="#EA4335" d="M24 11.91c3 0 5.69 1.03 7.81 3.05l5.86-5.86C34.1 5.78 29.5 4 24 4A20 20 0 0 0 5.77 15.18l6.82 5.15C14.2 15.5 18.69 11.91 24 11.91Z"/>
      </svg>
    </button>}
    <fieldset disabled={pending} onChange={()=>setSelectedDemo("")}>
      {register ? <label>Нэр<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label> : null}
      <label>Имэйл<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Нууц үг<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 12 : undefined} maxLength={128} required /></label>
      {register ? <p className="fine-print">12 буюу түүнээс олон тэмдэгттэй нууц үг ашиглаарай.</p> : null}
      <button className="button" type="submit">{pending ? "Түр хүлээнэ үү…" : register ? "Бүртгүүлэх" : "Нэвтрэх"}</button>
    </fieldset>
    {error ? <p role="alert" className="error-message">{error}</p> : null}
    {!register && <p className="auth-switch"><Link href="/forgot-password">Нууц үгээ мартсан уу?</Link></p>}
    <p className="auth-switch">{register ? "Бүртгэлтэй юу? " : "Шинээр эхлэх үү? "}<Link href={(register ? "/login" : "/register") + (nextPath === "/dashboard" ? "" : "?next=" + encodeURIComponent(nextPath))}>{register ? "Нэвтрэх" : "Бүртгүүлэх"}</Link></p>
  </form>;
}

