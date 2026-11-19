"use client";
import Link from "next/link";
import { Fragment, useCallback, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
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
// artifacts/design-backup-2026-11-18. Kanji decks (2026-11-19) use the same page: a card shows the kanji, its on and kun
// readings and meaning, and opens its example words; nothing reads a lone kanji aloud, since it has several readings.
// HSK word decks (2026-11-19, owner: the characters come from the vocabulary, so they are a filter here, not decks of their
// own) add a «Ханз» view: the characters first met in the lesson's words, drawn like kanji cards with pinyin, opening the
// deck words that hold them. It is for reading only: no progress, cards or quiz of its own.
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

// How many columns the word grid shows right now (it is auto-fill, so the count follows the room the page has). A callback
// ref, because the list unmounts while a quiz runs and comes back as a new element.
function useGridColumns() {
  const [columns, setColumns] = useState(1);
  const ref = useCallback((list: HTMLUListElement | null) => {
    if (!list) return;
    // A hidden list (the Карт tab) reports the unresolved repeat(...) template; keep the last real count until it shows.
    const measure = () => {
      if (!list.offsetWidth) return;
      setColumns(Math.max(1, getComputedStyle(list).gridTemplateColumns.split(" ").filter(track => track.endsWith("px")).length));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);
  return [columns, ref] as const;
}

export function DeckStudy({ deck, initialProgress, now: initialNow }: {
  userId: string; deck: LanguageDeck; initialProgress: Record<string, DeckProgress>; now: number;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [now, setNow] = useState(initialNow);
  const [lesson, setLesson] = useState<string>(() => deck.lessons[0].id);
  const [tab, setTab] = useState<"words" | "chars" | "cards">("words");
  const kanji = deck.kind === "kanji";
  const hanzi = deck.lessons.some(item => item.chars?.length);
  const [openChar, setOpenChar] = useState<string | null>(null);
  const [charColumns, charListRef] = useGridColumns();
  const [reading, toggleReading] = useReadingAid(kanji ? "jlpt-kanji" : deck.exam);
  // Romaji (JLPT only, owner request 2026-11-18), off until the student turns it on.
  const [romajiOn, toggleRomaji] = useReadingAid("romaji", false);
  const romaji = deck.exam === "jlpt" && romajiOn;
  const [open, setOpen] = useState<string | null>(null);
  const [columns, listRef] = useGridColumns();
  const [drill, setDrill] = useState<{ initial: DrillSessionState | null; groups: string[] } | null>(null);
  const { canSpeak } = useVoices();
  const wordsVoiced = canSpeak(deck.lang);
  const voiced = !kanji && wordsVoiced;
  const reviewUrl = `/api/labs/words/${deck.id}/review`;
  const label = kanji ? "Уншлага" : READING_LABEL[deck.exam];
  const unit = kanji ? "ханз" : "үг";
  const domain = kanji ? "kanji" as const : deck.exam === "jlpt" ? "jlpt" as const : deck.exam === "hsk" ? "hsk" as const : "topik" as const;
  const readingLang = deck.exam === "jlpt" ? "ja-Hira" : deck.exam === "hsk" ? "zh-Latn-pinyin" : "ko-Latn";
  const kinds = domainKinds(domain, voiced);

  // Deck words in the shape StudyCard reads; list order becomes `createdAt`, so new cards come in order.
  const words = useMemo<QuizBankWord[]>(() => {
    let order = 0;
    return deck.lessons.flatMap(item => item.words.map(word => {
      const mine = progress[word.id];
      return {
        id: word.id, term: word.term, translation: word.meaning, sourceName: null,
        example: kanji ? (word.examples ?? []).map(item => `${item.word} (${item.reading}) ${item.meaning}`).join(" · ") : word.example,
        createdAt: new Date(ORIGIN + order++ * 1000).toISOString(), deckId: item.id, starred: false,
        box: mine?.box ?? 0, correct: mine?.correct ?? 0, wrong: mine?.wrong ?? 0, reviewedAt: mine?.reviewedAt ?? null, dueAt: mine?.dueAt ?? null,
        reading: [word.pronunciation ? `[${word.pronunciation}]` : "", reading ? word.reading : "", romaji ? word.romaji ?? "" : ""].filter(Boolean).join(" · ") || null, lang: deck.lang,
      };
    }));
  }, [deck, kanji, progress, reading, romaji]);
  const items = useMemo(() => deckDrillItems(deck, progress), [deck, progress]);
  // A kanji quiz hides the readings in its prompts and choices: they would give the answer away.
  const setup = { domain, pool: items, showReading: kanji ? false : reading };
  const current = deck.lessons.find(item => item.id === lesson) ?? deck.lessons[0];
  const currentIndex = deck.lessons.indexOf(current);
  const lessonWords = words.filter(word => word.deckId === current.id);
  const mastered = (list: QuizBankWord[]) => list.filter(word => word.box >= STUDY_BOX_MAX).length;
  const learned = (list: QuizBankWord[]) => list.filter(word => word.box > 0).length;
  const due = words.filter(word => isDue(word, now)).length;
  const openIndex = open ? current.words.findIndex(item => item.id === open) : -1;
  const opened = openIndex >= 0 ? current.words[openIndex] : null;
  // The last card on the open card's row; the example panel follows it.
  const rowEnd = openIndex < 0 ? -1 : Math.min(current.words.length - 1, Math.floor(openIndex / columns) * columns + columns - 1);
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
  const goLesson = (id: string) => { setLesson(id); setOpen(null); setOpenChar(null); };
  const lessonChars = current.chars ?? [];
  const openCharIndex = openChar ? lessonChars.findIndex(item => item.id === openChar) : -1;
  const openedChar = openCharIndex >= 0 ? lessonChars[openCharIndex] : null;
  const charRowEnd = openCharIndex < 0 ? -1 : Math.min(lessonChars.length - 1, Math.floor(openCharIndex / charColumns) * charColumns + charColumns - 1);

  if (drill) {
    return <DrillFlow setup={setup} title={`${deck.title} quiz`} groupLabel="Хичээл" initialGroups={drill.groups} kinds={kinds} storageKey={deck.id}
      groups={deck.lessons.map((item, index) => ({ id: item.id, label: `${index + 1}. ${item.title}`, count: item.words.length }))}
      lang={deck.lang} voiced={voiced} reviewUrl={reviewUrl} initial={drill.initial} onStudied={applyStudy} onClose={() => { setDrill(null); setNow(Date.now()); }} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href={"/workspace/workshop?exam=" + deck.exam}><Icon name="arrow" size={15} className={styles.backIcon} />Workshop</Link>

    <header className={styles.hero}>
      <div className={styles.heroMain}>
        <p className={styles.eyebrow}>{deck.exam.toUpperCase()} · {kanji ? "ханз" : "үгсийн сан"}</p>
        <h1>{deck.title}</h1>
        <dl className={styles.heroStats}>
          <div><dt>{kanji ? "Ханз" : "Үг"}</dt><dd>{words.length}</dd></div>
          {hanzi ? <div><dt>Ханз</dt><dd>{deck.lessons.reduce((sum, item) => sum + (item.chars?.length ?? 0), 0)}</dd></div> : null}
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
          return <li key={item.id}><button type="button" aria-current={item.id === current.id ? "true" : undefined} onClick={() => goLesson(item.id)}>
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
            <p className={styles.lessonMeta}>{lessonWords.length} {unit}{lessonChars.length ? ` · ${lessonChars.length} шинэ ханз` : ""} · {learned(lessonWords)} үзсэн · {mastered(lessonWords)} цээжилсэн</p>
          </div>
          <div className={styles.lessonActions}>
            <button type="button" className={styles.primary} onClick={lessonQuiz}>Энэ хичээлийн quiz</button>
          </div>
        </div>
        <div className={styles.lessonBar}>
          <div className={styles.tabs} role="tablist" aria-label="Хичээлийн харагдац">
            <button type="button" role="tab" aria-selected={tab === "words"} onClick={() => setTab("words")}>{kanji ? "Ханз" : "Үгс"}</button>
            {hanzi ? <button type="button" role="tab" aria-selected={tab === "chars"} onClick={() => setTab("chars")}>Ханз</button> : null}
            <button type="button" role="tab" aria-selected={tab === "cards"} onClick={() => setTab("cards")}>Карт</button>
          </div>
          <div className={styles.toggles}>
            <button type="button" className={styles.toggle} aria-pressed={reading} onClick={toggleReading}>{label}</button>
            {deck.exam === "jlpt" ? <button type="button" className={styles.toggle} aria-pressed={romaji} onClick={toggleRomaji}>Romaji</button> : null}
          </div>
        </div>

        {tab === "cards" ? <StudyCard words={lessonWords} now={now} canSpeak={kanji ? () => false : canSpeak} reviewUrl={reviewUrl} onStudied={applyStudy}
          onQuiz={launch => launch.start ? review() : setDrill({ groups: [current.id], initial: null })} /> : null}

        <section className={styles.words} aria-labelledby="deck-words-heading" hidden={tab !== "words"}>
          <h2 id="deck-words-heading" className="sr-only">{current.title}: {kanji ? "ханз" : "үгс"}</h2>
          {/* An open card keeps its place; its example opens as a full-width panel after the last card of its row, with a
              pointer under the card. (Spanning the card itself across the row left the cards before it alone on theirs.) */}
          <ul ref={listRef}>{current.words.map((word, index) => {
            const shown = words.find(item => item.id === word.id)!;
            const expanded = open === word.id;
            return <Fragment key={word.id}><li data-open={expanded ? "true" : undefined}>
              {kanji ? <button type="button" className={styles.wordMain} aria-expanded={expanded} aria-controls={expanded ? "deck-word-example" : undefined} onClick={() => setOpen(expanded ? null : word.id)}>
                <span className={`${styles.term} ${styles.kanji}`} lang={deck.lang}>{word.term}</span>
                {reading ? <span className={styles.kanjiReadings}>
                  {word.on?.length ? <span><abbr title="On уншлага">on</abbr><span lang="ja-Kana" className={styles.readingList}>{word.on.map(item => <span key={item}>{item}</span>)}</span></span> : null}
                  {word.kun?.length ? <span><abbr title="Kun уншлага">kun</abbr><span lang="ja-Hira" className={styles.readingList}>{word.kun.map(item => <span key={item}>{item}</span>)}</span></span> : null}
                </span> : null}
                {romaji && word.romaji ? <span className={`${styles.reading} ${styles.romaji}`} lang="ja-Latn">{word.romaji}</span> : null}
                <span className={styles.meaning}>{word.meaning}</span>
              </button> : <button type="button" className={styles.wordMain} aria-expanded={expanded} aria-controls={expanded ? "deck-word-example" : undefined} onClick={() => setOpen(expanded ? null : word.id)}>
                <span className={styles.term} lang={deck.lang}>{word.term}</span>
                {(reading && word.reading !== word.term) || (romaji && word.romaji) || word.pronunciation ? <span className={styles.reading}>
                  {word.pronunciation ? <span lang="ko" title="Дуудлага">[{word.pronunciation}]</span> : null}
                  {reading && word.reading !== word.term ? <span lang={readingLang}>{word.reading}</span> : null}
                  {romaji && word.romaji ? <span className={styles.romaji} lang="ja-Latn">{word.romaji}</span> : null}
                </span> : null}
                <span className={styles.meaning}>{word.meaning}</span>
              </button>}
              <div className={styles.wordFoot}>
                <Level word={shown} now={now} />
                {voiced ? <button type="button" className={styles.speak} onClick={() => speak(word.term, deck.lang)} aria-label={`${word.term} сонсох`} title="Сонсох"><Icon name="sound" size={16} /></button> : null}
              </div>
            </li>
            {opened && index === rowEnd && kanji ? <li id="deck-word-example" className={styles.example} aria-label={`${opened.term}: жишээ үгс`}
              style={{ "--col": openIndex % columns, "--cols": columns } as CSSProperties}>
              <ul className={styles.kanjiExamples}>{(opened.examples ?? []).map(item => <li key={item.word}>
                <p lang={deck.lang}>{item.word}{wordsVoiced ? <button type="button" className={styles.speakSmall} onClick={() => speak(item.word, deck.lang)} aria-label={`${item.word} сонсох`}><Icon name="sound" size={14} /></button> : null}</p>
                {reading ? <p className={styles.exampleReading} lang="ja-Hira">{item.reading}</p> : null}
                {romaji ? <p className={styles.exampleReading} lang="ja-Latn">{item.romaji}</p> : null}
                <p className={styles.exampleMeaning}>{item.meaning}</p>
              </li>)}</ul>
            </li> : opened && index === rowEnd ? <li id="deck-word-example" className={styles.example} aria-label={`${opened.term}: жишээ өгүүлбэр`}
              style={{ "--col": openIndex % columns, "--cols": columns } as CSSProperties}>
              <p lang={deck.lang}>{opened.example}{voiced ? <button type="button" className={styles.speakSmall} onClick={() => speak(opened.example, deck.lang)} aria-label="Жишээ өгүүлбэрийг сонсох"><Icon name="sound" size={14} /></button> : null}</p>
              {reading ? <p className={styles.exampleReading} lang={readingLang}>{opened.exampleReading}</p> : null}
              {romaji && opened.exampleRomaji ? <p className={styles.exampleReading} lang="ja-Latn">{opened.exampleRomaji}</p> : null}
              <p className={styles.exampleMeaning}>{opened.exampleMeaning}</p>
            </li> : null}</Fragment>;
          })}</ul>
        </section>

        {hanzi ? <section className={styles.words} aria-labelledby="deck-chars-heading" hidden={tab !== "chars"}>
          <h2 id="deck-chars-heading" className="sr-only">{current.title}: шинэ ханз</h2>
          <ul ref={charListRef}>{lessonChars.map((item, index) => {
            const expanded = openChar === item.id;
            return <Fragment key={item.id}><li data-open={expanded ? "true" : undefined}>
              <button type="button" className={styles.wordMain} aria-expanded={expanded} aria-controls={expanded ? "deck-char-words" : undefined} onClick={() => setOpenChar(expanded ? null : item.id)}>
                <span className={`${styles.term} ${styles.kanji}`} lang={deck.lang}>{item.term}</span>
                {reading ? <span className={styles.kanjiReadings}><span lang={readingLang} className={styles.readingList}>{item.readings.map(value => <span key={value}>{value}</span>)}</span></span> : null}
                <span className={styles.meaning}>{item.meaning}</span>
              </button>
            </li>
            {openedChar && index === charRowEnd ? <li id="deck-char-words" className={styles.example} aria-label={`${openedChar.term}: энэ ханзтай үгс`}
              style={{ "--col": openCharIndex % charColumns, "--cols": charColumns } as CSSProperties}>
              <ul className={styles.kanjiExamples}>{openedChar.examples.map(example => <li key={example.word}>
                <p lang={deck.lang}>{example.word}{wordsVoiced ? <button type="button" className={styles.speakSmall} onClick={() => speak(example.word, deck.lang)} aria-label={`${example.word} сонсох`}><Icon name="sound" size={14} /></button> : null}</p>
                {reading ? <p className={styles.exampleReading} lang={readingLang}>{example.reading}</p> : null}
                <p className={styles.exampleMeaning}>{example.meaning}</p>
              </li>)}</ul>
            </li> : null}</Fragment>;
          })}</ul>
        </section> : null}
        <div className={styles.lessonNav}>
          {currentIndex > 0 ? <button type="button" className={styles.secondary} onClick={() => goLesson(deck.lessons[currentIndex - 1].id)}>← Өмнөх хичээл</button> : <span />}
          {currentIndex < deck.lessons.length - 1 ? <button type="button" className={styles.secondary} onClick={() => goLesson(deck.lessons[currentIndex + 1].id)}>Дараах хичээл →</button> : null}
        </div>
        <p className={styles.fine}>{kanji ? "Уншлага, утга AI-аар бэлтгэгдсэн, багшийн хяналт хүлээж буй ноорог. Жишээ үгс голдуу N5, N4 үгсийн сангаас."
          : tab === "chars" ? "Энэ хичээлийн үгсэд анх гарч буй ханз. Pinyin, утга AI-аар бэлтгэгдсэн, багшийн хяналт хүлээж буй ноорог; ханзыг дарахад түүнтэй үгс гарна." : "Утга, жишээ өгүүлбэрүүд AI-аар бэлтгэгдсэн, багшийн хяналт хүлээж буй ноорог."}</p>
      </main>
    </div>
  </div>;
}
