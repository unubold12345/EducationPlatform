import type { ExamFigure, PublicQuestion } from "./types.ts";

/** Old v2 snapshots predate figure metadata. Render only when their own givens match the diagram. */
export function questionFigure(question: Pick<PublicQuestion, "id" | "prompt" | "figure">): ExamFigure | undefined {
  if (question.figure) return question.figure;
  const match = /^eesh-math-([1-4])-(q(\d+)|f([1-3])[a-g])-v2$/.exec(question.id);
  if (!match) return;
  const k = Number(match[1]) + 1, q = Number(match[3]), fill = Number(match[4]);
  const text = question.prompt;
  if (q === 11 && text.includes(`0 ≤ x ≤ ${k}`) && text.includes(`${k * k} + x − ${k}`)) return { kind: "piecewise", scale: k };
  if (q === 19 && text.includes(`|x − ${k}|`)) return { kind: "absolute-area", scale: k };
  if (q === 26 && text.includes(`талууд ${5 * k}, ${5 * k}, ${6 * k}`)) return { kind: "isosceles", scale: k };
  if (q === 27 && text.includes(`Радиус ${5 * k}`) && text.includes(`${3 * k} зайд`)) return { kind: "tangents", scale: k };
  if (q === 28 && text.includes(`B(${6 * k}; 0), C(0; ${6 * k})`)) return { kind: "cevians", scale: k };
  if (q === 31 && text.includes(`y = ${k * k} − x²`)) return { kind: "parabola-rectangle", scale: k };
  if (q === 32 && text.includes(`эзлэхүүн ${8 * k ** 3}`)) return { kind: "open-box", scale: k };
  if (q === 36 && text.includes(`x² + y² = ${k * k}`)) return { kind: "circle-line", scale: k };
  if (fill === 1 && text.includes(`${6 * k} см талтай квадрат картоны`)) return { kind: "box-net", scale: k };
  if (fill === 2 && text.includes(`x²(${3 * k} − x)`)) return { kind: "cubic-area", scale: k };
  if (fill === 3 && text.includes(`AB = ${13 * k}, BC = ${14 * k}, CA = ${15 * k}`)) return { kind: "triangle-circles", scale: k };
}
