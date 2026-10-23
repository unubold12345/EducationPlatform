import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { readAttempt } from "@/modules/attempts/service";
import { SavedPractice } from "@/modules/attempts/saved-practice";
export const metadata: Metadata = { title: "Хадгалсан дасгал" };
export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  let attempt;
  try { attempt = await readAttempt((await params).id, user.id); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
  return <div className="container practice-page"><div className="practice-heading"><p className="eyebrow">Хадгалсан дасгал</p><h1>{attempt.title}</h1><p>Сэдэвчилсэн дасгал · Хугацааны хязгааргүй · Таны бүртгэлд хадгална</p></div><div className="notice">Хадгалсан хариултаа дараа үргэлжлүүлж болно. Албан ёсны шалгалтын оноо тооцохгүй.</div><SavedPractice key={attempt.id + ":" + attempt.revision} initial={attempt} /></div>;
}

