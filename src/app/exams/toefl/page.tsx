import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { toeflMocks, toeflSlugs } from '@/modules/exams/toefl/catalog';
import { MOCK_PRICE_LABEL } from '@/modules/exams/pricing';
import { hubAccess, hubLabel } from '@/modules/subscriptions/mock-access';
import '@/modules/exams/toefl/toefl.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'TOEFL iBT · 2026 формат'};
const pad=(number:number)=>String(number).padStart(2,'0');
export default async function ToeflHub(){
 const session=await getSession();
 const userId=session?.user.id;
 const [practice,attempts]=userId?await Promise.all([
  getDb().practiceSession.findMany({where:{userId,slug:{in:toeflSlugs()}},select:{slug:true,results:true}}),
  getDb().mockAttempt.findMany({where:{userId,slug:{in:toeflSlugs()},status:'IN_PROGRESS'},select:{id:true,slug:true}}),
 ]):[[],[]];
 // Bought or a plan; the briefing and the API decide again.
 const access=await hubAccess(userId,toeflSlugs(),'toefl');
 return <div className="container page-space toefl-hub">
  <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
  <header className="toefl-hub-head"><p className="eyebrow">TOEFL iBT · 2026 ОНЫ 1-Р САРААС ХЭРЭГЖСЭН ФОРМАТ</p><h1>TOEFL iBT</h1><p>Есөн бүтэн mock. Reading, Listening нь эхний модулийн дүнгээр Lower эсвэл Upper хоёрдугаар модуль руу шилжинэ. Complete the Words, Build a Sentence, имэйл, академик хэлэлцүүлэг, Listen and Repeat, ярилцлага. Хариу, бичлэг, дадлагын явц таны бүртгэлд хадгалагдана.</p></header>
  <p className="toefl-format">Reading 50 (35 + 15) · Listening 47 (32 + 15) · Writing 12 · Speaking 11 · ≈86–89 минут. Чихэвч, микрофон шаардлагатай. ETS-ийн материал биш; TOEFL, TOEFL iBT нь ETS-ийн бүртгэлтэй тэмдэг.</p>
  <div className="toefl-cards">{toeflMocks.map(mock=>{
   const owned=access.practice(mock.slug),active=attempts.find(attempt=>attempt.slug===mock.slug);
   const results=practice.find(item=>item.slug===mock.slug)?.results;
   const total=mock.questions.reading+mock.questions.listening+mock.questions.writing+mock.questions.speaking;
   const checked=results&&typeof results==='object'?Object.keys(results).filter(id=>id.startsWith('toefl'+pad(mock.number)+'-')).length:0;
   return <article className="toefl-card" key={mock.slug}><span className="eyebrow">TOEFL iBT · MOCK {pad(mock.number)}</span><h2>Mock {pad(mock.number)}</h2><p>{mock.theme}</p>
    <dl><div><dt>Асуулт</dt><dd>{total}</dd></div><div><dt>Хугацаа</dt><dd>{mock.minutes.lower}–{mock.minutes.higher} мин</dd></div><div><dt>Хэсэг</dt><dd>R · L · W · S</dd></div><div><dt>Эрх</dt><dd>{hubLabel(access.state(mock.slug),MOCK_PRICE_LABEL)}</dd></div></dl>
    {checked>0?<div><progress max={total} value={checked} aria-label="Дадлагын явц"/><p>{checked}/{total} шалгасан</p></div>:null}
    <Link className="button" href={active?'/exams/attempts/'+active.id:'/exams/'+mock.slug}>{active?'Шалгалтаа үргэлжлүүлэх':'Танилцах / эхлэх'} →</Link>
    {owned?<Link className="text-link" href={'/exams/'+mock.slug+'/practice'}>{checked?'Дадлагаа үргэлжлүүлэх':'Цаггүй дадлага'} →</Link>:null}
   </article>;
  })}</div>
 </div>;
}
