import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { appendFile } from "node:fs/promises";
import { getDb } from "@/lib/db";
import { aiCallRow, aiEnvironment, failureStatus, isBillable, readBalances, requestModel, type AiCallInput, type AiCallStatus, type AiProvider } from "./core";

/**
 * The site's side of the AI usage log. Every paid provider request goes through `aiFetch` (or, for the Claude SDK,
 * `recordAiCall`), which stores one `AiCall` row with who asked, for which feature, what the provider reported and what
 * it cost. `chargeCredits` opens a context with the student, the action and the charge, so the services' provider
 * helpers need no extra arguments. Recording never breaks the feature: a failed insert is logged with the whole row.
 */

type AiContext = { userId?: string | null; source?: string; chargeId?: string | null };
const contextStore = new AsyncLocalStorage<AiContext>();

/** Runs `work` with these facts attached to every AI call it makes (inner values win over outer ones). */
export function withAiContext<T>(context: AiContext, work: () => Promise<T>): Promise<T> {
  return contextStore.run({ ...contextStore.getStore(), ...context }, work);
}

type CallFacts = AiContext & { model?: string; units?: number };

async function store(input: Omit<AiCallInput, "origin" | "environment">) {
  // Unit tests that load a service with a stubbed `fetch` turn the log off; nothing real was called.
  if (process.env.AI_USAGE_LOG === "off") return;
  const row = aiCallRow({ ...input, origin: "app", environment: aiEnvironment(process.env) });
  try {
    await getDb().aiCall.create({ data: row });
  } catch (error) {
    // Never lose a cost silently: the server log keeps the row, and a local run also keeps it on disk.
    console.error("AI usage record failed", error instanceof Error ? error.name : "Unknown", JSON.stringify(row));
    if (row.environment === "local") await appendFile("artifacts/ai-usage-unsaved.jsonl", JSON.stringify(row) + "\n").catch(() => {});
  }
}

/**
 * `fetch` for a provider request, recording it. A JSON answer is read from a copy, so the caller reads the response as
 * before; a binary answer (spoken audio) is priced from `facts.units`. Network failures and timeouts are recorded and
 * rethrown unchanged.
 */
export async function aiFetch(provider: AiProvider, url: string, init: RequestInit, facts: CallFacts = {}): Promise<Response> {
  const context = { ...contextStore.getStore(), ...facts };
  const at = new Date(), started = Date.now();
  const base = {
    provider, source: context.source ?? "unknown", billable: isBillable(provider, url), at,
    userId: context.userId, chargeId: context.chargeId, model: context.model ?? requestModel(provider, url, init.body), units: context.units,
  };
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    await store({ ...base, status: failureStatus(error), durationMs: Date.now() - started });
    throw error;
  }
  if (!response.ok) {
    await store({ ...base, status: "http", httpStatus: response.status, durationMs: Date.now() - started });
    return response;
  }
  let body: unknown;
  let status: AiCallStatus = "ok";
  if ((response.headers.get("content-type") ?? "").includes("json")) {
    try { body = await response.clone().json(); }
    catch (error) { status = failureStatus(error) === "timeout" ? "timeout" : "ok"; }
  } else body = {};
  await store({ ...base, status, httpStatus: response.status, durationMs: Date.now() - started, body });
  return response;
}

/** A `fetch`-shaped function for modules that take one (the DeepInfra speech helpers). */
export function aiFetcher(provider: AiProvider, facts: CallFacts = {}): typeof fetch {
  return ((input: RequestInfo | URL, init: RequestInit = {}) => aiFetch(provider, String(input instanceof Request ? input.url : input), init, facts)) as typeof fetch;
}

/** Records a call made through an SDK (Claude), from its final message or the error it ended with. */
export async function recordAiCall(provider: AiProvider, facts: CallFacts & { url: string; startedAt: number; body?: unknown; error?: unknown; httpStatus?: number }) {
  const context = { ...contextStore.getStore(), ...facts };
  const failed = facts.body === undefined;
  await store({
    provider, source: context.source ?? "unknown", billable: isBillable(provider, facts.url), at: new Date(facts.startedAt),
    userId: context.userId, chargeId: context.chargeId, model: context.model, units: context.units,
    status: failed ? (facts.httpStatus ? "http" : failureStatus(facts.error)) : "ok", httpStatus: facts.httpStatus ?? (failed ? 0 : 200),
    durationMs: Date.now() - facts.startedAt, body: facts.body,
  });
}

const BALANCE_URL = "https://api.deepseek.com/user/balance";

/**
 * Reads the DeepSeek account balance (free; no tokens) and stores it, at most once per `minAgeMs`. Returns the newest
 * stored reading either way, or null when there is no key or the provider does not answer.
 */
export async function refreshDeepseekBalance(minAgeMs = 5 * 60_000) {
  const db = getDb();
  const latest = await db.aiBalance.findFirst({ where: { provider: "deepseek" }, orderBy: { createdAt: "desc" } });
  if (latest && Date.now() - latest.createdAt.getTime() < minAgeMs) return latest;
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return latest;
  try {
    const response = await fetch(BALANCE_URL, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return latest;
    const balances = readBalances(await response.json());
    // One currency per account in practice; USD is preferred when both are listed.
    const pick = balances.find(row => row.currency === "USD") ?? balances[0];
    if (!pick) return latest;
    return await db.aiBalance.create({ data: { provider: "deepseek", currency: pick.currency, totalMicros: pick.totalMicros, environment: aiEnvironment(process.env) } });
  } catch {
    return latest;
  }
}
