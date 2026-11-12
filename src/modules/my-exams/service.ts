import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, examCredits, examHold, examOutputTokens, type UsageMeter } from "@/modules/credits/pricing";
import { ApiError } from "@/lib/api";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import { cleanSourceText, displayFileName } from "@/modules/documents/text";
import { extractDocument } from "@/modules/documents/extract";
import { readUploadedSource } from "@/modules/documents/upload";
import {
  EXAM_COUNT, MY_EXAM_LIMITS, cleanStructureRequest, examCapacity, examMessages, examsFullMessage, gradeExam, isExamId, isExamLanguage,
  parseGeneratedExam, publicExam, readBest, readDraft, readExamCount, readFullQuestions, readGradeRequest, readImportRequest, readResult,
  readSittingRequest, suggestedSeconds,
  type ExamBest, type ExamDraft, type ExamLanguage, type ExamResult, type GeneratedExam, type SavedExam,
} from "./contracts";
import { ExamTokenError, openExam } from "./token";

const LEASE_MS = 300_000;
const DAILY_LIMIT = MY_EXAM_LIMITS.daily;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = MY_EXAM_LIMITS.fileBytes + BODY_SLACK;
const MIN_TEXT = 80;
const DAY_MS = 24 * 60 * 60 * 1000;

type ExamReply = {
  exam: SavedExam;
  /** How many exams this student's plan keeps, so the page can refresh its counter. */
  limit: number;
  source: { name: string; kind: string; pages: number | null; truncated: boolean };
  provider: "DeepSeek";
};

const EXAM_SELECT = {
  id: true, title: true, sourceName: true, sourceKind: true, language: true, questions: true, suggestedSeconds: true,
  draft: true, last: true, best: true, attempts: true, createdAt: true, updatedAt: true,
} as const;
type ExamRow = {
  id: string; title: string; sourceName: string; sourceKind: string; language: string; questions: unknown; suggestedSeconds: number;
  draft: unknown; last: unknown; best: unknown; attempts: number; createdAt: Date; updatedAt: Date;
};
const asJson = (value: unknown) => value as Prisma.InputJsonValue;
const missing = (error: unknown) => (error as { code?: string }).code === "P2025";
const duplicate = (error: unknown) => (error as { code?: string }).code === "P2002";

/**
 * A stored exam as the browser may see it: the key and explanations stay on the server, except inside a
 * sitting that was already graded. A row that no longer reads is left out rather than shown broken.
 */
function savedExam(row: ExamRow): SavedExam | null {
  const questions = readFullQuestions(row.questions);
  if (!questions || !isExamLanguage(row.language)) return null;
  const ids = questions.map(question => question.id);
  return {
    id: row.id, title: row.title, sourceName: row.sourceName, sourceKind: row.sourceKind, language: row.language,
    createdAt: row.createdAt.getTime(), updatedAt: row.updatedAt.getTime(),
    questions: publicExam({ title: row.title, questions }).questions, suggestedSeconds: row.suggestedSeconds,
    draft: readDraft(row.draft, ids), last: readResult(row.last), best: readBest(row.best), attempts: row.attempts,
  };
}
function shown(row: ExamRow): SavedExam {
  const exam = savedExam(row);
  if (!exam) throw new ApiError(404, "Энэ шалгалт олдсонгүй.");
  return exam;
}

async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа файлаас шалгалт үүсгэнэ үү.");
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : null;
};

/** How many exams the student may keep, from their active plans (the free size without one). */
export async function savedExamLimit(userId: string, now = new Date()) {
  const rows = await getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } });
  return examCapacity(rows.map(row => row.program));
}

/** The student's own exams, most recently used first. */
export async function listMyExams(userId: string): Promise<SavedExam[]> {
  const rows = await getDb().myExam.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: MY_EXAM_LIMITS.exams, select: EXAM_SELECT });
  return rows.flatMap(row => savedExam(row) ?? []);
}

/** The page's first read: the saved exams and how many the plan keeps. */
export async function myExamLibrary(userId: string) {
  const [exams, limit] = await Promise.all([listMyExams(userId), savedExamLimit(userId)]);
  return { exams, limit };
}

/** An exam id from a request is only ever used when the exam belongs to this student. */
async function ownExam(userId: string, id: string) {
  if (!isExamId(id)) throw new ApiError(400, "Шалгалтын түлхүүр буруу байна.");
  const row = await getDb().myExam.findFirst({ where: { id, userId }, select: EXAM_SELECT });
  const questions = row ? readFullQuestions(row.questions) : null;
  if (!row || !questions) throw new ApiError(404, "Энэ шалгалт олдсонгүй.");
  return { row, questions, ids: questions.map(question => question.id) };
}

/** The exam title when the model does not give a usable one. */
function titleFromFile(name: string) {
  const base = displayFileName(name).replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base.slice(0, 80) : "Шинэ шалгалт";
}

/** One upload in, one saved exam out. The file is never stored; the key stays on the server until a sitting is graded. */
export async function createMyExam(userId: string, request: Request): Promise<ExamReply> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data")) throw new ApiError(415, "Файлтай хүсэлт шаардлагатай.");
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) throw new ApiError(411, "Файлын хэмжээ тодорхойгүй байна.");
  if (declared > MAX_BODY) throw new ApiError(413, `Файл хэт том байна. ${MY_EXAM_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);

  let form: FormData;
  try { form = await request.formData(); }
  catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  // A page loaded before exams moved to the account still reports its own count; it reloads before it can spend credits.
  if (form.has("saved")) throw new ApiError(409, "Хуудас шинэчлэгдсэн байна. Хуудсаа дахин ачаалаад оролдоно уу.");
  for (const key of form.keys()) if (!["file", "count", "language", "structure"].includes(key)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  // One document, or up to four page photos; their size and real kind are proven before credits are held.
  const upload = await readUploadedSource(form, "Шалгалт үүсгэх файл эсвэл зургаа сонгоно уу.");
  const count = readExamCount(field(form, "count"));
  const languageValue = field(form, "language") ?? "mn";
  if (count === null) throw new ApiError(400, `Асуултын тоо ${EXAM_COUNT.min}–${EXAM_COUNT.max} байна.`);
  if (!isExamLanguage(languageValue)) throw new ApiError(400, "Шалгалтын хэл буруу байна.");
  const rawStructure = field(form, "structure") ?? "";
  if (rawStructure.length > MY_EXAM_LIMITS.structure) throw new ApiError(400, `Бүтцийн заавар ${MY_EXAM_LIMITS.structure} тэмдэгтээс ихгүй байна.`);
  const structure = cleanStructureRequest(rawStructure);
  const language: ExamLanguage = languageValue;
  const name = upload.name;

  await ensureNoTimedExam(userId);
  // Exams are counted on the account, so the plan read here decides whether one more fits, whatever the
  // browser holds. A full library is refused before any credits are held.
  const db = getDb();
  const limit = await savedExamLimit(userId);
  const saved = await db.myExam.count({ where: { userId } });
  if (saved >= limit) throw new ApiError(409, examsFullMessage(limit));
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI шалгалт үүсгэгч одоогоор холбогдоогүй байна.");

  const now = Date.now(), limitKey = `education-my-exams:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  // The price depends on the text actually read; until extraction, assume the longest document.
  let readChars: number = MY_EXAM_LIMITS.textChars;
  // Page photos are priced as DeepSeek bills them (at most 1,024 tokens each) instead of by text length.
  const pictures = upload.kind === "images" ? upload.images.length : 0;
  // The most this exam can cost is held first and refunded on any failure, including a file with too
  // little text; on success the charge settles to the questions delivered.
  return chargeCredits(userId, "exam", async meter => {
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
      readChars = 0;
      messages = examMessages({ images: upload.images, count, language, truncated: false, structure });
      source = { name, kind: "image", pages: upload.images.length, truncated: false };
    } else {
      const extracted = await extractDocument(name, upload.bytes);
      const cleaned = cleanSourceText(extracted.text);
      if (cleaned.text.length < MIN_TEXT) throw new ApiError(422, "Файлаас шалгалт үүсгэх хангалттай текст олдсонгүй. Илүү бүрэн файл оруулна уу.");
      readChars = cleaned.text.length;
      messages = examMessages({ text: cleaned.text, count, language, truncated: cleaned.truncated, structure });
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
    // Saved with its key on the account. A failure here refunds the credits like any other.
    const row = await db.myExam.create({
      data: {
        userId, title: exam.title.slice(0, 200), sourceName: name.slice(0, 200) || fallbackTitle, sourceKind: source.kind.slice(0, 20), language,
        questions: asJson(exam.questions), suggestedSeconds: suggestedSeconds(exam.questions.length),
      },
      select: EXAM_SELECT,
    });
    return { exam: shown(row), limit, source, provider: "DeepSeek" };
  } finally {
    // Only release the lease this request holds; never shorten another request's lease.
    await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
  }
  }, { hold: examHold(count, pictures), settle: reply => examCredits(readChars, reply.exam.questions.length, pictures) });
}

/**
 * Start a sitting, or save its progress. A save must name the open sitting by its start time, so a tab left
 * open on another device cannot overwrite a newer sitting or bring back one that was already graded.
 */
export async function updateMyExam(userId: string, id: string, body: unknown): Promise<{ draft: ExamDraft }> {
  const input = readSittingRequest(body);
  if (!input) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const { row, ids } = await ownExam(userId, id);
  let draft: ExamDraft;
  if (input.action === "start") {
    // The clock is the student's own study aid, read from their device; a start far from the server's time is replaced.
    const now = Date.now();
    draft = { answers: {}, index: 0, flagged: [], startedAt: Math.abs(input.startedAt - now) <= DAY_MS ? input.startedAt : now, mode: input.mode };
  } else {
    const open = readDraft(row.draft, ids);
    if (!open || open.startedAt !== input.startedAt) throw new ApiError(409, "Энэ оролдлого дууссан эсвэл өөр төхөөрөмж дээр шинээр эхэлсэн байна.");
    if (input.index >= ids.length || [...Object.keys(input.answers), ...input.flagged].some(key => !ids.includes(key))) throw new ApiError(400, "Хариулт энэ шалгалтад хамаарахгүй байна.");
    draft = { ...open, answers: input.answers, index: input.index, flagged: input.flagged };
  }
  const saved = await getDb().myExam.updateMany({ where: { id: row.id, userId }, data: { draft: asJson(draft) } });
  if (!saved.count) throw new ApiError(404, "Энэ шалгалт олдсонгүй.");
  return { draft };
}

/** Delete only the student's own exam, with its sitting and results. */
export async function deleteMyExam(userId: string, id: string) {
  if (!isExamId(id)) throw new ApiError(400, "Шалгалтын түлхүүр буруу байна.");
  const result = await getDb().myExam.deleteMany({ where: { id, userId } });
  if (!result.count) throw new ApiError(404, "Энэ шалгалт олдсонгүй.");
  return { ok: true };
}

/** Grade the signed-in student's own exam from the key stored on the account, and keep the result there. */
export async function gradeMyExam(userId: string, body: unknown): Promise<{ exam: SavedExam }> {
  const input = readGradeRequest(body);
  if (!input) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const { row, questions, ids } = await ownExam(userId, input.id);
  if (Object.keys(input.answers).some(key => !ids.includes(key))) throw new ApiError(400, "Хариулт энэ шалгалтад хамаарахгүй байна.");
  const grade = gradeExam(questions, input.answers);
  const now = Date.now();
  // The elapsed time and the mode describe the student's own sitting; they are shown back, never scored.
  const last: ExamResult = { ...grade, finishedAt: now, elapsedSeconds: input.elapsedSeconds, timed: input.timed };
  const previous = readBest(row.best);
  const best: ExamBest = !previous || grade.percent >= previous.percent ? { correct: grade.correct, total: grade.total, percent: grade.percent, at: now } : previous;
  try {
    const updated = await getDb().myExam.update({
      where: { id: row.id, userId },
      data: { last: asJson(last), best: asJson(best), attempts: { increment: 1 }, draft: Prisma.DbNull },
      select: EXAM_SELECT,
    });
    return { exam: shown(updated) };
  } catch (error) {
    if (missing(error)) throw new ApiError(404, "Энэ шалгалт олдсонгүй.");
    throw error;
  }
}

/**
 * Move one exam from a browser to the account. Exams made before 2026-11-12 lived in browser storage with
 * the key sealed in a token; the page sends each one here once. Only the token is believed: the questions
 * and key come out of it, the last sitting's answers are graded again, and one token never makes two
 * exams. A token that cannot be opened is reported, not thrown, so the page can tell it from a busy server.
 */
export async function importMyExam(userId: string, body: unknown): Promise<{ exam: SavedExam; imported: boolean } | { exam: null; refused: "invalid" | "owner" }> {
  const input = readImportRequest(body);
  if (!input) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  let sealed;
  try { sealed = openExam(input.token, userId, Date.now(), { allowExpired: true }); }
  catch (error) {
    if (!(error instanceof ExamTokenError)) throw error;
    if (error.code === "config") throw new ApiError(503, "Шалгалт хамгаалах түлхүүр тохируулаагүй байна.");
    return { exam: null, refused: error.code === "owner" ? "owner" : "invalid" };
  }
  const questions = readFullQuestions(sealed.questions);
  if (!questions) return { exam: null, refused: "invalid" };
  const db = getDb();
  const importKey = createHash("sha256").update(input.token).digest("hex");
  const known = () => db.myExam.findUnique({ where: { userId_importKey: { userId, importKey } }, select: EXAM_SELECT });
  const existing = await known();
  if (existing) return { exam: shown(existing), imported: false };
  // Moved exams may pass the plan's size (they already existed), but never the account's ceiling.
  if (await db.myExam.count({ where: { userId } }) >= MY_EXAM_LIMITS.exams) throw new ApiError(409, `Бүртгэлд хамгийн ихдээ ${MY_EXAM_LIMITS.exams} шалгалт хадгална. Нэг шалгалтаа устгасны дараа үлдсэн нь шилжинэ.`);

  const now = Date.now();
  const past = (value: number) => value > 0 && value <= now ? value : now;
  const ids = questions.map(question => question.id);
  let last: ExamResult | null = null;
  if (input.last && Object.keys(input.last.answers).every(key => ids.includes(key))) {
    last = { ...gradeExam(questions, input.last.answers), finishedAt: past(input.last.finishedAt), elapsedSeconds: input.last.elapsedSeconds, timed: input.last.timed };
  }
  const draft = readDraft(input.draft, ids);
  const best: ExamBest | null = last ? { correct: last.correct, total: last.total, percent: last.percent, at: last.finishedAt } : null;
  try {
    const row = await db.myExam.create({
      data: {
        userId, importKey, title: sealed.title, sourceName: sealed.sourceName, sourceKind: sealed.sourceKind, language: sealed.language,
        questions: asJson(questions), suggestedSeconds: suggestedSeconds(questions.length),
        ...(draft ? { draft: asJson({ ...draft, startedAt: past(draft.startedAt) }) } : {}),
        ...(last && best ? { last: asJson(last), best: asJson(best), attempts: Math.max(1, input.attempts) } : {}),
        createdAt: new Date(past(sealed.createdAt)),
      },
      select: EXAM_SELECT,
    });
    return { exam: shown(row), imported: true };
  } catch (error) {
    // Two tabs moved the same exam at once: the first one's row is the exam.
    const twin = duplicate(error) ? await known() : null;
    if (twin) return { exam: shown(twin), imported: false };
    throw error;
  }
}

/** DeepSeek JSON mode, mirroring the vocabulary import rules but with the exam output budget. */
async function deepseekExam(messages: ReturnType<typeof examMessages>, count: number, meter: UsageMeter) {
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
        // The reply budget follows the question count and never passes the action's listed budget.
        max_tokens: Math.min(AI_ACTIONS["exam"].outputTokens, examOutputTokens(count)),
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
