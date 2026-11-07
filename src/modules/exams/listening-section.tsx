"use client";
// IELTS mock Listening stages in the Listening Lab layout: part list, a locked player bar and all ten
// questions of a part on one page. Timing, audio access, saving and grading stay with the runner and server:
// the recording follows the server clock, cannot be paused or replayed, and answers go through onChange.
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { listeningParts, listeningPosition } from "./audio-files";
import type { PublicStage } from "./types";
import { listeningPartInfo } from "./listening-prompt";
import styles from "@/modules/listening-lab/listening.module.css";

const LETTERS = "ABCDEFGH";
const PER_PART = 10;
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

type Props = {
  attemptId: string; slug: string; stage: PublicStage;
  /** Seconds into the Listening stage, or null in the answer-check stage after the audio has ended. */
  elapsed: number | null;
  answers: Record<string, string>; flags: string[]; disabled: boolean;
  onChange: (id: string, value: string) => void; onFlag: (id: string) => void;
};

function Player({ attemptId, slug, elapsed }: { attemptId: string; slug: string; elapsed: number | null }) {
  const lengths = listeningParts(slug);
  const { part, offset, ended } = elapsed === null ? { part: lengths.length, offset: lengths[lengths.length - 1], ended: true } : listeningPosition(slug, elapsed);
  const audio = useRef<HTMLAudioElement>(null), position = useRef(offset);
  const [blocked, setBlocked] = useState(false), [playing, setPlaying] = useState(false), [shown, setShown] = useState(offset);
  useEffect(() => { position.current = offset; }, [offset]);
  async function resume() {
    if (!audio.current) return;
    try { audio.current.currentTime = position.current; await audio.current.play(); setBlocked(false); } catch { setBlocked(true); }
  }
  // Same rule as before: keep the element within three seconds of the server position.
  useEffect(() => {
    if (ended) return;
    const element = audio.current;
    function sync() { if (element && element.readyState >= 1) { const target = position.current; if (Math.abs(element.currentTime - target) > 3) element.currentTime = target; } }
    const timer = setInterval(sync, 2000); document.addEventListener("visibilitychange", sync);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", sync); element?.pause(); };
  }, [part, ended]);
  const length = lengths[part - 1] ?? 1, at = ended ? length : Math.min(length, playing ? shown : offset);
  return <div className={styles.player} data-exam="" data-listening-player="">
    <span className={styles.play} aria-hidden="true" data-live={playing ? "" : undefined}>
      {ended ? <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        : <svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>}
    </span>
    <div className={styles.track}>
      <span className={styles.livePart}>{ended ? "Бичлэг дууссан" : `Part ${part} / ${lengths.length}`}</span>
      <input type="range" min={0} max={length} step={0.1} value={at} disabled readOnly aria-label="Бичлэгийн байрлал" style={{ "--progress": `${Math.min(100, at / length * 100)}%` } as CSSProperties} />
      <span className={styles.time}>{clock(at)} / {clock(length)}</span>
    </div>
    {!ended && <audio key={part} ref={audio} src={`/api/mock-attempts/${attemptId}/audio?part=${part}`} preload="auto" aria-label={"Listening recording part " + part}
      onLoadedMetadata={() => void resume()} onError={() => setBlocked(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onTimeUpdate={event => setShown(event.currentTarget.currentTime)} />}
    {blocked && !ended ? <button className="button secondary small" onClick={() => void resume()}>Дууг одоогийн байрлалаас холбох →</button> : null}
  </div>;
}

export function ListeningSection({ attemptId, slug, stage, elapsed, answers, flags, disabled, onChange, onFlag }: Props) {
  const parts = Math.ceil(stage.questions.length / PER_PART);
  const playing = elapsed === null ? null : listeningPosition(slug, elapsed);
  const livePart = playing && !playing.ended ? playing.part : null;
  const [selected, setSelected] = useState(livePart ?? 1);
  // Follow the recording into each new part, as the paper does; the student can still look back.
  const [followed, setFollowed] = useState(livePart);
  if (livePart !== followed) { setFollowed(livePart); if (livePart) setSelected(livePart); }
  const questions = stage.questions.slice((selected - 1) * PER_PART, selected * PER_PART);
  const first = (selected - 1) * PER_PART + 1;
  const info = listeningPartInfo(questions.map(q => q.prompt));
  const answered = (part: number) => stage.questions.slice((part - 1) * PER_PART, part * PER_PART).filter(q => answers[q.id]?.trim()).length;
  const show = (part: number) => { setSelected(part); requestAnimationFrame(() => document.getElementById("listening-part-title")?.scrollIntoView({ block: "nearest" })); };

  return <div className={`${styles.root} ${styles.mock}`}>
    <div className={styles.layout}>
      <nav className={styles.drills} aria-label="Listening parts">
        {Array.from({ length: parts }, (_, i) => i + 1).map(part => <button key={part} type="button" aria-current={part === selected ? "true" : undefined} onClick={() => show(part)} data-part={part}>
          <span className={styles.part}>Part {part}{part === livePart ? " · Тоглож байна" : ""}</span>
          <strong>Questions {(part - 1) * PER_PART + 1}–{Math.min(stage.questions.length, part * PER_PART)}</strong>
          <small>Хариулсан<em data-full={answered(part) === PER_PART ? "" : undefined}>{answered(part)}/{PER_PART}</em></small>
        </button>)}
      </nav>

      <section className={styles.work} aria-labelledby="listening-part-title">
        <Player attemptId={attemptId} slug={slug} elapsed={elapsed} />
        <p className={styles.note} role="status">{elapsed === null ? "Бичлэг дууссан. Хугацаа дуустал хариултаа шалгаж засна уу." : "Нэг удаагийн бичлэг · Зогсоох, буцаах боломжгүй · Refresh хийвэл өнгөрсөн хугацаанаас үргэлжилнэ."}</p>

        <div className={styles.questions}>
          <div className={styles.qhead}>
            <h3 id="listening-part-title" tabIndex={-1}>Part {selected}{info.title ? ` · ${info.title}` : ""} · Questions {first}–{first + questions.length - 1}</h3>
            <p>{info.instructions.length ? info.instructions.join(" · ") : "Follow the word/number limit printed on each question."}</p>
          </div>
          <ol>{questions.map((question, i) => {
            const value = answers[question.id] ?? "", number = first + i, flagged = flags.includes(question.id);
            const prompt = info.parsed[i].text, blank = question.kind !== "choice" && prompt.includes("____");
            return <li key={question.id} data-flagged={flagged ? "" : undefined}>
              <span className={styles.num}>{number}</span>
              {question.kind === "choice" ? <fieldset className={styles.choice} lang="en">
                <legend>{prompt}</legend>
                {question.options!.map((option, o) => <label key={option} data-chosen={value === option ? "" : undefined}>
                  <input type="radio" name={question.id} value={option} checked={value === option} disabled={disabled} onChange={() => onChange(question.id, option)} />
                  <span className={styles.letter}>{LETTERS[o]}</span>{option}
                </label>)}
              </fieldset> : <div className={styles.gap} lang="en">
                {blank ? prompt.split(/_{3,}/).map((piece, p, all) => <Fragment key={p}>{piece}{p < all.length - 1 && p === 0 &&
                  <input type="text" value={value} disabled={disabled} autoComplete="off" spellCheck={false} maxLength={120} aria-label={`Question ${number}`} onChange={e => onChange(question.id, e.currentTarget.value)} />}</Fragment>)
                  : <>{prompt}<input type="text" value={value} disabled={disabled} autoComplete="off" spellCheck={false} maxLength={120} aria-label={`Question ${number}`} onChange={e => onChange(question.id, e.currentTarget.value)} /></>}
              </div>}
              <button type="button" className={styles.flag} aria-pressed={flagged} aria-label={`Question ${number}: ${flagged ? "тэмдэг арилгах" : "дараа харах"}`} onClick={() => onFlag(question.id)} disabled={disabled}>⚑</button>
            </li>;
          })}</ol>
          <div className={styles.actions}>
            {selected > 1 ? <button type="button" className="button secondary small" onClick={() => show(selected - 1)}>← Part {selected - 1}</button> : <span />}
            {selected < parts ? <button type="button" className="button small" onClick={() => show(selected + 1)}>Part {selected + 1} →</button> : null}
          </div>
        </div>
      </section>
    </div>
  </div>;
}
