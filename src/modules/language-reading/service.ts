import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { chargeCredits } from "@/modules/credits/service";
import { AI_ACTIONS, languageReadingCredits, languageReadingOutputTokens, type UsageMeter } from "@/modules/credits/pricing";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import { languageDeck, pinyinChart } from "@/modules/language-decks/content";
import { hasLanguageStudy, languageStudyPlans } from "@/modules/language-decks/service";
import { tutorDay } from "@/modules/tutor/contracts";
import {
  READING_LIMITS, buildReadingRules, findReadingTopic, readReadingRequest, readReadingReply, readingMessages,
  type ChatMessage, type ParsedReading, type ReadingDeckId, type ReadingDecks, type ReadingLevelId, type ReadingRules, type ReadingText,
} from "./contracts";
import { aiFetch } from "@/modules/ai-usage/server";

const ACTION = "language-reading" as const;
const LEASE_MS = 180_000;
/** A retry only starts while there is time left for it inside the function's limit (route maxDuration 180 s). */
const RETRY_BEFORE_MS = 80_000;
const CALL_TIMEOUT_MS = 85_000;
const DECK_IDS: ReadingDeckId[] = ["jlpt-n5", "jlpt-n4", "jlpt-kanji-n5", "jlpt-kanji-n4", "hsk-1", "hsk-2", "topik-1", "topik-2"];

export type LanguageReadingReply = { reading: ReadingText; provider: "DeepSeek" };

const rulesCache = new Map<ReadingLevelId, ReadingRules>();
/** The level's allowed kanji / characters and word pool, from the private deck files (built once per server). */
function levelRules(level: ReadingLevelId): ReadingRules {
  let rules = rulesCache.get(level);
  if (!rules) {
    const decks = Object.fromEntries(DECK_IDS.map(id => {
      const deck = languageDeck(id);
      if (!deck) throw new Error("Missing deck " + id);
      return [id, deck.lessons.flatMap(lesson => lesson.words.map(word => ({ term: word.term, reading: word.reading })))];
    })) as unknown as ReadingDecks;
    const chart = pinyinChart();
    const pinyin = Object.values(chart.chart).flatMap(rows => rows.flatMap(row => row.cells.filter((cell): cell is string => Boolean(cell))));
    rules = buildReadingRules(level, decks, pinyin);
    rulesCache.set(level, rules);
  }
  return rules;
}

/** `count` different words from the pool, picked at random for each prompt. */
function sample(pool: readonly string[], count: number) {
  const copy = [...pool];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy.slice(0, count);
}

async function requireReadingAccess(userId: string, exam: ReadingText["exam"]) {
  if (!await hasLanguageStudy(userId, exam)) throw new ApiError(403, `Унших дасгал ${languageStudyPlans(exam).join(", ")} багцад багтана.`);
  if (await activeTimedSitting(userId)) throw new ApiError(409, "Цагтай шалгалт явагдаж байхад унших текст үүсгэхгүй. Шалгалтаа дуусгаад дахин оролдоно уу.");
}

/** The daily budget and the one-request-in-flight lease, kept in the database so every server instance shares them. */
async function withReadingSlot<T>(userId: string, work: () => Promise<T>): Promise<T> {
  const db = getDb();
  const now = Date.now(), key = `education-language-reading:${userId}:${tutorDay(now)}`, lease = BigInt(now + LEASE_MS);
  await db.rateLimit.upsert({ where: { key }, create: { id: randomUUID(), key, count: 0, lastRequest: BigInt(0) }, update: {} });
  const reserved = await db.rateLimit.updateMany({
    where: { key, count: { lt: READING_LIMITS.daily }, lastRequest: { lte: BigInt(now) } },
    data: { count: { increment: 1 }, lastRequest: lease },
  });
  if (!reserved.count) throw new ApiError(429, `Текст үүсгэж байна эсвэл өдрийн ${READING_LIMITS.daily} текстийн хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.`);
  try { return await work(); }
  finally {
    // Only release the lease this request holds.
    await db.rateLimit.updateMany({ where: { key, lastRequest: lease }, data: { lastRequest: BigInt(Date.now() + 2000) } });
  }
}

/**
 * One reading text for the signed-in student: the request is checked (exam, level, length, topic), then the plan (the
 * exam's Workshop: Ази хэл Basic or Pro) and that no timed sitting is open. The price of the chosen length is held,
 * DeepSeek writes the text, and the reply is checked against the level's script rules; a reply that breaks them gets one
 * retry told what to fix, and a second failure refunds the hold. Nothing is stored on the server: the page keeps the
 * text in the browser.
 */
export async function createLanguageReading(userId: string, body: unknown) {
  const input = readReadingRequest(body);
  if (!input) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  await requireReadingAccess(userId, input.exam);
  if (!process.env.DEEPSEEK_API_KEY?.trim()) throw new ApiError(503, "AI текст үүсгэгч одоогоор холбогдоогүй байна.");
  const rules = levelRules(input.level);
  const maxTokens = languageReadingOutputTokens(input.length);
  return chargeCredits(userId, ACTION, meter => withReadingSlot(userId, async () => {
    const started = Date.now();
    let reading: ParsedReading | null = null;
    let problems: string[] = [];
    for (let attempt = 0; attempt < 2 && !reading; attempt++) {
      if (attempt && Date.now() - started > RETRY_BEFORE_MS) break;
      const content = await deepseekReading(readingMessages(input, rules, sample(rules.hints, READING_LIMITS.hints), problems), maxTokens, meter);
      if (content === null) { problems = ["the reply was cut off or empty: write a shorter text in the same JSON shape"]; continue; }
      const checked = readReadingReply(content, input, rules);
      if (checked.ok) reading = checked.reading; else problems = checked.problems;
    }
    if (!reading) throw new ApiError(503, "AI бичсэн текст энэ түвшний үсгийн дүрэмд нийцсэнгүй. Дахин оролдоно уу; кредит хасагдаагүй.");
    // Another tab may start a timed exam while the provider is answering; the hold is then refunded.
    if (await activeTimedSitting(userId)) throw new ApiError(409, "Цагтай шалгалт эхэлсэн тул текстийг хадгалсангүй; кредит буцаагдлаа.");
    const topic = input.custom || findReadingTopic(input.topic)!.label;
    const text: ReadingText = { id: randomUUID(), exam: input.exam, level: input.level, length: input.length, topic, createdAt: Date.now(), ...reading };
    return { reading: text, provider: "DeepSeek" as const };
  }), { hold: languageReadingCredits(input.length) });
}

/**
 * DeepSeek JSON mode. The reply budget comes from the price list and never passes the action's listed budget. Returns
 * null for a reply that was cut off or empty (worth one retry); connection and HTTP failures throw.
 */
async function deepseekReading(messages: ChatMessage[], maxTokens: number, meter: UsageMeter): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) throw new ApiError(503, "AI текст үүсгэгч одоогоор холбогдоогүй байна.");
  let response: Response;
  try {
    response = await aiFetch("deepseek", "https://api.deepseek.com/chat/completions", {
      method: "POST", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
        messages,
        thinking: { type: "disabled" },
        max_tokens: Math.min(AI_ACTIONS[ACTION].outputTokens, maxTokens),
        temperature: 0.7,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(503, "AI текст үүсгэгчтэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.");
  }
  // Never echo provider error bodies: they can contain request or credential details.
  if (!response.ok) throw new ApiError(503, response.status === 429 ? "AI ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу." : "AI холболт түр ажиллахгүй байна. Дахин оролдоно уу.");
  let data: { choices?: { finish_reason?: string; message?: { content?: unknown } }[]; usage?: unknown };
  try { data = await response.json(); }
  catch { throw new ApiError(503, "AI хариу бүрэн ирсэнгүй. Дахин оролдоно уу."); }
  meter.add(data.usage);
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (choice?.finish_reason !== "stop" || typeof content !== "string" || !content.trim() || content.length > 60_000) return null;
  return content;
}
