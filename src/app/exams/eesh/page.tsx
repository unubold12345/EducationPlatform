import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntranceHub } from "@/modules/exams/entrance/hub";
import type { EntranceSubject } from "@/modules/exams/entrance/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ЭЕШ · Бүтэн mock шалгалтууд" };

export default async function EeshHubPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const requested = (await searchParams).subject;
  if (requested !== undefined && !["math", "physics", "english"].includes(requested)) notFound();
  const subject = (requested ?? "math") as EntranceSubject;
  return <EntranceHub subject={subject} />;
}
