import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { readingLabEnabled } from "@/lib/local-pilot";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, readingPracticeCredits, readingPracticeHold, type UsageMeter } from "@/modules/credits/pricing";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import { cleanSourceText, fallbackTitle } from "@/modules/documents/text";
import { extractDocument } from "@/modules/documents/extract";
import { readUploadedSource } from "@/modules/documents/upload";
import {
  READING_LIMITS, allQuestions, choiceCount, gradeReading, isReadingLanguage, parseGeneratedReading, passageWords, publicGroups, readingMessages, validAnswerFor,
  type FullGroup, type PublicGroup, type ReadingAnswers, type ReadingGrade, type ReadingLanguage,
} from "./contracts";
import { ReadingTokenError, openReading, sealReading } from "./token";

const ACTION = "reading-practice" as const;
const LEASE_MS = 300_000;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = READING_LIMITS.fileBytes + BODY_SLACK;
/** A retry only starts while there is time left for it inside the function's limit. */
const RETRY_BEFORE_MS = 60_000;
const PASTED = "Буулгасан текст";

export type ReadingReply = {
  title: string;
  paragraphs: string[];
  groups: PublicGroup[];
  token: string;
  language: ReadingLanguage;
  minutes: number;
  /** `chars` is the material text DeepSeek read (0 for page photos); it prices the practice. */
  source: { name: string; kind: string; pages: number | null; truncated: boolean; chars: number };
  provider: "DeepSeek";
};

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function ensureEnabled() {
  if (!readingLabEnabled()) throw new ApiError(404, "Туршилтын хуудас идэвхгүй байна.");
}
async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа унших дасгал үүсгэнэ үү.");
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
  for (const key of form.keys()) if (!["file", "text", "language"].includes(key)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
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

/** One upload or pasted text in, one passage with sealed questions out. Nothing is stored on the server. */
export async function createReadingPractice(userId: string, request: Request) {
  ensureEnabled();
  const { source, language } = await readSource(request);
  await ensureNoTimedExam(userId);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI дасгал үүсгэгч одоогоор холбогдоогүй байна.");
  if (!process.env.BETTER_AUTH_SECRET?.trim()) throw new ApiError(503, "Хариулт хамгаалах түлхүүр тохируулаагүй байна.");

  const db = getDb(), now = Date.now(), limitKey = `education-reading-lab:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
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
      const token = sealReading(userId, {
        title: practice.title, language, paragraphs: practice.paragraphs.length, groups: practice.groups,
        sourceName: info.name, sourceKind: info.kind, createdAt: Date.now(),
      });
      const reply: ReadingReply = {
        title: practice.title, paragraphs: practice.paragraphs, groups: publicGroups(practice.groups), token, language,
        minutes: READING_LIMITS.minutes, source: info, provider: "DeepSeek",
      };
      return reply;
    } catch (error) {
      if (error instanceof ReadingTokenError) throw new ApiError(error.code === "config" ? 503 : 500, "Хариултыг хамгаалж чадсангүй. Дахин оролдоно уу.");
      throw error;
    } finally {
      // Only release the lease this request holds; never shorten another request's lease.
      await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
    }
  }, {
    hold,
    // A retry after malformed output is not charged twice: the price follows the practice delivered.
    settle: reply => readingPracticeCredits(reply.source.chars, passageWords(reply.paragraphs), allQuestions(reply.groups).length, reply.source.kind === "image" ? reply.source.pages ?? 0 : 0),
  });
}

/** Read the exact grade request shape; unknown fields are rejected before any decryption. */
function gradeInput(body: unknown): { token: string; answers: ReadingAnswers } {
  if (!record(body) || Object.keys(body).some(key => key !== "token" && key !== "answers")) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  if (typeof body.token !== "string" || body.token.length < 40 || body.token.length > READING_LIMITS.tokenChars) throw new ApiError(400, "Дасгалын мэдээлэл буруу байна.");
  if (!record(body.answers)) throw new ApiError(400, "Хариултууд буруу байна.");
  const entries = Object.entries(body.answers);
  if (entries.length > READING_LIMITS.questions.max) throw new ApiError(400, "Хариултын тоо хэт олон байна.");
  const answers: ReadingAnswers = {};
  for (const [id, value] of entries) {
    if (!/^q\d{1,2}$/.test(id)) throw new ApiError(400, "Хариултын түлхүүр буруу байна.");
    if (!(typeof value === "string" && value.length <= READING_LIMITS.answerChars) && !(typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 20)) throw new ApiError(400, "Хариултын утга буруу байна.");
    answers[id] = value;
  }
  return { token: body.token, answers };
}

function tokenFailure(error: ReadingTokenError): ApiError {
  if (error.code === "expired") return new ApiError(410, "Энэ дасгалын хариулт шалгах хугацаа дууссан. Материалаасаа шинэ дасгал үүсгэнэ үү.");
  if (error.code === "owner") return new ApiError(403, "Энэ дасгал өөр бүртгэлийнх байна.");
  if (error.code === "config") return new ApiError(503, "Хариулт хамгаалах түлхүүр тохируулаагүй байна.");
  return new ApiError(400, "Дасгалын мэдээлэл хүчингүй байна. Дахин үүсгэнэ үү.");
}

/** Open the sealed practice and mark only the signed-in student's own answers. No AI, no credits. */
export function gradeReadingPractice(userId: string, body: unknown): { title: string; gradedAt: number } & ReadingGrade {
  ensureEnabled();
  const input = gradeInput(body);
  let practice;
  try { practice = openReading(input.token, userId); }
  catch (error) {
    if (error instanceof ReadingTokenError) throw tokenFailure(error);
    throw error;
  }
  const groups: FullGroup[] = practice.groups;
  const questions = new Map(groups.flatMap(group => group.questions.map(question => [question.id, { group, question }] as const)));
  for (const [id, value] of Object.entries(input.answers)) {
    const found = questions.get(id);
    if (!found) throw new ApiError(400, "Хариулт энэ дасгалд хамаарахгүй байна.");
    if (!validAnswerFor(found.question, value, choiceCount(found.group, found.question as { kind: typeof found.question.kind; options?: string[] }, practice.paragraphs))) throw new ApiError(400, "Хариултын утга буруу байна.");
  }
  if (allQuestions(groups).length < 1) throw new ApiError(400, "Дасгалын мэдээлэл хүчингүй байна. Дахин үүсгэнэ үү.");
  return { title: practice.title, gradedAt: Date.now(), ...gradeReading(groups, input.answers) };
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
