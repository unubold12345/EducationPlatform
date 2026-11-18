"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import { speak, useVoices } from "@/modules/vocabulary/speech";
import { Modal } from "@/modules/vocabulary/modal";
import { STUDY_BOX_MAX } from "@/modules/vocabulary/study";
import type { DeckLesson, DeckProgress, LanguageDeck } from "./catalog";
import { useReadingAid } from "./client";
import { KanaQuiz, type KanaTestRun } from "./kana-quiz";
import { buildKanaTest, KANA_SECTIONS, KANA_TEST_COUNTS, kanaLetters, type KanaLetter, type KanaSection, type KanaTestCount } from "./kana-test";
import styles from "./decks.module.css";

// Workshop → JLPT → Kana: the chart is the page (owner pick 2026-11-18); clicking a kana plays it. One button opens the
// test setup in a modal (owner 2026-11-18: "simple, all letters, mix with katakana", "just make modal"): which script (or
// both), which sections, how many questions.
const COLUMNS: Record<KanaSection, string[]> = { basic: ["a", "i", "u", "e", "o"], voiced: ["a", "i", "u", "e", "o"], combo: ["ya", "yu", "yo"] };
const rowLabel = (lesson: DeckLesson) => lesson.id === "a" ? "" : lesson.id === "nn" ? "n" : lesson.id;
const scriptLabel = (id: string) => id === "kana-hiragana" ? "ひらがな" : "カタカナ";
type TestScript = "kana-hiragana" | "kana-katakana" | "both";

export function KanaStudy({ scripts, initialProgress }: {
  userId: string; scripts: LanguageDeck[]; initialProgress: Record<string, Record<string, DeckProgress>>; now: number;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [scriptId, setScriptId] = useState<string>(scripts[0].id);
  const [section, setSection] = useState<KanaSection>("basic");
  const [testScript, setTestScript] = useState<TestScript>("kana-hiragana");
  const [testSections, setTestSections] = useState<ReadonlySet<KanaSection>>(new Set(["basic"]));
  const [testCount, setTestCount] = useState<KanaTestCount>(20);
  const [setup, setSetup] = useState(false);
  const [run, setRun] = useState<(KanaTestRun & { letters: KanaLetter[]; count: KanaTestCount }) | null>(null);
  const [romaji, toggleRomaji] = useReadingAid("kana-romaji", true);
  const { canSpeak } = useVoices();
  const script = scripts.find(item => item.id === scriptId) ?? scripts[0];
  const mine = useMemo(() => progress[script.id] ?? {}, [progress, script.id]);
  const voiced = canSpeak(script.lang);
  const allLetters = useMemo(() => kanaLetters(scripts, KANA_SECTIONS.map(item => item.id)), [scripts]);
  const chosenScripts = scripts.filter(item => testScript === "both" || item.id === testScript);
  const letters = kanaLetters(chosenScripts, KANA_SECTIONS.map(item => item.id).filter(id => testSections.has(id)));
  const questionCount = testCount === "all" ? letters.length : Math.min(testCount, letters.length);
  const sectionSize = (id: KanaSection) => kanaLetters(chosenScripts, [id]).length;
  const total = script.lessons.reduce((sum, lesson) => sum + lesson.words.length, 0);
  const mastered = script.lessons.flatMap(lesson => lesson.words).filter(word => (mine[word.id]?.box ?? 0) >= STUDY_BOX_MAX).length;
  const shownRows = script.lessons.filter(lesson => lesson.section === section);

  function applyStudy(deckId: string, updates: StudyUpdate[]) {
    setProgress(previous => {
      const next = { ...previous, [deckId]: { ...previous[deckId] } };
      for (const item of updates) next[deckId][item.id] = { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: item.reviewedAt, dueAt: item.dueAt };
      return next;
    });
  }
  const start = (pool: KanaLetter[], count: KanaTestCount) => { setSetup(false); setRun({ questions: buildKanaTest(pool, count, allLetters), startedAt: Date.now(), letters: pool, count }); };
  const toggleSection = (id: KanaSection) => setTestSections(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  if (run) {
    return <KanaQuiz key={run.startedAt} run={run} voiced={voiced} onStudied={applyStudy} onClose={() => setRun(null)}
      onRestart={only => only ? start(only, "all") : start(run.letters, run.count)} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href="/workspace/workshop?exam=jlpt"><Icon name="arrow" size={15} className={styles.backIcon} />Workshop</Link>
    <header className={styles.head}>
      <div><p className={styles.eyebrow}>JLPT · үсэг</p><h1>Хирагана · Катакана</h1></div>
      <dl className={styles.stats}>
        <div><dt>Үсэг</dt><dd>{total}</dd></div>
        <div><dt>Цээжилсэн</dt><dd>{mastered}</dd></div>
      </dl>
    </header>

    {setup ? <Modal labelledBy="kana-test-heading" onClose={() => setSetup(false)} size="narrow"><section className={styles.testModal}>
      <h2 id="kana-test-heading">Шалгалт</h2>
      <div className={styles.testRow}>
        <span id="kana-test-script">Үсэг</span>
        <div className={styles.segment} role="group" aria-labelledby="kana-test-script">
          {(["kana-hiragana", "kana-katakana", "both"] as const).map(id => <button key={id} type="button" aria-pressed={testScript === id} onClick={() => setTestScript(id)}
            lang={id === "both" ? undefined : "ja"}>{id === "both" ? "Хоёулаа" : scriptLabel(id)}</button>)}
        </div>
      </div>
      <div className={styles.testRow}>
        <span id="kana-test-sections">Хэсэг</span>
        <div className={styles.testChips} role="group" aria-labelledby="kana-test-sections">
          {KANA_SECTIONS.map(item => <button key={item.id} type="button" aria-pressed={testSections.has(item.id)} onClick={() => toggleSection(item.id)}>
            {item.label}<small>{sectionSize(item.id)}</small></button>)}
        </div>
      </div>
      <div className={styles.testRow}>
        <span id="kana-test-count">Асуулт</span>
        <div className={styles.segment} role="group" aria-labelledby="kana-test-count">
          {KANA_TEST_COUNTS.map(value => <button key={value} type="button" aria-pressed={testCount === value} onClick={() => setTestCount(value)}>
            {value === "all" ? "Бүгд" : value}</button>)}
        </div>
      </div>
      <div className={styles.testActions}>
        <button type="button" className={styles.ghostButton} onClick={() => setSetup(false)}>Болих</button>
        <button type="button" className={styles.primaryButton} disabled={!letters.length} onClick={() => start(letters, testCount)} data-autofocus="">
          {letters.length ? `Эхлэх · ${questionCount} асуулт` : "Хэсэг сонгоно уу"}</button>
      </div>
    </section></Modal> : null}

    <div className={styles.kanaBar}>
      <nav className={styles.segment} aria-label="Үсэг">
        {scripts.map(item => <button key={item.id} type="button" aria-pressed={item.id === script.id} onClick={() => setScriptId(item.id)} lang="ja">{scriptLabel(item.id)}</button>)}
      </nav>
      <div className={styles.kanaTools}>
        <button type="button" className={styles.readingToggle} aria-pressed={romaji} onClick={toggleRomaji}>Romaji</button>
        <button type="button" className={styles.primaryButton} onClick={() => { setTestScript(script.id as TestScript); setSetup(true); }}>Шалгалт өгөх</button>
      </div>
    </div>
    <nav className={styles.segment} aria-label="Хүснэгтийн хэсэг">
      {KANA_SECTIONS.map(item => <button key={item.id} type="button" aria-pressed={item.id === section} onClick={() => setSection(item.id)}>{item.label}</button>)}
    </nav>

    <div className={styles.chartWrap}>
      <table className={styles.chart} data-columns={COLUMNS[section].length}>
        <caption className="sr-only">{script.title}: {KANA_SECTIONS.find(item => item.id === section)!.label}</caption>
        <thead><tr><th scope="col"><span className="sr-only">Мөр</span></th>{COLUMNS[section].map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{shownRows.map(lesson => <tr key={lesson.id}>
          <th scope="row" className={styles.rowName}>{rowLabel(lesson) || "·"}</th>
          {(lesson.cells ?? []).map((cell, index) => {
            if (!cell) return <td key={index} className={styles.emptyCell} />;
            const word = lesson.words.find(item => item.term === cell)!;
            const box = mine[word.id]?.box ?? 0;
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
