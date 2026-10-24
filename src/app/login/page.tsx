import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { exerciseReturnPath } from "@/modules/exercises/catalog";
import { AuthForm } from "@/components/auth-form";
import demoAccounts from "@/data/demo-accounts.json";
import { localPilotEnabled } from "@/lib/local-pilot";
import { authFeatures } from "@/lib/auth-features";
export const metadata: Metadata = { title: "Нэвтрэх" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[]; error?: string }> }) {
  const query = await searchParams;
  const nextPath = exerciseReturnPath(query.next);
  if (await getSession()) redirect(nextPath);
  const features = authFeatures(process.env);
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Миний бэлтгэл</p><h1>Эхэлснээ<br /><span>үргэлжлүүл.</span></h1><p>Хариултаа хадгалж, өмнөх үр дүнгээ эргэн хараарай.</p></div><section className="auth-card"><h2>Нэвтрэх</h2>{query.error&&<div className="error-message" role="alert">{query.error === "account_not_linked" ? <>Энэ имэйлээр өмнө нь бүртгүүлсэн байна. Нууц үгээрээ нэвтрээд Профайл → Google холбох товчийг дараарай. Эсвэл <Link href="/verify-email">имэйлээ баталгаажуулаад</Link> Google-ээр дахин оролдоорой. <Link href="/forgot-password">Нууц үгээ сэргээх →</Link></> : query.error === "email_not_verified" ? <>Google хаягийн имэйл баталгаажаагүй байна. <Link href="/verify-email">Имэйл баталгаажуулах →</Link></> : <>Google-ээр нэвтэрч чадсангүй. Дахин оролдох эсвэл имэйл, нууц үгээрээ нэвтрээрэй.</>}</div>}<AuthForm register={false} nextPath={nextPath} demoAccounts={localPilotEnabled()||features.hostedDemo?demoAccounts:[]} hostedDemo={features.hostedDemo} googleEnabled={features.google} emailEnabled={features.email} verificationRequired={features.requireVerification} /><p className="fine-print">{features.email ? "Имэйл хаяг эсвэл Google бүртгэлээрээ үргэлжлүүлээрэй." : "Туршилтын орчин. Имэйлээр сэргээх үйлчилгээ хараахан идэвхжээгүй."}</p></section></div>;
}

