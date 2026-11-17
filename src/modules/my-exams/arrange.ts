// Matching and sequence questions answered by arranging (2026-11-17): the student connects every numbered item to a
// lettered one, or puts the steps in order, instead of picking a coded option. Pure, so the browser, the server's
// grading and the mobile app (which imports these contracts) read an arrangement the same way.
//
// An answer stays one number, so sittings, saves, grading and the stored results keep their shape:
// - an arrangement equal to one of the question's four options is saved as that option's index (0–3), exactly as if
//   the student had picked it, so the mobile app and the printed paper, which still list the coded options, agree;
// - any other arrangement is saved as ARRANGED + its permutation rank. It can never be the key (the key is always one
//   of the options), so it grades as wrong, but it is kept so the review shows what the student built.
import type { ExamQuestion } from "./contracts.ts";

export const ARRANGED = 1000;
/** Arrangements of up to five items: 5! = 120 codes. */
export const ARRANGED_MAX = ARRANGED + 119;
const FACTORIAL = [1, 1, 2, 6, 24, 120];
export const ITEM_LETTERS = "abcde";

/** A question's items, read back from the prompt the server wrote: "1. …" lines, then "a) …" lines for a match. */
export type Board =
  | { kind: "match"; head: string; left: string[]; right: string[] }
  | { kind: "order"; head: string; steps: string[] };
/** For a match, the letter index each numbered item is joined to; for an order, the listed item numbers (zero-based), first to last. */
export type Arrangement = number[];

const isPermutation = (values: readonly number[], size: number) =>
  values.length === size && values.every(value => Number.isInteger(value) && value >= 0 && value < size) && new Set(values).size === size;

/** The arrangement an option code names ("1-b, 2-d, 3-a" or "3 → 1 → 2"), or null. */
export function optionArrangement(option: string, kind: Board["kind"], size: number): Arrangement | null {
  if (kind === "match") {
    const links: number[] = Array(size).fill(-1);
    for (const part of option.split(",")) {
      const code = /^\s*(\d)\s*[-–—:]\s*([a-e])\s*$/i.exec(part);
      if (!code) return null;
      const item = Number(code[1]) - 1;
      if (item < 0 || item >= size || links[item] !== -1) return null;
      links[item] = ITEM_LETTERS.indexOf(code[2].toLowerCase());
    }
    return isPermutation(links, size) ? links : null;
  }
  const steps = option.split(/→|->|,/).map(part => part.trim());
  if (!steps.every(step => /^\d$/.test(step))) return null;
  const sequence = steps.map(step => Number(step) - 1);
  return isPermutation(sequence, size) ? sequence : null;
}

/**
 * The items of a match or order question, or null when it cannot be arranged (another format, a prompt without its
 * item lines, or an option that does not name a whole arrangement): such a question is answered by its options.
 */
export function boardOf(question: Pick<ExamQuestion, "kind" | "prompt" | "options">): Board | null {
  const kind = question.kind;
  if (kind !== "match" && kind !== "order") return null;
  const head: string[] = [], numbered: string[] = [], lettered: string[] = [];
  for (const raw of question.prompt.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const number = /^(\d)[.)]\s+(.+)$/.exec(line);
    const letter = /^\(?([a-e])[.)]\s+(.+)$/i.exec(line);
    if (number && Number(number[1]) === numbered.length + 1 && !lettered.length) numbered.push(number[2]);
    else if (kind === "match" && letter && numbered.length && letter[1].toLowerCase() === ITEM_LETTERS[lettered.length]) lettered.push(letter[2]);
    else if (!numbered.length) head.push(line);
    else return null;
  }
  const size = numbered.length;
  if (size < 3 || size > 5 || (kind === "match" && lettered.length !== size)) return null;
  if (!question.options.every(option => optionArrangement(option, kind, size))) return null;
  const title = head.join(" ");
  return kind === "match" ? { kind, head: title, left: numbered, right: lettered } : { kind, head: title, steps: numbered };
}
export const boardSize = (board: Board) => board.kind === "match" ? board.left.length : board.steps.length;

function rank(arrangement: Arrangement): number {
  const rest = arrangement.map((_, index) => index);
  let value = 0;
  arrangement.forEach((item, position) => {
    const at = rest.indexOf(item);
    value += at * FACTORIAL[arrangement.length - 1 - position];
    rest.splice(at, 1);
  });
  return value;
}
function unrank(value: number, size: number): Arrangement {
  const rest = Array.from({ length: size }, (_, index) => index);
  const arrangement: number[] = [];
  for (let position = 0; position < size; position++) {
    const step = FACTORIAL[size - 1 - position];
    arrangement.push(rest.splice(Math.floor(value / step), 1)[0]);
    value %= step;
  }
  return arrangement;
}
const same = (a: Arrangement, b: Arrangement) => a.length === b.length && a.every((item, index) => item === b[index]);

/** The answer number for a finished arrangement: the index of the option it equals, else ARRANGED + its rank. */
export function arrangementAnswer(question: Pick<ExamQuestion, "options">, board: Board, arrangement: Arrangement): number {
  const size = boardSize(board);
  const option = question.options.findIndex(code => { const named = optionArrangement(code, board.kind, size); return named !== null && same(named, arrangement); });
  return option >= 0 ? option : ARRANGED + rank(arrangement);
}
/** The arrangement an answer number stands for, or null when it names none of this question's arrangements. */
export function answerArrangement(question: Pick<ExamQuestion, "options">, board: Board, answer: number | null | undefined): Arrangement | null {
  if (typeof answer !== "number" || !Number.isInteger(answer)) return null;
  const size = boardSize(board);
  if (answer >= 0 && answer < question.options.length) return optionArrangement(question.options[answer], board.kind, size);
  if (answer >= ARRANGED && answer < ARRANGED + FACTORIAL[size]) return unrank(answer - ARRANGED, size);
  return null;
}
/** An arrangement written the way the options are ("1-b, 2-d" or "3 → 1 → 2"). */
export function arrangementCode(board: Board, arrangement: Arrangement): string {
  return board.kind === "match"
    ? arrangement.map((letter, item) => `${item + 1}-${ITEM_LETTERS[letter]}`).join(", ")
    : arrangement.map(item => item + 1).join(" → ");
}
/** Whether a stored answer number is in the range an arrangement code may take. */
export const isArrangedAnswer = (value: number) => Number.isInteger(value) && value >= ARRANGED && value <= ARRANGED_MAX;
