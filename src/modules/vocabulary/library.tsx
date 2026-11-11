"use client";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/modules/workspace/icons";
import { DECK_COLORS, VOCABULARY_LIMITS, type DeckColor, type VocabularyDeck, type VocabularyWord } from "./contracts";
import { isDue, isWeak, studyStatus, STUDY_BOX_MAX, type StudyStatus } from "./study";
import { speechFor, type QuizScope } from "./quiz";
import { speak } from "./speech";
import { readStored, writeStored } from "./api";
import { Glyph } from "./glyphs";
import styles from "./vocabulary.module.css";

export const STATUS_LABEL: Record<StudyStatus, string> = { new: "Шинэ", learning: "Сурч буй", familiar: "Танил", mastered: "Цээжилсэн" };
export const DECK_COLOR_LABEL: Record<DeckColor, string> = { blue: "Цэнхэр", violet: "Ягаан хөх", green: "Ногоон", amber: "Шар", rose: "Улаан", slate: "Саарал" };

/** "all", "starred", "none" (words in no deck) or a deck id. */
export type DeckFilter = string;
type StatusFilter = "all" | "due" | "weak" | StudyStatus;
type SortKey = "newest" | "oldest" | "az" | "weakest" | "due";
type View = "list" | "cards";
export type WordEdit = { term: string; translation: string; example: string; deckId: string | null };
/** What the list can ask the quiz to open with. */
export type QuizLaunch = { scope?: QuizScope; deckId?: string | null; wordIds?: string[]; start?: boolean };

/** Every action returns an error message for the student, or null when it worked. */
export type LibraryActions = {
  saveWord: (id: string, fields: WordEdit) => Promise<string | null>;
  deleteWord: (word: VocabularyWord) => Promise<string | null>;
  star: (ids: string[], starred: boolean) => Promise<string | null>;
  move: (ids: string[], deckId: string | null) => Promise<string | null>;
  remove: (ids: string[]) => Promise<string | null>;
  reset: (ids: string[]) => Promise<string | null>;
  createDeck: (name: string) => Promise<string | null>;
  updateDeck: (id: string, fields: { name?: string; color?: DeckColor }) => Promise<string | null>;
  deleteDeck: (deck: VocabularyDeck, withWords: boolean) => Promise<string | null>;
  quiz: (launch: QuizLaunch) => void;
};

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Бүгд" }, { id: "due", label: "Давтах цаг болсон" }, { id: "new", label: STATUS_LABEL.new },
  { id: "learning", label: STATUS_LABEL.learning }, { id: "familiar", label: STATUS_LABEL.familiar },
  { id: "mastered", label: STATUS_LABEL.mastered }, { id: "weak", label: "Сул үгс" },
];
const SORTS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Сүүлд нэмсэн" }, { id: "oldest", label: "Эхэлж нэмсэн" }, { id: "az", label: "Үсгийн дарааллаар" },
  { id: "weakest", label: "Сул нь эхэндээ" }, { id: "due", label: "Давтах ээлжээр" },
];
const VIEW_KEY = "education-vocabulary-view-v1";
const BUILT_IN = new Set(["all", "starred", "none"]);
const dayMonth = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", month: "numeric", day: "numeric" });

/** "11-р сарын 9" in Ulaanbaatar time, without relying on a locale that may fall back to English. */
function shortDate(iso: string) {
  const parts = dayMonth.formatToParts(new Date(iso));
  const month = Number(parts.find(part => part.type === "month")?.value ?? 0);
  const day = Number(parts.find(part => part.type === "day")?.value ?? 0);
  return month && day ? `${month}-р сарын ${day}` : "";
}
const time = (iso: string | null) => iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY;

function matches(word: VocabularyWord, status: StatusFilter, now: number) {
  if (status === "all") return true;
  if (status === "due") return isDue(word, now);
  if (status === "weak") return isWeak(word);
  return studyStatus(word) === status;
}

function sortWords(words: VocabularyWord[], sort: SortKey, now: number) {
  const copy = [...words];
  if (sort === "newest") return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "oldest") return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (sort === "az") return copy.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" }));
  if (sort === "weakest") return copy.sort((a, b) => a.box - b.box || b.wrong - a.wrong || a.term.localeCompare(b.term));
  // Overdue words first (most overdue on top), then new words, then the rest by their date.
  const rank = (word: VocabularyWord) => isDue(word, now) ? 0 : word.box === 0 ? 1 : 2;
  return copy.sort((a, b) => rank(a) - rank(b) || time(a.dueAt) - time(b.dueAt));
}

export function Library({ words, decks, now, canSpeak, actions, onAdd, onImport }: {
  words: VocabularyWord[]; decks: VocabularyDeck[]; now: number; canSpeak: (lang: string) => boolean;
  actions: LibraryActions; onAdd: () => void; onImport: () => void;
}) {
  const [deck, setDeck] = useState<DeckFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deckName, setDeckName] = useState("");

  // The list or card preference is a per-browser convenience; the page renders the same without it.
  useEffect(() => {
    const stored = readStored<View>(VIEW_KEY);
    const timer = setTimeout(() => { if (stored === "cards" || stored === "list") setView(stored); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const activeDeck = decks.find(item => item.id === deck) ?? null;
  // A deck deleted while it was open falls back to every word.
  const scope: DeckFilter = BUILT_IN.has(deck) || activeDeck ? deck : "all";
  const deckById = useMemo(() => new Map(decks.map(item => [item.id, item])), [decks]);
  const counts = useMemo(() => {
    const perDeck = new Map<string, number>();
    let starred = 0, loose = 0;
    for (const word of words) {
      if (word.starred) starred++;
      if (word.deckId && deckById.has(word.deckId)) perDeck.set(word.deckId, (perDeck.get(word.deckId) ?? 0) + 1); else loose++;
    }
    return { perDeck, starred, loose };
  }, [words, deckById]);

  const inScope = useMemo(() => words.filter(word =>
    scope === "all" ? true : scope === "starred" ? word.starred : scope === "none" ? !word.deckId || !deckById.has(word.deckId) : word.deckId === scope,
  ), [words, scope, deckById]);
  const statusCounts = useMemo(() => Object.fromEntries(STATUS_FILTERS.map(item => [item.id, inScope.filter(word => matches(word, item.id, now)).length])) as Record<StatusFilter, number>, [inScope, now]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const list = inScope.filter(word => matches(word, status, now)
      && (!needle || [word.term, word.translation, word.example ?? "", word.sourceName ?? ""].some(value => value.toLocaleLowerCase().includes(needle))));
    return sortWords(list, sort, now);
  }, [inScope, status, query, sort, now]);

  const size = VOCABULARY_LIMITS.pageSize;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages - 1);
  const shown = filtered.slice(current * size, current * size + size);
  const chosen = useMemo(() => words.filter(word => selected.has(word.id)), [words, selected]);
  const pageChosen = shown.length > 0 && shown.every(word => selected.has(word.id));
  const narrowed = status !== "all" || query.trim() !== "";

  function reframe(change: () => void) {
    change();
    setPage(0);
    setSelected(new Set());
    setError("");
  }
  function toggle(id: string) {
    setSelected(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function togglePage() {
    setSelected(previous => {
      const next = new Set(previous);
      for (const word of shown) { if (pageChosen) next.delete(word.id); else next.add(word.id); }
      return next;
    });
  }
  async function bulk(run: (ids: string[]) => Promise<string | null>, keep = false) {
    if (busy || !chosen.length) return;
    setBusy(true); setError("");
    const problem = await run(chosen.map(word => word.id));
    setBusy(false);
    if (problem) setError(problem); else if (!keep) setSelected(new Set());
  }
  async function createDeck(event: FormEvent) {
    event.preventDefault();
    const name = deckName.trim();
    if (!name || busy) return;
    setBusy(true); setError("");
    const problem = await actions.createDeck(name);
    setBusy(false);
    if (problem) { setError(problem); return; }
    setDeckName(""); setCreating(false);
  }
  function changeView(next: View) {
    setView(next);
    writeStored(VIEW_KEY, next);
  }

  const railButton = (id: DeckFilter, label: string, count: number, mark: ReactNode) => <button
    key={id} type="button" data-deck={id} className={scope === id ? styles.railActive : undefined}
    aria-current={scope === id ? "true" : undefined} onClick={() => reframe(() => setDeck(id))}>
    {mark}<span className={styles.railName}>{label}</span><span className={styles.railCount}>{count}</span>
  </button>;

  return <section className={styles.library} aria-labelledby="voc-bank-heading">
    <div className={styles.libraryHead}>
      <div>
        <h2 id="voc-bank-heading">Миний үгс</h2>
        <p>{narrowed || scope !== "all" ? `${filtered.length} / ${words.length} үг` : `${words.length} үг`}</p>
      </div>
      <div className={styles.libraryActions}>
        <button type="button" className={styles.ghost} onClick={onImport}><Glyph name="upload" size={16} />Файлаас оруулах</button>
        <button type="button" className={styles.primary} onClick={onAdd}><Icon name="plus" size={16} />Үг нэмэх</button>
      </div>
    </div>

    <div className={styles.libraryGrid}>
      <nav className={styles.rail} aria-label="Багцууд">
        <div className={styles.railGroup}>
          {railButton("all", "Бүх үг", words.length, <Glyph name="layers" size={16} />)}
          {railButton("starred", "Онцолсон", counts.starred, <Glyph name="star" size={16} />)}
          {railButton("none", "Багцгүй", counts.loose, <Icon name="tag" size={16} />)}
        </div>
        <p className={styles.railLabel}>Багцууд</p>
        <div className={styles.railGroup}>
          {decks.map(item => railButton(item.id, item.name, counts.perDeck.get(item.id) ?? 0, <i className={styles.deckDot} data-color={item.color} aria-hidden="true" />))}
          {creating ? <form className={styles.railForm} onSubmit={createDeck}>
            <input value={deckName} onChange={event => setDeckName(event.target.value)} maxLength={VOCABULARY_LIMITS.deckName} placeholder="Багцын нэр" aria-label="Шинэ багцын нэр" autoFocus disabled={busy} />
            <div>
              <button type="submit" className={styles.primary} disabled={busy || !deckName.trim()}>Үүсгэх</button>
              <button type="button" className={styles.ghost} onClick={() => { setCreating(false); setDeckName(""); }} disabled={busy}>Болих</button>
            </div>
          </form> : decks.length < VOCABULARY_LIMITS.decks ? <button type="button" className={styles.railNew} onClick={() => { setCreating(true); setError(""); }}><Icon name="plus" size={15} />Шинэ багц</button> : null}
        </div>
      </nav>

      <div className={styles.pane}>
        {activeDeck ? <DeckHead key={activeDeck.id} deck={activeDeck} words={inScope} actions={actions} onGone={() => reframe(() => setDeck("all"))} /> : null}

        <div className={styles.toolbar}>
          <label className={styles.search}><span className="sr-only">Үгсээс хайх</span><Icon name="search" size={16} />
            <input type="search" value={query} onChange={event => reframe(() => setQuery(event.target.value))} placeholder="Үг, орчуулга, эх сурвалжаар хайх" />
          </label>
          <label className={styles.select}><span className="sr-only">Эрэмбэ</span>
            <select value={sort} onChange={event => reframe(() => setSort(event.target.value as SortKey))} aria-label="Эрэмбэ">{SORTS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          </label>
          <div className={styles.viewToggle} role="group" aria-label="Харагдац">
            <button type="button" aria-pressed={view === "list"} onClick={() => changeView("list")} title="Жагсаалт" aria-label="Жагсаалтаар харах"><Glyph name="list" size={16} /></button>
            <button type="button" aria-pressed={view === "cards"} onClick={() => changeView("cards")} title="Карт" aria-label="Картаар харах"><Glyph name="grid" size={16} /></button>
          </div>
        </div>
        <div className={styles.filters} role="group" aria-label="Түвшнээр шүүх">
          {STATUS_FILTERS.map(item => <button key={item.id} type="button" data-status={item.id} aria-pressed={status === item.id} disabled={item.id !== "all" && !statusCounts[item.id] && status !== item.id}
            onClick={() => reframe(() => setStatus(item.id))}>{item.label}<span>{statusCounts[item.id]}</span></button>)}
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        {chosen.length ? <div className={styles.bulk} data-bulk role="region" aria-label="Сонгосон үгсийн үйлдэл">
          <strong>{chosen.length} үг сонгосон</strong>
          {chosen.length < filtered.length ? <button type="button" className={styles.link} onClick={() => setSelected(new Set(filtered.slice(0, VOCABULARY_LIMITS.bulkIds).map(word => word.id)))} disabled={busy}>
            Бүх {Math.min(filtered.length, VOCABULARY_LIMITS.bulkIds)} үгийг сонгох
          </button> : null}
          <span className={styles.bulkActions}>
            <label className={styles.select}><span className="sr-only">Багц руу зөөх</span>
              <select value="" aria-label="Багц руу зөөх" disabled={busy} onChange={event => { const value = event.target.value; if (value) void bulk(ids => actions.move(ids, value === "none" ? null : value)); }}>
                <option value="">Багц руу зөөх…</option>
                {decks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                <option value="none">Багцаас гаргах</option>
              </select>
            </label>
            <button type="button" className={styles.chipButton} onClick={() => void bulk(ids => actions.star(ids, !chosen.every(word => word.starred)), true)} disabled={busy}>
              <Glyph name="star" size={15} />{chosen.every(word => word.starred) ? "Онцлохоо болих" : "Онцлох"}
            </button>
            <button type="button" className={styles.chipButton} onClick={() => actions.quiz({ wordIds: chosen.map(word => word.id) })} disabled={busy}><Icon name="bolt" size={15} />Quiz</button>
            <button type="button" className={styles.chipButton} onClick={() => { if (window.confirm(`${chosen.length} үгийн давталтын явцыг арилгах уу?`)) void bulk(actions.reset); }} disabled={busy}><Glyph name="reset" size={15} />Явц арилгах</button>
            <button type="button" className={`${styles.chipButton} ${styles.chipDanger}`} onClick={() => { if (window.confirm(`${chosen.length} үгийг устгах уу? Буцаах боломжгүй.`)) void bulk(actions.remove); }} disabled={busy}><Icon name="trash" size={15} />Устгах</button>
            <button type="button" className={styles.rowAction} onClick={() => setSelected(new Set())} aria-label="Сонголтыг цуцлах" title="Сонголтыг цуцлах" disabled={busy}><Icon name="close" size={16} /></button>
          </span>
        </div> : null}

        {!words.length ? <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true"><Icon name="book" size={30} /></span>
          <h3>Үгсийн сан хоосон байна</h3>
          <p>Эхний үгээ гараар нэмэх эсвэл хичээлийн файл, хуудасны зургаас AI-аар түүж аваарай.</p>
          <div className={styles.emptyActions}>
            <button type="button" className={styles.primary} onClick={onAdd}><Icon name="plus" size={16} />Үг нэмэх</button>
            <button type="button" className={styles.ghost} onClick={onImport}><Glyph name="upload" size={16} />Файлаас оруулах</button>
          </div>
        </div> : !filtered.length ? <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true"><Icon name="search" size={28} /></span>
          <h3>{narrowed ? "Шүүлтэд тохирох үг алга" : "Энд үг алга"}</h3>
          <p>{narrowed ? "Өөр үгээр хайх эсвэл шүүлтийг цэвэрлээрэй." : scope === "starred" ? "Үгийн одыг дарж онцлоорой." : "Үгээ сонгоод “Багц руу зөөх” цэсээр энд оруулна."}</p>
          {narrowed ? <button type="button" className={styles.ghost} onClick={() => reframe(() => { setQuery(""); setStatus("all"); })}>Шүүлт цэвэрлэх</button> : null}
        </div> : <>
          <div className={styles.listHead}>
            <label className={styles.check}><input type="checkbox" checked={pageChosen} onChange={togglePage} aria-label="Энэ хуудасны бүх үгийг сонгох" /><span>Энэ хуудсыг сонгох</span></label>
            <span>{current * size + 1}–{current * size + shown.length} / {filtered.length}</span>
          </div>
          <ul className={view === "cards" ? styles.cards : styles.rows}>
            {shown.map(word => <WordRow key={word.id} word={word} deck={word.deckId ? deckById.get(word.deckId) ?? null : null} decks={decks} now={now}
              showDeck={scope === "all" || scope === "starred"} selected={selected.has(word.id)} onToggle={() => toggle(word.id)} canSpeak={canSpeak} actions={actions} />)}
          </ul>
          {pages > 1 ? <nav className={styles.pager} aria-label="Хуудаслалт">
            <button type="button" className={styles.ghost} onClick={() => setPage(current - 1)} disabled={current === 0}><Icon name="back" size={15} />Өмнөх</button>
            <span>{current + 1} / {pages}</span>
            <button type="button" className={styles.ghost} onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>Дараах<Icon name="arrow" size={15} /></button>
          </nav> : null}
        </>}
      </div>
    </div>
  </section>;
}

function DeckHead({ deck, words, actions, onGone }: { deck: VocabularyDeck; words: VocabularyWord[]; actions: LibraryActions; onGone: () => void }) {
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [name, setName] = useState(deck.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mastered = words.filter(word => word.box >= STUDY_BOX_MAX).length;

  async function run(work: () => Promise<string | null>, done?: () => void) {
    if (busy) return;
    setBusy(true); setError("");
    const problem = await work();
    setBusy(false);
    if (problem) setError(problem); else { setMode("view"); done?.(); }
  }
  function rename(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    if (!next || next === deck.name) { setMode("view"); return; }
    void run(() => actions.updateDeck(deck.id, { name: next }));
  }

  return <div className={styles.deckHead} data-color={deck.color}>
    <div className={styles.deckTitle}>
      <i className={styles.deckDot} data-color={deck.color} aria-hidden="true" />
      {mode === "rename" ? <form onSubmit={rename} className={styles.deckRename}>
        <input value={name} onChange={event => setName(event.target.value)} maxLength={VOCABULARY_LIMITS.deckName} aria-label="Багцын нэр" autoFocus disabled={busy} />
        <button type="submit" className={styles.primary} disabled={busy || !name.trim()}>Хадгалах</button>
        <button type="button" className={styles.ghost} onClick={() => { setMode("view"); setName(deck.name); }} disabled={busy}>Болих</button>
      </form> : <>
        <h3>{deck.name}</h3>
        <span>{words.length} үг · {mastered} цээжилсэн</span>
      </>}
    </div>
    {mode === "view" ? <div className={styles.deckTools}>
      <button type="button" className={styles.chipButton} onClick={() => actions.quiz({ deckId: deck.id })} disabled={!words.length}><Icon name="bolt" size={15} />Энэ багцаар quiz</button>
      <span className={styles.swatches} role="group" aria-label="Багцын өнгө">
        {DECK_COLORS.map(color => <button key={color} type="button" data-color={color} aria-pressed={deck.color === color} aria-label={DECK_COLOR_LABEL[color]} title={DECK_COLOR_LABEL[color]}
          onClick={() => { if (deck.color !== color) void run(() => actions.updateDeck(deck.id, { color })); }} disabled={busy} />)}
      </span>
      <button type="button" className={styles.rowAction} onClick={() => { setName(deck.name); setMode("rename"); }} aria-label="Багцын нэр солих" title="Нэр солих" disabled={busy}><Icon name="pen" size={16} /></button>
      <button type="button" className={`${styles.rowAction} ${styles.deleteAction}`} onClick={() => setMode("delete")} aria-label="Багцыг устгах" title="Багцыг устгах" disabled={busy}><Icon name="trash" size={16} /></button>
    </div> : null}
    {mode === "delete" ? <div className={styles.deckConfirm} role="alertdialog" aria-label="Багцыг устгах">
      <p>“{deck.name}” багцыг устгах уу?</p>
      <button type="button" className={styles.ghost} onClick={() => void run(() => actions.deleteDeck(deck, false), onGone)} disabled={busy}>Багцыг устгаад үгсийг үлдээх</button>
      {words.length ? <button type="button" className={`${styles.ghost} ${styles.dangerGhost}`} onClick={() => void run(() => actions.deleteDeck(deck, true), onGone)} disabled={busy}>Багц ба {words.length} үгийг устгах</button> : null}
      <button type="button" className={styles.link} onClick={() => setMode("view")} disabled={busy}>Болих</button>
    </div> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}

/** Five bars for the study box, with the word's standing beside them. */
export function Level({ word, now }: { word: Pick<VocabularyWord, "box" | "correct" | "wrong" | "dueAt" | "reviewedAt">; now: number }) {
  const status = studyStatus(word), due = isDue(word, now);
  const label = due ? "Давтах цаг болсон" : STATUS_LABEL[status];
  return <span className={styles.level} data-status={status} data-due={due ? "true" : undefined} title={`${label} · ${word.correct} зөв, ${word.wrong} буруу`}>
    <span className={styles.levelBars} aria-hidden="true">{Array.from({ length: STUDY_BOX_MAX }, (_, index) => <i key={index} data-on={index < word.box ? "true" : undefined} />)}</span>
    <span className={styles.levelText}>{due ? "Давтах" : STATUS_LABEL[status]}</span>
  </span>;
}

function WordRow({ word, deck, decks, now, showDeck, selected, onToggle, canSpeak, actions }: {
  word: VocabularyWord; deck: VocabularyDeck | null; decks: VocabularyDeck[]; now: number; showDeck: boolean;
  selected: boolean; onToggle: () => void; canSpeak: (lang: string) => boolean; actions: LibraryActions;
}) {
  const [editing, setEditing] = useState(false);
  const [term, setTerm] = useState(word.term);
  const [translation, setTranslation] = useState(word.translation);
  const [example, setExample] = useState(word.example ?? "");
  const [deckId, setDeckId] = useState(word.deckId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const speech = speechFor(word.term);
  const voiced = speech && canSpeak(speech.lang) ? speech : null;

  function begin() {
    setTerm(word.term); setTranslation(word.translation); setExample(word.example ?? ""); setDeckId(deck?.id ?? "");
    setError(""); setEditing(true);
  }
  async function run(work: () => Promise<string | null>, done?: () => void) {
    if (busy) return;
    setBusy(true); setError("");
    const problem = await work();
    setBusy(false);
    if (problem) setError(problem); else done?.();
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!term.trim() || !translation.trim()) return;
    void run(() => actions.saveWord(word.id, { term: term.trim(), translation: translation.trim(), example: example.trim(), deckId: deckId || null }), () => setEditing(false));
  }

  if (editing) return <li className={`${styles.word} ${styles.wordEditing}`} data-term={word.term}>
    <form className={styles.editForm} onSubmit={save}>
      <div className={styles.editGrid}>
        <label className={styles.field}><span>Үг</span><input value={term} onChange={event => setTerm(event.target.value)} maxLength={VOCABULARY_LIMITS.term} required disabled={busy} autoFocus /></label>
        <label className={styles.field}><span>Орчуулга</span><input value={translation} onChange={event => setTranslation(event.target.value)} maxLength={VOCABULARY_LIMITS.translation} required disabled={busy} /></label>
        <label className={styles.field}><span>Жишээ өгүүлбэр <em>сонголтоор</em></span><input value={example} onChange={event => setExample(event.target.value)} maxLength={VOCABULARY_LIMITS.example} disabled={busy} /></label>
        <label className={styles.field}><span>Багц</span>
          <select value={deckId} onChange={event => setDeckId(event.target.value)} disabled={busy}><option value="">Багцгүй</option>{decks.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        </label>
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.editFoot}>
        <button type="button" className={styles.ghost} onClick={() => setEditing(false)} disabled={busy}>Цуцлах</button>
        <button type="submit" className={styles.primary} disabled={busy || !term.trim() || !translation.trim()}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      </div>
    </form>
  </li>;

  return <li className={`${styles.word} ${selected ? styles.wordSelected : ""}`} data-term={word.term} data-starred={word.starred ? "true" : undefined}>
    <label className={styles.check}><input type="checkbox" checked={selected} onChange={onToggle} aria-label={`${word.term} үгийг сонгох`} /></label>
    <div className={styles.wordTerm}>
      <strong>{word.term}</strong>
      {voiced ? <button type="button" className={styles.speak} onClick={() => speak(voiced.text, voiced.lang)} aria-label={`${word.term} үгийг сонсох`} title="Сонсох"><Icon name="sound" size={15} /></button> : null}
    </div>
    <div className={styles.wordMeaning}>
      <p className={styles.translation}>{word.translation}</p>
      {word.example ? <p className={styles.example}>“{word.example}”</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
    <div className={styles.wordMeta}>
      <Level word={word} now={now} />
      {showDeck && deck ? <span className={styles.deckChip} data-color={deck.color} title={deck.name}>{deck.name}</span>
        : word.sourceName ? <span className={styles.sourceChip} title={`${word.sourceName} · ${shortDate(word.createdAt)}`}>{word.sourceName}</span>
          : <span className={styles.date}>{shortDate(word.createdAt)}</span>}
    </div>
    <div className={styles.wordActions}>
      <button type="button" className={`${styles.rowAction} ${word.starred ? styles.starOn : ""}`} onClick={() => void run(() => actions.star([word.id], !word.starred))} aria-pressed={word.starred}
        aria-label={word.starred ? `${word.term} үгийг онцлохоо болих` : `${word.term} үгийг онцлох`} title={word.starred ? "Онцлохоо болих" : "Онцлох"} disabled={busy}><Glyph name="star" size={17} filled={word.starred} /></button>
      <button type="button" className={styles.rowAction} onClick={begin} aria-label={`${word.term} үгийг засах`} title="Засах" disabled={busy}><Icon name="pen" size={17} /></button>
      <button type="button" className={`${styles.rowAction} ${styles.deleteAction}`} onClick={() => void run(() => actions.deleteWord(word))} aria-label={`${word.term} үгийг устгах`} title="Устгах" disabled={busy}><Icon name="trash" size={17} /></button>
    </div>
  </li>;
}
