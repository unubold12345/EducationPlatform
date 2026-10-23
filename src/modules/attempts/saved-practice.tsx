"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MathTutor } from "@/modules/tutor/panel";
import { useRouter } from "next/navigation";
import type { SavedAttempt } from "./types";
import { QuestionText, questionOnly } from "@/modules/exercises/question-text";

export function SavedPractice({ initial }: { initial: SavedAttempt }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(initial);
  const [answers, setAnswers] = useState(initial.answers);
  const [index, setIndex] = useState(() => Math.max(0, initial.answers.findIndex(answer => answer === null)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(true);
  const busy = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (attempt.result) resultHeading.current?.focus(); }, [attempt.result]);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (pending || !saved) event.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [pending, saved]);

  async function persist(next: (number | null)[], submit = false) {
    if (busy.current || conflict) return;
    busy.current = true; setPending(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/attempts/" + attempt.id + (submit ? "/submit" : ""), {
        method: submit ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: next, revision: attempt.revision }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 401) {
        setError("Нэвтрэх хугацаа дууссан байна. Шинэ цонхонд нэвтэрсний дараа дахин хадгална уу.");
        return;
      }
      if (response.status === 409) {
        setConflict(true);
        setError("Өөр цонхонд өөрчлөлт хадгалагдсан байна. Шинэ хувилбарыг ачаалж үргэлжлүүлнэ үү.");
        return;
      }
      if (!response.ok) throw new Error("save");
      const data: SavedAttempt = await response.json();
      setAttempt(data); setAnswers(data.answers); setSaved(true);
    } catch { setError("Хадгалж чадсангүй. Хуудсаа хаалгүй, холболтоо шалгаад дахин хадгална уу."); }
    finally { busy.current = false; setPending(false); }
  }
  function choose(position: number) {
    const next = answers.map((answer, itemIndex) => itemIndex === index ? position : answer);
    setAnswers(next);
    void persist(next);
  }
  function navigate(next: number) {
    setIndex(next);
    requestAnimationFrame(() => questionHeading.current?.focus());
  }
  if (attempt.result) return <section className="results">
    <div className="result-summary"><div><p className="eyebrow">Хадгалсан үр дүн</p><h2 ref={resultHeading} tabIndex={-1}>Тайлбараа хараад бататгаарай.</h2><p>Зөв хариултын тоо. Албан ёсны шалгалтын оноо биш.</p></div><div className="score">{attempt.result.score}<span> / {attempt.result.total}</span></div></div>
    <div className="review-list">{attempt.result.reviews.map((review, position) => <article className="review" key={review.id}><span className={review.selected === review.correct ? "review-label correct" : "review-label incorrect"}>{position + 1}. {review.selected === review.correct ? "Зөв" : "Дахин хараарай"}</span><QuestionText prompt={attempt.questions[position].prompt} /><p>Таны хариу: <strong>{attempt.questions[position].options[review.selected]}</strong> · Зөв хариу: <strong>{attempt.questions[position].options[review.correct]}</strong></p><p className="explanation">{review.explanation}</p>{attempt.program!=="ielts"&&<MathTutor key={review.id+"-review"} review target={{kind:"saved",attemptId:attempt.id,questionId:review.id}}/>}</article>)}</div>
    <div className="result-actions"><Link className="button" href="/dashboard">Миний бэлтгэл рүү →</Link><p className="fine-print">Үр дүн таны бүртгэлд хадгалагдсан.</p></div>
  </section>;
  const question = attempt.questions[index];
  const answered = answers.filter(answer => answer !== null).length;
  return <><div className="save-status" role="status">{pending ? "Хадгалж байна…" : saved ? "Бүх өөрчлөлт хадгалагдсан" : "Хадгалагдаагүй өөрчлөлт байна"}</div>
    {error ? <div className="error-message" role="alert"><p>{error}</p><div className="result-actions">{conflict ? <button className="button secondary" onClick={() => router.refresh()}>Шинэ хувилбарыг ачаалах</button> : <button className="button secondary" disabled={pending} onClick={() => persist(answers)}>Дахин хадгалах</button>}<a className="text-link" href="/login" target="_blank" rel="noopener noreferrer">Нэвтрэх ↗</a></div></div> : null}
    <div className="practice-shell"><aside className="question-nav"><p className="eyebrow">Бодлогууд</p><div className="question-numbers">{attempt.questions.map((item, position) => <button key={item.id} className={(position === index ? "current " : "") + (answers[position] !== null ? "answered" : "")} aria-label={"Бодлого " + (position + 1)} aria-current={index === position ? "step" : undefined} disabled={pending} onClick={() => navigate(position)}>{position + 1}</button>)}</div><p className="fine-print">{answered} / {attempt.questions.length} хариулсан</p>{!pending && saved ? <Link href="/dashboard" className="text-link">← Миний бэлтгэл</Link> : null}</aside>
      <section className="question-panel"><div className="question-meta"><span>Бодлого {index + 1} / {attempt.questions.length}</span><span>Сонгох хариулт</span></div><QuestionText prompt={question.prompt}><h2 ref={questionHeading} tabIndex={-1}>{questionOnly(question.prompt)}</h2></QuestionText>
      <fieldset disabled={pending || conflict}><legend className="sr-only">Нэг хариулт сонгоно уу</legend>{question.options.map((option, position) => <label className={"answer-option " + (answers[index] === position ? "selected" : "")} key={position}><input type="radio" name={question.id} value={position} checked={answers[index] === position} onChange={() => choose(position)} /><span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + position)}</span><span lang="en">{option}</span></label>)}</fieldset>
      {attempt.program!=="ielts"&&<MathTutor key={question.id} target={{kind:"saved",attemptId:attempt.id,questionId:question.id}}/>}
      <div className="question-actions"><button className="button secondary" onClick={() => navigate(index - 1)} disabled={pending || index === 0}>← Өмнөх</button>{index < attempt.questions.length - 1 ? <button className="button" disabled={pending} onClick={() => navigate(index + 1)}>Дараах →</button> : <button className="button" disabled={pending || conflict || answered !== attempt.questions.length} onClick={() => persist(answers, true)}>Дуусгаж шалгах →</button>}</div>
      </section>
    </div>
  </>;
}

