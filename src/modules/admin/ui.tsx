import Link from "next/link";
import type { ReactNode } from "react";
import { pageWindow, type pageInfo } from "./paging";

export const adminTabs = [
  ["overview", "Тойм"], ["users", "Хэрэглэгчид"], ["subscriptions", "Сарын эрх"], ["payments", "Төлбөрүүд"],
  ["attempts", "Шалгалтын явц"], ["content", "Контент"], ["pricing", "Үнэ"], ["audit", "Үйлдлийн түүх"], ["settings", "Тохиргоо"],
] as const;
export type AdminTab = typeof adminTabs[number][0];

export const adminDate = (value: Date) => new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "short", timeStyle: "short" }).format(value);
export const money = (value: number) => "₮" + value.toLocaleString("en-US");
export const statusLabel = (value: string) => ({ PAID: "Төлөгдсөн", PENDING: "Хүлээгдэж байна", DECLINED: "Амжилтгүй", IN_PROGRESS: "Үргэлжилж байна", SUBMITTED: "Дууссан", IN_REVIEW: "Хянаж байна", REVIEWED: "Хянасан", CHANGES_NEEDED: "Засвар шаардлагатай", DRAFT: "Ноорог", PUBLISHED: "Нийтлэгдсэн" }[value] ?? value);
export const eventLabel = (value: string) => ({ "sign-in": "Нэвтэрсэн", "sign-up": "Бүртгүүлсэн", "password-change": "Нууц үг сольсон" }[value] ?? value);

// One frame for every admin screen: header, section navigation and the working area.
export function AdminShell({ tab, title, name, testData = false, actions, children }: { tab: AdminTab; title: string; name: string; testData?: boolean; actions?: ReactNode; children: ReactNode }) {
  return <div className="container page-space admin-page">
    <div className="admin-top"><div><p className="eyebrow">EDUCATION / CONTROL ROOM</p><h1>Удирдлагын төв<span>● Local pilot</span></h1><p>Суралцах орчны бүх чухал үзүүлэлт, нэг дор.</p></div><Link className="button secondary" href="/profile">{name} ↗</Link></div>
    <div className="admin-shell">
      <aside className="admin-sidebar"><p>УДИРДЛАГА</p><nav aria-label="Админ цэс">{adminTabs.map(([key, label]) => <Link key={key} href={"/admin?tab=" + key + (testData ? "&data=test" : "")} aria-current={tab === key ? "page" : undefined}>{label}</Link>)}</nav></aside>
      <div className="admin-main"><div className="admin-section-heading"><h2>{title}</h2>{actions ?? <span>Улаанбаатар · UTC+08</span>}</div>{children}</div>
    </div>
  </div>;
}

// Numbered pager with totals; `href` builds the link for a page number.
export function Pager({ info, href, label = "мөр" }: { info: ReturnType<typeof pageInfo>; href: (page: number) => string; label?: string }) {
  if (!info.total) return null;
  return <nav className="admin-pager" aria-label="Хуудсууд">
    <span>{info.from}–{info.to} / нийт {info.total.toLocaleString("en-US")} {label}</span>
    {info.pages > 1 && <div>
      {info.page > 1 ? <Link href={href(info.page - 1)} aria-label="Өмнөх хуудас">←</Link> : <span aria-hidden="true">←</span>}
      {pageWindow(info.page, info.pages).map((n, i) => n === null ? <span key={"gap" + i} aria-hidden="true">…</span> : <Link key={n} href={href(n)} aria-current={n === info.page ? "page" : undefined}>{n}</Link>)}
      {info.page < info.pages ? <Link href={href(info.page + 1)} aria-label="Дараах хуудас">→</Link> : <span aria-hidden="true">→</span>}
    </div>}
  </nav>;
}

// Sub-view switcher (e.g. subscription orders vs single-exam purchases) rendered as links.
export function SubTabs({ items, current, href }: { items: readonly (readonly [string, string, number?])[]; current: string; href: (key: string) => string }) {
  return <nav className="admin-subtabs" aria-label="Дэд хэсэг">{items.map(([key, label, count]) => <Link key={key} href={href(key)} aria-current={key === current ? "page" : undefined}>{label}{count !== undefined && <em>{count.toLocaleString("en-US")}</em>}</Link>)}</nav>;
}
