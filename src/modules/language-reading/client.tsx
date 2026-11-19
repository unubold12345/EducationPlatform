"use client";
import Link from "next/link";
import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { languageReadingCredits, readReceipt } from "@/modules/credits/pricing";
import type { LanguageExam } from "@/modules/language-decks/catalog";
import { toHiragana } from "@/modules/language-decks/romaji";
import { writeStored } from "@/modules/vocabulary/api";
import { useVoices } from "@/modules/vocabulary/speech";
import { Icon } from "@/modules/workspace/icons";
import { ProcessingOverlay } from "@/modules/workspace/processing";
import {
  KANA_LEVELS, KANJI_LEVELS, READING_LENGTH_IDS, READING_LENGTHS, READING_LIMITS, READING_TOPICS, findReadingLevel, keepRecent, levelsFor,
  readStoredTexts, type ReadingLength, type ReadingLevelId, type ReadingText, type ReadingToken, type ReadingTopicId,
} from "./contracts";
import styles from "./reading.module.css";

// Workshop → JLPT / HSK / TOPIK → Унших дасгал (owner request 2026-11-19): pick a level, a topic and a length, the server
// writes a short text (credits), and the student reads it with toggles for furigana / pinyin / romanization, romaji, word
// gaps and a Mongolian translation per sentence, and the browser's voice. No questions. Texts stay in this browser only
// (the last six per exam, keyed by the student), so a reload keeps a paid text; nothing is stored on the server.

const EXAM_TITLE: Record<LanguageExam, string> = { jlpt: "JLPT", hsk: "HSK", topik: "TOPIK" };
const VOICE: Record<LanguageExam, string> = { jlpt: "ja-JP", hsk: "zh-CN", topik: "ko-KR" };
const LANG: Record<LanguageExam, string> = { jlpt: "ja", hsk: "zh-Hans", topik: "ko" };
const READING_AID: Record<LanguageExam, string> = { jlpt: "ふりがな", hsk: "Pinyin", topik: "Romanization" };
const API = "/api/labs/reading";

// --- Browser storage (a per-viewer convenience; the page works without it) ------------------------------------------

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
// What this tab wrote last wins over storage, so the page keeps working where storage is blocked or full.
const memory = new Map<string, string>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();
function snapshot<T>(key: string, parse: (value: unknown) => T): T {
  let raw: string | null = memory.get(key) ?? null;
  if (raw === null) { try { raw = window.localStorage.getItem(key); } catch { raw = null; } }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T;
  try { value = parse(raw === null ? null : JSON.parse(raw)); } catch { value = parse(null); }
  snapshots.set(key, { raw, value });
  return value;
}
function useStored<T>(key: string, parse: (value: unknown) => T, fallback: T) {
  const value = useSyncExternalStore(subscribe, () => snapshot(key, parse), () => fallback);
  const save = useCallback((next: T) => { memory.set(key, JSON.stringify(next)); writeStored(key, next); notify(); }, [key]);
  return [value, save] as const;
}

type Aids = { reading: boolean; romaji: boolean; gaps: boolean | null; size: 0 | 1 | 2; slow: boolean };
const DEFAULT_AIDS: Aids = { reading: true, romaji: false, gaps: null, size: 1, slow: false };
function readAids(value: unknown): Aids {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_AIDS;
  const item = value as Record<string, unknown>;
  const flag = (name: keyof Aids, fallback: boolean) => typeof item[name] === "boolean" ? item[name] as boolean : fallback;
  return {
    reading: flag("reading", true), romaji: flag("romaji", false), gaps: typeof item.gaps === "boolean" ? item.gaps : null,
    size: item.size === 0 || item.size === 2 ? item.size : 1, slow: flag("slow", false),
  };
}
const NO_TEXTS: ReadingText[] = [];

// --- Speech: one sentence, or the whole text sentence by sentence with the current one marked -------------------------

function usePlayer(voice: string, slow: boolean) {
  const [playing, setPlaying] = useState<number | null>(null);
  const run = useRef(0);
  const stop = useCallback(() => {
    run.current++;
    try { window.speechSynthesis.cancel(); } catch { /* Nothing to stop. */ }
    setPlaying(null);
  }, []);
  const play = useCallback((lines: string[], start: number, all: boolean) => {
    const id = ++run.current;
    try { window.speechSynthesis.cancel(); } catch { return; }
    const next = (index: number) => {
      if (run.current !== id) return;
      if (index >= lines.length || (!all && index > start)) { setPlaying(null); return; }
      try {
        const utterance = new SpeechSynthesisUtterance(lines[index]);
        utterance.lang = voice;
        utterance.rate = slow ? 0.65 : 0.9;
        utterance.onend = () => next(index + 1);
        utterance.onerror = () => { if (run.current === id) setPlaying(null); };
        setPlaying(index);
        window.speechSynthesis.speak(utterance);
      } catch { setPlaying(null); }
    };
    next(start);
  }, [voice, slow]);
  useEffect(() => () => { run.current++; try { window.speechSynthesis.cancel(); } catch { /* Nothing to stop. */ } }, []);
  return { playing, play, stop };
}

const pad = (value: number) => String(value).padStart(2, "0");
const when = (time: number) => { const date = new Date(time); return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`; };

// Closing punctuation stays with the word before it and an opening bracket with the word after it, so a line never
// starts with 。 or ends with 「.
const CLOSING = /^[。、，,.!?！？:：;；)）」』”’》〉】…~～・·]+$/u;
const OPENING = /^[(（「『“‘《〈【]+$/u;
function wordGroups(tokens: ReadingToken[]): ReadingToken[][] {
  const groups: ReadingToken[][] = [];
  let carry: ReadingToken[] = [];
  for (const token of tokens) {
    if (OPENING.test(token.s)) carry.push(token);
    else if (CLOSING.test(token.s) && groups.length && !carry.length) groups[groups.length - 1].push(token);
    else { groups.push([...carry, token]); carry = []; }
  }
  if (carry.length) groups.push(carry);
  return groups;
}

function Token({ token, ruby, romaji }: { token: ReadingToken; ruby: boolean; romaji: boolean }) {
  return <span className={styles.token} data-p={token.p ? "" : undefined}>
    <span>{token.seg.map((part, index) => part.r && ruby ? <ruby key={index}>{part.t}<rt>{part.r}</rt></ruby> : <Fragment key={index}>{part.t}</Fragment>)}</span>
    {romaji && token.ro ? <span className={styles.ro} lang="en">{token.ro}</span> : null}
  </span>;
}

function Reader({ text, aids, setAids, voiced, onNew }: {
  text: ReadingText; aids: Aids; setAids: (next: Aids) => void; voiced: boolean; onNew: () => void;
}) {
  const exam = text.exam;
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [allShown, setAllShown] = useState(false);
  const { playing, play, stop } = usePlayer(VOICE[exam], aids.slow);
  const top = useRef<HTMLElement>(null);
  const level = findReadingLevel(text.level);
  const hasKanji = KANJI_LEVELS.includes(text.level);
  const gaps = exam === "topik" || (aids.gaps ?? (exam === "jlpt" && KANA_LEVELS.includes(text.level)));
  const ruby = exam !== "topik" && aids.reading && (exam === "hsk" || hasKanji);
  const romaji = exam === "topik" ? aids.reading : exam === "jlpt" && aids.romaji;
  // A katakana-only text is read from its hiragana, so the voice reads the particle ハ as "wa".
  const spoken = text.sentences.map(sentence => text.level === "katakana" ? toHiragana(sentence.text) : sentence.text);
  const change = (patch: Partial<Aids>) => setAids({ ...aids, ...patch });
  const toggle = (index: number) => setRevealed(current => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; });
  function again() {
    stop(); setRevealed(new Set()); setAllShown(false);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <article className={styles.reader} aria-labelledby="reading-title" ref={top} data-size={aids.size}>
    <header className={styles.readerHead}>
      <p className={styles.meta}>{EXAM_TITLE[exam]} · {level?.title} · {text.topic} · {READING_LENGTHS[text.length].label} · {when(text.createdAt)}</p>
      <h2 id="reading-title">{text.title}</h2>
    </header>
    <div className={styles.toolbar} role="toolbar" aria-label="Уншлагын туслах">
      {exam !== "jlpt" || hasKanji ? <button type="button" className={styles.toggle} aria-pressed={aids.reading} onClick={() => change({ reading: !aids.reading })}>{READING_AID[exam]}</button> : null}
      {exam === "jlpt" ? <button type="button" className={styles.toggle} aria-pressed={aids.romaji} onClick={() => change({ romaji: !aids.romaji })}>Romaji</button> : null}
      {exam !== "topik" ? <button type="button" className={styles.toggle} aria-pressed={gaps} onClick={() => change({ gaps: !gaps })}>Үг салгах</button> : null}
      <button type="button" className={styles.toggle} aria-pressed={allShown} onClick={() => { setAllShown(!allShown); setRevealed(new Set()); }}>Орчуулга</button>
      <span className={styles.sizes} role="group" aria-label="Үсгийн хэмжээ">
        {([0, 1, 2] as const).map(size => <button key={size} type="button" aria-pressed={aids.size === size} onClick={() => change({ size })} aria-label={["Жижиг үсэг", "Дунд үсэг", "Том үсэг"][size]}>
          <span style={{ fontSize: [12, 15, 18][size] }} aria-hidden="true">A</span>
        </button>)}
      </span>
      {voiced ? <span className={styles.voice}>
        {playing !== null ? <button type="button" className={styles.voiceButton} onClick={stop}><Icon name="close" size={15} />Зогсоох</button>
          : <button type="button" className={styles.voiceButton} onClick={() => play(spoken, 0, true)}><Icon name="sound" size={15} />Бүгдийг сонсох</button>}
        <button type="button" className={styles.toggle} aria-pressed={aids.slow} onClick={() => change({ slow: !aids.slow })}>Удаан</button>
      </span> : null}
    </div>
    <ol className={styles.sentences}>
      {text.sentences.map((sentence, index) => {
        const shown = allShown || revealed.has(index);
        return <li key={index} className={styles.sentence} data-playing={playing === index ? "" : undefined}>
          <span className={styles.number} aria-hidden="true">{index + 1}</span>
          <p className={`${styles.line} ${gaps ? styles.gaps : ""} ${romaji ? styles.withRo : ""}`} lang={LANG[exam]}>
            {wordGroups(sentence.tokens).map((group, at) => <Fragment key={at}>
              {/* A real space between words, so a wrapped line starts flush. */}
              {gaps && at ? " " : null}
              <span className={styles.word}>{group.map((token, part) => <Token key={part} token={token} ruby={ruby} romaji={romaji} />)}</span>
            </Fragment>)}
          </p>
          <span className={styles.lineTools}>
            {voiced ? <button type="button" className={styles.iconButton} onClick={() => play(spoken, index, false)} aria-label={`${index + 1}-р өгүүлбэрийг сонсох`} title="Сонсох"><Icon name="sound" size={16} /></button> : null}
            <button type="button" className={styles.mnButton} aria-expanded={shown} onClick={() => allShown ? setAllShown(false) : toggle(index)}>{shown ? "Нуух" : "Орчуулга"}</button>
          </span>
          {shown ? <p className={styles.mn}>{sentence.mn}</p> : null}
        </li>;
      })}
    </ol>
    <footer className={styles.readerFoot}>
      <button type="button" className={styles.ghostButton} onClick={again}><Icon name="repeat" size={15} />Дахин унших</button>
      <button type="button" className={styles.primaryButton} onClick={onNew}><Icon name="plus" size={15} />Шинэ текст</button>
      {text.spent ? <span className={styles.fine}>Энэ текст {text.spent} кредит зарцуулсан.</span> : null}
    </footer>
  </article>;
}

/** `children`: shown under the reader in the same column, the mocks' reading with questions (2026-11-19). */
export function LanguageReading({ userId, exam, children }: { userId: string; exam: LanguageExam; children?: ReactNode }) {
  const levels = levelsFor(exam);
  const [texts, saveTexts] = useStored(`education-language-reading-v1:${userId}`, readStoredTexts, NO_TEXTS);
  const [aids, setAids] = useStored(`education-language-reading-aids-v1:${exam}`, readAids, DEFAULT_AIDS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [level, setLevel] = useState<ReadingLevelId>(levels[0].id);
  const [topic, setTopic] = useState<ReadingTopicId>("any");
  const [custom, setCustom] = useState("");
  const [length, setLength] = useState<ReadingLength>("short");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { apply } = useCredits();
  const { canSpeak, any } = useVoices();
  const setup = useRef<HTMLElement>(null);
  const generateButton = useRef<HTMLButtonElement>(null);
  const mine = texts.filter(text => text.exam === exam);
  const current = mine.find(text => text.id === openId) ?? mine[0] ?? null;
  const price = languageReadingCredits(length);
  const voiced = canSpeak(VOICE[exam]);

  async function generate() {
    if (pending) return;
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, level, length, topic, custom: custom.trim() }), signal: AbortSignal.timeout(175_000),
      });
      const data = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Текст үүсгэж чадсангүй. Дахин оролдоно уу.");
      apply(data);
      const [text] = readStoredTexts([data.reading]);
      if (!text) throw new Error("AI текст бүрэн ирсэнгүй. Дахин оролдоно уу.");
      const receipt = readReceipt(data);
      const saved = receipt ? { ...text, spent: receipt.spent } : text;
      saveTexts(keepRecent([saved, ...texts]));
      setOpenId(saved.id);
      setNotice(receipt ? `Текст бэлэн боллоо. ${receipt.spent} кредит зарцууллаа.` : "Текст бэлэн боллоо.");
      requestAnimationFrame(() => document.getElementById("reading-title")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Текст үүсгэхэд хэт удлаа. Дахин оролдоно уу.");
    } finally { setPending(false); }
  }
  function remove(id: string) {
    saveTexts(texts.filter(text => text.id !== id));
    if (openId === id) setOpenId(null);
  }
  function startNew() {
    setup.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    generateButton.current?.focus({ preventScroll: true });
  }

  const chosen = findReadingLevel(level);
  return <div className={`wsp-page ${styles.page}`}>
    <ProcessingOverlay open={pending} title="Унших текст бэлдэж байна…" detail="AI текст бичиж, үсэг, уншлагыг нь шалгаж байна. 10–60 секунд орно." />
    <Link className={styles.back} href={"/workspace/workshop?exam=" + exam}>← Workshop</Link>
    <header className={styles.head}>
      <p className={styles.eyebrow}>{EXAM_TITLE[exam]} · Workshop</p>
      <h1>Унших дасгал</h1>
      <p className={styles.lede}>AI-ийн бичсэн богино текстийг уншиж, үсэг, {exam === "jlpt" ? "ханзаа" : exam === "hsk" ? "ханз, pinyin-аа" : "үгээ"} таньж дасгална. Доор нь mock-уудын уншлага асуулттайгаа.</p>
    </header>
    <div className={styles.layout} data-empty={current ? undefined : ""}>
      <div className={styles.main}>
        {current ? <Reader key={current.id} text={current} aids={aids} setAids={setAids} voiced={voiced} onNew={startNew} />
          : <section className={styles.empty} aria-label="Текст алга">
            <h2>Эхний текстээ үүсгээрэй</h2>
            <p>Түвшин, сэдэв, уртаа сонгоод «Текст үүсгэх» дарна уу. Текст {languageReadingCredits("short")}–{languageReadingCredits("long")} кредит.</p>
          </section>}
        {any && !voiced ? <p className={styles.fine}>Энэ хөтөчид {exam === "jlpt" ? "япон" : exam === "hsk" ? "хятад" : "солонгос"} хэлний дуу хоолой алга тул сонсох товч харагдахгүй.</p> : null}
      </div>
      <aside className={styles.aside}>
        <section className={styles.setup} aria-labelledby="reading-setup-heading" ref={setup}>
          <h2 id="reading-setup-heading">Шинэ текст</h2>
          <div className={styles.field}>
            <span className={styles.label} id="reading-level-label">Түвшин</span>
            <div className={styles.chips} role="group" aria-labelledby="reading-level-label">
              {levels.map(item => <button key={item.id} type="button" aria-pressed={level === item.id} onClick={() => setLevel(item.id)}>{item.title}</button>)}
            </div>
            {chosen ? <p className={styles.note}>{chosen.note}</p> : null}
          </div>
          <div className={styles.field}>
            <span className={styles.label} id="reading-topic-label">Сэдэв</span>
            <div className={styles.chips} role="group" aria-labelledby="reading-topic-label">
              {READING_TOPICS.map(item => <button key={item.id} type="button" aria-pressed={!custom.trim() && topic === item.id} onClick={() => { setTopic(item.id); setCustom(""); }}>{item.label}</button>)}
            </div>
            <label className={styles.custom}><span>Өөр сэдэв (заавал биш)</span>
              <input value={custom} maxLength={READING_LIMITS.customTopic} onChange={event => setCustom(event.target.value)} placeholder="ж: миний муур" /></label>
          </div>
          <div className={styles.field}>
            <span className={styles.label} id="reading-length-label">Урт</span>
            <div className={styles.lengths} role="group" aria-labelledby="reading-length-label">
              {READING_LENGTH_IDS.map(id => <button key={id} type="button" aria-pressed={length === id} onClick={() => setLength(id)}>
                {READING_LENGTHS[id].label}<small>{READING_LENGTHS[id].min}–{READING_LENGTHS[id].max} өгүүлбэр · {languageReadingCredits(id)} кр</small>
              </button>)}
            </div>
          </div>
          <button type="button" ref={generateButton} className={styles.generate} onClick={generate} disabled={pending}>
            {pending ? "Бэлдэж байна…" : "Текст үүсгэх"} <CreditCost action="language-reading" cost={price} compact />
          </button>
          <CreditCost action="language-reading" cost={price} />
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        </section>
        {mine.length ? <section className={styles.history} aria-labelledby="reading-history-heading">
          <h2 id="reading-history-heading">Сүүлийн текстүүд</h2>
          <ul>{mine.map(text => <li key={text.id}>
            <button type="button" className={styles.historyOpen} aria-current={text.id === current?.id ? "true" : undefined} onClick={() => setOpenId(text.id)}>
              <strong>{text.title}</strong><small>{findReadingLevel(text.level)?.title} · {when(text.createdAt)}</small>
            </button>
            <button type="button" className={styles.historyRemove} onClick={() => remove(text.id)} aria-label={`«${text.title}» устгах`} title="Устгах"><Icon name="trash" size={15} /></button>
          </li>)}</ul>
          <p className={styles.fine}>Сүүлийн {READING_LIMITS.kept} текст зөвхөн энэ хөтөч дээр хадгалагдана.</p>
        </section> : null}
        <p className={styles.fine}>Текстийг AI бичдэг, багш хянаагүй: уншлага, орчуулгад алдаа байж болно.</p>
      </aside>
    </div>
    {children}
  </div>;
}
