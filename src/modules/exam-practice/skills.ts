// Which skill a practice section trains, so the Workshop labs can open one skill of a mock (owner request 2026-11-19:
// the mocks' listening and reading in the Listening and Reading labs, JLPT/HSK/TOPIK reading and writing in their own
// workshops). Client-safe: it reads only section ids, titles and kinds.
import type { PracticeForm, PracticeSection, PracticeSubject, PracticeView } from "./types";

export type LabSkill = "listening" | "reading" | "writing";
export const LAB_SKILLS: readonly LabSkill[] = ["listening", "reading", "writing"];
export const isLabSkill = (value: unknown): value is LabSkill => LAB_SKILLS.includes(value as LabSkill);

// JLPT prints reading in the 文法・読解 paper beside grammar: 短文, 中文, 長文 and 情報検索 are the reading tasks.
const JLPT_READING = /^(短文|中文|長文|情報検索)/;

/** The skill of one practice section; null for the rest (SAT, ЭЕШ, JLPT vocabulary and grammar, speaking). */
export function sectionSkill(subject: PracticeSubject, section: Pick<PracticeSection, "id" | "title" | "kind">): LabSkill | null {
  if (section.kind === "listening") return "listening";
  if (section.kind === "writing") return subject === "ielts" || subject === "toefl" || subject === "topik" ? "writing" : null;
  if (section.kind !== "questions") return null;
  switch (subject) {
    case "ielts": return section.id === "ielts-reading" ? "reading" : null;
    case "toefl": return /-r(1|2l|2u)-/.test(section.id) ? "reading" : null;
    case "jlpt": return JLPT_READING.test(section.title) ? "reading" : null;
    case "hsk": return /^hsk-r-/.test(section.id) ? "reading" : /^hsk-w-/.test(section.id) ? "writing" : null;
    case "topik": return /^topik-r-/.test(section.id) ? "reading" : null;
    default: return null;
  }
}

/** Whether a practice form has any section of a skill. */
export function formHasSkill(form: Pick<PracticeForm, "subject" | "sections">, skill: LabSkill) {
  return form.sections.some(section => sectionSkill(form.subject, section) === skill);
}

/**
 * The practice view narrowed to one skill: only those sections and their questions. Responses, flags and checked
 * answers stay whole, so saving a flag from the lab never drops one set in the full practice mode. Null when the mock
 * has no section of that skill.
 */
export function labView(view: PracticeView, skill: LabSkill): PracticeView | null {
  const sections = view.form.sections.filter(section => sectionSkill(view.form.subject, section) === skill);
  if (!sections.length) return null;
  const ids = new Set(sections.map(section => section.id));
  return { ...view, form: { ...view.form, sections, questions: view.form.questions.filter(question => ids.has(question.section)) } };
}

/** The Workshop lab that opens a skill of an exam's mocks, or null when no lab does (owner rule 2026-11-19). */
export function labFor(skill: LabSkill, subject: PracticeSubject): { title: string; href: string; asian: boolean } | null {
  if (skill === "listening") return subject === "ielts" ? { title: "Сонсгол лаб", href: "/labs/ielts-listening", asian: false }
    : subject === "toefl" ? { title: "TOEFL сонсгол", href: "/labs/toefl-listening", asian: false } : null;
  if (skill === "reading") return subject === "ielts" ? { title: "Унших лаб", href: "/labs/ielts-reading", asian: false }
    : subject === "toefl" ? { title: "TOEFL уншлага", href: "/labs/toefl-reading", asian: false }
    : subject === "jlpt" || subject === "hsk" || subject === "topik" ? { title: "Унших workshop", href: "/labs/reading/" + subject, asian: true } : null;
  return subject === "hsk" || subject === "topik" ? { title: "Бичих workshop", href: "/labs/writing/" + subject, asian: true } : null;
}
