import type { TopikChart, TopikDoc, TopikGroup, TopikItem } from "../types.ts";

/**
 * TOPIK print in words, for the AI helpers: models do not see pictures or charts. Answer-free: the block's text,
 * documents, charts, picture briefs and the writing task only (never the heard script, the key or a model answer).
 */
const doc = (d: TopikDoc) => [d.from || d.to ? `${d.from ? "From: " + d.from : ""}${d.to ? " To: " + d.to : ""}`.trim() : "", d.title ?? "", ...d.lines, d.footer ?? ""].filter(Boolean).join("\n");
export const chartText = (c: TopikChart) => `${c.type} chart "${c.title}"${c.unit ? ` (unit ${c.unit})` : ""}: ${c.series.map(s => `${c.series.length > 1 ? s.name + " " : ""}${c.labels.map((label, i) => `${label} ${s.values[i]}`).join(", ")}`).join("; ")}${c.note ? ` (${c.note})` : ""}`;
function print(item: Pick<TopikItem, "passage" | "doc" | "chart"> | undefined) {
  if (!item) return [];
  return [item.doc ? `Printed document:\n${doc(item.doc)}` : "", item.chart ? `Printed ${chartText(item.chart)}` : "", item.passage ? `Text:\n${item.passage}` : ""].filter(Boolean);
}
export function topikDescription(question: { topik?: TopikItem; topikGroup?: TopikGroup }) {
  const item = question.topik, group = question.topikGroup, lines: string[] = [];
  if (group) lines.push(`${group.range} ${group.instruction}${group.plays ? ` (the recording is played ${group.plays === 2 ? "twice" : "once"})` : ""}`, ...print(group));
  if (item) {
    lines.push(...print(item));
    if (item.line) lines.push(`Question: ${item.line}`);
    if (item.sentence) lines.push(`Sentence to insert: ${item.sentence}`);
    if (item.gaps) lines.push(`Write one sentence for each gap: ${item.gaps.join(", ")}.`);
    if (item.topic) lines.push(`Topic: ${item.topic}`);
    if (item.charts?.length && item.topic) lines.push(...item.charts.map(chartText));
    if (item.notes?.length) lines.push(`Notes: ${item.notes.join("; ")}`);
    if (item.prompt) lines.push(`Essay task: ${item.prompt}${item.bullets?.length ? "\n- " + item.bullets.join("\n- ") : ""}`);
    if (item.chars) lines.push(`Length: ${item.chars[0]}–${item.chars[1]} characters including spaces.`);
  }
  return lines.join("\n\n");
}
/** The four choices with what each says or shows, e.g. "② 서점" or "③: picture of A woman paying at a counter". */
export function topikChoices(question: { topik?: TopikItem }) {
  const item = question.topik, marks = ["①", "②", "③", "④"];
  if (item?.pictures) return item.pictures.map((picture, i) => `${marks[i]}: picture of ${picture.alt}`);
  if (item?.charts && !item.topic) return item.charts.map((chart, i) => `${marks[i]}: ${chartText(chart)}`);
  return item?.choices?.map((choice, i) => `${marks[i]} ${choice}`);
}
