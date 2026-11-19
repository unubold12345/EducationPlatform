"use client";
import { useState } from "react";
import { Modal } from "@/modules/vocabulary/modal";
import styles from "./end-mock.module.css";

export type SkipMode = "stage" | "finish";

/**
 * Admin testing controls on a timed sitting (owner request 2026-11-19): close the current part now, or close every
 * remaining part and open the result. Shown only to admins; the server checks admin membership again on every call
 * (`skipMock`). `onSkip` saves the open page's answers with the request and loads what the server returns.
 */
export function AdminSkip({ attemptId, last, onSkip, className }: { attemptId: string; last: boolean; onSkip: (mode: SkipMode) => Promise<void>; className?: string }) {
  const [mode, setMode] = useState<SkipMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = "admin-skip-" + attemptId;

  async function confirm() {
    if (!mode) return;
    setBusy(true); setError("");
    try { await onSkip(mode); setMode(null); }
    catch (reason) { setError(reason instanceof Error && reason.message ? reason.message : "Алгасаж чадсангүй. Дахин оролдоно уу."); }
    finally { setBusy(false); }
  }

  return <span className={styles.skip} data-admin-skip="">
    {last ? null : <button type="button" className={className} onClick={() => { setError(""); setMode("stage"); }}>Дараагийн хэсэг →</button>}
    <button type="button" className={className} onClick={() => { setError(""); setMode("finish"); }}>Дуусгаж дүн харах</button>
    {mode ? <Modal labelledBy={heading} onClose={() => setMode(null)} busy={busy} size="confirm">
      <section className={styles.panel}>
        <h2 id={heading}>{mode === "stage" ? "Энэ хэсгийг алгасах уу?" : "Шалгалтыг дуусгаж дүнг харах уу?"}</h2>
        <p>{mode === "stage" ? "Одоогийн хэсэг одоо хаагдаж, дараагийн хэсэг бүтэн хугацаатай эхэлнэ. Хаагдсан хэсэг рүү буцахгүй." : "Үлдсэн бүх хэсэг одоо хаагдаж, оноо тооцогдоно."} Хариу хадгалагдана. Админы туршилтын үйлдэл: үр дүнд «Админ алгассан» гэж тэмдэглэгдэж, админы түүхэнд бичигдэнэ.</p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <button type="button" className="button secondary" onClick={() => setMode(null)} disabled={busy} data-autofocus="">Болих</button>
          <button type="button" className="button" onClick={() => void confirm()} disabled={busy}>{busy ? "Хаагдаж байна…" : mode === "stage" ? "Тийм, алгасах" : "Тийм, дуусгах"}</button>
        </div>
      </section>
    </Modal> : null}
  </span>;
}

/** Sends the skip with the open stage's answers (the same body as an autosave) and returns the sitting or throws. */
export async function requestSkip<T>(endpoint: string, mode: SkipMode, body: { revision: number; stageId: string; responses: Record<string, string>; flags: string[] }): Promise<T> {
  const response = await fetch(endpoint + "/skip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, ...body }), signal: AbortSignal.timeout(20000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Алгасаж чадсангүй. Дахин оролдоно уу.");
  return data as T;
}

/** On a result: which parts an admin closed early, so a skipped sitting is never read as a real score. */
export function SkippedNotice({ stages, className = "container" }: { stages?: string[]; className?: string }) {
  if (!stages?.length) return null;
  return <div className={className + " " + styles.skipped} role="note"><strong>Админ алгассан</strong> · Эрт хаагдсан хэсэг: {stages.join(", ")}. Туршилтын оролдлого, бодит дүн биш.</div>;
}
