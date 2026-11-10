"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import { ScoreRing } from "@/modules/workspace/score";
import { MathText } from "@/modules/exams/math-text";
import { EXAM_COUNTS, MY_EXAM_LIMITS, type ExamCount, type ExamLanguage } from "./contracts";
import {
  beginDraft, deleteExam, newExamId, saveExam, saveGrade, updateDraft, useExams,
  type Draft, type GradeReply, type StoredExam, type StoredQuestion, type StoredResult, type StoredResultItem,
} from "./store";
import styles from "./my-exams.module.css";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { examCreditAction } from "@/modules/credits/pricing";
import { MaterialImages, useMaterialPick } from "@/modules/ai-images/client";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv,image/*";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const LETTERS = "ABCDE";
const dateLabel = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "short", day: "numeric" });
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60)) + " мин";
const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
};
const kindLabel = (kind: string) => kind === "pdf" ? "PDF" : kind === "docx" ? "Word" : kind === "pptx" ? "PowerPoint" : kind === "image" ? "Зураг" : "Текст";

type View =
  | { kind: "list" }
  | { kind: "brief"; id: string }
  | { kind: "run"; id: string; mode: Draft["mode"]; startedAt: number }
  | { kind: "result"; id: string };

export function MyExams({ userKey }: { userKey: string }) {
  const exams = useExams(userKey);
  const [view, setView] = useState<View>({ kind: "list" });
  const material = useMaterialPick({ extensions: ALLOWED, maxBytes: MY_EXAM_LIMITS.fileBytes, documentHint: "PDF, Word, PowerPoint, TXT, MD, CSV файл эсвэл хуудасны зураг сонгоно уу." });
  const picked = material.pick;
  const file = picked?.kind === "document" ? picked.file : null;
  const [count, setCount] = useState<ExamCount>(10);
  const [language, setLanguage] = useState<ExamLanguage>("mn");
  const [pending, setPending] = useState(false);
  const { apply } = useCredits();
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fresh, setFresh] = useState<{ id: string; result: StoredResult } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const active = view.kind === "list" ? null : exams.find(exam => exam.id === view.id) ?? null;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);

  async function pick(next: ArrayLike<File> | null | undefined) {
    setError("");
    setError(await material.choose(next));
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!pending) void pick(event.dataTransfer.files);
  }
  async function generate() {
    if (!picked || pending || material.preparing) return;
    setPending(true); setError("");
    try {
      const form = new FormData();
      material.append(form);
      form.append("count", String(count));
      form.append("language", language);
      const response = await fetch("/api/workspace/my-exams", { method: "POST", body: form, signal: AbortSignal.timeout(175_000) });
      const data = await jsonObject(response);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Шалгалт үүсгэж чадсангүй. Дахин оролдоно уу.");
      apply(data);
      const exam = createdExam(data);
      if (!exam) throw new Error("AI шалгалт бүрэн ирсэнгүй. Дахин оролдоно уу.");
      saveExam(userKey, exam);
      setView({ kind: "brief", id: exam.id });
      material.clear();
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Шалгалт үүсгэхэд хэт удлаа. Дахин оролдоно уу.");
    } finally { setPending(false); }
  }
  function open(exam: StoredExam) {
    setError(""); setFresh(null);
    if (exam.draft) setView({ kind: "run", id: exam.id, mode: exam.draft.mode, startedAt: exam.draft.startedAt });
    else setView({ kind: "brief", id: exam.id });
  }
  function start(exam: StoredExam, mode: Draft["mode"]) {
    const now = Date.now();
    beginDraft(userKey, exam.id, mode, now);
    setError(""); setFresh(null);
    setView({ kind: "run", id: exam.id, mode, startedAt: now });
  }
  function graded(exam: StoredExam, grade: GradeReply, elapsedSeconds: number, timed: boolean) {
    saveGrade(userKey, exam.id, grade, { elapsedSeconds, timed });
    setFresh({ id: exam.id, result: { total: grade.total, correct: grade.correct, percent: grade.percent, finishedAt: grade.gradedAt, elapsedSeconds, timed, results: grade.results } });
    setView({ kind: "result", id: exam.id });
  }
  function remove(exam: StoredExam) {
    if (!window.confirm(`"${exam.title}" шалгалтыг устгах уу? Хариулт, дүн хамт устана.`)) return;
    deleteExam(userKey, exam.id);
    setFresh(null);
    setView({ kind: "list" });
  }

  if (view.kind === "run" && active) return <Runner key={view.id + ":" + view.startedAt} exam={active} userKey={userKey} mode={view.mode} startedAt={view.startedAt} onExit={() => setView({ kind: "brief", id: active.id })} onGraded={(grade, elapsed, timed) => graded(active, grade, elapsed, timed)} />;
  if (view.kind === "brief" && active) return <Briefing exam={active} onBack={() => setView({ kind: "list" })} onStart={mode => start(active, mode)} onResume={() => active.draft && setView({ kind: "run", id: active.id, mode: active.draft.mode, startedAt: active.draft.startedAt })} onResult={() => setView({ kind: "result", id: active.id })} onDelete={() => remove(active)} />;
  if (view.kind === "result" && active) {
    const result = fresh?.id === active.id ? fresh.result : active.last;
    if (result) return <Result exam={active} result={result} onBack={() => { setFresh(null); setView({ kind: "list" }); }} onRetake={() => { setFresh(null); setView({ kind: "brief", id: active.id }); }} onDelete={() => remove(active)} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Icon name="fileExam" size={17} />Файлаас шалгалт</p>
      <h1>Файлаа оруул.<br /><span>Шалгалт болго.</span></h1>
      <p className={styles.lead}>Хичээлийн PDF, Word, текст эсвэл дэвтэр, номын хуудасны зургаас AI 10–20 асуулттай шалгалт үүсгэж, цагтай эсвэл цаггүй өгөөд дүнгээ харна.</p>
    </header>

    <section className={styles.uploadCard} aria-labelledby="mx-upload-heading">
      <h2 id="mx-upload-heading" className="sr-only">Шалгалт үүсгэх файл</h2>
      <div className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
        onDragEnter={event => { event.preventDefault(); if (!pending) setDragging(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={drop}>
        <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void pick(files); }} disabled={pending} aria-label="Шалгалт үүсгэх файл эсвэл зураг сонгох" />
        {picked?.kind === "images" || (material.preparing && !file) ? <MaterialImages images={picked?.kind === "images" ? picked.images : []} max={material.max} onRemove={material.removeImage} onAdd={() => input.current?.click()} busy={material.preparing} disabled={pending} />
        : file ? <div className={styles.fileRow}>
          <span className={styles.fileIcon} aria-hidden="true">{file.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
          <span className={styles.fileText}><strong>{file.name}</strong><small>{bytes(file.size)}</small></span>
          <button type="button" className={styles.remove} onClick={() => { material.clear(); input.current?.focus(); }} aria-label="Сонгосон файлыг арилгах" disabled={pending}><Icon name="close" size={18} /></button>
        </div> : <>
          <span className={styles.dropIcon} aria-hidden="true"><Icon name="fileExam" size={27} /></span>
          <strong>{dragging ? "Файл эсвэл зургаа тавина уу" : "Файл эсвэл зургаа энд чирэх, сонгох"}</strong>
          <span>{MY_EXAM_LIMITS.fileBytes / 1024 / 1024} MB хүртэл · PDF, DOCX, PPTX, TXT, MD, CSV эсвэл {material.max} хүртэл хуудасны зураг</span>
          <button type="button" className={styles.choose} onClick={() => input.current?.click()} disabled={pending}>Файл, зураг сонгох</button>
        </>}
      </div>

      <div className={styles.settings}>
        <div className={styles.setting} role="group" aria-label="Асуултын тоо">
          <span className={styles.settingLabel}>Асуултын тоо</span>
          <div className={styles.segmented}>{EXAM_COUNTS.map(value => <button key={value} type="button" aria-pressed={count === value} className={count === value ? styles.segmentActive : undefined} onClick={() => setCount(value)} disabled={pending}>{value}</button>)}</div>
          <small className={styles.settingHint}>Асуулт бүр 4 сонголттой.</small>
        </div>
        <div className={styles.setting} role="group" aria-label="Шалгалтын хэл">
          <span className={styles.settingLabel}>Хэл</span>
          <div className={styles.segmented}><button type="button" aria-pressed={language === "mn"} className={language === "mn" ? styles.segmentActive : undefined} onClick={() => setLanguage("mn")} disabled={pending}>Монгол</button><button type="button" aria-pressed={language === "en"} className={language === "en" ? styles.segmentActive : undefined} onClick={() => setLanguage("en")} disabled={pending}>English</button></div>
          <small className={styles.settingHint}>Асуулт, тайлбар энэ хэлээр.</small>
        </div>
        <button type="button" className={styles.generate} onClick={() => void generate()} disabled={!picked || pending || material.preparing} aria-busy={pending}>
          {pending ? <><i className={styles.spinner} aria-hidden="true" />Шалгалт үүсгэж байна…</> : <><Icon name="spark" size={18} />Шалгалт үүсгэх</>}
        </button>
        <p className={styles.cost}><CreditCost action={examCreditAction(count)} /></p>
        {pending ? <p className={styles.status} role="status">Файлыг уншиж, AI асуулт үүсгэж байна. 20–60 секунд орно.</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <p className={styles.fine}>Файлын текст эсвэл хуудасны зураг AI руу илгээгдэж, зөвхөн түүнээс асуулт үүсгэнэ. Урт файлын эхний 45,000 тэмдэгтийг ашиглана. Файл серверт хадгалагдахгүй; шалгалт, хариулт зөвхөн энэ хөтөчид үлдэнэ. Хариултын түлхүүр шалгалт дуустал шифрлэгдэнэ. Хугацаатай шалгалтын үеэр хаалттай.</p>
      </div>
    </section>

    <section className={styles.library} aria-labelledby="mx-library-heading">
      <div className={styles.sectionHead}><h2 id="mx-library-heading">Миний шалгалтууд</h2>{exams.length ? <span>{exams.length} шалгалт</span> : null}</div>
      {exams.length ? <div className={styles.exams}>{exams.map(exam => <article key={exam.id} className={styles.exam}>
        <button type="button" className={styles.examOpen} onClick={() => open(exam)}>
          <span className={styles.examMark} aria-hidden="true"><Icon name="fileExam" size={21} /></span>
          <span className={styles.examText}>
            <strong>{exam.title}</strong>
            <small>{exam.questions.length} асуулт · {minutes(exam.suggestedSeconds)} · {dateLabel.format(new Date(exam.createdAt))}</small>
            <small className={styles.examSource}>{exam.sourceName}</small>
          </span>
          {exam.draft ? <span className={styles.examBadge}>Үргэлжилж байна</span>
            : exam.last ? <span className={styles.examScore}><strong>{exam.last.percent}%</strong><small>{exam.last.correct}/{exam.last.total} зөв</small></span>
              : <span className={styles.examBadge}>Шинэ</span>}
          <Icon name="arrow" size={18} className={styles.examArrow} />
        </button>
        <button type="button" className={styles.examDelete} onClick={() => remove(exam)} aria-label={`${exam.title} шалгалтыг устгах`} title="Устгах"><Icon name="trash" size={17} /></button>
      </article>)}</div> : <div className={styles.empty}>
        <span className={styles.emptyMark} aria-hidden="true"><Icon name="fileExam" size={30} /></span>
        <h3>Одоогоор шалгалт алга</h3>
        <p>Дээрээс нэг файл оруулаад эхний шалгалтаа үүсгээрэй. Жишээ нь: лекцийн PDF, хичээлийн тэмдэглэл, бүлгийн хураангуй.</p>
      </div>}
    </section>
  </div>;
}

function Briefing({ exam, onBack, onStart, onResume, onResult, onDelete }: {
  exam: StoredExam;
  onBack: () => void;
  onStart: (mode: Draft["mode"]) => void;
  onResume: () => void;
  onResult: () => void;
  onDelete: () => void;
}) {
  const draft = exam.draft;
  const restart = (mode: Draft["mode"]) => {
    if (window.confirm("Одоогийн хариултууд устаж, шалгалт шинээр эхэлнэ. Үргэлжлүүлэх үү?")) onStart(mode);
  };
  return <div className={`wsp-page ${styles.page} ${styles.briefPage}`}>
    <button type="button" className={styles.back} onClick={onBack}><Icon name="back" size={18} />Миний шалгалтууд</button>
    <section className={styles.briefCard} aria-labelledby="mx-brief-title">
      <span className={styles.briefIcon} aria-hidden="true"><Icon name="fileExam" size={30} /></span>
      <p className={styles.kicker}>Шалгалтын товч</p>
      <h1 id="mx-brief-title" className={styles.briefTitle}>{exam.title}</h1>
      <p className={styles.briefSource}>{exam.sourceName} · {kindLabel(exam.sourceKind)}</p>
      <dl className={styles.briefMeta}>
        <div><dt>Асуулт</dt><dd>{exam.questions.length}</dd></div>
        <div><dt>Санал болгох хугацаа</dt><dd>{minutes(exam.suggestedSeconds)}</dd></div>
        <div><dt>Хэл</dt><dd>{exam.language === "mn" ? "Монгол" : "English"}</dd></div>
        <div><dt>Сонголт</dt><dd>4</dd></div>
      </dl>

      {draft ? <div className={styles.draftBox}>
        <div>
          <strong>Үргэлжилж байна</strong>
          <p>{Object.keys(draft.answers).length} / {exam.questions.length} хариулсан · {draft.mode === "timed" ? "цагтай" : "цаггүй"}</p>
          <i className={styles.track} aria-hidden="true"><b style={{ width: Math.round((Object.keys(draft.answers).length / Math.max(1, exam.questions.length)) * 100) + "%" }} /></i>
        </div>
        <div className={styles.draftActions}>
          <button type="button" className={styles.primary} onClick={onResume}><Icon name="arrow" size={18} />Үргэлжлүүлэх</button>
          <button type="button" className={styles.ghost} onClick={() => restart(draft.mode)}>Шинээр эхлэх</button>
        </div>
      </div> : <div className={styles.briefActions}>
        <button type="button" className={styles.primary} onClick={() => onStart("timed")}><Icon name="clock" size={18} />Цагтай эхлэх · {minutes(exam.suggestedSeconds)}</button>
        <button type="button" className={styles.ghost} onClick={() => onStart("untimed")}>Цаггүй эхлэх</button>
      </div>}

      {exam.last ? <div className={styles.lastBox}>
        <ScoreRing percent={exam.last.percent} size={38} />
        <div><strong>Өмнөх дүн · {exam.last.percent}%</strong><p>{exam.last.correct} / {exam.last.total} зөв · {exam.attempts} оролдлого</p></div>
        <button type="button" className={styles.lastLink} onClick={onResult}>Үр дүн харах <Icon name="arrow" size={16} /></button>
      </div> : null}

      <p className={styles.fine}>Энэ нь таны файлаас AI үүсгэсэн дадлагын шалгалт. Албан ёсны шалгалт, багшийн хянасан материал биш. Цаг нь зөвлөмж; дүн зөвхөн энэ хөтөчид хадгалагдана.</p>
      <button type="button" className={styles.briefDelete} onClick={onDelete}><Icon name="trash" size={16} />Шалгалтыг устгах</button>
    </section>
  </div>;
}

function Runner({ exam, userKey, mode, startedAt, onExit, onGraded }: {
  exam: StoredExam;
  userKey: string;
  mode: Draft["mode"];
  startedAt: number;
  onExit: () => void;
  onGraded: (grade: GradeReply, elapsedSeconds: number, timed: boolean) => void;
}) {
  // Ignore a stale snapshot from an earlier sitting: only a draft started at this timestamp is ours.
  const draft = exam.draft && exam.draft.startedAt === startedAt ? exam.draft : null;
  const [index, setIndex] = useState(() => draft?.index ?? 0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => draft?.answers ?? {});
  const [flagged, setFlagged] = useState<string[]>(() => draft?.flagged ?? []);
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const submitted = useRef(false);
  const submitRef = useRef<() => Promise<void>>(async () => {});
  const confirmRef = useRef<HTMLButtonElement>(null);
  const question = exam.questions[Math.min(index, exam.questions.length - 1)];
  const answered = exam.questions.filter(item => Object.prototype.hasOwnProperty.call(answers, item.id)).length;
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const remaining = mode === "timed" ? Math.max(0, exam.suggestedSeconds - elapsed) : elapsed;
  const low = mode === "timed" && remaining <= 60;

  // A stale parent snapshot must never lose the first answer: make sure this sitting has a draft.
  useEffect(() => {
    if (!draft) beginDraft(userKey, exam.id, mode, startedAt);
  }, [draft, exam.id, mode, startedAt, userKey]);

  // Persist every navigation and answer so a reload resumes the same sitting.
  useEffect(() => { updateDraft(userKey, exam.id, { answers, index, flagged }); }, [answers, index, flagged, exam.id, userKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit() {
    if (submitting || submitted.current) return;
    submitted.current = true;
    setSubmitting(true); setConfirming(false); setError("");
    try {
      const response = await fetch("/api/workspace/my-exams/grade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: exam.token, answers }), signal: AbortSignal.timeout(30_000),
      });
      const data = await jsonObject(response);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Дүн гаргаж чадсангүй. Дахин оролдоно уу.");
      const grade = gradedReply(data);
      if (!grade) throw new Error("Дүн бүрэн ирсэнгүй. Дахин оролдоно уу.");
      onGraded(grade, Math.max(0, Math.round((Date.now() - startedAt) / 1000)), mode === "timed");
    } catch (reason) {
      submitted.current = false;
      setSubmitting(false);
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Дүн гаргахад хэт удлаа. Дахин оролдоно уу.");
    }
  }
  // Keep the timer's callback fresh without touching a ref during render.
  useEffect(() => { submitRef.current = submit; });

  // A timed sitting submits itself when the suggested clock runs out. The timer is a study
  // aid, not a server deadline; answers are still graded from the sealed exam.
  useEffect(() => {
    if (mode === "timed" && remaining === 0 && !submitted.current) void submitRef.current();
  }, [mode, remaining]);

  useEffect(() => { if (confirming) confirmRef.current?.focus(); }, [confirming]);

  const go = (next: number) => setIndex(Math.max(0, Math.min(exam.questions.length - 1, next)));
  const select = (option: number) => setAnswers(current => ({ ...current, [question.id]: option }));
  const toggleFlag = () => setFlagged(current => current.includes(question.id) ? current.filter(id => id !== question.id) : [...current, question.id]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Escape") { event.preventDefault(); if (submitting) return; if (confirming) setConfirming(false); else onExit(); return; }
      if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); go(index + (event.key === "ArrowRight" ? 1 : -1)); return; }
      if (event.key.toLowerCase() === "f") { event.preventDefault(); toggleFlag(); return; }
      if (/^[1-5]$/.test(event.key)) {
        const option = Number(event.key) - 1;
        if (option < question.options.length) { event.preventDefault(); select(option); }
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  return <div className={`wsp-page ${styles.page} ${styles.runnerPage}`}>
    <header className={styles.runnerBar}>
      <button type="button" className={styles.back} onClick={onExit} disabled={submitting}><Icon name="back" size={18} />Гарах</button>
      <div className={styles.runnerTitle}><strong>{exam.title}</strong><span>{answered} / {exam.questions.length} хариулсан</span></div>
      <span className={styles.timer} data-low={low ? "" : undefined} role="timer" aria-label={mode === "timed" ? "Үлдсэн хугацаа" : "Өнгөрсөн хугацаа"}>
        <Icon name="clock" size={16} />{mode === "timed" ? clock(remaining) : clock(elapsed)}
      </span>
    </header>
    <div className={styles.progress} aria-hidden="true"><i style={{ width: Math.round((answered / Math.max(1, exam.questions.length)) * 100) + "%" }} /></div>

    <div className={styles.runnerGrid}>
      <section className={styles.questionCol} aria-live="polite">
        <article className={styles.questionCard}>
          <div className={styles.questionHead}>
            <span className={styles.questionNum}>Асуулт {index + 1} / {exam.questions.length}</span>
            {question.topic ? <span className={styles.topic}>{question.topic}</span> : null}
            <button type="button" className={`${styles.flagButton} ${flagged.includes(question.id) ? styles.flagOn : ""}`} onClick={toggleFlag} aria-pressed={flagged.includes(question.id)} title="Дараа эргэж үзэх">
              <Icon name="flag" size={16} />{flagged.includes(question.id) ? "Тэмдэглэсэн" : "Тэмдэглэх"}
            </button>
          </div>
          <p className={styles.prompt}><MathText text={question.prompt} /></p>
          <div className={styles.options} role="radiogroup" aria-label={`Асуулт ${index + 1}-ийн хариулт`}>
            {question.options.map((option, optionIndex) => <label key={optionIndex} className={`${styles.option} ${answers[question.id] === optionIndex ? styles.optionOn : ""}`}>
              <input type="radio" name={question.id} value={optionIndex} checked={answers[question.id] === optionIndex} onChange={() => select(optionIndex)} />
              <span className={styles.letter} aria-hidden="true">{LETTERS[optionIndex]}</span>
              <span className={styles.optionText}><MathText text={option} /></span>
            </label>)}
          </div>
          <div className={styles.nav}>
            <button type="button" className={styles.ghost} onClick={() => go(index - 1)} disabled={index === 0 || submitting}><Icon name="back" size={17} />Өмнөх</button>
            {index < exam.questions.length - 1 ? <button type="button" className={styles.primary} onClick={() => go(index + 1)} disabled={submitting}>Дараах<Icon name="arrow" size={17} /></button>
              : <button type="button" className={styles.primary} onClick={() => setConfirming(true)} disabled={submitting}>Дуусгах<Icon name="check" size={17} /></button>}
          </div>
        </article>

        {confirming ? <div className={styles.confirmBox} role="alertdialog" aria-labelledby="mx-confirm-title">
          <strong id="mx-confirm-title">Шалгалтыг дуусгах уу?</strong>
          <p>{answered} / {exam.questions.length} асуултад хариулсан. {exam.questions.length - answered ? `${exam.questions.length - answered} асуулт хоосон байна. ` : ""}Дуусгасны дараа хариултаа өөрчлөх боломжгүй.</p>
          <div className={styles.confirmActions}>
            <button ref={confirmRef} type="button" className={styles.primary} onClick={() => void submit()} disabled={submitting}>{submitting ? "Дүн гаргаж байна…" : "Тийм, дуусгах"}</button>
            <button type="button" className={styles.ghost} onClick={() => setConfirming(false)} disabled={submitting}>Үргэлжлүүлэх</button>
          </div>
        </div> : null}
        {error ? <div className={styles.errorBox} role="alert"><p>{error}</p><button type="button" className={styles.ghost} onClick={() => { submitted.current = false; setSubmitting(false); void submit(); }}>Дахин оролдох</button></div> : null}
        <p className={styles.keys}>1–4 — хариулах · ← → — асуулт солих · F — тэмдэглэх · Esc — гарах</p>
      </section>

      <aside className={styles.sheet} aria-labelledby="mx-sheet-title">
        <div className={styles.sheetHead}><h2 id="mx-sheet-title">Хариултын хуудас</h2><span>{answered} / {exam.questions.length}</span></div>
        <p className={styles.sheetSub}>{flagged.length ? `${flagged.length} тэмдэглэсэн` : "Бүх асуулт энд байна"}</p>
        <div className={styles.sheetGrid}>{exam.questions.map((item, itemIndex) => <button key={item.id} type="button"
          className={[styles.sheetCell, Object.prototype.hasOwnProperty.call(answers, item.id) ? styles.sheetCellAnswered : "", flagged.includes(item.id) ? styles.sheetCellFlagged : "", itemIndex === index ? styles.sheetCellCurrent : ""].filter(Boolean).join(" ")}
          onClick={() => go(itemIndex)} aria-current={itemIndex === index ? "true" : undefined}
          aria-label={`Асуулт ${itemIndex + 1}${Object.prototype.hasOwnProperty.call(answers, item.id) ? ", хариулсан" : ", хариулаагүй"}${flagged.includes(item.id) ? ", тэмдэглэсэн" : ""}`}>{itemIndex + 1}</button>)}</div>
        <div className={styles.sheetLegend}><span><i className={styles.legendAnswered} />Хариулсан</span><span><i className={styles.legendFlagged} />Тэмдэглэсэн</span></div>
        <button type="button" className={styles.primary} onClick={() => setConfirming(true)} disabled={submitting}>Шалгалт дуусгах</button>
        {submitting ? <p className={styles.sheetStatus} role="status">Дүн гаргаж байна…</p> : null}
        <p className={styles.sheetHint}>{mode === "timed" ? "Хугацаа дуусахад хариултууд автоматаар илгээгдэнэ." : "Цаггүй горим: өөрийн хурдаар ажиллана."} Хариулт бүр шууд хадгалагдана.</p>
      </aside>
    </div>
  </div>;
}

function Result({ exam, result, onBack, onRetake, onDelete }: {
  exam: StoredExam;
  result: StoredResult;
  onBack: () => void;
  onRetake: () => void;
  onDelete: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "wrong" | "blank">("all");
  const byId = new Map(result.results.map(item => [item.id, item]));
  const entries = exam.questions.map((question, order) => ({ question, order, result: byId.get(question.id) }));
  const wrong = entries.filter(entry => entry.result && entry.result.chosen !== null && !entry.result.correct);
  const blank = entries.filter(entry => !entry.result || entry.result.chosen === null);
  const shown = filter === "all" ? entries : filter === "wrong" ? wrong : blank;
  const status = (item: StoredResultItem | undefined) => !item || item.chosen === null ? "blank" : item.correct ? "correct" : "wrong";
  const statusLabel = (value: string) => value === "correct" ? "Зөв" : value === "wrong" ? "Алдсан" : "Хариулаагүй";

  return <div className={`wsp-page ${styles.page} ${styles.resultPage}`}>
    <button type="button" className={styles.back} onClick={onBack}><Icon name="back" size={18} />Миний шалгалтууд</button>
    <section className={styles.resultHero} aria-labelledby="mx-result-title">
      <div>
        <p className={styles.kicker}>Шалгалтын дүн</p>
        <h1 id="mx-result-title">{exam.title}</h1>
        <p className={styles.resultMeta}>{exam.sourceName} · {dateLabel.format(new Date(result.finishedAt))} · {result.timed ? "цагтай" : "цаггүй"}</p>
      </div>
      <div className={styles.scoreWrap}>
        <ScoreRing percent={result.percent} size={82} />
        <div><strong>{result.percent}%</strong><p>{result.correct} / {result.total} зөв</p></div>
      </div>
    </section>

    <div className={styles.resultStats}>
      <div><span>Зөв</span><strong>{result.correct}</strong></div>
      <div><span>Алдсан</span><strong>{wrong.length}</strong></div>
      <div><span>Хариулаагүй</span><strong>{blank.length}</strong></div>
      <div><span>Хугацаа</span><strong>{clock(result.elapsedSeconds)}</strong></div>
      <div><span>Шилдэг</span><strong>{(exam.best?.percent ?? result.percent)}%</strong></div>
    </div>

    <div className={styles.resultActions}>
      <button type="button" className={styles.primary} onClick={onRetake}><Icon name="repeat" size={18} />Дахин өгөх</button>
      <button type="button" className={styles.ghost} onClick={onBack}>Жагсаалт руу буцах</button>
      <button type="button" className={styles.deleteLink} onClick={onDelete}><Icon name="trash" size={16} />Устгах</button>
    </div>

    <section className={styles.reviewSection} aria-labelledby="mx-review-title">
      <div className={styles.sectionHead}><h2 id="mx-review-title">Хариултын задаргаа</h2><span>{result.results.length} асуулт</span></div>
      <div className={styles.filters} role="group" aria-label="Хариулт шүүх">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Бүгд · {entries.length}</button>
        <button type="button" aria-pressed={filter === "wrong"} onClick={() => setFilter("wrong")}>Алдсан · {wrong.length}</button>
        <button type="button" aria-pressed={filter === "blank"} onClick={() => setFilter("blank")}>Хариулаагүй · {blank.length}</button>
      </div>

      {shown.length ? <div className={styles.reviewList}>{shown.map(({ question, order, result: item }) => {
        const value = status(item);
        return <article key={question.id} className={styles.review} data-status={value}>
          <div className={styles.reviewHead}>
            <span className={styles.questionNum}>Асуулт {order + 1}</span>
            <span className={`${styles.statusPill} ${styles["status" + value[0].toUpperCase() + value.slice(1)]}`}>{statusLabel(value)}</span>
            {question.topic ? <span className={styles.topic}>{question.topic}</span> : null}
          </div>
          <p className={styles.prompt}><MathText text={question.prompt} /></p>
          <ul className={styles.reviewOptions}>
            {question.options.map((option, optionIndex) => <li key={optionIndex}
              className={[optionIndex === item?.answer ? styles.right : "", optionIndex === item?.chosen && optionIndex !== item?.answer ? styles.mine : ""].filter(Boolean).join(" ")}>
              <span className={styles.letter}>{LETTERS[optionIndex]}</span>
              <span className={styles.optionText}><MathText text={option} /></span>
              {optionIndex === item?.answer ? <span className={styles.reviewMark}>Зөв хариулт</span> : optionIndex === item?.chosen ? <span className={styles.reviewMark}>Таны хариулт</span> : null}
            </li>)}
          </ul>
          {item ? <div className={styles.explain}><span>Тайлбар</span><p><MathText text={item.explanation} /></p></div> : null}
        </article>;
      })}</div> : <div className={styles.empty}><h3>Энэ шүүлтэд асуулт алга</h3><p>Бүгд гэсэн шүүлтээр бүх асуултаа харна уу.</p></div>}
    </section>

    <p className={styles.fine}>AI үүсгэсэн дадлагын дүн. Албан ёсны шалгалтын оноо биш; хариулт, тайлбарыг багш хянаагүй. Дүн зөвхөн энэ хөтөчид хадгалагдана.</p>
  </div>;
}

/** Validate the generation reply before anything is written to this browser. */
function createdExam(data: Record<string, unknown>): StoredExam | null {
  const source = data.source && typeof data.source === "object" && !Array.isArray(data.source) ? data.source as Record<string, unknown> : null;
  if (typeof data.title !== "string" || !data.title.trim() || data.title.length > 200) return null;
  if (typeof data.token !== "string" || data.token.length < 40 || data.token.length > MY_EXAM_LIMITS.tokenChars) return null;
  if (data.language !== "mn" && data.language !== "en") return null;
  if (typeof data.suggestedSeconds !== "number" || !Number.isFinite(data.suggestedSeconds)) return null;
  if (!source || typeof source.name !== "string" || !source.name.trim() || typeof source.kind !== "string") return null;
  if (!Array.isArray(data.questions) || data.questions.length < 5 || data.questions.length > MY_EXAM_LIMITS.questions) return null;
  const questions: StoredQuestion[] = [];
  const seen = new Set<string>();
  for (const item of data.questions) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const question = item as Record<string, unknown>;
    if (typeof question.prompt !== "string" || !question.prompt.trim() || !Array.isArray(question.options) || question.options.length !== 4) continue;
    const options = question.options.filter((option): option is string => typeof option === "string" && Boolean(option.trim())).map(option => option.slice(0, 400));
    if (options.length !== 4) continue;
    const id = typeof question.id === "string" ? question.id : "q" + (questions.length + 1);
    if (!/^q\d{1,2}$/.test(id) || seen.has(id)) continue;
    const topic = typeof question.topic === "string" && question.topic.trim() ? question.topic.trim().slice(0, 60) : undefined;
    seen.add(id);
    questions.push({ id, prompt: question.prompt.trim().slice(0, 900), options, ...(topic ? { topic } : {}) });
  }
  if (questions.length < 5) return null;
  const now = Date.now();
  return {
    id: newExamId(), title: data.title.trim().slice(0, 200), sourceName: source.name.slice(0, 200), sourceKind: source.kind.slice(0, 20),
    language: data.language, createdAt: now, updatedAt: now, questions, token: data.token,
    suggestedSeconds: Math.min(3600, Math.max(600, Math.round(data.suggestedSeconds))),
    draft: null, last: null, best: null, attempts: 0,
  };
}

/** Validate the server's grade before storing or showing it. */
function gradedReply(data: Record<string, unknown>): GradeReply | null {
  if (typeof data.title !== "string" || typeof data.gradedAt !== "number" || !Number.isFinite(data.gradedAt) || typeof data.total !== "number" || typeof data.correct !== "number" || typeof data.percent !== "number") return null;
  if (!Number.isInteger(data.total) || !Number.isInteger(data.correct) || !Number.isInteger(data.percent) || data.total < 1 || data.total > 20 || data.correct < 0 || data.correct > data.total || data.percent < 0 || data.percent > 100) return null;
  if (!Array.isArray(data.results) || data.results.length !== data.total) return null;
  const results: StoredResultItem[] = [];
  for (const item of data.results) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.answer !== "number" || !Number.isInteger(row.answer) || row.answer < 0 || row.answer > 4) return null;
    if (typeof row.correct !== "boolean" || typeof row.explanation !== "string") return null;
    if (row.chosen !== null && (typeof row.chosen !== "number" || !Number.isInteger(row.chosen) || row.chosen < 0 || row.chosen > 4)) return null;
    const topic = typeof row.topic === "string" && row.topic ? row.topic.slice(0, 60) : undefined;
    results.push({ id: row.id, chosen: row.chosen as number | null, answer: row.answer, correct: row.correct, explanation: row.explanation.slice(0, 1200), ...(topic ? { topic } : {}) });
  }
  return { title: data.title, gradedAt: data.gradedAt, total: data.total, correct: data.correct, percent: data.percent, results };
}

async function jsonObject(response: Response): Promise<Record<string, unknown>> {
  const data: unknown = await response.json().catch(() => ({}));
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}
