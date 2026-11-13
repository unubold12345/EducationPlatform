"use client";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Icon } from "@/modules/workspace/icons";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { readReceipt, readingPracticeHold } from "@/modules/credits/pricing";
import { MaterialImages, useMaterialPick } from "@/modules/ai-images/client";
import {
  GAP, READING_LIMITS, TFNG, allQuestions, groupType, matchCount, matchLabel, optionLetter, paragraphLabel,
  passageWords, publicGroups, type PublicGroup, type PublicQuestion, type ReadingAnswer,
  type ReadingLanguage, type ResultItem,
} from "./contracts";
import { readingSamples, type ReadingSample } from "./samples";
import {
  PRACTICES_FULL, applyProgress, blankState, readSampleStates, readSavedPractice, readState,
  type PracticeState, type ProgressRequest, type SavedPractice,
} from "./state";
import {
  forgetLegacyPractice, forgetLegacySamples, legacyReading, saveTextSize, setGuestSample, tidyLegacyReading, useGuestSamples, useTextSize, type TextSize,
} from "./store";
import styles from "./reading.module.css";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv,image/*";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const SECONDS = READING_LIMITS.minutes * 60;
const API = "/api/labs/ielts-reading";
// "11-р сарын 9" in Ulaanbaatar time (UTC+8 all year), written out by hand: the list is rendered on the server and
// again in the browser, and a browser without Mongolian locale data would format the same date differently.
const dateLabel = (time: number) => {
  const date = new Date(time + 8 * 60 * 60 * 1000);
  return `${date.getUTCMonth() + 1}-р сарын ${date.getUTCDate()}`;
};
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
};
const filled = (value: ReadingAnswer | undefined) => typeof value === "number" || (typeof value === "string" && value.trim() !== "");
const range = (first: number, last: number) => first === last ? `Question ${first}` : `Questions ${first}–${last}`;
const typesOf = (groups: readonly PublicGroup[]) => [...new Set(groups.map(group => groupType(group)).filter(Boolean))];

/** One practice as the runner sees it: a passage, answer-free questions and how its progress is kept. */
type RunnerPractice = {
  title: string;
  paragraphs: string[];
  groups: PublicGroup[];
  meta: string[];
  /** Where answers and the timer are saved on the account; null for a guest, whose sample progress stays in this browser. */
  saveUrl: string | null;
  /** Mark the answers; resolves to the checked state. */
  check: (state: PracticeState, finishedSeconds: number | null) => Promise<PracticeState>;
  /** Clear a checked practice for another attempt. */
  retry: (state: PracticeState) => Promise<PracticeState>;
};
type View = { kind: "library" } | { kind: "sample"; id: string } | { kind: "own"; id: string };

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
/** A refused request, carrying the server's own message. */
class RequestError extends Error {}
/** A message the student can act on: the server's own words, or the fallback when the connection failed. */
const failure = (reason: unknown, fallback: string) => reason instanceof RequestError ? reason.message : fallback;

/** One progress request to the account; the reply is the stored state. Every route is same-origin and session-checked. */
async function progress(url: string, method: "POST" | "PATCH", body: ProgressRequest | Record<string, unknown>, fallback: string): Promise<PracticeState> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  const data = await jsonObject(response);
  if (response.status === 401) throw new RequestError("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
  if (!response.ok) throw new RequestError(typeof data.error === "string" ? data.error : fallback);
  if (!record(data.state)) throw new RequestError("Хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
  return readState(data.state);
}

// Samples carry their key in the page bundle; the runner only ever gets the answer-free groups.
const SAMPLE_GROUPS = new Map(readingSamples.map(sample => [sample.id, publicGroups(sample.groups)]));
function samplePractice(sample: ReadingSample, signedIn: boolean): RunnerPractice {
  const url = `${API}/samples/${sample.id}`;
  // A guest's answers are marked here and kept in this browser; the rules are the ones the server uses.
  const local = (state: PracticeState, request: ProgressRequest) => {
    const outcome = applyProgress(state, request, sample.groups);
    return "stale" in outcome ? state : outcome.state;
  };
  return {
    title: sample.title, paragraphs: sample.paragraphs, groups: SAMPLE_GROUPS.get(sample.id) ?? [],
    meta: [sample.topic, sample.level, `${passageWords(sample.paragraphs)} үг`],
    saveUrl: signedIn ? url : null,
    // A signed-in student's sample is marked on the server with the same built-in key and kept on the account.
    check: async (state, finishedSeconds) => {
      const request: ProgressRequest = { action: "check", attempts: state.attempts, answers: state.answers, finishedSeconds };
      return signedIn ? progress(url, "PATCH", request, "Хариулт шалгаж чадсангүй. Дахин оролдоно уу.") : local(state, request);
    },
    retry: async state => {
      const request: ProgressRequest = { action: "retry", attempts: state.attempts };
      return signedIn ? progress(url, "PATCH", request, "Дасгалыг шинээр эхлүүлж чадсангүй. Дахин оролдоно уу.") : local(state, request);
    },
  };
}
function ownPractice(own: SavedPractice): RunnerPractice {
  const url = `${API}/practices/${own.id}`;
  return {
    title: own.title, paragraphs: own.paragraphs, groups: own.groups,
    meta: ["Миний дасгал", `${passageWords(own.paragraphs)} үг`, own.sourceName],
    saveUrl: url,
    // The key never leaves the server: it marks the answers by the practice's id and keeps the result on the account.
    check: (state, finishedSeconds) => progress(`${API}/grade`, "POST", { id: own.id, attempts: state.attempts, answers: state.answers, finishedSeconds }, "Хариулт шалгаж чадсангүй. Дахин оролдоно уу."),
    retry: state => progress(url, "PATCH", { action: "retry", attempts: state.attempts }, "Дасгалыг шинээр эхлүүлж чадсангүй. Дахин оролдоно уу."),
  };
}

export function ReadingLab({ userKey, initialPractices = [], initialSamples = {} }: {
  userKey: string | null;
  /** A signed-in student's practices and sample progress, read from the account by the page. */
  initialPractices?: SavedPractice[];
  initialSamples?: Record<string, PracticeState>;
}) {
  const signedIn = userKey !== null;
  // Signed in, everything lives on the account: the page starts from the server's copy and every change goes through
  // the API. A guest's sample progress stays in this browser.
  const [practices, setPractices] = useState(initialPractices);
  const [accountSamples, setAccountSamples] = useState(initialSamples);
  const guestSamples = useGuestSamples();
  const samples = signedIn ? accountSamples : guestSamples;
  const textSize = useTextSize();
  const [view, setView] = useState<View>({ kind: "library" });
  // What the last generation actually cost, shown once on the practice it made.
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null);
  const [listError, setListError] = useState("");
  const [moveNote, setMoveNote] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  const back = () => { setNotice(null); setView({ kind: "library" }); };

  const put = useCallback((practice: SavedPractice) => {
    setPractices(list => [practice, ...list.filter(item => item.id !== practice.id)].sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  // Practices and sample progress kept in this browser before they moved to the account are sent there once and
  // then forgotten here. One the server cannot take now (a full library, a dropped connection) stays for the next visit.
  useEffect(() => {
    if (!userKey) return;
    const legacy = legacyReading(userKey);
    if (!legacy.practices.length && !legacy.samples) { tidyLegacyReading(userKey); return; }
    let cancelled = false;
    const send = (body: unknown) => fetch(`${API}/import`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000),
    });
    void (async () => {
      let waiting = 0, overflow = 0, unreadable = 0;
      if (legacy.samples) {
        try {
          const response = await send({ kind: "samples", samples: legacy.samples });
          const data = await jsonObject(response);
          if (response.ok && record(data.samples)) {
            const moved = readSampleStates(data.samples);
            // Progress made on this page meanwhile is newer than what the account returned.
            setAccountSamples(current => ({ ...moved, ...current }));
            forgetLegacySamples(userKey);
          }
        } catch { /* Tried again on the next visit. */ }
      }
      for (const item of legacy.practices) {
        if (cancelled) return;
        // The account is full: the rest wait in this browser until a practice is deleted.
        if (overflow) { overflow++; continue; }
        try {
          const response = await send(item.body);
          const data = await jsonObject(response);
          const practice = response.ok ? readSavedPractice(data.practice) : null;
          if (practice) { put(practice); forgetLegacyPractice(userKey, item.id); }
          // Its sealed key no longer opens, or its passage does not match it: it could not be checked here either.
          else if (response.ok && data.practice === null && typeof data.refused === "string") { forgetLegacyPractice(userKey, item.id); unreadable++; }
          else if (response.status === 409) overflow++;
          else waiting++;
        } catch { waiting++; }
      }
      if (cancelled) return;
      setMoveNote([
        overflow ? `Бүртгэл дүүрсэн тул ${overflow} дасгал энэ хөтөчид үлдлээ. Нэг дасгалаа устгаад хуудсаа дахин нээхэд шилжинэ.` : "",
        waiting ? `${waiting} дасгалыг бүртгэл рүү шилжүүлж чадсангүй. Хуудсаа дараа дахин нээхэд шилжинэ.` : "",
        unreadable ? `${unreadable} хуучин дасгалын мэдээлэл хүчингүй болсон тул шилжүүлээгүй.` : "",
      ].filter(Boolean).join(" "));
    })();
    return () => { cancelled = true; };
  }, [userKey, put]);

  // Keeps the library in step with the open runner; the runner sends the same progress to the account.
  const sampleChanged = (id: string, state: PracticeState) => {
    if (signedIn) setAccountSamples(current => ({ ...current, [id]: state }));
    else setGuestSample(id, state);
  };
  const ownChanged = (id: string, state: PracticeState) => {
    setPractices(list => list.map(item => item.id === id ? { ...item, state } : item));
  };
  async function remove(own: SavedPractice) {
    if (deleting || !window.confirm(`"${own.title}" дасгалыг устгах уу? Хариулт, дүн хамт устана.`)) return;
    setDeleting(own.id); setListError("");
    try {
      const response = await fetch(`${API}/practices/${own.id}`, { method: "DELETE", signal: AbortSignal.timeout(30_000) });
      const data = await jsonObject(response);
      if (response.status === 401) throw new RequestError("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      // Already deleted on another device: it is gone here too.
      if (!response.ok && response.status !== 404) throw new RequestError(typeof data.error === "string" ? data.error : "Дасгалыг устгаж чадсангүй. Дахин оролдоно уу.");
      setPractices(list => list.filter(item => item.id !== own.id));
    } catch (reason) {
      setListError(failure(reason, "Дасгалыг устгаж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));
    } finally { setDeleting(null); }
  }

  if (view.kind === "sample") {
    const sample = readingSamples.find(item => item.id === view.id);
    if (sample) return <Runner key={"sample:" + sample.id} practice={samplePractice(sample, signedIn)} state={samples[sample.id] ?? blankState()}
      onState={state => sampleChanged(sample.id, state)} textSize={textSize} onTextSize={saveTextSize} onBack={back} />;
  }
  if (view.kind === "own") {
    const own = practices.find(item => item.id === view.id);
    if (own) return <Runner key={"own:" + own.id} practice={ownPractice(own)} state={own.state} notice={notice?.id === own.id ? notice.text : null}
      onState={state => ownChanged(own.id, state)} textSize={textSize} onTextSize={saveTextSize} onBack={back} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Link href="/workspace/workshop">Workshop</Link><span aria-hidden="true">·</span>Reading</p>
      <h1>Унших лаб</h1>
      <p className={styles.lead}>IELTS Academic Reading-ийн маягаар эх бичвэр уншиж, асуултад хариулна. Хариултаа шалгахад зөв хариултын нотолгоог текстээс тэмдэглэж, яагаад зөв болохыг тайлбарлана.</p>
      <ul className={styles.facts} aria-label="Дасгалын бүтэц">
        <li><Icon name="clock" size={16} />{READING_LIMITS.minutes} минут нэг текстэд</li>
        <li><Icon name="check" size={16} />12–13 асуулт, 7 төрөл</li>
        <li><Icon name="search" size={16} />Нотолгоог текстээс тэмдэглэнэ</li>
      </ul>
    </header>

    <section className={styles.section} aria-labelledby="rl-samples">
      <div className={styles.sectionHead}><h2 id="rl-samples">Жишээ дасгалууд</h2><span>Үнэгүй · амар хэцүүгийн дарааллаар{signedIn ? "" : " · явц энэ хөтөчид"}</span></div>
      <div className={styles.samples}>
        {readingSamples.map((sample, index) => {
          const state = samples[sample.id];
          const total = allQuestions(sample.groups).length;
          const started = state && Object.values(state.answers).some(filled);
          return <button key={sample.id} type="button" className={styles.sample} onClick={() => setView({ kind: "sample", id: sample.id })} data-sample={sample.id}>
            <span className={styles.sampleTop}><span className={styles.sampleNum}>{String(index + 1).padStart(2, "0")}</span><span className={styles.level}>{sample.level}</span></span>
            <strong lang="en">{sample.title}</strong>
            <span className={styles.topic}>{sample.topic}</span>
            <span className={styles.summary}>{sample.summary}</span>
            <span className={styles.types} lang="en">{typesOf(sample.groups).join(" · ")}</span>
            <span className={styles.sampleFoot}>
              <span>{passageWords(sample.paragraphs)} үг · {total} асуулт</span>
              {state?.best != null ? <em data-full={state.best === total ? "" : undefined}>{state.best}/{total}</em>
                : started ? <em>Үргэлжилж байна</em> : <span className={styles.go}>Эхлэх<Icon name="arrow" size={15} /></span>}
            </span>
          </button>;
        })}
      </div>
    </section>

    <section className={styles.section} aria-labelledby="rl-create">
      <div className={styles.sectionHead}><h2 id="rl-create">Өөрийн дасгал үүсгэх</h2><span>Файл, зураг эсвэл текстээс</span></div>
      {signedIn ? <Creator full={practices.length >= READING_LIMITS.practices} onCreated={(practice, text) => { put(practice); setNotice({ id: practice.id, text }); setView({ kind: "own", id: practice.id }); }} />
        : <div className={styles.signin}>
          <span className={styles.signinMark} aria-hidden="true"><Icon name="spark" size={22} /></span>
          <div><strong>Өөрийн нийтлэл, хичээлээс IELTS дасгал</strong><p>Нэвтэрч ороод файл, хуудасны зураг эсвэл текстээ оруулбал AI түүнээс IELTS маягийн эх бичвэр, асуулт бэлдэнэ. Дасгал, хариулт тань бүртгэлд хадгалагдана.</p></div>
          <Link className={styles.primary} href="/login?next=%2Flabs%2Fielts-reading">Нэвтрэх</Link>
        </div>}
    </section>

    {signedIn && (practices.length || moveNote || listError) ? <section className={styles.section} aria-labelledby="rl-own">
      <div className={styles.sectionHead}><h2 id="rl-own">Миний дасгалууд</h2><span>{practices.length} / {READING_LIMITS.practices} · бүртгэлд</span></div>
      {moveNote ? <p className={styles.notice} role="status">{moveNote}</p> : null}
      {listError ? <p className={styles.error} role="alert">{listError}</p> : null}
      <div className={styles.ownList}>{practices.map(own => {
        const total = allQuestions(own.groups).length;
        return <article key={own.id} className={styles.own}>
          <button type="button" className={styles.ownOpen} onClick={() => setView({ kind: "own", id: own.id })}>
            <span className={styles.ownMark} aria-hidden="true"><Icon name="book" size={20} /></span>
            <span className={styles.ownText}>
              <strong lang="en">{own.title}</strong>
              <small>{total} асуулт · {passageWords(own.paragraphs)} үг · {dateLabel(own.createdAt)}</small>
              <small className={styles.ownSource}>{own.sourceName}</small>
            </span>
            {own.state.best != null ? <span className={styles.ownScore}><strong>{own.state.best}/{total}</strong><small>шилдэг</small></span>
              : <span className={styles.badge}>{Object.values(own.state.answers).some(filled) ? "Үргэлжилж байна" : "Шинэ"}</span>}
            <Icon name="arrow" size={18} className={styles.ownArrow} />
          </button>
          <button type="button" className={styles.ownDelete} title="Устгах" aria-label={`${own.title} дасгалыг устгах`} disabled={deleting !== null} aria-busy={deleting === own.id}
            onClick={() => void remove(own)}><Icon name="trash" size={17} /></button>
        </article>;
      })}</div>
    </section> : null}
  </div>;
}

function Creator({ full, onCreated }: { full: boolean; onCreated: (practice: SavedPractice, notice: string) => void }) {
  const [mode, setMode] = useState<"file" | "text">("file");
  const material = useMaterialPick({ extensions: ALLOWED, maxBytes: READING_LIMITS.fileBytes, documentHint: "PDF, Word, PowerPoint, TXT, MD, CSV файл эсвэл хуудасны зураг сонгоно уу." });
  const picked = material.pick;
  const file = picked?.kind === "document" ? picked.file : null;
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<ReadingLanguage>("mn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const { apply } = useCredits();
  const input = useRef<HTMLInputElement>(null);
  const length = text.trim().length;
  const ready = !full && (mode === "file" ? Boolean(picked) && !material.preparing : length >= READING_LIMITS.minSourceChars);
  // The most this material can cost, as the server holds it; the charge settles lower for shorter material.
  const hold = mode === "text" ? readingPracticeHold(Math.max(length, READING_LIMITS.minSourceChars))
    : picked?.kind === "images" ? readingPracticeHold(0, picked.images.length) : readingPracticeHold(READING_LIMITS.textChars);

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
    if (!ready || pending) return;
    setPending(true); setError("");
    try {
      const form = new FormData();
      if (mode === "file") material.append(form); else form.append("text", text.trim());
      form.append("language", language);
      // The practice is saved on the account; the server counts the account's practices before any credits are held.
      form.append("store", "account");
      const response = await fetch(API, { method: "POST", body: form, signal: AbortSignal.timeout(175_000) });
      const data = await jsonObject(response);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Дасгал үүсгэж чадсангүй. Дахин оролдоно уу.");
      apply(data);
      const practice = readSavedPractice(data.practice);
      // Already saved on the account: a reload shows it.
      if (!practice) throw new Error("AI дасгал бүрэн ирсэнгүй. Хуудсаа дахин ачаална уу.");
      material.clear(); setText("");
      const receipt = readReceipt(data);
      onCreated(practice, receipt ? `Дасгал бэлэн боллоо. ${receipt.spent} кредит зарцууллаа${receipt.spent < hold ? ` (хамгийн ихдээ ${hold} кредит барьж, үлдсэнийг буцаалаа)` : ""}.` : "Дасгал бэлэн боллоо.");
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Дасгал үүсгэхэд хэт удлаа. Дахин оролдоно уу.");
    } finally { setPending(false); }
  }

  return <div className={styles.create}>
    <div className={styles.source}>
      <div className={styles.segmented} role="tablist" aria-label="Материалын төрөл">
        <button type="button" role="tab" aria-selected={mode === "file"} onClick={() => { setMode("file"); setError(""); }} disabled={pending}><Icon name="fileExam" size={16} />Файл, зураг</button>
        <button type="button" role="tab" aria-selected={mode === "text"} onClick={() => { setMode("text"); setError(""); }} disabled={pending}><Icon name="pen" size={16} />Текст буулгах</button>
      </div>
      {mode === "file" ? <div className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
        onDragEnter={event => { event.preventDefault(); if (!pending) setDragging(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={drop}>
        <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" disabled={pending} aria-label="Унших дасгал үүсгэх файл эсвэл зураг сонгох"
          onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void pick(files); }} />
        {picked?.kind === "images" || (material.preparing && !file) ? <MaterialImages images={picked?.kind === "images" ? picked.images : []} max={material.max} onRemove={material.removeImage} onAdd={() => input.current?.click()} busy={material.preparing} disabled={pending} />
          : file ? <div className={styles.fileRow}>
            <span className={styles.fileIcon} aria-hidden="true">{file.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
            <span className={styles.fileText}><strong>{file.name}</strong><small>{bytes(file.size)}</small></span>
            <button type="button" className={styles.remove} onClick={() => { material.clear(); input.current?.focus(); }} aria-label="Сонгосон файлыг арилгах" disabled={pending}><Icon name="close" size={18} /></button>
          </div> : <>
            <span className={styles.dropIcon} aria-hidden="true"><Icon name="book" size={26} /></span>
            <strong>{dragging ? "Файл эсвэл зургаа тавина уу" : "Нийтлэл, хичээлийн файлаа энд чирэх"}</strong>
            <span>{READING_LIMITS.fileBytes / 1024 / 1024} MB хүртэл · PDF, DOCX, PPTX, TXT, MD эсвэл {material.max} хүртэл хуудасны зураг</span>
            <button type="button" className={styles.choose} onClick={() => input.current?.click()} disabled={pending}>Файл, зураг сонгох</button>
          </>}
      </div> : <div className={styles.paste}>
        <label htmlFor="rl-text" className="sr-only">Унших дасгал үүсгэх текст</label>
        <textarea id="rl-text" value={text} maxLength={READING_LIMITS.textChars} disabled={pending} spellCheck={false}
          placeholder="Англи эсвэл монгол хэл дээрх нийтлэл, хичээлийн бичвэрээ энд буулгана уу…" onChange={event => setText(event.currentTarget.value)} />
        <p className={styles.counter} data-short={length && length < READING_LIMITS.minSourceChars ? "" : undefined}>
          {length.toLocaleString("en-US")} / {READING_LIMITS.textChars.toLocaleString("en-US")} тэмдэгт{length < READING_LIMITS.minSourceChars ? ` · дор хаяж ${READING_LIMITS.minSourceChars.toLocaleString("en-US")}` : ""}
        </p>
      </div>}
    </div>

    <div className={styles.settings}>
      <div className={styles.setting} role="group" aria-label="Тайлбарын хэл">
        <span className={styles.settingLabel}>Тайлбарын хэл</span>
        <div className={styles.toggle}>
          <button type="button" aria-pressed={language === "mn"} onClick={() => setLanguage("mn")} disabled={pending}>Монгол</button>
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")} disabled={pending}>English</button>
        </div>
        <small>Эх бичвэр, асуулт англиар; тайлбар энэ хэлээр.</small>
      </div>
      <ul className={styles.will}>
        <li>450–900 үгийн IELTS маягийн эх бичвэр</li>
        <li>12 орчим асуулт: T/F/NG, сонголттой, нөхөх</li>
        <li>Хариулт бүрийн нотолгоо, тайлбар</li>
      </ul>
      <button type="button" className={styles.generate} onClick={() => void generate()} disabled={!ready || pending} aria-busy={pending}>
        {pending ? <><i className={styles.spinner} aria-hidden="true" />Дасгал бэлдэж байна…</> : <><Icon name="spark" size={18} />Дасгал үүсгэх</>}
      </button>
      <p className={styles.cost}><CreditCost action="reading-practice" cost={hold} upTo /></p>
      {full ? <p className={styles.error} role="status">{PRACTICES_FULL}</p> : null}
      {pending ? <p className={styles.status} role="status">Материалыг уншиж, эх бичвэр болон асуулт бэлдэж байна. 30–90 секунд орно.</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <p className={styles.fine}>Үнэ нь материалын урт, бэлдсэн эх бичвэр, асуултын тоогоор тооцогдоно: богино текст хямд, барьсан кредитийн илүүг буцаана. Материалын текст эсвэл зураг AI руу илгээгдэнэ. Урт материалын эхний 45,000 тэмдэгтийг ашиглана. Файл, текст серверт хадгалагдахгүй. Дасгал, хариулт, дүн таны бүртгэлд хадгалагдаж, өөр төхөөрөмж дээр ч нээгдэнэ; хариултын түлхүүр шалгах хүртэл серверт үлдэнэ. Бүртгэлд {READING_LIMITS.practices} хүртэл дасгал хадгална. AI-ийн бэлдсэн дасгал багшийн хяналтгүй. Хугацаатай шалгалтын үеэр хаалттай.</p>
    </div>
  </div>;
}

type Mark = { start: number; end: number; ids: string[]; labels: number[] };
/** Where each checked answer's evidence sits in the passage: the first paragraph that contains it, without overlaps. */
function evidenceMarks(paragraphs: readonly string[], results: readonly ResultItem[], numbers: Map<string, number>) {
  const marks = paragraphs.map(() => [] as Mark[]);
  for (const item of results) {
    if (!item.evidence) continue;
    const index = paragraphs.findIndex(paragraph => paragraph.includes(item.evidence!));
    if (index < 0) continue;
    const start = paragraphs[index].indexOf(item.evidence), end = start + item.evidence.length;
    const same = marks[index].find(mark => mark.start === start && mark.end === end);
    if (same) { same.ids.push(item.id); same.labels.push(numbers.get(item.id) ?? 0); continue; }
    if (marks[index].some(mark => start < mark.end && end > mark.start)) continue;
    marks[index].push({ start, end, ids: [item.id], labels: [numbers.get(item.id) ?? 0] });
  }
  return marks.map(list => list.sort((a, b) => a.start - b.start));
}

type SaveStatus = "saved" | "failed" | "stale";
type SaveBody = Extract<ProgressRequest, { action: "save" }>;
const saveBody = (state: PracticeState): SaveBody => ({ action: "save", attempts: state.attempts, answers: state.answers, timerStartedAt: state.timerStartedAt });

/**
 * Sends one practice's answers and timer to the account: 0.6 s after the last change, one request at a time, the
 * newest state wins and a failed save is tried again. A save from an out-of-date view (the practice was checked,
 * cleared or deleted in another tab or on another device) is refused with 409 or 404; nothing more is sent after that.
 */
function createSaver(url: string, onStatus: (status: SaveStatus) => void) {
  let next: SaveBody | null = null, timer = 0, running: Promise<void> | null = null, closed = false, stale = false, attached = true;
  function flush(keepalive = false): Promise<void> {
    window.clearTimeout(timer);
    timer = 0;
    if (running) return running.then(() => flush(keepalive));
    const body = next;
    if (!body || closed || stale) return Promise.resolve();
    next = null;
    running = fetch(url, {
      method: "PATCH", keepalive, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: keepalive ? undefined : AbortSignal.timeout(15_000),
    }).then(response => {
      if (response.status === 409 || response.status === 404) { stale = true; onStatus("stale"); return; }
      if (!response.ok) throw new Error("save");
      onStatus("saved");
    }).catch(() => {
      // While a check or a reset is on its way it carries the answers itself, so the failed save is not repeated.
      if (closed) return;
      next ??= body;
      onStatus("failed");
      if (attached) timer = window.setTimeout(() => void flush(), 5000);
    }).finally(() => { running = null; });
    return running;
  }
  return {
    queue(body: SaveBody) {
      // Nothing is queued behind a check or a reset; its reply is the new state.
      if (closed) return;
      next = body;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void flush(), 600);
    },
    flush,
    attach() { attached = true; },
    /** Leaving the runner: the last change goes out once, and nothing is retried behind the next practice. */
    detach() { attached = false; void flush(true); },
    /** Before a check or a reset: nothing more is saved, and the save in flight lands first. */
    async close() {
      closed = true;
      next = null;
      window.clearTimeout(timer);
      await running;
    },
    reopen() { closed = false; },
  };
}

function Runner({ practice, state, notice = null, onState, textSize, onTextSize, onBack }: {
  practice: RunnerPractice; state: PracticeState; notice?: string | null; onState: (state: PracticeState) => void;
  textSize: TextSize; onTextSize: (size: TextSize) => void; onBack: () => void;
}) {
  const questions = useMemo(() => allQuestions(practice.groups), [practice.groups]);
  const numbers = useMemo(() => new Map(questions.map((question, index) => [question.id, index + 1])), [questions]);
  const ranges = useMemo(() => practice.groups.reduce<{ from: number; to: number }[]>((list, group) => {
    const from = (list.at(-1)?.to ?? 0) + 1;
    return [...list, { from, to: from + group.questions.length - 1 }];
  }, []), [practice.groups]);
  const result = state.result;
  const checked = result !== null;
  const results = useMemo(() => new Map(result?.results.map(item => [item.id, item]) ?? []), [result]);
  const marks = useMemo(() => result ? evidenceMarks(practice.paragraphs, result.results, numbers) : null, [practice.paragraphs, result, numbers]);
  const answered = questions.filter(question => filled(state.answers[question.id])).length;
  const [pane, setPane] = useState<"passage" | "questions">("passage");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  // Signed in, answers and the timer are saved on the account; a guest's sample progress is kept by `onState` in this browser.
  const [saver] = useState(() => practice.saveUrl ? createSaver(practice.saveUrl, setSaveStatus) : null);
  const passage = useRef<HTMLElement>(null);
  const timing = state.timerStartedAt !== null && !checked;
  const left = timing ? SECONDS - Math.max(0, Math.round((now - state.timerStartedAt!) / 1000)) : SECONDS;
  const locked = checked || busy;

  useEffect(() => {
    if (!timing) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [timing]);
  useEffect(() => {
    if (!focus) return;
    const frame = requestAnimationFrame(() => passage.current?.querySelector(`[data-q~="${focus}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
    const clear = window.setTimeout(() => setFocus(null), 2600);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(clear); };
  }, [focus]);
  // Closing the tab or leaving the runner sends the last change without waiting for the pause after typing.
  useEffect(() => {
    if (!saver) return;
    const leave = () => { void saver.flush(true); };
    saver.attach();
    addEventListener("pagehide", leave);
    return () => { removeEventListener("pagehide", leave); saver.detach(); };
  }, [saver]);

  /** Answers and the timer: shown at once, then saved. */
  const change = (next: PracticeState) => {
    onState(next);
    saver?.queue(saveBody(next));
  };
  const answer = (id: string, value: ReadingAnswer | null) => {
    if (locked) return;
    const answers = { ...state.answers };
    if (value === null || value === "") delete answers[id]; else answers[id] = value;
    change({ ...state, answers });
  };
  function startTimer() { setNow(Date.now()); change({ ...state, timerStartedAt: Date.now() }); }
  function stopTimer() { if (window.confirm("Цагийг зогсоох уу? Хариултууд хэвээр үлдэнэ.")) change({ ...state, timerStartedAt: null }); }
  async function check() {
    if (locked) return;
    const missing = questions.length - answered;
    if (missing > 0 && !window.confirm(`${missing} асуултад хариулаагүй байна. Хариултаа шалгах уу?`)) return;
    setBusy(true); setError("");
    // The check carries the answers itself, so a save still on its way lands first and nothing is saved behind it.
    await saver?.close();
    try {
      const elapsed = state.timerStartedAt !== null ? Math.min(86_400, Math.max(0, Math.round((Date.now() - state.timerStartedAt) / 1000))) : null;
      onState(await practice.check(state, elapsed));
      saver?.reopen();
      setPane("questions");
      // The score card sits at the top of the questions; the passage pane keeps its own place.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      // Nothing was checked: the answers are saved again as they are.
      saver?.reopen();
      saver?.queue(saveBody(state));
      setError(failure(reason, "Хариулт шалгаж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));
    } finally { setBusy(false); }
  }
  async function retry() {
    if (busy || !window.confirm("Хариултууд арилж, дасгал шинээр эхэлнэ. Үргэлжлүүлэх үү?")) return;
    setBusy(true); setError("");
    await saver?.close();
    try {
      const next = await practice.retry(state);
      setFocus(null);
      onState(next);
      setPane("passage");
    } catch (reason) {
      setError(failure(reason, "Дасгалыг шинээр эхлүүлж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));
    } finally { saver?.reopen(); setBusy(false); }
  }
  const show = (id: string) => { setPane("passage"); setFocus(id); };

  return <div className={`wsp-page ${styles.runnerPage}`} data-pane={pane}>
    <header className={styles.bar}>
      <button type="button" className={styles.back} onClick={onBack}><Icon name="back" size={18} /><span>Унших лаб</span></button>
      <div className={styles.barTitle}><strong lang="en">{practice.title}</strong><small>{checked ? `${result.correct}/${result.total} зөв` : `${answered}/${questions.length} хариулсан`}</small></div>
      <div className={styles.barTools}>
        <button type="button" className={styles.tool} onClick={() => onTextSize(((textSize + 1) % 3) as TextSize)} title="Текстийн хэмжээ" aria-label={`Текстийн хэмжээ: ${["жижиг", "дунд", "том"][textSize]}`}><span aria-hidden="true">A<small>A</small></span></button>
        {checked ? state.finishedSeconds !== null ? <span className={styles.timeUsed}><Icon name="clock" size={16} />{clock(state.finishedSeconds)}</span> : null
          : timing ? <button type="button" className={styles.timer} data-over={left < 0 ? "" : undefined} data-low={left >= 0 && left <= 120 ? "" : undefined} onClick={stopTimer} disabled={busy} title="Цаг зогсоох">
            <Icon name="clock" size={16} />{left < 0 ? "+" + clock(-left) : clock(left)}
          </button>
          : <button type="button" className={styles.tool} onClick={startTimer} disabled={busy}><Icon name="clock" size={16} /><span>{READING_LIMITS.minutes}:00</span></button>}
        {checked ? <button type="button" className={styles.secondary} onClick={() => void retry()} disabled={busy} aria-busy={busy}>Дахин оролдох</button>
          : <button type="button" className={styles.primary} onClick={() => void check()} disabled={busy || !answered} aria-busy={busy}>{busy ? "Шалгаж байна…" : "Хариулт шалгах"}</button>}
      </div>
    </header>
    {notice && !checked ? <p className={styles.notice} role="status">{notice}</p> : null}
    {timing && left < 0 ? <p className={styles.overtime} role="status">{READING_LIMITS.minutes} минут дууслаа. Шалгалтад энэ үед дараагийн текст рүү шилжинэ. Хариултаа шалгаарай.</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {saveStatus === "stale" ? <p className={styles.overtime} role="status">Энэ дасгал өөр цонх эсвэл төхөөрөмж дээр өөрчлөгдсөн тул энд хийсэн өөрчлөлт хадгалагдсангүй. Хуудсаа дахин ачаална уу.</p>
      : saveStatus === "failed" ? <p className={styles.overtime} role="status">Хариулт бүртгэлд хадгалагдсангүй. Холболтоо шалгана уу; дахин оролдож байна.</p> : null}

    <div className={styles.tabs} role="tablist" aria-label="Харагдац">
      <button type="button" role="tab" aria-selected={pane === "passage"} onClick={() => setPane("passage")}>Текст</button>
      <button type="button" role="tab" aria-selected={pane === "questions"} onClick={() => setPane("questions")}>Асуултууд <small>{checked ? `${result.correct}/${result.total}` : `${answered}/${questions.length}`}</small></button>
    </div>

    <div className={styles.split}>
      <article ref={passage} className={styles.passage} data-size={textSize} lang="en" aria-label="Унших текст">
        <p className={styles.meta} lang="mn">{practice.meta.filter(Boolean).join(" · ")}</p>
        <h2>{practice.title}</h2>
        {practice.paragraphs.map((paragraph, index) => <div key={index} className={styles.paragraph}>
          <span className={styles.letter} aria-label={`Paragraph ${paragraphLabel(index)}`}>{paragraphLabel(index)}</span>
          <p>{marks ? highlight(paragraph, marks[index], focus) : paragraph}</p>
        </div>)}
        {checked ? <p className={styles.markNote} lang="mn">Шараар тэмдэглэсэн хэсэг нь тухайн дугаартай асуултын нотолгоо.</p> : null}
      </article>

      <section className={styles.questions} aria-label="Асуултууд">
        {checked ? <div className={styles.scoreCard} role="status">
          <span className={styles.scoreBig}><strong>{result.correct}</strong>/{result.total}</span>
          <span className={styles.scoreText}><strong>{result.percent}% зөв</strong><small>{state.finishedSeconds !== null ? `${clock(state.finishedSeconds)} зарцуулсан · ` : ""}{state.attempts > 1 && state.best !== null ? `Шилдэг ${state.best}/${result.total}` : "Эхний оролдлого"}</small></span>
          <span className={styles.scoreHint}>Буруу хариулт бүрийн тайлбарыг уншаад «Текстээс харах»-ыг дарж нотолгоог олоорой.</span>
        </div> : null}
        {practice.groups.map((group, groupIndex) => {
          const { from, to } = ranges[groupIndex];
          const choices = group.options && group.labels !== "paragraph" ? group.options : null;
          return <div key={groupIndex} className={styles.group}>
            <div className={styles.groupHead}>
              <h3 lang="en">{range(from, to)}</h3>
              <span className={styles.groupType} lang="en">{groupType(group)}</span>
            </div>
            <p className={styles.instruction} lang="en">{group.instruction}{group.limit ? <> <b>{group.limit}</b></> : null}</p>
            {choices ? <div className={styles.box} lang="en">
              {group.heading ? <p>{group.heading}</p> : null}
              <ol>{choices.map((option, index) => <li key={index}><b>{matchLabel(group, index)}</b><span>{option}</span></li>)}</ol>
            </div> : group.heading ? <p className={styles.boxTitle} lang="en">{group.heading}</p> : null}
            <ol className={styles.list}>{group.questions.map(question => <QuestionItem key={question.id} question={question} number={numbers.get(question.id) ?? 0} group={group}
              paragraphs={practice.paragraphs.length} value={state.answers[question.id]} result={results.get(question.id)} locked={locked}
              onAnswer={value => answer(question.id, value)} onShow={() => show(question.id)} />)}</ol>
          </div>;
        })}
        <div className={styles.footer}>
          {checked ? <button type="button" className={styles.secondary} onClick={() => void retry()} disabled={busy}>Дахин оролдох</button>
            : <><span>{answered}/{questions.length} хариулсан</span><button type="button" className={styles.primary} onClick={() => void check()} disabled={busy || !answered}>{busy ? "Шалгаж байна…" : "Хариулт шалгах"}</button></>}
          <button type="button" className={styles.linkButton} onClick={onBack}>Бусад дасгал</button>
        </div>
      </section>
    </div>
  </div>;
}

function highlight(paragraph: string, marks: Mark[], focus: string | null): ReactNode {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start > cursor) parts.push(<Fragment key={"t" + cursor}>{paragraph.slice(cursor, mark.start)}</Fragment>);
    parts.push(<mark key={"m" + mark.start} data-q={mark.ids.join(" ")} data-focus={focus && mark.ids.includes(focus) ? "" : undefined}><sup>{mark.labels.join(",")}</sup>{paragraph.slice(mark.start, mark.end)}</mark>);
    cursor = mark.end;
  }
  if (cursor < paragraph.length) parts.push(<Fragment key={"t" + cursor}>{paragraph.slice(cursor)}</Fragment>);
  return parts;
}

/** The correct answer as the paper prints it, with the option's words where there are any. */
function answerDisplay(group: PublicGroup, question: PublicQuestion, item: ResultItem) {
  if (question.kind === "choice") {
    const index = question.options.findIndex((_, i) => optionLetter(i) === item.answer);
    return index >= 0 ? `${item.answer}. ${question.options[index]}` : item.answer;
  }
  if (question.kind === "match" && group.options && group.labels !== "paragraph") {
    const index = group.options.findIndex((_, i) => matchLabel(group, i) === item.answer);
    return index >= 0 ? `${item.answer}. ${group.options[index]}` : item.answer;
  }
  return item.answer;
}

function QuestionItem({ question, number, group, paragraphs, value, result, locked, onAnswer, onShow }: {
  question: PublicQuestion; number: number; group: PublicGroup; paragraphs: number; value: ReadingAnswer | undefined; result: ResultItem | undefined;
  locked: boolean; onAnswer: (value: ReadingAnswer | null) => void; onShow: () => void;
}) {
  const label = `Question ${number}`;
  const select = () => <select className={styles.select} value={typeof value === "number" ? value : ""} disabled={locked} aria-label={label}
    onChange={event => onAnswer(event.currentTarget.value === "" ? null : Number(event.currentTarget.value))}>
    <option value="">—</option>
    {Array.from({ length: matchCount(group, paragraphs) }, (_, index) => <option key={index} value={index}>
      {matchLabel(group, index)}{group.options && group.labels !== "paragraph" ? `. ${group.options[index]}` : ""}
    </option>)}
  </select>;
  let body: ReactNode;
  if (question.kind === "tfng") {
    body = <fieldset className={styles.tfng}>
      <legend>{question.prompt}</legend>
      <div>{TFNG.map((option, index) => <label key={option} data-chosen={value === index ? "" : undefined} data-correct={result && result.answer === option ? "" : undefined}>
        <input type="radio" name={"rl-" + question.id} checked={value === index} disabled={locked} onChange={() => onAnswer(index)} />{option}
      </label>)}</div>
    </fieldset>;
  } else if (question.kind === "choice") {
    body = <fieldset className={styles.choice}>
      <legend>{question.prompt}</legend>
      {question.options.map((option, index) => <label key={index} data-chosen={value === index ? "" : undefined} data-correct={result && result.answer === optionLetter(index) ? "" : undefined}>
        <input type="radio" name={"rl-" + question.id} checked={value === index} disabled={locked} onChange={() => onAnswer(index)} />
        <span className={styles.optionLetter}>{optionLetter(index)}</span><span>{option}</span>
      </label>)}
    </fieldset>;
  } else if (question.kind === "gap") {
    const [before, after = ""] = question.prompt.split(GAP);
    body = <p className={styles.gap}>{before}<input type="text" value={typeof value === "string" ? value : ""} readOnly={locked} aria-label={label} autoComplete="off" autoCapitalize="off" spellCheck={false}
      maxLength={READING_LIMITS.answerChars} onChange={event => onAnswer(event.currentTarget.value)} />{after}</p>;
  } else if (question.prompt.includes(GAP)) {
    const [before, after = ""] = question.prompt.split(GAP);
    body = <p className={styles.gap}>{before}{select()}{after}</p>;
  } else {
    body = <div className={styles.match}><span>{question.prompt}</span>{select()}</div>;
  }
  return <li className={styles.item} data-result={result ? result.correct ? "good" : "bad" : undefined} lang="en">
    <span className={styles.num}>{number}</span>
    <div className={styles.itemBody}>
      {body}
      {result ? <div className={styles.feedback} lang="mn">
        <p><b>{result.correct ? "Зөв." : "Зөв хариулт:"}</b>{result.correct ? null : <span lang="en"> {answerDisplay(group, question, result)}</span>}</p>
        <p>{result.explanation}</p>
        {result.evidence ? <button type="button" className={styles.linkButton} onClick={onShow}><Icon name="search" size={15} />Текстээс харах</button> : null}
      </div> : null}
    </div>
  </li>;
}

async function jsonObject(response: Response): Promise<Record<string, unknown>> {
  const data: unknown = await response.json().catch(() => ({}));
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}
