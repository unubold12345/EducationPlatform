export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { isLanguageExam, WORKSHOP_EXAM_COOKIE, WORKSHOP_EXAMS, type WorkshopExam } from "@/modules/language-decks/catalog";
import { ExamTabs } from "@/modules/language-decks/exam-tabs";
import { deckSummaries, hasLanguageStudy, languageStudyPlans } from "@/modules/language-decks/service";
import { LanguageWorkshop } from "@/modules/language-decks/workshop";
import { listeningLabEnabled, readingLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { PartnerMark } from "@/modules/speaking-lab/partner";
import { domainTrends } from "@/modules/eesh-workshop/contracts";
import { eeshSubjects } from "@/modules/eesh-workshop/insights";
import { EeshTileChart } from "@/modules/eesh-workshop/tile-chart";
export const metadata: Metadata = { title: "Workshop" };

const isExam = (value: unknown): value is WorkshopExam => WORKSHOP_EXAMS.some(exam => exam.id === value);
const LEAD: Record<WorkshopExam, string> = {
  ielts: "AI хамтрагчтай ярих, эссэгээ засуулах, сонсгол, уншлагаа дасгалжуулах лабораториуд.",
  toefl: "TOEFL iBT-ийн ярих, бичих даалгаврыг дасгалжуулж, mock-уудын сонсгол, уншлагыг цаггүй ажиллах лабораториуд.",
  jlpt: "Хирагана, катаканы хүснэгт, JLPT N5, N4 түвшний үгсийн сан ба ханз: ふりがな, romaji, on/kun уншлага, карт ба quiz, унших дасгал.",
  hsk: "Pinyin ба аялгуу, HSK 1, 2 түвшний үгсийн сан ба ханз: дуудлага, жишээ өгүүлбэр, карт ба quiz, унших дасгал.",
  topik: "Хангыль үсэг ба дуудлагын дүрэм, TOPIK Ⅰ, Ⅱ түвшний үгсийн сан: дуудлага, жишээ өгүүлбэр, карт ба quiz, унших дасгал.",
  eesh: "ЭЕШ-ийн таван хичээл: жил бүрийн бүтэц, сэдвийн оноо хэрхэн өөрчлөгдсөн, хамгийн их давтагддаг даалгавар, бүх жилийн mock-оос сэдвээр 10 асуултын дасгал.",
};

// The IELTS and TOEFL tabs' tiles share their pictures; the essay sheet's badge shows each exam's score.
const writeArt = (score: string) => <div className="workshop-tile-art"><svg className="workshop-paper" viewBox="0 0 240 200" role="img" aria-label="Засвар тэмдэглэсэн эссэгийн хуудас"><rect x="44" y="18" width="152" height="182" rx="14" className="sheet" /><rect x="62" y="44" width="92" height="7" rx="3.5" className="ink" /><rect x="62" y="66" width="116" height="5" rx="2.5" className="line" /><rect x="62" y="82" width="38" height="5" rx="2.5" className="line" /><rect x="106" y="80" width="40" height="9" rx="3" className="mark" /><path d="M106 84.5h40" className="strike" /><rect x="152" y="82" width="26" height="5" rx="2.5" className="line" /><rect x="104" y="96" width="46" height="8" rx="4" className="fix" /><rect x="62" y="116" width="108" height="5" rx="2.5" className="line" /><rect x="62" y="132" width="116" height="5" rx="2.5" className="line" /><rect x="62" y="148" width="70" height="5" rx="2.5" className="line" /><circle cx="190" cy="40" r="22" className="badge" /><text x="190" y="46" textAnchor="middle" className="band">{score}</text><path d="M28 150l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" className="spark" /></svg></div>;
const LISTEN_ART = <div className="workshop-tile-art"><svg className="workshop-listen" viewBox="0 0 240 200" role="img" aria-label="Чихэвч ба дууны долгион"><path d="M64 118v-18a56 56 0 0 1 112 0v18" className="band-arc" /><rect x="50" y="112" width="30" height="50" rx="12" className="cup" /><rect x="160" y="112" width="30" height="50" rx="12" className="cup" />{[0, 1, 2, 3, 4, 5, 6].map(i => <rect key={i} x={95 + i * 8} y={137 - [10, 18, 28, 36, 26, 16, 8][i] / 2} width="4" height={[10, 18, 28, 36, 26, 16, 8][i]} rx="2" className="wave" />)}<circle cx="190" cy="44" r="22" className="badge" /><path d="M184 34v20l16-10z" className="play" /></svg></div>;
const READ_ART = <div className="workshop-tile-art"><svg className="workshop-read" viewBox="0 0 240 200" role="img" aria-label="Тэмдэглэгээтэй нээлттэй ном"><path d="M120 62c-19-11-45-14-72-10v104c27-4 53-1 72 10z" className="page" /><path d="M120 62c19-11 45-14 72-10v104c-27-4-53-1-72 10z" className="page" /><path d="M120 62v104" className="spine" />{[0, 1, 2, 3, 4].map(i => <rect key={"l" + i} x="60" y={76 + i * 14} width={[44, 50, 38, 48, 30][i]} height="5" rx="2.5" className="line" />)}<rect x="131" y="87" width="54" height="12" rx="3" className="hl" />{[0, 1, 2, 3, 4].map(i => <rect key={"r" + i} x="134" y={76 + i * 14} width={[42, 48, 50, 36, 44][i]} height="5" rx="2.5" className="line" />)}<circle cx="194" cy="42" r="22" className="badge" /><path d="m184 42 7 7 13-14" className="tick" /></svg></div>;

// One tab per exam (owner rule 2026-11-18): ?exam= picks it, otherwise the last tab chosen (cookie), otherwise IELTS.
export default async function WorkspaceWorkshop({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const asked = (await searchParams).exam, stored = (await cookies()).get(WORKSHOP_EXAM_COOKIE)?.value;
  const exam: WorkshopExam = isExam(asked) ? asked : isExam(stored) ? stored : "ielts";
  if (isLanguageExam(exam)) {
    const session = await getSession();
    const open = session ? await hasLanguageStudy(session.user.id, exam) : false;
    const decks = await deckSummaries(session?.user.id ?? "", exam);
    return <div className="wsp-page workshop-index">
      <header className="wsp-page-head"><div><h1 className="sr-only">Workshop · {exam.toUpperCase()}</h1><p>{LEAD[exam]}</p></div></header>
      <ExamTabs current={exam} />
      <LanguageWorkshop exam={exam} decks={decks} open={open} plans={languageStudyPlans(exam)} />
    </div>;
  }
  // ЭЕШ (owner request 2026-11-20): one tile per subject, its art the subject's topic points by year. Open to everyone; the
  // subject page's drill uses the student's own mock access.
  if (exam === "eesh") return <div className="wsp-page workshop-index">
    <header className="wsp-page-head"><div><h1 className="sr-only">Workshop · ЭЕШ</h1><p>{LEAD.eesh}</p></div></header>
    <ExamTabs current="eesh" />
    <div className="workshop-index-grid wsp-workshop-grid">
      {eeshSubjects().map(insights => {
        const riser = domainTrends(insights).filter(trend => trend.delta > 0).sort((a, b) => b.delta - a.delta)[0];
        return <Link key={insights.subject} className="workshop-tile" href={"/labs/eesh/" + insights.subject} prefetch={false}>
          <div className="workshop-tile-art"><EeshTileChart insights={insights} /></div>
          <div className="workshop-tile-body"><span className="wsp-tag tone-blue">ЭЕШ · {insights.years[0]}–{insights.years.at(-1)} · {insights.papers} mock</span><h2>{insights.label}</h2>
            <p>{riser ? `Сүүлийн жилүүдэд өссөн: ${riser.name} +${riser.delta} оноо. ` : ""}Бүтцийн өөрчлөлт, давтагддаг {insights.topics.length} сэдэв, сэдвээр дасгал.</p>
            <span className="text-link">Харах ↗</span></div>
        </Link>;
      })}
    </div>
  </div>;
  const speaking = speakingLabEnabled(), writing = writingLabEnabled(), listening = listeningLabEnabled(), reading = readingLabEnabled();
  // TOEFL (owner requests 2026-11-19): speaking and writing practice of the 2026 tasks, and the nine mocks' listening
  // and reading without a clock.
  if (exam === "toefl") {
    const toeflTiles = [speaking, writing, listening, reading].filter(Boolean).length;
    return <div className="wsp-page workshop-index">
      <header className="wsp-page-head"><div><h1 className="sr-only">Workshop · TOEFL</h1><p>{LEAD.toefl}</p></div></header>
      <ExamTabs current="toefl" />
      {toeflTiles ? <div className={"workshop-index-grid wsp-workshop-grid" + (toeflTiles === 4 ? " is-four" : "")}>
        {speaking && <Link className="workshop-tile" href="/labs/toefl-speaking" prefetch={false}><div className="workshop-tile-art"><PartnerMark voice="am_michael" wide className="workshop-partner" label="Ярилцагчийн дууны долгион" /></div><div className="workshop-tile-body"><span className="wsp-tag tone-violet">Speaking · TOEFL iBT</span><h2>Ярих дадлага</h2><p>Listen and Repeat: өгүүлбэр сонсоод давтана. Take an Interview: 4 асуултад 45 секунд хариулаад AI тайлан авна.</p><span className="text-link">Ярьж эхлэх ↗</span></div></Link>}
        {writing && <Link className="workshop-tile" href="/labs/toefl-writing" prefetch={false}>{writeArt("5")}<div className="workshop-tile-body"><span className="wsp-tag tone-green">Writing · TOEFL iBT</span><h2>Бичих студи</h2><p>Build a Sentence, Write an Email, Academic Discussion: ETS-ийн 0–5 шалгуураар засвар, үнэлгээ авна.</p><span className="text-link">Бичиж эхлэх ↗</span></div></Link>}
        {listening && <Link className="workshop-tile" href="/labs/toefl-listening" prefetch={false}>{LISTEN_ART}<div className="workshop-tile-body"><span className="wsp-tag tone-blue">Listening · TOEFL iBT</span><h2>Сонсгол</h2><p>Есөн mock-ийн Listening: бичлэгийг давтан сонсоод хариулж, шалгасны дараа текстийг нь уншина.</p><span className="text-link">Сонсож эхлэх ↗</span></div></Link>}
        {reading && <Link className="workshop-tile" href="/labs/toefl-reading" prefetch={false}>{READ_ART}<div className="workshop-tile-body"><span className="wsp-tag tone-amber">Reading · TOEFL iBT</span><h2>Уншлага</h2><p>Есөн mock-ийн Reading: Complete the Words, Daily Life, Academic Passage, асуулт бүрийн тайлбартай.</p><span className="text-link">Уншиж эхлэх ↗</span></div></Link>}
      </div> : <div className="admin-empty"><p>Workshop одоогоор идэвхгүй байна.</p></div>}
    </div>;
  }
  const tiles = [speaking, writing, listening, reading].filter(Boolean).length;
  return <div className="wsp-page workshop-index">
    <header className="wsp-page-head"><div><h1 className="sr-only">Workshop</h1><p>{LEAD.ielts}</p></div></header>
    <ExamTabs current="ielts" />
    {tiles ? <div className={"workshop-index-grid wsp-workshop-grid" + (tiles === 4 ? " is-four" : "")}>
      {speaking && <Link className="workshop-tile" href="/labs/ielts-speaking" prefetch={false}><div className="workshop-tile-art"><PartnerMark voice="af_heart" wide className="workshop-partner" label="Ярианы хамтрагчийн дууны долгион" /></div><div className="workshop-tile-body"><span className="wsp-tag tone-violet">Speaking · AI хамтрагч</span><h2>Ярианы хамтрагч</h2><p>IELTS Speaking-ийн 3 хэсгийг AI хамтрагчтай бодитоор ярьж дасгалжуулна.</p><span className="text-link">Ярианы бэлтгэл эхлэх ↗</span></div></Link>}
      {writing && <Link className="workshop-tile" href="/labs/ielts-writing" prefetch={false}>{writeArt("7.0")}<div className="workshop-tile-body"><span className="wsp-tag tone-green">Writing · AI засвар</span><h2>Эссэ бичих студи</h2><p>Task 2 эссэ, захидал бичээд дүрэм, үгийн сан, бүтцийн засвар авна.</p><span className="text-link">Бичиж эхлэх ↗</span></div></Link>}
      {listening && <Link className="workshop-tile" href="/labs/ielts-listening" prefetch={false}>{LISTEN_ART}<div className="workshop-tile-body"><span className="wsp-tag tone-blue">Listening · IELTS Part 1–4</span><h2>Сонсгол лаб</h2><p>Таван бүтэн сонсголын тест ба IELTS mock-уудын сонсгол: давтан сонсох, хурд тохируулах, текстээр шалгах.</p><span className="text-link">Сонсож эхлэх ↗</span></div></Link>}
      {reading && <Link className="workshop-tile" href="/labs/ielts-reading" prefetch={false}>{READ_ART}<div className="workshop-tile-body"><span className="wsp-tag tone-amber">Reading · IELTS Academic</span><h2>Унших лаб</h2><p>5 жишээ текст ба IELTS mock-уудын уншлага. Өөрийн файл, текстээс кредитээр дасгал үүсгэнэ.</p><span className="text-link">Уншиж эхлэх ↗</span></div></Link>}
    </div> : <div className="admin-empty"><p>Workshop одоогоор идэвхгүй байна.</p></div>}
  </div>;
}
