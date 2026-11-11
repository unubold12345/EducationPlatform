"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import {
  bankFullMessage, VOCABULARY_LIMITS, vocabularyUpgrade,
  type DeckColor, type StudyUpdate, type VocabularyDeck, type VocabularyWord,
} from "./contracts";
import { isDue, reviewedToday, studyStatus } from "./study";
import { QUIZ_MIN_WORDS } from "./quiz";
import { failure, readStored, request, sendJson, VOCABULARY_API, type Notice } from "./api";
import { useVoices } from "./speech";
import { Library, type LibraryActions, type QuizLaunch, type WordEdit } from "./library";
import { ImportPanel, scanKey, type SavedImport } from "./import-panel";
import { Quiz } from "./quiz-view";
import styles from "./vocabulary.module.css";

const UPGRADE = vocabularyUpgrade();
const number = (value: number) => value.toLocaleString("en-US");

export function Vocabulary({ userId, initialWords, initialDecks, limit, now: loadedAt }: {
  userId: string; initialWords: VocabularyWord[]; initialDecks: VocabularyDeck[]; limit: number; now: number;
}) {
  const [words, setWords] = useState(initialWords);
  const [decks, setDecks] = useState(initialDecks);
  const [now, setNow] = useState(loadedAt);
  const [panel, setPanel] = useState<null | "add" | "import">(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [quiz, setQuiz] = useState<QuizLaunch | null>(null);
  const { canSpeak } = useVoices();
  const panelArea = useRef<HTMLDivElement>(null);

  // A file scan that was not saved yet reopens its review list.
  useEffect(() => {
    const waiting = readStored<unknown>(scanKey(userId));
    const timer = setTimeout(() => { if (waiting) setPanel("import"); }, 0);
    return () => clearTimeout(timer);
  }, [userId]);
  useEffect(() => {
    if (panel) panelArea.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [panel]);

  const stats = useMemo(() => {
    const tally = { due: 0, fresh: 0, learning: 0, familiar: 0, mastered: 0, today: 0 };
    for (const word of words) {
      const status = studyStatus(word);
      if (status === "new") tally.fresh++; else tally[status]++;
      if (isDue(word, now)) tally.due++;
      if (reviewedToday(word, now)) tally.today++;
    }
    return tally;
  }, [words, now]);
  // The bank size comes from the server (free or the student's plan); the server enforces it again.
  const room = Math.max(0, limit - words.length);
  const full = room === 0;
  const canQuiz = words.length >= QUIZ_MIN_WORDS;
  const share = (count: number) => words.length ? (count / words.length) * 100 + "%" : "0%";

  const ok = (text: string) => setNotice({ tone: "ok", text });
  function toggle(next: "add" | "import") {
    setNotice(null);
    setPanel(current => current === next ? null : next);
  }
  function openQuiz(launch: QuizLaunch) {
    setNotice(null);
    setQuiz(launch);
  }
  function applyStudy(updates: StudyUpdate[]) {
    const byId = new Map(updates.map(item => [item.id, item]));
    setWords(current => current.map(word => byId.has(word.id) ? { ...word, ...byId.get(word.id)! } : word));
  }
  /** Run one bulk change on the server, then mirror it in the list. Returns a message on failure. */
  async function bulk(body: Record<string, unknown>, mirror: () => void, done: (changed: number) => string) {
    try {
      const data = await sendJson<{ changed: number }>(VOCABULARY_API + "/words", body);
      mirror();
      ok(done(data.changed));
      return null;
    } catch (reason) {
      return failure(reason, "Үйлдлийг гүйцэтгэж чадсангүй. Дахин оролдоно уу.");
    }
  }

  const actions: LibraryActions = {
    async saveWord(id: string, fields: WordEdit) {
      try {
        const data = await sendJson<{ word: VocabularyWord }>(`${VOCABULARY_API}/words/${encodeURIComponent(id)}`, fields, "PATCH");
        setWords(current => current.map(word => word.id === id ? data.word : word));
        ok(`"${data.word.term}" шинэчлэгдлээ.`);
        return null;
      } catch (reason) {
        return failure(reason, "Үгийг шинэчилж чадсангүй. Дахин оролдоно уу.");
      }
    },
    async deleteWord(word: VocabularyWord) {
      if (!window.confirm(`"${word.term}" үгийг устгах уу? Буцаах боломжгүй.`)) return null;
      try {
        await request<{ ok: true }>(`${VOCABULARY_API}/words/${encodeURIComponent(word.id)}`, { method: "DELETE" });
        setWords(current => current.filter(item => item.id !== word.id));
        ok(`"${word.term}" устгагдлаа.`);
        return null;
      } catch (reason) {
        return failure(reason, "Үгийг устгаж чадсангүй. Дахин оролдоно уу.");
      }
    },
    star(ids: string[], starred: boolean) {
      const set = new Set(ids);
      return bulk({ action: "star", ids, starred }, () => setWords(current => current.map(word => set.has(word.id) ? { ...word, starred } : word)),
        changed => starred ? `${changed} үгийг онцоллоо.` : `${changed} үгийг онцлохоо болилоо.`);
    },
    move(ids: string[], deckId: string | null) {
      const set = new Set(ids), name = decks.find(deck => deck.id === deckId)?.name;
      return bulk({ action: "move", ids, deckId }, () => setWords(current => current.map(word => set.has(word.id) ? { ...word, deckId } : word)),
        changed => name ? `${changed} үгийг “${name}” багц руу зөөлөө.` : `${changed} үгийг багцаас гаргалаа.`);
    },
    remove(ids: string[]) {
      const set = new Set(ids);
      return bulk({ action: "delete", ids }, () => setWords(current => current.filter(word => !set.has(word.id))), changed => `${changed} үг устгагдлаа.`);
    },
    reset(ids: string[]) {
      const set = new Set(ids);
      return bulk({ action: "reset", ids }, () => setWords(current => current.map(word => set.has(word.id) ? { ...word, box: 0, correct: 0, wrong: 0, reviewedAt: null, dueAt: null } : word)),
        changed => `${changed} үгийн давталтын явцыг арилгалаа.`);
    },
    async createDeck(name: string) {
      try {
        const data = await sendJson<{ deck: VocabularyDeck }>(VOCABULARY_API + "/decks", { name });
        setDecks(current => [...current, data.deck]);
        ok(`“${data.deck.name}” багц үүслээ. Үгээ сонгоод энэ багц руу зөөгөөрэй.`);
        return null;
      } catch (reason) {
        return failure(reason, "Багц үүсгэж чадсангүй. Дахин оролдоно уу.");
      }
    },
    async updateDeck(id: string, fields: { name?: string; color?: DeckColor }) {
      try {
        const data = await sendJson<{ deck: VocabularyDeck }>(`${VOCABULARY_API}/decks/${encodeURIComponent(id)}`, fields, "PATCH");
        setDecks(current => current.map(deck => deck.id === id ? data.deck : deck));
        return null;
      } catch (reason) {
        return failure(reason, "Багцыг шинэчилж чадсангүй. Дахин оролдоно уу.");
      }
    },
    async deleteDeck(deck: VocabularyDeck, withWords: boolean) {
      try {
        await request<{ ok: true }>(`${VOCABULARY_API}/decks/${encodeURIComponent(deck.id)}${withWords ? "?words=delete" : ""}`, { method: "DELETE" });
        setDecks(current => current.filter(item => item.id !== deck.id));
        setWords(current => withWords ? current.filter(word => word.deckId !== deck.id) : current.map(word => word.deckId === deck.id ? { ...word, deckId: null } : word));
        ok(withWords ? `“${deck.name}” багц үгстэйгээ устгагдлаа.` : `“${deck.name}” багц устгагдлаа. Үгс нь сандаа үлдсэн.`);
        return null;
      } catch (reason) {
        return failure(reason, "Багцыг устгаж чадсангүй. Дахин оролдоно уу.");
      }
    },
    quiz: openQuiz,
  };

  function imported(saved: SavedImport) {
    const ids = new Set(saved.words.map(word => word.id));
    setWords(current => [...saved.words, ...current.filter(word => !ids.has(word.id))]);
    if (saved.deck) setDecks(current => current.some(deck => deck.id === saved.deck!.id) ? current : [...current, saved.deck!]);
    setPanel(null);
    const extra = [saved.duplicates ? `${saved.duplicates} давхар үг алгасагдлаа.` : "", saved.skipped ? `Сангийн хязгаарт ${saved.skipped} үг багтсангүй.` : ""].filter(Boolean).join(" ");
    ok(`${saved.added} үг ${saved.deck ? `“${saved.deck.name}” багцад ` : "таны санд "}нэмэгдлээ.${extra ? " " + extra : ""}`);
  }

  if (quiz) return <Quiz userId={userId} words={words} decks={decks} launch={quiz} now={now}
    onExit={() => { setQuiz(null); setNow(Date.now()); }} onStudied={applyStudy} onStar={ids => actions.star(ids, true)} />;

  const studyLine = !canQuiz ? `Дор хаяж ${QUIZ_MIN_WORDS} үг хадгалаад quiz эхлүүлээрэй.`
    : stats.due ? `${stats.due} үг давтах цаг болсон${stats.fresh ? `, ${stats.fresh} шинэ үг хүлээж байна` : ""}.`
      : stats.fresh ? `${stats.fresh} шинэ үг сурахад бэлэн байна.`
        : "Өнөөдөр давтах ёстой үг алга. Хүсвэл бүх үгээрээ чөлөөт quiz хийж болно.";

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Icon name="book" size={17} />Үгсийн сан</p>
      <h1>Үгээ цуглуул. <span>Ухаалгаар давт.</span></h1>
      <p className={styles.lead}>Үгээ багцлан эмхэлж, давтах цаг нь болсон үгсээ quiz-ээр бататга.</p>
    </header>

    <div className={styles.stats}>
      <div className={`${styles.stat} ${full ? styles.statFull : ""}`} data-stat="total" aria-label={`${words.length} / ${limit} хадгалсан үг`}>
        <span>Хадгалсан үг</span><strong>{number(words.length)}</strong><small>{number(limit)} хүртэл</small>
        <i className={styles.meter} aria-hidden="true"><b style={{ width: Math.min(100, Math.round((words.length / Math.max(1, limit)) * 100)) + "%" }} /></i>
      </div>
      <div className={styles.stat} data-stat="due"><span>Давтах цаг болсон</span><strong>{number(stats.due)}</strong><small>{number(stats.fresh)} шинэ үг</small></div>
      <div className={styles.stat} data-stat="mastered">
        <span>Цээжилсэн</span><strong>{number(stats.mastered)}</strong><small>{number(stats.learning + stats.familiar)} сурч буй</small>
        <i className={styles.spread} aria-hidden="true">
          <b data-status="mastered" style={{ width: share(stats.mastered) }} /><b data-status="familiar" style={{ width: share(stats.familiar) }} /><b data-status="learning" style={{ width: share(stats.learning) }} />
        </i>
      </div>
      <div className={styles.stat} data-stat="today"><span>Өнөөдөр давтсан</span><strong>{number(stats.today)}</strong><small>үг</small></div>
    </div>

    {full ? <p className={styles.full} role="status">
      <Icon name="info" size={16} />
      <span>{bankFullMessage(limit)}{limit < UPGRADE.words ? <> <Link href="/workspace/plans">Багцууд үзэх</Link></> : null}</span>
    </p> : null}

    <section className={styles.studyBanner} aria-labelledby="voc-study-heading">
      <span className={styles.quizMark} aria-hidden="true"><Icon name="bolt" size={22} /></span>
      <div className={styles.quizCopy}>
        <h2 id="voc-study-heading">Өнөөдрийн давталт</h2>
        <p>{studyLine}</p>
      </div>
      <div className={styles.studyActions}>
        <button type="button" className={styles.ghost} onClick={() => openQuiz({})} disabled={!canQuiz}>Quiz тохируулах</button>
        <button type="button" className={styles.primary} onClick={() => openQuiz({ scope: "smart", start: true })} disabled={!canQuiz}><Icon name="bolt" size={17} />Ухаалаг давталт</button>
      </div>
    </section>

    {notice ? <p className={`${styles.notice} ${notice.tone === "bad" ? styles.noticeBad : ""}`} role={notice.tone === "bad" ? "alert" : "status"}>{notice.text}</p> : null}

    <div ref={panelArea} className={styles.panelArea}>
      {panel === "add" ? <AddPanel decks={decks} full={full} limit={limit} onClose={() => setPanel(null)}
        onAdded={(word, total) => { setWords(current => [word, ...current.filter(item => item.id !== word.id)]); ok(`"${word.term}" үг хадгалагдлаа. Одоо ${total} үг байна.`); }} /> : null}
      {panel === "import" ? <ImportPanel userId={userId} decks={decks} room={room} full={full} onSaved={imported} onClose={() => setPanel(null)} /> : null}
    </div>

    <Library words={words} decks={decks} now={now} canSpeak={canSpeak} actions={actions} onAdd={() => toggle("add")} onImport={() => toggle("import")} />
  </div>;
}

function AddPanel({ decks, full, limit, onAdded, onClose }: {
  decks: VocabularyDeck[]; full: boolean; limit: number; onAdded: (word: VocabularyWord, total: number) => void; onClose: () => void;
}) {
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [example, setExample] = useState("");
  const [deckId, setDeckId] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const termInput = useRef<HTMLInputElement>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (adding) return;
    const cleanTerm = term.trim(), cleanTranslation = translation.trim();
    if (!cleanTerm || !cleanTranslation) return;
    setAdding(true); setError("");
    try {
      const data = await sendJson<{ word: VocabularyWord; total: number }>(VOCABULARY_API, {
        term: cleanTerm, translation: cleanTranslation, example: example.trim(), ...(deckId ? { deckId } : {}),
      });
      onAdded(data.word, data.total);
      setTerm(""); setTranslation(""); setExample("");
      termInput.current?.focus();
    } catch (reason) {
      setError(failure(reason, "Үг хадгалж чадсангүй. Дахин оролдоно уу."));
    } finally { setAdding(false); }
  }

  return <section className={styles.panel} aria-labelledby="voc-add-heading" data-panel="add">
    <div className={styles.panelHead}>
      <span className={styles.panelIcon} aria-hidden="true"><Icon name="plus" size={19} /></span>
      <div><h2 id="voc-add-heading">Шинэ үг</h2><p>Үг, орчуулгаа бичээд сандаа нэмээрэй. Нэмсний дараа дараагийн үгээ шууд бичиж болно.</p></div>
      <button type="button" className={styles.rowAction} onClick={onClose} aria-label="Хаах" title="Хаах" disabled={adding}><Icon name="close" size={18} /></button>
    </div>
    <form className={styles.form} onSubmit={add}>
      <label className={styles.field}><span>Үг эсвэл хэллэг</span>
        <input ref={termInput} value={term} onChange={event => setTerm(event.target.value)} maxLength={VOCABULARY_LIMITS.term} placeholder="жишээ нь: resilient" autoComplete="off" required disabled={adding} autoFocus />
      </label>
      <label className={styles.field}><span>Орчуулга</span>
        <input value={translation} onChange={event => setTranslation(event.target.value)} maxLength={VOCABULARY_LIMITS.translation} placeholder="жишээ нь: тэсвэртэй, уян хатан" autoComplete="off" required disabled={adding} />
      </label>
      <label className={styles.field}><span>Жишээ өгүүлбэр <em>сонголтоор</em></span>
        <input value={example} onChange={event => setExample(event.target.value)} maxLength={VOCABULARY_LIMITS.example} placeholder="The material is resilient to heat." autoComplete="off" disabled={adding} />
      </label>
      <label className={styles.field}><span>Багц <em>сонголтоор</em></span>
        <select value={deckId} onChange={event => setDeckId(event.target.value)} disabled={adding}><option value="">Багцгүй</option>{decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name}</option>)}</select>
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.formFoot}>
        <p className={styles.fine}>Үнэгүй бүртгэлд {number(VOCABULARY_LIMITS.freeWords)} үг{UPGRADE.plans.length && limit < UPGRADE.words ? `, ${UPGRADE.plans.join(" эсвэл ")} багцтай бол ${number(UPGRADE.words)} үг` : ""} хадгална.</p>
        <button type="submit" className={styles.primary} disabled={adding || full || !term.trim() || !translation.trim()} aria-busy={adding}>
          {adding ? <><i className={styles.spinner} aria-hidden="true" />Хадгалж байна…</> : <><Icon name="plus" size={17} />Сандаа нэмэх</>}
        </button>
      </div>
    </form>
  </section>;
}
