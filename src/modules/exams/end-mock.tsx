"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/modules/vocabulary/modal";
import styles from "./end-mock.module.css";

/**
 * Stops an open timed sitting (owner request 2026-11-18): the exam screen and the reviews page both offer it. The
 * server discards the sitting (no result, no review); if its time had already run out it keeps the result instead,
 * and the page opens it. The confirm says plainly that nothing is kept.
 */
export function EndMockButton({ attemptId, title, className, label = "Шалгалтыг зогсоох", onEnding, onFailed }: {
  attemptId: string; title: string; className?: string; label?: string;
  /** The exam screen pauses its autosave while the request runs. */
  onEnding?: () => void;
  /** The stop did not go through: the exam carries on. */
  onFailed?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = "end-mock-" + attemptId;

  async function end() {
    setBusy(true); setError(""); onEnding?.();
    try {
      const response = await fetch("/api/mock-attempts/" + attemptId + "/end", { method: "POST", signal: AbortSignal.timeout(20000) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.status) throw new Error(typeof body?.error === "string" ? body.error : "Шалгалтыг зогсоож чадсангүй. Дахин оролдоно уу.");
      // Time had already run out: the result is saved, so open it (a reload when the exam screen is that page). Otherwise
      // back to the list, replacing this entry so Back does not reopen the stopped sitting.
      const result = "/exams/attempts/" + attemptId;
      if (body.status !== "finished") router.replace("/workspace/review?ended=1");
      else if (window.location.pathname === result) window.location.reload();
      else router.push(result);
    } catch (reason) {
      setBusy(false); onFailed?.();
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Холболт тасарлаа. Дахин оролдоно уу.");
    }
  }

  return <>
    <button type="button" className={className} onClick={() => { setError(""); setOpen(true); }}>{label}</button>
    {open ? <Modal labelledBy={heading} onClose={() => setOpen(false)} busy={busy} size="confirm" alert>
      <section className={styles.panel}>
        <h2 id={heading}>Шалгалтыг зогсоох уу?</h2>
        <p><strong>{title}</strong></p>
        <p>Зогсоовол энэ удаагийн хариу, оноо хадгалагдахгүй, «Миний үр дүн»-д харагдахгүй. Дахин эхлүүлбэл шинээр, бүтэн хугацаатай эхэлнэ.</p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <button type="button" className="button secondary" onClick={() => setOpen(false)} disabled={busy} data-autofocus="">Үргэлжлүүлэх</button>
          <button type="button" className={"button " + styles.danger} onClick={() => void end()} disabled={busy}>{busy ? "Зогсоож байна…" : "Тийм, зогсоох"}</button>
        </div>
      </section>
    </Modal> : null}
  </>;
}
