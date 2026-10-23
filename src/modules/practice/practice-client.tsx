"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MathTutor } from "@/modules/tutor/panel";
import type { PracticeQuestion, PracticeResult } from "./questions";
import { QuestionText, questionOnly } from "@/modules/exercises/question-text";

export function PracticeClient({ questions, exercise }: { questions: PracticeQuestion[]; exercise?: { slug: string; program: string; subject: string; examId: string } }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const question = questions[index];
  const answered = answers.filter(answer => answer !== null).length;
  useEffect(() => { if (result) resultHeading.current?.focus(); }, [result]);

  function navigate(next: number) {
    setIndex(next);
    setError("");
    requestAnimationFrame(() => questionHeading.current?.focus());
  }

  async function submit() {
    if (submitting.current || answered !== questions.length) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(exercise ? "/api/exercises/" + exercise.slug : "/api/practice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, ...(exercise?{examId:exercise.examId}:{}) }), signal: AbortSignal.timeout(15000),
      });
      if(response.status===402){setError("Сарын эрхийн хугацаа дууссан байна. Багцаа сунгаад дахин шалгана уу. Сонгосон хариунууд хэвээр байна.");return;}
      if(response.status===401){setError("Бүртгэлдээ дахин нэвтэрнэ үү. Сонгосон хариунууд хэвээр байна.");return;}
      if (!response.ok) throw new Error("submission");
      const data: PracticeResult = await response.json();
      setResult(data);
    } catch {
      setError("Хариуг шалгаж чадсангүй. Холболтоо шалгаад дахин оролдоно уу. Сонгосон хариунууд хэвээр байна.");
    } finally {
      setPending(false);
      submitting.current = false;
    }
  }

  if (result) return <section className="results">
    <div className="result-summary"><div><p className="eyebrow">Дасгалын үр дүн</p><h2 tabIndex={-1} ref={resultHeading}>Тайлбараа хараад бататгаарай.</h2><p>Зөв хариултын тоо. Албан ёсны шалгалтын оноо биш.</p></div><div className="score">{result.score}<span> / {result.total}</span></div></div>
    <div className="review-list">{result.reviews.map((review, position) => <article className="review" key={review.id}>
      <span className={review.selected === review.correct ? "review-label correct" : "review-label incorrect"}>{position + 1}. {review.selected === review.correct ? "Зөв" : "Дахин хараарай"}</span>
      <QuestionText prompt={questions[position].prompt} /><p>Таны хариу: <strong>{questions[position].options[review.selected]}</strong> · Зөв хариу: <strong>{questions[position].options[review.correct]}</strong></p><p className="explanation">{review.explanation}</p>{exercise?.program!=="ielts"&&<MathTutor key={review.id+"-review"} review target={{kind:"practice",slug:exercise?.slug??"demo",...(exercise?{examId:exercise.examId}:{}),questionId:questions[position].id,selected:review.selected}}/>}
    </article>)}</div>
    <div className="result-actions"><button className="button" onClick={() => { setResult(null); setAnswers(questions.map(() => null)); navigate(0); }}>Дахин бодох ↻</button><Link className="text-link" href={"/programs/" + (exercise?.program ?? "sat")}>Хөтөлбөр рүү →</Link></div>
  </section>;

  return <div className="practice-shell"><aside className="question-nav"><p className="eyebrow">Бодлогууд</p><div className="question-numbers">{questions.map((item, position) => <button key={item.id} className={(position === index ? "current " : "") + (answers[position] !== null ? "answered" : "")} aria-label={"Бодлого " + (position + 1) + (answers[position] !== null ? ", хариулсан" : "")} aria-current={position === index ? "step" : undefined} disabled={pending} onClick={() => navigate(position)}>{position + 1}</button>)}</div><p className="fine-print" aria-live="polite">{answered} / {questions.length} хариулсан</p><Link className="text-link" href={"/programs/" + (exercise?.program ?? "sat")}>← Хөтөлбөр рүү</Link></aside>
    <section className="question-panel"><div className="question-meta"><span>Бодлого {index + 1} / {questions.length}</span><span>{exercise?.subject ?? "Algebra"}</span></div>
      <QuestionText prompt={question.prompt}><h2 ref={questionHeading} tabIndex={-1}>{questionOnly(question.prompt)}</h2></QuestionText>
      <fieldset disabled={pending}><legend className="sr-only">Нэг хариулт сонгоно уу</legend>{question.options.map((option, position) => <label className={"answer-option " + (answers[index] === position ? "selected" : "")} key={position}><input type="radio" name={question.id} value={position} checked={answers[index] === position} onChange={() => setAnswers(current => current.map((answer, itemIndex) => itemIndex === index ? position : answer))} /><span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + position)}</span><span lang="en">{option}</span></label>)}</fieldset>
      {exercise?.program!=="ielts"&&<MathTutor key={question.id} target={{kind:"practice",slug:exercise?.slug??"demo",...(exercise?{examId:exercise.examId}:{}),questionId:question.id,selected:answers[index]}}/>}
      {error ? <p className="error-message" role="alert">{error}</p> : null}
      <div className="question-actions"><button className="button secondary" disabled={index === 0 || pending} onClick={() => navigate(index - 1)}>← Өмнөх</button>
      {index < questions.length - 1 ? <button className="button" disabled={pending} onClick={() => navigate(index + 1)}>Дараах →</button> : <button className="button" disabled={answered !== questions.length || pending} onClick={submit}>{pending ? "Шалгаж байна…" : "Хариугаа шалгах →"}</button>}</div>
      {index === questions.length - 1 && answered !== questions.length ? <p className="fine-print">Үр дүнг харахын тулд бүх бодлогод хариулаарай.</p> : null}
    </section>
  </div>;
}

