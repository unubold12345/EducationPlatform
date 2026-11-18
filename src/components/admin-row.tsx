"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * One line of an admin settings list: read-only cells, then a button that opens the editor inside the row,
 * so a page of settings stays one short table instead of a stack of forms.
 */
export function AdminRow({ className = "", data, cells, open, onToggle, children }: {
  className?: string;
  data?: Record<`data-${string}`, string | undefined>;
  cells: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return <li className={"admin-row " + className} data-open={open ? "" : undefined} {...data}>
    <div className="admin-row-main">
      {cells}
      <button type="button" className="admin-small-button" aria-expanded={open} onClick={onToggle}>{open ? "Хаах" : "Засах"}</button>
    </div>
    {open && children}
  </li>;
}

/** A select that opens the chosen view; used where a row of tabs would grow without limit (months). */
export function AdminPicker({ label, value, options }: { label: string; value: string; options: readonly (readonly [value: string, label: string, href: string])[] }) {
  const router = useRouter();
  return <label className="admin-picker">
    <span>{label}</span>
    <select value={value} onChange={event => { const next = options.find(([key]) => key === event.target.value); if (next) router.push(next[2]); }}>
      {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </label>;
}
