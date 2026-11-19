import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eeshForecast } from "@/modules/eesh-workshop/forecast";
import { EeshForecastView } from "@/modules/eesh-workshop/forecast-view";
import { eeshInsights } from "@/modules/eesh-workshop/insights";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ subject: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const forecast = eeshForecast((await params).subject);
  return { title: forecast ? `${forecast.label} · ${forecast.target} оны таамаг · ЭЕШ Workshop` : "ЭЕШ Workshop", robots: { index: false, follow: false } };
}

// Workshop → ЭЕШ → «2027 оны таамаг» (owner request 2026-11-20: a predicted 2027 paper and the exercises it may hold, even
// if inaccurate). Public like the subject page: topic names, chances and points only, no question text.
export default async function EeshForecastPage({ params }: Props) {
  const { subject } = await params;
  const forecast = eeshForecast(subject), insights = eeshInsights(subject);
  if (!forecast || !insights) notFound();
  return <EeshForecastView forecast={forecast} insights={insights} />;
}
