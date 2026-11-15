"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Icon } from "@/modules/workspace/icons";
import { badgeText, timeAgo, type NotificationItem } from "./rules";

const PANEL_ID = "wsp-notify";
const REFRESH_MS = 60_000;

type Inbox = {
  items: NotificationItem[] | null; unread: number; failed: boolean;
  load: () => void; read: (ids: string[]) => void; readAll: () => void;
};

function parseInbox(value: unknown): { items: NotificationItem[]; unread: number } | null {
  if (!value || typeof value !== "object") return null;
  const { items, unread } = value as { items?: unknown; unread?: unknown };
  return Array.isArray(items) && typeof unread === "number" ? { items: items as NotificationItem[], unread } : null;
}

/**
 * The signed-in student's inbox as the Workspace shell knows it. `initialUnread` comes from the server render;
 * the list is read once the shell is on the page, again when the server figure changes (a purchase refreshes
 * the layout) and when the tab regains focus after a minute.
 */
export function useInbox(initialUnread: number, enabled: boolean): Inbox {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [failed, setFailed] = useState(false);
  const [seen, setSeen] = useState(initialUnread);
  if (seen !== initialUnread) { setSeen(initialUnread); setUnread(initialUnread); }
  const loadedAt = useRef(0);
  const request = useRef(0);

  const load = useCallback(() => {
    const mine = ++request.current;
    loadedAt.current = Date.now();
    void (async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        const inbox = response.ok ? parseInbox(await response.json()) : null;
        if (mine !== request.current) return;
        if (!inbox) { setFailed(true); return; }
        setItems(inbox.items); setUnread(inbox.unread); setFailed(false);
      } catch { if (mine === request.current) setFailed(true); }
    })();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    const refresh = () => { if (document.visibilityState === "visible" && Date.now() - loadedAt.current > REFRESH_MS) load(); };
    addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [enabled, load, initialUnread]);

  // Shown as read at once; the server's count replaces the local one when it answers.
  const send = useCallback((body: object) => {
    const mine = ++request.current;
    void (async () => {
      try {
        const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result: unknown = response.ok ? await response.json() : null;
        const count = result && typeof result === "object" ? (result as { unread?: unknown }).unread : null;
        if (mine === request.current && typeof count === "number") setUnread(count);
      } catch { /* The next inbox read shows what the server kept. */ }
    })();
  }, []);
  const read = useCallback((ids: string[]) => {
    const fresh = (items ?? []).filter(item => !item.read && ids.includes(item.id)).map(item => item.id);
    if (!fresh.length) return;
    setItems(current => current && current.map(item => fresh.includes(item.id) ? { ...item, read: true } : item));
    setUnread(current => Math.max(0, current - fresh.length));
    send({ action: "read", ids: fresh });
  }, [items, send]);
  const readAll = useCallback(() => {
    setItems(current => current && current.map(item => item.read ? item : { ...item, read: true }));
    setUnread(0);
    send({ action: "read-all" });
  }, [send]);

  return { items, unread, failed, load, read, readAll };
}

/** The rail row that opens the inbox. */
export function NotifyRailButton({ unread, open, onClick, buttonRef }: { unread: number; open: boolean; onClick: () => void; buttonRef: RefObject<HTMLButtonElement | null> }) {
  const badge = badgeText(unread);
  return <button ref={buttonRef} type="button" className="wsp-nav-item wsp-notify-row" aria-haspopup="dialog" aria-expanded={open} aria-controls={PANEL_ID} title="Мэдэгдэл" onClick={onClick}>
    <Icon name="bell" /><span>Мэдэгдэл</span>
    {badge ? <em className="wsp-notify-count" aria-label={`${unread} уншаагүй`}>{badge}</em> : null}
  </button>;
}

/** The same control for the phone top bar. */
export function NotifyTopButton({ unread, open, onClick, buttonRef }: { unread: number; open: boolean; onClick: () => void; buttonRef: RefObject<HTMLButtonElement | null> }) {
  const badge = badgeText(unread);
  return <button ref={buttonRef} type="button" className="wsp-icon-button wsp-notify-top" aria-haspopup="dialog" aria-expanded={open} aria-controls={PANEL_ID} onClick={onClick}>
    <Icon name="bell" /><span className="sr-only">Мэдэгдэл{badge ? `, ${unread} уншаагүй` : ""}</span>
    {badge ? <em className="wsp-notify-count" aria-hidden="true">{badge}</em> : null}
  </button>;
}

/** The inbox itself: beside the rail on desktop, a sheet at the bottom of the screen on phones. */
export function NotifyPanel({ inbox, onClose, openers }: { inbox: Inbox; onClose: (restoreFocus: boolean) => void; openers: RefObject<HTMLButtonElement | null>[] }) {
  const panel = useRef<HTMLElement>(null);
  const [now] = useState(() => Date.now());
  const { items, unread, failed, load, read, readAll } = inbox;

  useEffect(() => {
    panel.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(true); };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || panel.current?.contains(target) || openers.some(opener => opener.current?.contains(target))) return;
      onClose(false);
    };
    addEventListener("keydown", key);
    addEventListener("pointerdown", outside);
    return () => { removeEventListener("keydown", key); removeEventListener("pointerdown", outside); };
  }, [onClose, openers]);

  return <section ref={panel} id={PANEL_ID} className="wsp-notify" role="dialog" aria-label="Мэдэгдэл" tabIndex={-1}>
    <header className="wsp-notify-head">
      <h2>Мэдэгдэл</h2>
      {unread ? <button type="button" className="wsp-notify-all" onClick={readAll}>Бүгдийг уншсан</button> : null}
      <button type="button" className="wsp-icon-button" onClick={() => onClose(true)} aria-label="Хаах"><Icon name="close" size={18} /></button>
    </header>
    {items?.length ? <ul className="wsp-notify-list">{items.map(item => {
      const content = <>
        <i className="wsp-notify-dot" aria-hidden="true" />
        <span className="wsp-notify-text"><strong>{item.title}</strong><span>{item.body}</span><small>{timeAgo(item.createdAt, now)}</small>{item.read ? null : <span className="sr-only">Уншаагүй</span>}</span>
      </>;
      return <li key={item.id} data-unread={item.read ? undefined : ""}>
        {item.href
          ? <Link href={item.href} onClick={() => { read([item.id]); onClose(false); }}>{content}</Link>
          : <button type="button" onClick={() => read([item.id])}>{content}</button>}
      </li>;
    })}</ul>
      : <p className="wsp-notify-empty" role="status">
        {failed ? <>Мэдэгдлийг уншиж чадсангүй. <button type="button" onClick={load}>Дахин оролдох</button></> : items ? "Мэдэгдэл алга." : "Уншиж байна…"}
      </p>}
  </section>;
}
