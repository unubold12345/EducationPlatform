// Study rules for the vocabulary quiz: a five-box Leitner schedule. Pure and shared, so the server
// (which stores the state) and the browser (which picks what to ask next) cannot drift apart.

export const STUDY_BOX_MAX = 5;
/** Days until a word answered correctly in each box comes back. Box 0 is a word never studied. */
export const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16] as const;
/** A missed word is due again after this many minutes. */
export const AGAIN_MINUTES = 10;

/** again: missed. hard: right with a hint or a near-miss spelling. good: right unaided. */
export const STUDY_GRADES = ["again", "hard", "good"] as const;
export type StudyGrade = (typeof STUDY_GRADES)[number];
export const STUDY_STATUSES = ["new", "learning", "familiar", "mastered"] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];

type Moment = string | Date | number | null | undefined;
export type Studied = { box: number; correct: number; wrong: number; reviewedAt?: Moment; dueAt?: Moment };

const DAY_MS = 86_400_000;
const UB_OFFSET_MS = 8 * 3_600_000;

function time(value: Moment) {
  if (value === null || value === undefined) return null;
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}
const clampBox = (box: number) => Number.isInteger(box) ? Math.min(STUDY_BOX_MAX, Math.max(0, box)) : 0;
const tally = (value: number) => Number.isSafeInteger(value) && value > 0 ? value : 0;

export function isStudyGrade(value: unknown): value is StudyGrade {
  return (STUDY_GRADES as readonly unknown[]).includes(value);
}

export function studyStatus(word: Pick<Studied, "box">): StudyStatus {
  const box = clampBox(word.box);
  return box === 0 ? "new" : box <= 2 ? "learning" : box < STUDY_BOX_MAX ? "familiar" : "mastered";
}

/** A studied word whose date has come. A word never studied is new, not due. */
export function isDue(word: Studied, now: number) {
  const due = time(word.dueAt);
  return clampBox(word.box) > 0 && due !== null && due <= now;
}

/** Missed at least once and still not holding: the words worth drilling. */
export function isWeak(word: Studied) {
  const box = clampBox(word.box);
  return box > 0 && box < STUDY_BOX_MAX && tally(word.wrong) > 0 && (box <= 1 || tally(word.wrong) >= tally(word.correct));
}

/** Reviewed during the current Ulaanbaatar calendar day. */
export function reviewedToday(word: Studied, now: number) {
  const at = time(word.reviewedAt);
  return at !== null && Math.floor((at + UB_OFFSET_MS) / DAY_MS) === Math.floor((now + UB_OFFSET_MS) / DAY_MS);
}

/**
 * The state after one answer. A miss sends the word back to box 1. A right answer moves it up one
 * box, but only once the word is due: answering it again early keeps its box and date, so repeating
 * one quiz cannot fake mastery. A hinted or near-miss answer ("hard") holds the box.
 */
export function nextStudy(word: Studied, grade: StudyGrade, now: number) {
  const box = clampBox(word.box);
  const due = time(word.dueAt);
  const correct = tally(word.correct) + (grade === "again" ? 0 : 1);
  const wrong = tally(word.wrong) + (grade === "again" ? 1 : 0);
  if (grade === "again") return { box: 1, correct, wrong, reviewedAt: now, dueAt: now + AGAIN_MINUTES * 60_000 };
  if (box > 0 && due !== null && due > now) return { box, correct, wrong, reviewedAt: now, dueAt: due };
  const next = grade === "good" ? Math.min(STUDY_BOX_MAX, box + 1) : Math.max(1, box);
  return { box: next, correct, wrong, reviewedAt: now, dueAt: now + BOX_INTERVAL_DAYS[next] * DAY_MS };
}

/**
 * How much a word deserves a place in the next session: overdue words first (the longer overdue and
 * the lower the box, the higher), then new words, then weak ones, then everything else.
 */
export function studyPriority(word: Studied, now: number) {
  const box = clampBox(word.box);
  if (box === 0) return 50;
  const due = time(word.dueAt);
  if (due !== null && due <= now) return 100 + Math.min(30, (now - due) / DAY_MS) + (STUDY_BOX_MAX - box) * 4;
  return isWeak(word) ? 40 : 10 - box;
}
