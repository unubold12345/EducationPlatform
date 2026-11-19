import Link from "next/link";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { pageWindow, type pageInfo } from "./paging";
import { AdminWorkspaceShell } from "./shell";

// Same face as the Workspace; the root layout's variable is already taken by the marketing shell.
const adminFont = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-wsp", display: "swap" });

export const adminTabs = [
  ["overview", "Тойм"], ["users", "Хэрэглэгчид"], ["attempts", "Оролдлого"], ["announcements", "Мэдэгдэл"], ["subscriptions", "Сарын эрх"], ["payments", "Төлбөр"],
  ["pricing", "Үнэ"], ["credits", "AI кредит"], ["content", "Контент"], ["ai", "AI зардал"], ["audit", "Үйлдлийн түүх"], ["settings", "Систем"],
] as const;
export type AdminTab = typeof adminTabs[number][0];

// The sidebar groups, plus one plain line saying what each section is for.
export const adminGroups: readonly { label: string; tabs: readonly AdminTab[] }[] = [
  { label: "Хүмүүс", tabs: ["users", "attempts", "announcements"] },
  { label: "Орлого", tabs: ["subscriptions", "payments", "pricing", "credits"] },
  { label: "Агуулга", tabs: ["content"] },
  { label: "Хяналт", tabs: ["ai", "audit", "settings"] },
];
export const adminTabInfo: Record<AdminTab, string> = {
  overview: "Анхаарах зүйл, гол тоонууд.",
  users: "Бүртгэлтэй хүмүүс. Нэрэн дээр дарж эрх олгох, түр хаах зэрэг үйлдэл хийнэ.",
  attempts: "Суралцагчдын эхлүүлсэн шалгалт. Зөвхөн харна.",
  announcements: "Суралцагчдын Workspace дахь мэдэгдлийн хайрцагт мессеж илгээнэ.",
  subscriptions: "Хэн аль багцыг хэдий хүртэл эзэмшиж байгаа.",
  payments: "Багц болон нэг шалгалтын төлбөрийн гүйлгээ.",
  pricing: "Багцын үнэ, хямдрал, AI кредитийн сарын хэмжээ, кредит багц.",
  credits: "AI-ийн зарцуулалт: кредит, бодит DeepSeek зардал, үйлдэл ба хэрэглэгчээр.",
  content: "Шалгалт, workshop-ын асуулт, хариуг засна.",
  ai: "AI-ийн бодит зардал: дуудлага бүр хаанаас, хэнээс, хэдээр. DeepSeek-ийн үлдэгдэлтэй тулгана.",
  audit: "Админууд юу хийсэн, ямар шалтгаанаар.",
  settings: "Серверийн ачаалал, өгөгдлийн сангийн төлөв.",
};
export const adminDate = (value: Date) => new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "short", timeStyle: "short" }).format(value);
export const money = (value: number) => "₮" + value.toLocaleString("en-US");
export const statusLabel = (value: string) => ({ PAID: "Төлөгдсөн", PENDING: "Хүлээгдэж байна", DECLINED: "Амжилтгүй", IN_PROGRESS: "Үргэлжилж байна", SUBMITTED: "Дууссан", ABANDONED: "Зогсоосон", IN_REVIEW: "Хянаж байна", REVIEWED: "Хянасан", CHANGES_NEEDED: "Засвар шаардлагатай", DRAFT: "Ноорог", PUBLISHED: "Нийтлэгдсэн" }[value] ?? value);
export const eventLabel = (value: string) => ({ "sign-in": "Нэвтэрсэн", "sign-up": "Бүртгүүлсэн", "password-change": "Нууц үг сольсон" }[value] ?? value);
export const auditActions: readonly (readonly [string, string])[] = [
  ["grant-month", "Сарын эрх олгосон"], ["expire-plan", "Сарын эрх дуусгасан"], ["revoke-sessions", "Төхөөрөмжөөс гаргасан"],
  ["suspend", "Бүртгэл хаасан"], ["unsuspend", "Хаалт цуцалсан"], ["add-note", "Тэмдэглэл нэмсэн"], ["set-price", "Үнэ өөрчилсөн"], ["set-sale", "Хямдрал өөрчилсөн"], ["grant-credits", "AI кредит олгосон"], ["set-credits", "AI кредитийн хэмжээ өөрчилсөн"], ["set-credit-packs", "AI кредит багцууд өөрчилсөн"], ["set-credit-pack", "AI кредит багц өөрчилсөн"],
  ["announce", "Мэдэгдэл илгээсэн"], ["withdraw-announcement", "Мэдэгдэл буцаасан"],
  ["content-fix", "Асуулт зассан"], ["content-save", "Ноорог хадгалсан"], ["content-review", "Ноорог хянасан"], ["content-publish", "Контент нийтэлсэн"], ["review-content", "Хяналтын төлөв өөрчилсөн"], ["skip-mock-stage", "Mock хэсэг алгассан (админ)"],
];
export const auditLabel = (action: string) => auditActions.find(([key]) => key === action)?.[1] ?? action;

const statusTone: Record<string, string> = { PAID: "ok", SUBMITTED: "ok", PUBLISHED: "ok", REVIEWED: "ok", PENDING: "warn", CHANGES_NEEDED: "warn", DECLINED: "bad", ABANDONED: "bad", IN_PROGRESS: "info", IN_REVIEW: "info" };
export function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={"ws-pill " + (statusTone[status] ?? "")}>{label ?? statusLabel(status)}</span>;
}

// One frame for every admin screen: the same Workspace rail, drawer and top bar, with admin sections.
export function AdminShell({ tab, title, name, testData = false, actions, scope, description, children }: { tab: AdminTab; title: string; name: string; testData?: boolean; actions?: ReactNode; scope?: ReactNode; description?: string; children: ReactNode }) {
  const groups: { label: string; tabs: readonly AdminTab[] }[] = [
    { label: "", tabs: ["overview"] as readonly AdminTab[] },
    ...adminGroups.map(group => ({ label: group.label, tabs: group.tabs })),
  ];
  return <AdminWorkspaceShell tab={tab} title={title} name={name} fontClass={adminFont.variable} testData={testData} tabs={adminTabs} groups={groups} actions={actions} scope={scope} description={description}>{children}</AdminWorkspaceShell>;
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

// The tab bar under the page title: one job per tab, each a link with its own address.
export function SubTabs({ items, current, href }: { items: readonly (readonly [string, string, number?])[]; current: string; href: (key: string) => string }) {
  return <nav className="admin-subtabs" aria-label="Дэд хэсэг">{items.map(([key, label, count]) => <Link key={key} href={href(key)} aria-current={key === current ? "page" : undefined}>{label}{count !== undefined && <em>{count.toLocaleString("en-US")}</em>}</Link>)}</nav>;
}

// Background rules that the admin rarely needs: closed by default so the page stays short.
export function How({ title = "Яаж үйлчилдэг вэ", children }: { title?: string; children: ReactNode }) {
  return <details className="admin-how"><summary>{title}</summary><div>{children}</div></details>;
}

// The big-number cards at the top of a view.
export function Metrics({ items, wide = false }: { items: readonly (readonly [label: string, value: ReactNode, sub?: string])[]; wide?: boolean }) {
  return <div className={"admin-metrics" + (wide ? " admin-metrics-wide" : "")}>{items.map(([label, value, sub]) => <article key={label}><p>{label}</p><strong>{value}</strong>{sub ? <small>{sub}</small> : null}</article>)}</div>;
}
