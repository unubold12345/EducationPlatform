import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { accessMock } from "./service";
import { MockAccessRequired } from "./payments";

// The one definition of "this student is sitting a timed exam right now". AI help and practice
// answers stay closed during a sitting. Reading a mock settles deadlines that passed while it was
// closed, so an abandoned sitting does not block the student forever.
export async function activeTimedSitting(userId: string): Promise<{ href: string } | null> {
  const db = getDb();
  const paper = await db.paperAttempt.findFirst({ where: { userId, status: "IN_PROGRESS", deadline: { gt: new Date() } }, select: { id: true } });
  if (paper) return { href: "/papers/attempts/" + paper.id };
  const mocks = await db.mockAttempt.findMany({ where: { userId, status: "IN_PROGRESS" }, select: { id: true } });
  for (const { id } of mocks) {
    const href = "/exams/attempts/" + id;
    try {
      const attempt = await accessMock(id, userId);
      if (!attempt.finishedAt) return { href };
    } catch (error) {
      if (error instanceof MockAccessRequired) continue;
      // Another tab is saving that sitting, so it is certainly still open.
      if (error instanceof ApiError && error.status === 409) return { href };
      throw error;
    }
  }
  return null;
}
