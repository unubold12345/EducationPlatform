"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import type { QuizBankWord } from "@/modules/vocabulary/quiz-view";
import { speak, useVoices } from "@/modules/vocabulary/speech";
import { StudyCard } from "@/modules/vocabulary/study-card";
import { STUDY_BOX_MAX } from "@/modules/vocabulary/study";
import type { DeckLesson, DeckProgress, LanguageDeck } from "./catalog";
import { useReadingAid } from "./client";
import { deckDrillItems, domainKinds } from "./drill";
import { DrillFlow, startDrill, type DrillSessionState } from "./drill-session";
import styles from "./decks.module.css";

// Workshop → JLPT → Kana: the chart is the page (owner pick 2026-11-18). Clicking a kana plays it; the practice bar
// studies chosen rows with the Vocabulary page's flashcards and the Workshop quiz (drill-session.tsx: kana ↔ romaji,
// listening, pairs, typing; owner request 2026-11-18 "a quiz maker like Duolingo").
const ORIGIN = Date.UTC(2026, 0, 1);
const SECTIONS = [{ id: "basic", label: "Үндсэн" }, { id: "voiced", label: "Дауны тэмдэг" }, { id: "combo", label: "Нийлмэл" }] as const;
type Section = (typeof SECTIONS)[number]["id"];
const COLUMNS: Record<Section, string[]> = { basic: ["a", "i", "u", "e", "o"], voiced: ["a", "i", "u", "e", "o"], combo: ["ya", "yu", "yo"] };
const rowLabel = (lesson: DeckLesson) => lesson.id === "a" ? "" : lesson.id === "nn" ? "n" : lesson.id;

export function KanaStudy({ scripts, initialProgress, now: initialNow }: {
  userId: string; scripts: LanguageDeck[]; initialProgress: Record<string, Record<string, DeckProgress>>; now: number;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [now, setNow] = useState(initialNow);
  const [scriptId, setScriptId] = useState<string>(scripts[0].id);
  const [section, setSection] = useState<Section>("basic");
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [cards, setCards] = useState(false);
  const [drill, setDrill] = useState<{ initial: DrillSessionState | null; groups: string[] } | null>(null);
  const [romaji, toggleRomaji] = useReadingAid("kana-romaji", true);
  const { canSpeak } = useVoices();
  const script = scripts.find(item => item.id === scriptId) ?? scripts[0];
  const mine = useMemo(() => progress[script.id] ?? {}, [progress, script.id]);
  const reviewUrl = `/api/labs/words/${script.id}/review`;

  const words = useMemo<QuizBankWord[]>(() => {
    let order = 0;
    return script.lessons.flatMap(lesson => lesson.words.map(word => {
      const state = mine[word.id];
      return {
        id: word.id, term: word.term, translation: word.meaning, example: null, sourceName: null,
        createdAt: new Date(ORIGIN + order++ * 1000).toISOString(), deckId: lesson.id, starred: false,
        box: state?.box ?? 0, correct: state?.correct ?? 0, wrong: state?.wrong ?? 0, reviewedAt: state?.reviewedAt ?? null, dueAt: state?.dueAt ?? null,
        reading: null, lang: script.lang,
      };
    }));
  }, [script, mine]);
  const items = useMemo(() => deckDrillItems(script, mine), [script, mine]);
  const boxOf = (id: string) => mine[id]?.box ?? 0;
  const shownRows = script.lessons.filter(lesson => lesson.section === section);
  const picked = shownRows.filter(lesson => chosen.has(lesson.id));
  const practice = (picked.length ? picked : shownRows).flatMap(lesson => lesson.words.map(word => word.id));
  const practiceWords = words.filter(word => practice.includes(word.id));
  const mastered = words.filter(word => word.box >= STUDY_BOX_MAX).length;
  const voiced = canSpeak(script.lang);
  const kinds = domainKinds("kana", voiced);
  const setup = { domain: "kana" as const, pool: items, showReading: false, lookalikes: script.lookalikes };
  const practiceGroups = (picked.length ? picked : shownRows).map(lesson => lesson.id);

  function applyStudy(updates: StudyUpdate[]) {
    setProgress(previous => {
      const next = { ...previous, [script.id]: { ...previous[script.id] } };
      for (const item of updates) next[script.id][item.id] = { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: item.reviewedAt, dueAt: item.dueAt };
      return next;
    });
  }
  const toggleRow = (id: string) => setChosen(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const switchTo = (next: { script?: string; section?: Section }) => {
    if (next.script) setScriptId(next.script);
    if (next.section) setSection(next.section);
    setChosen(new Set()); setCards(false);
  };

  if (drill) {
    const sectionLabel = (id?: string) => SECTIONS.find(item => item.id === id)?.label;
    return <DrillFlow setup={setup} title={`${script.title} quiz`} groupLabel="Мөр" initialGroups={drill.groups} kinds={kinds} storageKey={script.id}
      groups={script.lessons.map(lesson => ({ id: lesson.id, label: lesson.cells?.find(Boolean) ?? lesson.title, section: sectionLabel(lesson.section), count: lesson.words.length, lang: "ja" }))}
      lang={script.lang} voiced={voiced} reviewUrl={reviewUrl} initial={drill.initial} onStudied={applyStudy} onClose={() => { setDrill(null); setNow(Date.now()); }} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href="/workspace/workshop?exam=jlpt"><Icon name="arrow" size={15} className={styles.backIcon} />Workshop</Link>
    <header className={styles.head}>
      <div><p className={styles.eyebrow}>JLPT · үсэг</p><h1>Хирагана · Катакана</h1></div>
      <dl className={styles.stats}>
        <div><dt>Үсэг</dt><dd>{words.length}</dd></div>
        <div><dt>Цээжилсэн</dt><dd>{mastered}</dd></div>
      </dl>
    </header>

    <div className={styles.kanaBar}>
      <nav className={styles.segment} aria-label="Үсэг">
        {scripts.map(item => <button key={item.id} type="button" aria-pressed={item.id === script.id} onClick={() => switchTo({ script: item.id })} lang="ja">{item.id === "kana-hiragana" ? "ひらがな" : "カタカナ"}</button>)}
      </nav>
      <button type="button" className={styles.readingToggle} aria-pressed={romaji} onClick={toggleRomaji}>Romaji</button>
    </div>

    <section className={styles.practice} aria-labelledby="kana-practice-heading">
      <div className={styles.practiceHead}>
        <h2 id="kana-practice-heading">Дасгал</h2>
        <span className={styles.practiceNote}>{picked.length ? `${picked.length} мөр · ${practice.length} үсэг` : `${SECTIONS.find(item => item.id === section)!.label}: ${practice.length} үсэг`}</span>
      </div>
      <div className={styles.rowChips} role="group" aria-label="Мөр сонгох">
        {shownRows.map(lesson => {
          const done = lesson.words.every(word => boxOf(word.id) >= STUDY_BOX_MAX);
          return <button key={lesson.id} type="button" aria-pressed={chosen.has(lesson.id)} onClick={() => toggleRow(lesson.id)} lang="ja" title={lesson.title}>
            {lesson.cells?.find(Boolean)}{done ? <Icon name="check" size={13} /> : null}
          </button>;
        })}
      </div>
      <div className={styles.practiceActions}>
        <button type="button" className={styles.primaryButton} onClick={() => setCards(value => !value)} aria-expanded={cards}>Карт</button>
        <button type="button" className={styles.primaryButton} onClick={() => setDrill({ groups: practiceGroups, initial: null })}>Quiz үүсгэх</button>
        <button type="button" className={styles.ghostButton} onClick={() => setDrill({ groups: practiceGroups,
          initial: startDrill(setup, { groups: practiceGroups, count: 10, kinds, focus: "smart" }) })}>Шууд эхлэх</button>
        {script.lookalikes?.length ? <button type="button" className={styles.ghostButton} onClick={() => setDrill({ groups: practiceGroups,
          initial: startDrill(setup, { groups: [], count: 20, kinds: ["term", "meaning"], focus: "all" }, script.lookalikes!) })}>Адилхан үсэг</button> : null}
      </div>
      {cards ? <StudyCard words={practiceWords} now={now} canSpeak={canSpeak} reviewUrl={reviewUrl} onStudied={applyStudy}
        onQuiz={launch => setDrill({ groups: practiceGroups, initial: launch.start ? startDrill(setup, { groups: practiceGroups, count: 10, kinds, focus: "smart" }) : null })} /> : null}
    </section>

    <nav className={styles.segment} aria-label="Хүснэгтийн хэсэг">
      {SECTIONS.map(item => <button key={item.id} type="button" aria-pressed={item.id === section} onClick={() => switchTo({ section: item.id })}>{item.label}</button>)}
    </nav>

    <div className={styles.chartWrap}>
      <table className={styles.chart} data-columns={COLUMNS[section].length}>
        <caption className="sr-only">{script.title}: {SECTIONS.find(item => item.id === section)!.label}</caption>
        <thead><tr><th scope="col"><span className="sr-only">Мөр</span></th>{COLUMNS[section].map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{shownRows.map(lesson => <tr key={lesson.id} data-chosen={chosen.has(lesson.id) ? "true" : undefined}>
          <th scope="row"><button type="button" className={styles.rowHead} aria-pressed={chosen.has(lesson.id)} onClick={() => toggleRow(lesson.id)} aria-label={`${lesson.title} сонгох`}>{rowLabel(lesson) || "·"}</button></th>
          {(lesson.cells ?? []).map((cell, index) => {
            if (!cell) return <td key={index} className={styles.emptyCell} />;
            const word = lesson.words.find(item => item.term === cell)!;
            const box = boxOf(word.id);
            return <td key={index}>
              <button type="button" className={styles.kanaCell} data-box={box} onClick={() => { if (voiced) speak(cell, script.lang); }}
                aria-label={`${cell} ${word.romaji ?? ""}${voiced ? ", сонсох" : ""}`}>
                <span className={styles.kana} lang="ja">{cell}</span>
                {romaji ? <span className={styles.kanaRomaji}>{word.romaji}</span> : null}
                <i className={styles.kanaLevel} aria-hidden="true"><b style={{ width: (box / STUDY_BOX_MAX) * 100 + "%" }} /></i>
              </button>
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
    {!voiced ? <p className={styles.fine}>Энэ хөтөч япон хэлний дуу хоолойгүй тул дуудлага сонсогдохгүй.</p> : null}
  </div>;
}
