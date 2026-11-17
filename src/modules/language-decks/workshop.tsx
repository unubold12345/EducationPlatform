import Link from "next/link";
import type { DeckSummary, LanguageExam } from "./catalog";
import { READING_LABEL } from "./catalog";

// Workshop → JLPT / HSK: the script/sound basics tile (Kana or Pinyin) first, then one tile per word deck. Server
// component; each page and the review route check the plan again.
const ART: Record<string, string[]> = { "jlpt-n5": ["あ", "日", "食"], "jlpt-n4": ["語", "経", "験"], "hsk-1": ["你", "好", "学"], "hsk-2": ["快", "乐", "旅"] };

const BASICS: Record<LanguageExam, { href: string; art: string[]; tag: string; title: string; text: string }> = {
  jlpt: { href: "/labs/kana", art: ["あ", "ア", "ん"], tag: "Хирагана · Катакана", title: "Үсгийн хүснэгт",
    text: "Хирагана, катаканы бүтэн хүснэгт: дарж сонсох, romaji, мөр мөрөөр карт ба quiz, адилхан үсгийн дасгал." },
  hsk: { href: "/labs/pinyin", art: ["mā", "má", "mǎ"], tag: "Pinyin · аялгуу", title: "Дуудлага ба аялгуу",
    text: "Дөрвөн аялгуу ба сул аялгуу, pinyin-ий бүтэн хүснэгт, HSK 1/2 үгсээр аялгуу таних дасгал." },
};

export function LanguageWorkshop({ exam, decks, open, plans }: { exam: LanguageExam; decks: DeckSummary[]; open: boolean; plans: string[] }) {
  return <>
    <div className="workshop-index-grid wsp-workshop-grid">
      <Link className="workshop-tile" href={open ? BASICS[exam].href : "/workspace/plans"} prefetch={false}>
        <div className="workshop-tile-art workshop-glyphs" aria-hidden="true" lang={exam === "jlpt" ? "ja" : "zh-Latn"}>{BASICS[exam].art.map(glyph => <span key={glyph}>{glyph}</span>)}</div>
        <div className="workshop-tile-body">
          <span className="wsp-tag tone-blue">{BASICS[exam].tag}</span>
          <h2>{BASICS[exam].title}</h2>
          <p>{BASICS[exam].text}</p>
          <span className="text-link">{open ? "Нээх ↗" : `${plans.join(", ")} багцад багтана →`}</span>
        </div>
      </Link>
      {decks.map(deck => {
        const share = deck.words ? Math.round((deck.mastered / deck.words) * 100) : 0;
        return <Link key={deck.id} className="workshop-tile" href={open ? "/labs/words/" + deck.id : "/workspace/plans"} prefetch={false}>
          <div className="workshop-tile-art workshop-glyphs" aria-hidden="true" lang={deck.lang}>{(ART[deck.id] ?? []).map(glyph => <span key={glyph}>{glyph}</span>)}</div>
          <div className="workshop-tile-body">
            <span className="wsp-tag tone-blue">{deck.title} · {deck.words} үг</span>
            <h2>{deck.level} үгсийн сан</h2>
            <p>{deck.lessons} сэдэвт хичээл: {READING_LABEL[exam]}, дуудлага, жишээ өгүүлбэр, карт ба quiz.</p>
            {open && deck.started ? <p className="workshop-progress"><i aria-hidden="true"><b style={{ width: share + "%" }} /></i>{deck.mastered} цээжилсэн{deck.due ? ` · ${deck.due} давтах` : ""}</p> : null}
            <span className="text-link">{open ? (deck.started ? "Үргэлжлүүлэх ↗" : "Суралцаж эхлэх ↗") : `${plans.join(", ")} багцад багтана →`}</span>
          </div>
        </Link>;
      })}
    </div>
    {!open ? <p className="wsp-muted workshop-note">{exam.toUpperCase()}-ийн хэсгүүд {plans.join(", ")} багцад багтана.</p> : null}
  </>;
}
