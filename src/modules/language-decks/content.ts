// Node-only deck content; never import this loader from a client component.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findLanguageDeck, type LanguageDeck, type PinyinChart } from "./catalog.ts";

const cache = new Map<string, LanguageDeck>();

export function languageDeck(id: string): LanguageDeck | undefined {
  const info = findLanguageDeck(id);
  if (!info) return;
  if (!cache.has(id)) {
    const file = JSON.parse(readFileSync(join(process.cwd(), "assets", "language-decks", id + ".json"), "utf8")) as LanguageDeck;
    cache.set(id, { ...info, lessons: file.lessons, ...(file.lookalikes ? { lookalikes: file.lookalikes } : {}) });
  }
  return cache.get(id);
}

let chart: PinyinChart | null = null;
export function pinyinChart(): PinyinChart {
  chart ??= JSON.parse(readFileSync(join(process.cwd(), "assets", "language-decks", "pinyin-chart.json"), "utf8")) as PinyinChart;
  return chart;
}

export function deckWordIds(id: string): ReadonlySet<string> {
  return new Set(languageDeck(id)?.lessons.flatMap(lesson => lesson.words.map(word => word.id)) ?? []);
}
