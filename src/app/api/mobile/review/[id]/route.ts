import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { accessMock } from "@/modules/exams/service";
import { MockAccessRequired } from "@/modules/exams/payments";
import type { ExamState } from "@/modules/exams/types";

type Context = { params: Promise<{ id: string }> };

// The mobile app's counterpart of /workspace/review/[id]: one finished mock of this student with its report,
// read through the page's own access check (`accessMock`), plus the printed choices of the reviewed questions
// from the attempt's own snapshot and the finish time as the page formats it.
// Where the page sends the student to checkout this answers 402 with `checkout` (the mock's slug); where the
// sitting is still open, and the page continues on the timed screen, 409 with `attempt` (its id) and no report.
// Read-only.
export async function GET(request: Request, context: Context) {
  try {
    const user = await apiUser(request);
    const { id } = await context.params;
    let attempt;
    try { attempt = await accessMock(id, user.id); }
    catch (error) {
      if (error instanceof MockAccessRequired) return privateJson({ error: error.message, checkout: error.slug }, 402);
      throw error;
    }
    if (!attempt.report) return privateJson({ error: "Шалгалт дуусаагүй байна.", attempt: attempt.id }, 409);
    // The printed choices come from this attempt's own snapshot, after access was confirmed above.
    const row = await getDb().mockAttempt.findFirst({ where: { id, userId: user.id }, select: { state: true } });
    const reviewed = new Set(attempt.report.reviews.map(review => review.id));
    const options: Record<string, string[]> = {};
    for (const stage of (row?.state as unknown as ExamState | undefined)?.definition.stages ?? []) {
      for (const question of [...stage.questions, ...(stage.variants?.lower ?? []), ...(stage.variants?.higher ?? [])]) {
        if (reviewed.has(question.id) && question.options?.length) options[question.id] = question.options;
      }
    }
    const finishedLabel = attempt.finishedAt ? new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.finishedAt)) : "Дууссан";
    return privateJson({ attempt, options, finishedLabel });
  } catch (error) { return apiFailure(error); }
}
