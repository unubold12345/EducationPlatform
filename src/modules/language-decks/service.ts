import "server-only";
import { ApiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { findAnyPlan, subscriptionPlans } from "@/modules/subscriptions/plans";
import { isDue, isStudyGrade, nextStudy, STUDY_BOX_MAX, type StudyGrade } from "@/modules/vocabulary/study";
import {
  DECK_REVIEW_WORDS, findLanguageDeck, isDeckWordId, LANGUAGE_DECKS,
  type DeckProgress, type DeckSummary, type LanguageDeck, type LanguageExam,
} from "./catalog";
import { deckWordIds, languageDeck } from "./content";

export const DECK_REVIEW_BODY_BYTES = 8 * 1024;

/**
 * Whether the student may study an exam's word decks: an active plan that includes workshops and that exam's mocks
 * (Гадаад хэл Basic or Pro; owner rule 2026-11-18: no free level, not even N5 or HSK 1). The retired IELTS plan has
 * workshops but not these exams, so it does not open them.
 */
export async function hasLanguageStudy(userId: string, exam: LanguageExam, now = new Date()) {
  const rows = await getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } });
  return rows.some(row => { const plan = findAnyPlan(row.program); return Boolean(plan?.workshops && (plan.exams as readonly string[]).includes(exam)); });
}

/** The plans to name on a locked tile, from the plan list so a price or plan change shows here too. */
export const languageStudyPlans = (exam: LanguageExam) =>
  subscriptionPlans.filter(plan => plan.workshops && (plan.exams as readonly string[]).includes(exam)).map(plan => plan.title);

/** A word list is a dictionary for the exam itself, so it stays closed during a timed sitting, like AI help. */
async function requireStudy(userId: string, exam: LanguageExam) {
  if (!await hasLanguageStudy(userId, exam)) throw new ApiError(403, `Энэ үгсийн сан ${languageStudyPlans(exam).join(", ")} багцад багтана.`);
  if (await activeTimedSitting(userId)) throw new ApiError(409, "Цагтай шалгалт явагдаж байхад үгсийн сан нээгдэхгүй.");
}

const toProgress = (row: { box: number; correct: number; wrong: number; reviewedAt: Date | null; dueAt: Date | null }): DeckProgress => ({
  box: row.box, correct: row.correct, wrong: row.wrong, reviewedAt: row.reviewedAt?.toISOString() ?? null, dueAt: row.dueAt?.toISOString() ?? null,
});

/** The Workshop tab's tiles: each deck's size and the student's progress on it. */
export async function deckSummaries(userId: string, exam: LanguageExam, now = Date.now()): Promise<DeckSummary[]> {
  const decks = LANGUAGE_DECKS.filter(deck => deck.exam === exam && deck.kind === "words");
  const rows = await getDb().languageDeckProgress.findMany({
    where: { userId, deck: { in: decks.map(deck => deck.id) } }, select: { deck: true, wordId: true, box: true, correct: true, wrong: true, dueAt: true },
  });
  return decks.map(info => {
    const content = languageDeck(info.id)!;
    const ids = deckWordIds(info.id);
    const mine = rows.filter(row => row.deck === info.id && ids.has(row.wordId));
    return {
      ...info, lessons: content.lessons.length, words: ids.size, started: mine.filter(row => row.box > 0).length,
      mastered: mine.filter(row => row.box >= STUDY_BOX_MAX).length, due: mine.filter(row => isDue(row, now)).length,
    };
  });
}

/** One deck's words and the student's progress on them, for the study page. */
export async function openLanguageDeck(userId: string, id: string): Promise<{ deck: LanguageDeck; progress: Record<string, DeckProgress>; now: number }> {
  const info = findLanguageDeck(id);
  if (!info) throw new ApiError(404, "Үгсийн сан олдсонгүй.");
  await requireStudy(userId, info.exam);
  const rows = await getDb().languageDeckProgress.findMany({ where: { userId, deck: id }, select: { wordId: true, box: true, correct: true, wrong: true, reviewedAt: true, dueAt: true } });
  return { deck: languageDeck(id)!, progress: Object.fromEntries(rows.map(row => [row.wordId, toProgress(row)])), now: Date.now() };
}

function readResults(value: unknown): { id: string; grade: StudyGrade }[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  const results = (value as { results?: unknown }).results;
  if (keys.length !== 1 || keys[0] !== "results" || !Array.isArray(results) || !results.length || results.length > DECK_REVIEW_WORDS) return null;
  const seen = new Set<string>();
  const out: { id: string; grade: StudyGrade }[] = [];
  for (const item of results) {
    if (!item || typeof item !== "object" || Object.keys(item).sort().join() !== "grade,id") return null;
    const { id, grade } = item as { id: unknown; grade: unknown };
    if (!isDeckWordId(id) || !isStudyGrade(grade) || seen.has(id)) return null;
    seen.add(id);
    out.push({ id, grade });
  }
  return out;
}

/** A card or quiz session's grades become the student's progress on the deck's words. */
export async function recordDeckReview(userId: string, id: string, body: unknown) {
  const info = findLanguageDeck(id);
  if (!info) throw new ApiError(404, "Үгсийн сан олдсонгүй.");
  const results = readResults(body);
  if (!results) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  await requireStudy(userId, info.exam);
  const known = deckWordIds(id);
  if (results.some(item => !known.has(item.id))) throw new ApiError(400, "Энэ үгсийн санд байхгүй үг байна.");
  const db = getDb(), now = Date.now();
  const rows = await db.languageDeckProgress.findMany({ where: { userId, deck: id, wordId: { in: results.map(item => item.id) } }, select: { wordId: true, box: true, correct: true, wrong: true, dueAt: true } });
  const before = new Map(rows.map(row => [row.wordId, row]));
  const updates = results.map(item => ({ id: item.id, ...nextStudy(before.get(item.id) ?? { box: 0, correct: 0, wrong: 0, dueAt: null }, item.grade, now) }));
  await db.$transaction(updates.map(item => {
    const data = { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: new Date(item.reviewedAt), dueAt: new Date(item.dueAt) };
    return db.languageDeckProgress.upsert({ where: { userId_deck_wordId: { userId, deck: id, wordId: item.id } }, create: { userId, deck: id, wordId: item.id, ...data }, update: data });
  }));
  return {
    words: updates.map(item => ({
      id: item.id, box: item.box, correct: item.correct, wrong: item.wrong,
      reviewedAt: new Date(item.reviewedAt).toISOString(), dueAt: new Date(item.dueAt).toISOString(),
    })),
  };
}
