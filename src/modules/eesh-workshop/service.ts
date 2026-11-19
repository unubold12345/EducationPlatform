import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { getExam } from "@/modules/content/published";
import { findExam } from "@/modules/exams/definitions";
import { mocksFor } from "@/modules/exams/entrance/catalog";
import { isFreeMock } from "@/modules/exams/free/catalog";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { practiceDuringMockAllowed } from "@/lib/local-pilot";
import { hubAccess } from "@/modules/subscriptions/mock-access";
import { mockPractice } from "@/modules/exam-practice/form";
import { requirePractice, TimedSittingOpen } from "@/modules/exam-practice/service";
import { EESH_DRILL_SIZE, eeshProgress, pickDrill, topicsOf, type DrillFilter, type DrillItem, type DrillPaper, type EeshInsights } from "./contracts";
import { eeshTopicIndex } from "./insights";

export type DrillSet = { items: DrillItem[]; open: number; total: number; freeOnly: boolean };

function shuffle<T>(list: T[]) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

/**
 * Ten questions of one topic (or domain) from the papers this student may practise, spread over the years. The hub's
 * batch lookup only narrows the papers; every paper a question comes from is checked again by `requirePractice`
 * (plan, purchase or free paper, and no open timed sitting), and answers go through the practice check API.
 */
export async function eeshDrill(userId: string, insights: EeshInsights, filter: DrillFilter): Promise<DrillSet> {
  const subject = insights.subject, english = subject === "english";
  const papers = mocksFor(subject);
  const access = await hubAccess(userId, papers.map(paper => paper.slug), "entrance");
  const openPapers = papers.filter(paper => access.practice(paper.slug));
  // The free paper has no topic tags, so only a domain drill can use it.
  const sources = [...openPapers.map(paper => ({ slug: paper.slug, year: paper.year as number | null, form: paper.form })),
    ...("domain" in filter && isFreeMock(insights.free.slug) ? [{ slug: insights.free.slug, year: null, form: "Үнэгүй" }] : [])];
  if (!sources.length) throw new ApiError(402, "Сэдвийн дасгал ЭЕШ багц эсвэл худалдаж авсан mock-уудын асуултаас бүрдэнэ.");
  const sitting = practiceDuringMockAllowed() ? null : await activeTimedSitting(userId);
  if (sitting) throw new TimedSittingOpen(sitting.href);

  const rows = await getDb().practiceSession.findMany({ where: { userId, slug: { in: sources.map(source => source.slug) } }, select: { slug: true, results: true } });
  const checked = new Map(rows.map(row => [row.slug, new Set(Object.keys((row.results ?? {}) as Record<string, unknown>))]));
  const load = async (source: (typeof sources)[number]): Promise<DrillPaper | null> => {
    const definition = await getExam(source.slug);
    if (!definition) return null;
    return { ...source, questions: mockPractice(definition).form.questions, topics: topicsOf(eeshTopicIndex, subject, source.slug, source.year), checked: checked.get(source.slug) ?? new Set() };
  };
  // Two random forms per year first; the rest only when those run short of unchecked questions.
  const order = shuffle([...sources]), first: typeof sources = [], rest: typeof sources = [], perYear = new Map<string, number>();
  for (const source of order) {
    const key = String(source.year), count = perYear.get(key) ?? 0;
    (count < 2 ? first : rest).push(source);
    perYear.set(key, count + 1);
  }
  const loaded = (await Promise.all(first.map(load))).filter(paper => paper !== null);
  let items = pickDrill(loaded, filter, english);
  if (items.length < EESH_DRILL_SIZE && rest.length) {
    loaded.push(...(await Promise.all(rest.map(load))).filter(paper => paper !== null));
    items = pickDrill(loaded, filter, english);
  }
  for (const slug of new Set(items.map(item => item.slug))) await requirePractice(userId, slug);
  return { items, open: openPapers.length, total: papers.length, freeOnly: !openPapers.length };
}

/** The student's checked ЭЕШ practice answers of one subject, by topic and domain (practice mode and the drill). */
export async function eeshStudentProgress(userId: string, insights: EeshInsights) {
  const subject = insights.subject;
  const rows = await getDb().practiceSession.findMany({ where: { userId, slug: { startsWith: `eesh-${subject}-` } }, select: { slug: true, results: true } });
  const years = new Map(mocksFor(subject).map(paper => [paper.slug, paper.year]));
  return eeshProgress(insights, rows.flatMap(row => {
    const definition = findExam(row.slug);
    if (!definition || definition.program !== "entrance") return [];
    const questions = definition.stages.flatMap(stage => stage.questions).map(question => ({ id: question.id, number: question.number ?? "", domain: question.domain }));
    const year = years.get(row.slug);
    return [{ questions, topics: year === undefined ? {} : topicsOf(eeshTopicIndex, subject, row.slug, year), results: (row.results ?? {}) as Record<string, { correct: boolean | null }> }];
  }));
}
