"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function StartAttempt({ examId, label }: { examId?: string; label?: string }) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/attempts", {
        method: "POST", signal: AbortSignal.timeout(15000),
        ...(examId ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId }) } : {}),
      });
      if (response.status === 401) { router.push(examId ? "/login?next=" + encodeURIComponent("/exercises/" + examId.replace(/-v1$/, "")) : "/login"); return; }
      if (response.status === 402) { router.push("/subscribe/"+(examId?.startsWith("ielts-")?"ielts":examId?.startsWith("entrance-")?"entrance":"sat")); return; }
      if (!response.ok) throw new Error("start");
      const data: { id: string } = await response.json();
      router.push("/learn/attempts/" + data.id);
    } catch { setError("Дасгалыг нээж чадсангүй. Дахин оролдоно уу."); }
    finally { busy.current = false; setPending(false); }
  }
  return <div><button className="button" disabled={pending} onClick={start}>{pending ? "Нээж байна…" : label ?? "Дасгал эхлэх / үргэлжлүүлэх →"}</button>{error ? <p role="alert" className="error-message">{error}</p> : null}</div>;
}

