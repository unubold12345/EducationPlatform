import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { listeningLabEnabled, readingLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";
import { practiceSummaries } from "@/modules/exam-practice/service";
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceTotal } from "@/modules/exams/entrance/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import type { ExamProgram } from "@/modules/exams/types";
import { finishedAttempts, openAttempts } from "@/modules/workspace/data";

const date = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "short", day: "numeric" });

// The mobile app's counterpart of /workspace (src/app/workspace/page.tsx): the same counts, the open sitting to
// resume, the last four results, the practice sessions, the programme cards and the labs that are switched on.
// Read-only; each row is the signed-in student's own. Paths are website paths, which the app maps to its screens.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    const db = getDb();
    const [completed, open, recent, practice, opened] = await Promise.all([
      db.mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
      db.mockAttempt.count({ where: { userId: user.id, status: "IN_PROGRESS" } }),
      finishedAttempts(user.id, { take: 4 }),
      practiceSummaries(user.id),
      openAttempts(user.id),
    ]);
    const scored = recent.items.filter(item => item.percent !== null);
    const average = scored.length ? Math.round(scored.reduce((sum, item) => sum + item.percent!, 0) / scored.length) : null;
    const resume = opened[0];
    const count = (program: ExamProgram) => examDefinitions.filter(exam => exam.program === program).length;
    return privateJson({
      name: user.name.trim().slice(0, 60),
      resume: resume ? { id: resume.id, slug: resume.slug, title: resume.title, href: "/exams/attempts/" + resume.id } : null,
      stats: { completed, open, practice: practice.length, average },
      programs: [
        { program: "sat", href: "/exams/sat", label: "Digital SAT", detail: `${count("sat")} бүтэн mock · 98 асуулт`, tag: "Reading · Math" },
        { program: "ielts", href: "/exams/ielts", label: "IELTS Academic", detail: `${count("ielts")} бүтэн mock · 4 чадвар`, tag: "Listening · Speaking" },
        { program: "entrance", href: "/exams/eesh", label: "ЭЕШ", detail: `${entranceTotal} mock · 5 хичээл`, tag: "Мат · Физик · Хими · Био · Англи" },
        { program: "jlpt", href: "/exams/jlpt", label: "JLPT N5・N4", detail: "6 бүтэн mock · япон audio", tag: "語彙 · 文法 · 聴解" },
        { program: "hsk", href: "/exams/hsk", label: "HSK 1", detail: `${hskMocks.length} бүтэн mock · хятад audio`, tag: "听力 · 阅读" },
      ],
      labs: [
        ...(speakingLabEnabled() ? [{ href: "/labs/ielts-speaking", label: "Ярианы хамтрагч", detail: "AI-тай IELTS Speaking", icon: "mic" }] : []),
        ...(writingLabEnabled() ? [{ href: "/labs/ielts-writing", label: "Эссэ студи", detail: "AI засвар, band тооцоо", icon: "pen" }] : []),
        ...(listeningLabEnabled() ? [{ href: "/labs/ielts-listening", label: "Сонсгол лаб", detail: "Part 1–4, давтан сонсох", icon: "sound" }] : []),
        ...(readingLabEnabled() ? [{ href: "/labs/ielts-reading", label: "Унших лаб", detail: "5 жишээ, өөрийн файлаас", icon: "book" }] : []),
      ],
      recent: {
        count: recent.count,
        items: recent.items.map(item => ({ ...item, date: date.format(new Date(item.finishedAt)), href: "/workspace/review/" + item.id })),
      },
      practice: practice.slice(0, 5).map(item => ({
        slug: item.slug, title: item.title, checked: item.checked, total: item.total, correct: item.correct, graded: item.graded,
        href: "/exams/" + item.slug + "/practice",
      })),
    });
  } catch (error) { return apiFailure(error); }
}
