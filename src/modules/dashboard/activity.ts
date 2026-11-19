// Daily activity for the dashboard's contribution grid: what the student did on each Ulaanbaatar day of the last
// year, counted from rows the site already keeps. Pure and client-safe; the server collects the timestamps.
import { addDays, daysBetween, mnDate, ubDay, weekdayIndex } from "./dates.ts";

export type ActivityKind = "mock" | "practice" | "ai" | "words" | "tasks";
export const ACTIVITY_KINDS: { id: ActivityKind; label: string }[] = [
  { id: "mock", label: "Mock шалгалт" },
  { id: "practice", label: "Дадлага" },
  { id: "ai", label: "AI хэрэгсэл" },
  { id: "words", label: "Үг давтсан" },
  { id: "tasks", label: "Хийсэн ажил" },
];
export const ACTIVITY_WEEKS = 53;
/** Grid shades: 0 none, then 1–2, 3–5, 6–9 and 10 or more actions. Fixed, so the legend can name them. */
export const ACTIVITY_STEPS = [1, 3, 6, 10] as const;
export const activityLevel = (total: number) => ACTIVITY_STEPS.reduce((level, step, index) => (total >= step ? index + 1 : level), 0);

export type DayCounts = Partial<Record<ActivityKind, number>>;
export type ActivityCell = { day: string; total: number; level: number; kinds: DayCounts };
export type ActivityGrid = {
  start: string; today: string;
  /** Columns of seven days, Monday first; days after today are null. */
  weeks: (ActivityCell | null)[][];
  /** Column index where a month starts, for the labels above the grid. */
  months: { column: number; label: string }[];
  total: number; activeDays: number; byKind: Record<ActivityKind, number>;
  best: ActivityCell | null;
};

/** Adds each event to its Ulaanbaatar day, keeping only days from `from` to `to`. */
export function bucketActivity(events: Iterable<{ kind: ActivityKind; at: Date | number }>, from: string, to: string) {
  const days = new Map<string, DayCounts>();
  for (const event of events) {
    const day = ubDay(typeof event.at === "number" ? event.at : event.at.getTime());
    if (day < from || day > to) continue;
    const counts = days.get(day) ?? {};
    counts[event.kind] = (counts[event.kind] ?? 0) + 1;
    days.set(day, counts);
  }
  return days;
}

/** The first day the grid shows: the Monday 52 weeks before this week's Monday. */
export function gridStart(today: string, weeks = ACTIVITY_WEEKS) {
  return addDays(today, -weekdayIndex(today) - (weeks - 1) * 7);
}

export function activityGrid(days: Map<string, DayCounts>, today: string, weeks = ACTIVITY_WEEKS): ActivityGrid {
  const start = gridStart(today, weeks);
  const columns: (ActivityCell | null)[][] = [];
  const months: { column: number; label: string }[] = [];
  const byKind = Object.fromEntries(ACTIVITY_KINDS.map(kind => [kind.id, 0])) as Record<ActivityKind, number>;
  let total = 0, activeDays = 0, best: ActivityCell | null = null;
  for (let column = 0; column < weeks; column++) {
    const week: (ActivityCell | null)[] = [];
    for (let row = 0; row < 7; row++) {
      const day = addDays(start, column * 7 + row);
      if (day > today) { week.push(null); continue; }
      if (day.endsWith("-01") || (column === 0 && row === 0)) {
        // A month label sits over the first column holding that month's first day (or the grid's first day).
        const label = `${Number(day.slice(5, 7))}-р сар`;
        if (!months.some(month => month.column === column)) months.push({ column, label });
      }
      const kinds = days.get(day) ?? {};
      const sum = Object.values(kinds).reduce((acc, value) => acc + (value ?? 0), 0);
      const cell = { day, total: sum, level: activityLevel(sum), kinds };
      if (sum) {
        activeDays++;
        total += sum;
        for (const [kind, value] of Object.entries(kinds)) byKind[kind as ActivityKind] += value ?? 0;
        if (!best || sum > best.total) best = cell;
      }
      week.push(cell);
    }
    columns.push(week);
  }
  // Drop a first-column label that would crowd the next month's label.
  if (months.length > 1 && months[1].column - months[0].column < 3 && months[0].column === 0) months.shift();
  return { start, today, weeks: columns, months, total, activeDays, byKind, best };
}

/** "11-р сарын 13: 5 үйлдэл (Mock шалгалт 1, AI хэрэгсэл 4)" for a cell's tooltip and label. */
export function cellLabel(cell: ActivityCell) {
  if (!cell.total) return `${mnDate(cell.day)}: үйлдэлгүй`;
  const parts = ACTIVITY_KINDS.filter(kind => cell.kinds[kind.id]).map(kind => `${kind.label} ${cell.kinds[kind.id]}`);
  return `${mnDate(cell.day)}: ${cell.total} үйлдэл (${parts.join(", ")})`;
}

/** Days from the grid start to today, inclusive. */
export const gridLength = (grid: Pick<ActivityGrid, "start" | "today">) => daysBetween(grid.start, grid.today) + 1;
