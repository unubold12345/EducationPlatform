import "../../admin.css";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/modules/admin/service";
import { findExam } from "@/modules/exams/definitions";
import { pageInfo, parsePage } from "@/modules/admin/paging";
import { AdminShell, Pager, StatusPill, SubTabs, adminDate, auditLabel, eventLabel, money } from "@/modules/admin/ui";
import { AdminUserActions } from "@/components/admin-user-actions";
import { creditSummary } from "@/modules/credits/service";
import { AI_ACTIONS, formatCredits, formatUsd, isAiAction } from "@/modules/credits/pricing";

export const metadata = { title: "Хэрэглэгч", robots: { index: false, follow: false } };
const views = [["activity", "Нэвтрэлт, үйлдэл"], ["payments", "Төлбөр"], ["attempts", "Оролдлого"], ["credits", "AI кредит"], ["sessions", "Идэвхтэй сесс"], ["admin", "Админы түүх"]] as const;
type View = typeof views[number][0];
const device = (agent: string | null) => {
  if (!agent) return "—";
  const os = /Windows/.test(agent) ? "Windows" : /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : /Mac OS/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "Бусад";
  const browser = /Edg\//.test(agent) ? "Edge" : /OPR\//.test(agent) ? "Opera" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Бусад";
  return `${browser} · ${os}`;
};

export default async function AdminUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession(); if (!session) redirect("/login?next=%2Fadmin");
  if (!await isAdmin(session.user.id)) notFound();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const view: View = views.some(([key]) => key === query.view) ? query.view as View : "activity";
  const requested = parsePage(query.page);
  const db = getDb(); const now = new Date();
  const user = await db.user.findUnique({ where: { id }, select: {
    id: true, name: true, email: true, emailVerified: true, createdAt: true, updatedAt: true, suspendedAt: true, suspendedReason: true,
    adminMembership: { select: { createdAt: true } }, accounts: { select: { providerId: true, createdAt: true } },
    subscriptions: { orderBy: { endsAt: "desc" }, select: { program: true, startsAt: true, endsAt: true } },
    _count: { select: { sessions: true, events: true, mockAttempts: true, paperAttempts: true, subscriptionOrders: true, mockPurchases: true, creditOrders: true, creditCharges: true } },
  } });
  if (!user) notFound();
  const [lastEvent, ipRows, paidOrders, paidPurchases, paidCredits, declined, notes, auditTotal, credits] = await Promise.all([
    db.userEvent.findFirst({ where: { userId: id, type: "sign-in" }, orderBy: { createdAt: "desc" } }),
    db.userEvent.groupBy({ by: ["ipAddress"], where: { userId: id, ipAddress: { not: null } }, _count: true, orderBy: { _count: { ipAddress: "desc" } }, take: 5 }),
    db.subscriptionOrder.aggregate({ where: { userId: id, status: "PAID" }, _sum: { amountMnt: true }, _count: true }),
    db.mockPurchase.aggregate({ where: { userId: id, status: "PAID" }, _sum: { amountMnt: true }, _count: true }),
    db.creditOrder.aggregate({ where: { userId: id, status: "PAID" }, _sum: { amountMnt: true }, _count: true }).catch(() => ({ _sum: { amountMnt: 0 }, _count: 0 })),
    db.subscriptionOrder.count({ where: { userId: id, status: "DECLINED" } }),
    db.adminNote.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.adminAudit.count({ where: { target: id } }),
    creditSummary(id, now).catch(() => null),
  ]);
  // Other accounts that signed in from this user's IP addresses: a common sign of shared or farmed accounts.
  const sharedIps = ipRows.length ? await db.userEvent.groupBy({ by: ["userId"], where: { ipAddress: { in: ipRows.map(row => row.ipAddress!) }, userId: { not: id } }, _count: true, orderBy: { _count: { userId: "desc" } }, take: 6 }) : [];
  const sharedUsers = sharedIps.length ? await db.user.findMany({ where: { id: { in: sharedIps.map(row => row.userId) } }, select: { id: true, email: true, suspendedAt: true } }) : [];

  const href = (next: Partial<{ view: string; page: number }>) => `/admin/users/${id}?` + new URLSearchParams({ view: next.view ?? view, page: String(next.page ?? 1) });
  const counts: Record<View, number> = { activity: user._count.events, payments: user._count.subscriptionOrders + user._count.mockPurchases + user._count.creditOrders, attempts: user._count.mockAttempts + user._count.paperAttempts, credits: user._count.creditCharges, sessions: user._count.sessions, admin: auditTotal };
  const info = pageInfo(counts[view], requested);
  let body: React.ReactNode = null;

  if (view === "activity") {
    const rows = await db.userEvent.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: info.skip, take: info.size });
    body = <Table head={["Огноо", "Үйлдэл", "IP хаяг", "Төхөөрөмж"]} empty="Бүртгэгдсэн үйлдэл алга. Шинэчлэлтээс хойшхи нэвтрэлт энд харагдана." rows={rows.map(row => cells(adminDate(row.createdAt), <><strong>{eventLabel(row.type)}</strong><small>{(row.details as { path?: string } | null)?.path ?? ""}</small></>, <code>{row.ipAddress ?? "—"}</code>, <span title={row.userAgent ?? ""}>{device(row.userAgent)}</span>))}/>;
  } else if (view === "payments") {
    // Orders and single-exam purchases are merged by date; fetch enough of each to fill this page.
    const take = info.skip + info.size;
    const [orders, purchases, creditOrders] = await Promise.all([
      db.subscriptionOrder.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take }),
      db.mockPurchase.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take }),
      db.creditOrder.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take }),
    ]);
    const rows = [...orders.map(row => ({ id: row.id, at: row.createdAt, label: `Сарын эрх · ${row.program.toUpperCase()}`, extra: row.periodEnd ? `${adminDate(row.periodStart!)} → ${adminDate(row.periodEnd)}` : "", amount: row.amountMnt, status: row.status, provider: row.provider, paidAt: row.paidAt })),
      ...purchases.map(row => ({ id: row.id, at: row.createdAt, label: `Нэг шалгалт · ${findExam(row.examSlug)?.title ?? row.examSlug}`, extra: "", amount: row.amountMnt, status: row.status, provider: row.provider, paidAt: row.paidAt })),
      ...creditOrders.map(row => ({ id: row.id, at: row.createdAt, label: `AI кредит · ${formatCredits(row.credits)}`, extra: "", amount: row.amountMnt, status: row.status, provider: row.provider, paidAt: row.paidAt }))]
      .sort((a, b) => b.at.getTime() - a.at.getTime()).slice(info.skip, info.skip + info.size);
    body = <Table head={["Огноо", "Бүтээгдэхүүн", "Дүн / төлөв", "Баримт"]} empty="Төлбөр алга." rows={rows.map(row => cells(adminDate(row.at), <>{row.label}<small>{row.extra}</small></>, <><strong>{money(row.amount)}</strong><small><StatusPill status={row.status}/>{row.paidAt ? " " + adminDate(row.paidAt) : ""}</small></>, <><code>{row.id}</code><small>{row.provider}</small></>))}/>;
  } else if (view === "attempts") {
    const take = info.skip + info.size;
    const [mocks, papers] = await Promise.all([
      db.mockAttempt.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take, select: { id: true, slug: true, status: true, createdAt: true, updatedAt: true, subscriptionAccess: true } }),
      db.paperAttempt.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take, select: { id: true, slug: true, status: true, createdAt: true, updatedAt: true } }),
    ]);
    const rows = [...mocks.map(row => ({ id: row.id, at: row.createdAt, updated: row.updatedAt, label: "Mock · " + (findExam(row.slug)?.title ?? row.slug), status: row.status, result: row.subscriptionAccess ? "Сарын эрхээр" : "Нэг удаагийн эрхээр" })),
      ...papers.map(row => ({ id: row.id, at: row.createdAt, updated: row.updatedAt, label: "Хасагдсан албан материал · " + row.slug, status: row.status, result: "" }))]
      .sort((a, b) => b.at.getTime() - a.at.getTime()).slice(info.skip, info.skip + info.size);
    body = <Table head={["Эхэлсэн", "Материал", "Төлөв / оноо", "Сүүлд"]} empty="Оролдлого алга." rows={rows.map(row => cells(adminDate(row.at), <>{row.label}<small><code>{row.id}</code></small></>, <><StatusPill status={row.status}/><small>{row.result}</small></>, adminDate(row.updated)))}/>;
  } else if (view === "credits") {
    const rows = await db.creditCharge.findMany({ where: { userId: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: info.skip, take: info.size, select: { id: true, action: true, period: true, credits: true, status: true, promptTokens: true, cachedTokens: true, completionTokens: true, costMicroUsd: true, createdAt: true } });
    body = <Table head={["Огноо", "Үйлдэл", "Кредит / төлөв", "Токен / бодит зардал"]} empty="AI үйлдэл алга." rows={rows.map(row => cells(<>{adminDate(row.createdAt)}<small>{row.period}</small></>, isAiAction(row.action) ? <>{AI_ACTIONS[row.action].label}<small>{AI_ACTIONS[row.action].area}</small></> : row.action, <><strong>{row.status === "REFUNDED" ? "0" : "−" + row.credits}</strong><small>{row.status === "SPENT" ? "Зарцуулсан" : row.status === "REFUNDED" ? "Буцаасан" : "Боловсруулж байна"}</small></>, <>{formatCredits(row.promptTokens)} → {formatCredits(row.completionTokens)}<small>{row.cachedTokens ? formatCredits(row.cachedTokens) + " кэш · " : ""}{formatUsd(row.costMicroUsd)}</small></>))}/>;
  } else if (view === "sessions") {
    const rows = await db.session.findMany({ where: { userId: id }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: info.skip, take: info.size, select: { id: true, createdAt: true, updatedAt: true, expiresAt: true, ipAddress: true, userAgent: true } });
    body = <Table head={["Нэвтэрсэн", "Сүүлд идэвхтэй", "IP хаяг", "Төхөөрөмж"]} empty="Идэвхтэй сесс алга." rows={rows.map(row => cells(adminDate(row.createdAt), <>{adminDate(row.updatedAt)}<small>Дуусах: {adminDate(row.expiresAt)}</small></>, <code>{row.ipAddress ?? "—"}</code>, <span title={row.userAgent ?? ""}>{device(row.userAgent)}</span>))}/>;
  } else {
    const rows = await db.adminAudit.findMany({ where: { target: id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: info.skip, take: info.size });
    body = <Table head={["Огноо", "Үйлдэл", "Шалтгаан", "Админ"]} empty="Админы үйлдэл алга." rows={rows.map(row => cells(adminDate(row.createdAt), <><strong>{auditLabel(row.action)}</strong><small>{row.action}</small></>, <>{row.reason}<details><summary>Дэлгэрэнгүй</summary><pre>{JSON.stringify(row.details, null, 2)}</pre></details></>, <code>{row.actorId}</code>))}/>;
  }

  const active = user.subscriptions.filter(plan => plan.startsAt <= now && plan.endsAt > now);
  const providers = user.accounts.map(account => account.providerId === "credential" ? "Имэйл + нууц үг" : account.providerId === "google" ? "Google" : account.providerId);
  return <AdminShell tab="users" title={user.name} name={session.user.name} actions={<Link href="/admin?tab=users" className="text-link">← Бүх хэрэглэгч</Link>}>
    {user.suspendedAt && <p className="admin-warning" role="note"><strong>Түр хаасан</strong> · {adminDate(user.suspendedAt)} · {user.suspendedReason}</p>}
    <div className="admin-user">
      <section className="ws-card admin-user-card">
        <p className="admin-user-email">{user.email}</p>
        <div className="admin-badges">
          <span className={"ws-pill " + (user.adminMembership ? "info" : "")}>{user.adminMembership ? "Админ" : "Суралцагч"}</span>
          <span className={"ws-pill " + (user.emailVerified ? "ok" : "warn")}>{user.emailVerified ? "Имэйл баталгаажсан" : "Имэйл баталгаажаагүй"}</span>
          {user.suspendedAt ? <span className="ws-pill bad">Хаасан</span> : <span className="ws-pill ok">Идэвхтэй</span>}
          {user.email.endsWith(".invalid") && <span className="ws-pill">Тест бүртгэл</span>}
        </div>
        <dl className="admin-facts">
          <div><dt>Бүртгүүлсэн</dt><dd>{adminDate(user.createdAt)}</dd></div>
          <div><dt>Сүүлд нэвтэрсэн</dt><dd>{lastEvent ? adminDate(lastEvent.createdAt) : "—"}</dd></div>
          <div><dt>Нэвтрэх арга</dt><dd>{providers.join(", ") || "—"}</dd></div>
          <div><dt>Төлсөн нийт</dt><dd>{money((paidOrders._sum.amountMnt ?? 0) + (paidPurchases._sum.amountMnt ?? 0) + (paidCredits._sum.amountMnt ?? 0))}<small>{paidOrders._count + paidPurchases._count + paidCredits._count} гүйлгээ{declined ? ` · ${declined} амжилтгүй` : ""}</small></dd></div>
          <div><dt>AI кредит</dt><dd>{credits ? <>{formatCredits(credits.balance)} / {formatCredits(credits.allowance)} үлдсэн<small>энэ сар: үнэгүй {formatCredits(credits.free)}{credits.bonus ? ` + урамшуулал ${formatCredits(credits.bonus)}` : ""}, {formatCredits(credits.monthLeft)} үлдсэн{credits.plans.map(plan => ` · ${plan.title}: ${formatCredits(plan.left)} / ${formatCredits(plan.credits)} (${adminDate(new Date(plan.endsAt))} хүртэл)`).join("")}{credits.purchased ? ` · худалдаж авсан ${formatCredits(credits.purchased)}` : ""}</small></> : "—"}</dd></div>
          <div><dt>Идэвхтэй эрх</dt><dd>{active.length ? active.map(plan => `${plan.program.toUpperCase()} → ${adminDate(plan.endsAt)}`).join(", ") : "Алга"}</dd></div>
          <div><dt>ID</dt><dd><code>{user.id}</code></dd></div>
        </dl>
        {(ipRows.length > 0 || sharedUsers.length > 0) && <div className="admin-signals">
          <h4>Ижил IP хаяг</h4>
          {ipRows.length > 0 && <p>IP хаягууд: {ipRows.map(row => <code key={row.ipAddress}>{row.ipAddress} ×{row._count}</code>)}</p>}
          {sharedUsers.length > 0 ? <p>Ижил IP-ээс нэвтэрсэн бусад бүртгэл: {sharedUsers.map(other => <Link key={other.id} href={"/admin/users/" + other.id}>{other.email}{other.suspendedAt ? " (хаасан)" : ""}</Link>)}</p> : <p>Ижил IP-ээс өөр бүртгэл нэвтрээгүй.</p>}
        </div>}
      </section>
      <section className="ws-card">
        <h3>Үйлдэл</h3>
        <AdminUserActions target={user.id} suspended={!!user.suspendedAt} protectedUser={user.id === session.user.id || !!user.adminMembership}/>
        <h4>Тэмдэглэл</h4>
        {notes.length ? <ul className="admin-log">{notes.map(note => <li key={note.id}>{note.text}<small>{adminDate(note.createdAt)} · {note.authorId === session.user.id ? "Та" : note.authorId}</small></li>)}</ul> : <p className="admin-help">Тэмдэглэл алга.</p>}
      </section>
    </div>
    <SubTabs items={views.map(([key, label]) => [key, label, counts[key]] as const)} current={view} href={key => href({ view: key })}/>
    {body}
    <Pager info={info} href={page => href({ page })}/>
  </AdminShell>;
}

// Table cells are passed as call arguments so each row needs no per-cell keys.
const cells = (...values: React.ReactNode[]) => values;
function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  return <div className="admin-table-wrap"><table><thead><tr>{head.map(cell => <th key={cell}>{cell}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="admin-empty">{empty}</p>}</div>;
}
