// Node-only private content for the free half-length mocks (keys and listening scripts); never import it from a
// client component. Written by scripts/build-free-mocks.mjs into assets/free-mocks, traced into every server route.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExamDefinition } from "../types.ts";
import { entranceSubjectLabels } from "../entrance/catalog.ts";
import { storedEntranceDefinition, type StoredMock } from "../entrance/content.ts";
import { findFreeMock } from "./catalog.ts";

const cache = new Map<string, ExamDefinition>();
const read = (name: string) => JSON.parse(readFileSync(join(process.cwd(), "assets", "free-mocks", name), "utf8"));

export function freeDefinition(slug: string): ExamDefinition | undefined {
  const meta = findFreeMock(slug);
  if (!meta) return undefined;
  const cached = cache.get(slug);
  if (cached) return cached;
  const raw = read(slug + ".json");
  // ЭЕШ papers keep the stored-paper shape of assets/entrance-mocks; the rest are complete definitions.
  const definition: ExamDefinition = meta.program === "entrance" && meta.subject
    ? storedEntranceDefinition(slug, raw as StoredMock, `${entranceSubjectLabels[meta.subject]} · Үнэгүй туршилт`)
    : raw as ExamDefinition;
  cache.set(slug, definition);
  return definition;
}

const scripts = new Map<string, string[]>();
/** The IELTS free mock's Listening scripts by part, for practice mode after a question is checked. */
export function freeListeningScripts(slug: string): string[] {
  const meta = findFreeMock(slug);
  if (!meta || meta.program !== "ielts") return [];
  if (!scripts.has(slug)) scripts.set(slug, (read(slug + "-listening.json") as { parts: string[] }).parts);
  return scripts.get(slug)!;
}
