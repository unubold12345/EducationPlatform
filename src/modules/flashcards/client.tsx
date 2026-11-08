"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import { CARD_COUNTS, FLASHCARD_LIMITS, type CardCount, type CardLanguage } from "./contracts";
import { deleteDeck, newDeckId, saveDeck, setCardKnown, useDecks, type Deck, type StoredCard } from "./store";
import styles from "./flashcards.module.css";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const dateLabel = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "short", day: "numeric" });
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
const percent = (deck: Deck) => deck.cards.length ? Math.round((deck.known.filter(id => deck.cards.some(card => card.id === id)).length / deck.cards.length) * 100) : 0;

export function Flashcards({ userKey }: { userKey: string }) {
  const decks = useDecks(userKey);
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState<CardCount>(20);
  const [language, setLanguage] = useState<CardLanguage>("mn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const active = activeId ? decks.find(deck => deck.id === activeId) ?? null : null;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [activeId]);

  function pick(next: File | null | undefined) {
    setError("");
    if (!next) return;
    const extension = next.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    if (!ALLOWED.has(extension)) { setError("PDF, Word, PowerPoint, TXT, MD эсвэл CSV файл сонгоно уу."); return; }
    if (next.size > FLASHCARD_LIMITS.fileBytes) { setError(`Файл хэт том байна. ${FLASHCARD_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`); return; }
    setFile(next);
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!pending) pick(event.dataTransfer.files?.[0]);
  }
  async function generate() {
    if (!file || pending) return;
    setPending(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("count", String(count));
      form.append("language", language);
      const response = await fetch("/api/workspace/flashcards", { method: "POST", body: form, signal: AbortSignal.timeout(175_000) });
      const data = await response.json().catch(() => ({})) as Record<string, unknown> & { error?: string };
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Карт үүсгэж чадсангүй. Дахин оролдоно уу.");
      const deck = createdDeck(data);
      if (!deck) throw new Error("AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
      saveDeck(userKey, deck);
      setActiveId(deck.id);
      setFile(null);
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Карт үүсгэхэд хэт удлаа. Дахин оролдоно уу.");
    } finally { setPending(false); }
  }
  function remove(deck: Deck) {
    if (!window.confirm(`"${deck.title}" багцыг устгах уу? Буцаах боломжгүй.`)) return;
    deleteDeck(userKey, deck.id);
    if (activeId === deck.id) setActiveId(null);
  }

  if (active) return <Study key={active.id} deck={active} userKey={userKey} onExit={() => setActiveId(null)} onRemove={() => remove(active)} />;

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Icon name="cards" size={17} />Флашкарт</p>
      <h1>Файлаа оруул.<br /><span>Карт болго.</span></h1>
      <p className={styles.lead}>Хичээлийн PDF, Word эсвэл текстээс AI 10–30 флашкарт үүсгэж, давтан цээжлэхэд бэлэн болгоно.</p>
    </header>

    <section className={styles.upload} aria-labelledby="fc-upload-heading">
      <h2 id="fc-upload-heading" className="sr-only">Файл оруулах</h2>
      <div className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
        onDragEnter={event => { event.preventDefault(); if (!pending) setDragging(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={drop}>
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={event => { pick(event.target.files?.[0]); event.target.value = ""; }} disabled={pending} aria-label="Хичээлийн файл сонгох" />
        <span className={styles.dropIcon} aria-hidden="true"><Icon name="cards" size={26} /></span>
        {file ? <div className={styles.fileRow}>
          <span className={styles.fileIcon} aria-hidden="true">{file.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
          <span className={styles.fileText}><strong>{file.name}</strong><small>{bytes(file.size)}</small></span>
          <button type="button" className={styles.remove} onClick={() => { setFile(null); input.current?.focus(); }} aria-label="Сонгосон файлыг арилгах" disabled={pending}><Icon name="close" size={18} /></button>
        </div> : <>
          <strong>{dragging ? "Файлаа тавина уу" : "Файлаа энд чирэх эсвэл сонгох"}</strong>
          <span>{FLASHCARD_LIMITS.fileBytes / 1024 / 1024} MB хүртэл · PDF, DOCX, PPTX, TXT, MD, CSV</span>
          <button type="button" className={styles.choose} onClick={() => input.current?.click()} disabled={pending}>Файл сонгох</button>
        </>}
      </div>

      <div className={styles.options}>
        <div className={styles.option} role="group" aria-label="Картын тоо">
          <span>Картын тоо</span>
          <div className={styles.segmented}>{CARD_COUNTS.map(value => <button key={value} type="button" aria-pressed={count === value} className={count === value ? styles.segmentActive : undefined} onClick={() => setCount(value)} disabled={pending}>{value}</button>)}</div>
        </div>
        <div className={styles.option} role="group" aria-label="Картын хэл">
          <span>Хэл</span>
          <div className={styles.segmented}><button type="button" aria-pressed={language === "mn"} className={language === "mn" ? styles.segmentActive : undefined} onClick={() => setLanguage("mn")} disabled={pending}>Монгол</button><button type="button" aria-pressed={language === "en"} className={language === "en" ? styles.segmentActive : undefined} onClick={() => setLanguage("en")} disabled={pending}>English</button></div>
        </div>
        <button type="button" className={styles.generate} onClick={() => void generate()} disabled={!file || pending} aria-busy={pending}>
          {pending ? <><i className={styles.spinner} aria-hidden="true" />Карт үүсгэж байна…</> : <><Icon name="spark" size={18} />Карт үүсгэх</>}
        </button>
      </div>
      {pending ? <p className={styles.status} role="status">Файлыг уншиж, AI карт үүсгэж байна. 10–40 секунд орно.</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <p className={styles.fine}>Файлын текст AI руу илгээгдэж, зөвхөн түүнээс карт үүсгэнэ. Урт файлын эхний 45,000 тэмдэгтийг ашиглана. Файл серверт хадгалагдахгүй; картууд зөвхөн энэ хөтөчид үлдэнэ. Хугацаатай шалгалтын үеэр хаалттай.</p>
    </section>

    <section className={styles.library} aria-labelledby="fc-library-heading">
      <div className={styles.sectionHead}><h2 id="fc-library-heading">Миний багцууд</h2>{decks.length ? <span>{decks.length} багц</span> : null}</div>
      {decks.length ? <div className={styles.decks}>{decks.map(deck => {
        const known = deck.known.filter(id => deck.cards.some(card => card.id === id)).length;
        return <article key={deck.id} className={styles.deck}>
          <button type="button" className={styles.deckOpen} onClick={() => setActiveId(deck.id)}>
            <span className={styles.deckMark} aria-hidden="true"><Icon name="cards" size={20} /></span>
            <span className={styles.deckText}><strong>{deck.title}</strong><small>{deck.cards.length} карт · {deck.sourceName} · {dateLabel.format(new Date(deck.createdAt))}</small></span>
            <span className={styles.deckProgress}><span className={styles.track} aria-hidden="true"><i style={{ width: percent(deck) + "%" }} /></span><small>{known}/{deck.cards.length} мэдсэн</small></span>
            <Icon name="arrow" size={18} className={styles.deckArrow} />
          </button>
          <button type="button" className={styles.deckDelete} onClick={() => remove(deck)} aria-label={`${deck.title} багцыг устгах`} title="Устгах"><Icon name="trash" size={17} /></button>
        </article>;
      })}</div> : <div className={styles.empty}>
        <span className={styles.emptyMark} aria-hidden="true"><Icon name="cards" size={30} /></span>
        <h3>Одоогоор багц алга</h3>
        <p>Дээрээс нэг файл оруулаад эхний флашкартаа үүсгээрэй. Жишээ нь: хичээлийн тэмдэглэл, үгийн жагсаалт, лекцийн PDF.</p>
      </div>}
    </section>
  </div>;
}

/** Build a stored deck only from a complete, expected API reply. */
function createdDeck(data: unknown): Deck | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  const source = value.source && typeof value.source === "object" ? value.source as Record<string, unknown> : null;
  if (typeof value.title !== "string" || !value.title.trim() || !Array.isArray(value.cards) || value.cards.length < 3) return null;
  if (!source || typeof source.name !== "string" || typeof source.kind !== "string") return null;
  if (value.language !== "mn" && value.language !== "en") return null;
  const cards: StoredCard[] = [];
  for (const item of value.cards) {
    if (!item || typeof item !== "object") continue;
    const card = item as Record<string, unknown>;
    if (typeof card.front !== "string" || !card.front.trim() || typeof card.back !== "string" || !card.back.trim()) continue;
    cards.push({ id: typeof card.id === "string" ? card.id : "c" + (cards.length + 1), front: card.front.slice(0, 400), back: card.back.slice(0, 1200), ...(typeof card.hint === "string" && card.hint ? { hint: card.hint.slice(0, 300) } : {}) });
  }
  if (cards.length < 3) return null;
  const now = Date.now();
  return { id: newDeckId(), title: value.title.trim().slice(0, 140), sourceName: source.name.slice(0, 160), sourceKind: source.kind.slice(0, 20), language: value.language, createdAt: now, updatedAt: now, cards, known: [] };
}

function Study({ deck, userKey, onExit, onRemove }: { deck: Deck; userKey: string; onExit: () => void; onRemove: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = deck.cards[index];
  const done = index >= deck.cards.length;
  const known = deck.known.filter(id => deck.cards.some(item => item.id === id)).length;
  const mark = (value: boolean) => {
    if (!card) return;
    setCardKnown(userKey, deck.id, card.id, value);
    setFlipped(false);
    setIndex(current => current + 1);
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Escape") { event.preventDefault(); onExit(); return; }
      if (done) return;
      if (!flipped && (event.key === " " || event.key === "ArrowUp")) { event.preventDefault(); setFlipped(true); return; }
      if (!flipped) return;
      if (event.key === "1" || event.key === "ArrowLeft") { event.preventDefault(); mark(false); }
      else if (event.key === "2" || event.key === "ArrowRight") { event.preventDefault(); mark(true); }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  if (done) return <div className={`wsp-page ${styles.page}`}>
    <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Багц руу буцах</button>
    <section className={styles.done} aria-labelledby="fc-done-heading">
      <span className={styles.doneMark} aria-hidden="true"><Icon name="check" size={30} /></span>
      <p className={styles.kicker}>ДАВТАЛТ ДУУССАН</p>
      <h1 id="fc-done-heading">{deck.title}</h1>
      <p className={styles.doneScore}><strong>{known}</strong> / {deck.cards.length} картыг мэдсэн гэж тэмдэглэлээ.</p>
      <div className={styles.doneActions}>
        <button type="button" className={styles.generate} onClick={() => { setIndex(0); setFlipped(false); }}><Icon name="repeat" size={18} />Дахин давтах</button>
        <button type="button" className={styles.ghost} onClick={onExit}>Багц руу буцах</button>
      </div>
      <p className={styles.fine}>Мэдсэн гэсэн тэмдэглэл энэ хөтөчид хадгалагдана. Багцыг устгавал буцаах боломжгүй.</p>
    </section>
  </div>;

  return <div className={`wsp-page ${styles.page}`}>
    <div className={styles.studyTop}>
      <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Багц руу буцах</button>
      <div className={styles.studyTitle}><h1>{deck.title}</h1><p>{deck.sourceName} · {deck.cards.length} карт</p></div>
      <button type="button" className={styles.studyDelete} onClick={onRemove} aria-label={`${deck.title} багцыг устгах`} title="Багц устгах"><Icon name="trash" size={18} /></button>
    </div>
    <div className={styles.studyBar}><span>{index + 1} / {deck.cards.length}</span><span className={styles.track} aria-hidden="true"><i style={{ width: Math.round(((index + (flipped ? 1 : 0)) / deck.cards.length) * 100) + "%" }} /></span><span>{known} мэдсэн</span></div>

    <div className={styles.cardStage} aria-live="polite">
      <button type="button" className={`${styles.card} ${flipped ? styles.cardBack : ""}`} onClick={() => setFlipped(value => !value)} aria-label={flipped ? "Асуулт руу буцах" : "Хариултыг харах"}>
        <span className={styles.cardSide}>{flipped ? "ХАРИУЛТ" : "АСУУЛТ"}</span>
        <span className={styles.cardText}>{flipped ? card.back : card.front}</span>
        {flipped && card.hint ? <span className={styles.cardHint}>Зөвлөмж · {card.hint}</span> : null}
        {!flipped ? <span className={styles.cardFlip}><Icon name="repeat" size={17} />Хариултыг харах</span> : <span className={styles.cardFlip}>Асуулт руу буцах</span>}
      </button>
    </div>

    {flipped ? <div className={styles.controls}>
      <button type="button" className={styles.again} onClick={() => mark(false)}><span>Дахин</span><small>1 эсвэл ←</small></button>
      <button type="button" className={styles.known} onClick={() => mark(true)}><span>Мэдсэн</span><small>2 эсвэл →</small></button>
    </div> : <div className={styles.controls}>
      <button type="button" className={styles.generate} onClick={() => setFlipped(true)}><Icon name="repeat" size={18} />Хариулт харах</button>
    </div>}
    <p className={styles.keys}>Space — карт эргүүлэх · 1 / 2 — дахин эсвэл мэдсэн · Esc — гарах</p>
  </div>;
}
