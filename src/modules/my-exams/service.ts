import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, examCreditAction, type UsageMeter } from "@/modules/credits/pricing";
import { ApiError } from "@/lib/api";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import { cleanSourceText, displayFileName } from "@/modules/documents/text";
import { extractDocument } from "@/modules/documents/extract";
import { readUploadedSource } from "@/modules/documents/upload";
import {
  MY_EXAM_LIMITS, examMessages, gradeExam, isExamCount, isExamLanguage, parseGeneratedExam, publicExam, suggestedSeconds,
  type ExamCount, type ExamLanguage, type ExamGrade, type GeneratedExam, type PublicExam,
} from "./contracts";
import { ExamTokenError, openExam, sealExam } from "./token";

const LEASE_MS = 300_000;
const DAILY_LIMIT = MY_EXAM_LIMITS.daily;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = MY_EXAM_LIMITS.fileBytes + BODY_SLACK;
const MIN_TEXT = 80;

type ExamReply = PublicExam & {
  token: string;
  language: ExamLanguage;
  suggestedSeconds: number;
  source: { name: string; kind: string; pages: number | null; truncated: boolean };
  provider: "DeepSeek";
};

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа файлаас шалгалт үүсгэнэ үү.");
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : null;
};

/** The exam title when the model does not give a usable one. */
function titleFromFile(name: string) {
  const base = displayFileName(name).replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base.slice(0, 80) : "Шинэ шалгалт";
}

/** One upload in, one sealed exam out. The file and the key are never stored on the server. */
export async function createMyExam(userId: string, request: Request): Promise<ExamReply> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data")) throw new ApiError(415, "Файлтай хүсэлт шаардлагатай.");
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) throw new ApiError(411, "Файлын хэмжээ тодорхойгүй байна.");
  if (declared > MAX_BODY) throw new ApiError(413, `Файл хэт том байна. ${MY_EXAM_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);

  let form: FormData;
  try { form = await request.formData(); }
  catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  for (const key of form.keys()) if (!["file", "count", "language"].includes(key)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  // One document, or up to four page photos; their size and real kind are proven before credits are held.
  const upload = await readUploadedSource(form, "Шалгалт үүсгэх файл эсвэл зургаа сонгоно уу.");
  const countValue = Number(field(form, "count") ?? "10");
  const languageValue = field(form, "language") ?? "mn";
  if (!isExamCount(countValue)) throw new ApiError(400, "Асуултын тоо 10 эсвэл 20 байна.");
  if (!isExamLanguage(languageValue)) throw new ApiError(400, "Шалгалтын хэл буруу байна.");
  const count: ExamCount = countValue;
  const language: ExamLanguage = languageValue;
  const name = upload.name;

  await ensureNoTimedExam(userId);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI шалгалт үүсгэгч одоогоор холбогдоогүй байна.");
  if (!process.env.BETTER_AUTH_SECRET?.trim()) throw new ApiError(503, "Шалгалт хамгаалах түлхүүр тохируулаагүй байна.");

  const db = getDb(), now = Date.now(), limitKey = `education-my-exams:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  // Credits are held first and refunded on any failure, including a file with too little text.
  return chargeCredits(userId, examCreditAction(count), async meter => {
  await db.rateLimit.upsert({ where: { key: limitKey }, create: { id: randomUUID(), key: limitKey, count: 0, lastRequest: BigInt(0) }, update: {} });
  // Database CAS enforces a daily budget and one request in flight across every server instance.
  const reserved = await db.rateLimit.updateMany({
    where: { key: limitKey, count: { lt: DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } },
    data: { count: { increment: 1 }, lastRequest: lease },
  });
  if (!reserved.count) throw new ApiError(429, `Шалгалт үүсгэж байна эсвэл өдрийн ${DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);

  try {
    let messages: ReturnType<typeof examMessages>;
    let source: ExamReply["source"];
    if (upload.kind === "images") {
      // Photos of pages: the model reads them directly, so there is no text to measure first.
      messages = examMessages({ images: upload.images, count, language, truncated: false });
      source = { name, kind: "image", pages: upload.images.length, truncated: false };
    } else {
      const extracted = await extractDocument(name, upload.bytes);
      const cleaned = cleanSourceText(extracted.text);
      if (cleaned.text.length < MIN_TEXT) throw new ApiError(422, "Файлаас шалгалт үүсгэх хангалттай текст олдсонгүй. Илүү бүрэн файл оруулна уу.");
      messages = examMessages({ text: cleaned.text, count, language, truncated: cleaned.truncated });
      source = { name, kind: extracted.kind, pages: extracted.pages ?? null, truncated: cleaned.truncated };
    }
    const fallbackTitle = upload.kind === "images" ? "Зурагнаас үүсгэсэн шалгалт" : titleFromFile(name);
    let exam: GeneratedExam | null = null;
    // One silent retry when the model returns a malformed or too-short exam; the daily count is charged once.
    for (let attempt = 0; attempt < 2 && !exam; attempt++) {
      exam = parseGeneratedExam(await deepseekExam(messages, count, meter), { count, fallbackTitle });
    }
    if (!exam) throw new ApiError(503, upload.kind === "images" ? "Зурагнаас шалгалт үүсгэх хангалттай материал уншиж чадсангүй. Илүү тод, бүрэн хуудасны зураг оруулна уу." : "AI шалгалт үүсгэж чадсангүй. Дахин оролдоно уу.");
    // Another tab may start a timed exam while the provider is answering.
    await ensureNoTimedExam(userId);
    const sealed = {
      title: exam.title,
      questions: exam.questions,
      language,
      sourceName: name,
      sourceKind: source.kind,
      createdAt: Date.now(),
    };
    const token = sealExam(userId, sealed);
    return {
      ...publicExam(exam),
      token,
      language,
      suggestedSeconds: suggestedSeconds(exam.questions.length),
      source,
      provider: "DeepSeek",
    };
  } catch (error) {
    if (error instanceof ExamTokenError) throw new ApiError(error.code === "config" ? 503 : 500, "Шалгалтыг хамгаалж чадсангүй. Дахин оролдоно уу.");
    throw error;
  } finally {
    // Only release the lease this request holds; never shorten another request's lease.
    await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
  }
  });
}

/** Read the exact grade request shape; unknown fields are rejected before any decryption. */
function gradeInput(body: unknown): { token: string; answers: Record<string, number> } {
  if (!record(body) || Object.keys(body).some(key => key !== "token" && key !== "answers")) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  if (typeof body.token !== "string" || body.token.length < 40 || body.token.length > MY_EXAM_LIMITS.tokenChars) throw new ApiError(400, "Шалгалтын мэдээлэл буруу байна.");
  if (!record(body.answers)) throw new ApiError(400, "Хариултууд буруу байна.");
  const entries = Object.entries(body.answers);
  if (entries.length > MY_EXAM_LIMITS.questions) throw new ApiError(400, "Хариултын тоо хэт олон байна.");
  const answers: Record<string, number> = {};
  for (const [id, value] of entries) {
    if (!/^q\d{1,2}$/.test(id)) throw new ApiError(400, "Хариултын түлхүүр буруу байна.");
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 4) throw new ApiError(400, "Хариултын утга буруу байна.");
    answers[id] = value;
  }
  return { token: body.token, answers };
}

function tokenFailure(error: ExamTokenError): ApiError {
  if (error.code === "expired") return new ApiError(410, "Энэ шалгалтын хариулах хугацаа дууссан. Файлаасаа шинэ шалгалт үүсгэнэ үү.");
  if (error.code === "owner") return new ApiError(403, "Энэ шалгалт өөр бүртгэлийнх байна.");
  if (error.code === "config") return new ApiError(503, "Шалгалт хамгаалах түлхүүр тохируулаагүй байна.");
  return new ApiError(400, "Шалгалтын мэдээлэл хүчингүй байна. Дахин үүсгэнэ үү.");
}

/** Open the sealed exam and grade only the signed-in student's own answers. */
export function gradeMyExam(userId: string, body: unknown): { title: string; gradedAt: number } & ExamGrade {
  const input = gradeInput(body);
  let exam;
  try { exam = openExam(input.token, userId); }
  catch (error) {
    if (error instanceof ExamTokenError) throw tokenFailure(error);
    throw error;
  }
  const ids = new Set(exam.questions.map(question => question.id));
  for (const id of Object.keys(input.answers)) {
    if (!ids.has(id)) throw new ApiError(400, "Хариулт энэ шалгалтад хамаарахгүй байна.");
  }
  const grade = gradeExam(exam.questions, input.answers);
  return { title: exam.title, gradedAt: Date.now(), ...grade };
}

/** DeepSeek JSON mode, mirroring the vocabulary import rules but with the exam output budget. */
async function deepseekExam(messages: ReturnType<typeof examMessages>, count: ExamCount, meter: UsageMeter) {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503, "AI шалгалт үүсгэгч одоогоор холбогдоогүй байна.");
  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
        messages,
        thinking: { type: "disabled" },
        // 10 questions should not reserve the whole output budget; 20 need room for explanations.
        max_tokens: AI_ACTIONS[examCreditAction(count)].outputTokens,
        temperature: 0.35,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new ApiError(503, "AI шалгалт үүсгэгчтэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
  }
  // Never echo provider error bodies: they can contain request or credential details.
  if (!response.ok) throw new ApiError(503, response.status === 429 ? "AI ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу." : "AI холболт түр ажиллахгүй байна. Дахин оролдоно уу.");
  try {
    const data = await response.json() as { choices?: { finish_reason?: string; message?: { content?: unknown } }[]; usage?: unknown };
    meter.add(data.usage);
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (choice?.finish_reason !== "stop" || typeof content !== "string" || !content.trim() || content.length > 80_000) throw new Error("Invalid completion");
    return content;
  } catch {
    throw new ApiError(503, "AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
  }
}
