import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/session";
import { practiceView, TimedSittingOpen } from "@/modules/exam-practice/service";
import { PracticeWorkspace } from "@/modules/exam-practice/workspace";
import { isLabSkill, labFor, labView } from "@/modules/exam-practice/skills";
import { studyGate } from "@/modules/language-decks/gate";
import "@/modules/exam-practice/practice.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workshop · Mock", robots: { index: false, follow: false } };

// One skill of a mock inside a Workshop lab (owner request 2026-11-19): the listening or reading of an IELTS or TOEFL mock,
// the reading or writing of a JLPT, HSK or TOPIK mock. It is practice mode narrowed to that skill, so access (free mock,
// purchase or a covering plan), the open-sitting block, saving, checks, audio and the assistant are the practice routes'
// own. JLPT/HSK/TOPIK labs also need the Ази хэл plan, like the rest of their workshops.
export default async function LabMockPage({ params }: { params: Promise<{ skill: string; slug: string }> }) {
  const { skill, slug } = await params;
  if (!isLabSkill(skill)) notFound();
  const user = await requireUser("/workspace/workshop");
  let view;
  try { view = await practiceView(user.id, slug); }
  catch (error) {
    if (error instanceof TimedSittingOpen) return <div className="container page-space practice-blocked">
      <p className="eyebrow">Workshop</p><h1>Эхлээд шалгалтаа дуусгана уу</h1>
      <p>Танд хугацаатай шалгалт нээлттэй байна. Шалгалт дуусмагц дасгал нээгдэнэ.</p>
      <div className="result-actions"><Link className="button" href={error.href}>Шалгалт руу буцах →</Link></div>
    </div>;
    if (error instanceof ApiError && error.status === 402) redirect("/exams/" + slug);
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const lab = labFor(skill, view.form.subject);
  const narrowed = lab ? labView(view, skill) : null;
  if (!lab || !narrowed) notFound();
  if (lab.asian) {
    const gate = await studyGate(user.id, view.form.subject as "jlpt" | "hsk" | "topik", lab.title);
    if (gate) return gate;
  }
  return <PracticeWorkspace initial={narrowed} lab={{ title: lab.title, href: lab.href }} />;
}
