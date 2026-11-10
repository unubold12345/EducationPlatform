import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { READING_LIMITS, choiceCount, type FullGroup, type ReadingLanguage } from "./contracts.ts";

// A generated practice's answer key never reaches the browser in readable form: it is sealed in an AES-256-GCM
// token bound to one student, and the server opens it to mark the answers. Same design as the file-to-exam
// token, with its own key and associated data so neither token opens the other. No "server-only" import, so the
// round trip can be unit tested; only the server service imports it.
const PREFIX = "wxr1";
const VERSION = 1;
const AAD = "education-reading-lab-v1:";
/** Students come back to a practice they paid for; the key stays usable for half a year. */
export const READING_TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export type SealedReading = {
  title: string;
  language: ReadingLanguage;
  paragraphs: number;
  groups: FullGroup[];
  sourceName: string;
  sourceKind: string;
  createdAt: number;
};
type Payload = { v: number; userId: string; expiresAt: number; practice: SealedReading };

export type ReadingTokenFailure = "config" | "invalid" | "expired" | "owner";
export class ReadingTokenError extends Error {
  code: ReadingTokenFailure;
  constructor(code: ReadingTokenFailure) { super(code); this.code = code; }
}

function key(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new ReadingTokenError("config");
  return Buffer.from(hkdfSync("sha256", secret, "education-reading-lab", "reading-token-key-v1", 32));
}

const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const optional = (value: unknown, max: number) => value === undefined || text(value, max);
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const index = (value: unknown, count: number) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value < count;

/** The sealed groups are re-checked on open, so a token from an older build cannot mark answers wrongly. */
export function validGroups(value: unknown, paragraphs: number): value is FullGroup[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) return false;
  let count = 0;
  const ids = new Set<string>();
  const ok = value.every(group => {
    if (!record(group) || !text(group.instruction, 400) || !optional(group.limit, 200) || !optional(group.heading, 100)) return false;
    if (group.labels !== undefined && !["roman", "letter", "paragraph"].includes(group.labels as string)) return false;
    if (group.options !== undefined && (!Array.isArray(group.options) || group.options.length > 12 || !group.options.every(option => text(option, 200)))) return false;
    if (!Array.isArray(group.questions) || !group.questions.length) return false;
    return group.questions.every(question => {
      count++;
      if (!record(question) || typeof question.id !== "string" || !/^q\d{1,2}$/.test(question.id) || ids.has(question.id)) return false;
      ids.add(question.id);
      if (!text(question.prompt, 600) || !text(question.explanation, 1200) || !optional(question.evidence, 600)) return false;
      if (question.kind === "gap") return Array.isArray(question.answers) && question.answers.length >= 1 && question.answers.length <= 6 && question.answers.every(answer => text(answer, 80));
      if (question.kind === "choice" && !(Array.isArray(question.options) && question.options.length >= 2 && question.options.length <= 5 && question.options.every(option => text(option, 400)))) return false;
      if (question.kind !== "tfng" && question.kind !== "choice" && question.kind !== "match") return false;
      return index(question.answer, choiceCount(group as FullGroup, question as { kind: "tfng" | "choice" | "match"; options?: string[] }, paragraphs));
    });
  });
  return ok && count >= 1 && count <= READING_LIMITS.questions.max;
}

/** Seal one generated practice for one student. */
export function sealReading(userId: string, practice: SealedReading, now = Date.now()): string {
  const payload: Payload = { v: VERSION, userId, expiresAt: now + READING_TOKEN_TTL_MS, practice };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(AAD + userId, "utf8"));
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [PREFIX, iv.toString("base64url"), body.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

/** Open a token for the signed-in student, refusing tampered, expired and borrowed tokens. */
export function openReading(token: string, userId: string, now = Date.now()): SealedReading {
  if (typeof token !== "string" || token.length < 40 || token.length > READING_LIMITS.tokenChars) throw new ReadingTokenError("invalid");
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) throw new ReadingTokenError("invalid");
  let value: unknown;
  try {
    const iv = Buffer.from(parts[1], "base64url"), body = Buffer.from(parts[2], "base64url"), tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || body.length < 16) throw new Error("shape");
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAAD(Buffer.from(AAD + userId, "utf8"));
    decipher.setAuthTag(tag);
    value = JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8"));
  } catch (error) {
    if (error instanceof ReadingTokenError) throw error;
    throw new ReadingTokenError("invalid");
  }
  if (!record(value) || value.v !== VERSION || !text(value.userId, 200) || typeof value.expiresAt !== "number") throw new ReadingTokenError("invalid");
  if (value.userId !== userId) throw new ReadingTokenError("owner");
  if (!Number.isFinite(value.expiresAt) || value.expiresAt <= now) throw new ReadingTokenError("expired");
  const practice = value.practice;
  if (!record(practice) || !text(practice.title, 200) || (practice.language !== "mn" && practice.language !== "en")
    || !text(practice.sourceName, 200) || !text(practice.sourceKind, 20) || typeof practice.createdAt !== "number"
    || !index(practice.paragraphs, READING_LIMITS.paragraphs.max + 1) || !validGroups(practice.groups, practice.paragraphs as number)) throw new ReadingTokenError("invalid");
  return practice as SealedReading;
}
