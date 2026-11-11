/**
 * AI credits: one price list for every AI action, derived from DeepSeek's published token prices
 * (the vocabulary import adds a margin over them; see `VOCABULARY_IMPORT_PRICE`).
 * Pure module (no server or browser APIs): the server charges from it, pages show the same numbers,
 * and the unit tests import it directly.
 */
import { subscriptionPlans, type SubscriptionProgram } from "../subscriptions/plans.ts";
import { VOCABULARY_LIMITS } from "../vocabulary/contracts.ts";
import { AI_IMAGE_LIMITS } from "../ai-images/contracts.ts";
import { READING_LIMITS } from "../reading-lab/contracts.ts";

/**
 * DeepSeek list prices in USD per million tokens for the model every AI feature calls.
 * Peak rates (weekdays 09:00–12:00 and 14:00–18:00 Ulaanbaatar) are used, so a charge never
 * undercounts; off-peak is half. Update these and the costs below follow.
 */
export const DEEPSEEK_PRICE = {
  model: "deepseek-flash",
  source: "https://api-docs.deepseek.com/quick_start/pricing",
  checkedOn: "2026-11-09",
  inputCacheHit: 0.006,
  inputCacheMiss: 0.3,
  output: 1.2,
} as const;

/** One credit buys this much DeepSeek usage at the peak list price (a tenth of a US cent). */
export const CREDIT_USD = 0.001;
/** Every verified student gets this many credits each Ulaanbaatar month, plan or not. */
export const FREE_MONTHLY_CREDITS = 100;

// Integer arithmetic in nano-dollars (1e-9 USD) keeps prices like 0.3 from rounding a cost up a credit.
const NANO_PER_TOKEN = {
  hit: Math.round(DEEPSEEK_PRICE.inputCacheHit * 1000),
  miss: Math.round(DEEPSEEK_PRICE.inputCacheMiss * 1000),
  output: Math.round(DEEPSEEK_PRICE.output * 1000),
};
const NANO_PER_CREDIT = Math.round(CREDIT_USD * 1e9);

export type AiAction =
  | "chat" | "review-coach" | "practice-assistant" | "math-tutor"
  | "writing-ideas" | "writing-grammar" | "writing-feedback"
  | "speaking-turn" | "speaking-report"
  | "vocabulary-import" | "exam-10" | "exam-20" | "reading-practice";

type ActionBudget = { label: string; area: string; inputTokens: number; outputTokens: number };

/**
 * Token budget per action. Output is the provider's max_tokens for that call (services read it from
 * here); input is a generous upper estimate of the prompt, the supplied material and the history.
 * Every input token is priced as a cache miss.
 */
export const AI_ACTIONS: Record<AiAction, ActionBudget> = {
  "chat": { label: "Нэг хариулт", area: "AI туслах", inputTokens: 6000, outputTokens: 2000 },
  "review-coach": { label: "Нэг хариулт", area: "Үр дүнгийн AI багш", inputTokens: 10000, outputTokens: 2000 },
  "practice-assistant": { label: "Нэг хариулт", area: "Дадлагын AI туслах", inputTokens: 8000, outputTokens: 2000 },
  "math-tutor": { label: "Нэг хариулт", area: "SAT математикийн AI багш", inputTokens: 4000, outputTokens: 1400 },
  "writing-ideas": { label: "Санаа авах", area: "Essay Studio", inputTokens: 3000, outputTokens: 1200 },
  "writing-grammar": { label: "Дүрэм шалгах", area: "Essay Studio", inputTokens: 5000, outputTokens: 2400 },
  "writing-feedback": { label: "Бүрэн үнэлгээ", area: "Essay Studio", inputTokens: 5000, outputTokens: 3600 },
  "speaking-turn": { label: "Ярилцагчийн нэг хариулт", area: "Speaking Lab", inputTokens: 5000, outputTokens: 900 },
  "speaking-report": { label: "Эцсийн тайлан", area: "Speaking Lab", inputTokens: 14000, outputTokens: 3200 },
  "vocabulary-import": { label: "Файлаас үг оруулах", area: "Үгсийн сан", inputTokens: 24000, outputTokens: 8000 },
  "exam-10": { label: "10 асуулттай шалгалт", area: "Файлаас шалгалт", inputTokens: 24000, outputTokens: 4800 },
  "exam-20": { label: "20 асуулттай шалгалт", area: "Файлаас шалгалт", inputTokens: 24000, outputTokens: 8000 },
  // Priced by length (`readingPracticeCredits` below); this budget is the most one practice can cost.
  "reading-practice": { label: "Унших дасгал үүсгэх", area: "Reading Lab", inputTokens: 24000, outputTokens: 6000 },
};
export const AI_ACTION_IDS = Object.keys(AI_ACTIONS) as AiAction[];

/** DeepSeek list cost of a call, in nano-dollars. Cached input tokens are part of the prompt total. */
export function costNanoUsd(promptTokens: number, completionTokens: number, cachedTokens = 0) {
  const cached = Math.min(Math.max(0, cachedTokens), Math.max(0, promptTokens));
  return cached * NANO_PER_TOKEN.hit + (Math.max(0, promptTokens) - cached) * NANO_PER_TOKEN.miss + Math.max(0, completionTokens) * NANO_PER_TOKEN.output;
}
/** Whole credits needed to cover a token budget, rounded up; never less than one. */
export function creditsForTokens(promptTokens: number, completionTokens: number, cachedTokens = 0) {
  return Math.max(1, Math.ceil(costNanoUsd(promptTokens, completionTokens, cachedTokens) / NANO_PER_CREDIT));
}

/**
 * What DeepSeek bills for a file import: the document text it reads plus each word it writes back.
 * These rates fill that action's token budget above (a full 45,000-character document with 120 words).
 */
export const VOCABULARY_IMPORT_RATE = {
  /** Extraction rules and the optional selection request. */
  promptTokens: 1500,
  /** Document text: one token per two characters, generous for Mongolian Cyrillic. */
  charsPerToken: 2,
  /** One entry: term, translation, an optional example and the JSON around them. */
  tokensPerWord: 66,
} as const;

/**
 * What a student pays for a file import (owner rule 2026-11-11: an AI action should earn, not only cover
 * its DeepSeek cost). The price follows what the student receives: a base fee plus a fee per new word found,
 * cheaper per word as the list grows. It is never below `floorMargin` times the DeepSeek peak list cost of
 * that import, so a long document that yields few words still earns.
 */
export const VOCABULARY_IMPORT_PRICE = {
  base: 3,
  /** Tenths of a credit per word, by position in the list: words 1–20, 21–60 and 61–120. */
  tiers: [{ upTo: 20, tenths: 5 }, { upTo: 60, tenths: 4 }, { upTo: 120, tenths: 3 }],
  floorMargin: 2,
} as const;

// Missing or malformed input prices as the maximum, so a bug can never undercharge.
const bounded = (value: number, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(0, Math.ceil(value))) : max;

/** DeepSeek peak list cost, in nano-dollars, of reading `textChars` (or `images` page photos) and writing `words` entries. */
export function vocabularyImportCostNano(textChars: number, words: number, images = 0) {
  const chars = bounded(textChars, VOCABULARY_LIMITS.textChars);
  const count = bounded(words, VOCABULARY_LIMITS.importWords);
  const pictures = bounded(images, AI_IMAGE_LIMITS.perUpload);
  return costNanoUsd(
    VOCABULARY_IMPORT_RATE.promptTokens + Math.ceil(chars / VOCABULARY_IMPORT_RATE.charsPerToken) + pictures * AI_IMAGE_LIMITS.tokens,
    count * VOCABULARY_IMPORT_RATE.tokensPerWord,
  );
}

/**
 * Credits for a scan that read `textChars` of document text (or `images` page photos) and found `words` new
 * words: the value price, or the cost floor when that is higher.
 */
export function vocabularyImportCredits(textChars: number, words: number, images = 0) {
  const count = bounded(words, VOCABULARY_LIMITS.importWords);
  let tenths = 0, from = 0;
  for (const tier of VOCABULARY_IMPORT_PRICE.tiers) {
    tenths += Math.max(0, Math.min(count, tier.upTo) - from) * tier.tenths;
    from = tier.upTo;
  }
  const value = VOCABULARY_IMPORT_PRICE.base + Math.ceil(tenths / 10);
  const floor = Math.ceil(VOCABULARY_IMPORT_PRICE.floorMargin * vocabularyImportCostNano(textChars, words, images) / NANO_PER_CREDIT);
  return Math.max(value, floor);
}
/** The most a scan for up to `words` new words can cost (a full-length document); held before the call. */
export function vocabularyImportHold(words: number) {
  return vocabularyImportCredits(VOCABULARY_LIMITS.textChars, words);
}

/** Actions sold above their DeepSeek cost; every other action's price is its token budget's cost. */
export const MARGIN_ACTIONS: readonly AiAction[] = ["vocabulary-import"];
export const CREDIT_COSTS = {
  ...Object.fromEntries(AI_ACTION_IDS.map(action => [action, creditsForTokens(AI_ACTIONS[action].inputTokens, AI_ACTIONS[action].outputTokens)])),
  "vocabulary-import": vocabularyImportHold(VOCABULARY_LIMITS.importWords),
} as Record<AiAction, number>;
/**
 * An image attached to a conversation is billed by DeepSeek as at most 1,024 more input tokens, and the reply
 * first restates what it read (the prompt asks for that), budgeted here as this many more output tokens.
 * The owner asked on 2026-11-09 for a picture to raise a chat reply's price a little more than its bare
 * input cost: 2 credits per image at the peak price.
 */
export const IMAGE_OUTPUT_TOKENS = 600;
/**
 * Whole credits each image adds to that reply. Photos given to an import or an exam replace the document text,
 * which the action's budget already covers, so those prices do not change.
 */
export const IMAGE_CREDITS = creditsForTokens(AI_IMAGE_LIMITS.tokens, IMAGE_OUTPUT_TOKENS);
export const IMAGE_ACTIONS: readonly AiAction[] = ["chat", "review-coach", "practice-assistant", "math-tutor"];
const imageCount = (images: number) => Number.isFinite(images) ? Math.min(AI_IMAGE_LIMITS.perMessage, Math.max(0, Math.ceil(images))) : AI_IMAGE_LIMITS.perMessage;
/** The listed price of one action, plus the image surcharge when a conversation message carries images. */
export function creditCost(action: AiAction, images = 0) {
  return CREDIT_COSTS[action] + (IMAGE_ACTIONS.includes(action) ? imageCount(images) * IMAGE_CREDITS : 0);
}
/** The most one request of this action can ever hold: its price with the most images a message may carry. */
export function maxCreditCost(action: AiAction) { return creditCost(action, AI_IMAGE_LIMITS.perMessage); }
export function isAiAction(value: unknown): value is AiAction {
  return typeof value === "string" && Object.hasOwn(AI_ACTIONS, value);
}

/**
 * A Reading Lab practice is priced by length (owner rule 2026-11-10), not one flat fee: the material DeepSeek reads
 * (one token per two characters, or one image's tokens per page photo) plus the passage and questions it writes back.
 * The first live call (2026-11-10) read 1,935 characters and returned a 351-word passage with 12 questions for
 * 1,206 + 1,951 tokens ($0.0027); these rates price that at 6 credits, leaving room for longer Mongolian explanations.
 * They fill the action's budget, so a full 45,000-character file with the longest passage and most questions costs
 * exactly the listed (maximum) price.
 */
export const READING_PRACTICE_RATE = {
  /** Instructions, the JSON shape and the explanation language. */
  promptTokens: 1500,
  charsPerToken: 2,
  /** The passage as written back. */
  tokensPerPassageWord: 2,
  /** One question with its options, explanation and quoted evidence. */
  tokensPerQuestion: 200,
  /** The title and the JSON around the reply. */
  replyTokens: 600,
} as const;

/** Credits for reading `textChars` of material (or `images` page photos) and returning a passage of `passageWords` with `questions` questions. */
export function readingPracticeCredits(textChars: number, passageWords: number, questions: number, images = 0) {
  const rate = READING_PRACTICE_RATE;
  const chars = bounded(textChars, READING_LIMITS.textChars);
  const words = bounded(passageWords, READING_LIMITS.passageWords.max);
  const count = bounded(questions, READING_LIMITS.questions.max);
  const pictures = bounded(images, AI_IMAGE_LIMITS.perUpload);
  return creditsForTokens(
    // A practice reads pasted text, a document or page photos, never two of them, so the larger one is priced.
    rate.promptTokens + Math.max(Math.ceil(chars / rate.charsPerToken), pictures * AI_IMAGE_LIMITS.tokens),
    rate.replyTokens + words * rate.tokensPerPassageWord + count * rate.tokensPerQuestion,
  );
}
/**
 * The most a practice from this material can cost: its known length (pasted text) or photo count, with the longest
 * passage and the most questions. A document's text is only known after extraction, so it holds the full-file price.
 */
export function readingPracticeHold(textChars: number, images = 0) {
  return readingPracticeCredits(textChars, READING_LIMITS.passageWords.max, READING_LIMITS.questions.max, images);
}

/** The lowest and highest charge of an action; equal for every fixed-price action. */
export function creditRange(action: AiAction) {
  const max = CREDIT_COSTS[action];
  if (action === "vocabulary-import") return { min: vocabularyImportCredits(0, 1), max };
  if (action === "reading-practice") return { min: readingPracticeCredits(READING_LIMITS.minSourceChars, READING_LIMITS.passageWords.min, READING_LIMITS.questions.min), max };
  return { min: max, max };
}
/** "5" for a fixed price, "1–17" for a priced-by-result action. */
export function creditRangeLabel(action: AiAction) {
  const { min, max } = creditRange(action);
  return min === max ? String(max) : `${min}–${max}`;
}

export function writingCreditAction(action: "ideas" | "grammar" | "feedback"): AiAction {
  return action === "feedback" ? "writing-feedback" : action === "grammar" ? "writing-grammar" : "writing-ideas";
}
export function speakingCreditAction(action: string): AiAction {
  return action === "report" ? "speaking-report" : "speaking-turn";
}
export function examCreditAction(count: 10 | 20): AiAction { return count === 20 ? "exam-20" : "exam-10"; }

/** Monthly amounts an admin can change: the free credits and each plan's credits. */
export type AllowanceKey = "free" | SubscriptionProgram;
export type AllowanceTable = Record<AllowanceKey, number>;
export const ALLOWANCE_KEYS = ["free", ...subscriptionPlans.map(plan => plan.program)] as AllowanceKey[];
export const CREDIT_ALLOWANCE_LIMITS = { min: 0, max: 100_000 } as const;
/** An admin grant adds bonus credits to one student's current month. */
export const CREDIT_GRANT_LIMITS = { min: 1, max: 10_000 } as const;
export function isAllowanceKey(value: unknown): value is AllowanceKey {
  return typeof value === "string" && (ALLOWANCE_KEYS as string[]).includes(value);
}
export function validAllowance(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= CREDIT_ALLOWANCE_LIMITS.min && value <= CREDIT_ALLOWANCE_LIMITS.max;
}
export function validGrant(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= CREDIT_GRANT_LIMITS.min && value <= CREDIT_GRANT_LIMITS.max;
}
/**
 * The one AI credit pack on sale. Admins change both numbers in the Prices tab (`CreditPack`); this is the
 * fallback when no row exists. Purchased credits never expire and are spent after the monthly and plan credits.
 */
export const DEFAULT_CREDIT_PACK = { credits: 1000, amountMnt: 5000 } as const;
export type CreditPackOffer = { credits: number; amountMnt: number };
export const CREDIT_PACK_LIMITS = { credits: { min: 10, max: 100_000 }, amountMnt: { min: 1000, max: 1_000_000, step: 100 } } as const;
export function validCreditPack(credits: unknown, amountMnt: unknown) {
  const { credits: c, amountMnt: m } = CREDIT_PACK_LIMITS;
  return typeof credits === "number" && Number.isInteger(credits) && credits >= c.min && credits <= c.max
    && typeof amountMnt === "number" && Number.isInteger(amountMnt) && amountMnt >= m.min && amountMnt <= m.max && amountMnt % m.step === 0;
}

/** The code defaults, used where no admin-set row exists. */
export function defaultAllowances(): AllowanceTable {
  return Object.fromEntries([["free", FREE_MONTHLY_CREDITS], ...subscriptionPlans.map(plan => [plan.program, plan.aiCredits])]) as AllowanceTable;
}
const UB_OFFSET_MS = 8 * 3600_000;
/** The Ulaanbaatar calendar month a charge belongs to (and the free credits' month), as "YYYY-MM". */
export function creditPeriod(now: number) { return new Date(now + UB_OFFSET_MS).toISOString().slice(0, 7); }
/** When the next month's free credits start: 00:00 Ulaanbaatar on the 1st. Plan credits do not follow this. */
export function creditResetAt(now: number) {
  const local = new Date(now + UB_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - UB_OFFSET_MS);
}

export type TokenUsage = { prompt: number; cached: number; completion: number };
const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
/** Reads DeepSeek's `usage` block; anything missing or malformed counts as zero. */
export function readUsage(value: unknown): TokenUsage {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { prompt: 0, cached: 0, completion: 0 };
  const usage = value as Record<string, unknown>;
  const prompt = count(usage.prompt_tokens), cached = count(usage.prompt_cache_hit_tokens);
  return { prompt, cached: Math.min(cached, prompt), completion: count(usage.completion_tokens) };
}

/** Sums the provider's reported usage over one charged action, retries included. */
export class UsageMeter {
  prompt = 0;
  cached = 0;
  completion = 0;
  calls = 0;
  add(raw: unknown) {
    const usage = readUsage(raw);
    this.prompt += usage.prompt; this.cached += usage.cached; this.completion += usage.completion; this.calls += 1;
  }
  /** Actual list cost at the peak price, in whole micro-dollars rounded up. */
  costMicroUsd() { return Math.ceil(costNanoUsd(this.prompt, this.completion, this.cached) / 1000); }
}

export type CreditReceipt = { action: AiAction; spent: number; balance: number; allowance: number };
/** Accepts only a well-formed receipt from an AI reply, for the page's balance display. */
export function readReceipt(value: unknown): CreditReceipt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const receipt = (value as Record<string, unknown>).credits;
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return null;
  const { action, spent, balance, allowance } = receipt as Record<string, unknown>;
  if (!isAiAction(action)) return null;
  if (![spent, balance, allowance].every(item => typeof item === "number" && Number.isSafeInteger(item) && item >= 0)) return null;
  return { action, spent: spent as number, balance: balance as number, allowance: allowance as number };
}

export function formatCredits(value: number) { return value.toLocaleString("en-US"); }
/** Micro-dollars as a short USD amount: four decimals below a dollar, two above. */
export function formatUsd(microUsd: number) {
  const usd = microUsd / 1e6;
  return "$" + (usd >= 1 ? usd.toFixed(2) : usd.toFixed(4));
}
/** What spent credits are worth at the credit's DeepSeek list value, in micro-dollars. */
export function creditValueMicroUsd(credits: number) { return Math.round(credits * CREDIT_USD * 1e6); }
