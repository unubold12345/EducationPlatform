export const dynamic="force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { examDefinitions } from "@/modules/exams/definitions";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { entranceCounts, entranceTotal } from "@/modules/exams/entrance/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import "./library.css";
export const metadata:Metadata={title:"Бүтэн шалгалтууд"};

type Programme = {
  id: "sat" | "ielts" | "eesh" | "jlpt" | "hsk";
  tone: "sat" | "ielts" | "entrance" | "jlpt" | "hsk";
  /** The exam's full or native name, shown small beside the title when it adds something. */
  sub?: string;
  title: string;
  copy: string;
  facts: { label: string; value: string }[];
  chips: string[];
  subjects?: { label: string; count: number; href: string }[];
  count: number;
  href: string;
  cta: string;
  plan: string;
};

export default async function ExamsPage(){
  const subjects=entranceCounts();
  const sat=examDefinitions.filter(exam=>exam.program==="sat").length;
  const ielts=examDefinitions.filter(exam=>exam.program==="ielts").length;
  const programmes: Programme[]=[
    {
      id:"sat",tone:"sat",title:"Digital SAT",
      copy:"Reading & Writing-ээс Math хүртэл. Модуль бүрийн цаг, завсарлага болон сонгох/тоон хариулттай.",
      facts:[{label:"Агуулга",value:"98 асуулт · 4 модуль"},{label:"Хугацаа",value:"2ц 14м + 10м завсарлага"}],
      chips:["R&W · 64м","Break · 10м","Math · 70м"],
      count:sat,href:"/exams/sat",cta:`${sat} mock үзэх`,plan:"Гадаад хэл",
    },
    {
      id:"ielts",tone:"ielts",title:"IELTS Academic",
      copy:"Listening, Reading, Writing, Speaking. Бичлэг сонсож, эх уншиж, эсээ бичиж, яриагаа бичүүлээрэй.",
      facts:[{label:"Агуулга",value:"80 асуулт + 2 Writing task + Speaking"},{label:"Хугацаа",value:"32м Listening · 60м Reading · 60м Writing · 12м Speaking"}],
      chips:["Listen · 32м","Read · 60м","Write · 60м","Speak · 12м"],
      count:ielts,href:"/exams/ielts",cta:`${ielts} mock үзэх`,plan:"Гадаад хэл",
    },
    {
      id:"eesh",tone:"entrance",sub:"Элсэлтийн ерөнхий шалгалт",title:"ЭЕШ",
      copy:"Математик, физик 2015–2026; хими, биологи 2020–2026; англи хэл 2018–2026. Жил, хувилбараар эрэмбэлсэн бүтэн mock.",
      facts:[{label:"Агуулга",value:"5 хичээл · 100 оноо"},{label:"Хугацаа",value:"80–100 минут"}],
      chips:[],
      subjects:[
        {label:"Математик",count:subjects.math,href:"/exams/eesh?subject=math"},
        {label:"Физик",count:subjects.physics,href:"/exams/eesh?subject=physics"},
        {label:"Хими",count:subjects.chemistry,href:"/exams/eesh?subject=chemistry"},
        {label:"Биологи",count:subjects.biology,href:"/exams/eesh?subject=biology"},
        {label:"Англи хэл",count:subjects.english,href:"/exams/eesh?subject=english"},
      ],
      count:entranceTotal,href:"/exams/eesh",cta:`Бүх ${entranceTotal} mock`,plan:"ЭЕШ",
    },
    {id:"jlpt",tone:"jlpt",sub:"日本語能力試験",title:"JLPT N5・N4",
      copy:"Түвшин бүрт 3 mock. Үгийн сан, хэлзүй, унших ба япон аудиотой сонсох хэсэг. Алдсан чадвараа цаггүй давтаарай.",
      facts:[{label:"Агуулга",value:"N5 · 67 / N4 · 85 асуулт"},{label:"Хугацаа",value:"N5 · 90м / N4 · 115м"}],
      chips:["語彙","文法・読解","聴解"],count:6,href:"/exams/jlpt",cta:"Түвшин сонгох",plan:"Гадаад хэл"},
    {id:"hsk",tone:"hsk",sub:"汉语水平考试",title:"HSK 1",
      copy:"Хятад хэлний анхан шат. Хятад аудиотой сонсох, зурагтай унших даалгавар; бүх ханз pinyin-тэй. Алдсан хэсгээ цаггүй давтаарай.",
      facts:[{label:"Агуулга",value:"40 асуулт · 8 хэсэг"},{label:"Хугацаа",value:"15м сонсох · 17м унших"}],
      chips:["听力 · 15м","阅读 · 17м"],count:hskMocks.length,href:"/exams/hsk",cta:"Mock сонгох",plan:"Гадаад хэл"},
  ];
  return <div className="container page-space library-page">
    <header className="wsp-page-head library-head"><div><h1>Шалгалтууд</h1><p>SAT, IELTS, ЭЕШ, JLPT, HSK-ийн бүтэн mock. Цагтай шалгалтаар өөрийгөө шалгах эсвэл цаггүй, AI туслахтай дадлагаар бэлдээрэй.</p></div><Link className="wsp-link" href="/workspace/review">Миний үр дүн →</Link></header>

    {/* One row per programme (owner request 2026-11-15): what it is, how a sitting runs, what it costs. */}
    <section className="library-list" aria-label="Шалгалтын хөтөлбөрүүд">
      {programmes.map(item => <article className={"exam-card library-row "+item.tone} id={item.id} key={item.id} aria-labelledby={item.id+"-title"}>
        <div className="library-row-name">
          <h2 id={item.id+"-title"}>{item.title}</h2>
          <p className="library-row-count"><strong>{item.count} бүтэн mock</strong>{item.sub?<span>{item.sub}</span>:null}</p>
          <p className="library-row-copy">{item.copy}</p>
        </div>
        <div className="library-row-plan">
          {item.subjects?<nav className="library-subjects" aria-label="ЭЕШ-ийн хичээлүүд">{item.subjects.map(subject=><Link key={subject.href} href={subject.href} aria-label={`${subject.label}: ${subject.count} mock`}><span>{subject.label}</span><strong>{subject.count}</strong></Link>)}</nav>:
            <ol className="library-steps" aria-label="Шалгалтын хэсгүүд">{item.chips.map(chip=><li key={chip}>{chip}</li>)}</ol>}
          <dl className="library-row-facts">{item.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        </div>
        <div className="library-row-buy">
          <div className="exam-price"><strong>{MOCK_PRICE_LABEL}</strong><span>{item.id==="eesh"?`Эсвэл ${item.plan} сарын багц, хязгааргүй`:`Эсвэл ${item.plan} багцаар сард 15 mock`}</span></div>
          <Link className="button" href={item.href}>{item.id==="eesh"?item.cta:"Mock сонгох"} <span aria-hidden="true">→</span></Link>
        </div>
      </article>)}
    </section>

    <footer className="library-note">
      <p>Бүх даалгаврыг энэ сайтад зориулж зохиосон; College Board, IELTS, JLPT, HSK, БҮТ-ийн албан материал биш. SAT, IELTS-ийн албан оноо, band тооцохгүй.</p>
      <div><Link className="text-link" href="/workspace/plans">Сарын багцууд →</Link><Link className="text-link" href="/programs">Хөтөлбөрүүд →</Link></div>
    </footer>
  </div>;
}
