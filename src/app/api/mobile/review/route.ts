import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { finishedAttempts, openAttempts } from "@/modules/workspace/data";
import type { ExamProgram } from "@/modules/exams/types";

const PAGE = 12;
const programs: ExamProgram[] = ["sat", "ielts", "entrance", "jlpt", "hsk"];
const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "medium" });

// The mobile app's counterpart of /workspace/review: one page of the student's finished mocks with their scores
// and the sittings that are still open, read by the page's own loaders with the page's own filter and paging
// (`?program=` and `?page=`, 12 a page). Dates are formatted here, as the page formats them on the server.
// Read-only.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const query = new URL(request.url).searchParams;
    const program = programs.find(item => item === query.get("program"));
    const page = Math.max(1, Math.min(500, Number.parseInt(query.get("page") ?? "1", 10) || 1));
    const [{ items, count }, open] = await Promise.all([
      finishedAttempts(user.id, { skip: (page - 1) * PAGE, take: PAGE, program }),
      openAttempts(user.id),
    ]);
    return privateJson({
      items: items.map(item => ({ ...item, dateLabel: date.format(new Date(item.finishedAt)) })),
      open: open.map(item => ({ ...item, dateLabel: date.format(new Date(item.updatedAt)) })),
      count, page, pages: Math.max(1, Math.ceil(count / PAGE)), program: program ?? null,
    });
  } catch (error) { return apiFailure(error); }
}
