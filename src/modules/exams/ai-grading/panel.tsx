"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicExamAttempt } from "../types";
import { ieltsOverall, rawBand, type Feedback, type GradePart, type GradeView, type SpeakingGrade, type WritingGrade } from "./contracts";
import { MockEssayReviews } from "./essay-reviews";
import styles from "./grade.module.css";

type Grades = { parts: GradePart[]; grades: Partial<Record<GradePart, GradeView | null>> };
const POLL_MS = 5000;
const PART_NAME: Record<GradePart, string> = { writing: "Writing", speaking: "Speaking" };
const busy = (view: GradeView | null | undefined) => !view || view.status === "running" || view.status === "waiting";

/**
 * AI grades of a finished IELTS or TOEFL mock (2026-11-18). The page asks the server once per part; the grade is saved
 * there, so opening the results again only reads it. Bands and scores are practice estimates, not official scores.
 * The grade is scores and a short note; an IELTS essay's detail is the Essay Studio's paid reviews below it.
 */
export function MockGrades({ attempt }: { attempt: PublicExamAttempt }) {
  const endpoint = "/api/mock-attempts/" + attempt.id + "/grade";
  const [data, setData] = useState<Grades | null>(null);
  const [error, setError] = useState("");
  const asked = useRef(new Set<GradePart>());

  const start = useCallback(async (part: GradePart) => {
    asked.current.add(part);
    setData(current => current && { ...current, grades: { ...current.grades, [part]: { status: "running", retry: false } } });
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ part }) });
      const body = await response.json().catch(() => null);
      const view: GradeView = response.ok && body?.status ? body : { status: "failed", error: body?.error ?? "AI үнэлгээ амжилтгүй боллоо.", retry: response.status !== 404 };
      setData(current => current && { ...current, grades: { ...current.grades, [part]: view } });
    } catch {
      setData(current => current && { ...current, grades: { ...current.grades, [part]: { status: "failed", error: "Сүлжээний алдаа. Дахин оролдоно уу.", retry: true } } });
    }
  }, [endpoint]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setError(body?.error ?? "AI үнэлгээг ачаалж чадсангүй."); return null; }
      setError("");
      setData(body);
      return body as Grades;
    } catch { setError("AI үнэлгээг ачаалж чадсангүй."); return null; }
  }, [endpoint]);

  // Load, start every part nothing has been asked for yet, and keep reading while one is running or waiting.
  useEffect(() => {
    let stop = false, timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      const current = await load();
      if (stop || !current) return;
      for (const part of current.parts) if (current.grades[part] === null && !asked.current.has(part)) void start(part);
      if (current.parts.some(part => busy(current.grades[part]))) timer = setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [load, start]);

  const retry = (part: GradePart) => { void start(part).then(() => load()); };
  // Until the server answers, the parts come from the report (Writing and Speaking are its ungraded sections), so the
  // Listening and Reading tiles show at once and the other two show a spinner.
  const parts = data?.parts ?? (["writing", "speaking"] as GradePart[]).filter(part => attempt.report?.sections.some(section => section.title === PART_NAME[part] && section.pending > 0));
  const grades = data?.grades ?? {};
  if (!parts.length && attempt.program !== "ielts") return null;
  const writing = grades.writing?.status === "done" ? grades.writing.result as WritingGrade : null;
  const speaking = grades.speaking?.status === "done" ? grades.speaking.result as SpeakingGrade : null;
  const state = (part: GradePart) => error && !data ? <p className={styles.failed}>{error}</p> : <PartState view={grades[part]} onRetry={() => retry(part)} />;

  return <section className={styles.panel} aria-labelledby="ai-grade-title">
    <h2 id="ai-grade-title">{attempt.program === "ielts" ? "Үр дүн ба AI үнэлгээ" : "AI үнэлгээ"}</h2>
    {attempt.program === "ielts" ? <IeltsTiles attempt={attempt} writing={writing} speaking={speaking} state={state} parts={parts} />
      : <ToeflTiles writing={writing} speaking={speaking} state={state} parts={parts} />}
    <p className={styles.note}>{attempt.program === "ielts"
      ? "Writing, Speaking-ийг AI албан шалгуураар (band descriptors) үнэлсэн; Listening, Reading-ийн band нь зөв хариултын тооноос хөрвүүлсэн. Дадлагын ойролцоо үнэлгээ, албан IELTS оноо биш."
      : "Writing, Speaking-ийг AI ETS-ийн 0–5 шалгуураар үнэлсэн; Listen and Repeat-ийг давтсан үгсийн таарцаар тоолсон. Дадлагын ойролцоо үнэлгээ, албан TOEFL оноо биш."}</p>
    {writing ? <WritingDetails grade={writing} /> : null}
    {speaking ? <SpeakingDetails grade={speaking} /> : null}
    {attempt.program === "ielts" && parts.includes("writing") ? <MockEssayReviews attemptId={attempt.id} /> : null}
  </section>;
}

function PartState({ view, onRetry }: { view: GradeView | null | undefined; onRetry: () => void }) {
  if (!view || view.status === "running") return <p className={styles.working} role="status"><span aria-hidden="true" />AI үнэлж байна… ихэвчлэн 1–2 минут</p>;
  if (view.status === "waiting") return <p className={styles.working} role="status"><span aria-hidden="true" />Speaking бичлэг илгээгдэхийг хүлээж байна…</p>;
  if (view.status === "done") return null;
  return <div className={styles.failed}><p>{view.error ?? "AI үнэлгээ амжилтгүй боллоо."}</p>{view.retry ? <button type="button" className="text-link" onClick={onRetry}>Дахин оролдох</button> : null}</div>;
}

type TileProps = { writing: WritingGrade | null; speaking: SpeakingGrade | null; state: (part: GradePart) => ReactNode; parts: GradePart[] };

function IeltsTiles({ attempt, writing, speaking, state, parts }: TileProps & { attempt: PublicExamAttempt }) {
  const section = (title: string) => attempt.report!.sections.find(item => item.title === title);
  const listening = section("Listening"), reading = section("Academic Reading");
  const lBand = listening ? rawBand("Listening", listening.correct, listening.total) : null;
  const rBand = reading ? rawBand("Academic Reading", reading.correct, reading.total) : null;
  const wBand = writing?.program === "ielts" ? writing.band : null, sBand = speaking?.program === "ielts" ? speaking.band : null;
  const overall = ieltsOverall([lBand, rBand, wBand, sBand]);
  const raw = (item: typeof listening) => item ? `${item.correct} / ${item.total} зөв` : "";
  return <div className="exam-report-grid">
    {listening ? <section><p className="eyebrow">Listening</p><strong>{lBand ?? listening.correct}{lBand === null ? <span> / {listening.total}</span> : null}</strong><p>{lBand === null ? "Зөв хариулт · богино mock" : raw(listening)}</p></section> : null}
    {reading ? <section><p className="eyebrow">Reading</p><strong>{rBand ?? reading.correct}{rBand === null ? <span> / {reading.total}</span> : null}</strong><p>{rBand === null ? "Зөв хариулт · богино mock" : raw(reading)}</p></section> : null}
    {parts.includes("writing") ? <section><p className="eyebrow">Writing</p>{wBand !== null ? <><strong>{wBand}</strong><p>Band · {writing?.program === "ielts" && writing.tasks.length > 1 ? "Task 2 хоёр дахин жинтэй" : "AI үнэлгээ"}</p></> : state("writing")}</section> : null}
    {parts.includes("speaking") ? <section><p className="eyebrow">Speaking</p>{sBand !== null ? <><strong>{sBand}</strong><p>Band · AI үнэлгээ</p></> : state("speaking")}</section> : null}
    {overall !== null ? <section><p className="eyebrow">Overall</p><strong>{overall}</strong><p>Нийт band (ойролцоо)</p></section> : null}
  </div>;
}

function ToeflTiles({ writing, speaking, state, parts }: TileProps) {
  return <div className="exam-report-grid">
    {parts.includes("writing") ? <section><p className="eyebrow">Writing · AI</p>{writing?.program === "toefl" ? <><strong>{writing.average}<span> / 5</span></strong><p>{writing.tasks.map(task => `${task.label} ${task.score}/5`).join(" · ")}</p></> : state("writing")}</section> : null}
    {parts.includes("speaking") ? <section><p className="eyebrow">Speaking · AI</p>{speaking?.program === "toefl" ? <><strong>{speaking.average}<span> / 5</span></strong><p>Давтах {avg(speaking.repeat.map(item => item.score))}/5 · Ярилцлага {avg(speaking.interview.map(item => item.score))}/5</p></> : state("speaking")}</section> : null}
  </div>;
}
const avg = (scores: number[]) => scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 10) / 10 : 0;

const IELTS_WRITING_CRITERIA = { task: "Task Achievement / Response", coherence: "Coherence & Cohesion", lexical: "Lexical Resource", grammar: "Grammatical Range & Accuracy" } as const;
const IELTS_SPEAKING_CRITERIA = { fluency: "Fluency & Coherence", lexical: "Lexical Resource", grammar: "Grammatical Range & Accuracy", pronunciation: "Pronunciation*" } as const;

function WritingDetails({ grade }: { grade: WritingGrade }) {
  return <details className={styles.details} open>
    <summary>Writing · даалгавар тус бүрийн band</summary>
    {grade.tasks.map(task => <article key={task.id} className={styles.task}>
      <header><h3>{task.label}</h3><span>{task.words} үг{task.minWords ? ` · шаардлага ${task.minWords}+` : ""}</span><strong>{"band" in task ? `Band ${task.band}` : `${task.score} / 5`}</strong></header>
      {"bands" in task ? <Criteria rows={Object.entries(IELTS_WRITING_CRITERIA).map(([key, label]) => [label, task.bands[key as keyof typeof task.bands]])} /> : null}
      <FeedbackView feedback={task} />
    </article>)}
  </details>;
}

function SpeakingDetails({ grade }: { grade: SpeakingGrade }) {
  if (grade.program === "ielts") return <details className={styles.details} open>
    <summary>Speaking · шалгуур тус бүрийн band</summary>
    <article className={styles.task}>
      <header><h3>Speaking</h3><span>{grade.source === "examiner" ? "AI шалгагчийн бичвэрээр" : "Бичлэгийг бичвэрт буулгаж"}</span><strong>Band {grade.band}</strong></header>
      <Criteria rows={Object.entries(IELTS_SPEAKING_CRITERIA).map(([key, label]) => [label, grade.bands[key as keyof typeof grade.bands]])} />
      <p className={styles.fine}>* Дуудлагыг бичлэгийн бичвэрээс ойролцоолсон: AI дууг сонсдоггүй.</p>
      <FeedbackView feedback={grade} />
    </article>
  </details>;
  return <details className={styles.details} open>
    <summary>Speaking · хариу тус бүрийн оноо</summary>
    <article className={styles.task}>
      <header><h3>Listen and Repeat</h3><span>Сонссон өгүүлбэрээ үг бүрээр нь давтсан эсэх</span></header>
      <ol className={styles.repeat}>{grade.repeat.map(item => <li key={item.id}>
        <div><p lang="en"><small>Өгүүлбэр</small>{item.target}</p><p lang="en"><small>Таны хэлсэн</small>{item.transcript || "—"}</p></div><strong>{item.score}/5</strong>
      </li>)}</ol>
    </article>
    <article className={styles.task}>
      <header><h3>Take an Interview</h3><span>Агуулга, хөгжүүлэлт, хэл</span></header>
      <ol className={styles.repeat}>{grade.interview.map(item => <li key={item.id}>
        <div><p lang="en"><small>Асуулт</small>{item.question}</p><p lang="en"><small>Таны хариулт</small>{item.transcript || "—"}</p></div><strong>{item.score}/5</strong>
      </li>)}</ol>
      <FeedbackView feedback={grade} />
    </article>
  </details>;
}

function Criteria({ rows }: { rows: [string, number][] }) {
  return <dl className={styles.criteria}>{rows.map(([label, band]) => <div key={label}><dt>{label}</dt><dd>{band}</dd></div>)}</dl>;
}

/** The grade's short note (older saved grades may carry more fields; only the note shows). */
function FeedbackView({ feedback }: { feedback: Feedback }) {
  return feedback.summary ? <div className={styles.feedback}><p>{feedback.summary}</p></div> : null;
}
