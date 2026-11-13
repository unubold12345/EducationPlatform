// Daily check-in streak. Pure, like plan.ts: the server reads the student's check-in days (Ulaanbaatar
// calendar dates) and these rules turn them into the figures the Workspace shows.
import { addDays, dayNumber } from "./plan.ts";

export type StreakDay = { day: string; active: boolean };
export type StreakSummary = {
  /** Consecutive days up to today, or up to yesterday while today's check-in is still to come. */
  current: number;
  longest: number;
  total: number;
  /** Whether today is already checked in. */
  today: boolean;
  /** The last seven days, oldest first, ending today. */
  week: StreakDay[];
};

/** How far back the server reads check-ins for the figures. */
export const STREAK_WINDOW_DAYS = 400;

export function summarizeStreak(days: readonly string[], today: string, total = days.length): StreakSummary {
  const set = new Set(days.filter(day => dayNumber(day) !== null));
  const checked = set.has(today);
  // Count back from today, or from yesterday when today has no check-in yet.
  let current = 0;
  for (let day = checked ? today : addDays(today, -1); set.has(day); day = addDays(day, -1)) current++;
  const numbers = [...set].map(day => dayNumber(day)!).sort((a, b) => a - b);
  let longest = 0, run = 0;
  numbers.forEach((value, index) => {
    run = index > 0 && value === numbers[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, active: set.has(day) };
  });
  return { current, longest: Math.max(longest, current), total: Math.max(total, set.size), today: checked, week };
}

/** A short Mongolian line for the current streak. */
export function streakLine(summary: Pick<StreakSummary, "current" | "today">) {
  if (!summary.current) return "Өнөөдрөөс эхэл";
  return summary.today ? `${summary.current} өдөр дараалан` : `${summary.current} өдөр · өнөөдөр үргэлжлүүл`;
}
