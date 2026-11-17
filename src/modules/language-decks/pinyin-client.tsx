"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import { speak, useVoices } from "@/modules/vocabulary/speech";
import { STUDY_BOX_MAX } from "@/modules/vocabulary/study";
import type { DeckProgress, LanguageDeck, PinyinChart } from "./catalog";
import { deckDrillItems } from "./drill";
import { DrillFlow, startDrill, type DrillSessionState } from "./drill-session";
import styles from "./decks.module.css";

// Workshop → HSK → Pinyin: tones and the pinyin chart first (owner pick 2026-11-18), a tone drill on HSK words above.
// Sounds are the browser's Chinese voice reading a character, since voices read characters, not pinyin.
const LANG = "zh-CN";
const TONES = [
  { tone: 1, mark: "ā", name: "1-р аялгуу", note: "Өндөр, тэгш", path: "M10 12 L90 12", char: "妈", pinyin: "mā", meaning: "ээж" },
  { tone: 2, mark: "á", name: "2-р аялгуу", note: "Дундаас дээш өгсөнө", path: "M10 32 L90 12", char: "麻", pinyin: "má", meaning: "олсны ургамал" },
  { tone: 3, mark: "ǎ", name: "3-р аялгуу", note: "Доош бууж, дахин өгсөнө", path: "M10 26 Q45 62 90 18", char: "马", pinyin: "mǎ", meaning: "морь" },
  { tone: 4, mark: "à", name: "4-р аялгуу", note: "Дээрээс огцом унана", path: "M10 12 L90 50", char: "骂", pinyin: "mà", meaning: "загнах" },
  { tone: 5, mark: "a", name: "Сул аялгуу", note: "Богино, хөнгөн", path: "", char: "吗", pinyin: "ma", meaning: "асуух сул үг" },
] as const;
const RULES = [
  ["3 + 3 → 2 + 3", "Хоёр 3-р аялгуу дараалвал эхнийх нь 2-р болно: 你好 nǐ hǎo → ní hǎo."],
  ["不 bù → bú", "4-р аялгууны өмнө 不 2-р аялгуутай дуудагдана: 不是 búshì."],
  ["一 yī → yí / yì", "4-р аялгууны өмнө yí (一下 yíxià), бусад аялгууны өмнө yì (一起 yìqǐ)."],
] as const;
const SECTIONS = [{ id: "tones", label: "Аялгуу" }, { id: "a", label: "a · o · e" }, { id: "i", label: "i" }, { id: "u", label: "u" }, { id: "ü", label: "ü" }] as const;
type Section = (typeof SECTIONS)[number]["id"];
const COUNTS = [10, 20] as const;

export function PinyinStudy({ chart, drill, initialProgress }: { chart: PinyinChart; drill: LanguageDeck; initialProgress: Record<string, DeckProgress> }) {
  const [progress, setProgress] = useState(initialProgress);
  const [section, setSection] = useState<Section>("tones");
  const [info, setInfo] = useState<string | null>(null);
  const [levels, setLevels] = useState<ReadonlySet<string>>(new Set([drill.lessons[0].id]));
  const [count, setCount] = useState<number>(COUNTS[0]);
  const [session, setSession] = useState<DrillSessionState | null>(null);
  const { canSpeak } = useVoices();
  const voiced = canSpeak(LANG);
  const play = (text: string) => { if (voiced) speak(text, LANG); };

  const words = useMemo(() => drill.lessons.flatMap(lesson => lesson.words), [drill]);
  const mastered = words.filter(word => (progress[word.id]?.box ?? 0) >= STUDY_BOX_MAX).length;
  const pool = drill.lessons.filter(lesson => levels.has(lesson.id)).flatMap(lesson => lesson.words);
  const items = useMemo(() => deckDrillItems(drill, progress), [drill, progress]);
  const setup = { domain: "tones" as const, pool: items, showReading: false };

  function applyStudy(updates: StudyUpdate[]) {
    setProgress(previous => ({ ...previous, ...Object.fromEntries(updates.map(item => [item.id, { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: item.reviewedAt, dueAt: item.dueAt }])) }));
  }
  // The tone drill runs on the Workshop quiz (drill-session.tsx): due and weak words first, one word per screen.
  const start = () => setSession(startDrill(setup, { groups: [...levels], count, kinds: ["tone"], focus: "smart" }));

  if (session) {
    return <DrillFlow setup={setup} title="Аялгуу таних" groupLabel="Түвшин" initialGroups={[...levels]} kinds={["tone"]} counts={[...COUNTS]} storageKey={drill.id}
      groups={drill.lessons.map(lesson => ({ id: lesson.id, label: lesson.title, count: lesson.words.length }))}
      lang={LANG} voiced={voiced} reviewUrl={`/api/labs/words/${drill.id}/review`} initial={session} onStudied={applyStudy} onClose={() => setSession(null)} />;
  }

  const rows = section === "tones" ? [] : chart.chart[section];
  const finals = section === "tones" ? [] : chart.groups[section];
  const selected = info ? chart.examples[info] : null;
  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href="/workspace/workshop?exam=hsk"><Icon name="arrow" size={15} className={styles.backIcon} />Workshop</Link>
    <header className={styles.head}>
      <div><p className={styles.eyebrow}>HSK · дуудлага</p><h1>Pinyin · аялгуу</h1></div>
      <dl className={styles.stats}>
        <div><dt>Үе</dt><dd>{Object.keys(chart.examples).length}</dd></div>
        <div><dt>Аялгуу цээжилсэн</dt><dd>{mastered}</dd></div>
      </dl>
    </header>

    <section className={styles.practice} aria-labelledby="drill-heading">
      <div className={styles.practiceHead}><h2 id="drill-heading">Аялгуу таних</h2><span className={styles.practiceNote}>Үгийг сонсоод аялгууг нь сонгоно.</span></div>
      <div className={styles.rowChips} role="group" aria-label="Түвшин">
        {drill.lessons.map(lesson => <button key={lesson.id} type="button" aria-pressed={levels.has(lesson.id)} onClick={() => setLevels(previous => {
          const next = new Set(previous); if (next.has(lesson.id)) next.delete(lesson.id); else next.add(lesson.id); return next;
        })}>{lesson.title}</button>)}
        {COUNTS.map(value => <button key={value} type="button" aria-pressed={count === value} onClick={() => setCount(value)}>{value} асуулт</button>)}
      </div>
      <div className={styles.practiceActions}>
        <button type="button" className={styles.primaryButton} onClick={start} disabled={!pool.length}>Эхлэх</button>
        {!voiced ? <span className={styles.practiceNote}>Энэ хөтөч хятад хэлний дуу хоолойгүй тул үгийг харж аялгууг нь сонгоно.</span> : null}
      </div>
    </section>

    <nav className={styles.segment} aria-label="Хүснэгтийн хэсэг">
      {SECTIONS.map(item => <button key={item.id} type="button" aria-pressed={item.id === section} onClick={() => { setSection(item.id); setInfo(null); }}>{item.label}</button>)}
    </nav>

    {section === "tones" ? <>
      <div className={styles.toneGrid}>{TONES.map(item => <button key={item.tone} type="button" className={styles.toneCard} onClick={() => play(item.char)} aria-label={`${item.name}: ${item.char} ${item.pinyin}, сонсох`}>
        <svg viewBox="0 0 100 60" aria-hidden="true"><path d="M10 12 H90 M10 31 H90 M10 50 H90" className={styles.toneGuide} />{item.path ? <path d={item.path} className={styles.toneLine} /> : <circle cx="50" cy="40" r="5" className={styles.toneDot} />}</svg>
        <strong>{item.mark}</strong><span>{item.name}</span><small>{item.note}</small>
        <span className={styles.toneExample}><b lang={LANG}>{item.char}</b> {item.pinyin} · {item.meaning}</span>
      </button>)}</div>
      <section className={styles.practice} aria-labelledby="sandhi-heading">
        <h2 id="sandhi-heading">Аялгуу солигдох дүрэм</h2>
        <dl className={styles.rules}>{RULES.map(([rule, text]) => <div key={rule}><dt>{rule}</dt><dd>{text}</dd></div>)}</dl>
      </section>
    </> : <>
      <p className={styles.chartInfo} aria-live="polite">{selected ? <><b lang={LANG}>{selected.char}</b> {selected.pinyin}{selected.meaning ? ` · ${selected.meaning}` : ""}</> : "Үеийг дарж сонсоорой."}</p>
      <div className={styles.chartWrap}>
        <table className={`${styles.chart} ${styles.pinyinChart}`}>
          <caption className="sr-only">Pinyin: {SECTIONS.find(item => item.id === section)!.label}</caption>
          <thead><tr><th scope="col"><span className="sr-only">Гийгүүлэгч</span></th>{finals.map(final => <th key={final} scope="col">{final}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.initial}><th scope="row">{row.initial}</th>
            {row.cells.map((cell, index) => cell ? <td key={index}><button type="button" className={styles.pinyinCell} aria-pressed={info === cell}
              onClick={() => { setInfo(cell); play(chart.examples[cell].char); }}>{cell}</button></td> : <td key={index} className={styles.emptyCell} />)}
          </tr>)}</tbody>
        </table>
      </div>
    </>}
    <p className={styles.fine}>Үеийг тухайн дуудлагатай нэг үсгээр сонсгоно; дууг хөтчийн хятад хоолой уншина.</p>
  </div>;
}
