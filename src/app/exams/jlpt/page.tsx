import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { jlptMocks, jlptSlugs } from '@/modules/exams/jlpt/catalog';
import { MOCK_PRICE_LABEL } from '@/modules/exams/pricing';
import '@/modules/exams/jlpt/jlpt.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'JLPT N5・N4 · Япон хэл'};
const themes:Record<string,string>={
 'jlpt-n5-01':'Шинэ сурагч, амралтын өдрийн аялал','jlpt-n5-02':'Гэр, дэлгүүр, гэр бүлийн уулзалт','jlpt-n5-03':'Өдрийн аялал, өдөр тутмын амьдрал',
 'jlpt-n4-01':'Олон нийтийн үйл ажиллагаа, суралцах төлөвлөгөө','jlpt-n4-02':'Аялал, ажил, нийтийн үйлчилгээ','jlpt-n4-03':'Эрүүл мэнд, зарлал, шинэ чадвар',
};
export default async function JlptHub({searchParams}:{searchParams:Promise<{level?:string}>}){
 const level=(await searchParams).level==='N4'?'N4':'N5';
 const session=await getSession();
 const userId=session?.user.id;
 const [purchases,practice,attempts]=userId?await Promise.all([
  getDb().mockPurchase.findMany({where:{userId,examSlug:{in:jlptSlugs()},status:'PAID'},select:{examSlug:true}}),
  getDb().practiceSession.findMany({where:{userId,slug:{in:jlptSlugs()}},select:{slug:true,results:true}}),
  getDb().mockAttempt.findMany({where:{userId,slug:{in:jlptSlugs()},status:'IN_PROGRESS'},select:{id:true,slug:true}}),
 ]):[[],[],[]];
 return <div className="container page-space jlpt-hub">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <header className="jlpt-hub-head"><p className="eyebrow">日本語能力試験 · ЯПОН ХЭЛ</p><h1>JLPT N5・N4</h1><p>Түвшнээ сонгоод, нэг бүтэн mock эсвэл нэг чадварт төвлөрөн бэлдээрэй. Хариу, тэмдэглэсэн асуулт, дадлагын явц таны бүртгэлд хадгалагдана.</p></header>
  <nav className="jlpt-levels" aria-label="JLPT түвшин">{(['N5','N4'] as const).map(value=><Link key={value} aria-current={level===value?'page':undefined} href={'/exams/jlpt?level='+value}>{value} · {value==='N5'?'Анхан шат':'Суурь шат'}</Link>)}</nav>
  <p>{level==='N5'?'21 үгийн сан · 22 хэлзүй, унших · 24 сонсох · 90 минут':'28 үгийн сан · 29 хэлзүй, унших · 28 сонсох · 115 минут'}</p>
  <section className="jlpt-cards" aria-label={level+' mocks'}>{jlptMocks.filter(mock=>mock.level===level).map(mock=>{
   const owned=purchases.some(p=>p.examSlug===mock.slug),active=attempts.find(a=>a.slug===mock.slug);
   const results=practice.find(p=>p.slug===mock.slug)?.results;
   const checked=results&&typeof results==='object'?Object.keys(results).filter(id=>id.startsWith(`${level}-0${mock.number}-`)).length:0;
   return <article className="jlpt-card" key={mock.slug}><span className="eyebrow">{level} · MOCK 0{mock.number}</span><h2>Mock 0{mock.number}</h2><p>{themes[mock.slug]}</p><dl><div><dt>Асуулт</dt><dd>{mock.questions}</dd></div><div><dt>Хугацаа</dt><dd>{mock.minutes} мин</dd></div><div><dt>Listening</dt><dd>Япон audio</dd></div><div><dt>Эрх</dt><dd>{owned?'Нээлттэй':MOCK_PRICE_LABEL}</dd></div></dl>
    {checked>0?<div><progress max={mock.questions} value={checked} aria-label="Дадлагын явц"/><p>{checked}/{mock.questions} шалгасан</p></div>:null}
    <Link className="button" href={active?'/exams/attempts/'+active.id:'/exams/'+mock.slug}>{active?'Шалгалтаа үргэлжлүүлэх':'Танилцах / эхлэх'} →</Link>
    {owned?<Link className="text-link" href={'/exams/'+mock.slug+'/practice'}>{checked?'Дадлагаа үргэлжлүүлэх':'Цаггүй дадлага'} →</Link>:null}
   </article>;
  })}</section>
  <p className="jlpt-note">Эх зохиомжтой, албан бус mock · Япон хиймэл дуу хоолой · Багшийн хяналт хүлээгдэж байна. Үр дүн нь raw зөв хариултын тоо; JLPT-ийн албан оноо, тэнцсэн эсэхийг тооцохгүй. Нэг mock-ийн эрхэд цагтай шалгалт, цаггүй дадлага хоёул багтана. Төлбөр нь туршилтын.</p>
 </div>;
}
