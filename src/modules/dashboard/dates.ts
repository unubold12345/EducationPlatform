// Calendar days in Ulaanbaatar (UTC+8, no daylight saving), written out in Mongolian because browsers lack
// Mongolian date data and Intl "mn-MN" falls back to English. Pure and client-safe.

export const DAY_MS = 864e5;
const UB_OFFSET_MS = 8 * 3600e3;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The Ulaanbaatar calendar date of a moment, YYYY-MM-DD. */
export const ubDay = (ms: number) => new Date(ms + UB_OFFSET_MS).toISOString().slice(0, 10);

/** Days since 1970-01-01 for a valid YYYY-MM-DD, otherwise null (2026-02-31 is rejected). */
export function dayNumber(day: unknown): number | null {
  if (typeof day !== "string") return null;
  const match = DAY_RE.exec(day);
  if (!match) return null;
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(ms).toISOString().slice(0, 10) === day ? ms / DAY_MS : null;
}
export const dayFromNumber = (value: number) => new Date(value * DAY_MS).toISOString().slice(0, 10);
export const addDays = (day: string, days: number) => dayFromNumber((dayNumber(day) ?? 0) + days);
export const daysBetween = (from: string, to: string) => (dayNumber(to) ?? 0) - (dayNumber(from) ?? 0);
/** 0 = Monday … 6 = Sunday. */
export const weekdayIndex = (day: string) => (new Date((dayNumber(day) ?? 0) * DAY_MS).getUTCDay() + 6) % 7;

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"] as const;
const WEEKDAYS_SHORT = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"] as const;
const date = (day: string) => new Date((dayNumber(day) ?? 0) * DAY_MS);

/** "11-р сарын 13", or with `long` "2026 оны 11-р сарын 13, Баасан". */
export function mnDate(day: string, long = false) {
  if (dayNumber(day) === null) return day;
  const value = date(day);
  const short = `${value.getUTCMonth() + 1}-р сарын ${value.getUTCDate()}`;
  return long ? `${value.getUTCFullYear()} оны ${short}, ${WEEKDAYS[value.getUTCDay()]}` : short;
}
export const mnWeekday = (day: string, short = false) => (short ? WEEKDAYS_SHORT : WEEKDAYS)[date(day).getUTCDay()];
/** "11-р сарын 13, 14:05" for a moment, in Ulaanbaatar time. */
export function mnDateTime(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const local = new Date(ms + UB_OFFSET_MS).toISOString();
  return `${mnDate(local.slice(0, 10))}, ${local.slice(11, 16)}`;
}
/** "11-р сар" for month labels. */
export const mnMonth = (day: string) => `${date(day).getUTCMonth() + 1}-р сар`;

/** The first Sunday of a month (1–12) in a year, YYYY-MM-DD: the JLPT is held on the first Sunday of July and December. */
export function firstSunday(year: number, month: number) {
  const first = Date.UTC(year, month - 1, 1) / DAY_MS;
  const weekday = new Date(first * DAY_MS).getUTCDay();
  return dayFromNumber(first + ((7 - weekday) % 7));
}

/** The next JLPT sitting on or after `today`: first Sunday of July or December. */
export function nextJlptDay(today: string) {
  const year = Number(today.slice(0, 4));
  for (const candidate of [firstSunday(year, 7), firstSunday(year, 12), firstSunday(year + 1, 7)]) {
    if (candidate >= today) return candidate;
  }
  return firstSunday(year + 1, 12);
}
