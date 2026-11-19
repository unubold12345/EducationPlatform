// Homepage facts. Section lengths come from each programme's first mock definition (checked 2026-11-20); mock counts,
// questions and totals are read from the live catalogues so they follow new forms. A format change in a mock builder
// needs the matching `parts` line here.
import { examDefinitions } from "@/modules/exams/definitions";
import { entranceCounts, entranceTotal } from "@/modules/exams/entrance/catalog";
import { jlptMocks } from "@/modules/exams/jlpt/catalog";
import { hskMocks } from "@/modules/exams/hsk/catalog";
import { toeflMocks } from "@/modules/exams/toefl/catalog";
import { topikMocks } from "@/modules/exams/topik/catalog";
import { freeMocksOf } from "@/modules/exams/free/catalog";
import type { ExamProgram } from "@/modules/exams/types";

export type PartKind = "reading" | "listening" | "writing" | "speaking" | "math" | "paper" | "break";
export type HomePart = { label: string; minutes: number; kind: PartKind };
export type HomeLevel = { name: string; parts: HomePart[]; detail: string; mocks: number; minutes: string };
export type HomeExam = { program: ExamProgram; slug: string; href: string; name: string; symbol: string; who: string; levels: HomeLevel[]; mocks: number; free: number };

const definitionCount = (program: ExamProgram) => examDefinitions.filter(exam => exam.program === program).length;
const sum = (parts: HomePart[]) => parts.reduce((total, part) => total + part.minutes, 0);
const level = (name: string, parts: HomePart[], detail: string, mocks: number, minutes?: string): HomeLevel => ({ name, parts, detail, mocks, minutes: minutes ?? String(sum(parts)) });
const subjects = entranceCounts();
const jlpt = (name: "N5" | "N4") => jlptMocks.filter(mock => mock.level === name);
const hsk = (n: number) => hskMocks.filter(mock => mock.level === n);
const topik = (n: 1 | 2) => topikMocks.filter(mock => mock.level === n);
const toeflMinutes = toeflMocks.flatMap(mock => [mock.minutes.lower, mock.minutes.higher]);
const toeflTasks = toeflMocks[0] ? Object.values(toeflMocks[0].questions).reduce((a, b) => a + b, 0) : 0;

export const homeExams: HomeExam[] = [
  { program: "sat", slug: "sat", href: "/exams/sat", name: "SAT", symbol: "x²", who: "Америкийн их сургууль", free: freeMocksOf("sat").length, mocks: definitionCount("sat"), levels: [
    level("Digital SAT", [{ label: "R&W 1", minutes: 32, kind: "reading" }, { label: "R&W 2", minutes: 32, kind: "reading" }, { label: "Завсарлага", minutes: 10, kind: "break" }, { label: "Math 1", minutes: 35, kind: "math" }, { label: "Math 2", minutes: 35, kind: "math" }], "98 асуулт: Reading & Writing, Math тус бүр 2 модуль; 2 дахь модуль таны түвшинд тохирно", definitionCount("sat")),
  ] },
  { program: "ielts", slug: "ielts", href: "/exams/ielts", name: "IELTS", symbol: "Aa", who: "Гадаадад суралцах, ажиллах", free: freeMocksOf("ielts").length, mocks: definitionCount("ielts"), levels: [
    level("Academic", [{ label: "Listening", minutes: 32, kind: "listening" }, { label: "Reading", minutes: 60, kind: "reading" }, { label: "Writing", minutes: 60, kind: "writing" }, { label: "Speaking", minutes: 12, kind: "speaking" }], "40 + 40 асуулт, 2 бичвэр, 3 хэсэг яриа; Writing, Speaking-ийг AI үнэлнэ", definitionCount("ielts")),
  ] },
  { program: "toefl", slug: "toefl", href: "/exams/toefl", name: "TOEFL", symbol: "T", who: "Англи хэлээр сургалт явуулдаг их сургууль", free: freeMocksOf("toefl").length, mocks: toeflMocks.length, levels: [
    level("iBT 2026", [{ label: "Reading", minutes: 29, kind: "reading" }, { label: "Listening", minutes: 27, kind: "listening" }, { label: "Writing", minutes: 23, kind: "writing" }, { label: "Speaking", minutes: 7, kind: "speaking" }], `${toeflTasks} даалгавар, Reading, Listening-ийн 2 дахь модуль таны түвшинд тохирно`, toeflMocks.length, toeflMinutes.length ? `${Math.min(...toeflMinutes)}–${Math.max(...toeflMinutes)}` : undefined),
  ] },
  { program: "entrance", slug: "eesh", href: "/exams/eesh", name: "ЭЕШ", symbol: "∑", who: "Монголын их, дээд сургууль", free: freeMocksOf("entrance").length, mocks: entranceTotal, levels: [
    level("Математик, физик, хими", [{ label: "Нэг хуудас, 100 оноо", minutes: 100, kind: "paper" }], `Математик ${subjects.math}, физик ${subjects.physics}, хими ${subjects.chemistry} mock, 2015–2026 оны бүтцээр`, subjects.math + subjects.physics + subjects.chemistry),
    level("Биологи, англи хэл", [{ label: "Нэг хуудас, 100 оноо", minutes: 80, kind: "paper" }], `Биологи ${subjects.biology}, англи хэл ${subjects.english} mock`, subjects.biology + subjects.english),
  ] },
  { program: "jlpt", slug: "jlpt", href: "/exams/jlpt", name: "JLPT", symbol: "あ", who: "Япон хэл", free: freeMocksOf("jlpt").length, mocks: jlptMocks.length, levels: [
    level("N5", [{ label: "文字・語彙", minutes: 20, kind: "reading" }, { label: "文法・読解", minutes: 40, kind: "reading" }, { label: "聴解", minutes: 30, kind: "listening" }], `${jlpt("N5")[0]?.questions ?? 0} асуулт: үгийн сан, хэлзүй, унших, сонсох`, jlpt("N5").length),
    level("N4", [{ label: "文字・語彙", minutes: 25, kind: "reading" }, { label: "文法・読解", minutes: 55, kind: "reading" }, { label: "聴解", minutes: 35, kind: "listening" }], `${jlpt("N4")[0]?.questions ?? 0} асуулт, япон сонсголын бичлэгтэй`, jlpt("N4").length),
  ] },
  { program: "hsk", slug: "hsk", href: "/exams/hsk", name: "HSK", symbol: "汉", who: "Хятад хэл", free: freeMocksOf("hsk").length, mocks: hskMocks.length, levels: [
    level("HSK 1", [{ label: "听力", minutes: 15, kind: "listening" }, { label: "阅读", minutes: 25, kind: "reading" }], `${hsk(1)[0]?.questions ?? 0} асуулт, бүх ханз pinyin-тэй`, hsk(1).length),
    level("HSK 2", [{ label: "听力", minutes: 20, kind: "listening" }, { label: "阅读", minutes: 30, kind: "reading" }, { label: "书写", minutes: 10, kind: "writing" }], `${hsk(2)[0]?.questions ?? 0} асуулт, ханз бичих хэсэгтэй`, hsk(2).length),
  ] },
  { program: "topik", slug: "topik", href: "/exams/topik", name: "TOPIK", symbol: "한", who: "Солонгос хэл", free: freeMocksOf("topik").length, mocks: topikMocks.length, levels: [
    level("TOPIK Ⅰ", [{ label: "듣기", minutes: 40, kind: "listening" }, { label: "읽기", minutes: 60, kind: "reading" }], `${topik(1)[0]?.questions ?? 0} асуулт, 1–2-р түвшин`, topik(1).length),
    level("TOPIK Ⅱ", [{ label: "듣기", minutes: 60, kind: "listening" }, { label: "쓰기", minutes: 50, kind: "writing" }, { label: "읽기", minutes: 70, kind: "reading" }], `${topik(2)[0]?.questions ?? 0} асуулт, 3–6-р түвшин, 쓰기 бичих хэсэгтэй`, topik(2).length),
  ] },
];

/** Every full mock on the site (free half mocks not included). */
export const totalMocks = homeExams.reduce((total, exam) => total + exam.mocks, 0);
export const freeMockTotal = homeExams.reduce((total, exam) => total + exam.free, 0);
/** The time axis of the structure chart, in minutes: the longest paper (TOPIK Ⅱ, 180) fills the row. */
export const AXIS_MINUTES = 180;

export const partKinds: { kind: PartKind; label: string }[] = [
  { kind: "reading", label: "Унших" }, { kind: "listening", label: "Сонсох" }, { kind: "writing", label: "Бичих" },
  { kind: "speaking", label: "Ярих" }, { kind: "math", label: "Математик" }, { kind: "paper", label: "ЭЕШ хуудас" }, { kind: "break", label: "Завсарлага" },
];

export function clock(minutes: string) {
  // "144" → "2ц 24м"; a range like "86–88" stays in minutes.
  if (!/^\d+$/.test(minutes)) return minutes + " мин";
  const value = Number(minutes), hours = Math.floor(value / 60), rest = value % 60;
  return hours ? `${hours}ц${rest ? ` ${rest}м` : ""}` : `${rest} мин`;
}
