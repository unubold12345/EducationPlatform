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
  return <>{rows.slice(0, FOLD_AFTER)}<details className="dash-more"><summary>Бусад {rows.length - FOLD_AFTER}</summary>{rows.slice(FOLD_AFTER)}</details></>;
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
  return <div className="container page-space dashboard dash">
    <div className="dash-head"><h1>Сайн уу, {user.name}.</h1><div className="dash-account"><Link className="text-link" href="/profile">Профайл</Link><SignOut /></div></div>

    {resume && <section className="resume-card dash-resume"><div><p>Үргэлжлүүлэх · {resume.kind}</p><h2>{resume.title}</h2></div><Link className="button" href={resume.href}>Үргэлжлүүлэх →</Link></section>}

    <div className="learning-stats dash-stats">
      <div><strong>{completed}</strong><p>Дууссан дасгал</p></div>
      <div><strong>{completedMocks+paperComplete}</strong><p>Дууссан шалгалт</p></div>
      <div><strong>{openExercises + openMocks + paperOpen}</strong><p>Дуусаагүй</p></div>
    </div>

    <div className="dash-grid">
      <div className="dash-history">
        {empty && <p className="dash-empty">Түүх хоосон байна. Баруун талаас эхлээрэй.</p>}
        {attempts.length>0&&<section><h2>Миний дасгалууд</h2><div className="attempt-list"><Fold rows={attempts.map(attempt => <Link href={"/learn/attempts/" + attempt.id} className="attempt-row dash-row" key={attempt.id}><div><h3>{attempt.title}</h3><p>{date.format(attempt.createdAt)}</p></div><span className={"attempt-status" + (attempt.status === "SUBMITTED" ? " done" : "")}>{attempt.status === "SUBMITTED" ? attempt.score + " / " + attempt.total + " зөв" : "Үргэлжлүүлэх →"}</span></Link>)}/></div></section>}
        {mocks.length>0&&<section><h2>Миний бүтэн шалгалтууд</h2><Fold rows={mocks.map(mock=><Link key={mock.id} className="mock-attempt-row dash-row" href={"/exams/attempts/"+mock.id}><div><h3>{findExam(mock.slug)?.title??mock.slug}</h3><p>{date.format(mock.createdAt)}</p></div><span className={mock.status==="SUBMITTED"?"done":""}>{mock.status==="SUBMITTED"?"Үр дүн":"Үргэлжлүүлэх →"}</span></Link>)}/></section>}
        {papers.length>0&&<section><h2>Миний албан материалын шалгалтууд</h2><Fold rows={papers.map(paper=><Link key={paper.id} className="mock-attempt-row dash-row" href={"/papers/attempts/"+paper.id}><div><h3>{findOfficialPaper(paper.slug)?.title??paper.slug}</h3><p>{date.format(paper.createdAt)}</p></div><span className={paper.status==="SUBMITTED"?"done":""}>{paper.status==="SUBMITTED"?"Үр дүн":"Үргэлжлүүлэх →"}</span></Link>)}/></section>}
      </div>

      <aside className="dash-aside">
        <section><h2>Эхлэх</h2>
          <nav className="dash-links" aria-label="Эхлэх">
            <Link href="/programs"><span aria-hidden="true">✎</span>Дасгал<i aria-hidden="true">→</i></Link>
            <Link href="/exams"><span aria-hidden="true">▤</span>Бүтэн шалгалт<i aria-hidden="true">→</i></Link>
            <Link href="/exams/eec-math-2020"><span aria-hidden="true">∑</span>ЭЕШ 2020 математик<i aria-hidden="true">→</i></Link>
          </nav>
          <div className="dash-sample"><p>Үнэгүй SAT жишиг · 3 бодлого</p><StartAttempt /></div>
        </section>
        <section><h2>Багц</h2>
          {plans.length ? <ul className="dash-plans">{plans.map(plan => <li key={plan.id}><span>{findSubscriptionPlan(plan.program)?.title ?? plan.program}</span><small>{date.format(plan.endsAt)} хүртэл</small></li>)}</ul> : <p className="dash-muted">Идэвхтэй багц алга.</p>}
          <Link className="text-link dash-plan-link" href="/plans">Багцууд →</Link>
        </section>
      </aside>
    </div>
  </div>;
}
