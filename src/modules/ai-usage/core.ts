// The AI usage log's pure rules: which host is a real provider, what each provider's answer says it used, and what that
// cost. Shared by the site (`server.ts`), scripts and agent runs (`scripts/lib/ai-call.mjs`) and the unit tests, so every
// caller records the same row. Node's test runner and plain `node` import this file directly: erasable TypeScript only,
// relative imports with extensions.
import { DEEPSEEK_PRICE } from "../credits/pricing.ts";

export type AiProvider = "deepseek" | "anthropic" | "deepinfra";
export const AI_PROVIDERS: readonly AiProvider[] = ["deepseek", "anthropic", "deepinfra"];
export type AiOrigin = "app" | "script";
export type AiEnvironment = "local" | "hosted" | "preview";
export type AiCallStatus = "ok" | "http" | "network" | "timeout";

/** The provider's own API host. A request anywhere else (the checks' mock server) is recorded but costs nothing. */
export const PROVIDER_HOSTS: Record<AiProvider, string> = {
  deepseek: "api.deepseek.com",
  anthropic: "api.anthropic.com",
  deepinfra: "api.deepinfra.com",
};

/**
 * List prices in US dollars, checked 2026-11-20 on each provider's pricing page.
 * DeepSeek: per million tokens at peak; off-peak is half (`deepseekPeak`). Flash comes from the credits price list.
 * Claude: per million tokens; a cache write is 1.25× input. A model missing here is priced at the dearest row.
 * DeepInfra: used only when the answer carries no `inference_status.cost` of its own.
 */
export const AI_RATES = {
  checkedOn: "2026-11-20",
  deepseek: {
    flash: { hit: DEEPSEEK_PRICE.inputCacheHit, miss: DEEPSEEK_PRICE.inputCacheMiss, output: DEEPSEEK_PRICE.output },
    pro: { hit: 0.044, miss: 1.32, output: 3.96 },
  },
  anthropic: {
    "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
    "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
    "claude-fable-5-2": { input: 8, output: 40, cacheRead: 0.2, cacheWrite: 10 },
  } as Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }>,
  anthropicFallback: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 },
  deepinfra: { whisperPerMinute: 0.0002, kokoroPerMillionChars: 0.99 },
} as const;

/** True when the request goes to the provider's own host, so it is real money. */
export function isBillable(provider: AiProvider, url: string): boolean {
  try { return new URL(url).hostname === PROVIDER_HOSTS[provider]; } catch { return false; }
}

/**
 * The model a request asks for. DeepInfra names it in the path (`/v1/inference/<owner>/<model>`) and its bodies (text
 * for speech, a form for audio) carry none; DeepSeek names it in the JSON body.
 */
export function requestModel(provider: AiProvider, url: string, body: unknown): string {
  if (provider === "deepinfra") {
    try { return decodeURIComponent(new URL(url).pathname.split("/v1/inference/")[1] ?? "").slice(0, 120); } catch { return ""; }
  }
  if (typeof body !== "string") return "";
  try { const model = (JSON.parse(body) as { model?: unknown }).model; return typeof model === "string" ? model.slice(0, 120) : ""; } catch { return ""; }
}

/**
 * DeepSeek's peak hours: 01:00–04:00 and 06:00–10:00 UTC, Monday to Friday (09–12 and 14–18 in Ulaanbaatar). Chinese
 * public holidays are off-peak too; they are not listed here, so a holiday call is recorded at the peak price.
 */
export function deepseekPeak(at: Date): boolean {
  const day = at.getUTCDay(), hour = at.getUTCHours();
  return day >= 1 && day <= 5 && ((hour >= 1 && hour < 4) || (hour >= 6 && hour < 10));
}

const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export type AiUsage = {
  model: string;
  promptTokens: number;
  cachedTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  units: number;
  costNano: number;
  costBasis: "provider" | "tokens" | "none";
  requestId: string | null;
};

const NONE: AiUsage = { model: "", promptTokens: 0, cachedTokens: 0, completionTokens: 0, reasoningTokens: 0, units: 0, costNano: 0, costBasis: "none", requestId: null };
const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";

/** DeepSeek's `usage` block priced at the rate of the hour the call was made. */
export function deepseekUsage(body: unknown, at: Date, fallbackModel = ""): AiUsage {
  const data = record(body), usage = record(data.usage);
  const model = text(data.model, 80) || fallbackModel;
  const promptTokens = count(usage.prompt_tokens);
  const cachedTokens = Math.min(count(usage.prompt_cache_hit_tokens), promptTokens);
  const completionTokens = count(usage.completion_tokens);
  const reasoningTokens = Math.min(count(record(usage.completion_tokens_details).reasoning_tokens), completionTokens);
  const rate = /pro/i.test(model) ? AI_RATES.deepseek.pro : AI_RATES.deepseek.flash;
  const factor = deepseekPeak(at) ? 1 : 0.5;
  const costNano = Math.round(factor * 1000 * (cachedTokens * rate.hit + (promptTokens - cachedTokens) * rate.miss + completionTokens * rate.output));
  const counted = promptTokens + completionTokens > 0;
  return { ...NONE, model, promptTokens, cachedTokens, completionTokens, reasoningTokens, costNano, costBasis: counted ? "tokens" : "none", requestId: text(data.id, 120) || null };
}

/** Claude's `usage` (a Messages API answer or the SDK's final message). Prompt tokens include cache reads and writes. */
export function anthropicUsage(body: unknown, fallbackModel = ""): AiUsage {
  const data = record(body), usage = record(data.usage);
  const model = text(data.model, 80) || fallbackModel;
  const input = count(usage.input_tokens), written = count(usage.cache_creation_input_tokens), read = count(usage.cache_read_input_tokens);
  const completionTokens = count(usage.output_tokens);
  const rate = AI_RATES.anthropic[model] ?? AI_RATES.anthropicFallback;
  const costNano = Math.round(1000 * (input * rate.input + written * rate.cacheWrite + read * rate.cacheRead + completionTokens * rate.output));
  const promptTokens = input + written + read;
  return { ...NONE, model, promptTokens, cachedTokens: read, completionTokens, costNano, costBasis: promptTokens + completionTokens > 0 ? "tokens" : "none", requestId: text(data.id, 120) || null };
}

/**
 * DeepInfra's native inference answer: its own `inference_status.cost` when present, otherwise the list price of the
 * audio transcribed (Whisper) or the characters read aloud (Kokoro). `units` is milliseconds of audio or characters.
 */
export function deepinfraUsage(body: unknown, model: string, requestUnits = 0): AiUsage {
  const data = record(body), status = record(data.inference_status);
  const speech = /kokoro/i.test(model);
  const audioMs = count(data.input_length_ms) || Math.round(count(data.duration) * 1000);
  const units = speech ? (count(data.input_character_length) || requestUnits) : (audioMs || requestUnits);
  const own = typeof status.cost === "number" && Number.isFinite(status.cost) && status.cost > 0 ? status.cost : null;
  const estimate = speech ? units * AI_RATES.deepinfra.kokoroPerMillionChars / 1e6 : units / 60000 * AI_RATES.deepinfra.whisperPerMinute;
  const usd = own ?? estimate;
  return {
    ...NONE, model, units,
    promptTokens: count(status.tokens_input), completionTokens: count(status.tokens_generated),
    costNano: Math.round(usd * 1e9), costBasis: own !== null ? "provider" : units ? "tokens" : "none",
    requestId: text(data.request_id, 120) || null,
  };
}

export type AiCallInput = {
  provider: AiProvider;
  origin: AiOrigin;
  source: string;
  environment: AiEnvironment;
  billable: boolean;
  status: AiCallStatus;
  httpStatus?: number;
  durationMs: number;
  at: Date;
  /** The provider's parsed answer, when it was JSON. */
  body?: unknown;
  /** The model the request named, used when the answer does not say. */
  model?: string;
  /** Characters read aloud or audio milliseconds known from the request. */
  units?: number;
  userId?: string | null;
  chargeId?: string | null;
  agent?: string | null;
};

export type AiCallRow = {
  provider: AiProvider; model: string; origin: AiOrigin; source: string; environment: AiEnvironment; billable: boolean;
  userId: string | null; chargeId: string | null; status: AiCallStatus; httpStatus: number; durationMs: number;
  promptTokens: number; cachedTokens: number; completionTokens: number; reasoningTokens: number; units: number;
  costMicroUsd: number; costBasis: AiUsage["costBasis"]; agent: string | null; requestId: string | null; createdAt: Date;
};

/** The row to store for one request. Only an answered call is priced; a stand-in server's answer is never money. */
export function aiCallRow(input: AiCallInput): AiCallRow {
  const answered = input.status === "ok" && input.body !== undefined;
  const usage = !answered ? { ...NONE, model: input.model ?? "", units: count(input.units) }
    : input.provider === "deepseek" ? deepseekUsage(input.body, input.at, input.model)
      : input.provider === "anthropic" ? anthropicUsage(input.body, input.model)
        : deepinfraUsage(input.body, input.model ?? "", count(input.units));
  const costMicroUsd = input.billable ? Math.ceil(usage.costNano / 1000) : 0;
  return {
    provider: input.provider, model: usage.model.slice(0, 80), origin: input.origin, source: input.source.slice(0, 80) || "unknown",
    environment: input.environment, billable: input.billable, userId: input.userId ?? null, chargeId: input.chargeId ?? null,
    status: input.status, httpStatus: count(input.httpStatus), durationMs: count(input.durationMs),
    promptTokens: usage.promptTokens, cachedTokens: usage.cachedTokens, completionTokens: usage.completionTokens,
    reasoningTokens: usage.reasoningTokens, units: usage.units, costMicroUsd,
    costBasis: input.billable ? usage.costBasis : "none", agent: input.agent ? input.agent.slice(0, 80) : null,
    requestId: usage.requestId, createdAt: input.at,
  };
}

/** How a failed fetch is recorded: an `AbortSignal.timeout` is a timeout (the provider may still have billed it). */
export function failureStatus(error: unknown): AiCallStatus {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "timeout" : "network";
}

/** Where the code runs: Vercel production is the hosted site, any other Vercel build a preview, everything else local. */
export function aiEnvironment(env: Record<string, string | undefined>): AiEnvironment {
  if (env.VERCEL_ENV === "production") return "hosted";
  if (env.VERCEL_ENV) return "preview";
  return "local";
}

/** DeepSeek's `/user/balance` answer as millionths of each currency. */
export function readBalances(body: unknown): { currency: string; totalMicros: bigint }[] {
  const infos = record(body).balance_infos;
  if (!Array.isArray(infos)) return [];
  return infos.flatMap(info => {
    const row = record(info);
    const currency = text(row.currency, 8), total = typeof row.total_balance === "string" ? row.total_balance.trim() : "";
    if (!currency || !/^-?\d+(\.\d+)?$/.test(total)) return [];
    const [whole, fraction = ""] = total.replace("-", "").split(".");
    const micros = BigInt(whole) * BigInt(1_000_000) + BigInt((fraction + "000000").slice(0, 6));
    return [{ currency, totalMicros: total.startsWith("-") ? -micros : micros }];
  });
}
