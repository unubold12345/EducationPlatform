import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EXPERT_CRITERIA, EXPERT_LIMITS, EXPERT_MODEL, EXPERT_SCHEMA, STRONG_LIMITS, STRONG_SHAPE, expertCostUsd, expertPlan, expertSpentMessage, expertSystem, expertTitle, expertUser,
  normalizeExpertReview, readExpertReview, strongSystem, validExpertInput,
} from "../src/modules/writing-lab/expert.ts";
import { subscriptionPlans, legacyPlans } from "../src/modules/subscriptions/plans.ts";
import { AI_ACTIONS, creditCost } from "../src/modules/credits/pricing.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const ESSAY = Array.from({ length: 4 }, (_, i) => `Paragraph ${i + 1}: Nowadays many people thinks that online lessons is better than classrooms, however I believe classrooms will not dissapear because students need teachers who notice when they are confused.`).join("\n\n");
const VALID = { task: "essay", promptId: "e-online-school", topic: "", essay: ESSAY, language: "mn" };
const REPLY = {
  summary: "Тодорхой байр суурьтай ч санаа хангалттай хөгжөөгүй.",
  bands: { task: 6, coherence: 6.4, lexical: 5.6, grammar: 12 },
  criteria: [
    { criterion: "grammar", evidence: "\"people thinks\" гэх мэт алдаа.", next: "Нийлмэл өгүүлбэр нэм." },
    { criterion: "task", evidence: "Байр суурь тодорхой.", next: "Жишээ нэм." },
    { criterion: "task", evidence: "duplicate is ignored", next: "" },
  ],
  priorities: ["Жишээ нэм", "Холбоос үгээ олон янз болго", "Үйл үгийн тохиролцоо", ""],
  paragraphs: [{ paragraph: 1, role: "Introduction", comment: "Сэдвийг танилцуулсан.", suggestion: "Байр сууриа тодорхой бич." }, { paragraph: 2, role: "Body", comment: "", suggestion: "" }],
  corrections: [
    { original: "people thinks", better: "people think", why: "Subject-verb agreement", kind: "grammar" },
    { original: "not in the essay", better: "x", why: "invented", kind: "grammar" },
    { original: "dissapear", better: "dissapear", why: "no change", kind: "spelling" },
    { original: "dissapear", better: "disappear", why: "Spelling", kind: "odd" },
  ],
  vocabulary: [{ word: "better", better: "more effective", example: "Online lessons can be more effective for revision." }, { word: "same", better: "SAME", example: "" }],
  model_answer: "Many people believe online lessons will replace classrooms. I partly disagree.\n\n\nTeachers notice confusion, schools build social skills, and screens cannot replace this. ".repeat(3),
};

test("the Claude review is a plan feature: none for free accounts, Basic 2 and Pro 5 a plan month", () => {
  assert.equal(EXPERT_MODEL, "claude-opus-5-5");
  assert.equal(EXPERT_LIMITS.freeReviews, 0);
  assert.deepEqual(subscriptionPlans.map(plan => [plan.program, plan.expertReviews]), [["entrance", 0], ["english_basic", 2], ["english_pro", 5], ["asian_basic", 0], ["asian_pro", 0]]);
  assert.deepEqual(legacyPlans.map(plan => [plan.program, plan.expertReviews]), [["language_basic", 2], ["language", 5], ["ielts", 5], ["sat", 0]]);
  assert.match(subscriptionPlans[1].features.join("|"), /Шинжээчийн эссэ үнэлгээ: сард 2/);
  assert.match(subscriptionPlans[2].features.join("|"), /Шинжээчийн эссэ үнэлгээ: сард 5/);
  assert.equal(expertPlan([]), null, "no plan: no Claude review");
  assert.equal(expertPlan(["entrance"]), null, "ЭЕШ adds no reviews");
  assert.equal(expertPlan(["language_basic"]).reviews, 2);
  assert.deepEqual(expertPlan(["language_basic", "language"]), { program: "language", title: "Гадаад хэл Pro (хуучин багц)", reviews: 5 }, "the largest plan wins");
  assert.deepEqual(expertPlan(["english_basic", "english_pro"]), { program: "english_pro", title: "Англи хэл Pro", reviews: 5 });
  assert.equal(expertPlan(["asian_pro"]), null, "the Essay Studio is English: the Asian plans add no reviews");
  assert.equal(expertPlan(["ielts"]).reviews, 5);
  const free = expertSpentMessage({ plan: null, limit: 0, used: 0, remaining: 0, resetsAt: null, planEnds: false });
  assert.match(free, /Англи хэл Basic \(сард 2\), Pro \(сард 5\) багцад багтана\. Бүрэн үнэлгээг кредитээр/);
  assert.doesNotMatch(free, /Үнэгүй/);
  // Students never see a provider or model name (owner rule 2026-11-18).
  for (const message of [free, expertSpentMessage({ plan: "Гадаад хэл Basic", limit: 2, used: 2, remaining: 0, resetsAt: 1, planEnds: false })]) assert.doesNotMatch(message, /Claude|DeepSeek|Anthropic|Opus/i);
  for (const path of ["src/modules/writing-lab/client.tsx", "src/modules/writing-lab/expert-client.tsx", "src/app/workspace/plans/page.tsx", "src/modules/exams/speaking-examiner-view.tsx"]) {
    const shown = text(path).split("\n").filter(line => !/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(line)).join("\n");
    assert.doesNotMatch(shown, /Claude|DeepSeek|Anthropic|Opus/, path);
  }
  assert.doesNotMatch(JSON.stringify([...subscriptionPlans, ...legacyPlans].map(plan => [plan.title, plan.description, plan.features])), /Claude|DeepSeek|Anthropic|Opus/i);
  const basic = expertSpentMessage({ plan: "Гадаад хэл Basic", limit: 2, used: 2, remaining: 0, resetsAt: Date.UTC(2026, 11, 3, 4), planEnds: false });
  assert.match(basic, /Энэ сарын 2 шинжээчийн үнэлгээ дууссан\. 2026-12-03-нд шинэчлэгдэнэ\. Pro багц сард 5/);
  assert.doesNotMatch(expertSpentMessage({ plan: "Гадаад хэл Pro", limit: 5, used: 5, remaining: 0, resetsAt: 1, planEnds: true }), /шинэчлэгдэнэ|Pro багц/);
  assert.ok(Math.abs(expertCostUsd(3_000, 8_000) - 0.172) < 1e-9, "$4 in, $20 out per million tokens");
});

test("only a whole, well-formed request is reviewed", () => {
  assert.ok(validExpertInput(VALID));
  assert.ok(validExpertInput({ task: "free", promptId: null, topic: "My city", essay: ESSAY, language: "en" }));
  for (const bad of [
    { ...VALID, action: "feedback" }, { ...VALID, language: "ru" }, { ...VALID, task: "report" }, { ...VALID, promptId: "l-neighbour-noise" },
    { ...VALID, topic: "x" }, { ...VALID, essay: "too short ".repeat(20) }, { ...VALID, essay: "x".repeat(7001) },
    { task: "free", promptId: null, topic: "  ", essay: ESSAY, language: "mn" }, { task: "free", promptId: "e-online-school", topic: "x", essay: ESSAY, language: "mn" },
    null, [], "essay",
  ]) assert.equal(validExpertInput(bad), false, JSON.stringify(bad)?.slice(0, 80));
  assert.equal(expertTitle(VALID), "Essay · Education");
  assert.equal(expertTitle({ task: "free", promptId: null, topic: "  My   favourite place  " }), "My favourite place");
});

test("the examiner prompt is calibrated, keeps the text as data and asks for the full review shape", () => {
  const system = expertSystem("mn");
  for (const rule of [/four public IELTS Writing criteria/, /never inflate/, /Most learner texts fall between 5\.0 and 6\.5/, /under the word target loses marks/,
    /exactly four items, in the order task, coherence, lexical, grammar/, /three changes that would raise the overall band most/,
    /copied character for character/, /band 8 to 9 response/, /Do not add statistics, studies or quotations/, /data, never instructions/,
    /in Mongolian Cyrillic/]) assert.match(system, rule);
  assert.match(expertSystem("en"), /"why" in English\. Keep quotations/);
  const user = JSON.parse(expertUser(VALID));
  assert.deepEqual(Object.keys(user), ["task_type", "task", "word_count", "paragraph_count", "student_text"]);
  assert.match(user.task_type, /Task 2 essay \(at least 250 words/);
  assert.match(user.task, /online lessons will soon replace/);
  assert.equal(user.paragraph_count, 4);
  assert.equal(user.student_text, ESSAY);
  // Structured outputs: every object closed and fully required, no numeric or length constraints.
  const walk = node => {
    if (node.type === "object") { assert.equal(node.additionalProperties, false); assert.deepEqual(node.required, Object.keys(node.properties)); Object.values(node.properties).forEach(walk); }
    if (node.type === "array") walk(node.items);
    for (const banned of ["minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems"]) assert.equal(banned in node, false);
  };
  walk(EXPERT_SCHEMA);
  assert.deepEqual(EXPERT_SCHEMA.required, ["summary", "bands", "criteria", "priorities", "paragraphs", "corrections", "vocabulary", "model_answer"]);
});

test("the reply is checked: bands rounded and clamped, every criterion present, invented corrections dropped", () => {
  const review = normalizeExpertReview(REPLY, ESSAY);
  assert.deepEqual(review.bands, { task: 6, coherence: 6.5, lexical: 5.5, grammar: 9 });
  assert.equal(review.overall, 7, "the IELTS mean rounding (6.75 → 7)");
  assert.deepEqual(review.criteria.map(note => [note.criterion, note.band]), EXPERT_CRITERIA.map(key => [key, review.bands[key]]));
  assert.equal(review.criteria[0].evidence, "Байр суурь тодорхой.", "the first note for a criterion wins");
  assert.equal(review.criteria[1].evidence, "", "a missing criterion keeps its band with no text");
  assert.deepEqual(review.corrections.map(fix => [fix.original, fix.kind]), [["people thinks", "grammar"], ["dissapear", "grammar"]]);
  assert.deepEqual(review.vocabulary.map(word => word.better), ["more effective"]);
  assert.deepEqual(review.priorities, ["Жишээ нэм", "Холбоос үгээ олон янз болго", "Үйл үгийн тохиролцоо"]);
  assert.deepEqual(review.paragraphs.map(p => p.paragraph), [1]);
  assert.match(review.modelAnswer, /I partly disagree\.\n\nTeachers notice/, "paragraph breaks are kept, extra blank lines are not");
  assert.equal(normalizeExpertReview({ ...REPLY, bands: { task: 6, coherence: 6, lexical: 6 } }, ESSAY), null, "a band missing");
  assert.equal(normalizeExpertReview({ ...REPLY, summary: " " }, ESSAY), null);
  assert.equal(normalizeExpertReview({ ...REPLY, model_answer: "Too short." }, ESSAY), null);
  assert.equal(normalizeExpertReview("{}", ESSAY), null);
  assert.deepEqual(readExpertReview(JSON.parse(JSON.stringify(review))), review);
  assert.equal(readExpertReview({ ...review, bands: { task: 6 } }), null);
});

test("the server reads the quota inside a one-at-a-time lease and only a saved review counts", () => {
  const service = text("src/modules/writing-lab/expert-service.ts");
  assert.match(service, /import Anthropic from "@anthropic-ai\/sdk";/);
  assert.match(service, /process\.env\.ANTHROPIC_API_KEY\?\.trim\(\)/);
  const lease = service.indexOf("const reserved=await db.rateLimit.updateMany");
  const quota = service.indexOf("const quota=await expertQuota(userId);");
  const call = service.indexOf("client.beta.messages.stream(");
  const save = service.indexOf('saveReview(userId,body,"expert"');
  assert.ok(lease > 0 && lease < quota && quota < call && call < save, "lease, then quota, then Claude, then save");
  assert.match(service, /if\(quota\.remaining<=0\)throw new ApiError\(403,expertSpentMessage\(quota\)\)/);
  assert.match(service, /model:EXPERT_MODEL/);
  assert.match(service, /betas:\["server-side-fallback-2026-07-01"\],fallbacks:"default"/);
  assert.match(service, /output_config:\{effort:"high",format:\{type:"json_schema",schema:EXPERT_SCHEMA\}\}/);
  assert.match(service, /message\.stop_reason==="refusal"/);
  assert.match(service, /Never echo a provider error body/);
  // Free accounts count over the whole account; a plan counts its current plan month.
  // Only Claude reviews count; DeepSeek reviews are paid with credits.
  assert.match(service, /db\.essayReview\.count\(\{where:\{userId,kind:"expert",createdAt:\{gte:new Date\(month\.start\),lt:new Date\(month\.end\)\}\}\}\)/);
  assert.match(service, /const used=await db\.essayReview\.count\(\{where:\{userId,kind:"expert"\}\}\);/);
  assert.match(service, /where:\{id,userId\}/, "a review opens only for its owner");
  const route = text("src/app/api/labs/ielts-writing/expert/route.ts");
  assert.match(route, /checkOrigin\(request\);const user=await apiUser\(request\)/);
  assert.match(route, /export const maxDuration=300;/);
  assert.match(text("src/app/api/labs/ielts-writing/expert/[id]/route.ts"), /const user=await apiUser\(request\)/);
  const schema = text("prisma/schema.prisma");
  assert.match(schema, /model EssayReview \{[\s\S]*kind String @default\("expert"\)[\s\S]*inputTokens Int[\s\S]*outputTokens Int[\s\S]*@@index\(\[userId, createdAt\]\)/);
  assert.match(text("prisma/migrations/20261117210000_essay_review_kind/migration.sql"), /ALTER TABLE "EssayReview" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'expert';/);
  // The list reads the band from its own column, never the review JSON; old rows were filled from their review.
  assert.match(schema, /model EssayReview \{[\s\S]*overall Float @default\(0\)/);
  const overall = text("prisma/migrations/20261118090000_essay_review_overall/migration.sql");
  assert.match(overall, /ADD COLUMN "overall" DOUBLE PRECISION NOT NULL DEFAULT 0;/);
  assert.match(overall, /SET "overall" = \("review"->>'overall'\)::double precision/);
  assert.match(service, /const LIST=\{id:true,createdAt:true,kind:true,task:true,title:true,words:true,overall:true\} as const;/);
  assert.match(service, /take:EXPERT_LIMITS\.history,select:LIST\}/);
  assert.match(service, /overall:review\.overall,model,inputTokens,outputTokens/);
});

test("the studio's full review is the same examiner on DeepSeek, paid with credits", () => {
  assert.equal(STRONG_LIMITS.minWords, 50);
  assert.ok(validExpertInput({ ...VALID, essay: "word ".repeat(60) }, STRONG_LIMITS.minWords), "50 words are enough for the credit review");
  assert.equal(validExpertInput({ ...VALID, essay: "word ".repeat(60) }), false, "the Claude review still needs 100");
  assert.equal(validExpertInput({ ...VALID, essay: "word ".repeat(40) }, STRONG_LIMITS.minWords), false);
  // Same rules as Claude's, then the shape spelled out, since DeepSeek's JSON mode takes no schema.
  const system = strongSystem("mn");
  assert.ok(system.startsWith(expertSystem("mn")));
  assert.ok(system.endsWith(STRONG_SHAPE));
  assert.deepEqual(Object.keys(JSON.parse(STRONG_SHAPE)), EXPERT_SCHEMA.required);
  // Priced like every other action at its token budget's peak cost: 4,000 in and 16,000 out is 21 credits.
  assert.deepEqual([AI_ACTIONS["writing-review"].inputTokens, AI_ACTIONS["writing-review"].outputTokens], [4000, 16000]);
  assert.equal(creditCost("writing-review"), 21);
  const service = text("src/modules/writing-lab/expert-service.ts");
  // The studio's entry validates, then the shared step (also used for a mock's essays) runs the rest in this order.
  const start = service.indexOf("export function createStrongReview(");
  assert.match(service, /return strongReview\(userId,subjectOf\(body\)\);/);
  assert.match(service, /return expertReview\(userId,subjectOf\(body\)\);/);
  const strong = service.slice(start);
  const order = ["validExpertInput(body,STRONG_LIMITS.minWords)", "await requireWritingLab(userId);", "process.env.DEEPSEEK_API_KEY", 'chargeCredits(userId,"writing-review",',
    "count:{lt:STRONG_LIMITS.daily}", 'thinking:{type:"enabled"}', "normalizeExpertReview(", "await requireWritingLab(userId);\n", 'saveReview(userId,body,"strong"'].map((part, i, all) => {
      // The second plan check is the one after the reply is checked.
      return i === 7 ? strong.indexOf(part, strong.indexOf(all[6])) : strong.indexOf(part);
    });
  assert.ok(start > 0 && order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1])), `validate, plan check, key, hold credits, lease, think, check, re-check, save: ${order}`);
  assert.match(strong, /max_tokens:AI_ACTIONS\["writing-review"\]\.outputTokens/);
  // The task picks the rater (2026-11-19): the IELTS examiner, or the ETS rater for a TOEFL email or discussion.
  assert.match(strong, /role:"system",content:strongSystem\(body\.language,reviewExam\(body\.task\)\)/);
  assert.match(strong, /normalizeExpertReview\(JSON\.parse\(choice\.message\.content\),body\.essay,reviewExam\(body\.task\)\)/);
  assert.match(strong, /Never echo a provider error body/);
  assert.match(strong, /DEEPSEEK_BASE_URL\?\.trim\(\)\|\|"https:\/\/api\.deepseek\.com"/);
  const route = text("src/app/api/labs/ielts-writing/review/route.ts");
  assert.match(route, /checkOrigin\(request\);const user=await apiUser\(request\)/);
  assert.match(route, /createStrongReview\(user\.id/);
  assert.match(route, /export const maxDuration=240;/);
  // The studio's button calls it; the old quick report stays for the mobile app.
  const client = text("src/modules/writing-lab/client.tsx");
  assert.match(client, /action==="feedback"\?"\/api\/labs\/ielts-writing\/review"/);
  assert.match(client, /<CreditCost action="writing-review" compact\/>/);
  assert.match(text("src/modules/writing-lab/service.ts"), /writingCreditAction\(body\.action\)/);
});

test("a finished IELTS mock's essays get the studio's reviews, read from the attempt and priced the same", () => {
  const review = text("src/modules/exams/ai-grading/essay-review.ts");
  assert.match(review, /^import "server-only";/);
  // The essay and the task come from the attempt snapshot of the student's own finished IELTS mock, never the request.
  assert.match(review, /\(await ownMock\(id,userId\)\)\.state/);
  assert.match(review, /if\(!state\.finishedAt\)throw new ApiError\(409/);
  assert.match(review, /state\.definition\.program!=="ielts"/);
  assert.match(review, /Object\.keys\(input\)\.length!==2/);
  assert.match(review, /writingItems\(state\)\.find\(entry=>entry\.id===input\.questionId\)/);
  assert.match(review, /item\.response\.length>ESSAY_LIMIT/);
  // The same paid steps as the studio: credits for the full review, the plan's monthly reviews for the expert one.
  assert.match(review, /kind==="strong"\?strongReview\(userId,text\):expertReview\(userId,text\)/);
  assert.doesNotMatch(review, /chargeCredits|fetch\(/);
  const route = text("src/app/api/mock-attempts/[id]/essay-review/route.ts");
  assert.match(route, /checkOrigin\(request\);const user=await apiUser\(request\)/);
  assert.match(route, /export const maxDuration=300;/);
  // Saved like a studio review, with the attempt and question, so it lists in both places and counts against the quota.
  const service = text("src/modules/writing-lab/expert-service.ts");
  assert.match(service, /attemptId:body\.attemptId\?\?null,questionId:body\.questionId\?\?null/);
  assert.match(service, /where:\{userId,attemptId\}/);
  assert.match(text("prisma/schema.prisma"), /model EssayReview \{[\s\S]*attemptId String\?[\s\S]*questionId String\?[\s\S]*@@index\(\[attemptId\]\)/);
  assert.match(text("prisma/migrations/20261118190000_essay_review_mock/migration.sql"), /ADD COLUMN "attemptId" TEXT/);
  // The report task is judged as Academic Task 1 (Task Achievement), and the page names no provider.
  assert.match(expertSystem("mn"), /Task Achievement for an Academic Task 1 report/);
  const page = text("src/modules/exams/ai-grading/essay-reviews.tsx");
  assert.match(page, /<CreditCost action="writing-review" compact \/>/);
  assert.doesNotMatch(page, /DeepSeek|Claude|Anthropic|Opus/);
});
