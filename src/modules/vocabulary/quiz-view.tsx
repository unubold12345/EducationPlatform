"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { VocabularyWord } from "./contracts";
import {
  buildQuiz, QUIZ_COUNTS, QUIZ_DIRECTIONS, QUIZ_MIN_WORDS, questionLead,
  type QuizDirection, type QuizQuestion,
} from "./quiz";
import styles from "./vocabulary.module.css";

const DIRECTION_LABEL: Record<QuizDirection, string> = {
  mixed: "Холимог",
  "term-to-translation": "Үг → орчуулга",
  "translation-to-term": "Орчуулга → үг",
};

export function Quiz({ words, onExit }: { words: VocabularyWord[]; onExit: () => void }) {
  const [stage, setStage] = useState<"setup" | "run" | "done">("setup");
  const [count, setCount] = useState<number>(10);
  const [direction, setDirection] = useState<QuizDirection>("mixed");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState("");

  const question = questions[index];
  const chosen = answers[index] ?? null;
  const answered = chosen !== null;
  const correct = question ? chosen === question.answer : false;

  function start() {
    const built = buildQuiz(words, { count, direction });
    if (!built.length) {
      setError(`Quiz барихад дор хаяж ${QUIZ_MIN_WORDS} өөр үг хэрэгтэй. Дахин үг нэмээд оролдоно уу.`);
      return;
    }
    setError("");
    setQuestions(built);
    setAnswers(new Array(built.length).fill(null));
    setIndex(0);
    setStage("run");
  }

  function choose(option: number) {
    if (!question || answered || option < 0 || option >= question.options.length) return;
    setAnswers(current => {
      const next = [...current];
      next[index] = option;
      return next;
    });
  }

  function advance() {
    if (!question || !answered) return;
    if (index + 1 >= questions.length) setStage("done");
    else setIndex(current => current + 1);
  }

  useEffect(() => {
    if (stage !== "run" || !question) return;
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Escape") { event.preventDefault(); onExit(); return; }
      if (!answered) {
        const option = Number(event.key);
        if (Number.isInteger(option) && option >= 1 && option <= question.options.length) {
          event.preventDefault();
          choose(option - 1);
        }
        return;
      }
      if (event.key === "Enter" || event.key === "ArrowRight") { event.preventDefault(); advance(); }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  if (stage === "setup") return <div className={`wsp-page ${styles.page}`}>
    <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Үгс рүү буцах</button>
    <section className={styles.quizSetup} aria-labelledby="quiz-setup-heading">
      <span className={styles.quizSetupMark} aria-hidden="true"><Icon name="bolt" size={28} /></span>
      <p className={styles.kicker}>ӨӨРИЙН ҮГЭЭР ШАЛГАХ</p>
      <h1 id="quiz-setup-heading">Quiz тохируулах</h1>
      <p className={styles.quizIntro}>{words.length} хадгалсан үгнээс санамсаргүй сонгож, дөрвөн сонголттой асуулт гаргана. Оноо зөвхөн энэ хуудсанд үлдэнэ.</p>
      <div className={styles.quizOptions}>
        <div className={styles.option} role="group" aria-label="Асуултын тоо">
          <span>Асуултын тоо</span>
          <div className={styles.segmented}>{QUIZ_COUNTS.map(value => <button key={value} type="button" aria-pressed={count === value} className={count === value ? styles.segmentActive : undefined} onClick={() => setCount(value)}>{value}</button>)}</div>
          <small>{words.length < 10 ? `Санда ${words.length} үг байгаа тул бүгдийг асууна.` : `Хамгийн ихдээ ${Math.min(count, words.length)} асуулт.`}</small>
        </div>
        <div className={styles.option} role="group" aria-label="Асуултын чиглэл">
          <span>Чиглэл</span>
          <div className={styles.segmented}>{QUIZ_DIRECTIONS.map(value => <button key={value} type="button" aria-pressed={direction === value} className={direction === value ? styles.segmentActive : undefined} onClick={() => setDirection(value)}>{DIRECTION_LABEL[value]}</button>)}</div>
          <small>Холимог горимд үг, орчуулгын аль алинаас асууна.</small>
        </div>
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button type="button" className={styles.quizStart} onClick={start} disabled={words.length < QUIZ_MIN_WORDS}><Icon name="bolt" size={18} />Quiz эхлэх</button>
      <p className={styles.fine}>Асуулт, сонголтууд таны хадгалсан үгсээс бүрдэнэ. Quiz-ийн оноо серверт хадгалагдахгүй.</p>
    </section>
  </div>;

  if (stage === "done") {
    const total = questions.length;
    const hits = questions.reduce((sum, item, number) => sum + (answers[number] === item.answer ? 1 : 0), 0);
    const percent = total ? Math.round((hits / total) * 100) : 0;
    const missed = questions.filter((item, number) => answers[number] !== item.answer);
    return <div className={`wsp-page ${styles.page}`}>
      <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Үгс рүү буцах</button>
      <section className={styles.quizDone} aria-labelledby="quiz-done-heading">
        <span className={styles.quizDoneMark} aria-hidden="true"><Icon name="check" size={30} /></span>
        <p className={styles.kicker}>QUIZ ДУУССАН</p>
        <h1 id="quiz-done-heading">{percent >= 80 ? "Сайн байна!" : percent >= 50 ? "Дахин давтахад бэлэн." : "Дахин давтъя."}</h1>
        <p className={styles.quizScore}><strong>{hits}</strong> / {total} зөв · <b>{percent}%</b></p>
        {missed.length ? <div className={styles.missed}>
          <h2>Алдсан үгс</h2>
          <ul>{missed.map(item => <li key={item.id}><strong>{item.term}</strong><span>{item.translation}</span></li>)}</ul>
        </div> : <p className={styles.perfect}>Бүх асуултад зөв хариулсан байна.</p>}
        <div className={styles.quizDoneActions}>
          <button type="button" className={styles.primary} onClick={start}><Icon name="repeat" size={18} />Дахин авах</button>
          <button type="button" className={styles.ghost} onClick={onExit}>Үгс рүү буцах</button>
        </div>
        <p className={styles.fine}>Дахин авахад асуулт, сонголтууд шинээр холилдоно.</p>
      </section>
    </div>;
  }

  if (!question) return <div className={`wsp-page ${styles.page}`}>
    <p className={styles.error} role="alert">Quiz ачаалж чадсангүй. Үгс рүү буцаад дахин оролдоно уу.</p>
    <button type="button" className={styles.ghost} onClick={onExit}>Үгс рүү буцах</button>
  </div>;

  const directionCopy = questionLead(question.direction);
  return <div className={`wsp-page ${styles.page}`}>
    <div className={styles.quizTop}>
      <button type="button" className={styles.back} onClick={onExit}><Icon name="close" size={18} />Гарах</button>
      <div className={styles.quizTopTitle}><span>Quiz</span><strong>{index + 1} / {questions.length}</strong></div>
      <span className={styles.quizTopScore}>{answers.filter((answer, number) => answer !== null && answer === questions[number].answer).length} зөв</span>
    </div>
    <div className={styles.studyBar}><span>{index + 1} / {questions.length}</span><span className={styles.track} aria-hidden="true"><i style={{ width: Math.round(((index + 1) / questions.length) * 100) + "%" }} /></span><span>{questions.length} асуулт</span></div>

    <section className={styles.questionCard} aria-labelledby="quiz-question">
      <p className={styles.questionLead}>{directionCopy}</p>
      <h1 id="quiz-question" className={styles.questionPrompt}>{question.prompt}</h1>
      <div className={styles.choices} role="group" aria-label="Хариултын сонголтууд">
        {question.options.map((option, number) => {
          const state = !answered ? "" : number === question.answer ? styles.optionCorrect : number === chosen ? styles.optionWrong : styles.optionDim;
          return <button key={option + number} type="button" className={`${styles.optionButton} ${state}`} onClick={() => choose(number)} disabled={answered} aria-pressed={chosen === number}>
            <span className={styles.optionKey} aria-hidden="true">{number + 1}</span><span>{option}</span>
          </button>;
        })}
      </div>
      <div className={styles.feedback} aria-live="polite">
        {answered ? <>
          <strong className={correct ? styles.feedbackGood : styles.feedbackBad}>{correct ? "Зөв!" : "Алдлаа"}</strong>
          {!correct ? <p>Зөв хариулт: <b>{question.options[question.answer]}</b></p> : null}
          <p className={styles.feedbackPair}><span>{question.term}</span><i aria-hidden="true">→</i><span>{question.translation}</span></p>
          {question.example ? <p className={styles.feedbackExample}>“{question.example}”</p> : null}
        </> : <p className={styles.feedbackHint}>Хариултаа сонгоно уу.</p>}
      </div>
      <div className={styles.quizFoot}>
        <span className={styles.keys}>1–{question.options.length} — хариулах · Enter — дараах · Esc — гарах</span>
        <button type="button" className={styles.primary} onClick={advance} disabled={!answered}>{index + 1 >= questions.length ? "Дуусгах" : "Дараах"}<Icon name="arrow" size={17} /></button>
      </div>
    </section>
    <p className={styles.fine}>Quiz нь таны өөрийн хадгалсан үгсээр бүрдэнэ. Энэ нь шалгалтын дүн биш, давталтын дасгал юм.</p>
  </div>;
}
