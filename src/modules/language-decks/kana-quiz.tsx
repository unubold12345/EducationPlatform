"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import { failure, sendJson } from "@/modules/vocabulary/api";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import { speak } from "@/modules/vocabulary/speech";
import { DECK_REVIEW_WORDS } from "./catalog";
import type { KanaLetter, KanaQuestion } from "./kana-test";
import styles from "./kana-quiz.module.css";

// The Kana test screen (owner request 2026-11-18: "simple, do not put too much things"): a kana, four romaji, a
// progress bar, then the score and the missed letters. A right answer moves on by itself; a wrong one shows the answer.
// One grade per letter goes to its chart's review route (hiragana and katakana can be mixed in one test). The Hangul page
// (TOPIK tab) asks its syllables with the same screen, passing `lang` "ko-KR".

export type KanaTestRun = { questions: KanaQuestion[]; startedAt: number };
const ADVANCE_MS = 650;

export function KanaQuiz({ run, voiced, lang = "ja-JP", onStudied, onRestart, onClose }: {
  run: KanaTestRun; voiced: boolean; lang?: string; onStudied: (deckId: string, updates: StudyUpdate[]) => void;
  onRestart: (only: KanaLetter[] | null) => void; onClose: () => void;
}) {
  const { questions } = run;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState<{ seconds: number } | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  const current = questions[index];
  const tag = lang.slice(0, 2);

  async function save(answers: boolean[]) {
    setSaving("saving"); setError("");
    const byDeck = new Map<string, { id: string; grade: "good" | "again" }[]>();
    questions.forEach((question, at) => {
      const list = byDeck.get(question.letter.deckId) ?? [];
      list.push({ id: question.letter.id, grade: answers[at] ? "good" : "again" });
      byDeck.set(question.letter.deckId, list);
    });
    try {
      for (const [deckId, grades] of byDeck) {
        const updates: StudyUpdate[] = [];
        for (let at = 0; at < grades.length; at += DECK_REVIEW_WORDS) {
          updates.push(...(await sendJson<{ words: StudyUpdate[] }>(`/api/labs/words/${deckId}/review`, { results: grades.slice(at, at + DECK_REVIEW_WORDS) })).words);
        }
        onStudied(deckId, updates);
      }
      setSaving("saved");
    } catch (reason) { setSaving("idle"); setError(failure(reason, "Явцыг хадгалж чадсангүй.")); }
  }
  function next(answers = results) {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
    if (index + 1 < questions.length) { setIndex(index + 1); setPicked(null); return; }
    setFinished({ seconds: Math.round((Date.now() - run.startedAt) / 1000) });
    void save(answers);
  }
  function choose(at: number) {
    if (!current || picked !== null) return;
    const right = at === current.answer;
    const answers = [...results, right];
    setPicked(at); setResults(answers);
    if (voiced) speak(current.letter.kana, lang);
    if (right) timer.current = window.setTimeout(() => next(answers), ADVANCE_MS);
  }

  // Keys: 1–4 answer, Enter goes on after a wrong answer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (finished || !current) return;
      if (event.key === "Enter" && picked !== null) { event.preventDefault(); next(); return; }
      if (/^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished || !current) {
    const right = results.filter(Boolean).length;
    const missed = questions.filter((_, at) => !results[at]).map(question => question.letter);
    const percent = Math.round((right / Math.max(1, questions.length)) * 100);
    const seconds = finished?.seconds ?? 0;
    return <div className={`wsp-page ${styles.page}`}>
      <section className={styles.result} aria-labelledby="kana-result-heading">
        <h1 id="kana-result-heading">{percent >= 90 ? "Гайхалтай!" : percent >= 60 ? "Сайн байна!" : "Дахин давтъя"}</h1>
        <p className={styles.score}><strong>{right}</strong> / {questions.length}</p>
        <p className={styles.scoreNote}>{percent}% зөв · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p>
        <p className={styles.saveNote} aria-live="polite">{saving === "saving" ? "Хадгалж байна…" : saving === "saved" ? "Явц хадгалагдлаа." : ""}</p>
        {error ? <p className={styles.error} role="alert">{error} <button type="button" className={styles.textButton} onClick={() => void save(results)}>Дахин оролдох</button></p> : null}
        {missed.length ? <div className={styles.missed}>
          <h2>Алдсан үсэг</h2>
          <ul>{missed.map(letter => <li key={letter.deckId + letter.id}>
            <button type="button" onClick={() => { if (voiced) speak(letter.kana, lang); }} aria-label={`${letter.kana} ${letter.romaji}`}>
              <span lang={tag}>{letter.kana}</span><small>{letter.romaji}</small></button>
          </li>)}</ul>
        </div> : null}
        <div className={styles.actions}>
          {missed.length ? <button type="button" className={styles.primary} onClick={() => onRestart(missed)}>Алдсанаа давтах</button> : null}
          <button type="button" className={missed.length ? styles.secondary : styles.primary} onClick={() => onRestart(null)}>Дахин</button>
          <button type="button" className={styles.secondary} onClick={onClose}>Буцах</button>
        </div>
      </section>
    </div>;
  }

  const answered = picked !== null;
  const wrong = answered && picked !== current.answer;
  return <div className={`wsp-page ${styles.page}`}>
    <div className={styles.top}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Шалгалтаас гарах"><Icon name="close" size={20} /></button>
      <div className={styles.bar} role="progressbar" aria-label="Явц" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + (answered ? 1 : 0)}>
        <b style={{ width: ((index + (answered ? 1 : 0)) / questions.length) * 100 + "%" }} /></div>
      <span className={styles.count}>{index + 1} / {questions.length}</span>
    </div>

    <section className={styles.question} aria-label="Асуулт">
      <div className={styles.kana} lang={tag} data-kana="">{current.letter.kana}</div>
      <div className={styles.options} role="group" aria-label="Хариултууд">
        {current.options.map((option, at) => <button key={option} type="button" disabled={answered} onClick={() => choose(at)}
          data-state={answered ? (at === current.answer ? "right" : at === picked ? "wrong" : "dim") : undefined}>
          <kbd aria-hidden="true">{at + 1}</kbd>{option}
        </button>)}
      </div>
      <div className={styles.feedback} aria-live="polite">
        {wrong ? <>
          <span>Зөв хариулт: <strong>{current.options[current.answer]}</strong></span>
          <button type="button" className={styles.primary} onClick={() => next()} autoFocus>Дараах</button>
        </> : null}
      </div>
    </section>
  </div>;
}
