// Reply shapes of the mobile app's catalogue endpoints (GET /api/mobile/exams/**). Types only.
// The app keeps the same shapes in educationplatform-mobile/src/features/exams/types.ts; change both together.
import type { BriefingFact } from "@/modules/exams/briefing-summary";
import type { FreeMock } from "@/modules/exams/free/catalog";
import type { PlanOffer } from "@/modules/exams/start-client";
import type { EntranceSubject, ExamProgram, ExamStage } from "@/modules/exams/types";
import type { HubState, MockAccess } from "@/modules/subscriptions/mock-access";
import type { PickState } from "@/modules/subscriptions/pick-client";

/** GET /api/mobile/exams: the rows of the /exams page. */
export type HubProgramme = {
  id: "sat" | "ielts" | "eesh" | "jlpt" | "hsk";
  sub?: string; title: string; copy: string;
  facts: BriefingFact[]; chips: string[];
  subjects?: { label: string; count: number; href: string }[];
  count: number; href: string; cta: string;
  /** "Эсвэл … багцаар …": the plan that also opens the programme. */
  planNote: string;
};
export type HubReply = { priceLabel: string; note: string; programmes: HubProgramme[] };

/** One mock of a JLPT or HSK hub, with what the hub shows about access, the open sitting and practice progress. */
export type HubMock = {
  slug: string; eyebrow: string; title: string;
  /** HSK: the title's pinyin. */
  subtitle?: string;
  theme: string; questions: number; minutes: number; listening: string;
  /** hubLabel(): "Нээлттэй", "Багцад", "Энэ сар сонгосон", "Багцаар сонгох" or the price. */
  access: string; state: HubState;
  /** Practice mode opens (bought, a plan, or picked this plan month). */
  practice: boolean;
  activeAttemptId: string | null;
  /** Questions already checked in practice mode. */
  checked: number;
};
type ProgramHead = { eyebrow: string; title: string; summary: string; note: string };
export type CollectionReply = ProgramHead & {
  kind: "collection"; program: "sat" | "ielts"; free: FreeMock[];
  mocks: { slug: string; title: string; name: string; detail: string }[];
};
export type JlptReply = ProgramHead & {
  kind: "jlpt"; program: "jlpt";
  levels: { level: "N5" | "N4"; label: string; format: string; free: FreeMock | null; mocks: HubMock[] }[];
};
export type HskReply = ProgramHead & { kind: "hsk"; program: "hsk"; format: string; free: FreeMock | null; mocks: HubMock[] };
export type EeshReply = ProgramHead & {
  kind: "eesh"; program: "eesh"; subject: EntranceSubject; free: FreeMock[];
  facts: BriefingFact[];
  subjects: { subject: EntranceSubject; label: string; count: number; format: string; href: string }[];
  years: { year: number; mocks: { slug: string; form: string; questionCount: number; points: number; durationMinutes: number }[] }[];
};
/** GET /api/mobile/exams/programs/[program]: what the programme's hub page lists. */
export type ProgramReply = CollectionReply | JlptReply | HskReply | EeshReply;

/** briefingAccess() as the briefing pages use it; `access` is the kind the one access rule returned. */
export type BriefingGate = {
  hasAccess: boolean; practice: boolean; free: boolean;
  pick: PickState | null; pickedUntil: string | null; plan: PlanOffer | null;
  activeAttemptId: string | null; locked: string | null;
  access: MockAccess["kind"];
};
export type BriefingStage = { id: string; kind: ExamStage["kind"]; title: string; detail: string; minutes: number };
type BriefingBase = {
  slug: string; program: ExamProgram; title: string; description: string;
  eyebrow: string; chips: string[]; facts: BriefingFact[]; priceNote: string;
  gate: BriefingGate; stages: BriefingStage[];
  sources: { label: string; url: string }[];
};
/** GET /api/mobile/exams/briefing/[slug]: what the mock's briefing page shows. No questions, keys or scripts. */
export type BriefingReply = BriefingBase & (
  | { kind: "sat" }
  /** `examiner`: the AI examiner can conduct the Speaking stages; `speakingMinutes`: their length. */
  | { kind: "ielts"; examiner: boolean; speakingMinutes: number }
  | { kind: "jlpt"; level: "N5" | "N4"; listeningParts: number; listeningMinutes: number }
  | { kind: "hsk"; listeningMinutes: number; heard: number; read: number; perItem: number }
  | { kind: "entrance"; subject: EntranceSubject; structure: string; notes: string[]; sourceNote: string }
);
