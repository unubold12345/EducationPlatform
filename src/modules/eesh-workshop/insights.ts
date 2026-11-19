// The built ЭЕШ insights (scripts/build-eesh-insights.mjs). No question text or answers: formats, points, topic names.
// Read by the subject pages and the drill on the server; client components get only the parts they show.
import data from "./insights.json" with { type: "json" };
import index from "./topic-index.json" with { type: "json" };
import { ENTRANCE_SUBJECT_ORDER, isEntranceSubject, type EntranceSubject } from "../exams/entrance/subjects.ts";
import type { EeshInsights, EeshTopicIndex } from "./contracts.ts";

const insights = data as unknown as Record<EntranceSubject, EeshInsights>;
export const eeshTopicIndex = index as unknown as EeshTopicIndex;
export function eeshInsights(subject: string): EeshInsights | undefined {
  return isEntranceSubject(subject) ? insights[subject] : undefined;
}
export const eeshSubjects = (): EeshInsights[] => ENTRANCE_SUBJECT_ORDER.map(subject => insights[subject]);
