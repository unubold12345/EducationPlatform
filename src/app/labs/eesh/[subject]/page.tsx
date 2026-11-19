import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { mocksFor } from "@/modules/exams/entrance/catalog";
import { hubAccess } from "@/modules/subscriptions/mock-access";
import { drillHref, drillValue } from "@/modules/eesh-workshop/contracts";
import { eeshInsights } from "@/modules/eesh-workshop/insights";
import { eeshStudentProgress } from "@/modules/eesh-workshop/service";
import { EeshSubjectView } from "@/modules/eesh-workshop/view";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ subject: string }>; searchParams: Promise<{ topic?: string; domain?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const insights = eeshInsights((await params).subject);
  return { title: insights ? `${insights.label} · ЭЕШ Workshop` : "ЭЕШ Workshop", robots: { index: false, follow: false } };
}

// Workshop → ЭЕШ (owner request 2026-11-20): one subject's paper year by year, its recurring topics and the student's weak
// topics. The charts are public (no question text). Each «Дасгал» opens the drill page (./drill); an older ?topic= link here
// is sent on to it.
export default async function EeshSubjectPage({ params, searchParams }: Props) {
  const insights = eeshInsights((await params).subject);
  if (!insights) notFound();
  const value = drillValue(await searchParams);
  if (value) redirect(drillHref(insights.subject, value));
  const session = await getSession();
  const papers = mocksFor(insights.subject);
  const [progress, access] = session
    ? await Promise.all([eeshStudentProgress(session.user.id, insights), hubAccess(session.user.id, papers.map(paper => paper.slug), "entrance")])
    : [null, null];
  const open = access ? papers.filter(paper => access.practice(paper.slug)).length : 0;
  return <EeshSubjectView insights={insights} progress={progress} signedIn={Boolean(session)} open={open} />;
}
