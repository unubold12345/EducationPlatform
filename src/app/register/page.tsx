import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { exerciseReturnPath } from "@/modules/exercises/catalog";
import { AuthForm } from "@/components/auth-form";
import { authFeatures } from "@/lib/auth-features";
export const metadata: Metadata = { title: "Бүртгүүлэх" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const nextPath = exerciseReturnPath((await searchParams).next);
  if (await getSession()) redirect(nextPath);
  const features = authFeatures(process.env);
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Миний бэлтгэл</p><h1>Алхам бүрээ<br /><span>хадгалаарай.</span></h1><p>Education-ийн тусдаа бүртгэл. LawTest-ийн бүртгэл, эрх энд үйлчлэхгүй.</p><ul className="auth-benefits"><li><span>01</span>Нэг бүртгэлээр SAT, IELTS, ЭЕШ.</li><li><span>02</span>Имэйлээр баталгаажуулж, эрхээ хамгаална.</li><li><span>03</span>Ажлын явц, үр дүн таных.</li></ul></div><section className="auth-card"><div className="auth-kicker"><span>ACCOUNT</span><span>2026 · JOIN</span></div><h2>Бүртгүүлэх</h2><p className="fine-print">{features.email ? "Өөрийн Gmail эсвэл бусад имэйл хаягаа ашиглаарай. Ирсэн холбоосоор хаягаа баталгаажуулна." : "Туршилтын бүртгэл. Имэйлээр баталгаажуулах болон сэргээх үйлчилгээ хараахан идэвхжээгүй."}</p><AuthForm register nextPath={nextPath} googleEnabled={features.google} verificationRequired={features.requireVerification} /></section></div>;
}

