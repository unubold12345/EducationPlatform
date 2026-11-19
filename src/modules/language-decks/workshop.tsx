import Link from "next/link";
import type { DeckSummary, LanguageExam } from "./catalog";
import { READING_LABEL } from "./catalog";

// Workshop → JLPT / HSK / TOPIK: the script/sound basics tile (Kana, Pinyin or Hangul) first, then one tile per word deck. Server
// component; each page and the review route check the plan again.
const ART: Record<string, string[]> = { "jlpt-n5": ["あ", "日", "食"], "jlpt-n4": ["語", "経", "験"], "jlpt-kanji-n5": ["山", "川", "木"], "jlpt-kanji-n4": ["春", "夏", "秋"], "hsk-1": ["你", "好", "学"], "hsk-2": ["快", "乐", "旅"], "topik-1": ["가", "족", "밥"], "topik-2": ["경", "제", "환"] };

const BASICS: Record<LanguageExam, { href: string; art: string[]; tag: string; title: string; text: string }> = {
  jlpt: { href: "/labs/kana", art: ["あ", "ア", "ん"], tag: "Хирагана · Катакана", title: "Үсгийн хүснэгт",
    text: "Хирагана, катаканы бүтэн хүснэгт: дарж сонсох, romaji, мөр мөрөөр карт ба quiz, адилхан үсгийн дасгал." },
  hsk: { href: "/labs/pinyin", art: ["mā", "má", "mǎ"], tag: "Pinyin · аялгуу", title: "Дуудлага ба аялгуу",
    text: "Дөрвөн аялгуу ба сул аялгуу, pinyin-ий бүтэн хүснэгт, HSK 1/2 үгсээр аялгуу таних дасгал." },
  topik: { href: "/labs/hangul", art: ["한", "글", "ㄱ"], tag: "Хангыль · 한글", title: "Үсэг ба дуудлага",
    text: "Эгшиг, гийгүүлэгч, үеийн хүснэгт, патчим ба дуудлагын дүрэм: дарж сонсох, мөр мөрөөр quiz." },
};

// Унших дасгал (2026-11-19): an AI-written text to read, no questions, and under it the mocks' reading with questions.
const READING: Record<LanguageExam, { art: string[]; text: string }> = {
  jlpt: { art: ["読", "む", "ア"], text: "AI-ийн бичсэн богино текстийг ふりがな, орчуулгатай уншина. Mock-уудын 読解 хэсгийг асуулттай нь ажиллана." },
  hsk: { art: ["读", "书", "字"], text: "AI-ийн бичсэн богино текстийг pinyin, орчуулгатай уншина. Mock-уудын 阅读 хэсгийг асуулттай нь ажиллана." },
  topik: { art: ["읽", "기", "글"], text: "AI-ийн бичсэн богино текстийг romanization, орчуулгатай уншина. Mock-уудын 읽기 хэсгийг асуулттай нь ажиллана." },
};
// Бичих (2026-11-19): the mocks' writing items; JLPT has no writing paper.
const WRITING: Partial<Record<LanguageExam, { art: string[]; text: string }>> = {
  hsk: { art: ["写", "汉", "字"], text: "HSK 2 mock-уудын 书写 хэсэг: ханзны бүрэлдэхүүн сонгох, pinyin-аар ханз бичих." },
  topik: { art: ["쓰", "기", "글"], text: "TOPIK Ⅱ mock-уудын 쓰기 51–54: өгүүлбэр нөхөх, график тайлбарлах, эссэ бичих." },
};

export function LanguageWorkshop({ exam, decks, open, plans }: { exam: LanguageExam; decks: DeckSummary[]; open: boolean; plans: string[] }) {
  return <>
    <div className="workshop-index-grid wsp-workshop-grid">
      <Link className="workshop-tile" href={open ? BASICS[exam].href : "/workspace/plans"} prefetch={false}>
        <div className="workshop-tile-art workshop-glyphs" aria-hidden="true" lang={exam === "jlpt" ? "ja" : exam === "hsk" ? "zh-Latn" : "ko"}>{BASICS[exam].art.map(glyph => <span key={glyph}>{glyph}</span>)}</div>
        <div className="workshop-tile-body">
          <span className="wsp-tag tone-blue">{BASICS[exam].tag}</span>
          <h2>{BASICS[exam].title}</h2>
          <p>{BASICS[exam].text}</p>
          <span className="text-link">{open ? "Нээх ↗" : `${plans.join(", ")} багцад багтана →`}</span>
        </div>
      </Link>
      {decks.map(deck => {
        const share = deck.words ? Math.round((deck.mastered / deck.words) * 100) : 0;
        const kanji = deck.kind === "kanji";
        return <Link key={deck.id} className="workshop-tile" href={open ? "/labs/words/" + deck.id : "/workspace/plans"} prefetch={false}>
          <div className="workshop-tile-art workshop-glyphs" aria-hidden="true" lang={deck.lang}>{(ART[deck.id] ?? []).map(glyph => <span key={glyph}>{glyph}</span>)}</div>
          <div className="workshop-tile-body">
            <span className="wsp-tag tone-blue">{kanji ? `${exam.toUpperCase()} ${deck.level} · ${deck.words} ханз` : `${deck.title} · ${deck.words} үг`}</span>
            <h2>{deck.level} {kanji ? "ханз" : "үгсийн сан"}</h2>
            <p>{kanji ? `${deck.lessons} сэдэвт хичээл: on/kun уншлага, утга, жишээ үг, карт ба quiz.` : `${deck.lessons} сэдэвт хичээл: ${READING_LABEL[exam]}, дуудлага, жишээ өгүүлбэр, карт ба quiz.`}</p>
            {open && deck.started ? <p className="workshop-progress"><i aria-hidden="true"><b style={{ width: share + "%" }} /></i>{deck.mastered} цээжилсэн{deck.due ? ` · ${deck.due} давтах` : ""}</p> : null}
            <span className="text-link">{open ? (deck.started ? "Үргэлжлүүлэх ↗" : "Суралцаж эхлэх ↗") : `${plans.join(", ")} багцад багтана →`}</span>
          </div>
        </Link>;
      })}
      <Link className="workshop-tile" href={open ? "/labs/reading/" + exam : "/workspace/plans"} prefetch={false}>
        <div className="workshop-tile-art workshop-glyphs" aria-hidden="true" lang={exam === "jlpt" ? "ja" : exam === "hsk" ? "zh" : "ko"}>{READING[exam].art.map(glyph => <span key={glyph}>{glyph}</span>)}</div>
        <div className="workshop-tile-body">
          <span className="wsp-tag tone-blue">Унших · AI ба mock</span>
          <h2>Унших дасгал</h2>
          <p>{READING[exam].text}</p>
          <span className="text-link">{open ? "Уншиж эхлэх ↗" : `${plans.join(", ")} багцад багтана →`}</span>
        </div>
      </Link>
      {WRITING[exam] ? <Link className="workshop-tile" href={open ? "/labs/writing/" + exam : "/workspace/plans"} prefetch={false}>
        <div className="workshop-tile-art workshop-glyphs" aria-hidden="true" lang={exam === "hsk" ? "zh" : "ko"}>{WRITING[exam].art.map(glyph => <span key={glyph}>{glyph}</span>)}</div>
        <div className="workshop-tile-body">
          <span className="wsp-tag tone-blue">Бичих · mock</span>
          <h2>Бичих дасгал</h2>
          <p>{WRITING[exam].text}</p>
          <span className="text-link">{open ? "Бичиж эхлэх ↗" : `${plans.join(", ")} багцад багтана →`}</span>
        </div>
      </Link> : null}
    </div>
    {!open ? <p className="wsp-muted workshop-note">{exam.toUpperCase()}-ийн хэсгүүд {plans.join(", ")} багцад багтана.</p> : null}
  </>;
}
