import "./dashboard.css";
import { findOfficialPaper } from "@/modules/papers/catalog";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { SignOut } from "@/components/sign-out";
import { StartAttempt } from "@/modules/attempts/start-button";
import { findExam } from "@/modules/exams/definitions";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
export const metadata: Metadata = { title: "Миний бэлтгэл" };
const FOLD_AFTER = 5;
function Fold({ rows }: { rows: ReactNode[] }) {
  if (rows.length <= FOLD_AFTER) return <>{rows}</>;
  return <>{rows.slice(0, FOLD_AFTER)}<details className="db-more"><summary>Бусад {rows.length - FOLD_AFTER}</summary>{rows.slice(FOLD_AFTER)}</details></>;
}
export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const [attempts, completed, mocks, completedMocks, openExercises, openMocks, recentExercise, recentMock, plans] = await Promise.all([
    getDb().attempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, status: true, score: true, total: true, createdAt: true } }),
    getDb().attempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().mockAttempt.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:20,select:{id:true,slug:true,status:true,createdAt:true}}),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().attempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
    getDb().attempt.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, updatedAt: true } }),
    getDb().mockAttempt.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, updatedAt: true } }),
    getDb().subscription.findMany({ where: { userId: user.id, startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { endsAt: "asc" }, select: { id: true, program: true, endsAt: true } }),
  ]);
  const papers=await getDb().paperAttempt.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:20,select:{id:true,slug:true,status:true,createdAt:true}});
  const [paperComplete,paperOpen,recentPaper]=await Promise.all([getDb().paperAttempt.count({where:{userId:user.id,status:"SUBMITTED"}}),getDb().paperAttempt.count({where:{userId:user.id,status:"IN_PROGRESS"}}),getDb().paperAttempt.findFirst({where:{userId:user.id,status:"IN_PROGRESS"},orderBy:{updatedAt:"desc"},select:{id:true,slug:true,updatedAt:true}})]);
  const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
  const existingResume = recentMock && (!recentExercise || recentMock.updatedAt > recentExercise.updatedAt)
    ? { href: "/exams/attempts/" + recentMock.id, title: findExam(recentMock.slug)?.title ?? recentMock.slug, kind: "Бүтэн шалгалт" }
    : recentExercise ? { href: "/learn/attempts/" + recentExercise.id, title: recentExercise.title, kind: "Дасгал" } : null;
  const resume=recentPaper&&(!recentExercise||recentPaper.updatedAt>recentExercise.updatedAt)&&(!recentMock||recentPaper.updatedAt>recentMock.updatedAt)?{href:"/papers/attempts/"+recentPaper.id,title:findOfficialPaper(recentPaper.slug)?.title??recentPaper.slug,kind:"ЭЕШ"}:existingResume;
  const empty = !attempts.length && !mocks.length && !papers.length;
  const dayMs = 864e5;
  return <div className="container page-space ws db-page">
    <header className="db-head">
      <div><h1>Сайн уу, {user.name}.</h1><p>{date.format(now)}</p></div>
      <SignOut />
    </header>

    <div className="db-grid">
      <div className="db-main">
        {resume && <section className="resume-card db-next"><div><p>Үргэлжлүүлэх · {resume.kind}</p><h2>{resume.title}</h2></div><Link className="button" href={resume.href}>Үргэлжлүүлэх →</Link></section>}
        {empty && !resume && <section className="db-next"><div><p>Түүх хоосон байна</p><h2>Эхний бэлтгэлээ эхлүүл.</h2></div><div className="db-next-actions"><Link className="button" href="/practice">Үнэгүй жишиг эхлэх →</Link><Link className="text-link" href="/exams">Бүтэн шалгалт үзэх →</Link></div></section>}

        <div className="learning-stats db-stats">
          <div><strong>{completed}</strong><p>Дууссан дасгал</p></div>
          <div><strong>{completedMocks+paperComplete}</strong><p>Дууссан шалгалт</p></div>
          <div><strong>{openExercises + openMocks + paperOpen}</strong><p>Дуусаагүй</p></div>
        </div>

        {attempts.length>0&&<section className="ws-card"><h2>Миний дасгалууд</h2><div className="db-list"><Fold rows={attempts.map(attempt => <Link href={"/learn/attempts/" + attempt.id} className="attempt-row db-row" key={attempt.id}><div><h3>{attempt.title}</h3><p>{date.format(attempt.createdAt)}</p></div><span className={"ws-pill " + (attempt.status === "SUBMITTED" ? "ok" : "info")}>{attempt.status === "SUBMITTED" ? attempt.score + " / " + attempt.total + " зөв" : "Үргэлжлүүлэх →"}</span></Link>)}/></div></section>}
        {mocks.length>0&&<section className="ws-card"><h2>Миний бүтэн шалгалтууд</h2><div className="db-list"><Fold rows={mocks.map(mock=><Link key={mock.id} className="mock-attempt-row db-row" href={"/exams/attempts/"+mock.id}><div><h3>{findExam(mock.slug)?.title??mock.slug}</h3><p>{date.format(mock.createdAt)}</p></div><span className={"ws-pill "+(mock.status==="SUBMITTED"?"":"info")}>{mock.status==="SUBMITTED"?"Үр дүн":"Үргэлжлүүлэх →"}</span></Link>)}/></div></section>}
        {papers.length>0&&<section className="ws-card"><h2>Миний албан материалын шалгалтууд</h2><div className="db-list"><Fold rows={papers.map(paper=><Link key={paper.id} className="mock-attempt-row db-row" href={"/papers/attempts/"+paper.id}><div><h3>{findOfficialPaper(paper.slug)?.title??paper.slug}</h3><p>{date.format(paper.createdAt)}</p></div><span className={"ws-pill "+(paper.status==="SUBMITTED"?"":"info")}>{paper.status==="SUBMITTED"?"Үр дүн":"Үргэлжлүүлэх →"}</span></Link>)}/></div></section>}
      </div>

      <aside className="db-rail">
        <section className="ws-card"><h2>Шинээр эхлэх</h2>
          <nav className="db-links" aria-label="Шинээр эхлэх">
            <Link href="/programs">Дасгал<span aria-hidden="true">→</span></Link>
            <Link href="/exams">Бүтэн шалгалт<span aria-hidden="true">→</span></Link>
            <Link href="/exams/eec-math-2020">ЭЕШ 2020 математик<span aria-hidden="true">→</span></Link>
          </nav>
          <div className="db-sample"><p>Үнэгүй SAT жишиг · 3 бодлого</p><StartAttempt /></div>
        </section>
        <section className="ws-card"><div className="ws-card-head"><h2>Миний багц</h2><Link className="text-link" href="/plans">Бүх багц</Link></div>
          {plans.length ? <ul className="db-plans">{plans.map(plan => {const left=Math.ceil((plan.endsAt.getTime()-now.getTime())/dayMs);return <li key={plan.id}><strong>{findSubscriptionPlan(plan.program)?.title ?? plan.program}</strong><div><span>{date.format(plan.endsAt)} хүртэл</span><span className={"ws-pill "+(left<=5?"warn":"ok")}>{left} хоног</span></div></li>;})}</ul> : <p className="db-muted">Идэвхтэй багц алга.</p>}
        </section>
      </aside>
    </div>
  </div>;
}
