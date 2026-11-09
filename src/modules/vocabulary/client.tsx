"use client";
import Link from "next/link";
import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import {
  bankFullMessage, DEFAULT_IMPORT_COUNT, IMPORT_COUNTS, IMPORT_LANGUAGES, VOCABULARY_LIMITS, vocabularyUpgrade,
  type ImportLanguage, type VocabularyWord,
} from "./contracts";
import { Quiz } from "./quiz-view";
import styles from "./vocabulary.module.css";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { formatCredits, readReceipt, vocabularyImportCredits, vocabularyImportHold } from "@/modules/credits/pricing";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const LANGUAGE_LABEL: Record<ImportLanguage, string> = { mn: "Монгол", en: "English" };
const dayMonth = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", month: "numeric", day: "numeric" });
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
const UPGRADE = vocabularyUpgrade();
// Two worked examples of the import price, computed from the same price list the server charges by.
const SHORT_LIST_PRICE = vocabularyImportCredits(2_000, 10);
const FULL_FILE_PRICE = vocabularyImportHold(VOCABULARY_LIMITS.importWords);

/** "11-р сарын 9" in Ulaanbaatar time, without relying on a locale that may fall back to English. */
function shortDate(iso: string) {
  const parts = dayMonth.formatToParts(new Date(iso));
  const month = Number(parts.find(part => part.type === "month")?.value ?? 0);
  const day = Number(parts.find(part => part.type === "day")?.value ?? 0);
  return month && day ? `${month}-р сарын ${day}` : "";
}

type Notice = { tone: "ok" | "bad"; text: string };
type ImportReply = {
  words: VocabularyWord[]; added: number; duplicates: number; skipped: number; total: number; limit: number; requested: number;
  source: { name: string; kind: string; pages: number | null; truncated: boolean };
  language: ImportLanguage; provider: "DeepSeek";
};

const message = (reason: unknown, fallback: string) => reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : fallback;

async function request<T>(url: string, init: RequestInit, timeout: number): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  const data = await response.json().catch(() => ({})) as Record<string, unknown> & { error?: string };
  if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Хүсэлт амжилтгүй боллоо. Дахин оролдоно уу.");
  return data as T;
}

export function Vocabulary({ initialWords, limit }: { initialWords: VocabularyWord[]; limit: number }) {
  const [words, setWords] = useState(initialWords);
  const [quiz, setQuiz] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState<number>(VOCABULARY_LIMITS.pageSize);

  // Add form
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const termInput = useRef<HTMLInputElement>(null);

  // File import
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<ImportLanguage>("mn");
  const [count, setCount] = useState<number>(DEFAULT_IMPORT_COUNT);
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const { apply } = useCredits();
  const [importError, setImportError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return words;
    return words.filter(word => [word.term, word.translation, word.example ?? ""].some(value => value.toLocaleLowerCase().includes(needle)));
  }, [words, query]);
  const shown = filtered.slice(0, visible);
  // The bank size comes from the server (free or the student's plan); the server enforces it again.
  const room = Math.max(0, limit - words.length);
  const full = room === 0;
  const importCount = Math.max(1, Math.min(count, room));

  function notify(next: Notice) {
    setNotice(next);
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (adding) return;
    const cleanTerm = term.trim(), cleanTranslation = translation.trim();
    if (!cleanTerm || !cleanTranslation) return;
    setAdding(true); setAddError(""); setNotice(null);
    try {
      const data = await request<{ word: VocabularyWord; total: number }>("/api/workspace/vocabulary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: cleanTerm, translation: cleanTranslation, example: example.trim() }),
      }, 20_000);
      setWords(current => [data.word, ...current.filter(item => item.id !== data.word.id)]);
      setTerm(""); setTranslation(""); setExample("");
      notify({ tone: "ok", text: `"${data.word.term}" үг хадгалагдлаа. Одоо ${data.total} үг байна.` });
      termInput.current?.focus();
    } catch (reason) {
      setAddError(message(reason, "Үг хадгалж чадсангүй. Дахин оролдоно уу."));
    } finally { setAdding(false); }
  }

  function pick(next: File | null | undefined) {
    setImportError("");
    if (!next) return;
    const extension = next.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    if (!ALLOWED.has(extension)) { setImportError("PDF, Word, PowerPoint, TXT, MD эсвэл CSV файл сонгоно уу."); return; }
    if (next.size > VOCABULARY_LIMITS.fileBytes) { setImportError(`Файл хэт том байна. ${VOCABULARY_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`); return; }
    setFile(next);
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!pending) pick(event.dataTransfer.files?.[0]);
  }
  async function importFile() {
    if (!file || pending) return;
    setPending(true); setImportError(""); setNotice(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", language);
      form.append("prompt", instruction.trim());
      form.append("count", String(importCount));
      const data = await request<ImportReply>("/api/workspace/vocabulary/import", { method: "POST", body: form }, 175_000);
      apply(data);
      const receipt = readReceipt(data);
      setWords(current => {
        const ids = new Set(data.words.map(word => word.id));
        return [...data.words, ...current.filter(word => !ids.has(word.id))];
      });
      setFile(null);
      const skipped = [data.duplicates ? `${data.duplicates} давхар үг алгасагдлаа.` : "", data.skipped ? `Сангийн хязгаарт ${data.skipped} үг багтсангүй.` : ""].filter(Boolean).join(" ");
      const paid = receipt ? ` ${receipt.spent} кредит зарцууллаа.` : "";
      notify({ tone: "ok", text: `${data.added} үг таны санд нэмэгдлээ.${paid}${skipped ? " " + skipped : ""}` });
    } catch (reason) {
      setImportError(message(reason, "Файлаас үг оруулж чадсангүй. Дахин оролдоно уу."));
    } finally { setPending(false); }
  }

  async function updateWord(id: string, fields: { term: string; translation: string; example: string }): Promise<string | null> {
    try {
      const data = await request<{ word: VocabularyWord }>(`/api/workspace/vocabulary/words/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      }, 20_000);
      setWords(current => current.map(word => word.id === id ? data.word : word));
      notify({ tone: "ok", text: `"${data.word.term}" шинэчлэгдлээ.` });
      return null;
    } catch (reason) {
      return message(reason, "Үгийг шинэчилж чадсангүй. Дахин оролдоно уу.");
    }
  }

  async function removeWord(word: VocabularyWord): Promise<string | null> {
    if (!window.confirm(`"${word.term}" үгийг устгах уу? Буцаах боломжгүй.`)) return null;
    try {
      await request<{ ok: true }>(`/api/workspace/vocabulary/words/${encodeURIComponent(word.id)}`, { method: "DELETE" }, 20_000);
      setWords(current => current.filter(item => item.id !== word.id));
      notify({ tone: "ok", text: `"${word.term}" устгагдлаа.` });
      return null;
    } catch (reason) {
      return message(reason, "Үгийг устгаж чадсангүй. Дахин оролдоно уу.");
    }
  }

  if (quiz) return <Quiz words={words} onExit={() => setQuiz(false)} />;

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Icon name="book" size={17} />Үгсийн сан</p>
      <div className={styles.headRow}>
        <div className={styles.headText}>
          <h1>Үгээ цуглуул.<br /><span>Тоглож шалга.</span></h1>
          <p className={styles.lead}>Өөрийн үг, орчуулгаа гараар нэмэх эсвэл файлаа оруулаад AI-аар бүх үгийг нэг дор хадгал. Дараа нь өөрийн үгсээр quiz хийж шалга.</p>
        </div>
        <div className={`${styles.countCard} ${full ? styles.countFull : ""}`} aria-label={`${words.length} / ${limit} хадгалсан үг`}>
          <strong>{words.length}</strong>
          <span>хадгалсан үг · {formatCredits(limit)} хүртэл</span>
          <i aria-hidden="true"><b style={{ width: Math.min(100, Math.round((words.length / Math.max(1, limit)) * 100)) + "%" }} /></i>
        </div>
      </div>
    </header>

    {full ? <p className={styles.full} role="status">
      <Icon name="info" size={16} />
      <span>{bankFullMessage(limit)}{limit < UPGRADE.words ? <> <Link href="/workspace/plans">Багцууд үзэх</Link></> : null}</span>
    </p> : null}

    <div className={styles.tools}>
      <section className={styles.panel} aria-labelledby="voc-add-heading">
        <div className={styles.panelHead}>
          <span className={styles.panelIcon} aria-hidden="true"><Icon name="plus" size={19} /></span>
          <div><h2 id="voc-add-heading">Шинэ үг</h2><p>Үг, орчуулгаа бичээд сандаа нэмээрэй.</p></div>
        </div>
        <form className={styles.form} onSubmit={add}>
          <label className={styles.field}><span>Үг эсвэл хэллэг</span>
            <input ref={termInput} value={term} onChange={event => setTerm(event.target.value)} maxLength={VOCABULARY_LIMITS.term} placeholder="жишээ нь: resilient" autoComplete="off" required disabled={adding} />
          </label>
          <label className={styles.field}><span>Орчуулга</span>
            <input value={translation} onChange={event => setTranslation(event.target.value)} maxLength={VOCABULARY_LIMITS.translation} placeholder="жишээ нь: тэсвэртэй, уян хатан" autoComplete="off" required disabled={adding} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}><span>Жишээ өгүүлбэр <em>сонголтоор</em></span>
            <input value={example} onChange={event => setExample(event.target.value)} maxLength={VOCABULARY_LIMITS.example} placeholder="The material is resilient to heat." autoComplete="off" disabled={adding} />
          </label>
          {addError ? <p className={styles.error} role="alert">{addError}</p> : null}
          <div className={styles.formFoot}>
            <button type="submit" className={styles.primary} disabled={adding || full || !term.trim() || !translation.trim()} aria-busy={adding}>
              {adding ? <><i className={styles.spinner} aria-hidden="true" />Хадгалж байна…</> : <><Icon name="plus" size={17} />Сандаа нэмэх</>}
            </button>
          </div>
          <p className={`${styles.fine} ${styles.formFine}`}>Үг таны бүртгэлд хадгалагдаж, дараагийн зочлолтод харагдана. Үнэгүй бүртгэлд {formatCredits(VOCABULARY_LIMITS.freeWords)} үг{UPGRADE.plans.length ? `, ${UPGRADE.plans.join(" эсвэл ")} багцтай бол ${formatCredits(UPGRADE.words)} үг` : ""} хадгална.</p>
        </form>
      </section>

      <section className={`${styles.panel} ${styles.importPanel}`} aria-labelledby="voc-import-heading">
        <div className={styles.panelHead}>
          <span className={styles.panelIcon} aria-hidden="true"><Icon name="spark" size={19} /></span>
          <div><h2 id="voc-import-heading">Файлаас нэмэх</h2><p>AI файлаас бүх үгийг орчуулгын хамт ялгаж авна.</p></div>
        </div>
        <div className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
          onDragEnter={event => { event.preventDefault(); if (!pending) setDragging(true); }}
          onDragOver={event => event.preventDefault()}
          onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
          onDrop={drop}>
          <input ref={fileInput} type="file" accept={ACCEPT} className="sr-only" onChange={event => { pick(event.target.files?.[0]); event.target.value = ""; }} disabled={pending} aria-label="Үг оруулах файл сонгох" />
          {file ? <div className={styles.fileRow}>
            <span className={styles.fileIcon} aria-hidden="true">{file.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
            <span className={styles.fileText}><strong>{file.name}</strong><small>{bytes(file.size)}</small></span>
            <button type="button" className={styles.remove} onClick={() => { setFile(null); fileInput.current?.focus(); }} aria-label="Сонгосон файлыг арилгах" disabled={pending}><Icon name="close" size={18} /></button>
          </div> : <>
            <strong>{dragging ? "Файлаа тавина уу" : "Файлаа энд чирэх эсвэл сонгох"}</strong>
            <span>{VOCABULARY_LIMITS.fileBytes / 1024 / 1024} MB хүртэл · PDF, DOCX, PPTX, TXT, MD, CSV</span>
            <button type="button" className={styles.choose} onClick={() => fileInput.current?.click()} disabled={pending}>Файл сонгох</button>
          </>}
        </div>
        <div className={`${styles.option} ${styles.countOption}`} role="group" aria-label="Нэг файлаас нэмэх үгийн тоо">
          <span>Хэдэн үг нэмэх</span>
          <div className={styles.segmented}>{IMPORT_COUNTS.map(value => <button key={value} type="button" aria-pressed={count === value} className={count === value ? styles.segmentActive : undefined} onClick={() => setCount(value)} disabled={pending || full} title={value === VOCABULARY_LIMITS.importWords ? `${value} хүртэл` : undefined}>{value === VOCABULARY_LIMITS.importWords ? "Бүгд" : value}</button>)}</div>
          <small>{full ? "Үгсийн сан дүүрсэн тул файлаас үг нэмэх боломжгүй." : room < count ? `Санд ${room} үгийн зай үлдсэн тул ${room} хүртэл үг нэмнэ.` : "Зөвхөн шинээр хадгалсан үгэнд төлнө. Давхар үгэнд кредит зарцуулахгүй."}</small>
        </div>
        <label className={`${styles.field} ${styles.promptField}`}>
          <span>Заавар <em>сонголтоор · {instruction.length}/{VOCABULARY_LIMITS.prompt}</em></span>
          <textarea value={instruction} onChange={event => setInstruction(event.target.value)} maxLength={VOCABULARY_LIMITS.prompt} rows={2} placeholder="жишээ нь: Хамгийн чухал академик үгсийг сонгоод орчуул." disabled={pending} />
          <small className={styles.fieldHint}>Ямар үг сонгохыг зааж болно (жишээ нь: зөвхөн үйл үг). Тоог дээрх сонголт тогтооно. Файлд орчуулга байхгүй үгсийг AI орчуулна.</small>
        </label>
        <div className={styles.importFoot}>
          <div className={styles.option} role="group" aria-label="Файлд орчуулга байхгүй үеийн орчуулгын хэл">
            <span>Файлд орчуулга байхгүй үед</span>
            <div className={styles.segmented}>{IMPORT_LANGUAGES.map(value => <button key={value} type="button" aria-pressed={language === value} className={language === value ? styles.segmentActive : undefined} onClick={() => setLanguage(value)} disabled={pending}>{LANGUAGE_LABEL[value]}</button>)}</div>
          </div>
          <div className={styles.importAction}>
            {full ? null : <CreditCost action="vocabulary-import" cost={vocabularyImportHold(importCount)} upTo />}
            <button type="button" className={styles.primary} onClick={() => void importFile()} disabled={!file || pending || full} aria-busy={pending}>
              {pending ? <><i className={styles.spinner} aria-hidden="true" />Уншиж байна…</> : <><Icon name="spark" size={17} />Үг оруулах</>}
            </button>
          </div>
        </div>
        {pending ? <p className={styles.status} role="status">Файлыг уншиж, AI үгсийг ялгаж байна. 10–40 секунд орно.</p> : null}
        {importError ? <p className={styles.error} role="alert">{importError}</p> : null}
        <p className={styles.hint}><Icon name="info" size={16} /><span>Файлд өөрийн орчуулга байвал түүнийг ашиглана. Орчуулга байхгүй үгсийг AI орчуулах бөгөөд AI-ийн орчуулга үргэлж зөв биш тул шалгаарай.</span></p>
        <p className={styles.fine}>Үнэ нь AI-ийн уншсан текстийн урт ба шинээр хадгалсан үгийн тооноос хамаарна: богино жагсаалтаас 10 үг ≈ {SHORT_LIST_PRICE} кредит, 45,000 тэмдэгттэй файлаас {VOCABULARY_LIMITS.importWords} үг = {FULL_FILE_PRICE} кредит. Сонгосон тооны дээд үнийг түр барьж, зарцуулаагүйг нь буцаана.</p>
        <p className={styles.fine}>Файлын текст AI руу илгээгдэж, олдсон үгс таны санд хадгалагдана. Нэг файлаас хамгийн ихдээ {VOCABULARY_LIMITS.importWords} үг. Урт файлын эхний 45,000 тэмдэгтийг ашиглана. Хугацаатай шалгалтын үеэр хаалттай.</p>
      </section>
    </div>

    {notice ? <p className={`${styles.notice} ${notice.tone === "bad" ? styles.noticeBad : ""}`} role={notice.tone === "bad" ? "alert" : "status"}>{notice.text}</p> : null}

    <section className={styles.quizBanner} aria-labelledby="voc-quiz-heading">
      <span className={styles.quizMark} aria-hidden="true"><Icon name="bolt" size={22} /></span>
      <div className={styles.quizCopy}>
        <h2 id="voc-quiz-heading">Өөрийн үгээр quiz</h2>
        <p>{words.length >= 4 ? `${words.length} үгээс санамсаргүй сонгож, 4 сонголттой шалгалт өгнө.` : "Дор хаяж 4 үг хадгалаад quiz эхлүүлээрэй."}</p>
      </div>
      <button type="button" className={styles.primary} onClick={() => setQuiz(true)} disabled={words.length < 4}><Icon name="bolt" size={17} />Quiz эхлэх</button>
    </section>

    <section className={styles.library} aria-labelledby="voc-bank-heading">
      <div className={styles.sectionHead}>
        <div><h2 id="voc-bank-heading">Миний үгс</h2><p>{query ? `${filtered.length} / ${words.length} үг` : `${words.length} үг`}{words.length ? " · сүүлд нэмсэн нь эхэнд" : ""}</p></div>
        <label className={styles.search}><span className="sr-only">Үгсээс хайх</span><Icon name="search" size={17} /><input type="search" value={query} onChange={event => { setQuery(event.target.value); setVisible(VOCABULARY_LIMITS.pageSize); }} placeholder="Үг эсвэл орчуулгаар хайх" /></label>
      </div>

      {words.length ? (filtered.length ? <>
        <ul className={styles.words}>{shown.map(word => <WordRow key={word.id} word={word} onSave={updateWord} onDelete={removeWord} />)}</ul>
        {filtered.length > visible ? <div className={styles.more}><button type="button" className={styles.ghost} onClick={() => setVisible(count => count + VOCABULARY_LIMITS.pageSize)}>Дараагийн {Math.min(VOCABULARY_LIMITS.pageSize, filtered.length - visible)} үг<Icon name="chevron" size={17} /></button></div> : null}
      </> : <div className={styles.empty}><span className={styles.emptyMark} aria-hidden="true"><Icon name="search" size={28} /></span><h3>Хайлтад тохирох үг алга</h3><p>Өөр үгээр хайх эсвэл хайлтыг цэвэрлээрэй.</p><button type="button" className={styles.ghost} onClick={() => setQuery("")}>Хайлт цэвэрлэх</button></div>) : <div className={styles.empty}>
        <span className={styles.emptyMark} aria-hidden="true"><Icon name="book" size={30} /></span>
        <h3>Үгсийн сан хоосон байна</h3>
        <p>Дээрээс эхний үгээ нэмээрэй. Жишээ нь: хичээлийн үгийн жагсаалт, уншсан зүйлийнхээ шинэ үгс, эсвэл бэлэн PDF.</p>
      </div>}
    </section>
  </div>;
}

function WordRow({ word, onSave, onDelete }: { word: VocabularyWord; onSave: (id: string, fields: { term: string; translation: string; example: string }) => Promise<string | null>; onDelete: (word: VocabularyWord) => Promise<string | null> }) {
  const [editing, setEditing] = useState(false);
  const [term, setTerm] = useState(word.term);
  const [translation, setTranslation] = useState(word.translation);
  const [example, setExample] = useState(word.example ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function begin() {
    setTerm(word.term); setTranslation(word.translation); setExample(word.example ?? "");
    setError(""); setEditing(true);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!term.trim() || !translation.trim()) return;
    setBusy(true); setError("");
    const failure = await onSave(word.id, { term: term.trim(), translation: translation.trim(), example: example.trim() });
    setBusy(false);
    if (failure) setError(failure); else setEditing(false);
  }
  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    const failure = await onDelete(word);
    setBusy(false);
    if (failure) setError(failure);
  }

  if (editing) return <li className={`${styles.word} ${styles.wordEditing}`} data-term={word.term}>
    <form className={styles.editForm} onSubmit={save}>
      <div className={styles.editGrid}>
        <label className={styles.field}><span>Үг</span><input value={term} onChange={event => setTerm(event.target.value)} maxLength={VOCABULARY_LIMITS.term} required disabled={busy} autoFocus /></label>
        <label className={styles.field}><span>Орчуулга</span><input value={translation} onChange={event => setTranslation(event.target.value)} maxLength={VOCABULARY_LIMITS.translation} required disabled={busy} /></label>
        <label className={`${styles.field} ${styles.fieldWide}`}><span>Жишээ өгүүлбэр <em>сонголтоор</em></span><input value={example} onChange={event => setExample(event.target.value)} maxLength={VOCABULARY_LIMITS.example} disabled={busy} /></label>
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.editFoot}>
        <button type="button" className={styles.ghost} onClick={() => setEditing(false)} disabled={busy}>Цуцлах</button>
        <button type="submit" className={styles.primary} disabled={busy || !term.trim() || !translation.trim()}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      </div>
    </form>
  </li>;

  return <li className={styles.word} data-term={word.term}>
    <div className={styles.wordMain}>
      <div className={styles.wordTop}>
        <strong>{word.term}</strong>
        <span className={styles.sourceChip} title={word.sourceName ?? "Гараар нэмсэн"}>{word.sourceName ?? "Гараар"}</span>
        <span className={styles.date}>{shortDate(word.createdAt)}</span>
      </div>
      <p className={styles.translation}>{word.translation}</p>
      {word.example ? <p className={styles.example}>“{word.example}”</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
    <div className={styles.wordActions}>
      <button type="button" className={styles.rowAction} onClick={begin} aria-label={`${word.term} үгийг засах`} title="Засах" disabled={busy}><Icon name="pen" size={17} /></button>
      <button type="button" className={`${styles.rowAction} ${styles.deleteAction}`} onClick={() => void remove()} aria-label={`${word.term} үгийг устгах`} title="Устгах" disabled={busy}><Icon name="trash" size={17} /></button>
    </div>
  </li>;
}
