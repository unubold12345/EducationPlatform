/**
 * AI credits: one price list for every AI action, derived from DeepSeek's published token prices.
 * Pure module (no server or browser APIs): the server charges from it, pages show the same numbers,
 * and the unit tests import it directly.
 */
import { subscriptionPlans, type SubscriptionProgram } from "../subscriptions/plans.ts";
import { VOCABULARY_LIMITS } from "../vocabulary/contracts.ts";

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
  | "vocabulary-import" | "exam-10" | "exam-20";

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
export const CREDIT_COSTS = Object.fromEntries(
  AI_ACTION_IDS.map(action => [action, creditsForTokens(AI_ACTIONS[action].inputTokens, AI_ACTIONS[action].outputTokens)]),
) as Record<AiAction, number>;
export function creditCost(action: AiAction) { return CREDIT_COSTS[action]; }
export function isAiAction(value: unknown): value is AiAction {
  return typeof value === "string" && Object.hasOwn(AI_ACTIONS, value);
}

/**
 * A file import is priced by what it delivers, not one flat fee: the document text DeepSeek reads plus
 * each new word saved to the bank. The rates fill that action's token budget above, so a full
 * 45,000-character document that saves 120 new words costs exactly its listed (maximum) price.
 * The maximum for the chosen word count is held before the call; the rest is returned once the words are
 * saved, so duplicates and words that do not fit cost nothing.
 */
export const VOCABULARY_IMPORT_RATE = {
  /** Extraction rules and the optional selection request. */
  promptTokens: 1500,
  /** Document text: one token per two characters, generous for Mongolian Cyrillic. */
  charsPerToken: 2,
  /** One saved entry: term, translation, an optional example and the JSON around them. */
  tokensPerWord: 66,
} as const;

// Missing or malformed input prices as the maximum, so a bug can never undercharge.
const bounded = (value: number, max: number) => Number.isFinite(value) ? Math.min(max, Math.max(0, Math.ceil(value))) : max;

/** Credits for reading `textChars` of document text and saving `words` new words. */
export function vocabularyImportCredits(textChars: number, words: number) {
  const chars = bounded(textChars, VOCABULARY_LIMITS.textChars);
  const count = bounded(words, VOCABULARY_LIMITS.importWords);
  return creditsForTokens(
    VOCABULARY_IMPORT_RATE.promptTokens + Math.ceil(chars / VOCABULARY_IMPORT_RATE.charsPerToken),
    count * VOCABULARY_IMPORT_RATE.tokensPerWord,
  );
}
/** The most an import of up to `words` new words can cost (a full-length document); held before the call. */
export function vocabularyImportHold(words: number) {
  return vocabularyImportCredits(VOCABULARY_LIMITS.textChars, words);
}

/** The lowest and highest charge of an action; equal for every fixed-price action. */
export function creditRange(action: AiAction) {
  const max = CREDIT_COSTS[action];
  return { min: action === "vocabulary-import" ? vocabularyImportCredits(0, 1) : max, max };
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
/** The code defaults, used where no admin-set row exists. */
export function defaultAllowances(): AllowanceTable {
  return Object.fromEntries([["free", FREE_MONTHLY_CREDITS], ...subscriptionPlans.map(plan => [plan.program, plan.aiCredits])]) as AllowanceTable;
}
/** Monthly allowance: the free credits plus each distinct active plan's credits (bonus grants are added separately). */
export function monthlyAllowance(programs: readonly string[], table: AllowanceTable = defaultAllowances()) {
  let total = table.free;
  for (const program of new Set(programs)) if (program !== "free" && isAllowanceKey(program)) total += table[program];
  return total;
}

const UB_OFFSET_MS = 8 * 3600_000;
/** The Ulaanbaatar calendar month a charge belongs to, as "YYYY-MM". */
export function creditPeriod(now: number) { return new Date(now + UB_OFFSET_MS).toISOString().slice(0, 7); }
/** When the next month's allowance starts: 00:00 Ulaanbaatar on the 1st. */
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
