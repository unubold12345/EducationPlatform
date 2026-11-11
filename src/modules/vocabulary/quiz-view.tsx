"use client";
import { useEffect, useEffectEvent, useMemo, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate, VocabularyDeck, VocabularyWord } from "./contracts";
import {
  buildQuiz, checkTyped, clozeText, fiftyFifty, QUIZ_DIRECTIONS, QUIZ_KINDS, QUIZ_MIN_WORDS, QUIZ_SCOPES, QUIZ_TIMERS, questionLead, quizPool,
  retryOf, speechFor, typingHint,
  type QuizDirection, type QuizKind, type QuizQuestion, type QuizScope,
} from "./quiz";
import { STUDY_BOX_MAX, type StudyGrade } from "./study";
import { failure, readStored, sendJson, VOCABULARY_API, writeStored } from "./api";
import { speak, stopSpeaking, useVoices } from "./speech";
import { Glyph, type GlyphName } from "./glyphs";
import type { QuizLaunch } from "./library";
import styles from "./vocabulary.module.css";

const DIRECTION_LABEL: Record<QuizDirection, string> = {
  mixed: "Холимог",
  "term-to-translation": "Үг → орчуулга",
  "translation-to-term": "Орчуулга → үг",
};
const KIND_LABEL: Record<QuizKind, string> = {
  choice: "Сонголттой", typing: "Бичих", truefalse: "Зөв / Буруу", listening: "Сонсох", cloze: "Өгүүлбэр нөхөх", card: "Карт эргүүлэх",
};
const KIND_NOTE: Record<QuizKind, string> = {
  choice: "4 хариултаас сонгоно", typing: "Хариултаа өөрөө бичнэ", truefalse: "Хослол зөв эсэхийг шийднэ",
  listening: "Дуудлагыг сонсоод таана", cloze: "Жишээ өгүүлбэрийн зайг нөхнө", card: "Санаад, өөрийгөө үнэлнэ",
};
const KIND_GLYPH: Record<QuizKind, GlyphName> = { choice: "options", typing: "keyboard", truefalse: "scale", listening: "target", cloze: "gap", card: "flip" };
const SCOPE_LABEL: Record<QuizScope, string> = {
  smart: "Ухаалаг", all: "Бүх үг", due: "Давтах цаг болсон", new: "Шинэ үгс", weak: "Сул үгс", starred: "Онцолсон",
};
const MAX_QUESTIONS = 50;

type Settings = { kinds: QuizKind[]; count: number; direction: QuizDirection; timer: number; requeue: boolean; autoSpeak: boolean };
const DEFAULTS: Settings = { kinds: ["choice", "truefalse", "typing"], count: 10, direction: "mixed", timer: 0, requeue: true, autoSpeak: false };
type Outcome = { result: "correct" | "close" | "wrong" | "timeout"; chosen: number | null; typed: string; hinted: boolean };
type Run = { questions: QuizQuestion[]; outcomes: (Outcome | null)[]; index: number; startedAt: number; before: Record<string, number> };
type Finished = { seconds: number; best: number };

const settingsKey = (userId: string) => `education-vocabulary-quiz-v2:${userId}`;
/** Saved choices are a convenience; anything unreadable falls back to the defaults. */
function loadSettings(userId: string): Settings {
  const stored = readStored<Partial<Settings>>(settingsKey(userId));
  if (!stored || typeof stored !== "object") return DEFAULTS;
  const kinds = Array.isArray(stored.kinds) ? QUIZ_KINDS.filter(kind => stored.kinds!.includes(kind)) : [];
  return {
    kinds: kinds.length ? kinds : DEFAULTS.kinds,
    count: Number.isInteger(stored.count) && stored.count! >= 1 && stored.count! <= MAX_QUESTIONS ? stored.count! : DEFAULTS.count,
    direction: QUIZ_DIRECTIONS.includes(stored.direction as QuizDirection) ? stored.direction as QuizDirection : DEFAULTS.direction,
    timer: (QUIZ_TIMERS as readonly number[]).includes(stored.timer as number) ? stored.timer as number : DEFAULTS.timer,
    requeue: typeof stored.requeue === "boolean" ? stored.requeue : DEFAULTS.requeue,
    autoSpeak: typeof stored.autoSpeak === "boolean" ? stored.autoSpeak : DEFAULTS.autoSpeak,
  };
}
const right = (outcome: Outcome | null | undefined) => outcome?.result === "correct" || outcome?.result === "close";
const gradeOf = (outcome: Outcome): StudyGrade => !right(outcome) ? "again" : outcome.result === "close" || outcome.hinted ? "hard" : "good";
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function makeRun(pool: VocabularyWord[], bank: VocabularyWord[], settings: Settings, smart: boolean, canSpeak: (lang: string) => boolean): Run | null {
  const startedAt = Date.now();
  const questions = buildQuiz(pool, {
    count: Math.min(settings.count, MAX_QUESTIONS), direction: settings.direction, kinds: settings.kinds,
    order: smart ? "smart" : "random", bank, canSpeak, now: startedAt,
  });
  if (!questions.length) return null;
  const boxes = new Map(bank.map(word => [word.id, word.box]));
  return { questions, outcomes: questions.map(() => null), index: 0, startedAt, before: Object.fromEntries(questions.map(item => [item.wordId, boxes.get(item.wordId) ?? 0])) };
}

export function Quiz({ userId, words, decks, launch, now, onExit, onStudied, onStar }: {
  userId: string; words: VocabularyWord[]; decks: VocabularyDeck[]; launch: QuizLaunch; now: number;
  onExit: () => void; onStudied: (updates: StudyUpdate[]) => void; onStar: (ids: string[]) => Promise<string | null>;
}) {
  const { canSpeak, any: hasVoice } = useVoices();
  const [settings, setSettings] = useState<Settings>(() => loadSettings(userId));
  const [scope, setScope] = useState<QuizScope>(launch.scope ?? "smart");
  const [deck, setDeck] = useState<string>(launch.deckId === undefined ? "all" : launch.deckId ?? "none");
  // The quiz only ever opens from a click, so the first session can be built while mounting.
  const [run, setRun] = useState<Run | null>(() => launch.start ? makeRun(scopedPool(words, launch, launch.scope ?? "smart", launch.deckId === undefined ? "all" : launch.deckId ?? "none", now), words, loadSettings(userId), true, () => false) : null);
  const [done, setDone] = useState<Finished | null>(null);
  const [error, setError] = useState("");
  // One question's working state.
  const [typed, setTyped] = useState("");
  const [hidden, setHidden] = useState<number[]>([]);
  const [hinted, setHinted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  // After the session.
  const [saved, setSaved] = useState<StudyUpdate[] | null>(null);
  const [saveError, setSaveError] = useState("");
  const [starred, setStarred] = useState(false);
  const answerInput = useRef<HTMLInputElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);

  const fixed = launch.wordIds?.length ? launch.wordIds : null;
  const inDeck = useMemo(() => scopedPool(words, launch, "all", deck, now), [words, launch, deck, now]);
  const pool = useMemo(() => scopedPool(words, launch, scope, deck, now), [words, launch, scope, deck, now]);
  const scopeCounts = useMemo(() => Object.fromEntries(QUIZ_SCOPES.map(item => [item, quizPool(inDeck, { scope: item, now }).length])) as Record<QuizScope, number>, [inDeck, now]);
  const available: Record<QuizKind, boolean> = useMemo(() => ({
    choice: true, typing: true, truefalse: true, card: true,
    listening: pool.some(word => { const speech = speechFor(word.term); return Boolean(speech && canSpeak(speech.lang)); }),
    cloze: pool.some(word => clozeText(word.example, word.term)),
  }), [pool, canSpeak]);
  const kinds = settings.kinds.filter(kind => available[kind]);
  const most = Math.min(MAX_QUESTIONS, pool.length);
  const count = Math.max(1, Math.min(settings.count, most));

  const question = run?.questions[run.index] ?? null;
  const outcome = run?.outcomes[run.index] ?? null;
  const answered = outcome !== null;
  const stage = done ? "done" : run ? "run" : "setup";

  function change(patch: Partial<Settings>) {
    setSettings(current => ({ ...current, ...patch }));
  }
  function toggleKind(kind: QuizKind) {
    setSettings(current => {
      const kinds = current.kinds.includes(kind) ? current.kinds.filter(item => item !== kind) : QUIZ_KINDS.filter(item => item === kind || current.kinds.includes(item));
      return kinds.length ? { ...current, kinds } : current;
    });
  }
  function resetQuestion() {
    setTyped(""); setHidden([]); setHinted(false); setRevealed(false);
  }
  function start(from: VocabularyWord[] = pool, smart = scope === "smart" || scope === "due") {
    if (words.length < QUIZ_MIN_WORDS) { setError(`Quiz барихад дор хаяж ${QUIZ_MIN_WORDS} өөр үг хэрэгтэй. Дахин үг нэмээд оролдоно уу.`); return; }
    if (!from.length) { setError("Энэ сонголтод үг алга. Өөр хүрээ эсвэл багц сонгоно уу."); return; }
    const built = makeRun(from, words, { ...settings, kinds: kinds.length ? kinds : ["choice"], count: Math.min(count, from.length) }, smart, canSpeak);
    if (!built) { setError("Эдгээр үгээр асуулт барьж чадсангүй. Өөр хэлбэр эсвэл чиглэл сонгоно уу."); return; }
    setError(""); setRun(built); setDone(null); setSaved(null); setSaveError(""); setStarred(false); setStreak(0); setBest(0);
    resetQuestion();
  }

  /** One grade per word, from its first ask in this session. */
  function grades(current: Run) {
    return current.questions.flatMap((item, index) => {
      const result = current.outcomes[index];
      return item.retry || !result ? [] : [{ id: item.wordId, grade: gradeOf(result) }];
    });
  }
  async function save(current: Run) {
    const results = grades(current);
    if (!results.length) return;
    setSaveError("");
    try {
      const data = await sendJson<{ words: StudyUpdate[] }>(VOCABULARY_API + "/review", { results });
      setSaved(data.words);
      onStudied(data.words);
    } catch (reason) {
      setSaveError(failure(reason, "Давталтын явцыг хадгалж чадсангүй."));
    }
  }
  function leave() {
    stopSpeaking();
    // Words already answered keep their progress when a session is left early.
    if (run && !done) void save(run);
    onExit();
  }

  function settle(result: Outcome["result"], detail: { chosen?: number; typed?: string } = {}) {
    if (!run || !question || answered) return;
    const entry: Outcome = { result, chosen: detail.chosen ?? null, typed: detail.typed ?? "", hinted };
    const hit = right(entry);
    const outcomes = [...run.outcomes];
    outcomes[run.index] = entry;
    // A missed word comes back once at the end of the session.
    const again = !hit && settings.requeue && !question.retry;
    setRun({ ...run, outcomes: again ? [...outcomes, null] : outcomes, questions: again ? [...run.questions, retryOf(question, "r" + run.questions.length)] : run.questions });
    setStreak(hit ? streak + 1 : 0);
    if (hit && streak + 1 > best) setBest(streak + 1);
  }
  function choose(option: number) {
    if (!question || answered || option < 0 || option >= question.options.length || hidden.includes(option)) return;
    settle(option === question.answer ? "correct" : "wrong", { chosen: option });
  }
  function submitTyped(event: FormEvent) {
    event.preventDefault();
    if (!question || answered || !typed.trim()) return;
    const verdict = checkTyped(typed, question.accepted);
    settle(verdict === "exact" ? "correct" : verdict === "close" ? "close" : "wrong", { typed });
  }
  function hint() {
    if (!question || answered || hinted) return;
    if (question.kind === "typing") { setHinted(true); answerInput.current?.focus(); return; }
    if (question.options.length < 3 || question.kind === "truefalse") return;
    setHidden(fiftyFifty(question));
    setHinted(true);
  }
  function advance() {
    if (!run || !question || !answered) return;
    stopSpeaking();
    if (run.index + 1 >= run.questions.length) {
      setDone({ seconds: Math.max(1, Math.round((Date.now() - run.startedAt) / 1000)), best });
      void save(run);
      return;
    }
    setRun({ ...run, index: run.index + 1 });
    resetQuestion();
  }

  // The chosen settings are remembered in this browser for the next session.
  useEffect(() => { writeStored(settingsKey(userId), settings); }, [userId, settings]);

  const expire = useEffectEvent(() => settle("timeout"));
  const timed = stage === "run" && settings.timer > 0 && question !== null && !answered && question.kind !== "card";
  const questionId = question?.id;
  useEffect(() => {
    if (!timed) return;
    const timer = setTimeout(expire, settings.timer * 1000);
    return () => clearTimeout(timer);
  }, [timed, questionId, settings.timer]);

  // A listening question is read aloud as it appears; other words only when the student asked for it.
  const prompted = stage === "run" && question && !answered
    && (question.kind === "listening" || (settings.autoSpeak && question.kind !== "cloze" && question.direction === "term-to-translation"))
    && question.speech && canSpeak(question.speech.lang) ? question.speech : null;
  const promptText = prompted?.text, promptLang = prompted?.lang;
  useEffect(() => {
    if (promptText && promptLang) speak(promptText, promptLang);
  }, [questionId, promptText, promptLang]);

  useEffect(() => {
    if (stage !== "run") return;
    if (answered) nextButton.current?.focus();
    else if (question?.kind === "typing") answerInput.current?.focus();
  }, [stage, questionId, answered, question?.kind]);

  const keys = useEffectEvent((event: KeyboardEvent) => {
    if (stage !== "run" || !question || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Escape") { event.preventDefault(); leave(); return; }
    const target = event.target as HTMLElement | null;
    if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    if (answered) {
      if (event.key === "Enter" || event.key === "ArrowRight") { event.preventDefault(); advance(); }
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "h") { event.preventDefault(); hint(); return; }
    if (question.kind === "card") {
      if (!revealed && (event.key === " " || event.key === "Enter")) { event.preventDefault(); setRevealed(true); }
      else if (revealed && event.key === "1") { event.preventDefault(); settle("wrong"); }
      else if (revealed && event.key === "2") { event.preventDefault(); settle("correct"); }
      return;
    }
    const option = Number(event.key);
    if (Number.isInteger(option) && option >= 1 && option <= question.options.length) { event.preventDefault(); choose(option - 1); }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keys(event);
    addEventListener("keydown", listener);
    return () => removeEventListener("keydown", listener);
  }, []);

  if (stage === "setup") return <div className={`wsp-page ${styles.page}`}>
    <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Үгс рүү буцах</button>
    <section className={styles.quizSetup} aria-labelledby="quiz-setup-heading">
      <div className={styles.setupHead}>
        <span className={styles.quizSetupMark} aria-hidden="true"><Icon name="bolt" size={26} /></span>
        <div>
          <p className={styles.kicker}>ӨӨРИЙН ҮГЭЭР ШАЛГАХ</p>
          <h1 id="quiz-setup-heading">Quiz тохируулах</h1>
        </div>
      </div>

      {fixed ? <p className={styles.setupFixed}><Icon name="check" size={16} />Сонгосон {pool.length} үгээр асууна.</p> : <>
        <div className={styles.option} role="group" aria-label="Асуух үгс">
          <span>Юуг давтах вэ</span>
          <div className={styles.scopeGrid}>{QUIZ_SCOPES.map(item => <button key={item} type="button" data-scope={item} aria-pressed={scope === item} disabled={item !== "smart" && item !== "all" && !scopeCounts[item]}
            onClick={() => { setScope(item); setError(""); }}><strong>{SCOPE_LABEL[item]}</strong><span>{item === "smart" ? "Чухлыг нь түрүүлж" : `${scopeCounts[item]} үг`}</span></button>)}</div>
          <small>{scope === "smart" ? "Давтах цаг нь болсон, шинэ, сул үгсийг түрүүлж асууна." : `${pool.length} үгээс асууна.`}</small>
        </div>
        <label className={styles.option}><span>Багц</span>
          <select value={deck} onChange={event => { setDeck(event.target.value); setError(""); }}>
            <option value="all">Бүх багц</option>
            {decks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            <option value="none">Багцгүй үгс</option>
          </select>
        </label>
      </>}

      <div className={styles.option} role="group" aria-label="Асуултын хэлбэр">
        <span>Асуултын хэлбэр</span>
        <div className={styles.kindGrid}>{QUIZ_KINDS.map(kind => {
          const on = settings.kinds.includes(kind) && available[kind];
          return <button key={kind} type="button" data-kind={kind} aria-pressed={on} disabled={!available[kind]} onClick={() => toggleKind(kind)}>
            <Glyph name={KIND_GLYPH[kind]} size={18} /><span><strong>{KIND_LABEL[kind]}</strong><small>{available[kind] ? KIND_NOTE[kind] : kind === "listening" ? "Энэ хөтөч дуудаж чадахгүй" : "Жишээ өгүүлбэртэй үг алга"}</small></span>
          </button>;
        })}</div>
        <small>Хэд хэдийг сонговол үгийн түвшинд тааруулж холино: шинэ үгэнд хялбар, танил үгэнд хэцүү хэлбэр.</small>
      </div>

      <div className={styles.setupRow}>
        <div className={styles.option}>
          <label htmlFor="quiz-count">Асуултын тоо</label>
          <div className={styles.rangeRow}>
            <input id="quiz-count" type="range" min={1} max={Math.max(1, most)} value={count} onChange={event => change({ count: Number(event.target.value) })} disabled={most <= 1} />
            <output htmlFor="quiz-count">{count}</output>
          </div>
        </div>
        <div className={styles.option} role="group" aria-label="Асуултын чиглэл">
          <span>Чиглэл</span>
          <div className={styles.segmented}>{QUIZ_DIRECTIONS.map(value => <button key={value} type="button" aria-pressed={settings.direction === value} className={settings.direction === value ? styles.segmentActive : undefined} onClick={() => change({ direction: value })}>{DIRECTION_LABEL[value]}</button>)}</div>
        </div>
        <div className={styles.option} role="group" aria-label="Асуулт бүрийн хугацаа">
          <span>Асуулт бүрийн хугацаа</span>
          <div className={styles.segmented}>{QUIZ_TIMERS.map(value => <button key={value} type="button" aria-pressed={settings.timer === value} className={settings.timer === value ? styles.segmentActive : undefined} onClick={() => change({ timer: value })}>{value ? `${value} секунд` : "Цаггүй"}</button>)}</div>
        </div>
      </div>

      <div className={styles.switches}>
        <label className={styles.switch}><input type="checkbox" checked={settings.requeue} onChange={event => change({ requeue: event.target.checked })} /><span>Алдсан үгийг төгсгөлд дахин асуух</span></label>
        <label className={styles.switch}><input type="checkbox" checked={settings.autoSpeak && hasVoice} onChange={event => change({ autoSpeak: event.target.checked })} disabled={!hasVoice} /><span>Үгийг гарч ирэхэд нь дуудах</span></label>
      </div>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button type="button" className={styles.quizStart} onClick={() => start()} disabled={words.length < QUIZ_MIN_WORDS || !pool.length}><Icon name="bolt" size={18} />Quiz эхлэх · {count} асуулт</button>
      <p className={styles.fine}>{words.length < QUIZ_MIN_WORDS ? `Дор хаяж ${QUIZ_MIN_WORDS} үг хадгалаад quiz эхлүүлээрэй.` : "Хариулт бүр үгийн түвшинг шинэчилж, дараагийн давталтын цагийг товлоно."}</p>
    </section>
  </div>;

  if (stage === "done" && run && done) {
    const first = run.questions.map((item, index) => ({ item, result: run.outcomes[index] })).filter(entry => !entry.item.retry && entry.result);
    const total = first.length;
    const hits = first.filter(entry => right(entry.result)).length;
    const percent = total ? Math.round((hits / total) * 100) : 0;
    const missed = first.filter(entry => !right(entry.result)).map(entry => entry.item.wordId);
    const after = new Map((saved ?? []).map(item => [item.id, item.box]));
    const raised = first.filter(entry => right(entry.result) && (after.get(entry.item.wordId) ?? -1) > (run.before[entry.item.wordId] ?? 0)).length;
    const missedWords = words.filter(word => missed.includes(word.id));
    return <div className={`wsp-page ${styles.page}`}>
      <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Үгс рүү буцах</button>
      <section className={styles.quizDone} aria-labelledby="quiz-done-heading">
        <span className={styles.quizDoneMark} data-tone={percent >= 80 ? "good" : percent >= 50 ? "ok" : "low"} aria-hidden="true"><strong>{percent}</strong>%</span>
        <p className={styles.kicker}>QUIZ ДУУССАН</p>
        <h1 id="quiz-done-heading">{percent >= 80 ? "Сайн байна!" : percent >= 50 ? "Дахин давтахад бэлэн." : "Дахин давтъя."}</h1>
        <p className={styles.quizScore}><strong>{hits}</strong> / {total} зөв</p>
        <dl className={styles.doneStats}>
          <div><dt>Хугацаа</dt><dd>{clock(done.seconds)}</dd></div>
          <div><dt>Хамгийн урт цуврал</dt><dd>{done.best}</dd></div>
          <div><dt>Түвшин ахисан</dt><dd>{saved ? raised : "…"}</dd></div>
        </dl>
        {saveError ? <p className={styles.error} role="alert">{saveError} <button type="button" className={styles.link} onClick={() => void save(run)}>Дахин оролдох</button></p> : null}

        <div className={styles.missed}>
          <h2>Үгсийн дүн</h2>
          <ul>{first.map(({ item, result }) => {
            const was = run.before[item.wordId] ?? 0, next = after.get(item.wordId);
            return <li key={item.id} data-result={right(result) ? (result!.result === "close" || result!.hinted ? "hard" : "good") : "again"}>
              <span className={styles.resultMark} aria-hidden="true"><Icon name={right(result) ? "check" : "close"} size={14} /></span>
              <strong>{item.term}</strong><span>{item.translation}</span>
              {next === undefined ? null : !right(result) ? <em className={styles.down}>Удахгүй дахин асууна</em>
                : <em className={next > was ? styles.up : undefined}>{next > was ? `Түвшин ${was} → ${next}` : `Түвшин ${next}/${STUDY_BOX_MAX}`}</em>}
            </li>;
          })}</ul>
        </div>
        {!missed.length ? <p className={styles.perfect}>Бүх асуултад зөв хариулсан байна.</p> : null}

        <div className={styles.quizDoneActions}>
          {missedWords.length ? <button type="button" className={styles.primary} onClick={() => start(missedWords, false)}><Icon name="repeat" size={17} />Алдсан {missedWords.length} үгээр дахин</button> : null}
          <button type="button" className={missedWords.length ? styles.ghost : styles.primary} onClick={() => start()}><Icon name="repeat" size={17} />Дахин авах</button>
          <button type="button" className={styles.ghost} onClick={() => { setRun(null); setDone(null); }}>Тохиргоо</button>
          {missedWords.length ? <button type="button" className={styles.ghost} disabled={starred} onClick={() => { setStarred(true); void onStar(missedWords.map(word => word.id)).then(problem => { if (problem) { setStarred(false); setSaveError(problem); } }); }}>
            <Glyph name="star" size={16} filled={starred} />{starred ? "Онцолсон" : "Алдсан үгсийг онцлох"}
          </button> : null}
          <button type="button" className={styles.ghost} onClick={onExit}>Үгс рүү буцах</button>
        </div>
      </section>
    </div>;
  }

  if (!run || !question) return <div className={`wsp-page ${styles.page}`}>
    <p className={styles.error} role="alert">Quiz ачаалж чадсангүй. Үгс рүү буцаад дахин оролдоно уу.</p>
    <button type="button" className={styles.ghost} onClick={onExit}>Үгс рүү буцах</button>
  </div>;

  const hitsSoFar = run.outcomes.filter((item, index) => right(item) && !run.questions[index].retry).length;
  const hasOptions = question.kind === "choice" || question.kind === "listening" || question.kind === "cloze";
  const canHint = !answered && !hinted && (question.kind === "typing" || (hasOptions && question.options.length >= 3));
  const voiced = question.speech && canSpeak(question.speech.lang) ? question.speech : null;
  // Before the answer, the word may only be heard when hearing it does not give the answer away.
  const mayHear = voiced && (answered || question.kind === "listening" || (question.direction === "term-to-translation" && question.kind !== "cloze"));
  const hiddenPrompt = question.kind === "listening" && !answered;
  const verdict = !outcome ? "" : outcome.result === "timeout" ? "Цаг дууслаа" : outcome.result === "close" ? "Бараг зөв!" : outcome.result === "correct" ? "Зөв!" : "Алдлаа";
  const correctText = question.kind === "typing" || question.kind === "card" ? (question.direction === "term-to-translation" ? question.translation : question.term)
    : question.kind === "truefalse" ? (question.direction === "term-to-translation" ? question.translation : question.term) : question.options[question.answer];

  return <div className={`wsp-page ${styles.page}`}>
    <div className={styles.quizTop}>
      <button type="button" className={styles.back} onClick={leave}><Icon name="close" size={18} />Гарах</button>
      <div className={styles.quizTopTitle}><span>Quiz</span><strong>{run.index + 1} / {run.questions.length}</strong></div>
      <span className={styles.quizTopScore}>{streak >= 2 ? <b className={styles.streak}><Icon name="flame" size={15} />{streak}</b> : null}{hitsSoFar} зөв</span>
    </div>
    <div className={styles.studyBar}><span className={styles.track} aria-hidden="true"><i style={{ width: Math.round(((run.index + (answered ? 1 : 0)) / run.questions.length) * 100) + "%" }} /></span></div>
    {timed ? <div key={question.id} className={styles.timer} aria-hidden="true"><i style={{ animationDuration: settings.timer + "s" }} /></div> : null}

    <section className={styles.questionCard} aria-labelledby="quiz-question" data-kind={question.kind}>
      <p className={styles.questionLead}><Glyph name={KIND_GLYPH[question.kind]} size={15} />{questionLead(question.direction, question.kind)}{question.retry ? <em>Дахин асууж байна</em> : null}</p>
      <div className={styles.promptRow}>
        <h1 id="quiz-question" className={`${styles.questionPrompt} ${question.kind === "cloze" ? styles.promptSentence : ""}`}>{hiddenPrompt ? "🔊" : question.prompt}</h1>
        {mayHear && voiced ? <button type="button" className={styles.speakBig} onClick={() => speak(voiced.text, voiced.lang)} aria-label="Дуудлагыг сонсох" title="Сонсох"><Icon name="sound" size={19} /></button> : null}
      </div>
      {question.kind === "truefalse" ? <p className={styles.claim}><span>=</span>{question.claim}</p> : null}
      {question.kind === "cloze" && hinted ? <p className={styles.clozeHint}>Утга: {question.translation}</p> : null}

      {hasOptions || question.kind === "truefalse" ? <div className={`${styles.choices} ${question.kind === "truefalse" ? styles.choicesTwo : ""}`} role="group" aria-label="Хариултын сонголтууд">
        {question.options.map((option, number) => {
          const state = !answered ? (hidden.includes(number) ? styles.optionDim : "") : number === question.answer ? styles.optionCorrect : number === outcome?.chosen ? styles.optionWrong : styles.optionDim;
          return <button key={option + number} type="button" className={`${styles.optionButton} ${state}`} onClick={() => choose(number)} disabled={answered || hidden.includes(number)} aria-pressed={outcome?.chosen === number}>
            <span className={styles.optionKey} aria-hidden="true">{number + 1}</span><span>{option}</span>
          </button>;
        })}
      </div> : null}

      {question.kind === "typing" ? <form className={styles.typing} onSubmit={submitTyped}>
        <input ref={answerInput} value={answered ? outcome?.typed ?? "" : typed} onChange={event => setTyped(event.target.value)} placeholder="Хариултаа бичнэ үү" aria-label="Хариулт" autoComplete="off" autoCapitalize="off" spellCheck={false} disabled={answered}
          className={answered ? (right(outcome) ? styles.typedRight : styles.typedWrong) : undefined} />
        {!answered ? <button type="submit" className={styles.primary} disabled={!typed.trim()}>Шалгах</button> : null}
        {hinted && !answered ? <p className={styles.typingHint}>Сануулга: <b>{typingHint(correctText)}</b></p> : null}
      </form> : null}

      {question.kind === "card" ? <div className={styles.flip}>
        {revealed || answered ? <p className={styles.flipBack}>{question.claim}</p> : <button type="button" className={styles.ghost} onClick={() => setRevealed(true)}>Хариуг харах</button>}
        {revealed && !answered ? <div className={styles.flipGrade}>
          <button type="button" className={`${styles.ghost} ${styles.dangerGhost}`} onClick={() => settle("wrong")}><span className={styles.optionKey} aria-hidden="true">1</span>Мэдээгүй</button>
          <button type="button" className={styles.primary} onClick={() => settle("correct")}><span className={styles.optionKey} aria-hidden="true">2</span>Мэдсэн</button>
        </div> : null}
      </div> : null}

      <div className={styles.feedback} aria-live="polite">
        {answered ? <>
          <strong className={right(outcome) ? styles.feedbackGood : styles.feedbackBad}>{verdict}</strong>
          {!right(outcome) || outcome?.result === "close" ? <p>Зөв хариулт: <b>{correctText}</b></p> : null}
          <p className={styles.feedbackPair}><span>{question.term}</span><i aria-hidden="true">→</i><span>{question.translation}</span></p>
          {question.example ? <p className={styles.feedbackExample}>“{question.example}”</p> : null}
        </> : <p className={styles.feedbackHint}>{question.kind === "card" ? "Хариуг санаад, дараа нь шалгаарай." : question.kind === "typing" ? "Хариултаа бичээд Enter дарна уу." : "Хариултаа сонгоно уу."}</p>}
      </div>
      <div className={styles.quizFoot}>
        <span className={styles.footTools}>
          {canHint ? <button type="button" className={styles.chipButton} onClick={hint}><Glyph name="bulb" size={15} />Сануулга</button> : null}
          {!answered && question.kind !== "card" ? <button type="button" className={styles.chipButton} onClick={() => settle("wrong")}>Мэдэхгүй</button> : null}
          <span className={styles.keys}>{question.kind === "card" ? "Space — эргүүлэх · 1/2 — үнэлэх" : question.kind === "typing" ? "Enter — шалгах, дараах" : `1–${question.options.length} — хариулах · Enter — дараах`}{question.kind === "typing" || (hasOptions && question.options.length >= 3) ? " · H — сануулга" : ""} · Esc — гарах</span>
        </span>
        <button ref={nextButton} type="button" className={styles.primary} onClick={advance} disabled={!answered}>{run.index + 1 >= run.questions.length ? "Дуусгах" : "Дараах"}<Icon name="arrow" size={17} /></button>
      </div>
    </section>
  </div>;
}

/** The words a session may draw from: an explicit selection, or a deck narrowed by scope. */
function scopedPool(words: VocabularyWord[], launch: QuizLaunch, scope: QuizScope, deck: string, now: number) {
  if (launch.wordIds?.length) {
    const ids = new Set(launch.wordIds);
    return words.filter(word => ids.has(word.id));
  }
  return quizPool(words, { scope, deckId: deck === "all" ? undefined : deck === "none" ? null : deck, now });
}
