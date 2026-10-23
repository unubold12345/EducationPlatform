"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
type DemoAccount = { name: string; email: string; password: string };
export function AuthForm({ register, nextPath = "/dashboard", demoAccounts = [] }: { register: boolean; nextPath?: string; demoAccounts?: DemoAccount[] }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedDemo, setSelectedDemo] = useState("");
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
        ? await authClient.signUp.email({ name: String(form.get("name")).trim(), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.status === 429 ? "Олон удаа оролдсон байна. Түр хүлээгээд дахин оролдоно уу." : register ? "Бүртгэл үүсгэж чадсангүй. Мэдээллээ шалгах эсвэл нэвтрэх хэсгийг ашиглана уу." : "Имэйл эсвэл нууц үг буруу байна.");
      } else { router.push(nextPath); router.refresh(); }
    } catch { setError("Холболт тасарлаа. Дахин оролдоно уу."); }
    finally { setPending(false); }
  }
  return <form className="auth-form" ref={formRef} onSubmit={submit}>
    {!register && demoAccounts.length > 0 && <section className="demo-accounts" aria-labelledby="demo-accounts-heading"><div className="demo-accounts-title"><h3 id="demo-accounts-heading">Туршилтын бүртгэлээр нэвтрэх</h3><span className="status">LOCAL DEMO</span></div><p>Бүртгэлээ сонгоод, «Нэвтрэх» товчийг дараарай.</p><div className="demo-account-grid">{demoAccounts.map((account,index)=><button className="demo-account-button" type="button" key={account.email} disabled={pending} aria-pressed={selectedDemo===account.email} onClick={()=>fillDemo(account)}><span className="demo-account-avatar" aria-hidden="true">{String(index+1).padStart(2,"0")}</span><span><strong>{account.name}</strong><small>{account.email}</small></span><span className="demo-account-check" aria-hidden="true">{selectedDemo===account.email?"✓":"↗"}</span></button>)}</div>{selectedDemo && <p className="demo-selected" role="status">Имэйл, нууц үг бөглөгдлөө. Нэвтрэхэд бэлэн.</p>}</section>}
    <fieldset disabled={pending} onChange={()=>setSelectedDemo("")}>
      {register ? <label>Нэр<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label> : null}
      <label>Имэйл<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Нууц үг<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 12 : undefined} maxLength={128} required /></label>
      {register ? <p className="fine-print">12 буюу түүнээс олон тэмдэгттэй нууц үг ашиглаарай.</p> : null}
      <button className="button" type="submit">{pending ? "Түр хүлээнэ үү…" : register ? "Бүртгүүлэх" : "Нэвтрэх"}</button>
    </fieldset>
    {error ? <p role="alert" className="error-message">{error}</p> : null}
    <p className="auth-switch">{register ? "Бүртгэлтэй юу? " : "Шинээр эхлэх үү? "}<Link href={(register ? "/login" : "/register") + (nextPath === "/dashboard" ? "" : "?next=" + encodeURIComponent(nextPath))}>{register ? "Нэвтрэх" : "Бүртгүүлэх"}</Link></p>
  </form>;
}

