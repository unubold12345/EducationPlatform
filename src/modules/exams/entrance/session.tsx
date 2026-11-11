"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { MathScratchpad } from "@/components/math-scratchpad";
import { useQuestionShortcuts } from "../session-tools";
import { MathText, MathFormula } from "../math-text";
import { RichText } from "../rich-text";
import { ExamFigureView } from "../figure";
import type { ExamGroup, PublicExamAttempt, PublicQuestion } from "../types";
import { EntranceResults } from "./results";
import { entranceSubjectLabels, subjectFromSlug } from "./subjects";
import "./entrance.css";

type Page = { id: string; group?: ExamGroup; indexes: number[] };
const time = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
const subjectName = (subject: PublicExamAttempt["subject"]) => entranceSubjectLabels[subject ?? "math"];
// Mathematics and Physics typeset short formulas with KaTeX; Chemistry and Biology keep their Unicode formulas as text.
const mathSubject = (subject: PublicExamAttempt["subject"]) => subject === "math" || subject === "physics";
const langOf = (subject: PublicExamAttempt["subject"]) => subject === "english" ? "en" : "mn";

export function EntranceRunner({ initial }: { initial: PublicExamAttempt }) {
  return initial.report ? <EntranceResults attempt={initial} /> : <EntranceSession initial={initial} />;
}

function EntranceSession({ initial }: { initial: PublicExamAttempt }) {
  const [attempt, setAttempt] = useState(initial);
  const [answers, setAnswers] = useState(initial.responses);
  const [flags, setFlags] = useState(initial.flags);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(Math.max(0, Math.ceil((Date.parse(initial.deadline) - Date.parse(initial.serverNow)) / 1000)));
  const [status, setStatus] = useState("Хадгалсан");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [focusId, setFocusId] = useState<string | undefined>(initial.stage?.questions[0]?.id);  const latest = useRef(initial);
  const draft = useRef({ ...initial.responses });
  const flagDraft = useRef(initial.flags);
  const generation = useRef(0);
  const savedGeneration = useRef(0);
  const busy = useRef(false);
  const paused = useRef(false);
  const anchor = useRef({ server: Date.parse(initial.serverNow), performance: 0 });
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const worker = useRef<(mode: "save" | "sync", force?: boolean) => Promise<void>>(async () => {});
  const heading = useRef<HTMLHeadingElement>(null);
  const endpoint = "/api/mock-attempts/" + initial.id;
  const stage = (attempt.stage ?? initial.stage)!;
  const questions = stage.questions;
  const subject = attempt.subject ?? initial.subject ?? subjectFromSlug(attempt.slug) ?? "math";

  const pages = useMemo<Page[]>(() => {
    const result: Page[] = [];
    const seen = new Set<number>();
    for (const group of stage.groups ?? []) {
      const indexes = questions.map((question, at) => question.groupId === group.id ? at : -1).filter(at => at >= 0);
      if (!indexes.length) continue;
      indexes.forEach(at => seen.add(at));
      if (group.pageMode === "group") result.push({ id: "g-" + group.id, group, indexes });
      else indexes.forEach(at => result.push({ id: "q-" + questions[at].id, group, indexes: [at] }));
    }
    questions.forEach((question, at) => { if (!seen.has(at)) result.push({ id: "q-" + question.id, indexes: [at] }); });
    return result;
  }, [stage, questions]);
  const pageIndex = Math.max(0, pages.findIndex(page => page.indexes.includes(index)));
  const page = pages[pageIndex] ?? { id: "q-" + questions[0]?.id, indexes: [0] };
  const answered = questions.filter(question => answers[question.id]?.trim()).length;
  const sheetSections = useMemo(() => {
    const order: string[] = [];
    const sections = new Map<string, { title: string; items: { question: PublicQuestion; at: number }[] }>();
    const groups = stage.groups?.length ? stage.groups : [{ id: "all", title: stage.title }];
    for (const group of groups) {
      const title = group.section ?? group.title ?? stage.title;
      if (!sections.has(title)) { sections.set(title, { title, items: [] }); order.push(title); }
      questions.forEach((question, at) => { if (question.groupId === group.id) sections.get(title)!.items.push({ question, at }); });
    }
    const known = new Set(order.flatMap(title => sections.get(title)!.items.map(item => item.at)));
    const rest = questions.map((question, at) => ({ question, at })).filter(item => !known.has(item.at));
    if (rest.length) { sections.set("rest", { title: "Бусад", items: rest }); order.push("rest"); }
    return order.map(title => sections.get(title)!);
  }, [stage, questions]);
  const activeId = focusId && page.indexes.some(at => questions[at].id === focusId) ? focusId : questions[page.indexes[0]]?.id;
  const activeQuestion = questions.find(question => question.id === activeId);
  const passage = activeQuestion?.passage ? stage.passages?.find(item => item.title === activeQuestion.passage)?.text ?? activeQuestion.passage : "";

  function accept(data: PublicExamAttempt, saved?: number, force = false) {
    const old = latest.current;
    const moved = old.stage?.id !== data.stage?.id;
    if (!moved && !force && saved === undefined && data.revision !== old.revision && !data.report) {
      paused.current = true; setConflict(true);
      setError("Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаалж үргэлжлүүлнэ үү.");
      return;
    }
    const previousStage = latest.current.stage ?? initial.stage;
    const next = data.stage ? data : { ...data, stage: previousStage };
    latest.current = next;
    anchor.current = { server: Date.parse(data.serverNow), performance: performance.now() };
    // A finished paper no longer returns its question stage; keep the last copy for the results view.
    setAttempt(next);
    if (moved || force) {
      draft.current = { ...data.responses }; flagDraft.current = data.flags;
      generation.current++; savedGeneration.current = generation.current;
      setAnswers(data.responses); setFlags(data.flags); setIndex(0); setFocusId(data.stage?.questions[0]?.id);
      paused.current = false; setConflict(false); setError(""); setStatus("Хадгалсан"); setSheet(false);
    } else if (saved !== undefined) {
      savedGeneration.current = saved;
      if (generation.current === saved) { draft.current = { ...data.responses }; setAnswers(data.responses); }
      setStatus(generation.current === saved ? "Хадгалсан" : "Хадгалж байна…");
    }
  }

  async function network(mode: "save" | "sync", force = false) {
    if (busy.current || (!force && paused.current)) return;
    if (mode === "save" && generation.current === savedGeneration.current) return;
    busy.current = true;
    const current = latest.current;
    const snapshot = generation.current;
    const known = current.stage ? endpoint + "?have=" + encodeURIComponent(current.stage.id) : endpoint;
    try {
      let response: Response;
      if (mode === "save" && current.stage) {
        setStatus("Хадгалж байна…");
        const ids = new Set(current.stage.questions.map(question => question.id));
        response = await fetch(known, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: current.revision, stageId: current.stage.id, responses: Object.fromEntries(Object.entries(draft.current).filter(([id]) => ids.has(id))), flags: flagDraft.current.filter(id => ids.has(id)) }),
          signal: AbortSignal.timeout(15000),
        });
      } else response = await fetch(known, { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (response.status === 409) { paused.current = true; setConflict(true); throw Error("conflict"); }
      if (response.status === 401) { setError("Нэвтрэх хугацаа дууссан. Шинэ цонхонд нэвтэрч, дахин хадгална уу."); return; }
      if (!response.ok) throw Error("network");
      const data = await response.json() as PublicExamAttempt;
      accept(data.stageUnchanged ? { ...data, stage: current.stage } : data, mode === "save" ? snapshot : undefined, force);
      if (!paused.current) setError("");
    } catch (reason) {
      setStatus("Хадгалагдаагүй");
      setError(reason instanceof Error && reason.message === "conflict" ? "Өөр цонхонд өөрчлөлт байна. Хадгалсан хувилбарыг ачаална уу." : "Холболт тасарсан байна. Энэ хуудсыг нээлттэй байлгаж дахин хадгална уу. Шалгалтын цаг үргэлжилж байна.");
    } finally {
      busy.current = false;
      if (generation.current !== savedGeneration.current && !paused.current && !latest.current.finishedAt) {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => void worker.current("save"), 1500);
      }
    }
  }
  useEffect(() => { worker.current = network; });
  useEffect(() => {
    anchor.current.performance = performance.now();
    const tick = setInterval(() => {
      const state = latest.current;
      if (state.finishedAt) return;
      const now = anchor.current.server + performance.now() - anchor.current.performance;
      const seconds = Math.max(0, Math.ceil((Date.parse(state.deadline) - now) / 1000));
      setRemaining(seconds);
      if (seconds === 0) void worker.current(generation.current !== savedGeneration.current ? "save" : "sync");
    }, 250);
    const poll = setInterval(() => { if (!latest.current.finishedAt) void worker.current(generation.current !== savedGeneration.current ? "save" : "sync"); }, 10000);
    function beforeUnload(event: BeforeUnloadEvent) { if (generation.current !== savedGeneration.current) event.preventDefault(); }
    window.addEventListener("beforeunload", beforeUnload);
    return () => { clearInterval(tick); clearInterval(poll); clearTimeout(debounce.current); window.removeEventListener("beforeunload", beforeUnload); };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [attempt.stage?.id]);

  const changeFor = useCallback((id: string, value: string) => {
    if (paused.current || latest.current.finishedAt || !latest.current.stage?.questions.some(question => question.id === id)) return;
    draft.current = { ...draft.current, [id]: value };
    generation.current++; setAnswers(draft.current); setStatus("Хадгалж байна…");
    clearTimeout(debounce.current); debounce.current = setTimeout(() => void worker.current("save"), 500);
  }, []);
  const flagFor = useCallback((id: string) => {
    if (paused.current || latest.current.finishedAt || !latest.current.stage?.questions.some(question => question.id === id)) return;
    flagDraft.current = flagDraft.current.includes(id) ? flagDraft.current.filter(item => item !== id) : [...flagDraft.current, id];
    generation.current++; setFlags(flagDraft.current); setStatus("Хадгалж байна…");
    clearTimeout(debounce.current); debounce.current = setTimeout(() => void worker.current("save"), 500);
  }, []);
  const goTo = useCallback((at: number) => {
    setIndex(at);
    const id = questions[at]?.id;
    if (id) setFocusId(id);
    requestAnimationFrame(() => {
      const target = id ? document.getElementById("eesh-q-" + id) : null;
      target?.scrollIntoView({ block: "nearest" });
      target?.focus({ preventScroll: true });
    });
  }, [questions]);
  const goPage = useCallback((delta: number) => {
    const target = pages[pageIndex + delta];
    if (!target) return;
    const at = target.indexes.find(item => !answers[questions[item].id]?.trim()) ?? target.indexes[0];
    goTo(at);
  }, [pages, pageIndex, answers, questions, goTo]);

  useQuestionShortcuts({
    onPrevious: () => { if (!sheet) goPage(-1); },
    onNext: () => { if (!sheet) goPage(1); },
    onFlag: () => { if (!sheet && activeId) flagFor(activeId); },
    onOption: option => {
      if (sheet || !activeQuestion || activeQuestion.kind !== "choice" || paused.current) return;
      const value = activeQuestion.options?.[option];
      if (value) changeFor(activeQuestion.id, value);
    },
  });
  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setSheet(false); }
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [sheet]);

  if (attempt.report) return <EntranceResults attempt={attempt} />;

  const timeNotice = remaining <= 60 ? "1 минутаас бага хугацаа үлдлээ. " + (questions.length - answered) + " асуултад хариулаагүй." : remaining <= 300 ? "5 минутаас бага хугацаа үлдлээ." : "";
  const group = page.group;
  const pageQuestions = page.indexes.map(at => ({ question: questions[at], at }));
  const subjectText = subjectName(subject);
  const stageParts = stage.title.split(" · ");
  const headTitle = stageParts[0] || subjectText;
  const headMeta = stageParts.slice(1).join(" · ") || subjectText;
  return <div className="eesh-sit" lang={subject === "english" ? "en" : "mn"}>
    <header className="eesh-sit-bar">
      <Link className="eesh-sit-back" href={"/exams/" + attempt.slug} aria-label="Шалгалтын танилцуулга руу буцах">←</Link>
      <div className="eesh-sit-title">
        <p>ЭЕШ · {headMeta}</p>
        <h1>{headTitle}</h1>
      </div>
      <div className="eesh-sit-timer" role="timer" aria-label="Үлдсэн хугацаа"><span className={remaining <= 300 ? "urgent" : ""}>{time(remaining)}</span><small>үлдсэн</small></div>
      <div className="eesh-sit-actions">
        <button type="button" className="eesh-sheet-open" onClick={() => setSheet(true)} aria-label="Хариултын хуудас"><span className="eesh-sheet-label">Хариултын хуудас</span> <span>{answered}/{questions.length}</span></button>
      </div>
    </header>
    <div className="eesh-sit-progress" aria-hidden="true"><i style={{ width: Math.round((answered / Math.max(1, questions.length)) * 100) + "%" }} /></div>
    <div className="eesh-sit-status"><span role="status">{status}</span><span>{pageIndex + 1} / {pages.length} хуудас</span></div>
    <p className="sr-only" aria-live="polite">{timeNotice}</p>
    {error ? <div className="eesh-sit-error" role="alert"><p>{error}</p><div>{conflict ? <button type="button" className="button secondary" onClick={() => void network("sync", true)}>Хадгалсан хувилбарыг ачаалах</button> : <button type="button" className="button secondary" onClick={() => void network("save")}>Дахин хадгалах</button>}<a className="text-link" href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</a></div></div> : null}

    <main className="eesh-sit-main">
      <div className={"eesh-page" + (passage ? " has-passage" : "")}>
        {passage ? <aside className="eesh-passage" aria-label="Унших эх">
          <header><p className="eyebrow">ЭХ ТЕКСТ</p><h2>{activeQuestion?.passage}</h2></header>
          <div className="eesh-passage-text"><RichText text={passage} /></div>
        </aside> : null}
        <div className="eesh-page-body">
          {page.indexes.length > 1 || group?.pageMode === "group" ? <GroupPage group={group} items={pageQuestions} answers={answers} flags={flags} conflict={conflict} subject={subject} onChange={changeFor} onFlag={flagFor} onFocus={setFocusId} /> : pageQuestions[0] ? <SinglePage question={pageQuestions[0].question} group={group} answers={answers} flags={flags} conflict={conflict} subject={subject} onChange={changeFor} onFlag={flagFor} onFocus={setFocusId} heading={heading} /> : null}
          <nav className="eesh-page-nav" aria-label="Хуудас шилжүүлэх">
            <button type="button" className="eesh-page-prev" disabled={pageIndex === 0} onClick={() => goPage(-1)}>← Өмнөх</button>
            {pageIndex < pages.length - 1 ? <button type="button" className="eesh-page-next" onClick={() => goPage(1)}>Дараах →</button> : <button type="button" className="eesh-page-next" onClick={() => setSheet(true)}>Хариултаа шалгах →</button>}
          </nav>
        </div>
      </div>
      {subject !== "english" ? <MathScratchpad key={attempt.id + ":" + stage.id} attemptId={attempt.id} /> : null}
    </main>

    {sheet ? <div className="eesh-sheet-backdrop" role="presentation" onClick={() => setSheet(false)}>
      <aside className="eesh-sheet" role="dialog" aria-modal="true" aria-label="Хариултын хуудас" onClick={event => event.stopPropagation()}>
        <header><div><p className="eyebrow">ХАРИУЛТЫН ХУУДАС</p><h2>{answered} / {questions.length} хариулсан</h2></div><button type="button" aria-label="Хаах" onClick={() => setSheet(false)}>×</button></header>
        <div className="eesh-sheet-legend"><span>Хариулсан</span><span>Тэмдэгтэй</span><span>Одоо</span></div>
        <div className="eesh-sheet-groups">
          {sheetSections.map(sheetGroup => {
            const items = sheetGroup.items;
            if (!items.length) return null;
            return <section key={sheetGroup.title} className="eesh-sheet-group">
              <h3>{sheetGroup.title}<span>{items.filter(item => answers[item.question.id]?.trim()).length} / {items.length}</span></h3>
              <div className="eesh-sheet-buttons">{items.map(({ question, at }) => <button key={question.id} type="button" data-current={at === index ? "" : undefined} data-answered={answers[question.id]?.trim() ? "" : undefined} data-flagged={flags.includes(question.id) ? "" : undefined} onClick={() => { goTo(at); setSheet(false); }} aria-label={question.number + (answers[question.id]?.trim() ? ", хариулсан" : "") + (flags.includes(question.id) ? ", тэмдэгтэй" : "")}>{question.number}</button>)}</div>
            </section>;
          })}
        </div>
        <p className="eesh-sheet-note">Тэмдэгтэй асуултыг дараа нь эргэж харна. Хариу автоматаар хадгалагдана.</p>
      </aside>
    </div> : null}
  </div>;
}

function ChoiceList({ question, subject, selected, disabled, onChange, onFocus, dense = false }: { question: PublicQuestion; subject: PublicExamAttempt["subject"]; selected?: string; disabled: boolean; onChange: (value: string) => void; onFocus: () => void; dense?: boolean }) {
  const options = question.options ?? [];
  if (!options.length) return null;
  const labels = question.optionLabels ?? options.map((_, at) => String.fromCharCode(65 + at));
  const content = (option: string) => subject === "math" ? <MathFormula text={option} /> : subject === "english" ? <RichText text={option} /> : <span>{option}</span>;
  if (question.compactOptions) return <fieldset className="eesh-labels" disabled={disabled} onFocus={onFocus}>
    <legend className="sr-only">{question.number} хариулт</legend>
    {options.map((option, at) => <label key={option} title={option} className={selected === option ? "is-selected" : undefined}>
      <input type="radio" name={question.id} checked={selected === option} onChange={() => onChange(option)} aria-label={labels[at] + ". " + option} />
      <span>{labels[at]}</span>
    </label>)}
  </fieldset>;
  if (dense) return <fieldset className="eesh-chip-options" disabled={disabled} onFocus={onFocus}>
    <legend className="sr-only">{question.number} хариулт</legend>
    {options.map((option, at) => <label key={option} className={selected === option ? "is-selected" : undefined}>
      <input type="radio" name={question.id} checked={selected === option} onChange={() => onChange(option)} aria-label={labels[at] + ". " + option} />
      <span className="eesh-chip-label">{labels[at]}</span>
      <span className="eesh-chip-text">{content(option)}</span>
    </label>)}
  </fieldset>;
  return <fieldset className="eesh-choices" disabled={disabled} onFocus={onFocus}>
    <legend className="sr-only">{question.number} хариулт</legend>
    {options.map((option, at) => <label key={option} className={selected === option ? "is-selected" : undefined}>
      <input type="radio" name={question.id} checked={selected === option} onChange={() => onChange(option)} />
      <span className="eesh-choice-label">{labels[at]}</span>
      <span className="eesh-choice-text">{content(option)}</span>
    </label>)}
  </fieldset>;
}

const mathKeys = ["√", "π", "²", "³", "−", "/", "(", ")", "[", "]", ";"];
function AnswerInput({ question, subject, value, disabled, onChange, onFocus, showLabel = true }: { question: PublicQuestion; subject: PublicExamAttempt["subject"]; value: string; disabled: boolean; onChange: (value: string) => void; onFocus: () => void; showLabel?: boolean }) {
  const numeric = question.kind === "number";
  return <div className="eesh-answer-input" onFocus={onFocus}>
    <label>
      <span className={showLabel ? undefined : "sr-only"}>{numeric ? "Хариу · тоо эсвэл бутархай" : "Хариу"}</span>
      <input value={value} disabled={disabled} maxLength={160} autoComplete="off" spellCheck={false} onChange={event => onChange(event.target.value)} aria-label={question.number + " хариу"} placeholder={showLabel ? (numeric ? "Жишээ: -3, 9/2 эсвэл 1.5e-6" : "Хариугаа бич") : (numeric ? "Тоон хариу" : "Хариу")} />
    </label>
    {subject === "math" && question.matcher === "math" ? <div className="eesh-keypad" role="group" aria-label="Математик тэмдэг">
      {mathKeys.map(key => <button key={key} type="button" onClick={() => onChange(value + key)} tabIndex={-1}>{key}</button>)}
    </div> : null}
  </div>;
}

function FlagButton({ question, flagged, disabled, onFlag }: { question: PublicQuestion; flagged: boolean; disabled: boolean; onFlag: () => void }) {
  return <button type="button" className="eesh-flag" aria-pressed={flagged} aria-label={question.number + " асуултыг тэмдэглэх"} disabled={disabled} onClick={onFlag}>{flagged ? "⚑" : "⚐"}<span>{flagged ? "Тэмдэглэсэн" : "Дараа харах"}</span></button>;
}

function ContextBlock({ group }: { group?: ExamGroup }) {
  if (!group?.context) return null;
  return <section className={"eesh-context" + (group.kind === "listening" ? " is-listening" : "")}>
    <p className="eyebrow">{group.kind === "listening" ? "LISTENING · ТЕКСТ" : (group.contextTitle ?? "ӨГӨГДӨЛ")}</p>
    {group.kind === "listening" ? <p className="eesh-context-note">Энэ mock-д бичлэг оруулаагүй. Доорх текстийг уншиж хариулна уу.</p> : null}
    <div className="eesh-context-text"><RichText text={group.context} /></div>
  </section>;
}

function WordBank({ bank }: { bank: NonNullable<ExamGroup["wordBank"]> }) {
  return <section className="eesh-bank" aria-label="Сонголтын сан">
    <p className="eyebrow">СОНГОЛТУУД</p>
    <ol>{bank.map(item => <li key={item.label}><span>{item.label}</span><RichText text={item.text} /></li>)}</ol>
  </section>;
}

function SinglePage({ question, group, answers, flags, conflict, subject, onChange, onFlag, onFocus, heading }: { question: PublicQuestion; group?: ExamGroup; answers: Record<string, string>; flags: string[]; conflict: boolean; subject: PublicExamAttempt["subject"]; onChange: (id: string, value: string) => void; onFlag: (id: string) => void; onFocus: (id: string) => void; heading: RefObject<HTMLHeadingElement | null> }) {
  const math = mathSubject(subject);
  return <section className="eesh-question" id={"eesh-q-" + question.id} tabIndex={-1} onFocus={() => onFocus(question.id)}>
    <header className="eesh-question-head">
      <div><p className="eyebrow">{group?.section ?? "ДААЛГАВАР"}</p><strong>{question.number ?? ""} <span>/ {question.points ?? 1} оноо</span></strong></div>
      <FlagButton question={question} flagged={flags.includes(question.id)} disabled={conflict} onFlag={() => onFlag(question.id)} />
    </header>
    {group?.instructions && subject === "english" ? <div className="eesh-question-instructions" lang="en"><RichText text={group.instructions} /></div> : null}
    <ContextBlock group={group} />
    {group?.figure ? <ExamFigureView figure={group.figure} /> : null}
    {question.figure ? <ExamFigureView figure={question.figure} /> : null}
    <h2 ref={heading} tabIndex={-1} lang={langOf(subject)}>{math ? <MathText text={question.prompt} /> : <RichText text={question.prompt} />}</h2>
    {question.kind === "choice" ? <ChoiceList question={question} subject={subject} selected={answers[question.id]} disabled={conflict} onChange={value => onChange(question.id, value)} onFocus={() => onFocus(question.id)} /> : <AnswerInput question={question} subject={subject} value={answers[question.id] ?? ""} disabled={conflict} onChange={value => onChange(question.id, value)} onFocus={() => onFocus(question.id)} />}
  </section>;
}

function GroupPage({ group, items, answers, flags, conflict, subject, onChange, onFlag, onFocus }: { group?: ExamGroup; items: { question: PublicQuestion; at: number }[]; answers: Record<string, string>; flags: string[]; conflict: boolean; subject: PublicExamAttempt["subject"]; onChange: (id: string, value: string) => void; onFlag: (id: string) => void; onFocus: (id: string) => void }) {
  const math = mathSubject(subject);
  return <section className="eesh-group" id={"eesh-g-" + (group?.id ?? "group")}>
    <header className="eesh-group-head">
      <p className="eyebrow">{group?.section ?? "ДААЛГАВАР"}</p>
      <h2>{group?.title ?? "Даалгавар"}</h2>
      {group?.instructions ? <div lang={langOf(subject)}>{math ? <MathText text={group.instructions} /> : <RichText text={group.instructions} />}</div> : null}
    </header>
    {group?.figure ? <ExamFigureView figure={group.figure} /> : null}
    <ContextBlock group={group} />
    {group?.wordBank?.length ? <WordBank bank={group.wordBank} /> : null}
    <div className="eesh-parts">{items.map(({ question }) => <article className="eesh-part" id={"eesh-q-" + question.id} key={question.id} tabIndex={-1} onFocus={() => onFocus(question.id)}>
      <header><strong>{question.number}</strong>{question.prompt ? <span lang={langOf(subject)}>{math ? <MathText text={question.prompt} /> : <RichText text={question.prompt} />}</span> : null}<small>{question.points ?? 1} оноо</small><FlagButton question={question} flagged={flags.includes(question.id)} disabled={conflict} onFlag={() => onFlag(question.id)} /></header>
      {question.kind === "choice" ? <ChoiceList question={question} subject={subject} selected={answers[question.id]} disabled={conflict} onChange={value => onChange(question.id, value)} onFocus={() => onFocus(question.id)} dense /> : <AnswerInput question={question} subject={subject} value={answers[question.id] ?? ""} disabled={conflict} onChange={value => onChange(question.id, value)} onFocus={() => onFocus(question.id)} showLabel={false} />}
    </article>)}</div>
  </section>;
}
