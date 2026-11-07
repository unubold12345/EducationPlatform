"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_PRICE_LABEL } from "../pricing";

/** A compact start control for the imported ЭЕШ papers: one click, no preflight checklist. */
export function EntranceStart({ slug, hasAccess, loggedIn, activeAttemptId }: { slug: string; hasAccess: boolean; loggedIn: boolean; activeAttemptId?: string }) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/mock-attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), signal: AbortSignal.timeout(15000) });
      if (response.status === 401) { router.push("/login?next=" + encodeURIComponent("/exams/" + slug)); return; }
      if (response.status === 402) { router.push("/checkout/" + slug); return; }
      if (!response.ok) throw Error("start");
      const data = await response.json() as { id: string };
      router.push("/exams/attempts/" + data.id);
    } catch {
      setError("Шалгалт нээгдсэнгүй. Холболтоо шалгаад дахин оролдоно уу.");
    } finally { busy.current = false; setPending(false); }
  }
  if (!hasAccess) return <div className="eesh-gate">
    <p className="eyebrow">НЭГ ШАЛГАЛТЫН ЭРХ</p>
    <strong>{MOCK_PRICE_LABEL}</strong>
    <p>Эсвэл University Prep сарын багц — бүх ЭЕШ mock нээлттэй.</p>
    <button type="button" className="button" onClick={() => router.push(loggedIn ? "/checkout/" + slug : "/login?next=" + encodeURIComponent("/checkout/" + slug))}>Эрх авах →</button>
    <Link className="text-link" href="/subscribe/entrance">University Prep үзэх</Link>
  </div>;
  return <div className="eesh-start">
    <button type="button" className="button eesh-start-button" onClick={start} disabled={pending}>{pending ? "Нээж байна…" : activeAttemptId ? "Үргэлжлүүлэх" : "Шалгалт эхлэх"} <span aria-hidden="true">→</span></button>
    <p className="fine-print">Цаг серверт хадгалагдана. Хариу автоматаар хадгалагдана.</p>
    {error ? <p className="error-message" role="alert">{error}</p> : null}
  </div>;
}
