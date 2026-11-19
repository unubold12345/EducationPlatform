import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  AI_RATES, aiCallRow, aiEnvironment, anthropicUsage, deepinfraUsage, deepseekPeak, deepseekUsage, failureStatus, isBillable, readBalances, requestModel,
} from "../src/modules/ai-usage/core.ts";

// Monday 2026-11-16: 02:00 UTC is peak (10:00 Ulaanbaatar), 12:00 UTC is off-peak; Saturday is off-peak all day.
const PEAK = new Date("2026-11-16T02:00:00Z"), OFF = new Date("2026-11-16T12:00:00Z"), SATURDAY = new Date("2026-11-21T02:00:00Z");

test("DeepSeek peak hours follow the pricing page (01–04 and 06–10 UTC, weekdays)", () => {
  assert.equal(deepseekPeak(PEAK), true);
  assert.equal(deepseekPeak(new Date("2026-11-16T00:59:00Z")), false);
  assert.equal(deepseekPeak(new Date("2026-11-16T04:00:00Z")), false);
  assert.equal(deepseekPeak(new Date("2026-11-16T09:59:00Z")), true);
  assert.equal(deepseekPeak(OFF), false);
  assert.equal(deepseekPeak(SATURDAY), false);
});

test("DeepSeek usage is priced from the reported tokens at the hour's rate, reasoning and cache included", () => {
  const body = { id: "req-1", model: "deepseek-flash", usage: { prompt_tokens: 2000, prompt_cache_hit_tokens: 1000, completion_tokens: 4000, completion_tokens_details: { reasoning_tokens: 3000 } } };
  const peak = deepseekUsage(body, PEAK);
  // 1,000 × 0.006 + 1,000 × 0.30 + 4,000 × 1.20 per million = $0.005106
  assert.equal(peak.costNano, 5_106_000);
  assert.deepEqual([peak.promptTokens, peak.cachedTokens, peak.completionTokens, peak.reasoningTokens, peak.costBasis, peak.requestId], [2000, 1000, 4000, 3000, "tokens", "req-1"]);
  assert.equal(deepseekUsage(body, OFF).costNano, 2_553_000);
  const pro = deepseekUsage({ ...body, model: "deepseek-v4-pro" }, PEAK);
  assert.equal(pro.costNano, Math.round(1000 * (1000 * AI_RATES.deepseek.pro.hit + 1000 * AI_RATES.deepseek.pro.miss + 4000 * AI_RATES.deepseek.pro.output)));
  assert.equal(deepseekUsage({ usage: "junk" }, PEAK).costBasis, "none");
  assert.equal(deepseekUsage({ usage: { prompt_tokens: 10, prompt_cache_hit_tokens: 99 } }, PEAK).cachedTokens, 10);
});

test("Claude and DeepInfra usage are priced; a provider's own figure wins over the estimate", () => {
  const claude = anthropicUsage({ model: "claude-opus-5-5", usage: { input_tokens: 1000, cache_creation_input_tokens: 2000, cache_read_input_tokens: 3000, output_tokens: 500 } });
  assert.equal(claude.costNano, 1000 * (1000 * 4 + 2000 * 5 + 3000 * 0.2 + 500 * 20));
  assert.equal(claude.promptTokens, 6000);
  assert.ok(anthropicUsage({ model: "claude-new", usage: { input_tokens: 1000 } }).costNano >= 1000 * 1000 * 8, "an unknown model is priced at the dearest rate");
  const whisper = deepinfraUsage({ text: "hi", input_length_ms: 60_000, inference_status: { cost: 0.00021 } }, "openai/whisper-large-v3-turbo");
  assert.deepEqual([whisper.costNano, whisper.costBasis, whisper.units], [210_000, "provider", 60_000]);
  const estimate = deepinfraUsage({ text: "hi", input_length_ms: 120_000 }, "openai/whisper-large-v3-turbo");
  assert.deepEqual([estimate.costNano, estimate.costBasis], [400_000, "tokens"]);
  const voice = deepinfraUsage({}, "hexgrad/Kokoro-82M", 1000);
  assert.deepEqual([voice.costNano, voice.units], [990_000, 1000]);
});

test("a call row costs nothing when it went to a stand-in server or failed, and keeps who and where", () => {
  const body = { usage: { prompt_tokens: 1_000_000, completion_tokens: 0 } };
  const base = { provider: "deepseek", origin: "app", source: "exam", environment: "local", durationMs: 12, at: PEAK, userId: "u1", chargeId: "c1" };
  const real = aiCallRow({ ...base, billable: true, status: "ok", httpStatus: 200, body });
  assert.deepEqual([real.costMicroUsd, real.costBasis, real.userId, real.chargeId, real.source], [300_000, "tokens", "u1", "c1", "exam"]);
  const mock = aiCallRow({ ...base, billable: false, status: "ok", httpStatus: 200, body });
  assert.deepEqual([mock.costMicroUsd, mock.costBasis, mock.promptTokens], [0, "none", 1_000_000]);
  const failed = aiCallRow({ ...base, billable: true, status: "timeout", model: "deepseek-flash" });
  assert.deepEqual([failed.costMicroUsd, failed.status, failed.model], [0, "timeout", "deepseek-flash"]);
  assert.equal(aiCallRow({ ...base, source: "", billable: true, status: "http", httpStatus: 503 }).source, "unknown");
});

test("hosts, failures, environments and balances are read safely", () => {
  assert.equal(isBillable("deepseek", "https://api.deepseek.com/chat/completions"), true);
  assert.equal(isBillable("deepseek", "http://127.0.0.1:8471/chat/completions"), false);
  assert.equal(isBillable("deepinfra", "https://api.deepinfra.com/v1/inference/hexgrad/Kokoro-82M"), true);
  assert.equal(isBillable("anthropic", "not a url"), false);
  // DeepInfra's bodies carry no model, so the path names it (a Kokoro call must not be priced as Whisper).
  assert.equal(requestModel("deepinfra", "https://api.deepinfra.com/v1/inference/hexgrad/Kokoro-82M", JSON.stringify({ model: "x", text: "hi" })), "hexgrad/Kokoro-82M");
  assert.equal(requestModel("deepseek", "https://api.deepseek.com/chat/completions", JSON.stringify({ model: "deepseek-flash" })), "deepseek-flash");
  assert.equal(requestModel("deepseek", "https://api.deepseek.com/chat/completions", new FormData()), "");
  assert.equal(failureStatus(Object.assign(new Error("x"), { name: "TimeoutError" })), "timeout");
  assert.equal(failureStatus(new TypeError("fetch failed")), "network");
  assert.deepEqual([aiEnvironment({}), aiEnvironment({ VERCEL_ENV: "production" }), aiEnvironment({ VERCEL_ENV: "preview" })], ["local", "hosted", "preview"]);
  assert.deepEqual(readBalances({ balance_infos: [{ currency: "USD", total_balance: "4.31" }, { currency: "CNY", total_balance: "bad" }] }), [{ currency: "USD", totalMicros: 4_310_000n }]);
  assert.deepEqual(readBalances({}), []);
});

// The rule that keeps the log complete: no code calls a provider except through the recorder.
const SKIP = new Set(["node_modules", ".next", ".git", "generated", "artifacts", "reference", ".claude"]);
function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.(ts|tsx|mjs|js|py)$/.test(name)) out.push(full.replaceAll("\\", "/"));
  }
  return out;
}

test("every provider request in the app and scripts goes through the AI usage log", () => {
  const RECORDERS = ["src/modules/ai-usage/server.ts", "scripts/lib/ai-call.mjs", "scripts/lib/ai_call.py", "scripts/ai-usage.mjs"];
  const PROVIDER = /api\.deepseek\.com|api\.anthropic\.com|api\.deepinfra\.com|\/chat\/completions|\/v1\/inference\//;
  const offenders = [];
  for (const file of [...files("src"), ...files("scripts"), ...files("MockExmps")]) {
    if (RECORDERS.includes(file) || file.endsWith("ai-usage/core.ts")) continue;
    const text = readFileSync(file, "utf8");
    if (!PROVIDER.test(text)) continue;
    // A plain fetch / urlopen beside a provider address is a call the log would miss.
    if (/(^|[^\w.])fetch\(/m.test(text) || /urlopen\(/.test(text)) offenders.push(file);
  }
  // The checks' mock DeepSeek server answers provider-shaped requests; it does not make them.
  assert.deepEqual(offenders.filter(file => file !== "scripts/check.mjs"), []);

  // Claude goes through its SDK: every file that builds a client records the call.
  for (const file of files("src")) {
    const text = readFileSync(file, "utf8");
    if (/new Anthropic\(/.test(text)) assert.match(text, /recordAiCall\("anthropic"/, file + " calls Claude without recording it");
  }
  // The DeepInfra helpers take a fetcher; every caller passes the recording one.
  for (const file of files("src")) {
    if (file.endsWith("speech-provider.ts")) continue;
    const text = readFileSync(file, "utf8");
    for (const call of text.match(/hosted(Voice|Transcript)\([^;]*/g) ?? []) assert.match(call, /aiFetcher\("deepinfra"/, file + ": " + call.slice(0, 60));
  }
  // Credit-charged work carries the student, action and charge into every call.
  assert.match(readFileSync("src/modules/credits/service.ts", "utf8"), /withAiContext\(\{ userId, source: action, chargeId: hold\.id \}/);
});
