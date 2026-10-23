import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { exerciseReturnPath } from "@/modules/exercises/catalog";
import { AuthForm } from "@/components/auth-form";
import demoAccounts from "@/data/demo-accounts.json";
import { localPilotEnabled } from "@/lib/local-pilot";
export const metadata: Metadata = { title: "Нэвтрэх" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const nextPath = exerciseReturnPath((await searchParams).next);
  if (await getSession()) redirect(nextPath);
  return <div className="container auth-page"><div className="auth-intro"><p className="eyebrow">Миний бэлтгэл</p><h1>Эхэлснээ<br /><span>үргэлжлүүл.</span></h1><p>Хариултаа хадгалж, өмнөх үр дүнгээ эргэн хараарай.</p></div><section className="auth-card"><h2>Нэвтрэх</h2><AuthForm register={false} nextPath={nextPath} demoAccounts={localPilotEnabled()?demoAccounts:[]} /><p className="fine-print">Туршилтын орчин. Нууц үг сэргээх боломж хараахан нээгдээгүй.</p></section></div>;
}

