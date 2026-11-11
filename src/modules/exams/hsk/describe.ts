import type { ExamFigure, HskGroup, HskItem } from "../types.ts";

/**
 * HSK pictures and printed Chinese in words, for the AI helpers: models do not see the SVGs.
 * Answer-free: pictures, the printed line and the printed choices only (never the heard text or the key).
 */
export function hskDescription(question: { figure?: ExamFigure; hsk?: HskItem; hskGroup?: HskGroup }) {
  const lines: string[] = [];
  if (question.figure?.kind === "image") lines.push(`Picture: ${question.figure.alt}`);
  if (question.hsk?.line) lines.push(`Printed: ${question.hsk.line.text} (${question.hsk.line.pinyin})`);
  return lines.join("\n");
}
/** The answer choices with what each shows or says, e.g. "B: picture of A cup of tea" or "A: 商店 (shāngdiàn)". */
export function hskChoices(question: { hsk?: HskItem; hskGroup?: HskGroup }) {
  const pictures = question.hsk?.pictures ?? question.hskGroup?.pictures;
  if (pictures) return pictures.map(picture => `${picture.label}: picture of ${picture.alt}`);
  const choices = question.hsk?.choices ?? question.hskGroup?.choices;
  return choices?.map(choice => `${choice.label}: ${choice.text} (${choice.pinyin})`);
}
