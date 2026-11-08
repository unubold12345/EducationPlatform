"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { Icon, type IconName } from "@/modules/workspace/icons";
import type { AdminTab } from "./ui";

const RAIL_KEY = "education-workspace-rail";

// One icon per admin section, using the Workspace icon set so the rail feels native.
const adminIcon: Record<AdminTab, IconName> = {
  overview: "home",
  users: "users",
  attempts: "exam",
  subscriptions: "repeat",
  payments: "card",
  pricing: "tag",
  content: "pen",
  audit: "clock",
  settings: "settings",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

type AdminNavGroup = { label: string; tabs: readonly AdminTab[] };

/** The admin frame: the same rail, drawer and top bar as the Workspace, with admin sections. */
export function AdminWorkspaceShell({
  tab, title, name, fontClass, testData = false, tabs, groups, actions, scope, description, children,
}: {
  tab: AdminTab;
  title: string;
  name: string;
  fontClass: string;
  testData?: boolean;
  tabs: readonly (readonly [AdminTab, string])[];
  groups: readonly AdminNavGroup[];
  actions?: ReactNode;
  scope?: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const side = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const labelFor = (key: AdminTab) => tabs.find(([id]) => id === key)?.[1] ?? key;

  // Close the phone menu whenever the route or the active admin tab changes.
  const key = pathname + "?" + tab;
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) { setLastKey(key); setOpen(false); }

  useEffect(() => {
    if (!open) return;
    (side.current?.querySelector<HTMLElement>("a[aria-current='page']") ?? side.current?.querySelector<HTMLElement>("a"))?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [open]);

  const navLink = (key: AdminTab) => {
    const label = labelFor(key);
    return <Link key={key} href={"/admin?tab=" + key + (testData ? "&data=test" : "")} className="wsp-nav-item" aria-current={tab === key ? "page" : undefined} title={label} onClick={() => setOpen(false)}>
      <Icon name={adminIcon[key]} /><span>{label}</span>
    </Link>;
  };

  return <div className={"wsp ws admin-page " + fontClass} data-open={open ? "" : undefined}>
    <aside ref={side} className="wsp-side" id="wsp-side" aria-label="Админ">
      <div className="wsp-side-head">
        <Link href="/admin" className="wsp-logo" aria-label="Админ нүүр"><span className="wsp-logo-mark" aria-hidden="true">e<span>·</span></span><span className="wsp-logo-word"><h1>Удирдлагын төв</h1><small>Education</small></span></Link>
        <RailToggle />
        <button type="button" className="wsp-icon-button wsp-drawer-close" onClick={() => { setOpen(false); menuButton.current?.focus(); }} aria-label="Цэс хаах"><Icon name="close" /></button>
      </div>
      <nav className="wsp-nav" aria-label="Админ цэс">
        {groups.map(group => <div className="admin-nav-section" key={group.label || "overview"}>
          {group.label ? <p className="admin-nav-caption">{group.label}</p> : null}
          {group.tabs.map(navLink)}
        </div>)}
      </nav>
      <div className="wsp-side-foot">
        <div className="wsp-side-links">
          <Link href="/" title="Үндсэн сайт"><Icon name="site" size={18} /><span>Үндсэн сайт</span></Link>
          <Link href="/workspace" title="Workspace"><Icon name="home" size={18} /><span>Workspace</span></Link>
          <SignOutButton />
        </div>
        <div className="wsp-account-row">
          <Link className="wsp-account" href="/workspace/profile" title={name}><span className="wsp-avatar" aria-hidden="true">{initials(name)}</span><span className="wsp-account-text"><strong>{name}</strong><small>Админ</small></span></Link>
          <ThemeToggle />
        </div>
      </div>
    </aside>
    <button type="button" className="wsp-scrim" aria-label="Цэс хаах" tabIndex={-1} onClick={() => setOpen(false)} />
    <div className="wsp-body">
      <header className="wsp-topbar">
        <button ref={menuButton} type="button" className="wsp-icon-button" aria-controls="wsp-side" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /><span className="sr-only">Цэс нээх</span></button>
        <Link href="/admin" className="wsp-logo is-compact" aria-label="Админ нүүр"><span className="wsp-logo-mark" aria-hidden="true">e<span>·</span></span></Link>
        <span className="wsp-topbar-title">{title}</span>
        <Link className="wsp-top-account" href="/workspace/profile" aria-label="Миний профайл"><span className="wsp-avatar" aria-hidden="true">{initials(name)}</span></Link>
      </header>
      <div className="wsp-content">
        <div className="admin-main">
          <header className="admin-section-heading admin-head">
            <div className="admin-title"><h2>{title}</h2>{scope && <span className={"admin-live " + (testData ? "test" : "")}>{testData ? "Туршилтын өгөгдөл" : "Бодит өгөгдөл"}</span>}</div>
            <div className="admin-head-actions">{actions}{scope}</div>
          </header>
          {description && <p className="admin-notice">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  </div>;
}

// Desktop only: collapse the rail to icons. The layout's head script applies the saved choice before paint.
function RailToggle() {
  function toggle() {
    const root = document.documentElement;
    const collapsed = root.dataset.wsRail !== "collapsed";
    root.dataset.wsRailMoving = "";
    window.setTimeout(() => { delete root.dataset.wsRailMoving; }, 260);
    if (collapsed) root.dataset.wsRail = "collapsed"; else delete root.dataset.wsRail;
    try { localStorage.setItem(RAIL_KEY, collapsed ? "collapsed" : "open"); } catch { /* The choice then lasts for this page only. */ }
  }
  return <button type="button" className="wsp-icon-button wsp-rail-toggle" onClick={toggle} aria-label="Хажуу цэсийг хураах / дэлгэх" title="Хажуу цэсийг хураах / дэлгэх"><Icon name="rail" /></button>;
}

function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function signOut() {
    setPending(true); setFailed(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("signout");
      router.push("/login"); router.refresh();
    } catch { setFailed(true); setPending(false); }
  }
  return <button type="button" onClick={() => void signOut()} disabled={pending} title="Гарах"><Icon name="logout" size={18} /><span>{pending ? "Гарч байна…" : failed ? "Дахин оролдох" : "Гарах"}</span></button>;
}
