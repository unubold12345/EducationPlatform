"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicExamAttempt } from "@/modules/exams/types";
import { MathFormula, MathText } from "@/modules/exams/math-text";
import { RichText } from "@/modules/exams/rich-text";
import { JapaneseText } from "@/modules/exams/jlpt/text";
import { ExamFigureView } from "@/modules/exams/figure";
import { questionFigure } from "@/modules/exams/math-paper-model";
import { Icon } from "./icons";
import { ScoreRing } from "./score";
import { Markdown } from "./markdown";
import { CHAT_LIMITS, reviewModeLabels, type ChatTurn, type ReviewMode } from "./chat-contract";
import { programLabels } from "./programs";

type Review = NonNullable<PublicExamAttempt["report"]>["reviews"][number];
type Status = "correct" | "wrong" | "blank" | "pending";
type Filter = "all" | Status;
type TextKind = "math" | "ja" | "en";
const statusOf = (review: Review): Status => review.correct === null ? "pending" : review.correct ? "correct" : review.selected.trim() ? "wrong" : "blank";
const statusLabels: Record<Status, string> = { correct: "Зөв", wrong: "Алдсан", blank: "Хоосон", pending: "Хяналт" };
const filterLabels: [Filter, string][] = [["all", "Бүгд"], ["wrong", "Алдсан"], ["blank", "Хоосон"], ["correct", "Зөв"], ["pending", "Хяналт"]];
const LETTERS = "ABCDEFGHIJ";
const round = (value: number) => Math.round(value * 100) / 100;

function Text({ text, kind }: { text: string; kind: TextKind }) {
  if (kind === "math") return <MathText text={text} />;
  if (kind === "ja") return <JapaneseText text={text} />;
  return <RichText text={text} />;
}
function Answer({ text, kind }: { text: string; kind: TextKind }) {
  if (kind === "math") return <MathFormula text={text} />;
  return <Text text={text} kind={kind} />;
}

/** Review of one finished mock: scores, weakest skills, every question with its key, and an AI coach beside it. */
export function ReviewView({ attempt, options, finishedLabel }: { attempt: PublicExamAttempt; options: Record<string, string[]>; finishedLabel: string }) {
  const report = attempt.report!;
  const kind: TextKind = attempt.program === "jlpt" ? "ja" : attempt.program === "entrance" && attempt.subject !== "english" ? "math" : "en";
  const lang = kind === "ja" ? "ja" : kind === "math" ? "mn" : "en";
  const reviews = report.reviews;
  const counts = useMemo(() => {
    const value: Record<Filter, number> = { all: reviews.length, correct: 0, wrong: 0, blank: 0, pending: 0 };
    for (const review of reviews) value[statusOf(review)]++;
    return value;
  }, [reviews]);
  const [filter, setFilter] = useState<Filter>(counts.wrong ? "wrong" : "all");
  const [active, setActive] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<Record<string, ChatTurn[]>>({});
  const visible = reviews.filter(review => filter === "all" || statusOf(review) === filter);
  const percent = report.points.total ? Math.round((report.points.earned / report.points.total) * 100) : null;
  const weakest = useMemo(() => {
    const domains = new Map<string, { correct: number; total: number }>();
    for (const review of reviews) {
      if (review.pretest || review.correct === null) continue;
      const entry = domains.get(review.domain) ?? { correct: 0, total: 0 };
      entry.total++; if (review.correct) entry.correct++;
      domains.set(review.domain, entry);
    }
    return [...domains].filter(([, value]) => value.total >= 2).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).slice(0, 6);
  }, [reviews]);
  const activeReview = reviews.find(review => review.id === active) ?? null;
  const activeIndex = activeReview ? reviews.indexOf(activeReview) : -1;

  function askAbout(id: string) { setActive(id); setPanelOpen(true); }

  return <div className="wsp-page wsp-review">
    <Link className="wsp-back" href="/workspace/review"><Icon name="back" size={16} />Миний үр дүн</Link>
    <header className="wsp-review-head">
      <div>
        <p className="wsp-eyebrow">{programLabels[attempt.program]} · {finishedLabel}</p>
        <h1>{attempt.title}</h1>
        <div className="wsp-review-actions">
          <Link className="wsp-primary" href={"/exams/" + attempt.slug + "/practice"}>Цаггүй дадлагаар давтах <Icon name="arrow" size={18} /></Link>
          <Link className="wsp-ghost" href={"/exams/attempts/" + attempt.id}>Анхны үр дүнгийн хуудас</Link>
        </div>
      </div>
      <div className="wsp-score-card">
        <ScoreRing percent={percent} size={92} />
        <div><strong>{round(report.points.earned)}<span> / {report.points.total}</span></strong><p>{counts.correct} зөв · {counts.wrong} алдсан · {counts.blank} хоосон{counts.pending ? ` · ${counts.pending} хяналт` : ""}</p></div>
      </div>
    </header>

    <section className="wsp-sections" aria-label="Хэсэг бүрийн үр дүн">{report.sections.map(section => <div key={section.title} className="wsp-section-score">
      <span lang={attempt.program === "jlpt" ? "ja" : undefined}>{section.title}</span>
      {section.total ? <><strong>{round(section.earned)} <small>/ {section.points}</small></strong><i className="wsp-bar" aria-hidden="true"><b style={{ width: (section.points ? Math.round((section.earned / section.points) * 100) : 0) + "%" }} /></i><small>{section.correct} / {section.total} зөв</small></>
        : <><strong className="wsp-muted">Хяналт</strong><small>{section.pending} хариу · AI-аас санал авч болно</small></>}
    </div>)}</section>

    {weakest.length ? <section className="wsp-section" aria-labelledby="weak-heading">
      <div className="wsp-section-head"><h2 id="weak-heading">Анхаарах чадварууд</h2><span className="wsp-muted">Хамгийн сул нь эхэндээ</span></div>
      <div className="wsp-domains">{weakest.map(([domain, value]) => <div key={domain} className="wsp-domain">
        <span lang={kind === "math" ? "mn" : "en"}>{domain}</span><i className="wsp-bar" aria-hidden="true"><b style={{ width: Math.round((value.correct / value.total) * 100) + "%" }} /></i><small>{value.correct} / {value.total}</small>
      </div>)}</div>
    </section> : null}

    <div className="wsp-review-grid">
      <section className="wsp-review-main" aria-labelledby="questions-heading">
        <div className="wsp-section-head"><h2 id="questions-heading">Асуулт бүрийн задаргаа</h2></div>
        <div className="wsp-filter" role="group" aria-label="Хариу шүүх">{filterLabels.filter(([name]) => name === "all" || counts[name]).map(([name, label]) => <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}>{label} · {counts[name]}</button>)}</div>
        {!visible.length ? <p className="wsp-muted">Энэ шүүлтэд асуулт алга.</p> : null}
        <ol className="wsp-questions">{visible.map(review => {
          const status = statusOf(review);
          const index = reviews.indexOf(review);
          const choices = options[review.id];
          const answers = review.answer.split(" / ");
          const figure = questionFigure(review);
          return <li key={review.id} className={"wsp-question" + (active === review.id ? " is-active" : "")} data-status={status} data-question={review.id}>
            <div className="wsp-question-head">
              <span className="wsp-question-number">{review.number ?? index + 1}</span>
              <span className="wsp-status" data-status={status}>{statusLabels[status]}</span>
              <span className="wsp-question-domain" lang={kind === "math" ? "mn" : "en"}>{review.domain}</span>
              {review.pretest ? <span className="wsp-tag">Pretest</span> : null}
              <span className="wsp-question-points">{review.earned === null ? "—" : round(review.earned)} / {review.points}</span>
            </div>
            {review.instructions ? <div className="wsp-question-note" lang={lang}><Text text={review.instructions} kind={kind} /></div> : null}
            {review.context ? <details className="wsp-material" open={review.context.length < 500}><summary>{review.contextTitle ?? "Өгөгдөл"}</summary><div lang={kind === "ja" ? "ja" : "en"}><Text text={review.context} kind={kind === "math" ? "en" : kind} /></div></details> : null}
            {review.passage ? <details className="wsp-material"><summary>Эх текст</summary><div lang={kind === "ja" ? "ja" : "en"}><Text text={review.passage} kind={kind === "math" ? "en" : kind} /></div></details> : null}
            {review.prompt ? <p className="wsp-question-prompt" lang={lang}><Text text={review.prompt} kind={kind} /></p> : null}
            {figure ? <ExamFigureView figure={figure} /> : null}
            {choices ? <ul className="wsp-choices">{choices.map((choice, i) => {
              const right = answers.includes(choice), mine = review.selected === choice;
              return <li key={i} className={(right ? "is-right " : "") + (mine && !right ? "is-mine" : "")}>
                <span className="wsp-choice-letter">{LETTERS[i] ?? i + 1}</span><span className="wsp-choice-text" lang={lang}><Answer text={choice} kind={kind} /></span>
                {right ? <span className="wsp-choice-mark"><Icon name="check" size={16} />Зөв</span> : mine ? <span className="wsp-choice-mark">Таны сонголт</span> : null}
              </li>;
            })}</ul> : <dl className="wsp-answers">
              <div><dt>Таны хариу</dt><dd lang={lang}>{review.selected.trim() ? <Answer text={review.selected} kind={kind} /> : <span className="wsp-muted">Хариулаагүй</span>}</dd></div>
              {review.answer ? <div><dt>Зөв хариу</dt><dd lang={lang}><Answer text={review.answer} kind={kind} /></dd></div> : null}
            </dl>}
            {choices && !review.selected.trim() ? <p className="wsp-muted wsp-unanswered">Хариулаагүй</p> : null}
            {review.explanation ? <div className="wsp-explanation" lang={attempt.program === "entrance" ? "mn" : kind === "ja" ? "en" : "en"}><span>Тайлбар</span><p><Text text={review.explanation} kind={kind === "ja" ? "en" : kind} /></p></div> : null}
            {review.transcript ? <details className="wsp-material"><summary>Бичлэгийн текст</summary><div lang={kind === "ja" ? "ja" : "en"}><Text text={review.transcript} kind={kind === "math" ? "en" : kind} /></div></details> : null}
            <div className="wsp-question-foot"><button type="button" className="wsp-ask" onClick={() => askAbout(review.id)} aria-pressed={active === review.id}><Icon name="spark" size={16} />AI-аас асуух</button></div>
          </li>;
        })}</ol>
        <p className="wsp-fine">{attempt.program === "entrance" ? "Хэвлэсэн онооны нийлбэр. Албан ЭЕШ-ийн жинлэсэн оноо биш." : attempt.program === "jlpt" ? "Raw зөв хариултын тоо. JLPT-ийн албан оноо, тэнцсэн эсэхийг тооцохгүй." : attempt.program === "sat" ? "Raw оноо. 400–1600 SAT оноонд хөрвүүлэхгүй; pretest асуулт оноонд орохгүй." : "Listening, Reading-ийн raw оноо. Writing, Speaking-д band өгөхгүй."}</p>
      </section>
      <ReviewCoach key={active ?? "none"} attemptId={attempt.id} review={activeReview} number={activeReview ? activeReview.number ?? String(activeIndex + 1) : ""} kind={kind}
        open={panelOpen} onClose={() => setPanelOpen(false)} turns={active ? conversations[active] ?? [] : []}
        setTurns={update => active && setConversations(current => ({ ...current, [active]: update(current[active] ?? []) }))} />
    </div>
    <button type="button" className="wsp-coach-launch" onClick={() => setPanelOpen(true)}><Icon name="spark" size={18} />AI багш</button>
  </div>;
}

function ReviewCoach({ attemptId, review, number, kind, open, onClose, turns, setTurns }: {
  attemptId: string; review: Review | null; number: string; kind: TextKind; open: boolean; onClose: () => void;
  turns: ChatTurn[]; setTurns: (update: (current: ChatTurn[]) => ChatTurn[]) => void;
}) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<"mn" | "en">("mn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const log = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [turns.length, pending]);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  // On narrow screens the coach is a slide-over: focus it on open and close it with Escape.
  useEffect(() => {
    if (!open || !matchMedia("(max-width: 1179px)").matches) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") closeRef.current(); };
    addEventListener("keydown", key);
    panel.current?.querySelector<HTMLElement>("textarea:not(:disabled), button:not(:disabled)")?.focus();
    return () => removeEventListener("keydown", key);
  }, [open]);

  async function ask(mode: ReviewMode, typed: string) {
    if (busy.current || !review) return;
    const message = typed.trim() || reviewModeLabels[mode];
    busy.current = true; setPending(true); setError("");
    const prior = turns.slice(-CHAT_LIMITS.history).map(turn => ({ role: turn.role, content: turn.content.slice(0, CHAT_LIMITS.turn) }));
    try {
      const response = await fetch("/api/workspace/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, target: { attemptId, questionId: review.id }, language, message, history: prior }), signal: AbortSignal.timeout(80000) });
      const data = await response.json().catch(() => ({})) as { message?: string; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error || "AI хариу ирсэнгүй. Дахин оролдоно уу.");
      setTurns(current => [...current, { role: "user", content: message }, { role: "assistant", content: data.message! }]);
      setText("");
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Хариу удаж байна. Түр хүлээгээд дахин оролдоно уу.");
    } finally { busy.current = false; setPending(false); }
  }

  const status = review ? statusOf(review) : null;
  return <>
    <button type="button" className="wsp-coach-scrim" data-open={open ? "" : undefined} aria-label="AI багшийг хаах" tabIndex={-1} onClick={onClose} />
    <aside ref={panel} className="wsp-coach" data-open={open ? "" : undefined} aria-label="AI багш">
      <header className="wsp-coach-head">
        <span className="wsp-msg-avatar" aria-hidden="true"><Icon name="spark" size={16} /></span>
        <div><h2>AI багш</h2><p>{review ? `Асуулт ${number} · ${statusLabels[status!]}` : "Асуулт сонгоогүй"}</p></div>
        <label className="wsp-select is-small"><span className="sr-only">Хариултын хэл</span><select value={language} onChange={event => setLanguage(event.target.value as "mn" | "en")} disabled={pending}><option value="mn">MN</option><option value="en">EN</option></select><Icon name="chevron" size={14} /></label>
        <button type="button" className="wsp-icon-button wsp-coach-close" onClick={onClose} aria-label="Хаах"><Icon name="close" size={18} /></button>
      </header>
      {review ? <>
        <div className="wsp-coach-question" lang={kind === "ja" ? "ja" : kind === "math" ? "mn" : "en"}>{review.prompt ? review.prompt.slice(0, 220) + (review.prompt.length > 220 ? "…" : "") : review.domain}</div>
        <div ref={log} className="wsp-coach-log" role="log" aria-live="polite" aria-label="AI багштай ярилцсан түүх">
          {!turns.length ? <p className="wsp-coach-hint">{status === "correct" ? "Зөв хариулсан ч өөр арга, төстэй дасгал асууж болно." : status === "pending" ? "Энэ даалгаврын хариунд санал, сайжруулах зөвлөгөө аваарай." : "Яагаад буруу болсныг, зөв аргыг алхам алхмаар асуугаарай."}</p> : null}
          {turns.map((turn, index) => turn.role === "user"
            ? <div key={index} className="wsp-msg user"><div className="wsp-bubble"><p>{turn.content}</p></div></div>
            : <div key={index} className="wsp-msg assistant"><div className="wsp-answer"><Markdown text={turn.content} /></div></div>)}
          {pending ? <div className="wsp-typing" role="status" aria-label="AI бичиж байна"><i /><i /><i /></div> : null}
          {error ? <p className="wsp-error" role="alert">{error}</p> : null}
        </div>
        <div className="wsp-coach-chips">{(["explain", "mistake", "similar"] as const).map(mode => <button key={mode} type="button" disabled={pending} onClick={() => void ask(mode, "")}>{reviewModeLabels[mode]}</button>)}</div>
        <form className="wsp-coach-form" onSubmit={event => { event.preventDefault(); if (text.trim()) void ask("ask", text); }}>
          <textarea aria-label="AI багшаас асуух" rows={1} maxLength={CHAT_LIMITS.message} value={text} placeholder="Энэ асуултын талаар асуух…" disabled={pending}
            onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (text.trim()) void ask("ask", text); } }} />
          <button type="submit" className="wsp-send is-round" disabled={pending || !text.trim()} aria-label="Илгээх"><Icon name="send" size={18} /></button>
        </form>
        <p className="wsp-fine">Энэ асуулт, таны хариу AI руу очно · Албан ёсны үнэлгээ биш</p>
      </> : <div className="wsp-coach-empty"><Icon name="spark" size={28} /><p>Асуултын доорх <strong>AI-аас асуух</strong> товчийг дарж, алдаагаа задлаарай.</p></div>}
    </aside>
  </>;
}
