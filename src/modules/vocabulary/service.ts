import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, vocabularyImportCredits, vocabularyImportHold, type UsageMeter } from "@/modules/credits/pricing";
import { ApiError } from "@/lib/api";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import { cleanSourceText, displayFileName } from "@/modules/documents/text";
import { detectSource, extractDocument } from "@/modules/documents/extract";
import {
  bankFullMessage, cleanUserRequest, isImportLanguage, parseGeneratedWords, readImportCount, readWordFields, termKey,
  vocabularyCapacity, vocabularyMessages,
  VOCABULARY_LIMITS, type ChatMessage, type GeneratedWord, type ImportLanguage, type VocabularyWord,
} from "./contracts";

const LEASE_MS = 240_000;
const DAILY_LIMIT = VOCABULARY_LIMITS.dailyImports;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = VOCABULARY_LIMITS.fileBytes + BODY_SLACK;
const MIN_TEXT = 40;

type Upload = { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
type WordRow = {
  id: string; term: string; translation: string; example: string | null;
  sourceName: string | null; createdAt: Date;
};
export type ImportReply = {
  words: VocabularyWord[];
  added: number;
  duplicates: number;
  skipped: number;
  total: number;
  /** The student's bank size and the word count this import was allowed. */
  limit: number;
  requested: number;
  source: { name: string; kind: string; pages: number | null; truncated: boolean };
  language: ImportLanguage;
  provider: "DeepSeek";
};

const isUpload = (value: unknown): value is Upload => Boolean(value) && typeof value === "object"
  && typeof (value as Upload).name === "string" && typeof (value as Upload).size === "number"
  && typeof (value as Upload).arrayBuffer === "function";

const publicWord = (row: WordRow): VocabularyWord => ({
  id: row.id,
  term: row.term,
  translation: row.translation,
  example: row.example,
  sourceName: row.sourceName,
  createdAt: row.createdAt.toISOString(),
});

const WORD_SELECT = { id: true, term: true, translation: true, example: true, sourceName: true, createdAt: true } as const;

async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа үг нэмнэ үү.");
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : null;
};

const wordId = (value: string) => /^[a-z0-9]{10,64}$/i.test(value);

/** The student's bank size from their active plans (free bank without one). */
export async function vocabularyLimit(userId: string, now = new Date()) {
  const rows = await getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } });
  return vocabularyCapacity(rows.map(row => row.program));
}

/** The signed-in student's own bank, newest first. Words above a lapsed plan's size are still listed. */
export async function listVocabulary(userId: string): Promise<VocabularyWord[]> {
  const rows = await getDb().vocabularyWord.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: VOCABULARY_LIMITS.maxWords, select: WORD_SELECT,
  });
  return rows.map(publicWord);
}

/** The page's first read: the words and the bank size. */
export async function vocabularyBank(userId: string) {
  const [words, limit] = await Promise.all([listVocabulary(userId), vocabularyLimit(userId)]);
  return { words, limit };
}

/** Save one manually entered word. Duplicates are refused with a readable message. */
export async function addVocabularyWord(userId: string, body: unknown) {
  const input = readWordFields(body);
  if (!input) throw new ApiError(400, "Үг, орчуулгаа бөглөнө үү. Үг 160, орчуулга 500 тэмдэгт хүртэл байна.");
  const db = getDb();
  const [total, limit] = await Promise.all([db.vocabularyWord.count({ where: { userId } }), vocabularyLimit(userId)]);
  if (total >= limit) throw new ApiError(409, bankFullMessage(limit));
  const key = termKey(input.term);
  const exists = await db.vocabularyWord.findUnique({ where: { userId_termKey: { userId, termKey: key } }, select: { id: true } });
  if (exists) throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
  try {
    const row = await db.vocabularyWord.create({
      data: { userId, term: input.term, translation: input.translation, example: input.example, termKey: key, sourceName: null },
      select: WORD_SELECT,
    });
    return { word: publicWord(row), total: total + 1, limit };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
    throw error;
  }
}

/** Edit an owned word. Another student's id is a 404, never a write. */
export async function updateVocabularyWord(userId: string, id: string, body: unknown) {
  if (!wordId(id)) throw new ApiError(400, "Үгийн түлхүүр буруу байна.");
  const input = readWordFields(body);
  if (!input) throw new ApiError(400, "Үг, орчуулгаа бөглөнө үү. Үг 160, орчуулга 500 тэмдэгт хүртэл байна.");
  const db = getDb();
  const existing = await db.vocabularyWord.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new ApiError(404, "Энэ үг олдсонгүй.");
  const key = termKey(input.term);
  const clash = await db.vocabularyWord.findFirst({ where: { userId, termKey: key, id: { not: id } }, select: { id: true } });
  if (clash) throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
  try {
    const updated = await db.vocabularyWord.updateMany({
      where: { id, userId }, data: { term: input.term, translation: input.translation, example: input.example, termKey: key },
    });
    if (!updated.count) throw new ApiError(404, "Энэ үг олдсонгүй.");
    const row = await db.vocabularyWord.findFirst({ where: { id, userId }, select: WORD_SELECT });
    if (!row) throw new ApiError(404, "Энэ үг олдсонгүй.");
    return { word: publicWord(row) };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
    throw error;
  }
}

/** Delete only the student's own word. */
export async function deleteVocabularyWord(userId: string, id: string) {
  if (!wordId(id)) throw new ApiError(400, "Үгийн түлхүүр буруу байна.");
  const result = await getDb().vocabularyWord.deleteMany({ where: { id, userId } });
  if (!result.count) throw new ApiError(404, "Энэ үг олдсонгүй.");
  return { ok: true };
}

/**
 * One upload in, saved vocabulary out. The file is read on the server, only its text goes to the
 * provider, and the extracted pairs are stored in the student's bank. The student picks how many words
 * (at most the room left in the bank); the price is the text read plus each new word saved.
 */
export async function importVocabulary(userId: string, request: Request): Promise<ImportReply> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data")) throw new ApiError(415, "Файлтай хүсэлт шаардлагатай.");
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) throw new ApiError(411, "Файлын хэмжээ тодорхойгүй байна.");
  if (declared > MAX_BODY) throw new ApiError(413, `Файл хэт том байна. ${VOCABULARY_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);

  let form: FormData;
  try { form = await request.formData(); }
  catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  for (const key of form.keys()) if (!["file", "language", "prompt", "count"].includes(key)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const file = form.get("file");
  if (!isUpload(file) || !file.size) throw new ApiError(400, "Үг оруулах файлаа сонгоно уу.");
  if (file.size > VOCABULARY_LIMITS.fileBytes) throw new ApiError(413, `Файл хэт том байна. ${VOCABULARY_LIMITS.fileBytes / 1024 / 1024} MB хүртэл файл оруулна уу.`);
  const languageValue = field(form, "language") ?? "mn";
  if (!isImportLanguage(languageValue)) throw new ApiError(400, "Орчуулгын хэл буруу байна.");
  const rawRequest = field(form, "prompt") ?? "";
  if (rawRequest.length > VOCABULARY_LIMITS.prompt) throw new ApiError(400, `Заавар ${VOCABULARY_LIMITS.prompt} тэмдэгтээс ихгүй байна.`);
  const selectionRequest = cleanUserRequest(rawRequest);
  const requested = readImportCount(field(form, "count"));
  if (requested === null) throw new ApiError(400, `Үгийн тоо 1–${VOCABULARY_LIMITS.importWords} байна.`);
  const language: ImportLanguage = languageValue;
  const name = displayFileName(file.name);
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await file.arrayBuffer()); }
  catch { throw new ApiError(400, "Файлыг уншиж чадсангүй. Дахин оролдоно уу."); }
  // Reject the wrong kind before the daily AI budget is charged.
  detectSource(name, bytes);

  await ensureNoTimedExam(userId);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI үг оруулагч одоогоор холбогдоогүй байна.");

  const db = getDb(), now = Date.now(), limitKey = `education-vocabulary:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  // A full bank is refused before any credits are held; otherwise ask only for the room that is left.
  const [limit, stored] = await Promise.all([vocabularyLimit(userId), db.vocabularyWord.count({ where: { userId } })]);
  if (stored >= limit) throw new ApiError(409, bankFullMessage(limit));
  const wanted = Math.min(requested, limit - stored);
  // The price depends on the text actually read; until extraction, assume the longest document.
  let readChars: number = VOCABULARY_LIMITS.textChars;
  // The most this import can cost is held first and refunded on any failure, including a file with no
  // usable words; on success the charge drops to the text read plus the new words saved.
  return chargeCredits(userId, "vocabulary-import", async meter => {
  await db.rateLimit.upsert({ where: { key: limitKey }, create: { id: randomUUID(), key: limitKey, count: 0, lastRequest: BigInt(0) }, update: {} });
  // Database CAS enforces a daily budget and one request in flight across every server instance.
  const reserved = await db.rateLimit.updateMany({
    where: { key: limitKey, count: { lt: DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } },
    data: { count: { increment: 1 }, lastRequest: lease },
  });
  if (!reserved.count) throw new ApiError(429, `Үг оруулж байна эсвэл өдрийн ${DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);

  try {
    const extracted = await extractDocument(name, bytes);
    const cleaned = cleanSourceText(extracted.text);
    if (cleaned.text.length < MIN_TEXT) throw new ApiError(422, "Файлаас үг оруулах хангалттай текст олдсонгүй. Илүү бүрэн файл оруулна уу.");
    readChars = cleaned.text.length;

    const messages = vocabularyMessages({ text: cleaned.text, language, truncated: cleaned.truncated, request: selectionRequest, limit: wanted });
    let generated: GeneratedWord[] | null = null;
    // One silent retry when the model returns a malformed object; the daily count is charged once.
    for (let attempt = 0; attempt < 2 && !generated; attempt++) generated = parseGeneratedWords(await deepseekWords(messages, meter), wanted);
    if (!generated) throw new ApiError(503, "AI үг олж чадсангүй. Дахин оролдоно уу.");
    // Another tab may start a timed exam while the provider is answering.
    await ensureNoTimedExam(userId);

    // Another tab may have added words meanwhile; the bank size is re-checked before saving.
    const total = await db.vocabularyWord.count({ where: { userId } });
    if (total >= limit) throw new ApiError(409, bankFullMessage(limit));
    const keys = generated.map(word => termKey(word.term));
    const existing = await db.vocabularyWord.findMany({ where: { userId, termKey: { in: keys } }, select: { termKey: true } });
    const known = new Set(existing.map(row => row.termKey));
    const fresh = generated.filter(word => !known.has(termKey(word.term)));
    const duplicates = generated.length - fresh.length;
    const room = Math.min(limit - total, wanted);
    const chosen = fresh.slice(0, room);
    const skipped = fresh.length - chosen.length;
    if (!chosen.length) {
      throw new ApiError(409, duplicates ? "Энэ файлын үгс аль хэдийн хадгалагдсан байна." : bankFullMessage(limit));
    }
    await db.vocabularyWord.createMany({
      data: chosen.map(word => ({
        userId, term: word.term, translation: word.translation, example: word.example ?? null,
        termKey: termKey(word.term), sourceName: name,
      })),
      skipDuplicates: true,
    });
    const rows = await db.vocabularyWord.findMany({
      where: { userId, termKey: { in: chosen.map(word => termKey(word.term)) } },
      orderBy: { createdAt: "desc" }, select: WORD_SELECT,
    });
    return {
      words: rows.map(publicWord),
      added: rows.length,
      duplicates,
      skipped,
      total: total + rows.length,
      limit,
      requested: wanted,
      source: { name, kind: extracted.kind, pages: extracted.pages ?? null, truncated: cleaned.truncated },
      language,
      provider: "DeepSeek",
    };
  } finally {
    // Only release the lease this request holds; never shorten another request's lease.
    await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
  }
  }, { hold: vocabularyImportHold(wanted), settle: reply => vocabularyImportCredits(readChars, reply.added) });
}

/** DeepSeek JSON mode with a bounded vocabulary-list reply. */
async function deepseekWords(messages: ChatMessage[], meter: UsageMeter) {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503, "AI үг оруулагч одоогоор холбогдоогүй байна.");
  let response: Response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
        messages,
        thinking: { type: "disabled" },
        max_tokens: AI_ACTIONS["vocabulary-import"].outputTokens,
        temperature: 0.2,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new ApiError(503, "AI үг оруулагчтай холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
  }
  // Never echo provider error bodies: they can contain request or credential details.
  if (!response.ok) throw new ApiError(503, response.status === 429 ? "AI ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу." : "AI холболт түр ажиллахгүй байна. Дахин оролдоно уу.");
  try {
    const data = await response.json() as { choices?: { finish_reason?: string; message?: { content?: unknown } }[]; usage?: unknown };
    meter.add(data.usage);
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (choice?.finish_reason !== "stop" || typeof content !== "string" || !content.trim() || content.length > 120_000) throw new Error("Invalid completion");
    return content;
  } catch {
    throw new ApiError(503, "AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу.");
  }
}
