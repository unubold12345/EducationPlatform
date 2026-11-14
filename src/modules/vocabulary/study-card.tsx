"use client";
import { useMemo, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate, VocabularyWord } from "./contracts";
import { isDue, studyPriority, type StudyGrade } from "./study";
import { QUIZ_MIN_WORDS, speechFor } from "./quiz";
import { failure, sendJson, VOCABULARY_API } from "./api";
import { speak } from "./speech";
import { Level, type QuizLaunch } from "./library";
import styles from "./vocabulary.module.css";

/**
 * The top of the page (owner request 2026-11-15, "study first"): the word that most needs a look, as a card to turn
 * over and grade without opening a quiz. It takes the words whose date has come and the ones never studied, most
 * urgent first. A grade goes through the same review route as a quiz answer, so the server keeps the schedule.
 */
export function StudyCard({ words, now, canSpeak, onStudied, onQuiz }: {
  words: VocabularyWord[]; now: number; canSpeak: (lang: string) => boolean;
  onStudied: (updates: StudyUpdate[]) => void; onQuiz: (launch: QuizLaunch) => void;
}) {
  const [shown, setShown] = useState<string | null>(null);
  // Graded or skipped words leave the card until the page is loaded again, whatever the server answered.
  const [passed, setPassed] = useState<ReadonlySet<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const waiting = useMemo(() => words.filter(word => isDue(word, now) || word.box === 0)
    .sort((a, b) => studyPriority(b, now) - studyPriority(a, now) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)), [words, now]);
  const queue = waiting.filter(word => !passed.has(word.id));
  const word = queue[0] ?? null;
  const revealed = word !== null && shown === word.id;
  const canQuiz = words.length >= QUIZ_MIN_WORDS;
  const speech = word ? speechFor(word.term) : null;
  const voiced = speech && canSpeak(speech.lang) ? speech : null;

  const pass = (id: string) => setPassed(previous => new Set(previous).add(id));
  async function grade(value: StudyGrade) {
    if (!word || saving) return;
    setSaving(true); setError("");
    try {
      const data = await sendJson<{ words: StudyUpdate[] }>(VOCABULARY_API + "/review", { results: [{ id: word.id, grade: value }] });
      onStudied(data.words);
      pass(word.id);
    } catch (reason) {
      setError(failure(reason, "Давталтын явцыг хадгалж чадсангүй. Дахин оролдоно уу."));
    } finally { setSaving(false); }
  }

  return <section className={styles.study} aria-labelledby="voc-study-heading" data-study={word ? "card" : words.length ? "clear" : "empty"}>
    <div className={styles.studyHead}>
      <h2 id="voc-study-heading">Өнөөдрийн давталт</h2>
      <span className={styles.studyLeft}>{word ? `${queue.length} үг үлдлээ` : ""}</span>
      <div className={styles.studyTools}>
        <button type="button" className={styles.chipButton} onClick={() => onQuiz({})} disabled={!canQuiz}>Quiz тохируулах</button>
        <button type="button" className={styles.chipButton} onClick={() => onQuiz({ scope: "smart", start: true })} disabled={!canQuiz}><Icon name="bolt" size={15} />Ухаалаг давталт</button>
      </div>
    </div>

    {word ? <>
      <div className={styles.studyFace} data-study-word={word.id}>
        <p className={styles.studyTerm}>
          <span>{word.term}</span>
          {voiced ? <button type="button" className={styles.speakBig} onClick={() => speak(voiced.text, voiced.lang)} aria-label={`${word.term} үгийг сонсох`} title="Сонсох"><Icon name="sound" size={19} /></button> : null}
        </p>
        {revealed ? <>
          <p className={styles.studyAnswer}>{word.translation}</p>
          {word.example ? <p className={styles.studyExample}>“{word.example}”</p> : null}
        </> : <Level word={word} now={now} />}
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {revealed ? <div className={styles.studyGrade}>
        <button type="button" className={`${styles.ghost} ${styles.dangerGhost}`} onClick={() => void grade("again")} disabled={saving}>Мэдээгүй</button>
        <button type="button" className={styles.primary} onClick={() => void grade("good")} disabled={saving} aria-busy={saving}>Мэдсэн</button>
      </div> : <div className={styles.studyGrade}>
        <button type="button" className={styles.ghost} onClick={() => { setError(""); pass(word.id); }}>Алгасах</button>
        <button type="button" className={styles.primary} onClick={() => setShown(word.id)}>Утгыг харах</button>
      </div>}
    </> : <div className={styles.studyRest}>
      <h3>{words.length ? "Өнөөдрийн үгс дууслаа" : "Энд таны үг карт болж гарна"}</h3>
      <p>{!words.length ? "Доороос эхний үгээ нэмээрэй. Картыг эргүүлээд мэдсэн эсэхээ тэмдэглэхэд дараагийн давталтын өдөр товлогдоно."
        : canQuiz ? "Давтах цаг нь болсон болон шинэ үг алга. Хүсвэл бүх үгээрээ чөлөөт quiz хийж болно."
          : `Давтах үг алга. Дор хаяж ${QUIZ_MIN_WORDS} үг хадгалбал quiz нээгдэнэ.`}</p>
    </div>}
  </section>;
}
