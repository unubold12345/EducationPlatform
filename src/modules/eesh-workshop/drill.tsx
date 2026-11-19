"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnswerOptions } from "@/modules/exams/session-tools";
import { RichText } from "@/modules/exams/rich-text";
import { ExamFigureView } from "@/modules/exams/figure";
import type { PracticeReveal } from "@/modules/exam-practice/types";
import { drillHref, type DrillChoice, type DrillItem } from "./contracts";
import styles from "./eesh.module.css";

const MathText = dynamic(() => import("@/modules/exams/math-text").then(module => module.MathText));
const MathFormula = dynamic(() => import("@/modules/exams/math-text").then(module => module.MathFormula));

type Problem = { kind: "login" | "plan" | "sitting" | "other"; message: string; href?: string };

// The Workshop's ЭЕШ drill page (/labs/eesh/<subject>/drill): ten questions of one topic from different years. The server
// picks unchecked questions from the papers this student may practise; each answer is checked by the practice API and stays
// in that mock's practice record. `initial` is the picker value the page address names (topic:<id> or domain:<name>).
export function EeshDrill({ subject, choices, signedIn, open, total, initial }: { subject: string; choices: DrillChoice[]; signedIn: boolean; open: number; total: number; initial?: string }) {
  const usable = choices.filter(choice => open ? choice.count > 0 : choice.free > 0);
  const start = usable.find(choice => choice.value === initial) ?? usable[0];
  const router = useRouter();
  const [choice, setChoice] = useState(start?.value ?? "");
  const [items, setItems] = useState<DrillItem[] | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [reveals, setReveals] = useState<Record<string, PracticeReveal>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const started = useRef(false);
  const selectId = useId();
  const math = subject === "math" || subject === "physics", english = subject === "english", lang = english ? "en" : "mn";
  const keyOf = (item: DrillItem) => item.slug + "/" + item.id;

  async function load(value = choice) {
    if (!value) return;
    setLoading(true); setProblem(null);
    const [kind, ...rest] = value.split(":");
    try {
      const response = await fetch(`/api/labs/eesh-drill?subject=${subject}&${kind === "topic" ? "topic" : "domain"}=${encodeURIComponent(rest.join(":"))}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setItems(null);
        setProblem({ kind: response.status === 401 ? "login" : response.status === 402 ? "plan" : response.status === 403 && body.href ? "sitting" : "other", message: body.error ?? "Асуулт ачаалж чадсангүй.", href: body.href });
        return;
      }
      setItems(body.items); setResponses({}); setReveals({}); setItemErrors({});
    } catch {
      setProblem({ kind: "other", message: "Сүлжээний алдаа. Дахин оролдоно уу." });
    } finally {
      setLoading(false);
    }
  }
  // The topic or area the address names (?topic= / ?domain=) starts at once.
  useEffect(() => {
    if (started.current || !signedIn || !initial || start?.value !== initial) return;
    started.current = true;
    void load(start.value);
    // Runs once for the value the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function check(item: DrillItem) {
    const key = keyOf(item);
    setChecking(key); setItemErrors(current => ({ ...current, [key]: "" }));
    try {
      const response = await fetch(`/api/exam-practice/${item.slug}/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: item.id, response: responses[key] ?? "" }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setItemErrors(current => ({ ...current, [key]: body.error ?? "Шалгаж чадсангүй." })); return; }
      setReveals(current => ({ ...current, [key]: body.reveal }));
    } catch {
      setItemErrors(current => ({ ...current, [key]: "Сүлжээний алдаа. Дахин оролдоно уу." }));
    } finally {
      setChecking(null);
    }
  }

  const groups = [...new Set(usable.map(item => item.group))];
  const checked = items ? items.filter(item => reveals[keyOf(item)]).length : 0;
  const correct = items ? items.filter(item => reveals[keyOf(item)]?.correct === true) : [];
  const earned = correct.reduce((sum, item) => sum + item.points, 0), possible = items?.reduce((sum, item) => sum + item.points, 0) ?? 0;
  const prompt = (text: string) => math ? <MathText text={text} /> : english ? <RichText text={text} /> : text;
  const option = (text: string) => subject === "math" ? <MathFormula text={text} /> : english ? <RichText text={text} /> : text;
  // Sign-in returns to this drill page (an exact path in return-path.ts; the query does not survive).
  const login = "/login?next=" + encodeURIComponent(drillHref(subject));
  // Another topic gets its own address (the page heading follows it); the page remounts this drill and loads it.
  const start10 = () => { if (choice === initial) void load(); else { setLoading(true); router.push(drillHref(subject, choice)); } };

  if (!signedIn) return <div className={styles.drill}><p className={styles.access}><Link href={login}>Нэвтэрч</Link> орсны дараа дасгал хийнэ. Үнэгүй бүртгэлд үнэгүй туршилтын асуултаас чиглэлээр дасгал нээлттэй.</p></div>;
  return <div className={styles.drill}>
    <div className={styles.picker}>
      {/* A label beside the select (not around it), so the select is named «Сэдэв» alone. */}
      <div className={styles.field}><label htmlFor={selectId}>Сэдэв</label><select id={selectId} value={choice} onChange={event => setChoice(event.target.value)}>
        {groups.map(group => <optgroup key={group} label={group}>{usable.filter(item => item.group === group).map(item => <option key={item.value} value={item.value}>{item.label} · {open ? item.count : item.free}</option>)}</optgroup>)}
      </select></div>
      <button type="button" className="button" disabled={loading || !choice} onClick={start10}>{loading ? "Ачаалж байна…" : items ? "Шинэ 10 асуулт" : "10 асуулт авах"}</button>
    </div>
    <p className={styles.access}>{open ? `Таны нээлттэй ${open}/${total} mock-оос сонгоно. Шалгасан асуулт дахин гарахгүй.` : <>Үнэгүй туршилтаас зөвхөн чиглэлээр. Бүх {total} mock-оос сэдвээр дасгал хийхэд <Link href="/workspace/plans">ЭЕШ багц</Link> эсвэл тухайн mock-ийн эрх хэрэгтэй.</>}</p>
    {problem ? <p className={styles.error} role="alert">{problem.message}{" "}
      {problem.kind === "login" ? <Link href={login}>Нэвтрэх →</Link> : problem.kind === "plan" ? <Link href="/workspace/plans">Багц харах →</Link> : problem.kind === "sitting" && problem.href ? <Link href={problem.href}>Шалгалт руу буцах →</Link> : null}</p> : null}
    {items && !items.length ? <p className={styles.empty}>Энэ сэдвийн нээлттэй асуултыг бүгдийг нь шалгасан байна. Өөр сэдэв сонгох эсвэл mock-ийн дадлагад «дахин ажиллах»-аар нээнэ үү.</p> : null}
    {items?.length ? <>
      <div className={styles.status} role="status"><span><strong>{checked}/{items.length}</strong> шалгасан · <strong>{correct.length}</strong> зөв · {earned}/{possible} оноо</span><span className={styles.progress}><span style={{ width: (checked / items.length) * 100 + "%" }} /></span></div>
      <ol className={styles.items}>{items.map((item, index) => {
        const key = keyOf(item), reveal = reveals[key], value = responses[key] ?? "";
        return <li key={key} className={styles.item} data-result={reveal ? (reveal.correct ? "correct" : "wrong") : undefined} aria-labelledby={"drill-" + index}>
          <div className={styles.itemHead}><strong id={"drill-" + index}>{index + 1}. {item.year ?? "Үнэгүй туршилт"} · {item.form} · №{item.label}</strong><span>{item.domain} · {item.points} оноо</span></div>
          {item.instructions ? <div className={styles.task} lang="en"><RichText text={item.instructions} /></div> : null}
          {item.prompt ? <div className={styles.prompt} lang={lang}>{prompt(item.prompt)}</div> : null}
          {item.figure ? <ExamFigureView figure={item.figure} /> : null}
          <AnswerOptions name={"drill-" + key} selected={value} disabled={Boolean(reveal)} lang={lang} labels={item.optionLabels} compact={item.compactOptions}
            onSelect={next => setResponses(current => ({ ...current, [key]: next }))} correctValue={reveal ? reveal.answerValue ?? reveal.answer : undefined}
            options={item.options.map(text => ({ value: text, content: option(text) }))} />
          {reveal ? <div className={styles.feedback} role="status">
            <strong data-ok={reveal.correct ? "" : undefined} data-bad={reveal.correct ? undefined : ""}>{reveal.correct ? "Зөв" : value ? "Буруу" : "Хариулаагүй"}</strong>
            {reveal.answer ? <p>Зөв хариу: <b lang={lang}>{subject === "math" ? <MathFormula text={reveal.answer} /> : reveal.answer}</b></p> : null}
            {reveal.explanation ? <p lang="mn">{math ? <MathText text={reveal.explanation} /> : reveal.explanation}</p> : null}
          </div> : null}
          {itemErrors[key] ? <p className={styles.error} role="alert">{itemErrors[key]}</p> : null}
          <div className={styles.itemActions}>
            {reveal ? null : <button type="button" className="button" disabled={checking === key} onClick={() => void check(item)}>{checking === key ? "Шалгаж байна…" : value ? "Шалгах" : "Хариуг харах"}</button>}
            <Link className="text-link" href={`/exams/${item.slug}/practice`} prefetch={false}>Бүтэн mock-ийн дадлагад нээх ↗</Link>
          </div>
        </li>;
      })}</ol>
      {checked === items.length ? <div className={styles.done}><p><strong>{correct.length}/{items.length} зөв</strong> · {earned}/{possible} оноо</p><button type="button" className="button" disabled={loading} onClick={start10}>Шинэ 10 асуулт</button></div> : null}
    </> : null}
  </div>;
}
