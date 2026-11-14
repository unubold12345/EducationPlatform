"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** A Гадаад хэл plan month as the briefing page shows it; `end` is when the month's picks renew. */
export type PickState = { kind: "pickable" | "full"; used: number; limit: number; end: string };

/**
 * "12-р сарын 13": the Ulaanbaatar calendar day of an instant, written out by hand. Browsers lack Mongolian date data,
 * so Intl "mn-MN" falls back to English in the page while the server writes Mongolian, which breaks hydration.
 */
export function ubMonthDay(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const day = new Date(ms + 8 * 3600_000);
  return `${day.getUTCMonth() + 1}-р сарын ${day.getUTCDate()}`;
}
const day = ubMonthDay;

/**
 * The Гадаад хэл plan's monthly pick on a mock's briefing. Picking uses one of the plan month's picks and opens the
 * timed sitting (retakes too) and practice mode until the month ends; the server counts the picks and decides.
 */
export function MockPick({ slug, state, checkoutHref }: { slug: string; state: PickState; checkoutHref: string }) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const left = Math.max(0, state.limit - state.used);
  async function pick() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/mock-picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), signal: AbortSignal.timeout(15000) });
      if (response.status === 401) { router.push("/login?next=" + encodeURIComponent("/exams/" + slug)); return; }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(typeof data.error === "string" ? data.error : "");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : "Сонгож чадсангүй. Холболтоо шалгаад дахин оролдоно уу.");
    } finally { busy.current = false; setPending(false); }
  }
  if (state.kind === "full") return <section className="exam-preflight exam-purchase-gate mock-pick" data-pick="full">
    <span className="status">ГАДААД ХЭЛ БАГЦ · {state.used}/{state.limit}</span>
    <h2>Энэ сарын сонголт дууссан.</h2>
    <p>Энэ сард {state.limit} mock сонгосон байна. {day(state.end)}-нд шинэ сар эхэлж, дахин {state.limit} mock сонгоно. Сонгосон mock-уудаа тэр болтол хэдэн ч удаа өгч, дадлага хийж болно.</p>
    <button className="button secondary" type="button" onClick={() => router.push(checkoutHref)}>Энэ шалгалтыг тусад нь авах →</button>
  </section>;
  return <section className="exam-preflight mock-pick" data-pick="open">
    <span className="status access-unlocked">ГАДААД ХЭЛ БАГЦ · ЭНЭ САР {left} СОНГОЛТ ҮЛДСЭН</span>
    <h2>Энэ mock-ийг сонгох</h2>
    <p>Сонгосон mock-оо {day(state.end)} хүртэл хэдэн ч удаа өгч, цаггүй дадлагын горимд ажиллана. Нэг сонголт ашиглана ({state.used}/{state.limit}).</p>
    {error ? <p className="error-message" role="alert">{error}</p> : null}
    <button className="button" type="button" disabled={pending} onClick={pick}>{pending ? "Сонгож байна…" : "Сонгох →"}</button>
  </section>;
}
