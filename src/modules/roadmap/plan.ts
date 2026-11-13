// Study roadmap toward one exam date. Pure: no database, framework or "@/" imports, so the server,
// the page and the unit tests share it. The server passes in the goal's mocks and the student's finished
// sittings; nothing here is trusted from the browser except the settings, which are validated below.
// A plan may carry an AI-written structure (`structure.ts`): it names the phases, the weekly themes and the
// study routines, while the mocks, links, dates and ticks are still worked out here.
import { allowedTools, phaseOfWeeks, type AiStructure, type AiTool } from "./structure.ts";

export type GoalId = "sat" | "ielts" | "eesh-math" | "eesh-physics" | "eesh-chemistry" | "eesh-biology" | "eesh-english" | "jlpt-n5" | "jlpt-n4" | "hsk1";
export type Lab = "reading" | "listening" | "writing" | "speaking";
export type Goal = {
  id: GoalId;
  label: string;
  /** Where the goal's mocks are listed. */
  href: string;
  /** Rough length of one full timed mock, minutes. */
  mockMinutes: number;
  /** Language exams get weekly vocabulary review. */
  vocabulary: boolean;
  /** Workshop studios that fit the goal. */
  labs: Lab[];
};

export const GOALS: Goal[] = [
  { id: "ielts", label: "IELTS Academic", href: "/exams/ielts", mockMinutes: 165, vocabulary: true, labs: ["reading", "listening", "writing", "speaking"] },
  { id: "sat", label: "Digital SAT", href: "/exams/sat", mockMinutes: 145, vocabulary: true, labs: [] },
  { id: "eesh-math", label: "ЭЕШ · Математик", href: "/exams/eesh?subject=math", mockMinutes: 100, vocabulary: false, labs: [] },
  { id: "eesh-physics", label: "ЭЕШ · Физик", href: "/exams/eesh?subject=physics", mockMinutes: 100, vocabulary: false, labs: [] },
  { id: "eesh-chemistry", label: "ЭЕШ · Хими", href: "/exams/eesh?subject=chemistry", mockMinutes: 100, vocabulary: false, labs: [] },
  { id: "eesh-biology", label: "ЭЕШ · Биологи", href: "/exams/eesh?subject=biology", mockMinutes: 80, vocabulary: false, labs: [] },
  { id: "eesh-english", label: "ЭЕШ · Англи хэл", href: "/exams/eesh?subject=english", mockMinutes: 80, vocabulary: true, labs: [] },
  { id: "jlpt-n5", label: "JLPT N5", href: "/exams/jlpt?level=N5", mockMinutes: 90, vocabulary: true, labs: [] },
  { id: "jlpt-n4", label: "JLPT N4", href: "/exams/jlpt?level=N4", mockMinutes: 115, vocabulary: true, labs: [] },
  { id: "hsk1", label: "HSK 1", href: "/exams/hsk", mockMinutes: 40, vocabulary: true, labs: [] },
];
export const findGoal = (id: unknown) => GOALS.find(goal => goal.id === id) ?? null;

export const PLAN_LIMITS = {
  /** The exam must be between tomorrow and a year from today. */
  maxDaysAhead: 365,
  daysPerWeek: { min: 1, max: 7 },
  minutesPerDay: { min: 15, max: 240 },
  /** Target is a percentage of the mock's points: the site reports raw scores, not bands or scaled scores. */
  target: { min: 30, max: 100 },
  doneIds: 600,
  taskId: 80,
  bodyBytes: 4096,
} as const;

export type PlanSettings = { goal: GoalId; examDate: string; target: number | null; daysPerWeek: number; minutesPerDay: number };

// ---- Calendar days in Ulaanbaatar (UTC+8, no daylight saving) ----

const DAY_MS = 864e5;
const UB_OFFSET_MS = 8 * 3600e3;
/** The Ulaanbaatar calendar date of a moment, YYYY-MM-DD. */
export const ubDay = (ms: number) => new Date(ms + UB_OFFSET_MS).toISOString().slice(0, 10);
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Days since 1970-01-01 for a valid YYYY-MM-DD, otherwise null. */
export function dayNumber(day: string): number | null {
  const match = DAY_RE.exec(day);
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // Reject dates that roll over, such as 2026-02-31.
  return new Date(ms).toISOString().slice(0, 10) === day ? ms / DAY_MS : null;
}
export const dayFromNumber = (value: number) => new Date(value * DAY_MS).toISOString().slice(0, 10);
export const addDays = (day: string, days: number) => dayFromNumber((dayNumber(day) ?? 0) + days);
export const daysBetween = (from: string, to: string) => (dayNumber(to) ?? 0) - (dayNumber(from) ?? 0);

/** Mongolian weekday abbreviations, Sunday first (as getUTCDay counts). */
export const MN_WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"] as const;
const MN_WEEKDAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"] as const;
/** "11-р сарын 13", or with `long` "2026 оны 11-р сарын 13, Баасан". Written out because browsers lack Mongolian date data. */
export function mnDate(day: string, long = false) {
  const value = dayNumber(day);
  if (value === null) return day;
  const date = new Date(value * DAY_MS);
  const short = `${date.getUTCMonth() + 1}-р сарын ${date.getUTCDate()}`;
  return long ? `${date.getUTCFullYear()} оны ${short}, ${MN_WEEKDAY_NAMES[date.getUTCDay()]}` : short;
}
export const mnWeekday = (day: string) => MN_WEEKDAYS[new Date((dayNumber(day) ?? 0) * DAY_MS).getUTCDay()];

// ---- Settings ----

const int = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** Reads the settings a student sent. Exact shape: unknown keys are refused. */
export function readSettings(body: unknown, today: string): { ok: true; settings: PlanSettings } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
  const value = body as Record<string, unknown>;
  const allowed = ["goal", "examDate", "target", "daysPerWeek", "minutesPerDay"];
  if (Object.keys(value).some(key => !allowed.includes(key))) return { ok: false, error: "Хүсэлтийн бүтэц буруу байна." };
  const goal = findGoal(value.goal);
  if (!goal) return { ok: false, error: "Шалгалтаа сонгоно уу." };
  if (typeof value.examDate !== "string" || dayNumber(value.examDate) === null) return { ok: false, error: "Шалгалтын өдрийг зөв оруулна уу." };
  const ahead = daysBetween(today, value.examDate);
  if (ahead < 1) return { ok: false, error: "Шалгалтын өдөр маргаашаас хойш байх ёстой." };
  if (ahead > PLAN_LIMITS.maxDaysAhead) return { ok: false, error: "Шалгалтын өдөр нэг жилийн дотор байх ёстой." };
  const target = value.target ?? null;
  if (target !== null && !int(target, PLAN_LIMITS.target.min, PLAN_LIMITS.target.max)) return { ok: false, error: `Зорилтот оноо ${PLAN_LIMITS.target.min}–${PLAN_LIMITS.target.max}% байна.` };
  if (!int(value.daysPerWeek, PLAN_LIMITS.daysPerWeek.min, PLAN_LIMITS.daysPerWeek.max)) return { ok: false, error: "Долоо хоногт хэдэн өдөр суралцахаа сонгоно уу." };
  if (!int(value.minutesPerDay, PLAN_LIMITS.minutesPerDay.min, PLAN_LIMITS.minutesPerDay.max)) return { ok: false, error: `Өдөрт ${PLAN_LIMITS.minutesPerDay.min}–${PLAN_LIMITS.minutesPerDay.max} минут сонгоно уу.` };
  return { ok: true, settings: { goal: goal.id, examDate: value.examDate, target, daysPerWeek: value.daysPerWeek, minutesPerDay: value.minutesPerDay } };
}

/** A stored task id list, cleaned: strings of the task-id shape, unique, bounded. */
export function readDone(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((id): id is string => typeof id === "string" && TASK_ID_RE.test(id));
  return [...new Set(ids)].slice(0, PLAN_LIMITS.doneIds);
}
export const TASK_ID_RE = /^[a-z0-9][a-z0-9:-]{0,79}$/;

/** The body of a task toggle: `{ task, done }`. */
export function readToggle(body: unknown): { task: string; done: boolean } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => key !== "task" && key !== "done")) return null;
  if (typeof value.task !== "string" || !TASK_ID_RE.test(value.task) || typeof value.done !== "boolean") return null;
  return { task: value.task, done: value.done };
}

// ---- Roadmap ----

export type MockRef = { slug: string; title: string };
/** A finished sitting of one of the goal's mocks, from the server. */
export type FinishedRef = { slug: string; attemptId: string; finishedDay: string; percent: number | null };
export type TaskKind = "mock" | "review" | "practice" | "vocabulary" | "lab" | "chat" | "myexam" | "study" | "rest" | "checklist";
export type Task = {
  id: string;
  kind: TaskKind;
  title: string;
  detail: string;
  href: string | null;
  minutes: number;
  /** Suggested study day, YYYY-MM-DD. */
  day: string;
  done: boolean;
  /** Ticked by the site itself (a submitted mock), not by the student. */
  auto: boolean;
  /** The skill or topic the session trains (AI-written routines). */
  skill?: string;
  /** The site tool behind `href`, named for the page ("Reading Lab", "Practice mode · Mock 7"). */
  resource?: string;
  /** A routine written by the AI planner rather than the built-in schedule. */
  ai?: true;
};
export type Phase = "start" | "build" | "mocks" | "final";
export type Week = {
  index: number; phase: Phase; from: string; to: string; tasks: Task[]; minutes: number;
  /** Index into the roadmap's `phases`. */
  stage: number;
  /** The week's topic focus, when the plan has an AI structure. */
  theme: string | null;
};
/** One phase of the plan with the weeks it covers (0-based, inclusive). */
export type PhaseInfo = { index: number; title: string; focus: string; from: number; to: number };
/** How the ticks compare with the calendar: nothing late, one or two tasks late, three or more, or ahead of schedule. */
export type Pace = "ahead" | "on" | "slip" | "behind";
export type Roadmap = {
  goal: Goal;
  settings: PlanSettings;
  startDay: string;
  today: string;
  daysLeft: number;
  weeks: Week[];
  currentWeek: number | null;
  /** Up to three tasks for today: overdue ones first, then today's, or the next one if nothing is due. */
  focus: Task[];
  progress: { done: number; total: number; due: number; dueDone: number };
  scores: { first: number | null; latest: number | null; count: number };
  /** Mocks the plan schedules for timed sittings. */
  mockCount: number;
  passed: boolean;
  /** The plan's phases in order: the AI's own when it wrote the structure, otherwise the four built-in ones. */
  phases: PhaseInfo[];
  /** The AI-written strategy, when the plan has one. */
  ai: { headline: string; diagnosis: string; tactics: string[]; madeDay: string } | null;
  /** Scored sittings of the goal's mocks, oldest first (the latest twelve). */
  history: { day: string; percent: number }[];
  /** Tasks whose day has passed without a tick, and what that says about the pace. */
  late: number;
  pace: Pace;
  /** Calendar days from the plan's first day to the exam. */
  totalDays: number;
};

export const phaseLabels: Record<Phase, string> = {
  start: "Түвшнээ тогтоох",
  build: "Суурь бэхжүүлэх",
  mocks: "Mock давталт",
  final: "Сүүлийн долоо хоног",
};
export const phaseFocus: Record<Phase, string> = {
  start: "Оношлох mock-оор одоогийн түвшнээ тогтоож, сул чадвараа олно.",
  build: "Сул сэдвүүдээ цаггүй дадлага, давталт, лабуудаар бэхжүүлнэ.",
  mocks: "Бүтэн mock-ыг цагтай өгч, алдаа бүрээ задална.",
  final: "Шинэ зүйл нэмэхгүй: хөнгөн давталт, шалгалтын өдрийн бэлтгэл, амралт.",
};
export const paceLabels: Record<Pace, string> = { ahead: "Түрүүлж яваа", on: "Хэмнэлдээ", slip: "Бага зэрэг хоцорсон", behind: "Хоцорч байна" };

const labTasks: Record<Lab, { title: string; detail: string; href: string; minutes: number }> = {
  reading: { title: "Унших лаб: нэг passage", detail: "Нэг passage-ийг 20 минутад хийж, нотолгоогоо шалга.", href: "/labs/ielts-reading", minutes: 30 },
  listening: { title: "Сонсгол лаб: нэг Part", detail: "Нэг Part-ийг сонсоод, алдсан хэсгээ дахин сонс.", href: "/labs/ielts-listening", minutes: 30 },
  writing: { title: "Эссэ студи: Task 2", detail: "Нэг эссэ бичээд AI засварыг ажилла.", href: "/labs/ielts-writing", minutes: 45 },
  speaking: { title: "Ярианы хамтрагч: нэг Part", detail: "Нэг Part-ийг AI хамтрагчтай ярь.", href: "/labs/ielts-speaking", minutes: 20 },
};

// An AI-written routine names a tool; the page it opens is decided here, never by the model.
const toolKind: Record<AiTool, TaskKind> = { practice: "practice", vocabulary: "vocabulary", chat: "chat", myexam: "myexam", reading: "lab", listening: "lab", writing: "lab", speaking: "lab", self: "study" };
const toolPage: Record<Exclude<AiTool, "practice" | "self">, { href: string; resource: string }> = {
  vocabulary: { href: "/workspace/vocabulary", resource: "Үгсийн сан" },
  chat: { href: "/workspace/chat", resource: "AI туслах" },
  myexam: { href: "/workspace/my-exams", resource: "Файлаас шалгалт" },
  reading: { href: labTasks.reading.href, resource: "Reading Lab" },
  listening: { href: labTasks.listening.href, resource: "Listening Lab" },
  writing: { href: labTasks.writing.href, resource: "Essay Studio" },
  speaking: { href: labTasks.speaking.href, resource: "Speaking Lab" },
};

/** How many timed mocks fit the plan: about one a week when studying most days, fewer otherwise. */
export function mockBudget(weeks: number, daysPerWeek: number, available: number) {
  if (available < 1 || weeks < 1) return 0;
  const rate = daysPerWeek >= 5 ? 0.8 : daysPerWeek >= 3 ? 0.6 : 0.4;
  return Math.min(available, weeks === 1 ? 1 : Math.max(2, Math.round(weeks * rate)));
}

/** Which week each scheduled mock falls in: the first in week 0, the last in the final week, the rest leaning late. */
export function mockWeeks(count: number, weeks: number): number[] {
  if (count <= 0) return [];
  if (weeks <= 1) return Array.from({ length: count }, () => 0);
  if (count === 1) return [0];
  const result = [0];
  for (let j = 1; j < count - 1; j++) {
    const share = Math.pow(j / (count - 1), 0.75);
    result.push(Math.min(weeks - 2, Math.max(1, Math.round(1 + (weeks - 3) * share))));
  }
  result.push(weeks - 1);
  return result;
}

/** Spread `count` study days over a week of `length` days (1–7), as offsets from its first day. */
export function studyOffsets(count: number, length: number) {
  const days = Math.max(1, Math.min(count, length));
  if (days === 1) return [0];
  return Array.from({ length: days }, (_, i) => Math.round((i * (length - 1)) / (days - 1)));
}

export function buildRoadmap(input: {
  settings: PlanSettings;
  startDay: string;
  today: string;
  mocks: MockRef[];
  finished: FinishedRef[];
  done: readonly string[];
  /** Workshop studios switched on for this site. */
  labs: readonly Lab[];
  /** The AI-written structure stored with the plan, already read by `readStructure`. */
  structure?: AiStructure | null;
}): Roadmap {
  const { settings, today } = input;
  const goal = findGoal(settings.goal)!;
  // A plan anchored after its own exam date (clock skew) starts today.
  const startDay = daysBetween(input.startDay, settings.examDate) >= 1 ? input.startDay : today;
  const totalDays = Math.max(0, daysBetween(startDay, settings.examDate));
  const weekCount = Math.ceil(totalDays / 7);
  const done = new Set(input.done);
  const finishedBySlug = new Map<string, FinishedRef[]>();
  for (const item of input.finished) finishedBySlug.set(item.slug, [...(finishedBySlug.get(item.slug) ?? []), item]);

  // Mocks not taken yet come first, in catalogue order; taken ones are kept for later retakes.
  const fresh = input.mocks.filter(mock => !finishedBySlug.has(mock.slug));
  const taken = input.mocks.filter(mock => finishedBySlug.has(mock.slug));
  const ordered = [...fresh, ...taken];
  const budget = mockBudget(weekCount, settings.daysPerWeek, ordered.length);
  const timed = ordered.slice(0, budget);
  // Mocks left over are used untimed in practice mode, so timed ones are not spoiled first.
  const spare = ordered.slice(budget);
  const placement = mockWeeks(timed.length, weekCount);
  const labs = goal.labs.filter(lab => input.labs.includes(lab));
  // A structure written for another start day or length (the settings were saved again) no longer fits and is ignored.
  const structure = input.structure && input.structure.startDay === startDay && input.structure.weekCount === weekCount ? input.structure : null;
  const stages = structure ? phaseOfWeeks(structure.phases) : null;
  const tools = allowedTools(goal, input.labs);

  const weeks: Week[] = [];
  let spareIndex = 0;
  for (let index = 0; index < weekCount; index++) {
    const from = addDays(startDay, index * 7);
    const last = Math.min(index * 7 + 6, totalDays - 1);
    const to = addDays(startDay, last);
    const length = last - index * 7 + 1;
    const phase: Phase = index === weekCount - 1 ? "final" : index === 0 ? "start" : index >= Math.floor(weekCount * 0.55) ? "mocks" : "build";
    const items: Omit<Task, "day" | "done" | "auto">[] = [];

    timed.forEach((mock, order) => {
      if (placement[order] !== index) return;
      const title = order === 0 ? "Оношлох mock: " + mock.title : order === timed.length - 1 && phase === "final" ? "Сүүлийн mock: " + mock.title : "Бүтэн mock: " + mock.title;
      const detail = order === 0 ? "Цагтай өг. Хаана зогсож байгаагаа мэдэх нь эхний алхам."
        : settings.minutesPerDay < goal.mockMinutes ? `~${goal.mockMinutes} минут үргэлжилнэ: чөлөөтэй өдөр нь төлөвлө.` : "Жинхэнэ шалгалт шиг, нэг дор цагтай өг.";
      items.push({ id: "mock:" + mock.slug, kind: "mock", title, detail, href: "/exams/" + mock.slug, minutes: goal.mockMinutes });
      items.push({ id: "review:" + mock.slug, kind: "review", title: "Алдаагаа задлах: " + mock.title, detail: "Алдсан асуулт бүрийг AI coach-тай задлаад, сул чадвараа тэмдэглэ.", href: null, minutes: 40 });
    });

    // The rest of the week's study days get one task each, chosen for the phase.
    const fillers: Omit<Task, "day" | "done" | "auto">[] = [];
    const stage = stages?.[index];
    if (structure && stage) {
      // The AI's routines for this phase: one for every study day left after the mock (and, in the final week, the
      // checklist). They are routines, so a week with more study days than routines repeats them in turn, and the
      // turn moves on week by week.
      const pool = structure.phases[stage.phase].tasks;
      const mockDays = items.filter(item => item.kind === "mock").length;
      const count = Math.max(1, settings.daysPerWeek - mockDays - (phase === "final" ? 1 : 0));
      for (let slot = 0; slot < count; slot++) {
        const routine = pool[(stage.order * count + slot) % pool.length];
        const tool = tools.includes(routine.tool) ? routine.tool : "self";
        let page: { href: string | null; resource?: string };
        if (tool === "practice") {
          // Untimed work uses a spare mock while there is one, otherwise the mock sat most recently.
          const mock = spare[spareIndex] ?? [...timed].filter((_, order) => placement[order] <= index).at(-1) ?? timed[0];
          if (spare[spareIndex]) spareIndex++;
          page = mock ? { href: "/exams/" + mock.slug + "/practice", resource: "Practice mode · " + mock.title } : { href: goal.href, resource: goal.label };
        } else page = tool === "self" ? { href: null } : toolPage[tool];
        fillers.push({
          id: `w${index}:ai${slot}`, kind: toolKind[tool], title: routine.title, detail: routine.detail, href: page.href,
          minutes: Math.min(routine.minutes, Math.max(10, settings.minutesPerDay)), ai: true,
          ...(routine.skill ? { skill: routine.skill } : {}), ...(page.resource ? { resource: page.resource } : {}),
        });
      }
      if (phase === "final") {
        fillers.push({ id: "final:checklist", kind: "checklist", title: "Шалгалтын өдрийн бэлтгэл", detail: "Бичиг баримт, хаяг, очих цаг, цагийн хуваарь, хэрэгслээ шалга.", href: null, minutes: 15 });
        fillers.push({ id: "final:rest", kind: "rest", title: "Шалгалтын өмнөх өдөр: амрах", detail: "Шинэ зүйл үзэхгүй. Эрт унтаж, сайн амар.", href: null, minutes: 0 });
      }
    } else if (phase === "final") {
      if (goal.vocabulary) fillers.push({ id: `w${index}:vocabulary`, kind: "vocabulary", title: "Үгсийн сан: хөнгөн давталт", detail: "Шинэ үг нэмэлгүй, сул үгсээ л давт.", href: "/workspace/vocabulary", minutes: 15 });
      fillers.push({ id: "final:checklist", kind: "checklist", title: "Шалгалтын өдрийн бэлтгэл", detail: "Бичиг баримт, хаяг, очих цаг, цагийн хуваарь, хэрэгслээ шалга.", href: null, minutes: 15 });
      fillers.push({ id: "final:rest", kind: "rest", title: "Шалгалтын өмнөх өдөр: амрах", detail: "Шинэ зүйл үзэхгүй. Эрт унтаж, сайн амар.", href: null, minutes: 0 });
    } else {
      const lastTimed = [...timed].filter((_, order) => placement[order] <= index).at(-1);
      if (phase !== "start" && spare[spareIndex]) {
        const mock = spare[spareIndex++];
        fillers.push({ id: "practice:" + mock.slug, kind: "practice", title: "Цаггүй дадлага: " + mock.title, detail: "Practice mode-д хэсэг хэсгээр нь хийж, асуулт бүрийг шалга.", href: "/exams/" + mock.slug + "/practice", minutes: Math.min(60, settings.minutesPerDay) });
      } else if (phase !== "start" && lastTimed) {
        fillers.push({ id: `w${index}:practice:${lastTimed.slug}`.slice(0, PLAN_LIMITS.taskId), kind: "practice", title: "Алдсан хэсгээ давтах: " + lastTimed.title, detail: "Practice mode-д алдсан хэсгээ цаггүй дахин ажилла.", href: "/exams/" + lastTimed.slug + "/practice", minutes: Math.min(60, settings.minutesPerDay) });
      }
      if (goal.vocabulary) fillers.push({ id: `w${index}:vocabulary`, kind: "vocabulary", title: "Үгсийн сан: ухаалаг давталт", detail: "Өдөр бүр 10 минут: давтах ёстой үгсээ quiz-ээр давт.", href: "/workspace/vocabulary", minutes: 15 });
      if (labs.length) {
        const lab = labs[index % labs.length];
        fillers.push({ id: `w${index}:lab-${lab}`, kind: "lab", ...labTasks[lab] });
        if (settings.daysPerWeek >= 5 && labs.length > 1) {
          const second = labs[(index + 1) % labs.length];
          fillers.push({ id: `w${index}:lab-${second}`, kind: "lab", ...labTasks[second] });
        }
      }
      if (index % 2 === 0) fillers.push({ id: `w${index}:chat`, kind: "chat", title: "AI туслахаас сул сэдвээ асуух", detail: "Ойлгохгүй байгаа нэг сэдвээ тайлбарлуулж, 3 дасгал хийлгэ.", href: "/workspace/chat", minutes: 20 });
      if (index % 3 === 1) fillers.push({ id: `w${index}:myexam`, kind: "myexam", title: "Өөрийн материалаас шалгалт", detail: "Конспект эсвэл номынхоо хуудсаар 10 асуулттай шалгалт үүсгэ.", href: "/workspace/my-exams", minutes: 25 });
    }
    // Keep to about one task per study day; mocks always stay. The AI's routines were already counted to fit.
    const room = structure ? fillers.length : Math.max(phase === "final" ? fillers.length : 1, settings.daysPerWeek - items.filter(item => item.kind === "mock").length);
    items.push(...fillers.slice(0, room));
    // The rest day belongs on the eve of the exam, whatever the week's study days are.
    // In the final week the eve is kept for rest alone, so the study days are spread over the days before it.
    const offsets = studyOffsets(settings.daysPerWeek, phase === "final" ? Math.max(1, length - 1) : length);
    const tasks: Task[] = items.map((item, order) => {
      const day = item.kind === "rest" ? addDays(settings.examDate, -1)
        : item.kind === "mock" && phase === "final" ? addDays(from, Math.max(0, Math.min(length - 3, offsets[0])))
        : addDays(from, offsets[Math.min(order, offsets.length - 1)]);
      const sittings = finishedBySlug.get(item.id.slice(item.id.indexOf(":") + 1)) ?? [];
      const auto = item.kind === "mock" && sittings.some(sitting => daysBetween(startDay, sitting.finishedDay) >= 0);
      const reviewHref = item.kind === "review" ? (sittings.at(-1) ? "/workspace/review/" + sittings.at(-1)!.attemptId : "/workspace/review") : item.href;
      return { ...item, href: reviewHref, day, auto, done: auto || done.has(item.id) };
    });
    tasks.sort((a, b) => a.day.localeCompare(b.day));
    weeks.push({ index, phase, from, to, tasks, minutes: tasks.reduce((sum, task) => sum + task.minutes, 0), stage: stage?.phase ?? 0, theme: structure?.themes[index] ?? null });
  }

  // The phases as the page draws them: the AI's own, or the runs of the four built-in ones.
  const phases: PhaseInfo[] = [];
  if (structure) {
    let from = 0;
    structure.phases.forEach((item, order) => { phases.push({ index: order, title: item.title, focus: item.focus, from, to: from + item.weeks - 1 }); from += item.weeks; });
  } else {
    for (const week of weeks) {
      const last = phases.at(-1);
      if (last && weeks[last.from].phase === week.phase) last.to = week.index;
      else phases.push({ index: phases.length, title: phaseLabels[week.phase], focus: phaseFocus[week.phase], from: week.index, to: week.index });
      week.stage = phases.length - 1;
    }
  }

  const all = weeks.flatMap(week => week.tasks);
  const due = all.filter(task => task.day <= today);
  const overdue = due.filter(task => !task.done);
  const upcoming = all.find(task => !task.done && task.day > today);
  const focus = overdue.length ? overdue.slice(0, 3) : upcoming ? [upcoming] : [];
  const current = weeks.find(week => week.from <= today && today <= week.to);
  const scored = input.finished.filter(item => item.percent !== null && input.mocks.some(mock => mock.slug === item.slug))
    .sort((a, b) => a.finishedDay.localeCompare(b.finishedDay));
  const late = all.filter(task => !task.done && task.day < today).length;
  // Ahead: nothing is late and the student has already ticked work planned for a later day.
  const pace: Pace = late >= 3 ? "behind" : late > 0 ? "slip" : all.some(task => task.done && !task.auto && task.day > today) ? "ahead" : "on";
  return {
    goal, settings, startDay, today,
    daysLeft: daysBetween(today, settings.examDate),
    weeks,
    currentWeek: current ? current.index : null,
    focus,
    progress: { done: all.filter(task => task.done).length, total: all.length, due: due.length, dueDone: due.length - overdue.length },
    scores: { first: scored[0]?.percent ?? null, latest: scored.at(-1)?.percent ?? null, count: scored.length },
    mockCount: timed.length,
    passed: daysBetween(today, settings.examDate) < 0,
    phases,
    ai: structure ? { headline: structure.headline, diagnosis: structure.diagnosis, tactics: structure.tactics, madeDay: structure.madeDay } : null,
    history: scored.slice(-12).map(item => ({ day: item.finishedDay, percent: item.percent! })),
    late, pace, totalDays,
  };
}

/** Ticks that still mean the same task after the plan is rebuilt: the ones named by a mock, not by a week's position. */
export const keepsAcrossPlans = (id: string) => !/^w\d+:/.test(id);

/** Task ids the plan can contain, so a toggle names a real task. */
export function taskIds(roadmap: Roadmap) {
  return new Set(roadmap.weeks.flatMap(week => week.tasks.map(task => task.id)));
}
