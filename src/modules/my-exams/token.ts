import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import type { ExamLanguage, FullQuestion } from "./contracts";

// The answer key never travels to the browser in readable form: the generated exam is sealed in
// an AES-256-GCM token bound to one student. Grading opens it on the server after submission.
// This file intentionally has no "server-only" import so the round trip can be unit tested; it is
// only imported by the server service and uses node:crypto.
const PREFIX = "wxe1";
const VERSION = 1;
const AAD = "education-workspace-exam-v1:";
export const EXAM_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SealedExam = {
  title: string;
  questions: FullQuestion[];
  language: ExamLanguage;
  sourceName: string;
  sourceKind: string;
  createdAt: number;
};

type Payload = { v: number; userId: string; expiresAt: number; exam: SealedExam };

export type ExamTokenFailure = "config" | "invalid" | "expired" | "owner";
export class ExamTokenError extends Error {
  code: ExamTokenFailure;
  constructor(code: ExamTokenFailure) { super(code); this.code = code; }
}

function key(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new ExamTokenError("config");
  return Buffer.from(hkdfSync("sha256", secret, "education-workspace-exam", "exam-token-key-v1", 32));
}

const validText = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function validQuestions(value: unknown): value is FullQuestion[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return false;
  return value.every(item => {
    if (!record(item)) return false;
    return validText(item.id, 8) && validText(item.prompt, 900) && Array.isArray(item.options)
      && item.options.length >= 2 && item.options.length <= 5 && item.options.every(option => validText(option, 400))
      && typeof item.answer === "number" && Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.options.length
      && validText(item.explanation, 1300) && (item.topic === undefined || validText(item.topic, 100));
  });
}

/** Seal one generated exam for one student. */
export function sealExam(userId: string, exam: SealedExam, now = Date.now()): string {
  const payload: Payload = { v: VERSION, userId, expiresAt: now + EXAM_TOKEN_TTL_MS, exam };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(AAD + userId, "utf8"));
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [PREFIX, iv.toString("base64url"), body.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

/** Open a token for the signed-in student, refusing tampered, expired and borrowed tokens. */
export function openExam(token: string, userId: string, now = Date.now()): SealedExam {
  if (typeof token !== "string" || token.length < 40 || token.length > 200_000) throw new ExamTokenError("invalid");
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) throw new ExamTokenError("invalid");
  let value: unknown;
  try {
    const iv = Buffer.from(parts[1], "base64url");
    const body = Buffer.from(parts[2], "base64url");
    const tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || body.length < 16) throw new Error("shape");
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAAD(Buffer.from(AAD + userId, "utf8"));
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
    value = JSON.parse(plain);
  } catch (error) {
    if (error instanceof ExamTokenError) throw error;
    throw new ExamTokenError("invalid");
  }
  if (!record(value) || value.v !== VERSION || !validText(value.userId, 200) || typeof value.expiresAt !== "number") throw new ExamTokenError("invalid");
  if (value.userId !== userId) throw new ExamTokenError("owner");
  if (!Number.isFinite(value.expiresAt) || value.expiresAt <= now) throw new ExamTokenError("expired");
  const exam = value.exam;
  if (!record(exam) || !validText(exam.title, 200) || (exam.language !== "mn" && exam.language !== "en")
    || !validText(exam.sourceName, 200) || !validText(exam.sourceKind, 20) || typeof exam.createdAt !== "number"
    || !validQuestions(exam.questions)) throw new ExamTokenError("invalid");
  return exam as SealedExam;
}
