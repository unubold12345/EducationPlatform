// The ЭЕШ Workshop's 2027 forecast (owner request 2026-11-20: a predicted next-year paper and "what exercises can be in",
// accurate or not). Built with the insights by scripts/build-eesh-insights.mjs (method: scripts/eesh-insights/forecast.mjs).
// Topic names, chances, points and exercise-type labels only: no question text or answers.
import data from "./forecast.json" with { type: "json" };
import { isEntranceSubject, type EntranceSubject } from "../exams/entrance/subjects.ts";
import type { EeshFormat } from "./contracts.ts";

export type ForecastSkill = { label: string; share: number };
/** One position of the paper: a Part I question or a Part II task. `picks`: likely topics with chances; `areas`: likely areas
 * for a task with no topic (biology's Part II). */
export type ForecastPosition = {
  pos: string; part: 1 | 2; points: number; picks: { topic: string; p: number | null }[]; areas: { name: string; p: number }[];
  domain: string | null; skills: ForecastSkill[]; last: string | null; lastArea: string | null;
};
export type ForecastTopic = {
  id: string; label: string; domain: string; p: number | null; questions: number; points: number; lastQuestions: number;
  lastPoints: number; trend: "up" | "down" | "steady" | "back" | null; positions: string[]; skills: ForecastSkill[]; drill: number;
};
export type ForecastDomain = { name: string; points: number; last: number; low: number; high: number };
/** Whole questions per topic (or area) in one part, adding up to the part's size. */
export type ForecastMakeup = { part: 1 | 2; size: number; by: "topic" | "area"; items: { key: string; questions: number; last: number }[] };
export type ForecastBacktestYear = {
  year: number; positions: number; top1: number | null; top2: number | null; top1Part2: number | null; makeup: number | null;
  domainError: number; caught: number; appeared: number; likelyRight: number; likely: number; sameFormat: boolean;
};
export type ForecastBacktest = { years: ForecastBacktestYear[]; top1: number | null; top2: number | null; top1Part2: number | null; makeup: number | null; domainError: number };
export type EeshForecast = {
  subject: EntranceSubject; label: string; target: number; from: number; to: number; years: number; papers: number;
  /** Years with mocks that the forecast leaves out: they copy another year's sequence (physics 2024). */
  skipped: number[]; format: Omit<EeshFormat, "year" | "forms">; stable: number; makeup: ForecastMakeup[];
  positions: ForecastPosition[]; domains: ForecastDomain[]; topics: ForecastTopic[]; backtest: ForecastBacktest | null;
};

const forecasts = (data as unknown as { subjects: Record<EntranceSubject, EeshForecast> }).subjects;
export function eeshForecast(subject: string): EeshForecast | undefined {
  return isEntranceSubject(subject) ? forecasts[subject] : undefined;
}
