"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon, type IconName } from "./icons";
import { inWorkspace, workspaceTab, type WorkspaceTab } from "./paths";
import { useThreads } from "./chat-store";
import type { ShellAccount } from "./data";
import { CreditsProvider, normalCredits, useCredits } from "@/modules/credits/client";
import { formatCredits } from "@/modules/credits/pricing";

const tabs: { id: WorkspaceTab; href: string; label: string; icon: IconName }[] = [
  { id: "home", href: "/workspace", label: "Нүүр", icon: "home" },
  { id: "chat", href: "/workspace/chat", label: "AI туслах", icon: "spark" },
  { id: "vocabulary", href: "/workspace/vocabulary", label: "Үгсийн сан", icon: "book" },
  { id: "myexams", href: "/workspace/my-exams", label: "Файлаас шалгалт", icon: "fileExam" },
  { id: "exams", href: "/exams", label: "Шалгалтууд", icon: "exam" },
  { id: "review", href: "/workspace/review", label: "Миний үр дүн", icon: "review" },
  { id: "workshop", href: "/workspace/workshop", label: "Workshop", icon: "workshop" },
  { id: "plans", href: "/workspace/plans", label: "Багцууд", icon: "plans" },
];
// Opened from the account row rather than a tab; named here for the phone top bar.
const PROFILE_LABEL = "Миний профайл";
const RAIL_KEY = "education-workspace-rail";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "E";
}

/** The Workspace frame: a left tab rail on desktop, a top bar with a slide-in menu on phones. */
export function WorkspaceShell({ account, fontClass, children }: { account: ShellAccount; fontClass: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = workspaceTab(pathname);
  const [open, setOpen] = useState(false);
  const side = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const shown = inWorkspace(pathname);

  // Close the phone menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setOpen(false); }

  useEffect(() => {
    if (!open) return;
    (side.current?.querySelector<HTMLElement>("a[aria-current='page']") ?? side.current?.querySelector<HTMLElement>("a"))?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    addEventListener("keydown", key);
    return () => { removeEventListener("keydown", key); document.body.style.overflow = overflow; };
  }, [open]);

  // These pages redirect guests on the server. Do not stream parent chrome while that
  // child redirect resolves, including the first render before browser hydration.
  const guestRedirect = !account && (active === "home" || active === "chat" || active === "vocabulary" || active === "myexams" || active === "review" || active === "profile");
  const credits = account?.credits ?? null;
  if (!shown || guestRedirect) return <CreditsProvider initial={credits}>{children}</CreditsProvider>;
  const title = active === "profile" ? PROFILE_LABEL : tabs.find(tab => tab.id === active)?.label ?? "Workspace";
  const onProfile = active === "profile" ? "page" as const : undefined;
  return <CreditsProvider initial={credits}><div className={"wsp " + fontClass} data-open={open ? "" : undefined}>
    <aside ref={side} className="wsp-side" id="wsp-side" aria-label="Workspace">
      <div className="wsp-side-head">
        <Link href="/workspace" className="wsp-logo" aria-label="Workspace нүүр"><span className="wsp-logo-mark" aria-hidden="true">e<span>·</span></span><span className="wsp-logo-word">Education<small>Workspace</small></span></Link>
        <RailToggle />
        <button type="button" className="wsp-icon-button wsp-drawer-close" onClick={() => { setOpen(false); menuButton.current?.focus(); }} aria-label="Цэс хаах"><Icon name="close" /></button>
      </div>
      <nav className="wsp-nav" aria-label="Workspace цэс">
        {tabs.map(tab => <Link key={tab.id} href={tab.href} className="wsp-nav-item" aria-current={active === tab.id ? "page" : undefined} title={tab.label} onClick={() => setOpen(false)}>
          <Icon name={tab.icon} /><span>{tab.label}</span>{tab.id === "chat" ? <em className="wsp-nav-badge">AI</em> : null}
        </Link>)}
      </nav>
      {account ? <RecentChats userKey={account.userKey} /> : null}
      <div className="wsp-side-foot">
        {account ? <CreditMeter /> : null}
        {account ? account.plans.length ? <div className="wsp-plan-card"><span>Идэвхтэй багц</span>{account.plans.map(plan => <p key={plan.title}><strong>{plan.title}</strong><em className={plan.daysLeft <= 5 ? "is-warn" : undefined}>{plan.daysLeft} хоног</em></p>)}</div>
          : <Link className="wsp-cta" href="/workspace/plans"><Icon name="bolt" />Багц сонгох</Link>
          : <Link className="wsp-cta" href="/login?next=%2Fworkspace"><Icon name="profile" />Нэвтрэх</Link>}
        <div className="wsp-account-row">
          {account ? <Link className="wsp-account" href="/workspace/profile" title={account.name} aria-current={onProfile}><span className="wsp-avatar" aria-hidden="true">{initials(account.name)}</span><span className="wsp-account-text"><strong>{account.name}</strong><small>{account.email}</small></span></Link>
            : <Link className="wsp-account" href="/register"><span className="wsp-avatar is-guest" aria-hidden="true"><Icon name="profile" size={16} /></span><span className="wsp-account-text"><strong>Бүртгүүлэх</strong><small>Үнэгүй бүртгэл</small></span></Link>}
          <ThemeToggle />
        </div>
      </div>
    </aside>
    <button type="button" className="wsp-scrim" aria-label="Цэс хаах" tabIndex={-1} onClick={() => setOpen(false)} />
    <div className="wsp-body">
      <header className="wsp-topbar">
        <button ref={menuButton} type="button" className="wsp-icon-button" aria-controls="wsp-side" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /><span className="sr-only">Цэс нээх</span></button>
        <Link href="/workspace" className="wsp-logo is-compact" aria-label="Workspace нүүр"><span className="wsp-logo-mark" aria-hidden="true">e<span>·</span></span></Link>
        <span className="wsp-topbar-title">{title}</span>
        {account ? <Link className="wsp-top-account" href="/workspace/profile" aria-label={PROFILE_LABEL} aria-current={onProfile}><span className="wsp-avatar" aria-hidden="true">{initials(account.name)}</span></Link>
          : <Link className="wsp-top-signin" href="/login?next=%2Fworkspace">Нэвтрэх</Link>}
      </header>
      <div className="wsp-content">{children}</div>
    </div>
  </div></CreditsProvider>;
}

// The AI credits; the figures follow each AI reply's receipt. Hidden when they could not be read. The month's and
// plan's credits fill the bar; purchased ("yellow") credits get their own row laid out the same way, in yellow,
// labelled just "Кредит" and shown at 0 too (owner rules 2026-11-13, 2026-11-14).
function CreditMeter() {
  const { balance } = useCredits();
  if (!balance) return null;
  const normal = normalCredits(balance);
  const share = normal.size ? Math.min(1, normal.left / normal.size) : 0;
  const low = share < 0.15 && balance.yellow === 0;
  return <>
    <Link className="wsp-credits" href="/workspace/plans#credits" title={`AI кредит: ${formatCredits(normal.left)} / ${formatCredits(normal.size)}`} data-low={low ? "" : undefined}>
      <Icon name="bolt" size={18} />
      <span className="wsp-credits-text"><span>AI кредит</span><strong>{formatCredits(normal.left)}<small> / {formatCredits(normal.size)}</small></strong></span>
      <i className="wsp-credits-bar" aria-hidden="true"><b style={{ transform: `scaleX(${share})` }} /></i>
    </Link>
    <Link className="wsp-credits is-yellow" href="/workspace/plans#credits" title={`Кредит: ${formatCredits(balance.yellow)}`}>
      <Icon name="bolt" size={18} />
      <span className="wsp-credits-text"><span>Кредит</span><strong>{formatCredits(balance.yellow)}</strong></span>
    </Link>
  </>;
}

// Desktop only: collapse the tab rail to icons. The layout's head script applies the saved choice before paint.
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

function RecentChats({ userKey }: { userKey: string }) {
  const threads = useThreads(userKey);
  if (!threads.length) return null;
  return <section className="wsp-recent" aria-label="Сүүлийн чатууд">
    <h2>Сүүлийн чатууд</h2>
    <ul>{threads.slice(0, 6).map(thread => <li key={thread.id}><Link href={"/workspace/chat?thread=" + encodeURIComponent(thread.id)} title={thread.title}><Icon name="chat" size={16} /><span>{thread.title}</span></Link></li>)}</ul>
  </section>;
}
