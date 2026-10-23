import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { SignOut } from "@/components/sign-out";
import { StartAttempt } from "@/modules/attempts/start-button";
import { findExam } from "@/modules/exams/definitions";
import { SubscriptionOverview } from "@/components/subscription-overview";
export const metadata: Metadata = { title: "Миний бэлтгэл" };
export default async function DashboardPage() {
  const user = await requireUser();
  const [attempts, completed, mocks, completedMocks, openExercises, openMocks, recentExercise, recentMock] = await Promise.all([
    getDb().attempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, status: true, score: true, total: true, createdAt: true } }),
    getDb().attempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().mockAttempt.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:20,select:{id:true,slug:true,status:true,createdAt:true}}),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().attempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
    getDb().attempt.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, updatedAt: true } }),
    getDb().mockAttempt.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, updatedAt: true } }),
  ]);
  const papers=await getDb().paperAttempt.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:20,select:{id:true,status:true,createdAt:true}});
  const [paperComplete,paperOpen,recentPaper]=await Promise.all([getDb().paperAttempt.count({where:{userId:user.id,status:"SUBMITTED"}}),getDb().paperAttempt.count({where:{userId:user.id,status:"IN_PROGRESS"}}),getDb().paperAttempt.findFirst({where:{userId:user.id,status:"IN_PROGRESS"},orderBy:{updatedAt:"desc"},select:{id:true,updatedAt:true}})]);
  const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium", timeStyle: "short" });
  const existingResume = recentMock && (!recentExercise || recentMock.updatedAt > recentExercise.updatedAt)
    ? { href: "/exams/attempts/" + recentMock.id, title: findExam(recentMock.slug)?.title ?? recentMock.slug, mock: true }
    : recentExercise ? { href: "/learn/attempts/" + recentExercise.id, title: recentExercise.title, mock: false } : null;
  const resume=recentPaper&&(!recentExercise||recentPaper.updatedAt>recentExercise.updatedAt)&&(!recentMock||recentPaper.updatedAt>recentMock.updatedAt)?{href:"/papers/attempts/"+recentPaper.id,title:"ЭЕШ 2020 · Математик · А хувилбар",mock:true}:existingResume;
  return <div className="container page-space dashboard"><div className="dashboard-heading"><div><p className="eyebrow">МИНИЙ СУРАЛЦАХ ОРОН ЗАЙ</p><h1>Сайн уу, {user.name}.</h1><p>Өнөөдрийн нэг алхмаа эхлүүлье.</p></div><div className="dashboard-account-actions"><Link className="text-link" href="/profile">Профайл ↗</Link><SignOut /></div></div>
    <div className="learning-stats"><div><span className="stat-icon" aria-hidden="true">✓</span><div><p>Дууссан дасгал</p><strong>{completed}</strong></div></div><div><span className="stat-icon" aria-hidden="true">▤</span><div><p>Дууссан шалгалт</p><strong>{completedMocks+paperComplete}</strong></div></div><div><span className="stat-icon" aria-hidden="true">◷</span><div><p>Нээлттэй бэлтгэл</p><strong>{openExercises + openMocks + paperOpen}</strong></div></div></div>
    {resume && <section className="resume-card"><div><p className="eyebrow">ОРХИСОН ГАЗРААСАА</p><h2>{resume.title}</h2><p>{resume.mock ? "Шалгалтын цаг зогсохгүй. Нээх үед хугацаа, хариулт шинэчлэгдэнэ." : "Хадгалсан хариултууд тань бэлэн. Дараагийн алхмаа үргэлжлүүлээрэй."}</p></div><Link className="button" href={resume.href}>Үргэлжлүүлэх →</Link></section>}
    <SubscriptionOverview userId={user.id}/><div className="dashboard-quick-grid">
    <section className="study-banner"><span className="quick-card-icon" aria-hidden="true">ƒ</span><div><p className="eyebrow">SAT · Mathematics</p><h2>Алгебрийн жишиг дасгал</h2><p>3 бодлого · Хугацааны хязгааргүй · Хариулт хадгалагдана</p><p className="fine-print">Жишиг агуулга. Албан ёсны SAT оноо, бэлэн байдлын үнэлгээ биш.</p></div><StartAttempt /></section>
    <div className="program-exam-banner"><span className="quick-card-icon" aria-hidden="true">▤</span><div><p className="eyebrow">Стандарт цагтай бүтэн шалгалт</p><h2>SAT & IELTS Academic</h2><p>Бүх хэсэг, Listening бичлэг, Writing, Speaking simulation.</p></div><Link className="button" href="/exams">Шалгалтууд үзэх →</Link></div>
    </div>
    {mocks.length?<section className="mock-history"><h2>Миний бүтэн шалгалтууд</h2>{mocks.map(mock=><Link key={mock.id} className="mock-attempt-row" href={"/exams/attempts/"+mock.id}><div><h3>{findExam(mock.slug)?.title??mock.slug}</h3><p>{date.format(mock.createdAt)}</p></div><span>{mock.status==="SUBMITTED"?"Үр дүн харах":"Үргэлжлүүлэх"} →</span></Link>)}</section>:null}
    {papers.length>0&&<section className="mock-history"><h2>Миний албан материалын шалгалтууд</h2>{papers.map(paper=><Link key={paper.id} className="mock-attempt-row" href={"/papers/attempts/"+paper.id}><div><h3>ЭЕШ 2020 · Математик · А хувилбар</h3><p>{date.format(paper.createdAt)}</p></div><span>{paper.status==="SUBMITTED"?"Үр дүн харах":"Үргэлжлүүлэх"} →</span></Link>)}</section>}
    <div className="dashboard-library"><div><h2>Өөр сэдвээр бэлдэх үү?</h2><p>SAT, IELTS, математик, англи хэл, физикийн 10 багц дасгал.</p></div><Link className="button secondary" href="/programs">Бүх дасгал үзэх →</Link></div>
    <div className="section-heading"><h2>Миний дасгалууд</h2><p>{completed} дасгал дуусгасан</p></div>
    {attempts.length ? <div className="attempt-list">{attempts.map(attempt => <Link href={"/learn/attempts/" + attempt.id} className="attempt-row" key={attempt.id}><div><h3>{attempt.title}</h3><p>{date.format(attempt.createdAt)}</p></div><span className="attempt-status">{attempt.status === "SUBMITTED" ? attempt.score + " / " + attempt.total + " зөв" : "Үргэлжлүүлэх"} <span aria-hidden="true">→</span></span></Link>)}</div> : <div className="empty-state"><h3>Эхний дасгал чинь энд харагдана.</h3><p>Дээрх товчоор эхлээд, бодлого бүрийн хариугаа хадгалаарай.</p></div>}
    <p className="fine-print history-note">Хамгийн сүүлийн 30 дасгалыг харуулж байна. Үр дүн зөвхөн таны бүртгэлд харагдана.</p>
  </div>;
}

