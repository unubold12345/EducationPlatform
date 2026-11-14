"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./vocabulary.module.css";

const SIZE = { wide: styles.modal, narrow: `${styles.modal} ${styles.modalNarrow}`, confirm: `${styles.modal} ${styles.modalConfirm}` };

/**
 * A modal on `<dialog>.showModal()` (owner request 2026-11-15): the page behind is inert, focus stays inside, and
 * Escape or a click on the backdrop closes it, except while `busy` (a scan, a purchase or a save is running). It is
 * open while mounted, so callers render it only when it should show. `[data-autofocus]` inside gets the first focus.
 */
export function Modal({ labelledBy, onClose, busy = false, size = "wide", alert = false, children }: {
  labelledBy: string; onClose: () => void; busy?: boolean; size?: keyof typeof SIZE; alert?: boolean; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const latest = useRef({ busy, onClose });
  const live = useRef(false);
  const pressed = useRef(false);
  useEffect(() => { latest.current = { busy, onClose }; });
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    live.current = true;
    if (!element.open) element.showModal();
    element.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => { live.current = false; if (element.open) element.close(); };
  }, []);
  const close = () => { if (!latest.current.busy) latest.current.onClose(); };

  return <dialog ref={dialog} className={SIZE[size]} data-modal="" role={alert ? "alertdialog" : undefined} aria-labelledby={labelledBy}
    onCancel={event => { event.preventDefault(); close(); }}
    // A browser may still close it (a second Escape with no click between): the page follows instead of keeping a hidden modal.
    onClose={() => { if (live.current) latest.current.onClose(); }}
    // Only a press that starts and ends on the backdrop closes it, so selecting text inside never does.
    onMouseDown={event => { pressed.current = event.target === event.currentTarget; }}
    onClick={event => { if (pressed.current && event.target === event.currentTarget) close(); pressed.current = false; }}>
    {children}
  </dialog>;
}

export type ConfirmChoice = { value: string; label: string; tone?: "danger" | "soft" };
/** What a delete (or another step that cannot be undone) asks before it runs. */
export type ConfirmRequest = { title: string; text?: string; choices: ConfirmChoice[]; cancel?: string };
/** Opens a confirm modal and resolves with the chosen value, or null when it was cancelled. */
export type Confirm = (request: ConfirmRequest) => Promise<string | null>;

export function ConfirmModal({ request, onAnswer }: { request: ConfirmRequest; onAnswer: (value: string | null) => void }) {
  return <Modal labelledBy="voc-confirm-heading" onClose={() => onAnswer(null)} size="confirm" alert>
    <section className={`${styles.panel} ${styles.confirm}`} data-panel="confirm">
      <h2 id="voc-confirm-heading">{request.title}</h2>
      {request.text ? <p>{request.text}</p> : null}
      <div className={styles.confirmActions}>
        <button type="button" className={styles.ghost} onClick={() => onAnswer(null)} data-autofocus="">{request.cancel ?? "Болих"}</button>
        {request.choices.map(choice => <button key={choice.value} type="button" onClick={() => onAnswer(choice.value)}
          className={choice.tone === "danger" ? `${styles.primary} ${styles.dangerPrimary}` : choice.tone === "soft" ? `${styles.ghost} ${styles.dangerGhost}` : styles.primary}>{choice.label}</button>)}
      </div>
    </section>
  </Modal>;
}
