import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { finishedAttempts, openAttempts } from "@/modules/workspace/data";
import { programLabels } from "@/modules/workspace/programs";
import { ScoreRing } from "@/modules/workspace/score";
import { Icon } from "@/modules/workspace/icons";
import type { ExamProgram } from "@/modules/exams/types";
export const metadata: Metadata = { title: "Миний үр дүн" };

const PAGE = 12;
const programs: ExamProgram[] = ["sat", "ielts", "entrance", "jlpt", "hsk"];
const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });

export default async function ReviewList({ searchParams }: { searchParams: Promise<{ program?: string; page?: string }> }) {
  const user = await requireUser("/workspace/review");
  const query = await searchParams;
  const program = programs.find(item => item === query.program);
  const page = Math.max(1, Math.min(500, Number.parseInt(query.page ?? "1", 10) || 1));
  const [{ items, count }, open] = await Promise.all([
    finishedAttempts(user.id, { skip: (page - 1) * PAGE, take: PAGE, program }),
    openAttempts(user.id),
  ]);
  const pages = Math.max(1, Math.ceil(count / PAGE));
  const href = (next: { program?: ExamProgram; page?: number }) => {
    const params = new URLSearchParams();
    if (next.program) params.set("program", next.program);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const text = params.toString();
    return "/workspace/review" + (text ? "?" + text : "");
  };
  return <div className="wsp-page wsp-review-list">
    <header className="wsp-page-head"><div><h1>Миний үр дүн</h1><p>Дууссан mock бүрийн оноо, алдсан асуулт, тайлбарыг эргэн хараад AI багшаас асуугаарай.</p></div></header>

    {open.length ? <section className="wsp-section" aria-labelledby="open-heading">
      <div className="wsp-section-head"><h2 id="open-heading">Дуусаагүй</h2><span className="wsp-muted">Цаг серверт үргэлжилж байна</span></div>
      <div className="wsp-list">{open.map(item => <Link key={item.id} className="wsp-row" href={"/exams/attempts/" + item.id}>
        <span className="wsp-row-icon is-warn" aria-hidden="true"><Icon name="clock" /></span>
        <span className="wsp-row-main"><strong>{item.title}</strong><small>{item.program ? programLabels[item.program] + " · " : ""}{date.format(new Date(item.updatedAt))}</small></span>
        <span className="wsp-row-cta">Үргэлжлүүлэх<Icon name="arrow" size={16} /></span>
      </Link>)}</div>
    </section> : null}

    <section className="wsp-section" aria-labelledby="done-heading">
      <div className="wsp-section-head"><h2 id="done-heading">Дууссан шалгалт <span className="wsp-count-pill">{count}</span></h2></div>
      <nav className="wsp-filter" aria-label="Хөтөлбөрөөр шүүх">
        <Link href={href({})} aria-current={!program ? "page" : undefined}>Бүгд</Link>
        {programs.map(item => <Link key={item} href={href({ program: item })} aria-current={program === item ? "page" : undefined}>{programLabels[item]}</Link>)}
      </nav>
      {items.length ? <div className="wsp-list">{items.map(item => <Link key={item.id} className="wsp-row" href={"/workspace/review/" + item.id}>
        <ScoreRing percent={item.percent} />
        <span className="wsp-row-main"><strong>{item.title}</strong><small>{date.format(new Date(item.finishedAt))} · {item.correct} / {item.graded} зөв · {item.earned} / {item.total} оноо{item.pending ? ` · ${item.pending} хяналт хүлээгдэж байна` : ""}</small></span>
        {item.program ? <span className="wsp-tag">{programLabels[item.program]}</span> : null}
        <span className="wsp-row-cta">Review<Icon name="arrow" size={16} /></span>
      </Link>)}</div>
        : <div className="wsp-empty"><p>{program ? programLabels[program] + " шалгалт алга" : "Дууссан шалгалт алга"}</p><h3>Mock дуусмагц энд оноо, алдаа бүрийн тайлбар гарна.</h3><Link className="wsp-primary" href="/exams">Шалгалт сонгох <Icon name="arrow" size={18} /></Link></div>}
      {pages > 1 ? <nav className="wsp-pager" aria-label="Хуудаслалт">
        {page > 1 ? <Link href={href({ program, page: page - 1 })}><Icon name="back" size={16} />Өмнөх</Link> : <span />}
        <span>{page} / {pages}</span>
        {page < pages ? <Link href={href({ program, page: page + 1 })}>Дараах<Icon name="arrow" size={16} /></Link> : <span />}
      </nav> : null}
    </section>
  </div>;
}
