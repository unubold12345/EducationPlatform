"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { creditCost } from "@/modules/credits/pricing";
import { Modal } from "@/modules/vocabulary/modal";
import { ProcessingOverlay } from "@/modules/workspace/processing";
import { ExpertReport } from "@/modules/writing-lab/expert-client";
import { expertSpentMessage, type EssayReviewKind, type ExpertQuota, type SavedExpertReview } from "@/modules/writing-lab/expert";
import styles from "./grade.module.css";

type Saved = SavedExpertReview & { questionId: string };
type Data = { enabled: boolean; quota: ExpertQuota | null; reviews: Saved[]; items: { id: string; label: string; words: number }[]; minWords: Record<EssayReviewKind, number> };
// Students see the kind of review, never the provider or model name (owner rule 2026-11-18).
const KIND: Record<EssayReviewKind, string> = { strong: "Бүрэн үнэлгээ", expert: "Шинжээчийн үнэлгээ" };
const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", month: "2-digit", day: "2-digit" });

/**
 * The detailed reviews under a finished IELTS mock's grade (owner 2026-11-18): the automatic grade is scores and a short
 * note, and each essay can be sent to the Essay Studio's reviews, at the studio's price: "Бүрэн үнэлгээ" for credits,
 * "Шинжээчийн үнэлгээ" from the plan's monthly reviews. The server reads the essay from the attempt and decides the price.
 */
export function MockEssayReviews({ attemptId }: { attemptId: string }) {
  const endpoint = "/api/mock-attempts/" + attemptId + "/essay-review";
  const { apply } = useCredits();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<EssayReviewKind | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Saved | null>(null);

  useEffect(() => {
    let stop = false;
    fetch(endpoint, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(body => { if (!stop && body) setData(body); })
      .catch(() => { /* The grade above still shows; the reviews are optional. */ });
    return () => { stop = true; };
  }, [endpoint]);

  if (!data?.enabled || !data.items.length) return null;
  const quota = data.quota;
  const noPlan = !!quota && quota.plan === null && quota.limit === 0;
  const spent = !!quota && quota.remaining <= 0;

  async function review(questionId: string, label: string, kind: EssayReviewKind) {
    if (busy) return;
    const ask = kind === "strong" ? `${label}-ийн бүрэн үнэлгээнд ${creditCost("writing-review")} кредит зарцуулна. Үргэлжлүүлэх үү?`
      : `${label}-ийн шинжээчийн үнэлгээнд багцын 1 үнэлгээ зарцуулна (${Math.max(0, (quota?.remaining ?? 1) - 1)} үлдэнэ). Үргэлжлүүлэх үү?`;
    if (!window.confirm(ask)) return;
    setBusy(kind); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId, kind }), signal: AbortSignal.timeout(295_000) });
      const body = await response.json().catch(() => null);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok || !body?.review) throw new Error(typeof body?.error === "string" ? body.error : "Үнэлгээ хийж чадсангүй. Дахин оролдоно уу.");
      apply(body);
      const saved: Saved = { ...body.review, questionId };
      setData(current => current && { ...current, quota: body.quota ?? current.quota, reviews: [saved, ...current.reviews.filter(entry => entry.id !== saved.id)] });
      setOpen(saved);
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" && reason.name !== "AbortError" ? reason.message : "Үнэлгээ хэт удлаа. Хуудсаа дахин ачаалж шалгана уу.");
    } finally { setBusy(null); }
  }

  return <section className={styles.reviews} aria-labelledby="essay-review-title">
    <ProcessingOverlay open={busy !== null} title={busy === "expert" ? "Шинжээч бичвэрийг уншиж байна…" : "Бичвэрийг нарийвчлан үнэлж байна…"}
      detail="Шалгуур бүрийн тайлбар, догол мөрийн зөвлөгөө, засвар, жишээ хариулт бичиж байна. 1–3 минут орно." />
    <h3 id="essay-review-title">Writing-ийн дэлгэрэнгүй тайлан</h3>
    <p className={styles.lead}>Дээрх нь зөвхөн оноо, товч тайлбар. Шалгуур бүрийн тайлбар, догол мөрийн зөвлөгөө, засвар, band 8+ жишээ хариултыг Бичгийн студийн тайлангаар аваарай.</p>
    {error ? <p className={styles.failed} role="alert">{error}</p> : null}
    <ul className={styles.essays}>{data.items.map(item => {
      const strongShort = item.words < data.minWords.strong, expertShort = item.words < data.minWords.expert;
      const saved = data.reviews.filter(entry => entry.questionId === item.id);
      return <li key={item.id}>
        <div className={styles.essayHead}><strong>{item.label}</strong><span>{item.words} үг</span></div>
        <div className={styles.essayActions}>
          <button type="button" className="button secondary" disabled={!!busy || strongShort} onClick={() => void review(item.id, item.label, "strong")}
            title={strongShort ? `Дор хаяж ${data.minWords.strong} үг хэрэгтэй` : undefined}>Бүрэн үнэлгээ <CreditCost action="writing-review" compact /></button>
          {noPlan ? <Link className="button secondary" href="/workspace/plans">Шинжээчийн үнэлгээ · Basic, Pro багцад</Link>
            : <button type="button" className="button" disabled={!!busy || expertShort || spent || !quota} onClick={() => void review(item.id, item.label, "expert")}
              title={expertShort ? `Дор хаяж ${data.minWords.expert} үг хэрэгтэй` : undefined}>Шинжээчийн үнэлгээ{quota ? <small> · {quota.remaining}/{quota.limit} үлдсэн</small> : null}</button>}
        </div>
        {strongShort ? <p className={styles.fine}>Дэлгэрэнгүй тайланд дор хаяж {data.minWords.strong} үг хэрэгтэй.</p>
          : expertShort && !noPlan ? <p className={styles.fine}>Шинжээчийн үнэлгээнд дор хаяж {data.minWords.expert} үг хэрэгтэй.</p> : null}
        {saved.length ? <ul className={styles.saved} aria-label={`${item.label} · хадгалсан тайлан`}>{saved.map(entry => <li key={entry.id}>
          <button type="button" onClick={() => setOpen(entry)}><strong>{entry.overall.toFixed(1)}</strong><span>{KIND[entry.kind]} · {DAY.format(new Date(entry.createdAt)).replace("-", ".")}</span><em>Нээх →</em></button>
        </li>)}</ul> : null}
      </li>;
    })}</ul>
    {quota && spent && !noPlan ? <p className={styles.fine} role="status">{expertSpentMessage(quota)}</p> : null}
    <p className={styles.fine}>Тайлан таны Бичгийн студид мөн хадгалагдана. Алдаа, хугацаа хэтэрсэн тохиолдолд кредит, үнэлгээ хасагдахгүй.</p>
    {open ? <Modal labelledBy="essay-report-title" onClose={() => setOpen(null)}>
      <div className={styles.reportModal}><h2 id="essay-report-title" className={styles.hidden}>{KIND[open.kind]} · {open.title}</h2><ExpertReport saved={open} onClose={() => setOpen(null)} /></div>
    </Modal> : null}
  </section>;
}
