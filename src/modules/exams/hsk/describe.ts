import type { ExamFigure, HskGroup, HskItem } from "../types.ts";

/**
 * HSK pictures and printed Chinese in words, for the AI helpers: models do not see the SVGs.
 * Answer-free: pictures, the printed line and the printed choices only (never the heard text or the key).
 */
export function hskDescription(question: { figure?: ExamFigure; hsk?: HskItem; hskGroup?: HskGroup }) {
  const lines: string[] = [];
  if (question.figure?.kind === "image") lines.push(`Picture: ${question.figure.alt}`);
  if (question.hsk?.line) lines.push(`Printed: ${question.hsk.line.text} (${question.hsk.line.pinyin})`);
  if (question.hsk?.statement) lines.push(`${question.hskGroup?.layout === "RQ" ? "Question" : "Statement to judge"}: ★ ${question.hsk.statement.text} (${question.hsk.statement.pinyin})`);
  const compose = question.hsk?.compose;
  // The printed word as the paper shows it: the gap character stays hidden (it is the key).
  if (compose) lines.push(`Word (${compose.pinyin}): ${[...compose.word].map((char, index) => index === compose.at ? `[${compose.given} + missing ${compose.gap} component]` : char).join("")}`);
  const blank = question.hsk?.blank;
  if (blank) lines.push(`Sentence with one missing character: ${blank.before}＿${blank.after} (pinyin of the gap: ${blank.hint})`);
  return lines.join("\n");
}
/** The answer choices with what each shows or says, e.g. "B: picture of A cup of tea" or "A: 商店 (shāngdiàn)". */
export function hskChoices(question: { hsk?: HskItem; hskGroup?: HskGroup }) {
  const pictures = question.hsk?.pictures ?? question.hskGroup?.pictures;
  if (pictures) return pictures.map(picture => `${picture.label}: picture of ${picture.alt}`);
  const choices = question.hsk?.choices ?? question.hskGroup?.choices;
  return choices?.map(choice => choice.pinyin ? `${choice.label}: ${choice.text} (${choice.pinyin})` : `${choice.label}: ${choice.text}`);
}
