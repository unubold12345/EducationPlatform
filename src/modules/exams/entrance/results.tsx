"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MathText, MathFormula } from "../math-text";
import { RichText } from "../rich-text";
import { ExamFigureView } from "../figure";
import type { PublicExamAttempt } from "../types";
import { entranceSubjectLabels } from "./subjects";
import "./entrance.css";

type ReviewFilter = "all" | "wrong" | "blank" | "correct";
const filters: [ReviewFilter, string][] = [["all", "Бүгд"], ["wrong", "Алдсан"], ["blank", "Хоосон"], ["correct", "Зөв"]];
const groupOf = (review: NonNullable<PublicExamAttempt["report"]>["reviews"][number]): ReviewFilter => {
  if (review.correct === null) return "all";
  return review.correct ? "correct" : review.selected.trim() ? "wrong" : "blank";
};
const round = (value: number) => Math.round(value * 100) / 100;

export function EntranceResults({ attempt }: { attempt: PublicExamAttempt }) {
  const report = attempt.report!;
  const subject = attempt.subject ?? "math";
  const math = subject === "math" || subject === "physics";
  const mongolian = subject !== "english";
  // Open on the mistakes; a paper with blanks but no wrong answers opens on the blanks rather than an empty list.
  const [filter, setFilter] = useState<ReviewFilter>(() => report.reviews.some(review => groupOf(review) === "wrong") ? "wrong" : report.reviews.some(review => groupOf(review) === "blank") ? "blank" : "all");
  const correct = report.reviews.filter(review => review.correct === true).length;
  const graded = report.reviews.filter(review => review.correct !== null).length;
  const wrong = report.reviews.filter(review => groupOf(review) === "wrong").length;
  const blank = report.reviews.filter(review => groupOf(review) === "blank").length;
  const total = report.points.total || 1;
  const percent = Math.round((report.points.earned / total) * 100);
  const visible = useMemo(() => report.reviews.filter(review => filter === "all" || groupOf(review) === filter), [report.reviews, filter]);
  return <div className="eesh-results">
    <header className="eesh-result-head">
      <div>
        <p className="eyebrow">ДУУССАН · {entranceSubjectLabels[subject].toUpperCase()}</p>
        <h1>{attempt.title.replace(/^ЭЕШ · /, "")}</h1>
        <p className="eesh-result-sub">{graded} хариулт үнэлэгдсэн · {correct} зөв · {wrong} буруу{blank ? ` · ${blank} хоосон` : ""}</p>
      </div>
      <div className="eesh-score" aria-label={`Оноо ${round(report.points.earned)} / ${total}`}>
        <strong>{round(report.points.earned)}</strong>
        <span>/ {total} оноо</span>
        <div className="eesh-score-bar" aria-hidden="true"><i style={{ width: percent + "%" }} /></div>
        <small>{percent}%</small>
      </div>
    </header>

    <section className="eesh-skills" aria-label="Чадвар бүрийн оноо">
      {report.sections.map(section => <div className="eesh-skill" key={section.title}>
        <div><strong>{section.title}</strong><span>{section.correct} / {section.total} зөв</span></div>
        <i aria-hidden="true"><b style={{ width: section.points ? Math.round((section.earned / section.points) * 100) + "%" : "0%" }} /></i>
        <span>{round(section.earned)} / {section.points}</span>
      </div>)}
    </section>

    <div className="eesh-result-actions">
      <Link className="button" href={`/exams/${attempt.slug}/practice`}>Цаггүй дадлага →</Link>
      <Link className="eesh-result-link" href={`/workspace/review/${attempt.id}`}>AI-тай задлах →</Link>
      <Link className="eesh-result-link" href={`/exams/eesh?subject=${subject}`}>Бусад ЭЕШ mock →</Link>
    </div>

    <div className="eesh-review-head">
      <h2>Хариу ба тайлбар</h2>
      <div className="eesh-review-filter" role="group" aria-label="Хариу шүүх">
        {filters.map(([name, label]) => {
          const count = name === "all" ? report.reviews.length : report.reviews.filter(review => groupOf(review) === name).length;
          return <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}>{label} · {count}</button>;
        })}
      </div>
    </div>

    <div className="eesh-review-list">
      {visible.map((review, index) => <details className="eesh-review" key={review.id}>
        <summary>
          <span className={review.correct === null ? "pending-label" : review.correct ? "correct" : "incorrect"}>{review.correct === null ? "Хяналт" : review.correct ? "Зөв" : review.selected.trim() ? "Алдсан" : "Хоосон"}</span>
          <span className="eesh-review-number">{review.number ?? index + 1}</span>
          <span className="eesh-review-preview">{review.prompt || "Хариу"}</span>
          <span className="eesh-review-points">{review.earned ? `+${review.earned}` : "0"} / {review.points}</span>
        </summary>
        <div className="eesh-review-body">
          {review.instructions ? <div className="eesh-review-instructions" lang={mongolian ? "mn" : "en"}>{math ? <MathText text={review.instructions} /> : <RichText text={review.instructions} />}</div> : null}
          {review.context ? <details className="eesh-review-passage" open={review.context.length < 400}><summary>{review.contextTitle ?? "Өгөгдөл"}</summary><p lang="en"><RichText text={review.context} /></p></details> : null}
          {review.prompt ? <p className="eesh-review-prompt" lang={mongolian ? "mn" : "en"}>{math ? <MathText text={review.prompt} /> : <RichText text={review.prompt} />}</p> : null}
          {review.figure ? <ExamFigureView figure={review.figure} /> : null}
          {review.passage ? <details className="eesh-review-passage"><summary>Эх текст</summary><p lang="en"><RichText text={review.passage} /></p></details> : null}
          <dl className="eesh-review-answers">
            <div><dt>Таны хариу</dt><dd>{review.selected ? math ? <MathFormula text={review.selected} /> : <RichText text={review.selected} /> : "Хариулаагүй"}</dd></div>
            <div><dt>Зөв хариу</dt><dd>{math ? <MathFormula text={review.answer} /> : <RichText text={review.answer} />}</dd></div>
          </dl>
          {/* Every ЭЕШ explanation is Mongolian, the English paper's too; its questions and answers stay English. */}
          {review.explanation ? <p className="eesh-explanation" lang="mn">{math ? <MathText text={review.explanation} /> : <RichText text={review.explanation} />}</p> : null}
        </div>
      </details>)}
    </div>
    <p className="fine-print eesh-result-note">Зөв хариултын оноо. Албан ЭЕШ-ийн жинлэсэн оноо эсвэл 800 онооны хөрвүүлэлт биш.</p>
  </div>;
}
