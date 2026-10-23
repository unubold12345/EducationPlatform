export const dynamic="force-dynamic";
import { getWorkshop } from "@/modules/content/published";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guidedTasks } from "@/modules/exercises/guided";
import { WorkshopClient } from "@/modules/exercises/workshop-client";
import { getSession } from "@/lib/session";
import { hasSubscription } from "@/modules/subscriptions/access";
import { ProgramGate } from "@/components/program-gate";
export function generateStaticParams() { return guidedTasks.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await getWorkshop(slug))?.title ?? "Дасгал олдсонгүй" };
}
export default async function WorkshopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const task = await getWorkshop(slug);
  if (!task) notFound();
  const session=await getSession();
  if(!session||!await hasSubscription(session.user.id,"ielts"))return <ProgramGate program="ielts" title={task.title}/>;
  return <div className="container practice-page workshop-page"><Link className="text-link" href="/programs/ielts">← IELTS</Link>
    <div className="practice-heading"><p className="eyebrow">IELTS Academic · {task.skill}</p><h1>{task.title}</h1><p>Санал болгох хугацаа {task.minutes} минут · Өөрийгөө шалгах дасгал</p></div>
    <div className="notice">Өөрсдийн зохиосон бэлтгэлийн даалгавар. Жишиг хариу болон шалгах жагсаалттай. Албан ёсны IELTS материал, band үнэлгээ биш.</div>
    <section className="workshop-task"><h2>Даалгавар</h2><p lang="en">{task.prompt}</p>
      {task.table ? <div className="table-scroll"><table><caption>Commuting in a fictional town</caption><thead><tr>{task.table.headings.map(item => <th scope="col" key={item}>{item}</th>)}</tr></thead><tbody>{task.table.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div> : null}
      <p className="workshop-tip">{task.tips}</p>
    </section>
    <WorkshopClient title={task.title} minWords={task.minWords} checklist={task.checklist} />
    <details className="model-response"><summary>Бичиж / ярьж дуусаад жишиг хариутай харьцуулах</summary><p lang="en">{task.model}</p></details>
    <p className="fine-print source-note">Даалгаврын хэлбэр: <a href={task.skill === "Writing" ? "https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing" : "https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking"} target="_blank" rel="noopener noreferrer">IELTS — {task.skill} ↗</a></p>
  </div>;
}
