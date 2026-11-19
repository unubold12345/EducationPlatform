import "server-only";
import { getDb } from "@/lib/db";
import { examDefinitions, findExam } from "@/modules/exams/definitions";
import { freeMocksOf, isFreeMock } from "@/modules/exams/free/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { toeflMocks } from "@/modules/exams/toefl/catalog";
import { topikMocks } from "@/modules/exams/topik/catalog";
import { MOCK_PRICE_LABEL } from "@/modules/exams/pricing";
import { hubAccess } from "@/modules/subscriptions/mock-access";
import { mockPractice } from "./form";
import { sectionSkill, type LabSkill } from "./skills";

// The mocks a Workshop lab lists for one skill (owner request 2026-11-19), with what the student may open and how far
// they got. Display only: the lab mock page checks access, the open sitting and the plan again.
export type LabExam = "ielts" | "toefl" | "jlpt" | "hsk" | "topik";
export type LabMock = {
  slug: string; title: string; theme?: string; href: string;
  /** Whether the student can open it now (free, bought or in a plan); otherwise `href` is the mock's briefing. */
  open: boolean; access: "free" | "bought" | "plan" | "locked";
  note: string; questions: number; checked: number; correct: number;
};

const catalogs: Record<LabExam, () => { slug: string; title: string; theme?: string }[]> = {
  ielts: () => examDefinitions.filter(exam => exam.program === "ielts").map(exam => ({ slug: exam.slug, title: exam.title })),
  toefl: () => toeflMocks.map(mock => ({ slug: mock.slug, title: mock.title, theme: mock.theme })),
  jlpt: () => jlptMocks.map(mock => ({ slug: mock.slug, title: mock.title, theme: mock.theme })),
  hsk: () => hskMocks.map(mock => ({ slug: mock.slug, title: mock.title, theme: mock.theme })),
  topik: () => topikMocks.map(mock => ({ slug: mock.slug, title: mock.title, theme: mock.theme })),
};

// The question ids of a skill in a mock, from its source definition (the structure, which publishing never changes).
const skillCache = new Map<string, string[]>();
function skillQuestions(slug: string, skill: LabSkill) {
  const key = skill + ":" + slug;
  const cached = skillCache.get(key);
  if (cached) return cached;
  const definition = findExam(slug);
  const ids = definition ? (() => {
    const { form } = mockPractice(definition);
    const sections = new Set(form.sections.filter(section => sectionSkill(form.subject, section) === skill).map(section => section.id));
    return form.questions.filter(question => sections.has(question.section)).map(question => question.id);
  })() : [];
  skillCache.set(key, ids);
  return ids;
}

export async function labMocks(userId: string | undefined, exam: LabExam, skill: LabSkill): Promise<LabMock[]> {
  const list = [...freeMocksOf(exam).map(mock => ({ slug: mock.slug, title: mock.title, theme: undefined as string | undefined })), ...catalogs[exam]()]
    .map(mock => ({ ...mock, ids: skillQuestions(mock.slug, skill) })).filter(mock => mock.ids.length);
  const slugs = list.map(mock => mock.slug);
  const [access, rows] = await Promise.all([
    hubAccess(userId, slugs, exam),
    userId ? getDb().practiceSession.findMany({ where: { userId, slug: { in: slugs } }, select: { slug: true, results: true } }) : Promise.resolve([]),
  ]);
  const results = new Map(rows.map(row => [row.slug, (row.results ?? {}) as Record<string, { correct: boolean | null }>]));
  return list.map(mock => {
    const free = isFreeMock(mock.slug), state = access.state(mock.slug);
    const kind = free ? "free" : state === "bought" ? "bought" : state === "plan" || state === "picked" ? "plan" : "locked";
    const done = results.get(mock.slug) ?? {};
    const checked = mock.ids.filter(id => done[id]);
    return {
      slug: mock.slug, title: mock.title, ...(mock.theme ? { theme: mock.theme } : {}),
      open: kind !== "locked" && Boolean(userId), access: kind,
      href: kind !== "locked" && userId ? `/labs/mock/${skill}/${mock.slug}` : "/exams/" + mock.slug,
      note: kind === "free" ? "Үнэгүй" : kind === "bought" ? "Нээлттэй" : kind === "plan" ? "Багцад" : MOCK_PRICE_LABEL,
      questions: mock.ids.length, checked: checked.length, correct: checked.filter(id => done[id].correct).length,
    };
  });
}
