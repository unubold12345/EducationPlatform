// ЭЕШ Workshop (owner request 2026-11-20): how each subject's paper changed year by year, which topics recur, and a
// cross-year drill of one topic. Client-safe shapes and pure rules; the numbers come from insights.json, built by
// scripts/build-eesh-insights.mjs, and the drill's answers stay on the server (practice check API).
import type { ExamFigure } from "../exams/types.ts";
import type { EntranceSubject } from "../exams/entrance/subjects.ts";
import type { PracticeQuestion } from "../exam-practice/types.ts";

export type EeshFormat = {
  year: number; forms: number; minutes: number; points: number;
  part1: { count: number; points: number }; part2: { count: number; points: number }; listening: number;
};
export type EeshDomain = { name: string; points: Record<string, number>; total: number; early: number; late: number; drill: number };
/** `years`: the years the topic was on the paper. */
export type EeshTopic = { id: string; label: string; domain: string; years: number[]; questions: number; points: number; recent: number; drill: number };
export type EeshInsights = {
  subject: EntranceSubject; label: string; years: number[]; papers: number;
  formats: EeshFormat[]; changes: { year: number; notes: string[] }[];
  domains: EeshDomain[]; topics: EeshTopic[]; note: string;
  free: { slug: string; domains: Record<string, number> };
};
/** subject → year (or a paper's slug when its forms differ) → question number → topic id. */
export type EeshTopicIndex = Record<string, Record<string, Record<string, string>>>;

export const EESH_DRILL_SIZE = 10;
/** English questions that need their passage, conversation or word bank: the drill shows one question alone. */
export const SHARED_ENGLISH_DOMAINS = ["Уншиж ойлгох", "Хэсэг II", "Сонсож ойлгох"];

/** A drill question stands alone: a choice item without a passage, shared context, word bank or task drawing. */
export function drillEligible(question: PracticeQuestion, english: boolean) {
  if (question.kind !== "choice" || !question.options?.length) return false;
  if (question.passage || question.context || question.wordBank?.length || question.groupFigure || question.audioPart) return false;
  if (english) return !SHARED_ENGLISH_DOMAINS.includes(question.domain);
  // ЭЕШ Part II tasks carry their statement on the task (`task`); Part I items never do.
  return !question.task;
}

export type DrillFilter = { topic: string } | { domain: string };
/** Reads ?topic= or ?domain= against the subject's insights; anything else is refused. */
export function drillFilter(insights: EeshInsights, params: URLSearchParams): DrillFilter | null {
  const topic = params.get("topic"), domain = params.get("domain");
  if (topic && !domain) return insights.topics.some(item => item.id === topic && item.drill > 0) ? { topic } : null;
  if (domain && !topic) return insights.domains.some(item => item.name === domain && (item.drill > 0 || (insights.free.domains[domain] ?? 0) > 0)) ? { domain } : null;
  return null;
}
/** One option of the drill's topic picker: a topic (`topic:<id>`) or a whole area (`domain:<name>`), with its drillable
 * questions across all papers (`count`) and in the subject's free paper (`free`). */
export type DrillChoice = { value: string; label: string; group: string; count: number; free: number };
export function drillChoices(insights: EeshInsights): DrillChoice[] {
  return [
    ...insights.topics.filter(topic => topic.drill > 0).map(topic => ({ value: "topic:" + topic.id, label: topic.label, group: topic.domain, count: topic.drill, free: 0 })),
    ...insights.domains.filter(domain => domain.drill > 0 || insights.free.domains[domain.name]).map(domain => ({ value: "domain:" + domain.name, label: domain.name + " (бүх сэдэв)", group: "Чиглэлээр", count: domain.drill, free: insights.free.domains[domain.name] ?? 0 })),
  ];
}
/** The drill page (2026-11-20, owner request: the drill opens on its own page) for a picker value, or the bare page. */
export function drillHref(subject: string, value?: string) {
  const base = `/labs/eesh/${subject}/drill`;
  if (!value) return base;
  const [kind, ...rest] = value.split(":");
  return `${base}?${kind === "topic" ? "topic" : "domain"}=${encodeURIComponent(rest.join(":"))}`;
}
/** The picker value a drill page address asks for (`?topic=` before `?domain=`). */
export function drillValue(query: { topic?: unknown; domain?: unknown }) {
  return typeof query.topic === "string" && query.topic ? "topic:" + query.topic : typeof query.domain === "string" && query.domain ? "domain:" + query.domain : undefined;
}

export function topicsOf(index: EeshTopicIndex, subject: string, slug: string, year: number | null): Record<string, string> {
  return index[subject]?.[slug] ?? (year === null ? undefined : index[subject]?.[String(year)]) ?? {};
}

export type DrillPaper = { slug: string; year: number | null; form: string; questions: PracticeQuestion[]; topics: Record<string, string>; checked: ReadonlySet<string> };
export type DrillItem = {
  slug: string; year: number | null; form: string; id: string; label: string; domain: string; topic?: string;
  prompt?: string; options: string[]; optionLabels?: string[]; compactOptions?: boolean; figure?: ExamFigure; points: number;
  instructions?: string; task?: string;
};

function shuffled<T>(list: readonly T[], random: () => number) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function drillItem(paper: DrillPaper, question: PracticeQuestion, english: boolean): DrillItem {
  const topic = paper.topics[question.label];
  return {
    slug: paper.slug, year: paper.year, form: paper.form, id: question.id, label: question.label, domain: question.domain,
    ...(topic ? { topic } : {}), prompt: question.prompt, options: question.options ?? [], optionLabels: question.optionLabels,
    compactOptions: question.compactOptions, figure: question.figure, points: question.points ?? 1,
    ...(english && question.instructions ? { instructions: question.instructions, task: question.task } : {}),
  };
}

/**
 * Up to `size` unchecked questions of one topic or domain, spread over the years: one year at a time in a random order,
 * and never the same question number twice in a year (the forms of a year are parallel versions of one item).
 */
export function pickDrill(papers: readonly DrillPaper[], filter: DrillFilter, english: boolean, size = EESH_DRILL_SIZE, random: () => number = Math.random): DrillItem[] {
  const buckets = new Map<string, { paper: DrillPaper; question: PracticeQuestion }[]>();
  for (const paper of papers) for (const question of paper.questions) {
    if (!drillEligible(question, english) || paper.checked.has(question.id)) continue;
    if ("topic" in filter ? paper.topics[question.label] !== filter.topic : question.domain !== filter.domain) continue;
    const key = paper.year === null ? "free" : String(paper.year);
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push({ paper, question });
  }
  const queues = shuffled([...buckets.keys()], random).map(key => ({ key, list: shuffled(buckets.get(key)!, random) }));
  const used = new Set<string>(), picked: DrillItem[] = [];
  while (picked.length < size && queues.some(queue => queue.list.length)) {
    for (const queue of queues) {
      while (queue.list.length) {
        const { paper, question } = queue.list.shift()!;
        const slot = queue.key + ":" + question.label;
        if (used.has(slot)) continue;
        used.add(slot);
        picked.push(drillItem(paper, question, english));
        break;
      }
      if (picked.length >= size) break;
    }
  }
  return picked;
}

const sameShape = (a: EeshFormat, b: EeshFormat) => a.minutes === b.minutes && a.points === b.points && a.listening === b.listening
  && a.part1.count === b.part1.count && a.part1.points === b.part1.points && a.part2.count === b.part2.count && a.part2.points === b.part2.points;
export type FormatRun = { from: number; to: number; missing: number[]; format: EeshFormat; notes: string[] };
/** Years with the same paper format in one row; a year without a paper does not split a row, it is listed in it. */
export function formatRuns(insights: EeshInsights): FormatRun[] {
  const runs: FormatRun[] = [];
  for (const format of insights.formats) {
    const last = runs.at(-1);
    if (last && sameShape(last.format, format)) { last.to = format.year; continue; }
    const notes = (insights.changes.find(change => change.year === format.year)?.notes ?? []).filter(note => !/mock байхгүй$/.test(note));
    runs.push({ from: format.year, to: format.year, missing: [], format, notes });
  }
  for (const run of runs) for (let year = run.from + 1; year < run.to; year++) if (!insights.years.includes(year)) run.missing.push(year);
  return runs;
}
/** Points per paper in the first three years against the last three, biggest change first. */
export function domainTrends(insights: EeshInsights) {
  return insights.domains.map(domain => ({ name: domain.name, early: domain.early, late: domain.late, delta: Math.round((domain.late - domain.early) * 10) / 10 }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.name.localeCompare(b.name));
}
export const yearSpan = (years: readonly number[], count = 3) => {
  const list = years.slice(0, count), last = years.slice(-count);
  const span = (part: readonly number[]) => part.length > 1 ? `${part[0]}–${part.at(-1)}` : String(part[0] ?? "");
  return { early: span(list), late: span(last) };
};

export type EeshScore = { checked: number; correct: number };
export type EeshProgress = { checked: number; topics: (EeshScore & { id: string; label: string })[]; domains: (EeshScore & { name: string })[] };
/** The student's accuracy per topic and per domain over the ЭЕШ practice answers they have checked. */
export function eeshProgress(insights: EeshInsights, rows: { questions: { id: string; number: string; domain: string }[]; topics: Record<string, string>; results: Record<string, { correct: boolean | null }> }[]): EeshProgress {
  const topics = new Map<string, EeshScore>(), domains = new Map<string, EeshScore>();
  const add = (map: Map<string, EeshScore>, key: string, correct: boolean) => {
    const score = map.get(key) ?? map.set(key, { checked: 0, correct: 0 }).get(key)!;
    score.checked += 1; if (correct) score.correct += 1;
  };
  let checked = 0;
  for (const row of rows) {
    const byId = new Map(row.questions.map(question => [question.id, question]));
    for (const [id, result] of Object.entries(row.results)) {
      const question = byId.get(id);
      if (!question || typeof result?.correct !== "boolean") continue;
      checked += 1;
      add(domains, question.domain, result.correct);
      const topic = row.topics[question.number];
      if (topic) add(topics, topic, result.correct);
    }
  }
  const labels = new Map(insights.topics.map(topic => [topic.id, topic.label]));
  return {
    checked,
    topics: [...topics].filter(([id]) => labels.has(id)).map(([id, score]) => ({ id, label: labels.get(id)!, ...score })),
    domains: [...domains].map(([name, score]) => ({ name, ...score })),
  };
}
/** Weakest first: lowest accuracy among those with at least `min` checked answers, then the most practised. */
export function weakest<T extends EeshScore>(list: readonly T[], min = 3, limit = 5): T[] {
  return list.filter(item => item.checked >= min).sort((a, b) => a.correct / a.checked - b.correct / b.checked || b.checked - a.checked).slice(0, limit);
}
