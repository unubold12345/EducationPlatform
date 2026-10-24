import type { Metadata } from "next";
import { AuthRecoveryForm } from "@/components/auth-recovery-form";
import { authFeatures } from "@/lib/auth-features";
import { connection } from "next/server";
export const metadata: Metadata = { title: "Нууц үг сэргээх", referrer: "no-referrer" };
export default async function ForgotPasswordPage() {
  await connection();
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Бүртгэлийн аюулгүй байдал</p><h1>Дахин<br /><span>үргэлжлүүл.</span></h1><p>Бүртгэлтэй имэйлдээ нууц үг шинэчлэх холбоос аваарай.</p></div><section className="auth-card"><h2>Нууц үг сэргээх</h2><AuthRecoveryForm mode="forgot" enabled={authFeatures(process.env).email} /></section></div>;
}
