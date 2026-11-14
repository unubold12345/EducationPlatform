// ЭЕШ subject names, links and formats. Small and client-safe: the sitting and results import this
// rather than catalog.ts, which carries every paper's metadata.
export type EntranceSubject = "math" | "physics" | "chemistry" | "biology" | "english";
export const ENTRANCE_SUBJECT_ORDER: EntranceSubject[] = ["math", "physics", "chemistry", "biology", "english"];
export const isEntranceSubject = (value: string): value is EntranceSubject => (ENTRANCE_SUBJECT_ORDER as string[]).includes(value);
/** `eesh-<subject>-<year>-<form>` (or the free paper `eesh-<subject>-free`) names its subject. */
export function subjectFromSlug(slug: string): EntranceSubject | null {
  const subject = /^eesh-([a-z]+)-(?:\d{4}-|free$)/.exec(slug)?.[1];
  return subject && isEntranceSubject(subject) ? subject : null;
}
export const entranceSubjectLabels: Record<EntranceSubject, string> = {
  math: "Математик",
  physics: "Физик",
  chemistry: "Хими",
  biology: "Биологи",
  english: "Англи хэл",
};
/** Each subject's printed paper format. Biology 2026 has 46 choice items; earlier years have 50. */
export const entranceSubjectFormats: Record<EntranceSubject, string> = {
  math: "36 сонгох · 4 бодолт · 100 минут",
  physics: "46 сонгох · 4 бодолт · 100 минут",
  chemistry: "40 сонгох · 4 бүтээх · 100 минут",
  biology: "46–50 сонгох · 4 бүтээх · 80 минут",
  english: "Part I + Part II · 80 минут",
};
export const entranceSubjectHrefs: Record<EntranceSubject, string> = {
  math: "/exams/eesh?subject=math",
  physics: "/exams/eesh?subject=physics",
  chemistry: "/exams/eesh?subject=chemistry",
  biology: "/exams/eesh?subject=biology",
  english: "/exams/eesh?subject=english",
};
