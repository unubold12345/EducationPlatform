import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceTotal } from "@/modules/exams/entrance/catalog";
import { listeningLabEnabled, readingLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { practiceSummaries } from "@/modules/exam-practice/service";
import { finishedAttempts, openAttempts } from "@/modules/workspace/data";
import { programLabels } from "@/modules/workspace/programs";
import { HomeSwitcher, type HomeLab, type HomeProgram } from "@/modules/workspace/home-switcher";
import { ProgramArt } from "@/modules/workspace/art";
import { ScoreRing } from "@/modules/workspace/score";
import { Icon } from "@/modules/workspace/icons";
import type { ExamProgram } from "@/modules/exams/types";
export const metadata: Metadata = { title: "Workspace" };

const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "short", day: "numeric" });

export default async function WorkspaceHome() {
  const user = await requireUser("/workspace");
  const db = getDb();
  const [completed, open, recent, practice, opened] = await Promise.all([
    db.mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    db.mockAttempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
    finishedAttempts(user.id, { take: 4 }),
    practiceSummaries(user.id),
    openAttempts(user.id),
  ]);
  const scored = recent.items.filter(item => item.percent !== null);
  const average = scored.length ? Math.round(scored.reduce((sum, item) => sum + item.percent!, 0) / scored.length) : null;
  const resume = opened[0];
  const count = (program: ExamProgram) => examDefinitions.filter(exam => exam.program === program).length;
  const programs: (HomeProgram & { program: ExamProgram; tag: string })[] = [
    { program: "sat", href: "/exams/sat", label: "Digital SAT", detail: `${count("sat")} бүтэн mock · 98 асуулт`, tone: "tone-blue", tag: "Reading · Math" },
    { program: "ielts", href: "/exams/ielts", label: "IELTS Academic", detail: `${count("ielts")} бүтэн mock · 4 чадвар`, tone: "tone-violet", tag: "Listening · Speaking" },
    { program: "entrance", href: "/exams/eesh", label: "ЭЕШ", detail: `${entranceTotal} mock · 3 хичээл`, tone: "tone-green", tag: "Математик · Физик · Англи" },
    { program: "jlpt", href: "/exams/jlpt", label: "JLPT N5・N4", detail: "6 бүтэн mock · япон audio", tone: "tone-amber", tag: "語彙 · 文法 · 聴解" },
  ];
  const labs: HomeLab[] = [
    ...(speakingLabEnabled() ? [{ href: "/labs/ielts-speaking", label: "Ярианы хамтрагч", detail: "AI-тай IELTS Speaking", icon: "mic" as const }] : []),
    ...(writingLabEnabled() ? [{ href: "/labs/ielts-writing", label: "Эссэ студи", detail: "AI засвар, band тооцоо", icon: "pen" as const }] : []),
    ...(listeningLabEnabled() ? [{ href: "/labs/ielts-listening", label: "Сонсгол лаб", detail: "Part 1–4, давтан сонсох", icon: "sound" as const }] : []),
    ...(readingLabEnabled() ? [{ href: "/labs/ielts-reading", label: "Унших лаб", detail: "5 жишээ, өөрийн файлаас", icon: "book" as const }] : []),
  ];
  return <div className="wsp-page wsp-home">
    <header className="wsp-hero">
      <p className="wsp-hello">Сайн уу, {user.name.trim().slice(0, 60)}</p>
      <h1>Өнөөдөр юу сурах вэ?</h1>
    </header>
    <HomeSwitcher programs={programs} labs={labs} />

    {resume ? <section className="wsp-resume resume-card" aria-label="Үргэлжлүүлэх">
      <span className="wsp-resume-icon" aria-hidden="true"><Icon name="clock" /></span>
      <div><p>Нээлттэй шалгалт · цаг серверт үргэлжилж байна</p><h2>{resume.title}</h2></div>
      <Link className="wsp-primary" href={"/exams/attempts/" + resume.id}>Үргэлжлүүлэх <Icon name="arrow" size={18} /></Link>
    </section> : null}

    <section className="wsp-stats" aria-label="Миний явц">
      <div data-stat="completed"><strong>{completed}</strong><span>Дууссан шалгалт</span></div>
      <div data-stat="open"><strong>{open}</strong><span>Дуусаагүй</span></div>
      <div data-stat="practice"><strong>{practice.length}</strong><span>Дадлагын горим</span></div>
      <div data-stat="average"><strong>{average === null ? "—" : average + "%"}</strong><span>Сүүлийн дундаж</span></div>
    </section>

    <section className="wsp-section" aria-labelledby="home-exams">
      <div className="wsp-section-head"><h2 id="home-exams">Шалгалтууд</h2><span className="wsp-section-actions"><Link className="wsp-link" href="/workspace/my-exams"><Icon name="fileExam" size={15} />Файлаас шалгалт</Link><Link className="wsp-link" href="/exams">Бүгдийг харах</Link></span></div>
      <div className="wsp-cards">{programs.map(item => <Link key={item.program} href={item.href} className="wsp-card">
        <span className={"wsp-card-art " + item.tone}><ProgramArt program={item.program} /></span>
        <strong>{item.label}</strong>
        <span className="wsp-card-detail">{item.detail}</span>
        <span className={"wsp-tag " + item.tone}>{item.tag}</span>
      </Link>)}</div>
    </section>

    <div className="wsp-split">
      <section className="wsp-section" aria-labelledby="home-results">
        <div className="wsp-section-head"><h2 id="home-results">Сүүлийн үр дүн</h2>{recent.count ? <Link className="wsp-link" href="/workspace/review">Бүгд · {recent.count}</Link> : null}</div>
        {recent.items.length ? <div className="wsp-list">{recent.items.map(item => <Link key={item.id} className="wsp-row" href={"/workspace/review/" + item.id}>
          <ScoreRing percent={item.percent} />
          <span className="wsp-row-main"><strong>{item.title}</strong><small>{item.program ? programLabels[item.program] + " · " : ""}{date.format(new Date(item.finishedAt))} · {item.earned} / {item.total} оноо{item.pending ? ` · ${item.pending} хяналт` : ""}</small></span>
          <span className="wsp-row-cta">Review<Icon name="arrow" size={16} /></span>
        </Link>)}</div>
          : <div className="wsp-empty" data-empty="history"><p>Түүх хоосон байна</p><h3>Эхний mock-оо өгөөд, алдаа бүрээ AI-тай задлаарай.</h3><Link className="wsp-primary" href="/exams">Шалгалт сонгох <Icon name="arrow" size={18} /></Link></div>}
      </section>
      <section className="wsp-section" aria-labelledby="home-practice">
        <div className="wsp-section-head"><h2 id="home-practice">Дадлагын горим</h2></div>
        {practice.length ? <div className="wsp-list">{practice.slice(0, 5).map(item => <Link key={item.slug} className="wsp-row" href={"/exams/" + item.slug + "/practice"}>
          <span className="wsp-row-icon" aria-hidden="true"><Icon name="flame" /></span>
          <span className="wsp-row-main"><strong>{item.title}</strong><small>{item.checked} / {item.total} шалгасан · {item.correct} / {item.graded} зөв</small><i className="wsp-bar" aria-hidden="true"><b style={{ width: Math.round((item.checked / Math.max(1, item.total)) * 100) + "%" }} /></i></span>
          <Icon name="arrow" size={16} className="wsp-row-arrow" />
        </Link>)}</div>
          : <div className="wsp-empty"><p>Цаггүй дадлага</p><h3>Mock бүрийг цаггүйгээр, AI туслахтай давтаж болно.</h3><Link className="wsp-link" href="/exams">Mock сонгох</Link></div>}
      </section>
    </div>
  </div>;
}
