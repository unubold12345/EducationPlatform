import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import {
  cleanSourceText, displayFileName, fallbackTitle, FLASHCARD_LIMITS, flashcardMessages, isCardCount, isCardLanguage,
  parseGeneratedDeck, type CardCount, type CardLanguage, type GeneratedCard, type GeneratedDeck,
} from "./contracts";
import { detectSource, extractDocument } from "./extract";
import type { SourceKind } from "./extract";

const LEASE_MS = 240_000;
const DAILY_LIMIT = FLASHCARD_LIMITS.daily;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = FLASHCARD_LIMITS.fileBytes + BODY_SLACK;

type Upload = { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
type DeckReply = {
  title: string;
  cards: GeneratedCard[];
  source: { name: string; kind: SourceKind; pages: number | null; truncated: boolean };
  language: CardLanguage;
  provider: "DeepSeek";
};

const isUpload = (value: unknown): value is Upload => Boolean(value) && typeof value === "object"
  && typeof (value as Upload).name === "string" && typeof (value as Upload).size === "number"
  && typeof (value as Upload).arrayBuffer === "function";

async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа флашкарт үүсгэнэ үү.");
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : null;
};

/** One upload in, one ready-to-study deck out. Nothing is stored on the server. */
export async function createFlashcardDeck(userId: string, request: Request): Promise<DeckReply> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data")) throw new ApiError(415, "Файлтай хүсэлт шаардлагатай.");
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) throw new ApiError(411, "Файлын хэмжээ тодорхойгүй байна.");
  if (declared > MAX_BODY) throw new ApiError(413, `Файл хэт том байна. ${FLASHCARD_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);

  let form: FormData;
  try { form = await request.formData(); }
  catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  for (const key of form.keys()) if (!["file", "count", "language"].includes(key)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const file = form.get("file");
  if (!isUpload(file) || !file.size) throw new ApiError(400, "Үүсгэх файлаа сонгоно уу.");
  if (file.size > FLASHCARD_LIMITS.fileBytes) throw new ApiError(413, `Файл хэт том байна. ${FLASHCARD_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);
  const countValue = Number(field(form, "count") ?? "20");
  const languageValue = field(form, "language") ?? "mn";
  if (!isCardCount(countValue)) throw new ApiError(400, "Картын тоо 10, 20 эсвэл 30 байна.");
  if (!isCardLanguage(languageValue)) throw new ApiError(400, "Картын хэл буруу байна.");
  const count: CardCount = countValue;
  const language: CardLanguage = languageValue;
  const name = displayFileName(file.name);
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await file.arrayBuffer()); }
  catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  // Reject the wrong kind before the daily card budget is charged.
  detectSource(name, bytes);

  await ensureNoTimedExam(userId);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI флашкарт үүсгэгч одоогоор холбогдоогүй байна.");

  const db = getDb(), now = Date.now(), limitKey = `education-flashcards:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  await db.rateLimit.upsert({ where: { key: limitKey }, create: { id: randomUUID(), key: limitKey, count: 0, lastRequest: BigInt(0) }, update: {} });
  // Database CAS enforces a daily budget and one request in flight across every server instance.
  const reserved = await db.rateLimit.updateMany({
    where: { key: limitKey, count: { lt: DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } },
    data: { count: { increment: 1 }, lastRequest: lease },
  });
  if (!reserved.count) throw new ApiError(429, `Карт үүсгэж байна эсвэл өдрийн ${DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);

  try {
    const extracted = await extractDocument(name, bytes);
    const cleaned = cleanSourceText(extracted.text);
    if (cleaned.text.length < 40) throw new ApiError(422, "Файлаас хангалттай текст олдсонгүй. Илүү бүрэн файл оруулна уу.");

    const messages = flashcardMessages({ text: cleaned.text, count, language, truncated: cleaned.truncated });
    let deck: GeneratedDeck | null = null;
    // One silent retry when the model returns a malformed object; the daily count is charged once.
    for (let attempt = 0; attempt < 2 && !deck; attempt++) deck = parseGeneratedDeck(await deepseekCards(messages, count), { count, fallbackTitle: fallbackTitle(name) });
    if (!deck) throw new ApiError(503, "AI карт үүсгэж чадсангүй. Дахин оролдоно уу.");
    // Another tab may start a timed exam while the provider is answering.
    await ensureNoTimedExam(userId);
    return {
      ...deck,
      source: { name, kind: extracted.kind, pages: extracted.pages ?? null, truncated: cleaned.truncated },
      language,
      provider: "DeepSeek",
    };
  } finally {
    // Only release the lease this request holds; never shorten another request's lease.
    await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
  }
}

/** DeepSeek JSON mode, mirroring the Essay Studio provider rules but with a card-sized budget. */
async function deepseekCards(messages: ReturnType<typeof flashcardMessages>, count: CardCount) {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503, "AI флашкарт үүсгэгч одоогоор холбогдоогүй байна.");
  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
        messages,
        thinking: { type: "disabled" },
        // 30 cards need more room; 10 cards should not reserve the whole output budget.
        max_tokens: Math.min(8000, 1200 + count * 240),
        temperature: 0.3,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(95_000),
    });
  } catch {
    throw new ApiError(503, "AI флашкарт үүсгэгчтэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
  }
  // Never echo provider error bodies: they can contain request or credential details.
  if (!response.ok) throw new ApiError(503, response.status === 429 ? "AI ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу." : "AI холболт түр ажиллахгүй байна. Дахин оролдоно уу.");
  try {
    const data = await response.json() as { choices?: { finish_reason?: string; message?: { content?: unknown } }[] };
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (choice?.finish_reason !== "stop" || typeof content !== "string" || !content.trim() || content.length > 30_000) throw new Error("Invalid completion");
    return content;
  } catch {
    throw new ApiError(503, "AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
  }
}
