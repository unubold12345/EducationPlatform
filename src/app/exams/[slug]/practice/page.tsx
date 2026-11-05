import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { speakingLabEnabled } from "@/lib/local-pilot";
import { requireUser } from "@/lib/session";
import { practiceView, TimedSittingOpen } from "@/modules/exam-practice/service";
import { PracticeWorkspace } from "@/modules/exam-practice/workspace";
import "@/modules/exam-practice/practice.css";
import { mathPaperContent } from "@/modules/papers/math-2020/index";
import { paperFormulaSheet, renderedPaperQuestions } from "@/modules/papers/question-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Дадлагын горим", robots: { index: false, follow: false } };

function Blocked({ href }: { href: string }): ReactNode {
  return <div className="container page-space practice-blocked">
    <p className="eyebrow">Дадлагын горим</p>
    <h1>Эхлээд шалгалтаа дуусгана уу</h1>
    <p>Танд хугацаатай шалгалт нээлттэй байна. Шалгалтын үеэр хариу, тайлбар болон AI туслах хаалттай байдаг. Шалгалт дуусмагц дадлагын горим нээгдэнэ.</p>
    <div className="result-actions"><Link className="button" href={href}>Шалгалт руу буцах →</Link><Link className="text-link" href="/dashboard">Миний бэлтгэл</Link></div>
  </div>;
}

export default async function PracticePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/exams/${slug}/practice`);
  let view;
  try { view = await practiceView(user.id, slug); }
  catch (error) {
    if (error instanceof TimedSittingOpen) return <Blocked href={error.href} />;
    if (error instanceof ApiError && error.status === 402) redirect("/exams/" + slug);
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const content = mathPaperContent(slug);
  return <PracticeWorkspace initial={view} rendered={content ? renderedPaperQuestions(content) : undefined} formulas={content ? paperFormulaSheet() : undefined} speakingLab={speakingLabEnabled()} />;
}
