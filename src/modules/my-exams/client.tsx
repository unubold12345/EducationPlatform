"use client";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { Icon } from "@/modules/workspace/icons";
import { ScoreRing } from "@/modules/workspace/score";
import { MathText } from "@/modules/exams/math-text";
import {
  EXAM_COUNT, MY_EXAM_LIMITS, examUpgrade, examsFullMessage, readDraft, readSavedExam,
  type ExamDraft, type ExamLanguage, type ExamResult, type GradeItem, type SavedExam,
} from "./contracts";
import { forgetLegacyExam, legacyExams } from "./store";
import styles from "./my-exams.module.css";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { examHold } from "@/modules/credits/pricing";
import { MaterialImages, useMaterialPick } from "@/modules/ai-images/client";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv,image/*";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const LETTERS = "ABCDE";
const UPGRADE = examUpgrade();
// "11-р сарын 9" in Ulaanbaatar time (UTC+8 all year), written out by hand: the list is rendered on the server and
// again in the browser, and a browser without Mongolian locale data would format the same date differently.
const dateLabel = (time: number) => {
  const date = new Date(time + 8 * 60 * 60 * 1000);
  return `${date.getUTCMonth() + 1}-р сарын ${date.getUTCDate()}`;
};
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60)) + " мин";
const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
};
const kindLabel = (kind: string) => kind === "pdf" ? "PDF" : kind === "docx" ? "Word" : kind === "pptx" ? "PowerPoint" : kind === "image" ? "Зураг" : "Текст";
const EXAM_API = "/api/workspace/my-exams";

type View =
  | { kind: "list" }
  | { kind: "brief"; id: string }
  | { kind: "run"; id: string; mode: ExamDraft["mode"]; startedAt: number }
  | { kind: "result"; id: string };
type DraftPatch = Pick<ExamDraft, "answers" | "index" | "flagged">;

/** A failed request, with the status so a caller can tell "already gone" from a real failure. */
class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
/** One JSON request to the exam API. Every route is same-origin and session-checked on the server. */
async function send(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown, fallback: string): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method, signal: AbortSignal.timeout(30_000),
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await jsonObject(response);
  if (response.status === 401) throw new RequestError("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.", 401);
  if (!response.ok) throw new RequestError(typeof data.error === "string" ? data.error : fallback, response.status);
  return data;
}
/** The server's own message when it gave one; a dropped connection or a timeout gets the fallback. */
const failure = (reason: unknown, fallback: string) => reason instanceof RequestError ? reason.message : fallback;

export function MyExams({ userKey, limit: planLimit, initialExams }: { userKey: string; limit: number; initialExams: SavedExam[] }) {
  // The exams live on the account: the page starts from the server's list and every change goes through the API.
  const [exams, setExams] = useState(initialExams);
  const [view, setView] = useState<View>({ kind: "list" });
  const material = useMaterialPick({ extensions: ALLOWED, maxBytes: MY_EXAM_LIMITS.fileBytes, documentHint: "PDF, Word, PowerPoint, TXT, MD, CSV файл эсвэл хуудасны зураг сонгоно уу." });
  const picked = material.pick;
  const file = picked?.kind === "document" ? picked.file : null;
  const [count, setCount] = useState<number>(EXAM_COUNT.default);
  // The number box keeps what is being typed; the count only follows once it is a valid size.
  const [countText, setCountText] = useState(String(EXAM_COUNT.default));
  const [language, setLanguage] = useState<ExamLanguage>("mn");
  const [structure, setStructure] = useState("");
  // The server sends the plan's current size with every exam; a plan bought or ended meanwhile shows at once.
  const [limit, setLimit] = useState(planLimit);
  const [pending, setPending] = useState(false);
  const { apply } = useCredits();
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  // A start or a delete is waiting for the server.
  const [busy, setBusy] = useState(false);
  const [moveNote, setMoveNote] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const active = view.kind === "list" ? null : exams.find(exam => exam.id === view.id) ?? null;
  const full = exams.length >= limit;
  const pictures = picked?.kind === "images" ? picked.images.length : 0;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);

  const put = useCallback((exam: SavedExam) => {
    setExams(list => [exam, ...list.filter(item => item.id !== exam.id)].sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);
  const show = (next: View) => { setError(""); setView(next); };

  // Exams made before they moved to the account are still in this browser. Each one is sent to the account
  // once and then forgotten here; one the server cannot take now stays for the next visit.
  useEffect(() => {
    const legacy = legacyExams(userKey);
    if (!legacy.length) return;
    let cancelled = false;
    void (async () => {
      let waiting = 0, overflow = 0, unreadable = 0;
      for (const item of legacy) {
        if (cancelled) return;
        try {
          const response = await fetch(EXAM_API + "/import", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.body), signal: AbortSignal.timeout(30_000),
          });
          const data = await jsonObject(response);
          const exam = response.ok ? readSavedExam(data.exam) : null;
          if (exam) { put(exam); forgetLegacyExam(userKey, item.id); }
          // Its sealed key no longer opens, so it could not be sat or graded here either.
          else if (response.ok && data.exam === null && typeof data.refused === "string") { forgetLegacyExam(userKey, item.id); unreadable++; }
          else if (response.status === 409) overflow++;
          else waiting++;
        } catch { waiting++; }
      }
      if (cancelled) return;
      setMoveNote([
        overflow ? `Бүртгэл дүүрсэн тул ${overflow} шалгалт энэ хөтөчид үлдлээ. Нэг шалгалтаа устгаад хуудсаа дахин нээхэд шилжинэ.` : "",
        waiting ? `${waiting} шалгалтыг бүртгэл рүү шилжүүлж чадсангүй. Хуудсаа дараа дахин нээхэд шилжинэ.` : "",
        unreadable ? `${unreadable} хуучин шалгалтын түлхүүр хүчингүй болсон тул шилжүүлээгүй.` : "",
      ].filter(Boolean).join(" "));
    })();
    return () => { cancelled = true; };
  }, [userKey, put]);

  function chooseCount(value: number) {
    const next = Math.max(EXAM_COUNT.min, Math.min(EXAM_COUNT.max, Math.round(value)));
    setCount(next);
    setCountText(String(next));
  }
  function typeCount(text: string) {
    setCountText(text);
    const value = Number(text);
    if (/^\d{1,2}$/.test(text) && value >= EXAM_COUNT.min && value <= EXAM_COUNT.max) setCount(value);
  }
  // Leaving the box settles a half-typed or out-of-range number to the nearest allowed size.
  function settleCount() {
    const value = Number(countText);
    chooseCount(countText.trim() && Number.isFinite(value) ? value : count);
  }

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
    if (!picked || pending || material.preparing || full) return;
    setPending(true); setError("");
    try {
      const form = new FormData();
      material.append(form);
      form.append("count", String(count));
      form.append("language", language);
      form.append("structure", structure.trim());
      // The server counts the exams on the account and decides from the plan whether one more fits.
      const response = await fetch(EXAM_API, { method: "POST", body: form, signal: AbortSignal.timeout(175_000) });
      const data = await jsonObject(response);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Шалгалт үүсгэж чадсангүй. Дахин оролдоно уу.");
      apply(data);
      if (typeof data.limit === "number" && Number.isInteger(data.limit) && data.limit >= 1 && data.limit <= MY_EXAM_LIMITS.exams) setLimit(data.limit);
      // The exam is already saved on the account; the reply is checked before it is shown.
      const exam = readSavedExam(data.exam);
      if (!exam) throw new Error("AI шалгалт бүрэн ирсэнгүй. Хуудсаа дахин ачаална уу.");
      put(exam);
      setView({ kind: "brief", id: exam.id });
      material.clear();
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Шалгалт үүсгэхэд хэт удлаа. Дахин оролдоно уу.");
    } finally { setPending(false); }
  }
  function open(exam: SavedExam) {
    if (exam.draft) show({ kind: "run", id: exam.id, mode: exam.draft.mode, startedAt: exam.draft.startedAt });
    else show({ kind: "brief", id: exam.id });
  }
  // The sitting is opened on the account first, so its answers have somewhere to be saved.
  async function start(exam: SavedExam, mode: ExamDraft["mode"]) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const data = await send(`${EXAM_API}/${exam.id}`, "PATCH", { action: "start", mode, startedAt: Date.now() }, "Шалгалтыг эхлүүлж чадсангүй. Дахин оролдоно уу.");
      const draft = readDraft(data.draft, exam.questions.map(question => question.id));
      if (!draft) throw new RequestError("Шалгалтыг эхлүүлж чадсангүй. Дахин оролдоно уу.", 200);
      put({ ...exam, draft, updatedAt: Date.now() });
      setView({ kind: "run", id: exam.id, mode: draft.mode, startedAt: draft.startedAt });
    } catch (reason) {
      setError(failure(reason, "Шалгалтыг эхлүүлж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));
    } finally { setBusy(false); }
  }
  // Keeps the list in step with the open sitting; the runner sends the same progress to the account.
  function draftChanged(id: string, startedAt: number, patch: DraftPatch) {
    setExams(list => list.map(item => item.id === id && item.draft?.startedAt === startedAt ? { ...item, draft: { ...item.draft, ...patch } } : item));
  }
  function graded(exam: SavedExam) {
    put(exam);
    show({ kind: "result", id: exam.id });
  }
  async function remove(exam: SavedExam) {
    if (busy || !window.confirm(`"${exam.title}" шалгалтыг устгах уу? Хариулт, дүн хамт устана.`)) return;
    setBusy(true); setError("");
    try {
      await send(`${EXAM_API}/${exam.id}`, "DELETE", undefined, "Шалгалтыг устгаж чадсангүй. Дахин оролдоно уу.");
    } catch (reason) {
      // Already deleted on another device: it is gone here too.
      if (!(reason instanceof RequestError) || reason.status !== 404) {
        setError(failure(reason, "Шалгалтыг устгаж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));
        setBusy(false);
        return;
      }
    }
    setExams(list => list.filter(item => item.id !== exam.id));
    setBusy(false);
    setView({ kind: "list" });
  }

  if (view.kind === "run" && active) return <Runner key={view.id + ":" + view.startedAt} exam={active} mode={view.mode} startedAt={view.startedAt} onExit={() => show({ kind: "brief", id: active.id })} onDraft={patch => draftChanged(view.id, view.startedAt, patch)} onGraded={graded} />;
  if (view.kind === "brief" && active) return <Briefing exam={active} busy={busy} error={error} onBack={() => show({ kind: "list" })} onStart={mode => void start(active, mode)} onResume={() => active.draft && show({ kind: "run", id: active.id, mode: active.draft.mode, startedAt: active.draft.startedAt })} onResult={() => show({ kind: "result", id: active.id })} onDelete={() => void remove(active)} />;
  if (view.kind === "result" && active?.last) return <Result exam={active} result={active.last} busy={busy} error={error} onBack={() => show({ kind: "list" })} onRetake={() => show({ kind: "brief", id: active.id })} onDelete={() => void remove(active)} />;

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Icon name="fileExam" size={17} />Файлаас шалгалт</p>
      <h1>Файлаа оруул.<br /><span>Шалгалт болго.</span></h1>
      <p className={styles.lead}>Хичээлийн файл эсвэл хуудасны зургаас AI {EXAM_COUNT.min}–{EXAM_COUNT.max} асуулттай шалгалт үүсгэнэ.</p>
    </header>

    <section className={styles.uploadCard} aria-labelledby="mx-upload-heading">
      <h2 id="mx-upload-heading" className="sr-only">Шалгалт үүсгэх файл</h2>
      <div className={styles.source}>
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
      <label className={styles.structure}>
        <span className={styles.settingLabel}>Шалгалтын бүтэц <em>сонголтоор · {structure.length}/{MY_EXAM_LIMITS.structure}</em></span>
        <textarea value={structure} onChange={event => setStructure(event.target.value)} maxLength={MY_EXAM_LIMITS.structure} rows={2} placeholder="жишээ нь: 5 тодорхойлолт, 10 бодлого; хялбараас хүнд рүү." disabled={pending} />
      </label>
      </div>

      <div className={styles.settings}>
        <div className={styles.setting}>
          <label className={styles.settingLabel} htmlFor="mx-count">Асуултын тоо</label>
          <div className={styles.rangeRow}>
            <input id="mx-count" type="range" min={EXAM_COUNT.min} max={EXAM_COUNT.max} step={1} value={count} onChange={event => chooseCount(Number(event.target.value))} disabled={pending} />
            <input type="number" inputMode="numeric" min={EXAM_COUNT.min} max={EXAM_COUNT.max} step={1} value={countText} onChange={event => typeCount(event.target.value)} onBlur={settleCount} disabled={pending} aria-label="Асуултын тоог бичих" />
          </div>
        </div>
        <div className={styles.setting} role="group" aria-label="Шалгалтын хэл">
          <span className={styles.settingLabel}>Хэл</span>
          <div className={styles.segmented}><button type="button" aria-pressed={language === "mn"} className={language === "mn" ? styles.segmentActive : undefined} onClick={() => setLanguage("mn")} disabled={pending}>Монгол</button><button type="button" aria-pressed={language === "en"} className={language === "en" ? styles.segmentActive : undefined} onClick={() => setLanguage("en")} disabled={pending}>English</button></div>
        </div>
        <button type="button" className={styles.generate} onClick={() => void generate()} disabled={!picked || pending || material.preparing || full} aria-busy={pending}>
          {pending ? <><i className={styles.spinner} aria-hidden="true" />Шалгалт үүсгэж байна…</> : <><Icon name="spark" size={18} />Шалгалт үүсгэх</>}
        </button>
        {full ? <p className={styles.limitNote} role="status">{examsFullMessage(limit)}{limit < UPGRADE.exams ? <> <Link href="/workspace/plans">Багц харах</Link></> : null}</p>
          : <p className={styles.cost}><CreditCost action="exam" cost={examHold(count, pictures)} upTo /></p>}
        {pending ? <p className={styles.status} role="status">Файлыг уншиж, AI асуулт үүсгэж байна. 20–60 секунд орно.</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>
    </section>

    <section className={styles.library} aria-labelledby="mx-library-heading">
      <div className={styles.sectionHead}><h2 id="mx-library-heading">Миний шалгалтууд</h2><span data-full={full ? "" : undefined} title="Шалгалтууд таны бүртгэлд хадгалагдаж, бүх төхөөрөмж дээр харагдана">{exams.length} / {limit} · бүртгэлд</span></div>
      {moveNote ? <p className={styles.moveNote} role="status">{moveNote}</p> : null}
      {exams.length ? <div className={styles.exams}>{exams.map(exam => <article key={exam.id} className={styles.exam}>
        <button type="button" className={styles.examOpen} onClick={() => open(exam)}>
          <span className={styles.examMark} aria-hidden="true"><Icon name="fileExam" size={21} /></span>
          <span className={styles.examText}>
            <strong>{exam.title}</strong>
            <small>{exam.questions.length} асуулт · {minutes(exam.suggestedSeconds)} · {dateLabel(exam.createdAt)}</small>
            <small className={styles.examSource}>{exam.sourceName}</small>
          </span>
          {exam.draft ? <span className={styles.examBadge}>Үргэлжилж байна</span>
            : exam.last ? <span className={styles.examScore}><strong>{exam.last.percent}%</strong><small>{exam.last.correct}/{exam.last.total} зөв</small></span>
              : <span className={styles.examBadge}>Шинэ</span>}
          <Icon name="arrow" size={18} className={styles.examArrow} />
        </button>
        <button type="button" className={styles.examDelete} onClick={() => void remove(exam)} disabled={busy} aria-label={`${exam.title} шалгалтыг устгах`} title="Устгах"><Icon name="trash" size={17} /></button>
      </article>)}</div> : <div className={styles.empty}>
        <span className={styles.emptyMark} aria-hidden="true"><Icon name="fileExam" size={30} /></span>
        <h3>Одоогоор шалгалт алга</h3>
      </div>}
    </section>
  </div>;
}

function Briefing({ exam, busy, error, onBack, onStart, onResume, onResult, onDelete }: {
  exam: SavedExam;
  busy: boolean;
  error: string;
  onBack: () => void;
  onStart: (mode: ExamDraft["mode"]) => void;
  onResume: () => void;
  onResult: () => void;
  onDelete: () => void;
}) {
  const draft = exam.draft;
  const restart = (mode: ExamDraft["mode"]) => {
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
          <button type="button" className={styles.primary} onClick={onResume} disabled={busy}><Icon name="arrow" size={18} />Үргэлжлүүлэх</button>
          <button type="button" className={styles.ghost} onClick={() => restart(draft.mode)} disabled={busy}>Шинээр эхлэх</button>
        </div>
      </div> : <div className={styles.briefActions}>
        <button type="button" className={styles.primary} onClick={() => onStart("timed")} disabled={busy}><Icon name="clock" size={18} />Цагтай эхлэх · {minutes(exam.suggestedSeconds)}</button>
        <button type="button" className={styles.ghost} onClick={() => onStart("untimed")} disabled={busy}>Цаггүй эхлэх</button>
      </div>}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      {exam.last ? <div className={styles.lastBox}>
        <ScoreRing percent={exam.last.percent} size={38} />
        <div><strong>Өмнөх дүн · {exam.last.percent}%</strong><p>{exam.last.correct} / {exam.last.total} зөв · {exam.attempts} оролдлого</p></div>
        <button type="button" className={styles.lastLink} onClick={onResult}>Үр дүн харах <Icon name="arrow" size={16} /></button>
      </div> : null}

      <button type="button" className={styles.briefDelete} onClick={onDelete} disabled={busy}><Icon name="trash" size={16} />Шалгалтыг устгах</button>
    </section>
  </div>;
}

/**
 * Sends one sitting's progress to the account: one request at a time, the newest state wins, and a failed
 * save is tried again. The server refuses a save for a sitting that was graded or restarted elsewhere (409);
 * nothing more is sent after that.
 */
function createSaver(id: string, startedAt: number, onFailed: (failed: boolean) => void) {
  let next: DraftPatch | null = null, timer = 0, running: Promise<void> | null = null, closed = false, attached = true;
  function flush(keepalive = false): Promise<void> {
    window.clearTimeout(timer);
    timer = 0;
    if (running) return running.then(() => flush(keepalive));
    const patch = next;
    if (!patch || closed) return Promise.resolve();
    next = null;
    running = fetch(`${EXAM_API}/${id}`, {
      method: "PATCH", keepalive, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", startedAt, ...patch }), signal: keepalive ? undefined : AbortSignal.timeout(15_000),
    }).then(response => {
      if (response.status === 409 || response.status === 404) { closed = true; return; }
      if (!response.ok) throw new Error("save");
      onFailed(false);
    }).catch(() => {
      next ??= patch;
      onFailed(true);
      if (!closed && attached) timer = window.setTimeout(() => void flush(), 5000);
    }).finally(() => { running = null; });
    return running;
  }
  return {
    queue(patch: DraftPatch) {
      next = patch;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void flush(), 600);
    },
    flush,
    attach() { attached = true; },
    /** Leaving the runner: the last progress goes out once, and nothing is retried behind the next sitting. */
    detach() { attached = false; void flush(true); },
    /** Before a submission: nothing more is saved, and the save in flight lands first. */
    async close() {
      closed = true;
      next = null;
      window.clearTimeout(timer);
      await running;
    },
    reopen() { closed = false; },
  };
}

function Runner({ exam, mode, startedAt, onExit, onDraft, onGraded }: {
  exam: SavedExam;
  mode: ExamDraft["mode"];
  startedAt: number;
  onExit: () => void;
  onDraft: (patch: DraftPatch) => void;
  onGraded: (exam: SavedExam) => void;
}) {
  // Ignore a stale snapshot from an earlier sitting: only a draft started at this timestamp is ours.
  const draft = exam.draft && exam.draft.startedAt === startedAt ? exam.draft : null;
  const [index, setIndex] = useState(() => draft?.index ?? 0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => draft?.answers ?? {});
  const [flagged, setFlagged] = useState<string[]>(() => draft?.flagged ?? []);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saver] = useState(() => createSaver(exam.id, startedAt, setSaveFailed));
  const synced = useRef(JSON.stringify({ answers: draft?.answers ?? {}, index: draft?.index ?? 0, flagged: draft?.flagged ?? [] }));
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

  // Every navigation and answer is saved on the account, so a reload or another device resumes the same sitting.
  useEffect(() => {
    const patch = { answers, index, flagged };
    const text = JSON.stringify(patch);
    if (text === synced.current) return;
    synced.current = text;
    onDraft(patch);
    saver.queue(patch);
  }, [answers, index, flagged, onDraft, saver]);

  // Closing the tab or leaving the runner sends the last progress without waiting for the pause after typing.
  useEffect(() => {
    const leave = () => { void saver.flush(true); };
    saver.attach();
    addEventListener("pagehide", leave);
    return () => { removeEventListener("pagehide", leave); saver.detach(); };
  }, [saver]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit() {
    if (submitting || submitted.current) return;
    submitted.current = true;
    setSubmitting(true); setConfirming(false); setError("");
    try {
      // Grading closes the sitting on the account, so a save still on its way must not land after it.
      await saver.close();
      // The server grades from the key it keeps and stores the result; the reply is the updated exam.
      const data = await send(EXAM_API + "/grade", "POST", {
        id: exam.id, answers, elapsedSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)), timed: mode === "timed",
      }, "Дүн гаргаж чадсангүй. Дахин оролдоно уу.");
      const graded = readSavedExam(data.exam);
      if (!graded?.last) throw new RequestError("Дүн бүрэн ирсэнгүй. Дахин оролдоно уу.", 200);
      onGraded(graded);
    } catch (reason) {
      submitted.current = false;
      setSubmitting(false);
      saver.reopen();
      setError(failure(reason, "Дүн гаргаж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));
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
        {flagged.length ? <p className={styles.sheetSub}>{flagged.length} тэмдэглэсэн</p> : null}
        <div className={styles.sheetGrid}>{exam.questions.map((item, itemIndex) => <button key={item.id} type="button"
          className={[styles.sheetCell, Object.prototype.hasOwnProperty.call(answers, item.id) ? styles.sheetCellAnswered : "", flagged.includes(item.id) ? styles.sheetCellFlagged : "", itemIndex === index ? styles.sheetCellCurrent : ""].filter(Boolean).join(" ")}
          onClick={() => go(itemIndex)} aria-current={itemIndex === index ? "true" : undefined}
          aria-label={`Асуулт ${itemIndex + 1}${Object.prototype.hasOwnProperty.call(answers, item.id) ? ", хариулсан" : ", хариулаагүй"}${flagged.includes(item.id) ? ", тэмдэглэсэн" : ""}`}>{itemIndex + 1}</button>)}</div>
        <div className={styles.sheetLegend}><span><i className={styles.legendAnswered} />Хариулсан</span><span><i className={styles.legendFlagged} />Тэмдэглэсэн</span></div>
        <button type="button" className={styles.primary} onClick={() => setConfirming(true)} disabled={submitting}>Шалгалт дуусгах</button>
        {submitting ? <p className={styles.sheetStatus} role="status">Дүн гаргаж байна…</p>
          : saveFailed ? <p className={styles.sheetStatus} role="status" data-warn="">Хариулт хадгалагдсангүй. Холболтоо шалгана уу; дахин оролдож байна.</p> : null}
        {mode === "timed" ? <p className={styles.sheetHint}>Хугацаа дуусахад хариултууд автоматаар илгээгдэнэ.</p> : null}
      </aside>
    </div>
  </div>;
}

function Result({ exam, result, busy, error, onBack, onRetake, onDelete }: {
  exam: SavedExam;
  result: ExamResult;
  busy: boolean;
  error: string;
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
  const status = (item: GradeItem | undefined) => !item || item.chosen === null ? "blank" : item.correct ? "correct" : "wrong";
  const statusLabel = (value: string) => value === "correct" ? "Зөв" : value === "wrong" ? "Алдсан" : "Хариулаагүй";

  return <div className={`wsp-page ${styles.page} ${styles.resultPage}`}>
    <button type="button" className={styles.back} onClick={onBack}><Icon name="back" size={18} />Миний шалгалтууд</button>
    <section className={styles.resultHero} aria-labelledby="mx-result-title">
      <div>
        <p className={styles.kicker}>Шалгалтын дүн</p>
        <h1 id="mx-result-title">{exam.title}</h1>
        <p className={styles.resultMeta}>{exam.sourceName} · {dateLabel(result.finishedAt)} · {result.timed ? "цагтай" : "цаггүй"}</p>
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
      <button type="button" className={styles.deleteLink} onClick={onDelete} disabled={busy}><Icon name="trash" size={16} />Устгах</button>
    </div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}

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

    <p className={styles.fine}>AI үүсгэсэн шалгалт: хариулт, тайлбарыг багш хянаагүй.</p>
  </div>;
}

async function jsonObject(response: Response): Promise<Record<string, unknown>> {
  const data: unknown = await response.json().catch(() => ({}));
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}
