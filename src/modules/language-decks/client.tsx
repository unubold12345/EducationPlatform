"use client";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import { readStored, writeStored } from "@/modules/vocabulary/api";
import { Level } from "@/modules/vocabulary/library";
import type { QuizBankWord } from "@/modules/vocabulary/quiz-view";
import { speak, useVoices } from "@/modules/vocabulary/speech";
import { StudyCard } from "@/modules/vocabulary/study-card";
import { isDue, STUDY_BOX_MAX } from "@/modules/vocabulary/study";
import { READING_LABEL, type DeckProgress, type LanguageDeck } from "./catalog";
import { deckDrillItems, domainKinds } from "./drill";
import { DrillFlow, startDrill, type DrillSessionState } from "./drill-session";
import styles from "./deck-page.module.css";

// The deck page (redesign 2026-11-18, owner: "update design and layout", layout left to us): a progress hero with
// today's review and the quiz maker, a lesson path, and the open lesson as word cards (or flashcards). The quiz is the
// Workshop quiz (drill-session.tsx); flashcards are the Vocabulary page's StudyCard. Previous layout:
// artifacts/design-backup-2026-11-18.
const ORIGIN = Date.UTC(2026, 0, 1);

// The furigana/pinyin toggle is a per-browser convenience; the server renders it on.
const readingListeners = new Set<() => void>();
export function useReadingAid(name: string, fallback = true) {
  const key = "deck-reading:" + name;
  const on = useSyncExternalStore(listener => { readingListeners.add(listener); return () => { readingListeners.delete(listener); }; },
    () => readStored<boolean>(key) ?? fallback, () => fallback);
  return [on, () => { writeStored(key, !on); readingListeners.forEach(listener => listener()); }] as const;
}

const ring = (share: number) => ({ "--share": `${Math.round(share * 360)}deg` }) as CSSProperties;

export function DeckStudy({ deck, initialProgress, now: initialNow }: {
  userId: string; deck: LanguageDeck; initialProgress: Record<string, DeckProgress>; now: number;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [now, setNow] = useState(initialNow);
  const [lesson, setLesson] = useState<string>(() => deck.lessons[0].id);
  const [tab, setTab] = useState<"words" | "cards">("words");
  const [reading, toggleReading] = useReadingAid(deck.exam);
  // Romaji (JLPT only, owner request 2026-11-18), off until the student turns it on.
  const [romajiOn, toggleRomaji] = useReadingAid("romaji", false);
  const romaji = deck.exam === "jlpt" && romajiOn;
  const [open, setOpen] = useState<string | null>(null);
  const [drill, setDrill] = useState<{ initial: DrillSessionState | null; groups: string[] } | null>(null);
  const { canSpeak } = useVoices();
  const voiced = canSpeak(deck.lang);
  const reviewUrl = `/api/labs/words/${deck.id}/review`;
  const label = READING_LABEL[deck.exam];
  const domain = deck.exam === "jlpt" ? "jlpt" as const : "hsk" as const;
  const kinds = domainKinds(domain, voiced);

  // Deck words in the shape StudyCard reads; list order becomes `createdAt`, so new cards come in order.
  const words = useMemo<QuizBankWord[]>(() => {
    let order = 0;
    return deck.lessons.flatMap(item => item.words.map(word => {
      const mine = progress[word.id];
      return {
        id: word.id, term: word.term, translation: word.meaning, example: word.example, sourceName: null,
        createdAt: new Date(ORIGIN + order++ * 1000).toISOString(), deckId: item.id, starred: false,
        box: mine?.box ?? 0, correct: mine?.correct ?? 0, wrong: mine?.wrong ?? 0, reviewedAt: mine?.reviewedAt ?? null, dueAt: mine?.dueAt ?? null,
        reading: [reading ? word.reading : "", romaji ? word.romaji ?? "" : ""].filter(Boolean).join(" · ") || null, lang: deck.lang,
      };
    }));
  }, [deck, progress, reading, romaji]);
  const items = useMemo(() => deckDrillItems(deck, progress), [deck, progress]);
  const setup = { domain, pool: items, showReading: reading };
  const current = deck.lessons.find(item => item.id === lesson) ?? deck.lessons[0];
  const currentIndex = deck.lessons.indexOf(current);
  const lessonWords = words.filter(word => word.deckId === current.id);
  const mastered = (list: QuizBankWord[]) => list.filter(word => word.box >= STUDY_BOX_MAX).length;
  const learned = (list: QuizBankWord[]) => list.filter(word => word.box > 0).length;
  const due = words.filter(word => isDue(word, now)).length;
  const share = words.length ? mastered(words) / words.length : 0;

  function applyStudy(updates: StudyUpdate[]) {
    setProgress(previous => {
      const next = { ...previous };
      for (const item of updates) next[item.id] = { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: item.reviewedAt, dueAt: item.dueAt };
      return next;
    });
  }
  const review = () => setDrill({ groups: deck.lessons.map(item => item.id),
    initial: startDrill(setup, { groups: deck.lessons.map(item => item.id), count: 10, kinds, focus: "smart" }) });
  const lessonQuiz = () => setDrill({ groups: [current.id], initial: startDrill(setup, { groups: [current.id], count: 10, kinds, focus: "all" }) });

  if (drill) {
    return <DrillFlow setup={setup} title={`${deck.title} quiz`} groupLabel="Хичээл" initialGroups={drill.groups} kinds={kinds} storageKey={deck.id}
      groups={deck.lessons.map((item, index) => ({ id: item.id, label: `${index + 1}. ${item.title}`, count: item.words.length }))}
      lang={deck.lang} voiced={voiced} reviewUrl={reviewUrl} initial={drill.initial} onStudied={applyStudy} onClose={() => { setDrill(null); setNow(Date.now()); }} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href={"/workspace/workshop?exam=" + deck.exam}><Icon name="arrow" size={15} className={styles.backIcon} />Workshop</Link>

    <header className={styles.hero}>
      <div className={styles.heroMain}>
        <p className={styles.eyebrow}>{deck.exam.toUpperCase()} · үгсийн сан</p>
        <h1>{deck.title}</h1>
        <dl className={styles.heroStats}>
          <div><dt>Үг</dt><dd>{words.length}</dd></div>
          <div><dt>Хичээл</dt><dd>{deck.lessons.length}</dd></div>
          <div><dt>Цээжилсэн</dt><dd>{mastered(words)}</dd></div>
          <div><dt>Давтах</dt><dd>{due}</dd></div>
        </dl>
        <div className={styles.heroActions}>
          <button type="button" className={styles.primary} onClick={review}><Icon name="bolt" size={17} />Өнөөдрийн давталт{due ? <b>{due}</b> : null}</button>
          <button type="button" className={styles.secondary} onClick={() => setDrill({ groups: [current.id], initial: null })}>Quiz үүсгэх</button>
        </div>
      </div>
      <div className={styles.heroRing} style={ring(share)} role="img" aria-label={`${Math.round(share * 100)}% цээжилсэн`}>
        <span><strong>{Math.round(share * 100)}%</strong><small>цээжилсэн</small></span>
      </div>
    </header>

    <div className={styles.layout}>
      <nav className={styles.path} aria-label="Хичээлүүд">
        <ol>{deck.lessons.map((item, index) => {
          const list = words.filter(word => word.deckId === item.id);
          const part = list.length ? learned(list) / list.length : 0;
          const complete = list.length > 0 && mastered(list) === list.length;
          return <li key={item.id}><button type="button" aria-current={item.id === current.id ? "true" : undefined} onClick={() => { setLesson(item.id); setOpen(null); }}>
            <span className={styles.node} style={ring(part)} data-complete={complete ? "true" : undefined}>
              <span>{complete ? <Icon name="check" size={16} /> : index + 1}</span>
            </span>
            <span className={styles.nodeText}><strong>{item.title}</strong><small>{learned(list)} / {list.length} үзсэн</small></span>
          </button></li>;
        })}</ol>
      </nav>

      <main className={styles.lesson}>
        <div className={styles.lessonHead}>
          <div>
            <p className={styles.eyebrow}>{currentIndex + 1}-р хичээл</p>
            <h2>{current.title}</h2>
            <p className={styles.lessonMeta}>{lessonWords.length} үг · {learned(lessonWords)} үзсэн · {mastered(lessonWords)} цээжилсэн</p>
          </div>
          <div className={styles.lessonActions}>
            <button type="button" className={styles.primary} onClick={lessonQuiz}>Энэ хичээлийн quiz</button>
          </div>
        </div>
        <div className={styles.lessonBar}>
          <div className={styles.tabs} role="tablist" aria-label="Хичээлийн харагдац">
            <button type="button" role="tab" aria-selected={tab === "words"} onClick={() => setTab("words")}>Үгс</button>
            <button type="button" role="tab" aria-selected={tab === "cards"} onClick={() => setTab("cards")}>Карт</button>
          </div>
          <div className={styles.toggles}>
            <button type="button" className={styles.toggle} aria-pressed={reading} onClick={toggleReading}>{label}</button>
            {deck.exam === "jlpt" ? <button type="button" className={styles.toggle} aria-pressed={romaji} onClick={toggleRomaji}>Romaji</button> : null}
          </div>
        </div>

        {tab === "cards" ? <StudyCard words={lessonWords} now={now} canSpeak={canSpeak} reviewUrl={reviewUrl} onStudied={applyStudy}
          onQuiz={launch => launch.start ? review() : setDrill({ groups: [current.id], initial: null })} /> : null}

        <section className={styles.words} aria-labelledby="deck-words-heading" hidden={tab !== "words"}>
          <h2 id="deck-words-heading" className="sr-only">{current.title}: үгс</h2>
          <ul>{current.words.map(word => {
            const shown = words.find(item => item.id === word.id)!;
            const expanded = open === word.id;
            return <li key={word.id} data-open={expanded ? "true" : undefined}>
              <button type="button" className={styles.wordMain} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : word.id)}>
                <span className={styles.term} lang={deck.lang}>{word.term}</span>
                {(reading && word.reading !== word.term) || (romaji && word.romaji) ? <span className={styles.reading}>
                  {reading && word.reading !== word.term ? <span lang={deck.exam === "jlpt" ? "ja-Hira" : "zh-Latn-pinyin"}>{word.reading}</span> : null}
                  {romaji && word.romaji ? <span className={styles.romaji} lang="ja-Latn">{word.romaji}</span> : null}
                </span> : null}
                <span className={styles.meaning}>{word.meaning}</span>
              </button>
              <div className={styles.wordFoot}>
                <Level word={shown} now={now} />
                {voiced ? <button type="button" className={styles.speak} onClick={() => speak(word.term, deck.lang)} aria-label={`${word.term} сонсох`} title="Сонсох"><Icon name="sound" size={16} /></button> : null}
              </div>
              {expanded ? <div className={styles.example}>
                <p lang={deck.lang}>{word.example}{voiced ? <button type="button" className={styles.speakSmall} onClick={() => speak(word.example, deck.lang)} aria-label="Жишээ өгүүлбэрийг сонсох"><Icon name="sound" size={14} /></button> : null}</p>
                {reading ? <p className={styles.exampleReading}>{word.exampleReading}</p> : null}
                {romaji && word.exampleRomaji ? <p className={styles.exampleReading} lang="ja-Latn">{word.exampleRomaji}</p> : null}
                <p className={styles.exampleMeaning}>{word.exampleMeaning}</p>
              </div> : null}
            </li>;
          })}</ul>
        </section>
        <div className={styles.lessonNav}>
          {currentIndex > 0 ? <button type="button" className={styles.secondary} onClick={() => { setLesson(deck.lessons[currentIndex - 1].id); setOpen(null); }}>← Өмнөх хичээл</button> : <span />}
          {currentIndex < deck.lessons.length - 1 ? <button type="button" className={styles.secondary} onClick={() => { setLesson(deck.lessons[currentIndex + 1].id); setOpen(null); }}>Дараах хичээл →</button> : null}
        </div>
        <p className={styles.fine}>Утга, жишээ өгүүлбэрүүд AI-аар бэлтгэгдсэн, багшийн хяналт хүлээж буй ноорог.</p>
      </main>
    </div>
  </div>;
}
