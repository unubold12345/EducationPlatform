import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { mocksFor } from "@/modules/exams/entrance/catalog";
import { hubAccess } from "@/modules/subscriptions/mock-access";
import { drillValue } from "@/modules/eesh-workshop/contracts";
import { eeshInsights } from "@/modules/eesh-workshop/insights";
import { EeshDrillView } from "@/modules/eesh-workshop/view";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ subject: string }>; searchParams: Promise<{ topic?: string; domain?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const insights = eeshInsights((await params).subject);
  return { title: insights ? `${insights.label} · Сэдвээр дасгал · ЭЕШ Workshop` : "ЭЕШ Workshop", robots: { index: false, follow: false } };
}

// Workshop → ЭЕШ → «Дасгал» (owner request 2026-11-20: the drill opens on its own page): ten questions of the topic or area
// the address names (?topic= / ?domain=), from different years. The page shows only names and counts; the drill and check
// APIs decide which questions this account may see and grade every answer.
export default async function EeshDrillPage({ params, searchParams }: Props) {
  const insights = eeshInsights((await params).subject);
  if (!insights) notFound();
  const initial = drillValue(await searchParams);
  const session = await getSession();
  const papers = mocksFor(insights.subject);
  const access = session ? await hubAccess(session.user.id, papers.map(paper => paper.slug), "entrance") : null;
  const open = access ? papers.filter(paper => access.practice(paper.slug)).length : 0;
  return <EeshDrillView insights={insights} signedIn={Boolean(session)} open={open} initial={initial} />;
}
