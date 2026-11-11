import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntranceHub } from "@/modules/exams/entrance/hub";
import { isEntranceSubject } from "@/modules/exams/entrance/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ЭЕШ · Бүтэн mock шалгалтууд" };

export default async function EeshHubPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const requested = (await searchParams).subject;
  if (requested !== undefined && !isEntranceSubject(requested)) notFound();
  const subject = requested ?? "math";
  return <EntranceHub subject={subject} />;
}
