import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { exerciseReturnPath } from "@/modules/exercises/catalog";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Бүртгүүлэх" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const nextPath = exerciseReturnPath((await searchParams).next);
  if (await getSession()) redirect(nextPath);
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Миний бэлтгэл</p><h1>Алхам бүрээ<br /><span>хадгалаарай.</span></h1><p>Education-ийн тусдаа бүртгэл. LawTest-ийн бүртгэл, эрх энд үйлчлэхгүй.</p></div><section className="auth-card"><h2>Бүртгүүлэх</h2><p className="fine-print">Одоогоор зөвхөн туршилтад зориулсан бүртгэл. Туршилтын имэйл ашиглаарай; имэйл баталгаажуулалт болон нууц үг сэргээх боломж хараахан нээгдээгүй.</p><AuthForm register nextPath={nextPath} /></section></div>;
}

