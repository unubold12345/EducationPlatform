import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  AI_ACTIONS, AI_ACTION_IDS, ALLOWANCE_KEYS, CREDIT_ALLOWANCE_LIMITS, CREDIT_COSTS, CREDIT_GRANT_LIMITS, CREDIT_USD, DEEPSEEK_PRICE,
  FREE_MONTHLY_CREDITS, UsageMeter, VOCABULARY_IMPORT_RATE, costNanoUsd, creditCost, creditPeriod, creditRange, creditRangeLabel,
  creditResetAt, creditValueMicroUsd, creditsForTokens,
  defaultAllowances, examCreditAction, formatCredits, formatUsd, isAiAction, isAllowanceKey, monthlyAllowance, readReceipt,
  readUsage, speakingCreditAction, validAllowance, validGrant, vocabularyImportCredits, vocabularyImportHold, writingCreditAction,
} from "../src/modules/credits/pricing.ts";
import { VOCABULARY_LIMITS } from "../src/modules/vocabulary/contracts.ts";
import { subscriptionPlans } from "../src/modules/subscriptions/plans.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("credit prices follow the DeepSeek peak list price", () => {
  assert.deepEqual({ hit: DEEPSEEK_PRICE.inputCacheHit, miss: DEEPSEEK_PRICE.inputCacheMiss, output: DEEPSEEK_PRICE.output }, { hit: 0.006, miss: 0.3, output: 1.2 });
  assert.equal(DEEPSEEK_PRICE.model, "deepseek-flash");
  assert.equal(CREDIT_USD, 0.001);
  assert.deepEqual(CREDIT_COSTS, {
    "chat": 5, "review-coach": 6, "practice-assistant": 5, "math-tutor": 3,
    "writing-ideas": 3, "writing-grammar": 5, "writing-feedback": 6,
    "speaking-turn": 3, "speaking-report": 9,
    "vocabulary-import": 17, "exam-10": 13, "exam-20": 17,
  });
  for (const action of AI_ACTION_IDS) {
    const { inputTokens, outputTokens } = AI_ACTIONS[action];
    const usd = (inputTokens * DEEPSEEK_PRICE.inputCacheMiss + outputTokens * DEEPSEEK_PRICE.output) / 1e6;
    // The fixed charge always covers its whole token budget, and never by a full extra credit.
    assert.ok(creditCost(action) * CREDIT_USD >= usd - 1e-12, action);
    assert.ok((creditCost(action) - 1) * CREDIT_USD < usd, action);
    assert.ok(Number.isSafeInteger(creditCost(action)) && creditCost(action) > 0, action);
  }
});

test("token costs use integer arithmetic and price cache hits lower", () => {
  // 10,000 input tokens at $0.30/M is exactly $0.003: three credits, not four.
  assert.equal(creditsForTokens(10_000, 0), 3);
  assert.equal(creditsForTokens(10_001, 0), 4);
  assert.equal(creditsForTokens(0, 0), 1);
  assert.equal(costNanoUsd(1_000_000, 0), 300_000_000);
  assert.equal(costNanoUsd(0, 1_000_000), 1_200_000_000);
  assert.equal(costNanoUsd(1_000_000, 0, 1_000_000), 6_000_000);
  assert.ok(costNanoUsd(5000, 500, 4000) < costNanoUsd(5000, 500, 0));
  // Cached tokens can never exceed the prompt or go negative.
  assert.equal(costNanoUsd(100, 0, 500), costNanoUsd(100, 0, 100));
  assert.equal(costNanoUsd(-5, -5, -5), 0);
});

test("a vocabulary import is priced by the text read and the new words saved", () => {
  const { inputTokens, outputTokens } = AI_ACTIONS["vocabulary-import"];
  // The rates fill the action's token budget, so its listed price is the most one import can cost.
  assert.equal(VOCABULARY_IMPORT_RATE.promptTokens + VOCABULARY_LIMITS.textChars / VOCABULARY_IMPORT_RATE.charsPerToken, inputTokens);
  assert.ok(VOCABULARY_IMPORT_RATE.tokensPerWord * VOCABULARY_LIMITS.importWords <= outputTokens);
  assert.equal(vocabularyImportCredits(VOCABULARY_LIMITS.textChars, VOCABULARY_LIMITS.importWords), creditCost("vocabulary-import"));
  // Fewer words and shorter text cost fewer credits.
  assert.equal(vocabularyImportCredits(2_000, 10), 2);
  assert.equal(vocabularyImportCredits(45_000, 10), 8);
  assert.equal(vocabularyImportCredits(20_000, 100), 12);
  assert.ok(vocabularyImportCredits(45_000, 10) < vocabularyImportCredits(45_000, 100));
  assert.ok(vocabularyImportCredits(2_000, 50) < vocabularyImportCredits(40_000, 50));
  assert.deepEqual([10, 20, 50, 120].map(vocabularyImportHold), [8, 9, 12, 17]);
  // The hold always covers the settled price, which stays between one credit and the listed maximum.
  for (const words of [0, 1, 10, 20, 50, 100, 120]) {
    for (const chars of [0, 40, 2_000, 20_000, 45_000]) {
      const price = vocabularyImportCredits(chars, words);
      assert.ok(price >= 1 && price <= vocabularyImportHold(words) && Number.isSafeInteger(price), `${chars}/${words}`);
    }
  }
  assert.equal(vocabularyImportCredits(1e9, 1e9), 17, "input is clamped to one import's bounds");
  assert.equal(vocabularyImportCredits(NaN, NaN), 17, "malformed input prices as the maximum");
  assert.equal(vocabularyImportCredits(-5, -5), 1);
  assert.deepEqual(creditRange("vocabulary-import"), { min: 1, max: 17 });
  assert.equal(creditRangeLabel("vocabulary-import"), "1–17");
  assert.deepEqual(creditRange("chat"), { min: 5, max: 5 });
  assert.equal(creditRangeLabel("exam-20"), "17");
});

test("feature actions map to their price list entries", () => {
  assert.equal(writingCreditAction("ideas"), "writing-ideas");
  assert.equal(writingCreditAction("grammar"), "writing-grammar");
  assert.equal(writingCreditAction("feedback"), "writing-feedback");
  for (const action of ["start", "answer", "advance", "hint"]) assert.equal(speakingCreditAction(action), "speaking-turn");
  assert.equal(speakingCreditAction("report"), "speaking-report");
  assert.equal(examCreditAction(10), "exam-10");
  assert.equal(examCreditAction(20), "exam-20");
  assert.ok(isAiAction("chat") && !isAiAction("toString") && !isAiAction("free") && !isAiAction(5));
});

test("every plan carries a monthly allowance that stacks on the free credits", () => {
  assert.deepEqual(subscriptionPlans.map(plan => [plan.program, plan.aiCredits]), [["entrance", 1500], ["ielts", 3000], ["sat", 2000]]);
  assert.equal(FREE_MONTHLY_CREDITS, 100);
  assert.equal(monthlyAllowance([]), 100);
  assert.equal(monthlyAllowance(["entrance"]), 1600);
  assert.equal(monthlyAllowance(["sat", "ielts"]), 5100);
  assert.equal(monthlyAllowance(["sat", "sat"]), 2100);
  assert.equal(monthlyAllowance(["unknown"]), 100);
  assert.equal(monthlyAllowance(["free"]), 100);
});

test("admin-set amounts replace the defaults and stay within their limits", () => {
  assert.deepEqual(ALLOWANCE_KEYS, ["free", "entrance", "ielts", "sat"]);
  assert.deepEqual(defaultAllowances(), { free: 100, entrance: 1500, ielts: 3000, sat: 2000 });
  const table = { free: 0, entrance: 500, ielts: 4000, sat: 2000 };
  assert.equal(monthlyAllowance([], table), 0);
  assert.equal(monthlyAllowance(["ielts", "entrance"], table), 4500);
  assert.ok(isAllowanceKey("free") && isAllowanceKey("sat") && !isAllowanceKey("toString") && !isAllowanceKey("jlpt"));
  assert.deepEqual([CREDIT_ALLOWANCE_LIMITS.min, CREDIT_ALLOWANCE_LIMITS.max, CREDIT_GRANT_LIMITS.min, CREDIT_GRANT_LIMITS.max], [0, 100000, 1, 10000]);
  for (const ok of [0, 1, 1500, 100000]) assert.ok(validAllowance(ok), String(ok));
  for (const bad of [-1, 100001, 1.5, "100", NaN, null]) assert.ok(!validAllowance(bad), String(bad));
  for (const ok of [1, 50, 10000]) assert.ok(validGrant(ok), String(ok));
  for (const bad of [0, -5, 10001, 2.5, "50", undefined]) assert.ok(!validGrant(bad), String(bad));
  assert.equal(formatUsd(14_814), "$0.0148");
  assert.equal(formatUsd(2_345_678), "$2.35");
  assert.equal(creditValueMicroUsd(1500), 1_500_000);
});

test("credit months follow the Ulaanbaatar calendar", () => {
  assert.equal(creditPeriod(Date.parse("2026-11-30T15:59:59Z")), "2026-11");
  assert.equal(creditPeriod(Date.parse("2026-11-30T16:00:00Z")), "2026-12");
  assert.equal(creditResetAt(Date.parse("2026-11-09T04:00:00Z")).toISOString(), "2026-11-30T16:00:00.000Z");
  assert.equal(creditResetAt(Date.parse("2026-12-20T04:00:00Z")).toISOString(), "2026-12-31T16:00:00.000Z");
  assert.equal(creditPeriod(creditResetAt(Date.parse("2026-12-20T04:00:00Z")).getTime()), "2027-01");
});

test("provider usage is read defensively and summed across retries", () => {
  assert.deepEqual(readUsage({ prompt_tokens: 1200, completion_tokens: 300, prompt_cache_hit_tokens: 200, prompt_cache_miss_tokens: 1000 }), { prompt: 1200, cached: 200, completion: 300 });
  assert.deepEqual(readUsage(undefined), { prompt: 0, cached: 0, completion: 0 });
  assert.deepEqual(readUsage({ prompt_tokens: "9", completion_tokens: -1, prompt_cache_hit_tokens: 1.5 }), { prompt: 0, cached: 0, completion: 0 });
  assert.deepEqual(readUsage({ prompt_tokens: 10, prompt_cache_hit_tokens: 50 }), { prompt: 10, cached: 10, completion: 0 });
  const meter = new UsageMeter();
  meter.add({ prompt_tokens: 20_000, completion_tokens: 4000, prompt_cache_hit_tokens: 0 });
  meter.add({ prompt_tokens: 20_000, completion_tokens: 3000, prompt_cache_hit_tokens: 19_000 });
  meter.add(null);
  assert.deepEqual({ prompt: meter.prompt, cached: meter.cached, completion: meter.completion, calls: meter.calls }, { prompt: 40_000, cached: 19_000, completion: 7000, calls: 3 });
  // 21,000 miss × 0.3 + 19,000 hit × 0.006 + 7,000 out × 1.2 µ$ = 6,300 + 114 + 8,400.
  assert.equal(meter.costMicroUsd(), 14_814);
});

test("only a well-formed receipt updates the page balance", () => {
  assert.deepEqual(readReceipt({ message: "hi", credits: { action: "chat", spent: 5, balance: 95, allowance: 100 } }), { action: "chat", spent: 5, balance: 95, allowance: 100 });
  for (const bad of [null, {}, { credits: null }, { credits: { action: "free", spent: 1, balance: 1, allowance: 1 } }, { credits: { action: "chat", spent: -1, balance: 1, allowance: 1 } }, { credits: { action: "chat", spent: 1, balance: 1.5, allowance: 2 } }, { credits: [] }]) {
    assert.equal(readReceipt(bad), null);
  }
  assert.equal(formatCredits(1500), "1,500");
});

function sourceFiles(dir) {
  return readdirSync(new URL("../" + dir, import.meta.url)).flatMap(name => {
    const path = dir + "/" + name;
    return statSync(new URL("../" + path, import.meta.url)).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test("every DeepSeek call is charged against credits, with its budget from the price list", () => {
  const charged = {
    "src/modules/tutor/service.ts": "\"math-tutor\"",
    "src/modules/exam-practice/service.ts": "\"practice-assistant\"",
    "src/modules/workspace/chat-service.ts": "review ? \"review-coach\" : \"chat\"",
    "src/modules/writing-lab/service.ts": "writingCreditAction(body.action)",
    "src/modules/speaking-lab/service.ts": "speakingCreditAction(body.action)",
    "src/modules/vocabulary/service.ts": "\"vocabulary-import\"",
    "src/modules/my-exams/service.ts": "examCreditAction(count)",
  };
  for (const [path, action] of Object.entries(charged)) {
    const source = text(path);
    assert.match(source, /chargeCredits\(/, path);
    assert.ok(source.includes(action), path);
    assert.match(source, /meter/, path);
  }
  // A new provider call must be added here (and charged) rather than bypass credits.
  const callers = sourceFiles("src").filter(path => !path.startsWith("src/generated/") && /api\.deepseek\.com|deepseekChat\(|deepseekTutor\(/.test(text(path)));
  assert.deepEqual(callers.sort(), [...Object.keys(charged), "src/modules/tutor/provider.ts"].sort());
  for (const path of ["src/modules/writing-lab/service.ts", "src/modules/vocabulary/service.ts", "src/modules/my-exams/service.ts"]) {
    assert.match(text(path), /AI_ACTIONS\[/, path);
    assert.doesNotMatch(text(path), /max_tokens:\s*\d/, path);
  }
  assert.match(text("src/modules/tutor/provider.ts"), /meter\?\.add\(data\.usage\)/);
});

test("credits are held atomically, refunded on failure and the schema change is additive", () => {
  const service = text("src/modules/credits/service.ts");
  assert.match(service, /"used" \+ \$\{credits\} <= \$\{base\} \+ "bonus"/);
  assert.match(service, /creditAllowances\(\)/);
  assert.match(service, /skipDuplicates: true/);
  assert.match(service, /status: "HELD"[^\n]*status: "REFUNDED"|where: \{ id: hold\.id, status: "HELD" \}, data: \{ status: "REFUNDED"/);
  assert.match(service, /catch \(error\) \{ await refund\(hold, meter\); throw error; \}/);
  assert.match(service, /super\(402,/);
  const migration = text("prisma/migrations/20261109190000_ai_credits/migration.sql");
  assert.match(migration, /CREATE TABLE "CreditPeriod"/);
  assert.match(migration, /CREATE TABLE "CreditCharge"/);
  assert.doesNotMatch(migration, /\bDROP\b|\bALTER TABLE "(?!Credit)/);
  const adminMigration = text("prisma/migrations/20261109210000_admin_credits/migration.sql");
  assert.match(adminMigration, /ADD COLUMN\s+"bonus" INTEGER NOT NULL DEFAULT 0/);
  assert.match(adminMigration, /CREATE TABLE "CreditAllowance"/);
  assert.doesNotMatch(adminMigration, /\bDROP\b/);
});

test("a priced-by-result charge holds its maximum and returns the rest when it settles", () => {
  const service = text("src/modules/credits/service.ts");
  assert.match(service, /credits > creditCost\(action\)\) throw/, "a hold never exceeds the listed price");
  assert.match(service, /Math\.min\(hold\.credits, Math\.max\(1, Math\.ceil\(price\)\)\)/, "the settled price stays within the hold");
  assert.match(service, /status: "SPENT", credits: spent/);
  assert.match(service, /used: \{ decrement: returned \}/);
  assert.match(service, /\$transaction\(async tx => \{\s+const marked = await tx\.creditCharge\.updateMany\(\{ where: \{ id: hold\.id, status: "HELD" \}, data: \{ status: "SPENT"/);
  const vocabulary = text("src/modules/vocabulary/service.ts");
  assert.match(vocabulary, /hold: vocabularyImportHold\(wanted\)/);
  assert.match(vocabulary, /settle: reply => vocabularyImportCredits\(readChars, reply\.added\)/);
  assert.match(vocabulary, /readChars = cleaned\.text\.length;/);
  assert.ok(vocabulary.indexOf("if (stored >= limit)") < vocabulary.indexOf("return chargeCredits("), "a full bank is refused before credits are held");
});

test("admin credit actions are validated, audited and kept server-side", () => {
  const admin = text("src/modules/admin/service.ts");
  assert.match(admin, /"grant-credits","set-credits"\]\.includes\(action\)/);
  assert.match(admin, /action==="grant-credits"&&!validGrant\(amount\)/);
  assert.match(admin, /action==="set-credits"&&\(!isAllowanceKey\(target\)\|\|!validAllowance\(amount\)\)/);
  assert.match(admin, /bonus:\{increment:Number\(amount\)\}/);
  assert.match(admin, /tx\.adminAudit\.create/);
  const ui = text("src/modules/admin/ui.tsx");
  assert.match(ui, /\["credits", "AI кредит"\]/);
  assert.match(ui, /\["grant-credits", "AI кредит олгосон"\]/);
  const page = text("src/app/admin/page.tsx");
  // The price history stays the first table on the Prices tab; credit amounts follow it.
  assert.ok(page.indexOf("Үнийн өөрчлөлтийн түүх") < page.indexOf("Кредитийн хэмжээний түүх"));
  assert.match(text("src/app/api/admin/export/route.ts"), /kind==="credits"/);
});
