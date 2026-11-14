"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import { useCredits } from "@/modules/credits/client";
import { VOCABULARY_SPACE, type VocabularySpace } from "./contracts";
import { failure, sendJson, VOCABULARY_API } from "./api";
import { Modal } from "./modal";
import styles from "./vocabulary.module.css";

const number = (value: number) => value.toLocaleString("en-US");
const newRequestId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);

/**
 * Permanent vocabulary space bought with purchased ("yellow") credits only (owner rule 2026-11-13): 100 words for
 * 200 credits, kept after a plan ends. The server checks the yellow balance and the cap, and a retried purchase
 * (same request id) buys once. It opens as a modal over the vocabulary page.
 */
export function SpacePanel({ space, onBought, onClose }: { space: VocabularySpace; onBought: (next: VocabularySpace, words: number) => void; onClose: () => void }) {
  const { spendYellow } = useCredits();
  const most = Math.min(VOCABULARY_SPACE.maxPacks, Math.floor(space.room / VOCABULARY_SPACE.words));
  const affordable = Math.min(most, Math.floor(space.yellow / VOCABULARY_SPACE.credits));
  const [packs, setPacks] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // One id per intended purchase: a retry after a lost reply reuses it, so the server buys once.
  const requestId = useRef(newRequestId());
  const words = packs * VOCABULARY_SPACE.words, credits = packs * VOCABULARY_SPACE.credits;
  const short = credits > space.yellow;

  async function buy() {
    if (busy || short || packs < 1 || packs > most) return;
    setBusy(true); setError("");
    try {
      const data = await sendJson<VocabularySpace & { added: number; spent: number; repeated: boolean }>(`${VOCABULARY_API}/space`, { packs, requestId: requestId.current });
      requestId.current = newRequestId();
      if (data.spent) spendYellow(data.spent);
      onBought({ limit: data.limit, base: data.base, extra: data.extra, yellow: data.yellow, room: data.room }, data.added);
    } catch (reason) {
      setError(failure(reason, "Багтаамж нэмж чадсангүй. Дахин оролдоно уу; давтан төлөхгүй."));
    } finally { setBusy(false); }
  }

  return <Modal labelledBy="voc-space-heading" onClose={onClose} busy={busy} size="narrow"><section className={`${styles.panel} ${styles.spacePanel}`} aria-labelledby="voc-space-heading" data-panel="space">
    <div className={styles.panelHead}>
      <span className={`${styles.panelIcon} ${styles.yellowIcon}`} aria-hidden="true"><Icon name="bolt" size={19} /></span>
      <div><h2 id="voc-space-heading">Байнгын багтаамж нэмэх</h2><p>{number(VOCABULARY_SPACE.words)} үг = {number(VOCABULARY_SPACE.credits)} кредит. Зөвхөн худалдаж авсан кредитээр авна; багц дууссан ч хэвээр үлдэнэ.</p></div>
      <button type="button" className={styles.rowAction} onClick={onClose} aria-label="Хаах" title="Хаах" disabled={busy}><Icon name="close" size={18} /></button>
    </div>
    <dl className={styles.spaceFacts}>
      <div><dt>Одоогийн багтаамж</dt><dd>{number(space.limit)} үг</dd></div>
      <div><dt>Үүнээс байнгын</dt><dd>+{number(space.extra)}</dd></div>
      <div><dt>Кредит</dt><dd className={styles.yellowText}>{number(space.yellow)}</dd></div>
    </dl>
    {most < 1 ? <p className={styles.fine}>Байнгын багтаамжийн дээд хэмжээнд хүрсэн байна.</p> : <div className={styles.form}>
      <label className={styles.field}><span>Хэдэн {number(VOCABULARY_SPACE.words)} үг нэмэх вэ</span>
        <input type="number" min={1} max={most} step={1} value={packs} disabled={busy}
          onChange={event => { const next = Math.round(Number(event.target.value)); setPacks(Number.isFinite(next) ? Math.min(most, Math.max(1, next)) : 1); }} />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.formFoot}>
        <p className={styles.fine}>+{number(words)} үг · {number(credits)} кредит{short ? <> · <strong>хүрэлцэхгүй</strong> (танд {number(space.yellow)})</> : null}.{affordable < 1 ? <> <Link href="/workspace/plans#credits">Кредит авах</Link></> : null}</p>
        <button type="button" className={styles.primary} onClick={buy} disabled={busy || short} aria-busy={busy}>
          {busy ? <><i className={styles.spinner} aria-hidden="true" />Нэмж байна…</> : <><Icon name="plus" size={17} />{number(words)} үг нэмэх</>}
        </button>
      </div>
    </div>}
  </section></Modal>;
}
