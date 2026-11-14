import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, vocabularyImportCredits, vocabularyImportHold, type UsageMeter } from "@/modules/credits/pricing";
import { ApiError } from "@/lib/api";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { tutorDay } from "@/modules/tutor/contracts";
import { cleanSourceText } from "@/modules/documents/text";
import { extractDocument } from "@/modules/documents/extract";
import { readUploadedSource } from "@/modules/documents/upload";
import {
  bankFullMessage, cleanUserRequest, isDeckColor, isImportKind, isImportLanguage, isImportLevel, isVocabularyId, parseGeneratedWords,
  readBulkRequest, readDeckFields, readImportCount, readReview, readSpaceRequest, readWordFields, termKey, vocabularyCapacity, vocabularyMessages,
  MAX_EXTRA_WORDS, VOCABULARY_LIMITS, VOCABULARY_SPACE, type VocabularySpace, type ChatMessage, type GeneratedWord, type ImportKind, type ImportLanguage, type ImportLevel, type ImportReply,
  type StudyUpdate, type VocabularyDeck, type VocabularyWord, type WordFields,
} from "./contracts";
import { nextStudy, type StudyGrade } from "./study";

const LEASE_MS = 240_000;
const DAILY_LIMIT = VOCABULARY_LIMITS.dailyImports;
const BODY_SLACK = 256 * 1024;
const MAX_BODY = VOCABULARY_LIMITS.fileBytes + BODY_SLACK;
const MIN_TEXT = 40;
/** A bulk request carries at most one reviewed import (120 words at their full lengths) or 500 ids. */
export const BULK_BODY_BYTES = 384 * 1024;
export const REVIEW_BODY_BYTES = 16 * 1024;

type WordRow = {
  id: string; term: string; translation: string; example: string | null; sourceName: string | null; createdAt: Date;
  deckId: string | null; starred: boolean; box: number; correct: number; wrong: number; reviewedAt: Date | null; dueAt: Date | null;
};
type DeckRow = { id: string; name: string; color: string; createdAt: Date };

const publicWord = (row: WordRow): VocabularyWord => ({
  id: row.id,
  term: row.term,
  translation: row.translation,
  example: row.example,
  sourceName: row.sourceName,
  createdAt: row.createdAt.toISOString(),
  deckId: row.deckId,
  starred: row.starred,
  box: row.box,
  correct: row.correct,
  wrong: row.wrong,
  reviewedAt: row.reviewedAt?.toISOString() ?? null,
  dueAt: row.dueAt?.toISOString() ?? null,
});
const publicDeck = (row: DeckRow): VocabularyDeck => ({
  id: row.id, name: row.name, color: isDeckColor(row.color) ? row.color : "blue", createdAt: row.createdAt.toISOString(),
});

const WORD_SELECT = {
  id: true, term: true, translation: true, example: true, sourceName: true, createdAt: true,
  deckId: true, starred: true, box: true, correct: true, wrong: true, reviewedAt: true, dueAt: true,
} as const;
const DECK_SELECT = { id: true, name: true, color: true, createdAt: true } as const;
const duplicate = (error: unknown) => (error as { code?: string }).code === "P2002";

async function ensureNoTimedExam(userId: string) {
  if (await activeTimedSitting(userId)) throw new ApiError(403, "Хугацаатай шалгалт нээлттэй байна. Шалгалтаа дуусгасны дараа үг нэмнэ үү.");
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : null;
};

type SpaceReader = Pick<ReturnType<typeof getDb>, "vocabularyExpansion">;
/** Permanent space the student bought with yellow credits (the sum of their purchases). */
async function extraWords(userId: string, db: SpaceReader = getDb()) {
  return (await db.vocabularyExpansion.aggregate({ where: { userId }, _sum: { words: true } }))._sum.words ?? 0;
}
/** The student's bank size: their active plans' bank (free bank without one) plus the permanent space they bought. */
export async function vocabularyLimit(userId: string, now = new Date()) {
  const [rows, extra] = await Promise.all([
    getDb().subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } }),
    extraWords(userId),
  ]);
  return vocabularyCapacity(rows.map(row => row.program), extra);
}

/** The bank's size and its parts, the yellow credits left and how much more space can still be bought. */
export async function vocabularySpace(userId: string, now = new Date()): Promise<VocabularySpace> {
  const db = getDb();
  const [rows, extra, wallet] = await Promise.all([
    db.subscription.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, select: { program: true } }),
    extraWords(userId),
    db.creditWallet.findUnique({ where: { userId }, select: { purchased: true, used: true } }),
  ]);
  const programs = rows.map(row => row.program);
  return {
    limit: vocabularyCapacity(programs, extra), base: vocabularyCapacity(programs), extra,
    yellow: Math.max(0, (wallet?.purchased ?? 0) - (wallet?.used ?? 0)), room: Math.max(0, MAX_EXTRA_WORDS - extra),
  };
}

/**
 * Buys permanent vocabulary space with yellow (purchased) credits only: `packs` × 100 words for `packs` × 200 credits.
 * It runs under the same per-student wallet lock as AI charges, takes the credits with a compare-and-set, and records
 * the purchase by the page's `requestId`, so a repeated request buys once. Nothing is spent when it fails.
 */
export async function buyVocabularySpace(userId: string, body: unknown) {
  const input = readSpaceRequest(body);
  if (!input) throw new ApiError(400, `1–${VOCABULARY_SPACE.maxPacks} багц (${VOCABULARY_SPACE.words} үг тус бүр) сонгоно уу.`);
  const words = input.packs * VOCABULARY_SPACE.words, credits = input.packs * VOCABULARY_SPACE.credits;
  const db = getDb();
  // ON CONFLICT DO NOTHING: the wallet row is the lock, so it must exist first.
  await db.creditWallet.createMany({ data: [{ userId }], skipDuplicates: true });
  const bought = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "userId" FROM "CreditWallet" WHERE "userId" = ${userId} FOR UPDATE`;
    if (await tx.vocabularyExpansion.findUnique({ where: { userId_requestId: { userId, requestId: input.requestId } }, select: { id: true } })) return false;
    const extra = await extraWords(userId, tx);
    if (extra + words > MAX_EXTRA_WORDS) throw new ApiError(409, `Байнгын багтаамж хамгийн ихдээ ${MAX_EXTRA_WORDS.toLocaleString("en-US")} үг. Танд ${Math.max(0, MAX_EXTRA_WORDS - extra).toLocaleString("en-US")} үгийн зай нэмэх боломж үлдсэн.`);
    const taken = await tx.$executeRaw`UPDATE "CreditWallet" SET "used" = "used" + ${credits}, "updatedAt" = NOW() WHERE "userId" = ${userId} AND "used" + ${credits} <= "purchased"`;
    if (!taken) {
      const wallet = await tx.creditWallet.findUnique({ where: { userId }, select: { purchased: true, used: true } });
      const left = Math.max(0, (wallet?.purchased ?? 0) - (wallet?.used ?? 0));
      throw new ApiError(402, `Кредит хүрэлцэхгүй байна: ${credits.toLocaleString("en-US")} кредит хэрэгтэй, танд ${left.toLocaleString("en-US")} байна. Багцууд хуудаснаас кредит авна уу.`);
    }
    await tx.vocabularyExpansion.create({ data: { userId, requestId: input.requestId, words, credits } });
    return true;
  });
  return { ...await vocabularySpace(userId), added: bought ? words : 0, spent: bought ? credits : 0, repeated: !bought };
}

/** The signed-in student's own bank, newest first. Words above a lapsed plan's size are still listed. */
export async function listVocabulary(userId: string): Promise<VocabularyWord[]> {
  const rows = await getDb().vocabularyWord.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: VOCABULARY_LIMITS.maxWords, select: WORD_SELECT,
  });
  return rows.map(publicWord);
}

/** The student's own decks, oldest first, so the list keeps its order as decks are added. */
export async function listDecks(userId: string): Promise<VocabularyDeck[]> {
  const rows = await getDb().vocabularyDeck.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: VOCABULARY_LIMITS.decks, select: DECK_SELECT });
  return rows.map(publicDeck);
}

/** The page's first read: the words, their decks, the bank size (with its bought space) and the moment "due" is measured from. */
export async function vocabularyBank(userId: string) {
  const [words, decks, space] = await Promise.all([listVocabulary(userId), listDecks(userId), vocabularySpace(userId)]);
  return { words, decks, limit: space.limit, space, now: Date.now() };
}

/** A deck id from a request is only ever used when the deck belongs to this student. */
async function ownDeck(userId: string, deckId: string) {
  const deck = await getDb().vocabularyDeck.findFirst({ where: { id: deckId, userId }, select: DECK_SELECT });
  if (!deck) throw new ApiError(404, "Энэ багц олдсонгүй.");
  return deck;
}

/** Save one manually entered word. Duplicates are refused with a readable message. */
export async function addVocabularyWord(userId: string, body: unknown) {
  const input = readWordFields(body);
  if (!input) throw new ApiError(400, "Үг, орчуулгаа бөглөнө үү. Үг 160, орчуулга 500 тэмдэгт хүртэл байна.");
  const db = getDb();
  const [total, limit] = await Promise.all([db.vocabularyWord.count({ where: { userId } }), vocabularyLimit(userId)]);
  if (total >= limit) throw new ApiError(409, bankFullMessage(limit));
  if (input.deckId) await ownDeck(userId, input.deckId);
  const key = termKey(input.term);
  const exists = await db.vocabularyWord.findUnique({ where: { userId_termKey: { userId, termKey: key } }, select: { id: true } });
  if (exists) throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
  try {
    const row = await db.vocabularyWord.create({
      data: { userId, term: input.term, translation: input.translation, example: input.example, termKey: key, sourceName: null, deckId: input.deckId ?? null },
      select: WORD_SELECT,
    });
    return { word: publicWord(row), total: total + 1, limit };
  } catch (error) {
    if (duplicate(error)) throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
    throw error;
  }
}

/** Edit an owned word. Another student's id is a 404, never a write. */
export async function updateVocabularyWord(userId: string, id: string, body: unknown) {
  if (!isVocabularyId(id)) throw new ApiError(400, "Үгийн түлхүүр буруу байна.");
  const input = readWordFields(body);
  if (!input) throw new ApiError(400, "Үг, орчуулгаа бөглөнө үү. Үг 160, орчуулга 500 тэмдэгт хүртэл байна.");
  const db = getDb();
  const existing = await db.vocabularyWord.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new ApiError(404, "Энэ үг олдсонгүй.");
  if (input.deckId) await ownDeck(userId, input.deckId);
  const key = termKey(input.term);
  const clash = await db.vocabularyWord.findFirst({ where: { userId, termKey: key, id: { not: id } }, select: { id: true } });
  if (clash) throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
  try {
    const updated = await db.vocabularyWord.updateMany({
      where: { id, userId },
      data: { term: input.term, translation: input.translation, example: input.example, termKey: key, ...(input.deckId !== undefined ? { deckId: input.deckId } : {}) },
    });
    if (!updated.count) throw new ApiError(404, "Энэ үг олдсонгүй.");
    const row = await db.vocabularyWord.findFirst({ where: { id, userId }, select: WORD_SELECT });
    if (!row) throw new ApiError(404, "Энэ үг олдсонгүй.");
    return { word: publicWord(row) };
  } catch (error) {
    if (duplicate(error)) throw new ApiError(409, `"${input.term}" аль хэдийн хадгалагдсан байна.`);
    throw error;
  }
}

/** Delete only the student's own word. */
export async function deleteVocabularyWord(userId: string, id: string) {
  if (!isVocabularyId(id)) throw new ApiError(400, "Үгийн түлхүүр буруу байна.");
  const result = await getDb().vocabularyWord.deleteMany({ where: { id, userId } });
  if (!result.count) throw new ApiError(404, "Энэ үг олдсонгүй.");
  return { ok: true };
}

/** Create a deck. The folded name is unique per student, so one name is one deck. */
export async function createDeck(userId: string, body: unknown) {
  const input = readDeckFields(body, "create");
  if (!input?.name) throw new ApiError(400, `Багцын нэрээ бичнэ үү. ${VOCABULARY_LIMITS.deckName} тэмдэгт хүртэл байна.`);
  return { deck: publicDeck(await makeDeck(userId, input.name, input.color)) };
}

async function makeDeck(userId: string, name: string, color?: string) {
  const db = getDb();
  const count = await db.vocabularyDeck.count({ where: { userId } });
  if (count >= VOCABULARY_LIMITS.decks) throw new ApiError(409, `Хамгийн ихдээ ${VOCABULARY_LIMITS.decks} багц үүсгэнэ. Хэрэггүй багцаа устгаад дахин оролдоно уу.`);
  try {
    return await db.vocabularyDeck.create({ data: { userId, name, nameKey: termKey(name), ...(color ? { color } : {}) }, select: DECK_SELECT });
  } catch (error) {
    if (duplicate(error)) throw new ApiError(409, `"${name}" нэртэй багц аль хэдийн байна.`);
    throw error;
  }
}

/** Rename or recolour an owned deck. */
export async function updateDeck(userId: string, id: string, body: unknown) {
  if (!isVocabularyId(id)) throw new ApiError(400, "Багцын түлхүүр буруу байна.");
  const input = readDeckFields(body, "edit");
  if (!input) throw new ApiError(400, `Багцын нэр ${VOCABULARY_LIMITS.deckName} тэмдэгт хүртэл байна.`);
  await ownDeck(userId, id);
  try {
    await getDb().vocabularyDeck.updateMany({
      where: { id, userId },
      data: { ...(input.name ? { name: input.name, nameKey: termKey(input.name) } : {}), ...(input.color ? { color: input.color } : {}) },
    });
  } catch (error) {
    if (duplicate(error)) throw new ApiError(409, `"${input.name}" нэртэй багц аль хэдийн байна.`);
    throw error;
  }
  return { deck: publicDeck(await ownDeck(userId, id)) };
}

/** Delete an owned deck. Its words stay in the bank without a deck unless the student asks to delete them too. */
export async function deleteDeck(userId: string, id: string, withWords: boolean) {
  if (!isVocabularyId(id)) throw new ApiError(400, "Багцын түлхүүр буруу байна.");
  await ownDeck(userId, id);
  const db = getDb();
  const [words] = await db.$transaction([
    withWords ? db.vocabularyWord.deleteMany({ where: { userId, deckId: id } }) : db.vocabularyWord.updateMany({ where: { userId, deckId: id }, data: { deckId: null } }),
    db.vocabularyDeck.deleteMany({ where: { id, userId } }),
  ]);
  return { ok: true, deletedWords: withWords ? words.count : 0 };
}

/**
 * Save a reviewed list (a file scan's chosen words) in one go. Words already in the bank are skipped,
 * the bank size is enforced, and the words can go straight into an owned deck or a new one.
 */
async function addWords(userId: string, input: { words: WordFields[]; deckId: string | null; deckName: string | null; sourceName: string | null }) {
  const db = getDb();
  const [total, limit] = await Promise.all([db.vocabularyWord.count({ where: { userId } }), vocabularyLimit(userId)]);
  if (total >= limit) throw new ApiError(409, bankFullMessage(limit));
  const keys = input.words.map(word => termKey(word.term));
  const existing = await db.vocabularyWord.findMany({ where: { userId, termKey: { in: keys } }, select: { termKey: true } });
  const known = new Set(existing.map(row => row.termKey));
  const fresh = input.words.filter(word => !known.has(termKey(word.term)));
  const duplicates = input.words.length - fresh.length;
  const chosen = fresh.slice(0, limit - total);
  const skipped = fresh.length - chosen.length;
  if (!chosen.length) throw new ApiError(409, "Эдгээр үг аль хэдийн хадгалагдсан байна.");
  let deck: DeckRow | null = null;
  if (input.deckId) deck = await ownDeck(userId, input.deckId);
  else if (input.deckName) {
    // A name that already exists means that deck; otherwise the deck is created with the words.
    deck = await db.vocabularyDeck.findUnique({ where: { userId_nameKey: { userId, nameKey: termKey(input.deckName) } }, select: DECK_SELECT })
      ?? await makeDeck(userId, input.deckName);
  }
  await db.vocabularyWord.createMany({
    data: chosen.map(word => ({
      userId, term: word.term, translation: word.translation, example: word.example,
      termKey: termKey(word.term), sourceName: input.sourceName, deckId: deck?.id ?? null,
    })),
    skipDuplicates: true,
  });
  const rows = await db.vocabularyWord.findMany({
    where: { userId, termKey: { in: chosen.map(word => termKey(word.term)) } },
    orderBy: { createdAt: "desc" }, select: WORD_SELECT,
  });
  return { words: rows.map(publicWord), added: rows.length, duplicates, skipped, total: total + rows.length, limit, deck: deck ? publicDeck(deck) : null };
}

/** Several words at once: save a reviewed list, move to a deck, star, clear study progress or delete. Always owner-scoped. */
export async function bulkVocabulary(userId: string, body: unknown) {
  const input = readBulkRequest(body);
  if (!input) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  if (input.action === "add") return addWords(userId, input);
  const db = getDb();
  const where = { userId, id: { in: input.ids } };
  if (input.action === "delete") return { changed: (await db.vocabularyWord.deleteMany({ where })).count };
  if (input.action === "move") {
    if (input.deckId) await ownDeck(userId, input.deckId);
    return { changed: (await db.vocabularyWord.updateMany({ where, data: { deckId: input.deckId } })).count };
  }
  if (input.action === "star") return { changed: (await db.vocabularyWord.updateMany({ where, data: { starred: input.starred } })).count };
  return { changed: (await db.vocabularyWord.updateMany({ where, data: { box: 0, correct: 0, wrong: 0, reviewedAt: null, dueAt: null } })).count };
}

/**
 * Store a quiz session's grades as study progress. The browser sends only a grade per word; the box,
 * counts and next date are computed here from the stored state (study.ts), for the student's own words.
 */
export async function recordVocabularyReview(userId: string, body: unknown): Promise<{ words: StudyUpdate[] }> {
  const results = readReview(body);
  if (!results) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const db = getDb(), now = Date.now();
  const grades = new Map<string, StudyGrade>(results.map(item => [item.id, item.grade]));
  const rows = await db.vocabularyWord.findMany({ where: { userId, id: { in: [...grades.keys()] } }, select: { id: true, box: true, correct: true, wrong: true, dueAt: true } });
  const updates = rows.map(row => ({ id: row.id, ...nextStudy(row, grades.get(row.id)!, now) }));
  if (updates.length) {
    await db.$transaction(updates.map(item => db.vocabularyWord.updateMany({
      where: { id: item.id, userId },
      data: { box: item.box, correct: item.correct, wrong: item.wrong, reviewedAt: new Date(item.reviewedAt), dueAt: new Date(item.dueAt) },
    })));
  }
  return {
    words: updates.map(item => ({
      id: item.id, box: item.box, correct: item.correct, wrong: item.wrong,
      reviewedAt: new Date(item.reviewedAt).toISOString(), dueAt: new Date(item.dueAt).toISOString(),
    })),
  };
}

/**
 * One upload in, a list of new words out. The file is read on the server, only its text goes to the
 * provider, and the words found come back for the student to review; nothing is saved here. The student
 * sets the most words to find (at most the room left in the bank) and may filter by level and word type.
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
  for (const key of form.keys()) if (!["file", "language", "prompt", "count", "level", "kind"].includes(key)) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  // One document, or up to four page photos; their size and real kind are proven before credits are held.
  const upload = await readUploadedSource(form, "Үг оруулах файл эсвэл зургаа сонгоно уу.");
  const languageValue = field(form, "language") ?? "mn";
  if (!isImportLanguage(languageValue)) throw new ApiError(400, "Орчуулгын хэл буруу байна.");
  const levelValue = field(form, "level") ?? "any", kindValue = field(form, "kind") ?? "any";
  if (!isImportLevel(levelValue) || !isImportKind(kindValue)) throw new ApiError(400, "Үгийн шүүлтүүр буруу байна.");
  const rawRequest = field(form, "prompt") ?? "";
  if (rawRequest.length > VOCABULARY_LIMITS.prompt) throw new ApiError(400, `Заавар ${VOCABULARY_LIMITS.prompt} тэмдэгтээс ихгүй байна.`);
  const selectionRequest = cleanUserRequest(rawRequest);
  const requested = readImportCount(field(form, "count"));
  if (requested === null) throw new ApiError(400, `Үгийн тоо 1–${VOCABULARY_LIMITS.importWords} байна.`);
  const language: ImportLanguage = languageValue;
  const level: ImportLevel = levelValue, kind: ImportKind = kindValue;
  const name = upload.name;

  await ensureNoTimedExam(userId);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI үг оруулагч одоогоор холбогдоогүй байна.");

  const db = getDb(), now = Date.now(), limitKey = `education-vocabulary:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  // A full bank is refused before any credits are held; otherwise ask only for the room that is left.
  const [limit, stored] = await Promise.all([vocabularyLimit(userId), db.vocabularyWord.count({ where: { userId } })]);
  if (stored >= limit) throw new ApiError(409, bankFullMessage(limit));
  const wanted = Math.min(requested, limit - stored);
  // The price depends on the text actually read; until extraction, assume the longest document.
  let readChars: number = VOCABULARY_LIMITS.textChars;
  // Page photos are priced as DeepSeek bills them (at most 1,024 tokens each) instead of by text length.
  const pictures = upload.kind === "images" ? upload.images.length : 0;
  // The most this scan can cost is held first and refunded on any failure, including a file with no
  // new words; on success the charge settles to the new words found.
  return chargeCredits(userId, "vocabulary-import", async meter => {
  await db.rateLimit.upsert({ where: { key: limitKey }, create: { id: randomUUID(), key: limitKey, count: 0, lastRequest: BigInt(0) }, update: {} });
  // Database CAS enforces a daily budget and one request in flight across every server instance.
  const reserved = await db.rateLimit.updateMany({
    where: { key: limitKey, count: { lt: DAILY_LIMIT }, lastRequest: { lte: BigInt(now) } },
    data: { count: { increment: 1 }, lastRequest: lease },
  });
  if (!reserved.count) throw new ApiError(429, `Үг оруулж байна эсвэл өдрийн ${DAILY_LIMIT} хүсэлтийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);

  try {
    let messages: ChatMessage[];
    let source: ImportReply["source"];
    if (upload.kind === "images") {
      readChars = 0;
      messages = vocabularyMessages({ images: upload.images, language, truncated: false, request: selectionRequest, limit: wanted, level, kind });
      source = { name, kind: "image", pages: pictures, truncated: false };
    } else {
      const extracted = await extractDocument(name, upload.bytes);
      const cleaned = cleanSourceText(extracted.text);
      if (cleaned.text.length < MIN_TEXT) throw new ApiError(422, "Файлаас үг оруулах хангалттай текст олдсонгүй. Илүү бүрэн файл оруулна уу.");
      readChars = cleaned.text.length;
      messages = vocabularyMessages({ text: cleaned.text, language, truncated: cleaned.truncated, request: selectionRequest, limit: wanted, level, kind });
      source = { name, kind: extracted.kind, pages: extracted.pages ?? null, truncated: cleaned.truncated };
    }
    let generated: GeneratedWord[] | null = null;
    // One silent retry when the model returns a malformed object; the daily count is charged once.
    for (let attempt = 0; attempt < 2 && !generated; attempt++) generated = parseGeneratedWords(await deepseekWords(messages, meter), wanted);
    if (!generated) throw new ApiError(503, pictures ? "Зурагнаас үг уншиж чадсангүй. Илүү тод, ойроос авсан зураг оруулна уу." : "AI үг олж чадсангүй. Дахин оролдоно уу.");
    // Another tab may start a timed exam while the provider is answering.
    await ensureNoTimedExam(userId);

    // Words the student already has are left out of the list and of the price.
    const keys = generated.map(word => termKey(word.term));
    const existing = await db.vocabularyWord.findMany({ where: { userId, termKey: { in: keys } }, select: { termKey: true } });
    const known = new Set(existing.map(row => row.termKey));
    const candidates = generated.filter(word => !known.has(termKey(word.term)));
    const duplicates = generated.length - candidates.length;
    if (!candidates.length) throw new ApiError(409, "Энэ файлын үгс аль хэдийн хадгалагдсан байна.");
    return {
      candidates,
      found: candidates.length,
      duplicates,
      limit,
      room: limit - stored,
      requested: wanted,
      source,
      language,
      provider: "DeepSeek",
    };
  } finally {
    // Only release the lease this request holds; never shorten another request's lease.
    await db.rateLimit.updateMany({ where: { key: limitKey, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 3000) } });
  }
  }, { hold: vocabularyImportHold(wanted), settle: reply => vocabularyImportCredits(readChars, reply.found, pictures) });
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
