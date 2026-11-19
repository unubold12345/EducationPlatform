import "server-only";
import Link from "next/link";
import type { ReactNode } from "react";
import { How, Metrics, Pager, SubTabs, adminDate as date } from "@/modules/admin/ui";
import { pageInfo, parsePage } from "@/modules/admin/paging";
import { AI_ACTIONS, formatCredits, formatUsd, isAiAction } from "@/modules/credits/pricing";
import { AI_RATES } from "./core";
import { refreshDeepseekBalance } from "./server";
import { AI_RANGES, CALL_FILTERS, aiCalls, aiRange, aiUsageReport, balanceCheck, callFilter, rangeStart, type AiRange } from "./report";

// Admin → AI зардал (owner request 2026-11-20): where every paid AI call went, from the AI usage log, checked against
// the DeepSeek account balance so spend the log did not see shows as its own number.

const one = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

const SOURCE_LABELS: Record<string, string> = {
  "mock-grading": "Mock-ийн AI үнэлгээ",
  "mock-transcribe": "Mock-ийн бичлэг → текст",
  "speaking-voice": "Ярианы лаборатори: дуу",
  "speaking-transcribe": "Ярианы лаборатори: яриа → текст",
  "writing-expert": "Essay Studio: Claude шинжээч",
  unknown: "Тодорхойгүй",
};
export function sourceLabel(source: string): ReactNode {
  if (isAiAction(source)) return <>{AI_ACTIONS[source].label}<small>{AI_ACTIONS[source].area}</small></>;
  if (source.startsWith("script:")) return <>Скрипт<small><code>{source.slice(7)}</code></small></>;
  return SOURCE_LABELS[source] ?? <code>{source}</code>;
}
const PROVIDER_LABELS: Record<string, string> = { deepseek: "DeepSeek", anthropic: "Claude", deepinfra: "DeepInfra" };
const ENVIRONMENT_LABELS: Record<string, string> = { local: "Локал", hosted: "Сайт (Vercel)", preview: "Vercel preview" };
const STATUS_LABELS: Record<string, string> = { ok: "Амжилттай", http: "Алдаа", network: "Холбогдсонгүй", timeout: "Хугацаа хэтэрсэн" };
const currency = (micros: number, code: string) => code === "USD" ? formatUsd(micros) : (micros / 1e6).toFixed(2) + " " + code;

// Money stays on one line in the narrow phone tables (the shared cells wrap anywhere).
const ONE_LINE = { whiteSpace: "nowrap" } as const;
// The shared admin table is at least 650px wide; the small tables here sit in half a column, so they shrink to fit.
const table = (head: readonly string[], rows: ReactNode[], whenEmpty: string) => <div className="admin-table-wrap"><table style={head.length <= 4 ? { minWidth: 0 } : undefined}><thead><tr>{head.map((cell, index) => <th key={index}>{cell}</th>)}</tr></thead><tbody>{rows}</tbody></table>{!rows.length && <p className="admin-empty">{whenEmpty}</p>}</div>;
const person = (user: { id: string; email: string; name: string } | null, userId: string | null) => user ? <Link href={"/admin/users/" + user.id}>{user.name ? <><strong>{user.name}</strong><small>{user.email}</small></> : user.email}</Link> : userId ? <code>{userId}</code> : <span className="muted">—</span>;

export async function AiUsagePanel({ params }: { params: Record<string, string | string[] | undefined> }) {
  const range: AiRange = aiRange(one(params.range));
  const view = one(params.view) === "calls" ? "calls" : "";
  const filter = callFilter(one(params.filter));
  const q = one(params.q).trim().slice(0, 100);
  const link = (patch: Record<string, string | number> = {}) => "/admin?" + new URLSearchParams(Object.entries({ tab: "ai", range, view, filter, q, ...patch }).filter(([, value]) => value !== "" && value !== undefined).map(([key, value]) => [key, String(value)]));
  const since = rangeStart(range);
  const ranges = <nav className="admin-subtabs" aria-label="Хугацаа">{AI_RANGES.map(([key, label]) => <Link key={key} href={link({ range: key, page: 1 })} aria-current={key === range ? "page" : undefined}>{label}</Link>)}</nav>;

  if (view === "calls") {
    const requested = parsePage(params.page);
    const first = await aiCalls(since, filter, q, 0, 0);
    const info = pageInfo(first.total, requested);
    const { rows } = await aiCalls(since, filter, q, info.skip, info.size);
    return <>
      <SubTabs items={[["", "Тойм"], ["calls", "Дуудлагууд", first.total]]} current="calls" href={key => link({ view: key, page: 1 })} />
      {ranges}
      <div className="admin-toolbar">
        <form className="admin-search" action="/admin">
          <input type="hidden" name="tab" value="ai" /><input type="hidden" name="range" value={range} /><input type="hidden" name="view" value="calls" />
          <label className="sr-only" htmlFor="ai-search">Хайх</label>
          <input id="ai-search" name="q" defaultValue={q} maxLength={100} placeholder="Эх үүсвэр, загвар, агент эсвэл имэйл…" />
          <select name="filter" aria-label="Шүүлтүүр" defaultValue={filter}>{CALL_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <button className="button secondary">Хайх</button>
          {(q || filter) && <Link className="text-link" href={link({ q: "", filter: "", page: 1 })}>Цэвэрлэх</Link>}
        </form>
      </div>
      {table(["Огноо", "Эх үүсвэр", "Хэн", "Үйлчилгээ", "Токен / нэгж", "Зардал"], rows.map(row => <tr key={row.id}>
        <td>{date(row.createdAt)}<small>{ENVIRONMENT_LABELS[row.environment] ?? row.environment}</small></td>
        <td>{sourceLabel(row.source)}</td>
        <td>{row.origin === "script" ? <>{row.agent || "Скрипт"}<small>агент / скрипт</small></> : person(row.user, row.userId)}</td>
        <td>{PROVIDER_LABELS[row.provider] ?? row.provider}<small>{row.model || "—"}{row.status !== "ok" ? " · " + (STATUS_LABELS[row.status] ?? row.status) + (row.httpStatus ? " " + row.httpStatus : "") : ""}</small></td>
        <td>{row.units ? <>{formatCredits(row.units)}<small>{row.provider === "deepinfra" && /kokoro/i.test(row.model) ? "тэмдэгт" : "мс аудио"}</small></> : <>{formatCredits(row.promptTokens)} → {formatCredits(row.completionTokens)}<small>{row.cachedTokens ? formatCredits(row.cachedTokens) + " кэш" : ""}{row.reasoningTokens ? (row.cachedTokens ? " · " : "") + formatCredits(row.reasoningTokens) + " бодолт" : ""}</small></>}</td>
        <td><strong>{row.billable ? formatUsd(row.costMicroUsd) : "$0"}</strong><small>{!row.billable ? "туршилтын сервер" : row.status === "timeout" ? "тодорхойгүй: үйлчилгээ тооцсон байж магадгүй" : row.costBasis === "provider" ? "үйлчилгээний тооцоо" : row.costBasis === "tokens" ? "токен × үнэ" : "тооцоогүй"}</small></td>
      </tr>), "Энэ хугацаанд дуудлага бүртгэгдээгүй.")}
      <Pager info={info} href={page => link({ page })} label="дуудлага" />
    </>;
  }

  await refreshDeepseekBalance();
  const [report, balance] = await Promise.all([aiUsageReport(since), balanceCheck(since)]);
  const untracked = balance.currency === "USD" ? balance.dropMicros - balance.trackedMicroUsd : null;
  const unrecorded = balance.readings < 2 ? ["Бүртгэлгүй зарцуулалт", "—", "Үлдэгдлийг 2+ удаа уншсаны дараа гарна"] as const
    : untracked === null ? ["Бүртгэлгүй зарцуулалт", currency(balance.dropMicros, balance.currency), "Үлдэгдэл " + balance.currency + "-аар: бүртгэлтэй " + formatUsd(balance.trackedMicroUsd)] as const
      : ["Бүртгэлгүй зарцуулалт", formatUsd(Math.max(0, untracked)), Math.abs(untracked) <= 10_000 * balance.segments.length ? "Үлдэгдэлтэй тохирч байна (±$0.01 бүрт)" : "Үлдэгдлээс гарсан ч энд бүртгэгдээгүй"] as const;
  return <>
    <SubTabs items={[["", "Тойм"], ["calls", "Дуудлагууд", report.calls]]} current="" href={key => link({ view: key, page: 1 })} />
    {ranges}
    {untracked !== null && balance.readings >= 2 && Math.abs(untracked) > 10_000 * balance.segments.length && untracked > 0 && <p className="admin-warning" role="note">DeepSeek-ийн үлдэгдлээс {formatUsd(balance.dropMicros)} гарсан, энэ орчинд {formatUsd(balance.trackedMicroUsd)} бүртгэгдсэн. Зөрүү {formatUsd(untracked)}: ижил түлхүүрийг ашигласан өөр орчин (сайт эсвэл локал) эсвэл бүртгэлгүй скрипт.</p>}
    <Metrics items={[
      ["Бодит зардал", formatUsd(report.costMicroUsd), `${formatCredits(report.calls)} дуудлага${report.failed ? ` · ${report.failed} амжилтгүй` : ""}`],
      ["Сайтын онцлогууд", formatUsd(report.appMicroUsd), "Суралцагч, админы үйлдэл"],
      ["Скрипт, агент", formatUsd(report.scriptMicroUsd), "Контент үүсгэх, шалгах ажил"],
      unrecorded,
    ]} />
    <div className="admin-split admin-split-wide">
      <section className="admin-block"><h3>Эх үүсвэрээр</h3>{table(["Эх үүсвэр", "Төрөл", "Дуудлага", "Зардал", "Токен"], report.bySource.map(row => <tr key={row.origin + row.source}>
        <td><Link href={link({ view: "calls", q: row.source, filter: "", page: 1 })}>{sourceLabel(row.source)}</Link></td>
        <td>{row.origin === "script" ? "Скрипт, агент" : "Сайт"}</td>
        <td>{formatCredits(row.calls)}</td>
        <td><strong style={ONE_LINE}>{formatUsd(row.costMicroUsd)}</strong></td>
        <td>{formatCredits(row.promptTokens)} → {formatCredits(row.completionTokens)}</td>
      </tr>), "Энэ хугацаанд бодит AI дуудлага алга.")}</section>
      <section className="admin-block"><h3>Өдрөөр (Улаанбаатар)</h3>{table(["Өдөр", "Дуудлага", "Зардал"], report.byDay.map(row => <tr key={row.day}><td>{row.day}</td><td>{formatCredits(row.calls)}</td><td><strong style={ONE_LINE}>{formatUsd(row.cost)}</strong></td></tr>), "Өгөгдөл алга.")}</section>
    </div>
    <div className="admin-split admin-split-wide">
      <section className="admin-block"><h3>Хэрэглэгчээр</h3>{table(["Хэрэглэгч", "Дуудлага", "Зардал"], report.byUser.map(row => <tr key={row.userId}><td>{person(row.user, row.userId)}</td><td>{formatCredits(row.calls)}</td><td><strong style={ONE_LINE}>{formatUsd(row.costMicroUsd)}</strong></td></tr>), "Хэрэглэгчийн дуудлага алга.")}</section>
      <section className="admin-block"><h3>Үйлчилгээ, загвар</h3>{table(["Үйлчилгээ", "Дуудлага", "Зардал"], report.byProvider.map(row => <tr key={row.provider + row.model}><td>{PROVIDER_LABELS[row.provider] ?? row.provider}<small>{row.model || "—"}</small></td><td>{formatCredits(row.calls)}</td><td><strong style={ONE_LINE}>{formatUsd(row.costMicroUsd)}</strong></td></tr>), "Алга.")}</section>
    </div>
    <div className="admin-split admin-split-wide">
      <section className="admin-block"><h3>DeepSeek үлдэгдэлтэй тулгалт</h3>{table(["Хугацаа", "Үлдэгдлээс гарсан", "Бүртгэсэн", "Зөрүү"], balance.segments.slice(0, 12).map(segment => <tr key={segment.from.toISOString()}>
        <td>{date(segment.from)} → {date(segment.to)}</td>
        <td>{segment.topUp ? <>Цэнэглэсэн<small>+{currency(-segment.dropMicros, segment.currency)}</small></> : currency(segment.dropMicros, segment.currency)}</td>
        <td>{formatUsd(segment.trackedMicroUsd)}</td>
        <td>{segment.topUp || segment.currency !== "USD" ? "—" : <strong style={ONE_LINE}>{formatUsd(segment.dropMicros - segment.trackedMicroUsd)}</strong>}</td>
      </tr>), "Үлдэгдлийг хоёр удаа уншсаны дараа энд харагдана.")}</section>
      <section className="admin-block"><h3>Орчин, агент</h3><div className="ws-card"><ul className="admin-log">
        {report.byEnvironment.map(row => <li key={row.environment}><strong>{ENVIRONMENT_LABELS[row.environment] ?? row.environment}</strong><span>{formatCredits(row.calls)} дуудлага</span><small>{formatUsd(row.costMicroUsd)}</small></li>)}
        {report.byAgent.map(row => <li key={"agent" + row.agent}><strong>{row.agent || "Нэргүй скрипт"}</strong><span>{formatCredits(row.calls)} дуудлага</span><small>{formatUsd(row.costMicroUsd)}</small></li>)}
        {balance.latest && <li><strong>DeepSeek үлдэгдэл</strong><span>{date(balance.latest.at)}</span><small>{currency(balance.latest.totalMicros, balance.latest.currency)}</small></li>}
        {report.mock ? <li><strong>Туршилтын сервер</strong><span>{formatCredits(report.mock)} дуудлага</span><small>$0, тооцоонд ороогүй</small></li> : null}
        {report.unknownCost ? <li><strong>Хугацаа хэтэрсэн</strong><span>{report.unknownCost} дуудлага</span><small>үнэ тодорхойгүй</small></li> : null}
      </ul></div></section>
    </div>
    <How title="Хэрхэн тооцдог вэ">
      <p>Сайтын бүх AI дуудлага (DeepSeek, Claude, DeepInfra) болон скрипт, агентын дуудлага бүр нэг мөр болж хадгалагдана: хэн, ямар онцлог, үйлчилгээний мэдээлсэн токен, үнэ. DeepSeek: оргил цагт (ажлын өдөр 09–12, 14–18 Улаанбаатар) оролт ${AI_RATES.deepseek.flash.miss}, кэш ${AI_RATES.deepseek.flash.hit}, гаралт ${AI_RATES.deepseek.flash.output} / 1M токен, бусад цагт хагас үнэ. Claude: загварын жагсаалтын үнэ. DeepInfra: үйлчилгээний өөрийн тооцоо. Үнийг {AI_RATES.checkedOn}-нд шалгасан.</p>
      <p>Туршилтын (mock) серверт очсон дуудлага $0. Хугацаа хэтэрсэн дуудлагыг үйлчилгээ тооцсон байж болох тул үнэ тодорхойгүй гэж тэмдэглэнэ. DeepSeek-ийн үлдэгдлийг энэ хуудсыг нээх бүрт (5 минутад нэг удаа) уншиж, хоёр уншилтын хооронд гарсан мөнгийг бүртгэсэн дуудлагатай тулгана. Сайт ба локал нэг түлхүүр ашиглавал нөгөө орчны зардал энд &ldquo;бүртгэлгүй&rdquo; болж харагдана; тусдаа түлхүүр өгвөл тодорхой болно.</p>
      <p>Скрипт, агент <code>scripts/lib/ai-call.mjs</code>-ийн <code>aiFetch</code>-ийг ашиглана; <code>AI_USAGE_AGENT</code> нь агентын нэр. Локал өгөгдлийн сан унтарсан үед мөр <code>artifacts/ai-usage-unsaved.jsonl</code>-д хадгалагдаж, <code>npm run ai:usage -- flush</code> түүнийг оруулна.</p>
    </How>
  </>;
}
