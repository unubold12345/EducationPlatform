// Server-side loader for the imported ЭЕШ mocks. The JSON files under assets/entrance-mocks keep
// answers and explanations off the client; only the stripped PublicStage reaches the browser.
// Not marked `server-only` because the catalog and unit tests import exam definitions in Node.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExamDefinition, ExamQuestion, ExamStage, EntranceSubject } from "../types.ts";
import { entranceSubjectLabels, findEntranceMeta } from "./catalog.ts";

type StoredQuestion = ExamQuestion;
type StoredGroup = NonNullable<ExamStage["groups"]>[number];
type StoredMock = {
  slug: string; subject: EntranceSubject; year: number; form: string; title: string; description: string;
  durationMinutes: number; points: number; calculator: boolean; language: "mn" | "en";
  instructions: string[]; groups: StoredGroup[]; questions: StoredQuestion[];
  passages: { title: string; text: string }[];
  sourceNote?: string;
};

const cache = new Map<string, ExamDefinition>();

function storedPath(slug: string, subject: EntranceSubject) {
  return join(process.cwd(), "assets", "entrance-mocks", subject, slug + ".json");
}

export function entranceDefinition(slug: string): ExamDefinition | undefined {
  const cached = cache.get(slug);
  if (cached) return cached;
  const meta = findEntranceMeta(slug);
  if (!meta) return undefined;
  const stored = JSON.parse(readFileSync(storedPath(slug, meta.subject), "utf8")) as StoredMock;
  const stage: ExamStage = {
    id: `${slug}-stage`,
    title: `${entranceSubjectLabels[meta.subject]} · ${stored.year} · ${stored.form}`,
    seconds: stored.durationMinutes * 60,
    kind: "questions",
    instructions: stored.instructions.join(" "),
    questions: stored.questions,
    passages: stored.passages,
    groups: stored.groups,
  };
  const definition: ExamDefinition = {
    slug, version: 1, program: "entrance", subject: stored.subject,
    title: stored.title, description: stored.description, stages: [stage], sources: [],
    points: stored.points, calculator: stored.calculator,
    notes: stored.instructions, ...(stored.sourceNote ? { sourceNote: stored.sourceNote } : {}),
  };
  cache.set(slug, definition);
  return definition;
}
