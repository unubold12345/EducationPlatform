import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { accessMock } from "@/modules/exams/service";
import { MockAccessRequired } from "@/modules/exams/payments";
import type { ExamState } from "@/modules/exams/types";
import { ReviewView } from "@/modules/workspace/review";
export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("/workspace/review");
  let attempt;
  try { attempt = await accessMock(id, user.id); }
  catch (error) {
    if (error instanceof MockAccessRequired) redirect("/checkout/" + error.slug);
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  // A sitting that is still open continues on the Workspace's timed screen.
  if (!attempt.report) redirect("/exams/attempts/" + attempt.id);
  // The printed choices come from this attempt's own snapshot, after access was confirmed above.
  const row = await getDb().mockAttempt.findFirst({ where: { id, userId: user.id }, select: { state: true } });
  const reviewed = new Set(attempt.report.reviews.map(review => review.id));
  const options: Record<string, string[]> = {};
  for (const stage of (row?.state as unknown as ExamState | undefined)?.definition.stages ?? []) {
    for (const question of [...stage.questions, ...(stage.variants?.lower ?? []), ...(stage.variants?.higher ?? [])]) {
      if (reviewed.has(question.id) && question.options?.length) options[question.id] = question.options;
    }
  }
  // Format once on the server: browser locale support can differ from Node and break hydration.
  const finishedLabel = attempt.finishedAt ? new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.finishedAt)) : "Дууссан";
  return <ReviewView attempt={attempt} options={options} finishedLabel={finishedLabel} />;
}
