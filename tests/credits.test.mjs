import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  AI_ACTIONS, AI_ACTION_IDS, ALLOWANCE_KEYS, CREDIT_ALLOWANCE_LIMITS, CREDIT_COSTS, CREDIT_GRANT_LIMITS, CREDIT_PACK_LIMITS, CREDIT_USD, DEEPSEEK_PRICE,
  DEFAULT_CREDIT_PACK, EXAM_PRICE, EXAM_RATE, FREE_MONTHLY_CREDITS, MARGIN_ACTIONS, READING_PRACTICE_RATE, UsageMeter, VOCABULARY_IMPORT_PRICE, VOCABULARY_IMPORT_RATE, costNanoUsd, creditCost, creditPeriod, creditRange, creditRangeLabel,
  creditResetAt, creditValueMicroUsd, creditsForTokens,
  defaultAllowances, examCostNano, examCredits, examHold, examOutputTokens, formatCredits, formatUsd, isAiAction, isAllowanceKey, readReceipt,
  readUsage, readingPracticeCredits, readingPracticeHold, speakingCreditAction, validAllowance, validCreditPack, validGrant, vocabularyImportCostNano, vocabularyImportCredits, vocabularyImportHold, writingCreditAction,
} from "../src/modules/credits/pricing.ts";
import {
  allocateCredits, available, creditTotals, planTermCredits, returnParts, spendOrder, termMonthsStarted, totalsAfter,
} from "../src/modules/credits/buckets.ts";
import { addCalendarMonth } from "../src/modules/subscriptions/plans.ts";
import { VOCABULARY_LIMITS } from "../src/modules/vocabulary/contracts.ts";
import { READING_LIMITS } from "../src/modules/reading-lab/contracts.ts";
import { MY_EXAM_LIMITS } from "../src/modules/my-exams/contracts.ts";
import { AI_IMAGE_LIMITS } from "../src/modules/ai-images/contracts.ts";
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
    "vocabulary-import": 47, "exam": 40, "exam-10": 13, "exam-20": 17, "reading-practice": 15,
  });
  assert.deepEqual(MARGIN_ACTIONS, ["vocabulary-import", "exam"]);
  for (const action of AI_ACTION_IDS) {
    const { inputTokens, outputTokens } = AI_ACTIONS[action];
    const usd = (inputTokens * DEEPSEEK_PRICE.inputCacheMiss + outputTokens * DEEPSEEK_PRICE.output) / 1e6;
    // The fixed charge always covers its whole token budget, and never by a full extra credit.
    assert.ok(creditCost(action) * CREDIT_USD >= usd - 1e-12, action);
    // An action sold with a margin costs at least twice its budget; every other action is priced at cost.
    if (MARGIN_ACTIONS.includes(action)) assert.ok(creditCost(action) * CREDIT_USD >= 2 * usd, action);
    else assert.ok((creditCost(action) - 1) * CREDIT_USD < usd, action);
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

test("a vocabulary import is priced by the new words found, with a margin over its DeepSeek cost", () => {
  const { inputTokens, outputTokens } = AI_ACTIONS["vocabulary-import"];
  // The cost model fills the action's token budget: a full-length document and the most words.
  assert.equal(VOCABULARY_IMPORT_RATE.promptTokens + VOCABULARY_LIMITS.textChars / VOCABULARY_IMPORT_RATE.charsPerToken, inputTokens);
  assert.ok(VOCABULARY_IMPORT_RATE.tokensPerWord * VOCABULARY_LIMITS.importWords <= outputTokens);
  assert.equal(vocabularyImportCostNano(VOCABULARY_LIMITS.textChars, VOCABULARY_LIMITS.importWords), costNanoUsd(inputTokens, VOCABULARY_IMPORT_RATE.tokensPerWord * VOCABULARY_LIMITS.importWords));
  // The value price: a base fee plus a per-word fee that gets cheaper as the list grows.
  assert.deepEqual(VOCABULARY_IMPORT_PRICE, { base: 3, tiers: [{ upTo: 20, tenths: 5 }, { upTo: 60, tenths: 4 }, { upTo: 120, tenths: 3 }], floorMargin: 2 });
  assert.equal(VOCABULARY_IMPORT_PRICE.tiers.at(-1).upTo, VOCABULARY_LIMITS.importWords, "the tiers cover one import");
  assert.equal(vocabularyImportCredits(2_000, 10), 8);
  assert.equal(vocabularyImportCredits(5_000, 20), 13);
  assert.equal(vocabularyImportCredits(10_000, 40), 21);
  assert.equal(vocabularyImportCredits(20_000, 100), 41);
  assert.equal(vocabularyImportCredits(VOCABULARY_LIMITS.textChars, VOCABULARY_LIMITS.importWords), 47);
  assert.equal(vocabularyImportCredits(VOCABULARY_LIMITS.textChars, VOCABULARY_LIMITS.importWords), creditCost("vocabulary-import"), "the listed price is the most one import can cost");
  // The same number of words costs the same from a short list as from a medium file; more words cost more, less each.
  assert.equal(vocabularyImportCredits(2_000, 20), vocabularyImportCredits(12_000, 20));
  assert.ok(vocabularyImportCredits(5_000, 10) < vocabularyImportCredits(5_000, 100));
  assert.ok(vocabularyImportCredits(5_000, 120) / 120 < vocabularyImportCredits(5_000, 20) / 20, "a longer list is cheaper per word");
  // A long document that yields few words is sold at the cost floor, never below it.
  assert.equal(vocabularyImportCredits(45_000, 10), 16);
  assert.ok(vocabularyImportCredits(45_000, 10) > vocabularyImportCredits(2_000, 10));
  assert.deepEqual([1, 10, 20, 40, 60, 120].map(vocabularyImportHold), [15, 16, 18, 21, 29, 47]);
  // Every import earns at least the floor margin over its DeepSeek peak list cost, and the hold covers it.
  for (const words of [0, 1, 10, 20, 50, 100, 120]) {
    for (const chars of [0, 40, 2_000, 20_000, 45_000]) {
      for (const images of chars ? [0] : [0, 1, 4]) {
        const price = vocabularyImportCredits(chars, words, images);
        const cost = vocabularyImportCostNano(chars, words, images) / 1e9;
        assert.ok(Number.isSafeInteger(price) && price >= VOCABULARY_IMPORT_PRICE.base && price <= creditCost("vocabulary-import"), `${chars}/${words}/${images}`);
        assert.ok(price * CREDIT_USD >= VOCABULARY_IMPORT_PRICE.floorMargin * cost - 1e-12, `margin ${chars}/${words}/${images}`);
        if (!images) assert.ok(price <= vocabularyImportHold(words), `hold ${chars}/${words}`);
      }
    }
  }
  assert.equal(vocabularyImportCredits(1e9, 1e9), 47, "input is clamped to one import's bounds");
  assert.equal(vocabularyImportCredits(NaN, NaN), 47, "malformed input prices as the maximum");
  assert.equal(vocabularyImportCredits(-5, -5), 3);
  assert.deepEqual(creditRange("vocabulary-import"), { min: 4, max: 47 });
  assert.equal(creditRangeLabel("vocabulary-import"), "4–47");
  assert.deepEqual(creditRange("chat"), { min: 5, max: 5 });
  assert.equal(creditRangeLabel("exam-20"), "17");
});

test("an exam from a file is priced by its questions, with a margin over its DeepSeek cost", () => {
  const { inputTokens, outputTokens } = AI_ACTIONS["exam"];
  // The cost model fills the action's token budget: a full-length document and the most questions.
  assert.equal(EXAM_RATE.promptTokens + MY_EXAM_LIMITS.textChars / EXAM_RATE.charsPerToken, inputTokens);
  assert.equal(examOutputTokens(MY_EXAM_LIMITS.questions), outputTokens);
  assert.deepEqual([5, 10, 20, 99, NaN].map(examOutputTokens), [2600, 4400, 8000, 8000, 8000], "the reply budget follows the count and stops at the listed budget");
  assert.equal(examCostNano(MY_EXAM_LIMITS.textChars, MY_EXAM_LIMITS.questions), costNanoUsd(inputTokens, outputTokens));
  // Two credits a question on an ordinary file: more questions cost more, the same count costs the same.
  assert.deepEqual(EXAM_PRICE, { perQuestion: 2, floorMargin: 2 });
  assert.deepEqual([5, 10, 15, 20].map(count => examCredits(6_000, count)), [10, 20, 30, 40]);
  assert.equal(examCredits(2_000, 12), examCredits(9_000, 12));
  assert.equal(examCredits(0, 10, 4), 20, "four page photos");
  // A few questions from a long document are sold at the cost floor, never below it.
  assert.equal(examCredits(MY_EXAM_LIMITS.textChars, 5), 21);
  assert.equal(examCredits(MY_EXAM_LIMITS.textChars, 10), 25);
  assert.ok(examCredits(MY_EXAM_LIMITS.textChars, 5) > examCredits(6_000, 5));
  // Holds: a document at the full-file price for its count, page photos by their known number.
  assert.deepEqual([5, 10, 15, 20].map(count => examHold(count)), [21, 25, 30, 40]);
  assert.deepEqual([5, 10, 20].map(count => examHold(count, 4)), [10, 20, 40]);
  assert.equal(examHold(MY_EXAM_LIMITS.questions), creditCost("exam"), "the listed price is the most one exam can cost");
  // Every exam earns at least the floor margin over its DeepSeek peak list cost, and the hold covers it.
  for (const questions of [MY_EXAM_LIMITS.minQuestions, 7, 10, 14, MY_EXAM_LIMITS.questions]) {
    for (const chars of [0, 80, 6_000, 20_000, MY_EXAM_LIMITS.textChars]) {
      for (const images of chars ? [0] : [0, 1, AI_IMAGE_LIMITS.perUpload]) {
        const price = examCredits(chars, questions, images);
        const cost = examCostNano(chars, questions, images) / 1e9;
        assert.ok(Number.isSafeInteger(price) && price >= questions * EXAM_PRICE.perQuestion && price <= creditCost("exam"), `${chars}/${questions}/${images}`);
        assert.ok(price * CREDIT_USD >= EXAM_PRICE.floorMargin * cost - 1e-12, `margin ${chars}/${questions}/${images}`);
        assert.ok(price <= examHold(questions, images), `hold ${chars}/${questions}/${images}`);
        // Fewer questions delivered than asked for never cost more than the hold for the asked count.
        assert.ok(examCredits(chars, Math.ceil(questions * 0.7), images) <= examHold(questions, images), `partial ${chars}/${questions}/${images}`);
      }
    }
  }
  assert.equal(examCredits(1e9, 1e9, 1e9), 40, "input is clamped to one exam's bounds");
  assert.equal(examCredits(NaN, NaN), 40, "malformed input prices as the maximum");
  assert.ok(examCredits(-5, -5) >= 1);
  assert.deepEqual(creditRange("exam"), { min: 10, max: 40 });
  assert.equal(creditRangeLabel("exam"), "10–40");
  // The two flat prices it replaced stay listed only so earlier charges keep their name in admin reports.
  assert.equal(creditRangeLabel("exam-10"), "13");
  assert.match(AI_ACTIONS["exam-10"].label, /хуучин үнэ/);
  assert.match(AI_ACTIONS["exam-20"].label, /хуучин үнэ/);
});

test("a reading practice is priced by the material read and the passage and questions written", () => {
  const { inputTokens, outputTokens } = AI_ACTIONS["reading-practice"];
  const rate = READING_PRACTICE_RATE;
  // The rates fill the action's token budget, so its listed price is the most one practice can cost.
  assert.equal(rate.promptTokens + READING_LIMITS.textChars / rate.charsPerToken, inputTokens);
  assert.equal(rate.replyTokens + READING_LIMITS.passageWords.max * rate.tokensPerPassageWord + READING_LIMITS.questions.max * rate.tokensPerQuestion, outputTokens);
  assert.equal(readingPracticeCredits(READING_LIMITS.textChars, READING_LIMITS.passageWords.max, READING_LIMITS.questions.max), creditCost("reading-practice"));
  // The first live call (1,935 characters → 351 words, 12 questions; $0.0027 real) costs 6, not the flat 15.
  assert.equal(readingPracticeCredits(1_935, 351, 12), 6);
  assert.ok(readingPracticeCredits(1_935, 351, 12) * CREDIT_USD >= 0.0027, "never below the measured real cost");
  assert.equal(readingPracticeCredits(12_000, 800, 12), 8);
  assert.equal(readingPracticeCredits(0, 600, 12, 4), 7, "four page photos");
  assert.ok(readingPracticeCredits(2_000, 350, 12) < readingPracticeCredits(30_000, 350, 12));
  assert.ok(readingPracticeCredits(5_000, 300, 12) < readingPracticeCredits(5_000, 900, 12));
  assert.ok(readingPracticeCredits(5_000, 600, 8) < readingPracticeCredits(5_000, 600, 14));
  // Holds: pasted text by its length, photos by their count, a document at the full-file price.
  assert.equal(readingPracticeHold(1_935), 8);
  assert.equal(readingPracticeHold(0, 4), 9);
  assert.equal(readingPracticeHold(READING_LIMITS.textChars), 15);
  // The hold always covers the settled price, which stays between one credit and the listed maximum.
  for (const chars of [0, READING_LIMITS.minSourceChars, 5_000, 20_000, READING_LIMITS.textChars]) {
    for (const words of [READING_LIMITS.passageWords.min, 600, READING_LIMITS.passageWords.max]) {
      for (const questions of [READING_LIMITS.questions.min, 12, READING_LIMITS.questions.max]) {
        for (const images of chars ? [0] : [0, 1, AI_IMAGE_LIMITS.perUpload]) {
          const price = readingPracticeCredits(chars, words, questions, images);
          assert.ok(price >= 1 && price <= readingPracticeHold(chars, images) && price <= creditCost("reading-practice") && Number.isSafeInteger(price), `${chars}/${words}/${questions}/${images}`);
        }
      }
    }
  }
  assert.equal(readingPracticeCredits(1e9, 1e9, 1e9, 1e9), 15, "input is clamped to one practice's bounds");
  assert.equal(readingPracticeCredits(NaN, NaN, NaN, NaN), 15, "malformed input prices as the maximum");
  assert.deepEqual(creditRange("reading-practice"), { min: 4, max: 15 });
  assert.equal(creditRangeLabel("reading-practice"), "4–15");
});

test("feature actions map to their price list entries", () => {
  assert.equal(writingCreditAction("ideas"), "writing-ideas");
  assert.equal(writingCreditAction("grammar"), "writing-grammar");
  assert.equal(writingCreditAction("feedback"), "writing-feedback");
  for (const action of ["start", "answer", "advance", "hint"]) assert.equal(speakingCreditAction(action), "speaking-turn");
  assert.equal(speakingCreditAction("report"), "speaking-report");
  assert.ok(isAiAction("exam") && isAiAction("exam-20"));
  assert.ok(isAiAction("chat") && !isAiAction("toString") && !isAiAction("free") && !isAiAction(5));
});

test("every plan carries monthly credits on top of the free ones", () => {
  assert.deepEqual(subscriptionPlans.map(plan => [plan.program, plan.aiCredits]), [["entrance", 1500], ["ielts", 3000], ["sat", 2000]]);
  assert.equal(FREE_MONTHLY_CREDITS, 100);
});

const UB = 8 * 3600_000;
const at = text => Date.parse(text);

test("plan credits build up over a subscription term and only lapse when it ends", () => {
  // Bought 2026-11-25 10:00 Ulaanbaatar for one month: one month of credits, nothing new on 1 December.
  const start = at("2026-11-25T02:00:00Z"), end = addCalendarMonth(new Date(start)).getTime();
  assert.equal(end, at("2026-12-25T02:00:00Z"));
  assert.equal(termMonthsStarted(start, end, start), 1);
  assert.equal(termMonthsStarted(start, end, at("2026-12-01T00:00:00Z") - UB), 1, "the 1st of the month changes nothing");
  assert.equal(termMonthsStarted(start, end, end - 1), 1);
  assert.equal(planTermCredits(3000, start, end, at("2026-12-10T00:00:00Z")), 3000);
  // Renewed before it ended: the second month's credits arrive when that month begins, on top of what is left.
  const renewed = addCalendarMonth(new Date(end)).getTime();
  assert.equal(termMonthsStarted(start, renewed, end - 1), 1);
  assert.equal(termMonthsStarted(start, renewed, end), 2);
  assert.equal(planTermCredits(3000, start, renewed, end + 3600_000), 6000);
  // Month ends follow the billing calendar, including short months (31 January -> 28 February).
  const jan31 = at("2027-01-30T16:00:00Z"), feb28 = addCalendarMonth(new Date(jan31)).getTime(), mar28 = addCalendarMonth(new Date(feb28)).getTime();
  assert.equal(termMonthsStarted(jan31, mar28, feb28 - 1), 1);
  assert.equal(termMonthsStarted(jan31, mar28, feb28), 2);
  // Not started, already over, malformed and absurd terms.
  assert.equal(termMonthsStarted(start, end, start - 1), 0);
  assert.equal(termMonthsStarted(start, start, start), 0);
  assert.equal(termMonthsStarted(Number.NaN, end, start), 0);
  assert.equal(termMonthsStarted(at("1990-01-01T00:00:00Z"), at("2090-01-01T00:00:00Z"), at("2080-01-01T00:00:00Z")), 240);
  assert.equal(planTermCredits(-5, start, end, start), 0);
});

test("charges take the credits that lapse first and refunds return them to the same place", () => {
  const month = { kind: "month", period: "2026-11", capacity: 100, used: 90, endsAt: at("2026-11-30T16:00:00Z") };
  const ielts = { kind: "plan", id: "t-ielts", capacity: 3000, used: 2995, endsAt: at("2026-11-20T02:00:00Z") };
  const sat = { kind: "plan", id: "t-sat", capacity: 2000, used: 0, endsAt: at("2026-12-20T02:00:00Z") };
  const wallet = { kind: "wallet", capacity: 1000, used: 0, endsAt: null };
  assert.deepEqual(spendOrder([wallet, sat, month, ielts]).map(bucket => bucket.id ?? bucket.kind), ["t-ielts", "month", "t-sat", "wallet"]);
  assert.deepEqual(allocateCredits([month, ielts, sat, wallet], 12), [
    { kind: "plan", id: "t-ielts", credits: 5 }, { kind: "month", period: "2026-11", credits: 7 },
  ]);
  // Purchased credits are used only once everything that lapses is gone.
  const spentOut = [{ ...month, used: 100 }, { ...ielts, used: 3000 }, { ...sat, used: 2000 }, wallet];
  assert.deepEqual(allocateCredits(spentOut, 5), [{ kind: "wallet", credits: 5 }]);
  assert.equal(allocateCredits(spentOut, 1001), null);
  assert.equal(allocateCredits([month], 0), null);
  assert.equal(allocateCredits([month], 2.5), null);
  assert.equal(allocateCredits([{ ...month, used: 150 }], 1), null, "an over-used bucket holds nothing");
  // A settle returns the unused part last-taken first; a refund returns everything.
  const parts = [{ kind: "month", period: "2026-11", credits: 4 }, { kind: "plan", id: "t-sat", credits: 6 }, { kind: "wallet", credits: 7 }];
  assert.deepEqual(returnParts(parts, 9), { kept: [{ kind: "month", period: "2026-11", credits: 4 }, { kind: "plan", id: "t-sat", credits: 4 }], returned: [{ kind: "wallet", credits: 7 }, { kind: "plan", id: "t-sat", credits: 2 }] });
  assert.deepEqual(returnParts(parts, 0).kept, parts);
  assert.deepEqual(returnParts(parts, 17).kept, []);
  assert.equal(returnParts(parts, 99).returned.reduce((sum, part) => sum + part.credits, 0), 17);
  assert.deepEqual(returnParts(parts, Number.NaN).returned, []);
});

test("the meter counts every available credit; purchased credits fill it rather than stretch it", () => {
  const buckets = [
    { kind: "month", period: "2026-11", capacity: 100, used: 40, endsAt: 1 },
    { kind: "plan", id: "t", capacity: 3000, used: 500, endsAt: 2 },
    { kind: "wallet", capacity: 5000, used: 4000, endsAt: null },
  ];
  assert.equal(available(buckets[0]), 60);
  assert.deepEqual(creditTotals(buckets), { balance: 3560, allowance: 4100, used: 540 });
  assert.deepEqual(creditTotals([{ kind: "month", period: "x", capacity: 100, used: 130, endsAt: 1 }]), { balance: 0, allowance: 100, used: 130 });
  assert.deepEqual(totalsAfter({ balance: 3560, allowance: 4100 }, [{ kind: "plan", id: "t", credits: 5 }, { kind: "wallet", credits: 3 }]), { balance: 3552, allowance: 4097 });
  assert.deepEqual(totalsAfter({ balance: 2, allowance: 2 }, [{ kind: "wallet", credits: 5 }]), { balance: 0, allowance: 0 });
});

test("the credit pack has admin-editable size and price within bounds", () => {
  assert.deepEqual(DEFAULT_CREDIT_PACK, { credits: 1000, amountMnt: 5000 });
  assert.ok(validCreditPack(DEFAULT_CREDIT_PACK.credits, DEFAULT_CREDIT_PACK.amountMnt));
  assert.deepEqual(CREDIT_PACK_LIMITS, { credits: { min: 10, max: 100000 }, amountMnt: { min: 1000, max: 1000000, step: 100 } });
  for (const [credits, amount] of [[10, 1000], [100000, 1000000], [2500, 12300]]) assert.ok(validCreditPack(credits, amount), `${credits}/${amount}`);
  for (const [credits, amount] of [[9, 5000], [100001, 5000], [1000, 999], [1000, 1000100], [1000, 5050], [10.5, 5000], ["1000", 5000], [1000, "5000"], [null, undefined]]) {
    assert.ok(!validCreditPack(credits, amount), `${credits}/${amount}`);
  }
});

test("admin-set amounts replace the defaults and stay within their limits", () => {
  assert.deepEqual(ALLOWANCE_KEYS, ["free", "entrance", "ielts", "sat"]);
  assert.deepEqual(defaultAllowances(), { free: 100, entrance: 1500, ielts: 3000, sat: 2000 });
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
    "src/modules/my-exams/service.ts": "chargeCredits(userId, \"exam\",",
    "src/modules/reading-lab/service.ts": "\"reading-practice\"",
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
  for (const path of ["src/modules/writing-lab/service.ts", "src/modules/vocabulary/service.ts", "src/modules/my-exams/service.ts", "src/modules/reading-lab/service.ts"]) {
    assert.match(text(path), /AI_ACTIONS\[/, path);
    assert.doesNotMatch(text(path), /max_tokens:\s*\d/, path);
  }
  assert.match(text("src/modules/tutor/provider.ts"), /meter\?\.add\(data\.usage\)/);
});

test("credits are held atomically, refunded on failure and the schema change is additive", () => {
  const service = text("src/modules/credits/service.ts");
  // One row lock per student serializes holds, and every take is still a compare-and-set.
  assert.match(service, /SELECT "userId" FROM "CreditWallet" WHERE "userId" = \$\{userId\} FOR UPDATE/);
  assert.match(service, /"used" \+ \$\{n\} <= \$\{capacity\} \+ "bonus"/);
  assert.match(service, /"used" \+ \$\{n\} <= \$\{capacity\}`/);
  assert.match(service, /"used" \+ \$\{n\} <= "purchased"/);
  assert.match(service, /if \(!await moveCredits\(tx, userId, part, 1, capacity\)\) throw new NotEnoughCredits/);
  assert.match(service, /creditAllowances\(\)/);
  assert.match(service, /skipDuplicates: true/);
  assert.match(service, /where: \{ id: hold\.id, status: "HELD" \}, data: \{ status: "REFUNDED"/);
  assert.match(service, /if \(marked\.count\) for \(const part of hold\.parts\) await moveCredits\(tx, hold\.userId, part, -1\)/);
  assert.match(service, /catch \(error\) \{ await refund\(hold, meter\); throw error; \}/);
  assert.match(service, /super\(402,/);
  // Plan credits come from the subscription term (keyed by its start), not from the calendar month.
  assert.match(service, /planTermCredits\(table\[plan\.program\], plan\.startsAt\.getTime\(\), plan\.endsAt\.getTime\(\), now\.getTime\(\)\)/);
  assert.match(service, /termStart: plan\.startsAt/);
  const terms = text("prisma/migrations/20261109230000_credit_terms_and_packs/migration.sql");
  assert.match(terms, /ADD COLUMN\s+"parts" JSONB;/);
  for (const table of ["CreditPlanTerm", "CreditWallet", "CreditPack", "CreditOrder"]) assert.match(terms, new RegExp(`CREATE TABLE "${table}"`));
  assert.match(terms, /CREATE UNIQUE INDEX "CreditPlanTerm_userId_program_termStart_key"/);
  assert.doesNotMatch(terms, /\bDROP\b|^\s*(?:DELETE|UPDATE)\b|\bALTER TABLE "(?!Credit)/m);
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
  assert.match(service, /credits > maxCreditCost\(action\)\) throw/, "a hold never exceeds the listed price with the most images a message may carry");
  assert.match(service, /options\.hold \?\? creditCost\(action, options\.images \?\? 0\)/, "a conversation reply holds its price plus its own images only");
  assert.match(service, /Math\.min\(hold\.credits, Math\.max\(1, Math\.ceil\(price\)\)\)/, "the settled price stays within the hold");
  assert.match(service, /status: "SPENT", credits: spent, parts: asJson\(split\.kept\)/);
  assert.match(service, /const split = returnParts\(hold\.parts, hold\.credits - spent\)/);
  assert.match(service, /for \(const part of split\.returned\) await moveCredits\(tx, hold\.userId, part, -1\)/);
  assert.match(service, /\$transaction\(async tx => \{\s+const marked = await tx\.creditCharge\.updateMany\(\{ where: \{ id: hold\.id, status: "HELD" \}, data: \{ status: "SPENT"/);
  const vocabulary = text("src/modules/vocabulary/service.ts");
  assert.match(vocabulary, /hold: vocabularyImportHold\(wanted\)/);
  assert.match(vocabulary, /settle: reply => vocabularyImportCredits\(readChars, reply\.found, pictures\)/, "the charge follows the new words found");
  assert.match(vocabulary, /readChars = cleaned\.text\.length;/);
  assert.ok(vocabulary.indexOf("if (stored >= limit)") < vocabulary.indexOf("return chargeCredits("), "a full bank is refused before credits are held");
  const exams = text("src/modules/my-exams/service.ts");
  assert.match(exams, /hold: examHold\(count, pictures\)/);
  // The reply now carries the exam saved on the account; the charge still follows its question count.
  assert.match(exams, /settle: reply => examCredits\(readChars, reply\.exam\.questions\.length, pictures\)/, "the charge follows the questions delivered");
  assert.match(exams, /readChars = cleaned\.text\.length;/);
  assert.match(exams, /max_tokens: Math\.min\(AI_ACTIONS\["exam"\]\.outputTokens, examOutputTokens\(count\)\)/, "the provider never writes more than the price covers");
  assert.doesNotMatch(exams, /exam-10|exam-20/, "the retired flat prices are never charged");
});

test("admin credit actions are validated, audited and kept server-side", () => {
  const admin = text("src/modules/admin/service.ts");
  assert.match(admin, /"grant-credits","set-credits","set-credit-pack"\]\.includes\(action\)/);
  assert.match(admin, /action==="set-credit-pack"&&\(target!==CREDIT_PACK_KEY\|\|!validCreditPack\(credits,amount\)\)/);
  assert.match(admin, /action!=="set-credit-pack"&&credits!==undefined/);
  assert.match(admin, /action==="grant-credits"&&!validGrant\(amount\)/);
  assert.match(admin, /action==="set-credits"&&\(!isAllowanceKey\(target\)\|\|!validAllowance\(amount\)\)/);
  assert.match(admin, /bonus:\{increment:Number\(amount\)\}/);
  assert.match(admin, /tx\.adminAudit\.create/);
  const ui = text("src/modules/admin/ui.tsx");
  assert.match(ui, /\["credits", "AI кредит"\]/);
  assert.match(ui, /\["grant-credits", "AI кредит олгосон"\]/);
  assert.match(ui, /\["set-credit-pack", "AI кредит багц өөрчилсөн"\]/);
  const page = text("src/app/admin/page.tsx");
  // The price history stays the first table on the Prices tab; credit amounts follow it.
  assert.ok(page.indexOf("Үнийн өөрчлөлтийн түүх") < page.indexOf("Кредитийн хэмжээний түүх"));
  assert.match(text("src/app/api/admin/export/route.ts"), /kind==="credits"/);
});

test("a credit pack purchase is simulated, checked on the server and adds credits once", () => {
  const purchase = text("src/modules/credits/purchase.ts");
  assert.match(purchase, /if \(!mockPilotPaymentsEnabled\(\)\) throw new ApiError\(403/);
  // The price the page showed must still be the price on sale; the order itself is checked again on confirm.
  assert.match(purchase, /pack\.credits !== shown\.credits \|\| pack\.amountMnt !== shown\.amountMnt\) throw new ApiError\(409/);
  assert.match(purchase, /order\.credits !== pack\.credits \|\| order\.amountMnt !== pack\.amountMnt \|\| order\.currency !== "MNT" \|\| order\.provider !== "MOCK"/);
  assert.match(purchase, /findFirst\(\{ where: \{ id, userId \}/, "an order is only ever read by its owner");
  assert.match(purchase, /const changed = await tx\.creditOrder\.updateMany\(\{ where: \{ id, userId, status: \{ not: "PAID" \} \}, data: \{ status: "PAID"/);
  assert.match(purchase, /if \(changed\.count\) await tx\.creditWallet\.upsert\(\{ where: \{ userId \}, create: \{ userId, purchased: order\.credits \}, update: \{ purchased: \{ increment: order\.credits \} \} \}\)/);
  for (const path of ["src/app/api/credits/orders/route.ts", "src/app/api/credits/orders/[id]/confirm/route.ts"]) {
    const route = text(path);
    assert.ok(route.indexOf("checkOrigin(request)") < route.indexOf("apiUser(request)"), path);
    assert.match(route, /Object\.keys\(input\)\.length !== [12]/, path);
  }
  // The plans page keeps a compact pack row at #credits; the price list, rules and history are gone.
  const plans = text("src/app/workspace/plans/page.tsx");
  assert.match(plans, /className="pricing-single pricing-topup" id="credits"/);
  assert.match(plans, /<CreditTopUp credits=\{pack\.credits\} amountMnt=\{pack\.amountMnt\}/);
  assert.doesNotMatch(plans, /pricing-ai|creditHistory|AI_ACTION_IDS|DEEPSEEK_PRICE/);
  assert.doesNotMatch(text("src/app/workspace/plans/plans.css"), /pricing-ai/);
});

test("a dev server replaces a cached database client once the generated schema changes", () => {
  // After `prisma generate` (new credit tables), a client cached on globalThis would not know them and the admin
  // Prices tab failed with `db.creditPack` undefined until a restart.
  const db = text("src/lib/db.ts");
  assert.match(db, /name\.endsWith\("ScalarFieldEnum"\)/);
  assert.match(db, /if \(globalDb\.educationDb && globalDb\.educationDbSchema === SCHEMA\) return globalDb\.educationDb;/);
  assert.match(db, /void globalDb\.educationDb\.\$disconnect\(\)\.catch\(\(\) => \{\}\)/);
  assert.match(db, /globalDb\.educationDbSchema = SCHEMA;/);
});
