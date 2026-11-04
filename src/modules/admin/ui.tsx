import Link from "next/link";
import type { ReactNode } from "react";
import { pageWindow, type pageInfo } from "./paging";

export const adminTabs = [
  ["overview", "Тойм"], ["users", "Хэрэглэгчид"], ["attempts", "Оролдлого"], ["subscriptions", "Сарын эрх"], ["payments", "Төлбөр"],
  ["pricing", "Үнэ"], ["content", "Контент"], ["audit", "Үйлдлийн түүх"], ["settings", "Систем"],
] as const;
export type AdminTab = typeof adminTabs[number][0];

// The sidebar groups, plus one plain line saying what each section is for.
export const adminGroups: readonly { label: string; tabs: readonly AdminTab[] }[] = [
  { label: "Хүмүүс", tabs: ["users", "attempts"] },
  { label: "Орлого", tabs: ["subscriptions", "payments", "pricing"] },
  { label: "Агуулга", tabs: ["content"] },
  { label: "Хяналт", tabs: ["audit", "settings"] },
];
export const adminTabInfo: Record<AdminTab, string> = {
  overview: "Анхаарах зүйл, гол тоонууд.",
  users: "Бүртгэлтэй хүмүүс. Нэрэн дээр дарж эрх олгох, түр хаах зэрэг үйлдэл хийнэ.",
  attempts: "Суралцагчдын эхлүүлсэн шалгалт. Зөвхөн харна.",
  subscriptions: "Хэн аль багцыг хэдий хүртэл эзэмшиж байгаа.",
  payments: "Багц болон нэг шалгалтын төлбөрийн гүйлгээ.",
  pricing: "Сарын багцын үнийг өөрчилнө.",
  content: "Шалгалт, workshop-ын асуулт, хариуг засна.",
  audit: "Админууд юу хийсэн, ямар шалтгаанаар.",
  settings: "Серверийн ачаалал, өгөгдлийн сангийн төлөв.",
};
const tabLabel = (key: AdminTab) => adminTabs.find(([tab]) => tab === key)![1];

export const adminDate = (value: Date) => new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "short", timeStyle: "short" }).format(value);
export const money = (value: number) => "₮" + value.toLocaleString("en-US");
export const statusLabel = (value: string) => ({ PAID: "Төлөгдсөн", PENDING: "Хүлээгдэж байна", DECLINED: "Амжилтгүй", IN_PROGRESS: "Үргэлжилж байна", SUBMITTED: "Дууссан", IN_REVIEW: "Хянаж байна", REVIEWED: "Хянасан", CHANGES_NEEDED: "Засвар шаардлагатай", DRAFT: "Ноорог", PUBLISHED: "Нийтлэгдсэн" }[value] ?? value);
export const eventLabel = (value: string) => ({ "sign-in": "Нэвтэрсэн", "sign-up": "Бүртгүүлсэн", "password-change": "Нууц үг сольсон" }[value] ?? value);
export const auditActions: readonly (readonly [string, string])[] = [
  ["grant-month", "Сарын эрх олгосон"], ["expire-plan", "Сарын эрх дуусгасан"], ["revoke-sessions", "Төхөөрөмжөөс гаргасан"],
  ["suspend", "Бүртгэл хаасан"], ["unsuspend", "Хаалт цуцалсан"], ["add-note", "Тэмдэглэл нэмсэн"], ["set-price", "Үнэ өөрчилсөн"],
  ["content-fix", "Асуулт зассан"], ["content-save", "Ноорог хадгалсан"], ["content-review", "Ноорог хянасан"], ["content-publish", "Контент нийтэлсэн"], ["review-content", "Хяналтын төлөв өөрчилсөн"],
];
export const auditLabel = (action: string) => auditActions.find(([key]) => key === action)?.[1] ?? action;

const statusTone: Record<string, string> = { PAID: "ok", SUBMITTED: "ok", PUBLISHED: "ok", REVIEWED: "ok", PENDING: "warn", CHANGES_NEEDED: "warn", DECLINED: "bad", IN_PROGRESS: "info", IN_REVIEW: "info" };
export function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={"ws-pill " + (statusTone[status] ?? "")}>{label ?? statusLabel(status)}</span>;
}

// One frame for every admin screen: grouped navigation on the left, the current section on the right.
export function AdminShell({ tab, title, name, testData = false, actions, scope, description, children }: { tab: AdminTab; title: string; name: string; testData?: boolean; actions?: ReactNode; scope?: ReactNode; description?: string; children: ReactNode }) {
  const link = (key: AdminTab) => <Link key={key} href={"/admin?tab=" + key + (testData ? "&data=test" : "")} aria-current={tab === key ? "page" : undefined}>{tabLabel(key)}</Link>;
  return <div className="container page-space ws admin-page">
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><h1>Удирдлагын төв</h1><Link href="/profile">{name}</Link></div>
        <nav aria-label="Админ цэс">
          <div className="admin-nav-group">{link("overview")}</div>
          {adminGroups.map(group => <div className="admin-nav-group" key={group.label}><p>{group.label}</p>{group.tabs.map(link)}</div>)}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-section-heading admin-head">
          <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
          {actions}{scope}
        </header>
        {children}
      </div>
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
