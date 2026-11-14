"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./processing.module.css";

const clock = (seconds: number) => Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");

/** How long the wait has lasted. Mounted only while the screen is open, so every wait starts from 0:00. */
function Elapsed() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <p className={styles.clock} aria-hidden="true">{clock(seconds)}</p>;
}

/**
 * A whole-page "working" screen for a request the student has to wait for (owner request 2026-11-15: while an
 * exam or reading questions are being made, nothing else on the page can be used). It is a modal `<dialog>`, so
 * it sits above the rail and the header, everything behind it is inert, and focus cannot leave it; Escape and
 * a click outside do nothing, and the page cannot scroll under it. It has no close control on purpose: the
 * caller opens it with `open` and must clear `open` when the request ends, fails or times out, which gives the
 * page back. Leaving or reloading while it is open asks first. Presentation only: it changes no request.
 */
export function ProcessingOverlay({ open, title, detail }: { open: boolean; title: string; detail?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const wanted = useRef(open);
  useEffect(() => { wanted.current = open; });

  // Open and close with `open`. The effect undoes everything it did, so a remount (React StrictMode on
  // `next dev`) simply opens the screen again; nothing depends on a close event having fired.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    // A reload or a closed tab does not stop the server: the work finishes and is charged once. Ask before leaving.
    const leaving = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", leaving);
    return () => {
      window.removeEventListener("beforeunload", leaving);
      root.style.overflow = overflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return <dialog ref={ref} className={styles.screen} aria-labelledby="wsp-processing-title" aria-describedby="wsp-processing-detail" aria-busy={open}
    data-processing=""
    // Chrome honours `closedby`; the handlers below cover every other way a dialog can be asked to close.
    {...{ closedby: "none" }}
    // React lets a dialog's cancel and close events bubble. Inside another modal (the vocabulary file scan) they
    // would reach that modal's own handlers and close it too, so both stop here.
    onCancel={event => { event.preventDefault(); event.stopPropagation(); }}
    onKeyDown={event => { if (event.key === "Escape") event.preventDefault(); }}
    // A browser may still close it on a repeated Escape; while the work runs it comes straight back.
    onClose={event => { event.stopPropagation(); if (wanted.current && ref.current && !ref.current.open) ref.current.showModal(); }}>
    {/* The one Tab stop: the page behind is inert, so the keyboard stays here or in the browser's own controls. */}
    <div className={styles.card} tabIndex={0}>
      <div className={styles.mark} aria-hidden="true"><i /><i /><i /></div>
      <h2 id="wsp-processing-title" className={styles.title}>{title}</h2>
      <p id="wsp-processing-detail" className={styles.detail} role="status">{detail}</p>
      <div className={styles.track} aria-hidden="true"><b /></div>
      {open ? <Elapsed /> : null}
    </div>
  </dialog>;
}
