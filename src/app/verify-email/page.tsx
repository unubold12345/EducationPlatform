import type { Metadata } from "next";
import { AuthRecoveryForm } from "@/components/auth-recovery-form";
import { authFeatures } from "@/lib/auth-features";
export const metadata: Metadata = { title: "Имэйл баталгаажуулах", referrer: "no-referrer" };
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; verified?: string; error?: string }> }) {
  const query = await searchParams;
  const email = typeof query.email === "string" && query.email.length <= 254 ? query.email : "";
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Таны имэйл хаяг</p><h1>Нэг холбоос.<br /><span>Баталгаатай бүртгэл.</span></h1><p>Gmail болон өөрийн бусад имэйлдээ ирсэн холбоосыг нээгээрэй. Имэйлээ баталгаажуулсны дараа нэвтэрч болно.</p></div><section className="auth-card"><h2>Имэйл баталгаажуулах</h2>{query.error && <p className="error-message" role="alert">Холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Дахин холбоос аваарай.</p>}<AuthRecoveryForm mode="verify" enabled={authFeatures(process.env).email} email={email} verified={query.verified === "1" && !query.error} /></section></div>;
}
