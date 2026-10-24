import type { Metadata } from "next";
import { AuthRecoveryForm } from "@/components/auth-recovery-form";
import { authFeatures } from "@/lib/auth-features";
export const metadata: Metadata = { title: "Шинэ нууц үг", referrer: "no-referrer" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const query = await searchParams;
  const token = typeof query.token === "string" && query.token.length <= 512 && !query.error ? query.token : "";
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Бүртгэлийн аюулгүй байдал</p><h1>Шинэ нууц үг.<br /><span>Шинэ эхлэл.</span></h1><p>Энэ холбоос 15 минут хүчинтэй бөгөөд нэг удаа ашиглагдана.</p></div><section className="auth-card"><h2>Нууц үг шинэчлэх</h2><AuthRecoveryForm mode="reset" enabled={authFeatures(process.env).email} token={token} /></section></div>;
}
