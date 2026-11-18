"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import { speak, useVoices } from "@/modules/vocabulary/speech";
import { Modal } from "@/modules/vocabulary/modal";
import { STUDY_BOX_MAX } from "@/modules/vocabulary/study";
import type { DeckLesson, DeckProgress, LanguageDeck } from "./catalog";
import { KanaQuiz, type KanaTestRun } from "./kana-quiz";
import { buildKanaTest, KANA_TEST_COUNTS, type KanaLetter, type KanaTestCount } from "./kana-test";
import { BASIC_CONSONANTS, BASIC_VOWELS, COMPOUND_VOWELS, TENSE_CONSONANTS, compose, letterRoman, pronounce, romanize } from "./hangul";
import styles from "./decks.module.css";
import own from "./hangul.module.css";

// Workshop → TOPIK → Hangul (2026-11-18, like Kana for JLPT and Pinyin for HSK): the letters, the syllable chart, final
// consonants and the sound-change rules; clicking plays the browser's Korean voice. The test is the Kana test (owner rule
// for letters: "simple", setup in a modal): a syllable and four romanizations, from the chosen parts of the "hangul" deck.
const LANG = "ko-KR";
const VOWEL_NOTE: Record<string, string> = {
  "ㅏ": "а", "ㅑ": "я", "ㅓ": "амаа ангайсан, уруул дугуйлахгүй «о»", "ㅕ": "«ё», ㅓ шиг нээлттэй", "ㅗ": "уруулаа дугуйлсан «о»",
  "ㅛ": "«ё», ㅗ шиг уруул дугуй", "ㅜ": "у", "ㅠ": "ю", "ㅡ": "«ы», уруулаа татаж", "ㅣ": "и",
  "ㅐ": "«э», ам арай том", "ㅒ": "«йэ»", "ㅔ": "«э»; ярианд ㅐ-тэй бараг ижил", "ㅖ": "«йэ»", "ㅘ": "ㅗ + ㅏ: «ва»", "ㅙ": "ㅗ + ㅐ: «вэ»",
  "ㅚ": "ярианд «вэ»", "ㅝ": "ㅜ + ㅓ: «во»", "ㅞ": "ㅜ + ㅔ: «вэ»", "ㅟ": "ㅜ + ㅣ: «ви»", "ㅢ": "ㅡ + ㅣ; үгийн дунд ихэвчлэн «и»",
};
const CONSONANT_NAME: Record<string, string> = {
  "ㄱ": "기역", "ㄴ": "니은", "ㄷ": "디귿", "ㄹ": "리을", "ㅁ": "미음", "ㅂ": "비읍", "ㅅ": "시옷", "ㅇ": "이응", "ㅈ": "지읒", "ㅊ": "치읓",
  "ㅋ": "키읔", "ㅌ": "티읕", "ㅍ": "피읖", "ㅎ": "히읗", "ㄲ": "쌍기역", "ㄸ": "쌍디귿", "ㅃ": "쌍비읍", "ㅆ": "쌍시옷", "ㅉ": "쌍지읒",
};
const CONSONANT_NOTE: Record<string, string> = {
  "ㄱ": "эхэнд «к» ба «г»-ийн дунд, эгшиг хооронд «г»", "ㄷ": "эхэнд «т» ба «д»-ийн дунд", "ㄹ": "эгшгийн өмнө нэг цохилттой «р», төгсгөлд «л»",
  "ㅂ": "эхэнд «п» ба «б»-ийн дунд", "ㅅ": "«с»; ㅣ, ㅑ, ㅕ, ㅛ, ㅠ-гийн өмнө «ш» шиг", "ㅇ": "эхэнд дуугүй, төгсгөлд «нг»", "ㅈ": "«ж» ба «ч»-ийн дунд",
  "ㅊ": "амьсгалтай «ч»", "ㅋ": "амьсгалтай «к»", "ㅌ": "амьсгалтай «т»", "ㅍ": "амьсгалтай «п»", "ㅎ": "зөөлөн «х»",
  "ㄲ": "чанга, амьсгалгүй «к»", "ㄸ": "чанга, амьсгалгүй «т»", "ㅃ": "чанга, амьсгалгүй «п»", "ㅆ": "чанга «с»", "ㅉ": "чанга «ч»",
};
// Plain, aspirated and tense: the contrast Mongolian has no letters for.
const TRIPLETS = [["가", "카", "까"], ["다", "타", "따"], ["바", "파", "빠"], ["자", "차", "짜"], ["사", "", "싸"]] as const;
const FINAL_SOUNDS = [
  { sound: "ㄱ", letters: "ㄱ ㅋ ㄲ", words: ["책", "부엌", "밖"] },
  { sound: "ㄴ", letters: "ㄴ", words: ["산", "눈"] },
  { sound: "ㄷ", letters: "ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ", words: ["옷", "낮", "꽃", "밭"] },
  { sound: "ㄹ", letters: "ㄹ", words: ["물", "길"] },
  { sound: "ㅁ", letters: "ㅁ", words: ["밤", "감"] },
  { sound: "ㅂ", letters: "ㅂ ㅍ", words: ["밥", "앞"] },
  { sound: "ㅇ", letters: "ㅇ", words: ["방", "강"] },
] as const;
const RULES = [
  { name: "Холбох (연음)", text: "Төгсгөлийн гийгүүлэгч дараагийн эгшиг рүү шилжинэ.", words: ["한국어", "음악", "읽어요"] },
  { name: "ㅎ сулрах", text: "Эгшгийн өмнө төгсгөлийн ㅎ дуудагдахгүй.", words: ["좋아요", "많이"] },
  { name: "Хамрын авиа (비음화)", text: "ㄱ, ㄷ, ㅂ төгсгөл ㄴ, ㅁ-ийн өмнө ㅇ, ㄴ, ㅁ болно.", words: ["합니다", "먹는", "십만"] },
  { name: "ㄹ болох (유음화)", text: "ㄴ ба ㄹ зэрэгцвэл хоёулаа ㄹ болно.", words: ["신라", "설날"] },
  { name: "Амьсгалтай болох (격음화)", text: "ㄱ, ㄷ, ㅂ, ㅈ ба ㅎ нийлж ㅋ, ㅌ, ㅍ, ㅊ болно.", words: ["축하", "좋다", "입학"] },
  { name: "Зөөлрөх (구개음화)", text: "ㄷ, ㅌ төгсгөл 이-гийн өмнө ㅈ, ㅊ болно.", words: ["같이", "굳이"] },
] as const;
const SECTIONS = [{ id: "letters", label: "Үсэг" }, { id: "chart", label: "Үеийн хүснэгт" }, { id: "finals", label: "Патчим ба дүрэм" }] as const;
type Section = (typeof SECTIONS)[number]["id"];
const TEST_PARTS = [{ id: "vowels", label: "Эгшиг" }, { id: "consonants", label: "Гийгүүлэгч" }, { id: "tense", label: "Давхар" }, { id: "finals", label: "Патчим" }] as const;
type TestPart = (typeof TEST_PARTS)[number]["id"];
const TENSE_ROWS = new Set(["row-ㄲ", "row-ㄸ", "row-ㅃ", "row-ㅆ", "row-ㅉ"]);
const partOf = (lesson: DeckLesson): TestPart => lesson.id === "vowels" || lesson.id === "compound" ? "vowels" : lesson.id === "finals" ? "finals" : TENSE_ROWS.has(lesson.id) ? "tense" : "consonants";
/** The deck's syllables as test letters. Every lesson is one chart row, so `section` is the same for all. */
const hangulLetters = (deck: LanguageDeck, parts: ReadonlySet<TestPart>): KanaLetter[] => deck.lessons.filter(lesson => parts.has(partOf(lesson))).flatMap(lesson =>
  lesson.words.map(word => ({ id: word.id, deckId: deck.id, kana: word.term, romaji: word.answers?.[0] ?? word.meaning, row: lesson.id, section: "basic" as const })));

export function HangulStudy({ deck, initialProgress }: { deck: LanguageDeck; initialProgress: Record<string, DeckProgress> }) {
  const [progress, setProgress] = useState(initialProgress);
  const [section, setSection] = useState<Section>("letters");
  const [info, setInfo] = useState<string | null>(null);
  const [setup, setSetup] = useState(false);
  const [testParts, setTestParts] = useState<ReadonlySet<TestPart>>(new Set(["vowels", "consonants"]));
  const [testCount, setTestCount] = useState<KanaTestCount>(20);
  const [run, setRun] = useState<(KanaTestRun & { letters: KanaLetter[]; count: KanaTestCount }) | null>(null);
  const [typed, setTyped] = useState("");
  const { canSpeak } = useVoices();
  const voiced = canSpeak(LANG);
  const play = (text: string) => { setInfo(text); if (voiced) speak(text, LANG); };

  const allLetters = useMemo(() => hangulLetters(deck, new Set(TEST_PARTS.map(part => part.id))), [deck]);
  const letters = hangulLetters(deck, testParts);
  const questionCount = testCount === "all" ? letters.length : Math.min(testCount, letters.length);
  const byTerm = useMemo(() => new Map(deck.lessons.flatMap(lesson => lesson.words.map(word => [word.term, word.id] as const))), [deck]);
  const words = deck.lessons.flatMap(lesson => lesson.words);
  const mastered = words.filter(word => (progress[word.id]?.box ?? 0) >= STUDY_BOX_MAX).length;

  function applyStudy(_deckId: string, updates: StudyUpdate[]) {
    setProgress(previous => ({ ...previous, ...Object.fromEntries(updates.map(item => [item.id, { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: item.reviewedAt, dueAt: item.dueAt }])) }));
  }

  const start = (pool: KanaLetter[], count: KanaTestCount) => { setSetup(false); setRun({ questions: buildKanaTest(pool, count, allLetters), startedAt: Date.now(), letters: pool, count }); };
  const togglePart = (id: TestPart) => setTestParts(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  if (run) {
    return <KanaQuiz key={run.startedAt} run={run} voiced={voiced} lang={LANG} onStudied={applyStudy} onClose={() => setRun(null)}
      onRestart={only => only ? start(only, "all") : start(run.letters, run.count)} />;
  }

  const level = (char: string) => { const id = byTerm.get(char); return id ? progress[id]?.box ?? 0 : 0; };
  const cell = (char: string) => <button type="button" className={styles.kanaCell} data-box={level(char)} aria-pressed={info === char} onClick={() => play(char)} aria-label={`${char} ${romanize(char)}, сонсох`}>
    <span className={styles.kana} lang="ko">{char}</span><span className={styles.kanaRomaji}>{romanize(char)}</span>
    <span className={styles.kanaLevel} aria-hidden="true"><b style={{ width: `${(level(char) / STUDY_BOX_MAX) * 100}%` }} /></span>
  </button>;
  const say = (word: string) => <button key={word} type="button" className={own.word} onClick={() => play(word)} aria-label={`${word} сонсох`}>
    <b lang="ko">{word}</b>{pronounce(word) !== word ? <span lang="ko">[{pronounce(word)}]</span> : null}<small>{romanize(word)}</small>
  </button>;
  const letter = (char: string, note: string, name?: string) => <button key={char} type="button" className={own.letter} onClick={() => play(name ?? compose({ initial: "ㅇ", vowel: char, final: "" }))}
    aria-label={`${char}${name ? " " + name : ""}, сонсох`}>
    <strong lang="ko">{char}</strong><span>{letterRoman(char)}</span>{name ? <small lang="ko">{name}</small> : null}<small>{note}</small>
  </button>;

  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href="/workspace/workshop?exam=topik"><Icon name="arrow" size={15} className={styles.backIcon} />Workshop</Link>
    <header className={styles.head}>
      <div><p className={styles.eyebrow}>TOPIK · үсэг ба дуудлага</p><h1>Хангыль · <span lang="ko">한글</span></h1></div>
      <dl className={styles.stats}>
        <div><dt>Үе</dt><dd>{words.length}</dd></div>
        <div><dt>Цээжилсэн</dt><dd>{mastered}</dd></div>
      </dl>
    </header>

    {setup ? <Modal labelledBy="hangul-test-heading" onClose={() => setSetup(false)} size="narrow"><section className={styles.testModal}>
      <h2 id="hangul-test-heading">Шалгалт</h2>
      <div className={styles.testRow}>
        <span id="hangul-test-parts">Хэсэг</span>
        <div className={styles.testChips} role="group" aria-labelledby="hangul-test-parts">
          {TEST_PARTS.map(part => <button key={part.id} type="button" aria-pressed={testParts.has(part.id)} onClick={() => togglePart(part.id)}>
            {part.label}<small>{hangulLetters(deck, new Set([part.id])).length}</small></button>)}
        </div>
      </div>
      <div className={styles.testRow}>
        <span id="hangul-test-count">Асуулт</span>
        <div className={styles.segment} role="group" aria-labelledby="hangul-test-count">
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
      <nav className={styles.segment} aria-label="Хэсэг">
        {SECTIONS.map(item => <button key={item.id} type="button" aria-pressed={item.id === section} onClick={() => setSection(item.id)}>{item.label}</button>)}
      </nav>
      <button type="button" className={styles.primaryButton} onClick={() => setSetup(true)}>Шалгалт өгөх</button>
    </div>

    <p className={styles.chartInfo} aria-live="polite">{info ? <><b lang="ko">{info}</b> {romanize(info)}</> : "Үсэг, үеийг дарж сонсоорой."}</p>

    {section === "letters" ? <>
      <section className={own.block} aria-labelledby="vowels-heading">
        <h2 id="vowels-heading">Эгшиг</h2>
        <p className={own.lead}>Эгшиг ганцаараа бичигдэхгүй: дуугүй ㅇ-тэй хамт бичнэ (아, 어, 오). Босоо зураас ба богино зураасын байрлал дуудлагыг заана.</p>
        <div className={own.letters}>{BASIC_VOWELS.map(char => letter(char, VOWEL_NOTE[char]))}</div>
        <h3>Нийлмэл эгшиг</h3>
        <div className={own.letters}>{COMPOUND_VOWELS.map(char => letter(char, VOWEL_NOTE[char]))}</div>
      </section>
      <section className={own.block} aria-labelledby="consonants-heading">
        <h2 id="consonants-heading">Гийгүүлэгч</h2>
        <p className={own.lead}>Латин үсэг нь үеийн эхэнд ба төгсгөлд (/) хэрхэн уншигдахыг заана. Дарвал үсгийн нэрийг сонсоно.</p>
        <div className={own.letters}>{BASIC_CONSONANTS.map(char => letter(char, CONSONANT_NOTE[char] ?? "", CONSONANT_NAME[char]))}</div>
        <h3>Давхар гийгүүлэгч</h3>
        <div className={own.letters}>{TENSE_CONSONANTS.map(char => letter(char, CONSONANT_NOTE[char], CONSONANT_NAME[char]))}</div>
        <h3>Энгийн · амьсгалтай · чанга</h3>
        <p className={own.lead}>Монгол хэлэнд байхгүй ялгаа: энгийн (가), амьсгалтай (카), чанга (까). Дарааллаар нь сонсож харьцуул.</p>
        <div className={own.triplets}>{TRIPLETS.map(row => <div key={row[0]}>{row.map((char, index) => char ? say(char) : <span key={index} className={own.gap} />)}</div>)}</div>
      </section>
    </> : null}

    {section === "chart" ? <div className={styles.chartWrap}>
      <table className={styles.chart}>
        <caption className="sr-only">Хангылийн үеийн хүснэгт: гийгүүлэгч × эгшиг</caption>
        <thead><tr><th scope="col"><span className="sr-only">Гийгүүлэгч</span></th>{BASIC_VOWELS.map(vowel => <th key={vowel} scope="col" lang="ko">{vowel}</th>)}</tr></thead>
        <tbody>{[...BASIC_CONSONANTS, ...TENSE_CONSONANTS].map(initial => <tr key={initial}>
          <th scope="row" className={styles.rowName} lang="ko">{initial}</th>
          {BASIC_VOWELS.map(vowel => { const char = compose({ initial, vowel, final: "" }); return <td key={vowel}>{cell(char)}</td>; })}
        </tr>)}</tbody>
      </table>
    </div> : null}

    {section === "finals" ? <>
      <section className={own.block} aria-labelledby="finals-heading">
        <h2 id="finals-heading">Патчим: төгсгөлийн долоон авиа</h2>
        <p className={own.lead}>Үеийн доор бичигдсэн гийгүүлэгчийг патчим (받침) гэнэ. Хэдэн өөр үсэг байсан ч төгсгөлд долоохон авиагаар дуудагдана.</p>
        <div className={own.finals}>{FINAL_SOUNDS.map(row => <div key={row.sound} className={own.finalRow}>
          <span className={own.finalSound}><b lang="ko">{row.sound}</b> [{letterRoman(row.sound).split(" / ").pop()}]</span>
          <span className={own.finalLetters} lang="ko">{row.letters}</span>
          <span className={own.words}>{row.words.map(say)}</span>
        </div>)}</div>
      </section>
      <section className={own.block} aria-labelledby="rules-heading">
        <h2 id="rules-heading">Дуудлагын дүрэм</h2>
        <p className={own.lead}>Бичгээрээ биш, хаалтанд байгаагаар дуудна. Латин бичлэг нь Солонгосын албан ёсны романчлалын (Revised Romanization) үсгээр.</p>
        <div className={own.rules}>{RULES.map(rule => <div key={rule.name}>
          <h3>{rule.name}</h3><p>{rule.text}</p><span className={own.words}>{rule.words.map(say)}</span>
        </div>)}</div>
      </section>
      <section className={own.block} aria-labelledby="try-heading">
        <h2 id="try-heading">Өөрөө шалгах</h2>
        <label className={own.try}><span>Солонгос үг, өгүүлбэр</span>
          <input lang="ko" value={typed} maxLength={80} onChange={event => setTyped(event.target.value)} placeholder="예: 감사합니다" />
        </label>
        {/[가-힣]/.test(typed) ? <p className={own.tryOut}><span lang="ko">[{pronounce(typed)}]</span> <b>{romanize(typed)}</b>
          {voiced ? <button type="button" className={styles.ghostButton} onClick={() => speak(typed, LANG)}>Сонсох</button> : null}</p> : null}
        <p className={styles.fine}>Дүрмээр тооцсон дуудлага; чангарах авиаг (읽다 [익따]) тэмдэглэхгүй.</p>
      </section>
    </> : null}
    <p className={styles.fine}>Дууг хөтчийн солонгос хоолой уншина; хоолой хөтөч, төхөөрөмжөөс хамаарна.</p>
  </div>;
}
