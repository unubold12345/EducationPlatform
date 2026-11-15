"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./print-sheet.css";

/**
 * A paper version of something on the page, saved as a PDF through the browser's own print dialog.
 * `print()` mounts the sheet; `<PrintSheet>` then opens the dialog once the sheet is laid out.
 */
export function usePrintSheet() {
  // Each request gets a new number: a browser that never reports the dialog closed still opens it again on the
  // next click, and a late "closed" from an earlier dialog cannot close a newer one.
  const [state, setState] = useState({ job: 0, open: false });
  const print = useCallback(() => setState(value => ({ job: value.job + 1, open: true })), []);
  const done = useCallback((job: number) => setState(value => value.job === job ? { job, open: false } : value), []);
  return { printing: state.open, job: state.job, print, done };
}

/**
 * The sheet lives at the end of <body>, hidden on screen; while it is mounted, printing shows it and nothing else.
 * `title` becomes the document title for the dialog, which browsers offer as the PDF's file name.
 */
export function PrintSheet({ title, job, onDone, children }: { title: string; job: number; onDone: (job: number) => void; children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const before = document.title;
    let cancelled = false, opened = false;
    root.dataset.printing = "";
    document.title = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || before;
    const finish = () => { if (opened && !cancelled) onDone(job); };
    addEventListener("afterprint", finish);
    // Fonts and the formulas' layout first, so the first page is not measured with fallback glyphs.
    void (document.fonts?.ready ?? Promise.resolve()).catch(() => undefined).then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (cancelled) return;
      opened = true;
      window.print();
    })));
    return () => {
      cancelled = true;
      removeEventListener("afterprint", finish);
      delete root.dataset.printing;
      document.title = before;
    };
  }, [title, job, onDone]);
  return createPortal(<div className="print-sheet" data-print-sheet="">{children}</div>, document.body);
}
