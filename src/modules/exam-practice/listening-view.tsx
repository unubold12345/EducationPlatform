"use client";
// IELTS Listening in practice mode, in the Listening Lab layout: part list, a replayable player with speed
// and seek, a part's questions on one page, one check for the part and the transcript after checking.
// Answers, checks and retries still go through the workspace's existing server calls.
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PracticeQuestion, PracticeReveal } from "./types";
import { listeningPartInfo } from "@/modules/exams/listening-prompt";
import { ExamFigureView } from "@/modules/exams/figure";
import styles from "@/modules/listening-lab/listening.module.css";

const LETTERS = "ABCDEFGH", SPEEDS = [0.75, 0.9, 1, 1.15];
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

type Props = {
  /** The practice audio route for this mock (`…/audio` or `…/audio/forms`). */
  audio: string; questions: PracticeQuestion[]; currentId: string;
  responses: Record<string, string>; reveals: Record<string, PracticeReveal>; flags: string[]; checking: boolean;
  onSelect: (id: string) => void; onChange: (id: string, value: string) => void; onFlag: (id: string) => void;
  onCheck: (ids: string[]) => void; onRetry: (ids: string[]) => void;
  /** Assistant for the current question; shown in that question's row. */
  assistant: ReactNode;
};

/**
 * The practice player (IELTS, JLPT, HSK): play/pause, a seek bar, the time, back 5 s and speed. With `start`/`end`
 * (a JLPT or HSK question's slice of its part's track) the bar and clock cover that slice only, playback stops at
 * its end, and pressing play again starts the slice over.
 */
export function PracticePlayer({ src, start = 0, end, label = "Бичлэг" }: { src: string; start?: number; end?: number; label?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(start), [duration, setDuration] = useState(0), [speed, setSpeed] = useState(1);
  useEffect(() => { if (audio.current) audio.current.playbackRate = speed; }, [speed, src]);
  const stop = end ?? duration, length = Math.max(0, stop - start), at = Math.min(length, Math.max(0, time - start));
  const seek = (seconds: number) => { const a = audio.current; if (!a) return; a.currentTime = start + Math.max(0, Math.min(length || a.duration || 0, seconds)); setTime(a.currentTime); };
  const toggle = () => {
    const a = audio.current; if (!a) return;
    if (!a.paused) { a.pause(); return; }
    if (end !== undefined && a.currentTime >= end - 0.05) a.currentTime = start;
    void a.play().catch(() => {});
  };
  return <div className={styles.player} data-practice-audio="">
    <audio ref={audio} key={src} src={src} preload="metadata" aria-label={label} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onLoadedMetadata={e => { setDuration(e.currentTarget.duration); e.currentTarget.playbackRate = speed; if (start) { e.currentTarget.currentTime = start; setTime(start); } }}
      onTimeUpdate={e => { const a = e.currentTarget; if (end !== undefined && a.currentTime >= end + 0.1) { a.pause(); a.currentTime = end; } setTime(a.currentTime); }} />
    <button type="button" className={styles.play} onClick={toggle} aria-label={playing ? "Түр зогсоох" : "Тоглуулах"}>
      {playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>}
    </button>
    <div className={styles.track}>
      <input type="range" min={0} max={length || 1} step={0.1} value={at} aria-label="Бичлэгийн байрлал" onChange={e => seek(Number(e.currentTarget.value))}
        style={{ "--progress": `${length ? Math.min(100, at / length * 100) : 0}%` } as CSSProperties} />
      <span className={styles.time}>{clock(at)} / {clock(length)}</span>
    </div>
    <div className={styles.tools}>
      <button type="button" onClick={() => seek(at - 5)} aria-label="5 секунд буцах">↺ 5с</button>
      <select value={speed} aria-label="Хурд" onChange={e => setSpeed(Number(e.currentTarget.value))}>{SPEEDS.map(s => <option key={s} value={s}>{s}×</option>)}</select>
    </div>
  </div>;
}

/** A JLPT or HSK practice question's player, outside the IELTS part layout; `className` keeps each exam's hook. */
export function QuestionPlayer({ className, ...player }: { className: string; src: string; start?: number; end?: number; label: string }) {
  return <section className={`${styles.root} ${styles.inline} ${className}`}><PracticePlayer {...player} /></section>;
}

export function ListeningPracticeView({ audio, questions, currentId, responses, reveals, flags, checking, onSelect, onChange, onFlag, onCheck, onRetry, assistant }: Props) {
  const parts = [...new Set(questions.map(q => q.audioPart ?? 1))].sort((a, b) => a - b);
  const current = questions.find(q => q.id === currentId) ?? questions[0];
  const part = current.audioPart ?? parts[0];
  const inPart = questions.filter(q => (q.audioPart ?? 1) === part);
  const info = listeningPartInfo(inPart.map(q => q.prompt ?? ""));
  // A plan-labelling task (IELTS Mocks 07 and 10) shows its plan once, above the part's questions.
  const plan = inPart.find(q => q.figure)?.figure;
  const open = inPart.filter(q => !reveals[q.id]), checked = inPart.filter(q => reveals[q.id]);
  const correct = checked.filter(q => reveals[q.id].correct).length;
  const answered = inPart.filter(q => responses[q.id]?.trim()).length;
  const transcript = checked.map(q => reveals[q.id].transcript).find(Boolean);
  const [showText, setShowText] = useState(false);
  const choosePart = (next: number) => {
    const list = questions.filter(q => (q.audioPart ?? 1) === next);
    setShowText(false);
    onSelect((list.find(q => !reveals[q.id]) ?? list[0]).id);
    requestAnimationFrame(() => document.getElementById("practice-part-title")?.scrollIntoView({ block: "nearest" }));
  };

  return <div className={`${styles.root} ${styles.mock}`}>
    <div className={styles.layout}>
      <nav className={styles.drills} aria-label="Listening parts">
        {parts.map(p => {
          const list = questions.filter(q => (q.audioPart ?? 1) === p), done = list.filter(q => reveals[q.id]);
          const right = done.filter(q => reveals[q.id].correct).length;
          return <button key={p} type="button" aria-current={p === part ? "true" : undefined} onClick={() => choosePart(p)} data-part={p}>
            <span className={styles.part}>Part {p}</span>
            <strong>Questions {list[0].label}–{list[list.length - 1].label}</strong>
            <small>{done.length ? "Шалгасан" : "Шалгаагүй"}{done.length ? <em data-full={right === list.length ? "" : undefined}>{right}/{list.length}</em> : null}</small>
          </button>;
        })}
      </nav>

      <section className={styles.work} aria-labelledby="practice-part-title">
        <PracticePlayer src={`${audio}?part=${part}`} />

        <div className={styles.questions}>
          <div className={styles.qhead}>
            <h3 id="practice-part-title" tabIndex={-1}>Part {part}{info.title ? ` · ${info.title}` : ""} · Questions {inPart[0].label}–{inPart[inPart.length - 1].label}</h3>
            <p>{info.instructions.length ? info.instructions.join(" · ") : "Follow the word/number limit printed on each question."}</p>
          </div>
          {plan ? <ExamFigureView figure={plan} /> : null}
          <ol>{inPart.map((question, index) => {
            const value = responses[question.id] ?? "", reveal = reveals[question.id], flagged = flags.includes(question.id);
            const result = reveal ? (reveal.correct ? "good" : "bad") : undefined, active = question.id === current.id;
            const prompt = info.parsed[index].text, blank = question.kind !== "choice" && prompt.includes("____");
            const input = <input type="text" value={value} disabled={Boolean(reveal)} autoComplete="off" spellCheck={false} maxLength={160} aria-label={`Question ${question.label}`}
              onFocus={() => onSelect(question.id)} onChange={e => onChange(question.id, e.currentTarget.value)} />;
            return <li key={question.id} data-result={result} data-flagged={flagged ? "" : undefined} data-active={active ? "" : undefined} onClick={() => { if (!active) onSelect(question.id); }}>
              <span className={styles.num}>{question.label}</span>
              <div className={styles.qbody}>
                {question.kind === "choice" ? <fieldset className={styles.choice} lang="en">
                  <legend>{prompt}</legend>
                  {(question.options ?? []).map((option, o) => <label key={option} data-chosen={value === option ? "" : undefined} data-correct={reveal && reveal.answer === option ? "" : undefined}>
                    <input type="radio" name={question.id} value={option} checked={value === option} disabled={Boolean(reveal)} onChange={() => onChange(question.id, option)} />
                    <span className={styles.letter}>{question.optionLabels?.[o] ?? LETTERS[o]}</span>{option}
                  </label>)}
                </fieldset> : <div className={styles.gap} lang="en">
                  {blank ? prompt.split(/_{3,}/).map((piece, p, all) => <Fragment key={p}>{piece}{p === 0 && all.length > 1 ? input : null}</Fragment>) : <>{prompt}{input}</>}
                </div>}
                {reveal ? <div className={styles.reveal} role="status">
                  {!reveal.correct ? <span className={styles.fix}>{value.trim() ? "Зөв хариулт" : "Хариулаагүй · Зөв хариулт"}: <b>{reveal.answer}</b></span> : null}
                  {reveal.explanation ? <p lang="en">{reveal.explanation}</p> : null}
                </div> : null}
                {active ? <div className={styles.rowTools}>{assistant}</div> : null}
              </div>
              <button type="button" className={styles.flag} aria-pressed={flagged} aria-label={`Question ${question.label}: ${flagged ? "тэмдэг арилгах" : "дараа харах"}`} onClick={e => { e.stopPropagation(); onFlag(question.id); }}>⚑</button>
            </li>;
          })}</ol>
          <div className={styles.actions}>
            {open.length ? <>
              <p className={styles.muted}>{answered}/{inPart.length} хариулсан{checked.length ? ` · ${checked.length} шалгасан` : ""}</p>
              <button type="button" className="button small" disabled={checking} onClick={() => onCheck(open.map(q => q.id))}>{checking ? "Шалгаж байна…" : "Хариулт шалгах"}</button>
            </> : <>
              <p className={styles.score} role="status"><strong>{correct}/{inPart.length}</strong> зөв</p>
              <button type="button" className="button secondary small" onClick={() => onRetry(checked.map(q => q.id))}>Дахин оролдох</button>
            </>}
          </div>
        </div>

        <div className={styles.transcript} data-practice-transcript={transcript ? "" : undefined}>
          <div className={styles.qhead}>
            <h3>Бичлэгийн текст</h3>
            {transcript ? <button type="button" className={styles.link} onClick={() => setShowText(v => !v)}>{showText ? "Текст нуух" : "Текст харуулах"}</button> : null}
          </div>
          {transcript && showText ? <div className={styles.paragraphs} lang="en">{transcript.split("\n\n").map((line, i) => i === 0 ? <p key={i} className={styles.speaker}>{line}</p> : <p key={i}>{line}</p>)}</div>
            : <p className={styles.muted}>{transcript ? "Хариугаа шалгасан тул текстийг нээж, алдсан хэсгээ дахин сонсоорой." : "Текст хариултаа шалгасны дараа нээгдэнэ."}</p>}
        </div>
      </section>
    </div>
  </div>;
}
