import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { topikMocks, topikSlugs, TOPIK_LEVELS } from '@/modules/exams/topik/catalog';
import { MOCK_PRICE_LABEL } from '@/modules/exams/pricing';
import { hubAccess, hubLabel } from '@/modules/subscriptions/mock-access';
import '@/modules/exams/topik/topik.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'TOPIK Ⅰ–Ⅱ · Солонгос хэл'};
const levels=[
 {level:1 as const,name:'TOPIK Ⅰ',grades:'1–2-р түвшин',format:'듣기 30 (40 мин) · 읽기 40 (60 мин) · 70 асуулт · 100 минут · 200 оноо'},
 {level:2 as const,name:'TOPIK Ⅱ',grades:'3–6-р түвшин',format:'듣기 50 (60 мин) · 쓰기 4 (50 мин) · 읽기 50 (70 мин) · 104 асуулт · 180 минут · 300 оноо'},
];
export default async function TopikHub(){
 const session=await getSession();
 const userId=session?.user.id;
 const [practice,attempts]=userId?await Promise.all([
  getDb().practiceSession.findMany({where:{userId,slug:{in:topikSlugs()}},select:{slug:true,results:true}}),
  getDb().mockAttempt.findMany({where:{userId,slug:{in:topikSlugs()},status:'IN_PROGRESS'},select:{id:true,slug:true}}),
 ]):[[],[]];
 // Bought, a plan, or this Гадаад хэл month's pick; the briefing and the API decide again.
 const access=await hubAccess(userId,topikSlugs(),'topik');
 return <div className="container page-space topik-hub">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <header className="topik-hub-head"><p className="eyebrow" lang="ko">한국어능력시험 · СОЛОНГОС ХЭЛ</p><h1>TOPIK Ⅰ–Ⅱ</h1><p>Солонгос хэлний чадварын шалгалт TOPIK-ийн албан PBT бүтэцтэй бүтэн mock: хэсэг, хугацаа, заавар, асуултын дараалал, асуулт бүрийн оноо, түвшний босго албан шалгалттай адил. Агуулга нь шинээр зохиосон. Сонсох хэсэг солонгос audio-той; хариу, дадлагын явц таны бүртгэлд хадгалагдана.</p></header>
  <nav className="topik-levels" aria-label="Түвшин">{levels.map(item=><a key={item.level} href={'#topik-level-'+item.level}>{item.name} · {item.grades}</a>)}</nav>
  {levels.map(({level,name,grades,format})=><section key={level} aria-labelledby={'topik-level-'+level}>
  <h2 className="topik-level" id={'topik-level-'+level}>{name} <small>· {grades}</small></h2>
  <p className="topik-format">{format}<br/>Түвшний босго: {TOPIK_LEVELS[level].map(step=>`${step.level}-р ${step.min}`).join(' · ')}</p>
  <div className="topik-cards">{topikMocks.filter(mock=>mock.level===level).map(mock=>{
   const owned=access.practice(mock.slug),active=attempts.find(a=>a.slug===mock.slug);
   const results=practice.find(p=>p.slug===mock.slug)?.results;
   const checked=results&&typeof results==='object'?Object.keys(results).filter(id=>id.startsWith(`topik${mock.level}-0${mock.number}-`)).length:0;
   return <article className="topik-card" key={mock.slug}><span className="eyebrow">{name} · MOCK 0{mock.number}</span><h2>{mock.theme}</h2>{mock.topics?<p>{mock.topics}</p>:null}<dl><div><dt>Асуулт</dt><dd>{mock.questions}</dd></div><div><dt>Хугацаа</dt><dd>{mock.minutes} мин</dd></div><div><dt>Сонсох</dt><dd>{mock.audio?'Солонгос audio':'Audio бэлтгэгдэж байна'}</dd></div><div><dt>Эрх</dt><dd>{hubLabel(access.state(mock.slug),MOCK_PRICE_LABEL)}</dd></div></dl>
    {checked>0?<div><progress max={mock.questions} value={checked} aria-label="Дадлагын явц"/><p>{checked}/{mock.questions} шалгасан</p></div>:null}
    <Link className="button" href={active?'/exams/attempts/'+active.id:'/exams/'+mock.slug}>{active?'Шалгалтаа үргэлжлүүлэх':'Танилцах / эхлэх'} →</Link>
    {owned?<Link className="text-link" href={'/exams/'+mock.slug+'/practice'}>{checked?'Дадлагаа үргэлжлүүлэх':'Цаггүй дадлага'} →</Link>:null}
   </article>;
  })}</div>
  </section>)}
  <aside className="topik-workshop-link"><p><strong>TOPIK Workshop</strong>: Хангыл үсэг, дуудлага, TOPIK Ⅰ, Ⅱ-ийн үгийн сан (Basic, Pro багцад).</p><Link className="button secondary" href="/workspace/workshop?exam=topik">Workshop нээх →</Link></aside>
 </div>;
}
