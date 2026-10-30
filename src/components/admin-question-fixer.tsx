"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EditableQuestion } from "@/modules/content/fix";

const PAGE = 15;
const answerText = (q: EditableQuestion) => q.correct !== undefined && q.options ? q.options[q.correct] ?? "—" : q.answers?.join(" / ") || "Хүний үнэлгээ";

// Searchable, paginated question list; each question opens an inline fix form that publishes a new
// version through the server (validation, answer-key checks and the audit record happen there).
export function AdminQuestionFixer({ contentKey, questions, revision, draftPending }: { contentKey: string; questions: EditableQuestion[]; revision: number; draftPending: boolean }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? questions.filter(item => [item.id, item.prompt, item.section, item.passage ?? "", ...(item.options ?? []), ...(item.answers ?? [])].some(text => text.toLowerCase().includes(q))) : questions;
  }, [questions, query]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE)), current = Math.min(page, pages);
  const slice = shown.slice((current - 1) * PAGE, current * PAGE);
  return <section className="admin-fixer">
    <div className="admin-fixer-bar">
      <label className="sr-only" htmlFor="fixer-search">Асуулт хайх</label>
      <input id="fixer-search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="ID, асуулт, сонголт эсвэл хариугаар хайх…"/>
      <span>{shown.length} / {questions.length} асуулт</span>
    </div>
    {draftPending && <p className="admin-warning" role="note">Нийтлээгүй ноорог байна. Асуулт засахаас өмнө доорх “Бүтэн засварлагч” хэсэгт нийтэлнэ үү.</p>}
    <ol className="admin-questions" start={(current - 1) * PAGE + 1}>
      {slice.map(item => {
        const key = item.path.join(".");
        return <li key={key}>
          <div className="admin-question-head">
            <div><small>{item.section} · {item.id} · {item.kind}</small><p>{item.prompt || "(асуултын текст хоосон)"}</p></div>
            <div className="admin-question-answer"><small>Зөв хариу</small><strong>{answerText(item)}</strong></div>
            <button type="button" className="admin-small-button" aria-expanded={open === key} disabled={draftPending} onClick={() => setOpen(open === key ? null : key)}>{open === key ? "Хаах" : "Засах"}</button>
          </div>
          {open === key && <FixForm contentKey={contentKey} item={item} revision={revision} onDone={() => setOpen(null)}/>}
        </li>;
      })}
    </ol>
    {!slice.length && <p className="admin-empty">Асуулт олдсонгүй.</p>}
    {pages > 1 && <nav className="admin-pager" aria-label="Асуултын хуудсууд"><span>{(current - 1) * PAGE + 1}–{Math.min(shown.length, current * PAGE)} / {shown.length}</span><div>
      <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Өмнөх хуудас">←</button>
      {Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - current) <= 2).map((n, i, list) => <span key={n}>{i && n - list[i - 1] > 1 ? <span aria-hidden="true">… </span> : null}<button type="button" aria-current={n === current ? "page" : undefined} onClick={() => setPage(n)}>{n}</button></span>)}
      <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Дараах хуудас">→</button>
    </div></nav>}
  </section>;
}

function FixForm({ contentKey, item, revision, onDone }: { contentKey: string; item: EditableQuestion; revision: number; onDone: () => void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(item.prompt);
  const [passage, setPassage] = useState(item.passage ?? "");
  const [options, setOptions] = useState(item.options ?? []);
  const [correct, setCorrect] = useState(item.correct ?? 0);
  const [answers, setAnswers] = useState((item.answers ?? []).join("\n"));
  const [explanation, setExplanation] = useState(item.explanation ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const choice = item.correct !== undefined || item.kind === "choice";
  const chosen = item.correct !== undefined ? options[correct] : answers.split("\n")[0];
  async function submit() {
    const patch: Record<string, unknown> = {};
    if (prompt !== item.prompt) patch.prompt = prompt;
    if (item.passage !== undefined && passage !== item.passage) patch.passage = passage;
    if (item.options && JSON.stringify(options) !== JSON.stringify(item.options)) patch.options = options;
    if (item.correct !== undefined && correct !== item.correct) patch.correct = correct;
    const list = answers.split("\n").map(line => line.trim()).filter(Boolean);
    if (item.answers && JSON.stringify(list) !== JSON.stringify(item.answers)) patch.answers = list;
    if (item.explanation !== undefined && explanation !== item.explanation) patch.explanation = explanation;
    if (!Object.keys(patch).length) { setMessage("Өөрчлөлт алга."); return; }
    if (reason.trim().length < 5) { setMessage("Засварын шалтгааныг 5-аас доошгүй тэмдэгтээр бичнэ үү."); return; }
    if (!window.confirm("Засварыг шинэ хувилбар болгон нийтлэх үү? Шинэ оролдлогууд энэ хувилбарыг ашиглана; өмнөх оролдлого хуучин хувилбараараа үлдэнэ.")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/content/" + contentKey, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fix", revision, path: item.path, patch, reason }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      onDone(); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Алдаа гарлаа."); }
    finally { setBusy(false); }
  }
  return <div className="admin-fix-form">
    <label>Асуулт<textarea value={prompt} rows={Math.min(8, 2 + Math.floor(prompt.length / 120))} maxLength={25000} onChange={event => setPrompt(event.target.value)}/></label>
    {item.passage !== undefined && <label>Унших эх<textarea value={passage} rows={5} maxLength={25000} onChange={event => setPassage(event.target.value)}/></label>}
    {item.options && <fieldset><legend>Сонголтууд{item.correct !== undefined ? " · зөвийг нь сонгоно" : ""}</legend>{options.map((option, i) => <div key={i} className="admin-option">
      {item.correct !== undefined && <input type="radio" name={"correct-" + item.id} aria-label={`Зөв хариу ${String.fromCharCode(65 + i)}`} checked={correct === i} onChange={() => setCorrect(i)}/>}
      <span>{String.fromCharCode(65 + i)}</span>
      <input aria-label={`Сонголт ${String.fromCharCode(65 + i)}`} value={option} maxLength={25000} onChange={event => { const next = [...options]; const old = next[i]; next[i] = event.target.value; setOptions(next); if (item.correct === undefined) setAnswers(answers.split("\n").map(line => line === old ? event.target.value : line).join("\n")); }}/>
    </div>)}</fieldset>}
    {item.answers && <label>{choice ? "Зөв хариу (сонголтын текстээр, мөр бүрт нэг)" : "Зөв хариунууд (мөр бүрт нэг хувилбар)"}<textarea value={answers} rows={Math.max(2, (item.answers.length || 1) + 1)} onChange={event => setAnswers(event.target.value)}/>{choice && item.options && <select aria-label="Зөв сонголт" value={options.includes(answers.split("\n")[0]) ? answers.split("\n")[0] : ""} onChange={event => setAnswers(event.target.value)}><option value="" disabled>Сонголтоос сонгох…</option>{options.map((option, i) => <option key={i} value={option}>{String.fromCharCode(65 + i)}. {option.slice(0, 80)}</option>)}</select>}</label>}
    {item.explanation !== undefined && <label>Тайлбар<textarea value={explanation} rows={3} maxLength={25000} onChange={event => setExplanation(event.target.value)}/></label>}
    <label>Засварын шалтгаан<input value={reason} maxLength={1000} onChange={event => setReason(event.target.value)} placeholder="Жишээ: B биш C зөв — хэрэглэгч мэдэгдсэн"/></label>
    <div className="admin-fix-actions"><small>Шинэ зөв хариу: <strong>{chosen || "—"}</strong></small><button type="button" className="button secondary" onClick={onDone} disabled={busy}>Болих</button><button type="button" className="button primary" onClick={submit} disabled={busy}>{busy ? "Нийтэлж байна…" : "Засаад нийтлэх"}</button></div>
    {message && <p role="status">{message}</p>}
  </div>;
}
