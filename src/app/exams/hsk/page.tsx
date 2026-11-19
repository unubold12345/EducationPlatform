import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { hskMocks, hskSlugs } from '@/modules/exams/hsk/catalog';
import { freeMocksOf } from '@/modules/exams/free/catalog';
import { FreeMockTile } from '@/modules/exams/free/tile';
import { MOCK_PRICE_LABEL } from '@/modules/exams/pricing';
import { hubAccess, hubLabel } from '@/modules/subscriptions/mock-access';
import '@/modules/exams/hsk/hsk.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'HSK 1–2 · Хятад хэл'};
const levels=[
 {level:1,format:'20 сонсох (15 мин) · 20 унших (25 мин) · 40 асуулт · 40 минут'},
 {level:2,format:'25 сонсох (20 мин) · 25 унших (30 мин) · 10 бичих (10 мин) · 60 асуулт · 60 минут'},
];
export default async function HskHub(){
 const session=await getSession();
 const userId=session?.user.id;
 const [practice,attempts]=userId?await Promise.all([
  getDb().practiceSession.findMany({where:{userId,slug:{in:hskSlugs()}},select:{slug:true,results:true}}),
  getDb().mockAttempt.findMany({where:{userId,slug:{in:hskSlugs()},status:'IN_PROGRESS'},select:{id:true,slug:true}}),
 ]):[[],[]];
 // Bought, a plan, or this Гадаад хэл month's pick; the briefing and the API decide again.
 const access=await hubAccess(userId,hskSlugs(),'hsk');
 const free=freeMocksOf('hsk')[0];
 return <div className="container page-space hsk-hub">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <header className="hsk-hub-head"><p className="eyebrow">汉语水平考试 · ХЯТАД ХЭЛ</p><h1>HSK 1–2</h1><p>Хятад хэлний анхан шатны HSK 1, HSK 2 шалгалтын бүтэн mock, 2026 оны HSK 3.0 шинэ бүтэц ба үгийн сангаар (300 + 200 үг). Сонсох хэсэг хятад audio-той, бүх ханз pinyin-тэй; HSK 2-т ханз бичих хэсэг нэмэгдсэн. Хариу, тэмдэглэсэн асуулт, дадлагын явц таны бүртгэлд хадгалагдана.</p></header>
  {free?<FreeMockTile mock={free}/>:null}
  {levels.map(({level,format})=><section key={level} aria-labelledby={'hsk-level-'+level}>
  <h2 className="hsk-level" id={'hsk-level-'+level}>HSK {level}</h2>
  <p className="hsk-format">{format}</p>
  <div className="hsk-cards">{hskMocks.filter(mock=>mock.level===level).map(mock=>{
   const owned=access.practice(mock.slug),active=attempts.find(a=>a.slug===mock.slug);
   const results=practice.find(p=>p.slug===mock.slug)?.results;
   const checked=results&&typeof results==='object'?Object.keys(results).filter(id=>id.startsWith(`hsk${mock.level}-0${mock.number}-`)).length:0;
   return <article className="hsk-card" key={mock.slug}><span className="eyebrow">HSK {mock.level} · MOCK 0{mock.number}</span><h2 lang="zh-CN">{mock.titleZh}</h2><p className="hsk-card-pinyin" lang="zh-Latn-pinyin">{mock.titlePinyin}</p><p>{mock.theme}</p><dl><div><dt>Асуулт</dt><dd>{mock.questions}</dd></div><div><dt>Хугацаа</dt><dd>{mock.minutes} мин</dd></div><div><dt>Сонсох</dt><dd>Хятад audio</dd></div><div><dt>Эрх</dt><dd>{hubLabel(access.state(mock.slug),MOCK_PRICE_LABEL)}</dd></div></dl>
    {checked>0?<div><progress max={mock.questions} value={checked} aria-label="Дадлагын явц"/><p>{checked}/{mock.questions} шалгасан</p></div>:null}
    <Link className="button" href={active?'/exams/attempts/'+active.id:'/exams/'+mock.slug}>{active?'Шалгалтаа үргэлжлүүлэх':'Танилцах / эхлэх'} →</Link>
    {owned?<Link className="text-link" href={'/exams/'+mock.slug+'/practice'}>{checked?'Дадлагаа үргэлжлүүлэх':'Цаггүй дадлага'} →</Link>:null}
   </article>;
  })}</div>
  </section>)}
 </div>;
}
