import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";
import { readingLabEnabled } from "@/lib/local-pilot";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, readingPracticeCredits, readingPracticeHold, type UsageMeter } from "@/modules/credits/pricing";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import { cleanSourceText, fallbackTitle } from "@/modules/documents/text";
import { extractDocument } from "@/modules/documents/extract";
import { readUploadedSource } from "@/modules/documents/upload";
import {
  READING_LIMITS, allQuestions, isReadingLanguage, parseGeneratedReading, passageWords, publicGroups, readingMessages,
  type FullGroup, type ReadingLanguage,
} from "./contracts";
import { findReadingSample } from "./samples";
import {
  PRACTICES_FULL, answersFit, applyProgress, blankState, importedParagraphs, importedState, isBlank, isPracticeId, isSampleId,
  readGradeRequest, readImportRequest, readParagraphs, readProgressRequest, readState,
  type PracticeState, type ProgressRequest, type SavedPractice,
} from "./state";
import { ReadingTokenError, openReading, readingImportKey, validGroups } from "./token";

const ACTION = "reading-practice" as const;
const LEASE_MS = 300_000;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = READING_LIMITS.fileBytes + BODY_SLACK;
/** A retry only starts while there is time left for it inside the function's limit. */
const RETRY_BEFORE_MS = 60_000;
const PASTED = "Буулгасан текст";
const RELOAD = "Хуудас шинэчлэгдсэн байна. Хуудсаа дахин ачаалаад оролдоно уу.";
const STALE = "Энэ дасгал өөр цонх эсвэл төхөөрөмж дээр өөрчлөгдсөн байна. Хуудсаа дахин ачаална уу.";
const NOT_FOUND = "Энэ дасгал олдсонгүй.";
const BAD_SHAPE = "Хүсэлтийн бүтэц буруу байна.";

export type ReadingReply = {
  /** The practice as saved on the account, without its key. */
  practice: SavedPractice;
  /** `chars` is the material text DeepSeek read (0 for page photos); it prices the practice. */
  source: { name: string; kind: string; pages: number | null; truncated: boolean; chars: number };
  provider: "DeepSeek";
};
/** What a progress change returns: the stored state and when the row last changed. */
export type ProgressReply = { state: PracticeState; updatedAt: number };

const PRACTICE_SELECT = {
  id: true, title: true, language: true, sourceName: true, sourceKind: true, paragraphs: true, questions: true, state: true, createdAt: true, updatedAt: true,
} as const;
type PracticeRow = {
  id: string; title: string; language: string; sourceName: string; sourceKind: string; paragraphs: unknown; questions: unknown; state: unknown;
  createdAt: Date; updatedAt: Date;
};

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const asJson = (value: unknown) => value as Prisma.InputJsonValue;
const missing = (error: unknown) => (error as { code?: string }).code === "P2025";
const duplicate = (error: unknown) => (error as { code?: string }).code === "P2002";

function ensureEnabled() {
  if (!readingLabEnabled()) throw new ApiError(404, "Туршилтын хуудас идэвхгүй байна.");
}
async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа унших дасгал үүсгэнэ үү.");
}

/** A stored practice with its key, and what the browser may see of it. A row that no longer reads is left out. */
function storedPractice(row: PracticeRow): { practice: SavedPractice; groups: FullGroup[] } | null {
  const paragraphs = readParagraphs(row.paragraphs);
  if (!paragraphs || !isReadingLanguage(row.language) || !validGroups(row.questions, paragraphs.length)) return null;
  const groups = row.questions;
  return {
    groups,
    practice: {
      id: row.id, title: row.title, paragraphs, groups: publicGroups(groups), language: row.language, sourceName: row.sourceName,
      sourceKind: row.sourceKind, createdAt: row.createdAt.getTime(), updatedAt: row.updatedAt.getTime(), state: readState(row.state),
    },
  };
}
function shown(row: PracticeRow): SavedPractice {
  const stored = storedPractice(row);
  if (!stored) throw new ApiError(404, NOT_FOUND);
  return stored.practice;
}

/** A practice id from a request is only ever used when the practice belongs to this student. */
async function ownPractice(userId: string, id: string) {
  if (!isPracticeId(id)) throw new ApiError(400, "Дасгалын түлхүүр буруу байна.");
  const row = await getDb().readingPractice.findFirst({ where: { id, userId }, select: PRACTICE_SELECT });
  const stored = row ? storedPractice(row) : null;
  if (!row || !stored) throw new ApiError(404, NOT_FOUND);
  return { row, ...stored };
}

/** The student's own practices, most recently changed first. */
export async function listReadingPractices(userId: string): Promise<SavedPractice[]> {
  const rows = await getDb().readingPractice.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: READING_LIMITS.practices, select: PRACTICE_SELECT });
  return rows.flatMap(row => storedPractice(row)?.practice ?? []);
}
/** The student's progress on the built-in samples, keyed by sample id. */
export async function listSampleStates(userId: string): Promise<Record<string, PracticeState>> {
  const rows = await getDb().readingSampleState.findMany({ where: { userId }, select: { sampleId: true, state: true } });
  const states: Record<string, PracticeState> = {};
  for (const row of rows) if (findReadingSample(row.sampleId)) states[row.sampleId] = readState(row.state);
  return states;
}
/** The page's first read for a signed-in student. */
export async function readingLibrary(userId: string) {
  const [practices, samples] = await Promise.all([listReadingPractices(userId), listSampleStates(userId)]);
  return { practices, samples };
}

type Source = { kind: "text"; text: string } | Awaited<ReturnType<typeof readUploadedSource>>;

/** The upload form: pasted `text`, or one document or up to four page photos in `file`, plus the explanation `language`. */
async function readSource(request: Request): Promise<{ source: Source; language: ReadingLanguage }> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data")) throw new ApiError(415, "Файл эсвэл текст бүхий хүсэлт шаардлагатай.");
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) throw new ApiError(411, "Хүсэлтийн хэмжээ тодорхойгүй байна.");
  if (declared > MAX_BODY) throw new ApiError(413, `Файл хэт том байна. ${READING_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);
  let form: FormData;
  try { form = await request.formData(); }
  catch { throw new ApiError(400, "Хүсэлтийг уншиж чадсангүй. Дахин оролдоно уу."); }
  for (const key of form.keys()) if (!["file", "text", "language", "store"].includes(key)) throw new ApiError(400, BAD_SHAPE);
  // A page loaded before practices moved to the account would keep the reply in its browser and lose the
  // practice; it does not send `store`, and is told to reload before any credits are held.
  if (form.get("store") !== "account") throw new ApiError(409, RELOAD);
  const language = form.get("language") ?? "mn";
  if (!isReadingLanguage(language)) throw new ApiError(400, "Тайлбарын хэл буруу байна.");
  const texts = form.getAll("text");
  if (texts.length) {
    if (texts.length > 1 || form.getAll("file").length || typeof texts[0] !== "string") throw new ApiError(400, "Файл эсвэл текстийн аль нэгийг илгээнэ үү.");
    const text = texts[0].trim();
    if (text.length > READING_LIMITS.textChars) throw new ApiError(413, `Текст хэт урт байна. ${READING_LIMITS.textChars.toLocaleString("en-US")} тэмдэгт хүртэл оруулна уу.`);
    if (text.length < READING_LIMITS.minSourceChars) throw new ApiError(422, `Текст хэт богино байна. Дор хаяж ${READING_LIMITS.minSourceChars.toLocaleString("en-US")} тэмдэгт (ойролцоогоор 170 үг) оруулна уу.`);
    return { source: { kind: "text", text }, language };
  }
  // One document, or up to four page photos; their size and real kind are proven before credits are held.
  return { source: await readUploadedSource(form, "Унших дасгал үүсгэх файл, зураг эсвэл текстээ оруулна уу."), language };
}

/**
 * One upload or pasted text in, one practice saved on the account out. The material is never stored; the key
 * stays on the server and only the answer-free questions are returned.
 */
export async function createReadingPractice(userId: string, request: Request) {
  ensureEnabled();
  const { source, language } = await readSource(request);
  await ensureNoTimedExam(userId);
  const db = getDb();
  // Practices are counted on the account, whatever a browser holds. A full library is refused before any credits are held.
  const saved = await db.readingPractice.count({ where: { userId } });
  if (saved >= READING_LIMITS.practices) throw new ApiError(409, PRACTICES_FULL);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI дасгал үүсгэгч одоогоор холбогдоогүй байна.");

  const now = Date.now(), limitKey = `education-reading-lab:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  // Priced by length: hold the most this material can cost (pasted text and photos are measured now; a document's
  // text is only known after extraction, so it holds the full-file price), then settle to what was read and written.
  const hold = source.kind === "text" ? readingPracticeHold(source.text.length) : source.kind === "images" ? readingPracticeHold(0, source.images.length) : readingPracticeHold(READING_LIMITS.textChars);
  // Credits are held first and refunded on any failure, including material with too little text.
  return chargeCredits(userId, ACTION, async meter => {
    await db.rateLimit.upsert({ where: { key: limitKey }, create: { id: randomUUID(), key: limitKey, count: 0, lastRequest: BigInt(0) }, update: {} });
    // Database CAS enforces a daily budget and one request in flight across every server instance.
    const reserved = await db.rateLimit.updateMany({
      where: { key: limitKey, count: { lt: READING_LIMITS.daily }, lastRequest: { lte: BigInt(now) } },
      data: { count: { increment: 1 }, lastRequest: lease },
    });
    if (!reserved.count) throw new ApiError(429, `Дасгал үүсгэж байна эсвэл өдрийн ${READING_LIMITS.daily} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);

    try {
      let messages: ReturnType<typeof readingMessages>;
      let info: ReadingReply["source"];
      if (source.kind === "images") {
        messages = readingMessages({ images: source.images, language, truncated: false });
        info = { name: source.name, kind: "image", pages: source.images.length, truncated: false, chars: 0 };
      } else {
        const extracted = source.kind === "text" ? { kind: "text", text: source.text, pages: undefined } : await extractDocument(source.name, source.bytes);
        const cleaned = cleanSourceText(extracted.text);
        if (cleaned.text.length < READING_LIMITS.minSourceChars) throw new ApiError(422, "Унших дасгал хийх хангалттай текст олдсонгүй. Илүү урт материал оруулна уу.");
        messages = readingMessages({ text: cleaned.text, language, truncated: cleaned.truncated });
        info = { name: source.kind === "text" ? PASTED : source.name, kind: source.kind === "text" ? "pasted" : extracted.kind, pages: extracted.pages ?? null, truncated: cleaned.truncated, chars: cleaned.text.length };
      }
      const fallback = source.kind === "document" ? fallbackTitle(source.name, "Reading practice") : "Reading practice";
      const started = Date.now();
      let practice: ReturnType<typeof parseGeneratedReading> = null;
      // One silent retry for a malformed or thin reply, only while the function still has time for it.
      for (let attempt = 0; attempt < 2 && !practice; attempt++) {
        if (attempt && Date.now() - started > RETRY_BEFORE_MS) break;
        practice = parseGeneratedReading(await deepseekReading(messages, meter), { fallbackTitle: fallback });
      }
      if (!practice) throw new ApiError(503, source.kind === "images" ? "Зурагнаас унших дасгал хийх хангалттай текст уншиж чадсангүй. Илүү тод, бүрэн хуудасны зураг оруулна уу." : "AI унших дасгал үүсгэж чадсангүй. Дахин оролдоно уу.");
      // Another tab may start a timed exam while the provider is answering.
      await ensureNoTimedExam(userId);
      // A practice moved from another tab's browser may have taken the last place meanwhile; the hold is then refunded.
      if (await db.readingPractice.count({ where: { userId } }) >= READING_LIMITS.practices) throw new ApiError(409, PRACTICES_FULL);
      // Saved with its key on the account. A failure here refunds the credits like any other.
      const row = await db.readingPractice.create({
        data: {
          userId, title: practice.title.slice(0, 200), language, sourceName: info.name.slice(0, 200) || "Материал", sourceKind: info.kind.slice(0, 20),
          paragraphs: asJson(practice.paragraphs), questions: asJson(practice.groups), state: asJson(blankState()),
        },
        select: PRACTICE_SELECT,
      });
      const reply: ReadingReply = { practice: shown(row), source: info, provider: "DeepSeek" };
      return reply;
    } finally {
      // Only release the lease this request holds; never shorten another request's lease.
      await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
    }
  }, {
    hold,
    // A retry after malformed output is not charged twice: the price follows the practice delivered.
    settle: reply => readingPracticeCredits(reply.source.chars, passageWords(reply.practice.paragraphs), allQuestions(reply.practice.groups).length, reply.source.kind === "image" ? reply.source.pages ?? 0 : 0),
  });
}

/**
 * Apply one progress request to the student's own practice. The row's last change is the version: a request that
 * built on an older state is applied again to the newer one, and refused (409) when it no longer fits.
 */
async function changePractice(userId: string, id: string, input: ProgressRequest): Promise<ProgressReply> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { row, groups, practice } = await ownPractice(userId, id);
    if (input.action !== "retry" && !answersFit(groups, practice.paragraphs.length, input.answers)) throw new ApiError(400, "Хариулт энэ дасгалд хамаарахгүй байна.");
    // Marking uses the key stored on the account, never anything the browser sends.
    const outcome = applyProgress(practice.state, input, groups);
    if ("stale" in outcome) throw new ApiError(409, STALE);
    if (!outcome.changed) return { state: outcome.state, updatedAt: practice.updatedAt };
    try {
      const saved = await getDb().readingPractice.update({
        where: { id: row.id, userId, updatedAt: row.updatedAt }, data: { state: asJson(outcome.state) }, select: { updatedAt: true },
      });
      return { state: outcome.state, updatedAt: saved.updatedAt.getTime() };
    } catch (error) {
      // Changed (or deleted) since it was read: read it again.
      if (!missing(error)) throw error;
    }
  }
  throw new ApiError(409, STALE);
}

/** Save answers and the timer, or clear a checked practice for another attempt. */
export async function updateReadingPractice(userId: string, id: string, body: unknown): Promise<ProgressReply> {
  ensureEnabled();
  const input = readProgressRequest(body);
  // Marking goes through the grade route.
  if (!input || input.action === "check") throw new ApiError(400, BAD_SHAPE);
  return changePractice(userId, id, input);
}

/** Mark the signed-in student's own practice from the key stored on the account, and keep the result there. No AI, no credits. */
export async function gradeReadingPractice(userId: string, body: unknown): Promise<ProgressReply> {
  ensureEnabled();
  // A page loaded before the move still sends the sealed token instead of the practice id.
  if (record(body) && "token" in body) throw new ApiError(409, RELOAD);
  const input = readGradeRequest(body);
  if (!input) throw new ApiError(400, BAD_SHAPE);
  return changePractice(userId, input.id, input.request);
}

/** Delete only the student's own practice, with its progress. */
export async function deleteReadingPractice(userId: string, id: string) {
  ensureEnabled();
  if (!isPracticeId(id)) throw new ApiError(400, "Дасгалын түлхүүр буруу байна.");
  const result = await getDb().readingPractice.deleteMany({ where: { id, userId } });
  if (!result.count) throw new ApiError(404, NOT_FOUND);
  return { ok: true };
}

/**
 * Progress on a built-in sample. Samples use no AI and stay open during a timed mock; a check is marked here with
 * the same rules and built-in key the browser uses for guests, so the stored score is never a browser claim.
 */
export async function updateSampleProgress(userId: string, sampleId: string, body: unknown): Promise<ProgressReply> {
  ensureEnabled();
  const sample = isSampleId(sampleId) ? findReadingSample(sampleId) : null;
  if (!sample) throw new ApiError(404, "Энэ жишээ дасгал олдсонгүй.");
  const input = readProgressRequest(body);
  if (!input) throw new ApiError(400, BAD_SHAPE);
  if (input.action !== "retry" && !answersFit(sample.groups, sample.paragraphs.length, input.answers)) throw new ApiError(400, "Хариулт энэ дасгалд хамаарахгүй байна.");
  const db = getDb();
  const where = { userId_sampleId: { userId, sampleId: sample.id } };
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await db.readingSampleState.findUnique({ where, select: { state: true, updatedAt: true } });
    const outcome = applyProgress(row ? readState(row.state) : blankState(), input, sample.groups);
    if ("stale" in outcome) throw new ApiError(409, STALE);
    if (!outcome.changed) return { state: outcome.state, updatedAt: row?.updatedAt.getTime() ?? Date.now() };
    try {
      const saved = row
        ? await db.readingSampleState.update({ where: { ...where, updatedAt: row.updatedAt }, data: { state: asJson(outcome.state) }, select: { updatedAt: true } })
        : await db.readingSampleState.create({ data: { userId, sampleId: sample.id, state: asJson(outcome.state) }, select: { updatedAt: true } });
      return { state: outcome.state, updatedAt: saved.updatedAt.getTime() };
    } catch (error) {
      // Another tab changed or created the row since it was read: read it again.
      if (!missing(error) && !duplicate(error)) throw error;
    }
  }
  throw new ApiError(409, STALE);
}

type PracticeImport = { practice: SavedPractice; imported: boolean } | { practice: null; refused: "invalid" | "owner" };

/**
 * Move what a browser kept before 2026-11-12 to the account: one practice per request, or every sample state at
 * once. For a practice only the sealed token is believed: the title, the key, the paragraph count and the source
 * come out of it, the passage text from the browser is checked against it, any checked answers are marked again
 * from the key (a score the browser claims is ignored), and one token never makes two practices. A token that
 * cannot be opened is reported, not thrown, so the page can tell it from a busy server.
 */
export async function importReading(userId: string, body: unknown): Promise<PracticeImport | { samples: Record<string, PracticeState> }> {
  ensureEnabled();
  const input = readImportRequest(body);
  if (!input) throw new ApiError(400, BAD_SHAPE);
  const db = getDb();
  if (input.kind === "samples") {
    const rows = Object.entries(input.samples).flatMap(([sampleId, value]) => {
      const sample = findReadingSample(sampleId);
      const state = sample ? importedState(value, sample.groups, sample.paragraphs.length) : null;
      return sample && state && !isBlank(state) ? [{ userId, sampleId: sample.id, state: asJson(state) }] : [];
    });
    // Progress the account already has on a sample is kept; the browser's copy only fills the gaps.
    if (rows.length) await db.readingSampleState.createMany({ data: rows, skipDuplicates: true });
    return { samples: await listSampleStates(userId) };
  }

  let sealed;
  try { sealed = openReading(input.token, userId, Date.now(), { allowExpired: true }); }
  catch (error) {
    if (!(error instanceof ReadingTokenError)) throw error;
    if (error.code === "config") throw new ApiError(503, "Хариулт хамгаалах түлхүүр тохируулаагүй байна.");
    return { practice: null, refused: error.code === "owner" ? "owner" : "invalid" };
  }
  const paragraphs = importedParagraphs(input.paragraphs, sealed.paragraphs, sealed.groups);
  if (!paragraphs) return { practice: null, refused: "invalid" };
  const importKey = readingImportKey(input.token);
  const known = () => db.readingPractice.findUnique({ where: { userId_importKey: { userId, importKey } }, select: PRACTICE_SELECT });
  const existing = await known();
  if (existing) return { practice: shown(existing), imported: false };
  if (await db.readingPractice.count({ where: { userId } }) >= READING_LIMITS.practices) {
    throw new ApiError(409, `Бүртгэлд хамгийн ихдээ ${READING_LIMITS.practices} дасгал хадгална. Нэг дасгалаа устгасны дараа үлдсэн нь шилжинэ.`);
  }
  const now = Date.now();
  const created = new Date(sealed.createdAt > 0 && sealed.createdAt <= now ? sealed.createdAt : now);
  try {
    const row = await db.readingPractice.create({
      data: {
        userId, importKey, title: sealed.title, language: sealed.language, sourceName: sealed.sourceName, sourceKind: sealed.sourceKind,
        paragraphs: asJson(paragraphs), questions: asJson(sealed.groups), state: asJson(importedState(input.state, sealed.groups, paragraphs.length)),
        // Ordered among the student's practices by when it was made, not by when it moved.
        createdAt: created, updatedAt: created,
      },
      select: PRACTICE_SELECT,
    });
    return { practice: shown(row), imported: true };
  } catch (error) {
    // Two tabs moved the same practice at once: the first one's row is the practice.
    const twin = duplicate(error) ? await known() : null;
    if (twin) return { practice: shown(twin), imported: false };
    throw error;
  }
}

/** DeepSeek JSON mode, with this action's output budget from the price list. */
async function deepseekReading(messages: ReturnType<typeof readingMessages>, meter: UsageMeter) {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503, "AI дасгал үүсгэгч одоогоор холбогдоогүй байна.");
  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
        messages,
        thinking: { type: "disabled" },
        max_tokens: AI_ACTIONS[ACTION].outputTokens,
        temperature: 0.4,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(110_000),
    });
  } catch {
    throw new ApiError(503, "AI дасгал үүсгэгчтэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
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
