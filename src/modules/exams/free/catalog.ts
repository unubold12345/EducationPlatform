import data from "./catalog.json" with { type: "json" };
import type { EntranceSubject, ExamProgram } from "../types.ts";

/**
 * The free half-length mocks (owner request 2026-11-13): one per exam, open to every signed-in account at no
 * cost, with unlimited retakes and practice. Client-safe catalogue written by scripts/build-free-mocks.mjs from the
 * offline pack in MockExmps/Free (no answers or listening scripts); the definitions live in assets/free-mocks.
 */
export type FreeMock = {
  slug: string; program: ExamProgram; subject?: EntranceSubject; level?: "N5" | "N4";
  title: string; questions: number; points: number; minutes: number; listening: boolean;
};
export const freeMocks = data as FreeMock[];
export const freeSlugs = () => freeMocks.map(mock => mock.slug);
export function findFreeMock(slug: string) { return freeMocks.find(mock => mock.slug === slug); }
export function isFreeMock(slug: string) { return freeMocks.some(mock => mock.slug === slug); }
/** The free mocks of one exam programme, in catalogue order (ЭЕШ by subject). */
export function freeMocksOf(program: ExamProgram) { return freeMocks.filter(mock => mock.program === program); }
