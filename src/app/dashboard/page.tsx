import "./dashboard.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { SignOut } from "@/components/sign-out";
import { findExam } from "@/modules/exams/definitions";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
import { practiceSummaries } from "@/modules/exam-practice/service";
export const metadata: Metadata = { title: "Миний бэлтгэл" };
const FOLD_AFTER = 5;
function Fold({ rows }: { rows: ReactNode[] }) {
  if (rows.length <= FOLD_AFTER) return <>{rows}</>;
  return <>{rows.slice(0, FOLD_AFTER)}<details className="db-more"><summary>Бусад {rows.length - FOLD_AFTER}</summary>{rows.slice(FOLD_AFTER)}</details></>;
}
export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const [mocks, completedMocks, openMocks, recentMock, plans] = await Promise.all([
    getDb().mockAttempt.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:20,select:{id:true,slug:true,status:true,createdAt:true}}),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
    getDb().mockAttempt.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { updatedAt: "desc" }, select: { id: true, slug: true, updatedAt: true } }),
    getDb().subscription.findMany({ where: { userId: user.id, startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { endsAt: "asc" }, select: { id: true, program: true, endsAt: true } }),
  ]);
  const practice=await practiceSummaries(user.id);
  const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });
  const mockResume = recentMock ? { href: "/exams/attempts/" + recentMock.id, title: findExam(recentMock.slug)?.title ?? recentMock.slug, kind: "Бүтэн шалгалт" } : null;
  const resume=mockResume;
  const empty = !mocks.length;
  const dayMs = 864e5;
  return <div className="container page-space ws db-page">
    <header className="db-head">
      <h1 className="sr-only">Сайн уу, {user.name}.</h1>
      <SignOut />
    </header>

    <div className="db-grid">
      <div className="db-main">
        {resume && <section className="resume-card db-next"><div><p>Үргэлжлүүлэх · {resume.kind}</p><h2>{resume.title}</h2></div><Link className="button" href={resume.href}>Үргэлжлүүлэх →</Link></section>}
        {empty && !resume && <section className="db-next"><div><p>Түүх хоосон байна</p><h2>Эхний бэлтгэлээ эхлүүл.</h2></div><div className="db-next-actions"><Link className="button" href="/exams">Бүтэн шалгалт үзэх →</Link></div></section>}

        <div className="learning-stats db-stats">
          <div><strong>{completedMocks}</strong><p>Дууссан шалгалт</p></div>
          <div><strong>{openMocks}</strong><p>Дуусаагүй</p></div>
        </div>

        {practice.length>0&&<section className="ws-card"><h2>Дадлагын горим</h2><div className="db-list"><Fold rows={practice.map(item=><Link key={item.slug} className="mock-attempt-row db-row" href={"/exams/"+item.slug+"/practice"}><div><h3>{item.title}</h3><p>{item.checked} / {item.total} шалгасан · {item.correct} / {item.graded} зөв</p></div><span className="ws-pill info">Үргэлжлүүлэх →</span></Link>)}/></div></section>}
        {mocks.length>0&&<section className="ws-card"><h2>Миний бүтэн шалгалтууд</h2><div className="db-list"><Fold rows={mocks.map(mock=><Link key={mock.id} className="mock-attempt-row db-row" href={"/exams/attempts/"+mock.id}><div><h3>{findExam(mock.slug)?.title??mock.slug}</h3><p>{date.format(mock.createdAt)}</p></div><span className={"ws-pill "+(mock.status==="SUBMITTED"?"":"info")}>{mock.status==="SUBMITTED"?"Үр дүн":"Үргэлжлүүлэх →"}</span></Link>)}/></div></section>}
      </div>

      <aside className="db-rail">
        <section className="ws-card"><h2>Шинээр эхлэх</h2>
          <nav className="db-links" aria-label="Шинээр эхлэх">
            <Link href="/programs">Хөтөлбөрүүд<span aria-hidden="true">→</span></Link>
            <Link href="/exams">Бүтэн шалгалт<span aria-hidden="true">→</span></Link>
            <Link href="/programs/entrance">ЭЕШ mock шалгалт<span aria-hidden="true">→</span></Link>
          </nav>
        </section>
        <section className="ws-card"><div className="ws-card-head"><h2>Миний багц</h2><Link className="text-link" href="/plans">Бүх багц</Link></div>
          {plans.length ? <ul className="db-plans">{plans.map(plan => {const left=Math.ceil((plan.endsAt.getTime()-now.getTime())/dayMs);return <li key={plan.id}><strong>{findSubscriptionPlan(plan.program)?.title ?? plan.program}</strong><div><span>{date.format(plan.endsAt)} хүртэл</span><span className={"ws-pill "+(left<=5?"warn":"ok")}>{left} хоног</span></div></li>;})}</ul> : <p className="db-muted">Идэвхтэй багц алга.</p>}
        </section>
      </aside>
    </div>
  </div>;
}
