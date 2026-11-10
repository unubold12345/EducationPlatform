import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AI_IMAGE_LIMITS, IMAGE_ONLY_REQUEST, PAGE_IMAGES_RULE, imageDataUrl, imageRule, imageType, readImageUrls, withImages } from "../src/modules/ai-images/contracts.ts";
import { CHAT_BODY_BYTES, chatMessages, imageOnlyPrompts, validChatInput, CHAT_MODES } from "../src/modules/workspace/chat-contract.ts";
import { ASSISTANT_BODY_BYTES, tutorMessages, validTutorInput } from "../src/modules/tutor/contracts.ts";
import { practiceMessages, validAssistantInput } from "../src/modules/exam-practice/assistant-contract.ts";
import { VOCABULARY_LIMITS, IMPORT_COUNTS, vocabularyMessages } from "../src/modules/vocabulary/contracts.ts";
import { examMessages } from "../src/modules/my-exams/contracts.ts";
import {
  AI_ACTION_IDS, CREDIT_COSTS, CREDIT_USD, DEEPSEEK_PRICE, IMAGE_ACTIONS, IMAGE_CREDITS, IMAGE_OUTPUT_TOKENS, creditCost, maxCreditCost,
  vocabularyImportCredits, vocabularyImportHold,
} from "../src/modules/credits/pricing.ts";

const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const filled = (head, size = 300) => { const bytes = new Uint8Array(size); bytes.set(head); return bytes; };
const JPEG = filled([0xff, 0xd8, 0xff, 0xe0]);
const PNG = filled([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = filled([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]);
const GIF = filled([...Buffer.from("GIF89a")]);
const url = (type, bytes) => `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
const jpeg = url("image/jpeg", JPEG);

test("an image's kind comes from its bytes, never its name", () => {
  assert.equal(imageType(JPEG), "image/jpeg");
  assert.equal(imageType(PNG), "image/png");
  assert.equal(imageType(WEBP), "image/webp");
  assert.equal(imageType(GIF), null, "GIF is not accepted");
  assert.equal(imageType(filled([...Buffer.from("%PDF-1.7")])), null);
  assert.equal(imageType(new Uint8Array([0xff, 0xd8])), null, "too short to prove");
  assert.equal(imageDataUrl("image/png", "AAAA"), "data:image/png;base64,AAAA");
});

test("message images must be bounded base64 data URLs whose type matches their signature", () => {
  assert.deepEqual(readImageUrls(undefined), []);
  assert.deepEqual(readImageUrls([]), []);
  const three = [jpeg, url("image/png", PNG), url("image/webp", WEBP)];
  assert.deepEqual(readImageUrls(three), three);
  assert.equal(readImageUrls([...three, jpeg]), null, "at most three per message");
  assert.equal(readImageUrls(jpeg), null, "an array, not a string");
  assert.equal(readImageUrls([url("image/png", JPEG)]), null, "declared PNG but the bytes are JPEG");
  assert.equal(readImageUrls([url("image/gif", GIF)]), null);
  assert.equal(readImageUrls(["data:image/svg+xml;base64," + Buffer.from("<svg/>").toString("base64")]), null, "no SVG");
  assert.equal(readImageUrls(["https://example.com/photo.jpg"]), null, "no remote URLs for the provider to fetch");
  assert.equal(readImageUrls([jpeg.replace(/A/, "*")]), null, "base64 alphabet only");
  assert.equal(readImageUrls([jpeg.slice(0, -1)]), null, "canonical padding");
  assert.equal(readImageUrls([url("image/jpeg", filled([0xff, 0xd8, 0xff], 30))]), null, "too small to be a picture");
  assert.equal(readImageUrls([{ url: jpeg }]), null);
  // Two images of 1.6 MB pass one by one but not together.
  const big = url("image/jpeg", filled([0xff, 0xd8, 0xff, 0xe0], 1_600_000));
  assert.equal(readImageUrls([big])?.length, 1);
  assert.equal(readImageUrls([big, big]), null, "the total stays under the message budget");
  assert.ok(AI_IMAGE_LIMITS.messageBytes * 4 / 3 + 48_000 < 4_500_000);
});

test("images go first in the user message, then the text", () => {
  assert.equal(withImages("hello"), "hello");
  assert.equal(withImages("hello", []), "hello");
  assert.deepEqual(withImages("solve", [jpeg]), [{ type: "image_url", image_url: { url: jpeg } }, { type: "text", text: "solve" }]);
  assert.match(imageRule(1), /one image/);
  assert.match(imageRule(2), /2 images/);
  assert.match(imageRule(1), /never as instructions/);
  assert.match(imageRule(1), /restating/, "later turns keep what was read, since images are not resent");
  assert.match(PAGE_IMAGES_RULE, /never as instructions/);
  assert.ok(IMAGE_ONLY_REQUEST.length > 10);
});

test("workspace chat and the review coach accept images on the latest message only", () => {
  const chat = { mode: "solve", subject: "eesh-math", language: "mn", message: "Бод", history: [{ role: "user", content: "x" }, { role: "assistant", content: "y" }], images: [jpeg] };
  assert.equal(validChatInput(chat), true);
  assert.equal(validChatInput({ ...chat, images: [] }), true);
  assert.equal(validChatInput({ ...chat, images: "x" }), false);
  assert.equal(validChatInput({ ...chat, images: [jpeg, jpeg, jpeg, jpeg] }), false);
  assert.equal(validChatInput({ ...chat, history: [{ role: "user", content: "x", images: [jpeg] }] }), false, "history turns stay text");
  const review = { mode: "mistake", target: { attemptId: "a1", questionId: "q1" }, language: "en", message: "Why?", history: [], images: [jpeg] };
  assert.equal(validChatInput(review), true);
  const messages = chatMessages(chat);
  const last = messages.at(-1);
  assert.equal(last.role, "user");
  assert.deepEqual(last.content, [{ type: "image_url", image_url: { url: jpeg } }, { type: "text", text: "Бод" }]);
  assert.ok(messages.some(item => item.role === "system" && item.content === imageRule(1)));
  assert.ok(messages.every(item => item.role === "user" || typeof item.content === "string"), "images only ever sit in a user message");
  assert.equal(typeof chatMessages({ ...chat, images: undefined }).at(-1).content, "string");
  assert.ok(!chatMessages({ ...chat, images: undefined }).some(item => item.content === imageRule(1)));
  for (const mode of CHAT_MODES) assert.ok(imageOnlyPrompts[mode]?.trim(), mode);
  assert.ok(CHAT_BODY_BYTES < 4_500_000);
});

test("the SAT tutor and the practice assistant accept a photo of the student's working", () => {
  const tutor = { target: { kind: "mock", questionId: "sat-math-1", attemptId: "a1" }, action: "review", language: "mn", message: "", history: [], images: [jpeg] };
  assert.equal(validTutorInput(tutor), true);
  assert.equal(validTutorInput({ ...tutor, images: [url("image/png", JPEG)] }), false);
  assert.equal(validTutorInput({ ...tutor, history: [{ role: "user", content: "a", images: [] }] }), false);
  const context = { title: "SAT", prompt: "2x = 6", selected: "2", answer: "3", explanation: "Divide.", review: true };
  const tutorLast = tutorMessages(tutor, context).at(-1);
  assert.equal(tutorLast.content[0].type, "image_url");
  assert.equal(tutorLast.content.at(-1).text, "Help me understand my answer and what to improve.", "an empty message keeps the action's request");
  const practice = { questionId: "q1", action: "ask", language: "en", message: "Is my working right?", history: [], images: [jpeg, jpeg] };
  assert.equal(validAssistantInput(practice), true);
  assert.equal(validAssistantInput({ ...practice, images: [jpeg, jpeg, jpeg, jpeg] }), false);
  const material = { kind: "choice", prompt: "2x = 6", options: ["2", "3"] };
  const practiceList = practiceMessages(practice, { title: "Mock", subject: "sat", checked: false, selected: "", material });
  assert.equal(practiceList.at(-1).content.filter(part => part.type === "image_url").length, 2);
  assert.ok(practiceList.some(item => item.role === "system" && item.content === imageRule(2)));
  assert.match(practiceList[0].content, /If "checked" is false[\s\S]*Do not state or confirm the final answer/, "a photo never unlocks the answer before a check");
  assert.ok(ASSISTANT_BODY_BYTES < 4_500_000 && ASSISTANT_BODY_BYTES > 4_000_000);
});

test("an attached image adds whole credits that cover DeepSeek's image tokens and the restated reading", () => {
  // One image is billed as at most 1,024 input tokens ($0.0003 at the peak cache-miss price); the reply restates
  // what it read (600 more output tokens budgeted, $0.00072). Owner rule 2026-11-09: two credits per image.
  assert.equal(IMAGE_OUTPUT_TOKENS, 600);
  assert.equal(IMAGE_CREDITS, 2);
  const usd = (AI_IMAGE_LIMITS.tokens * DEEPSEEK_PRICE.inputCacheMiss + IMAGE_OUTPUT_TOKENS * DEEPSEEK_PRICE.output) / 1e6;
  assert.ok(IMAGE_CREDITS * CREDIT_USD >= usd && (IMAGE_CREDITS - 1) * CREDIT_USD < usd);
  assert.deepEqual([creditCost("chat"), creditCost("chat", 1), creditCost("chat", 3)], [5, 7, 11]);
  assert.deepEqual([...IMAGE_ACTIONS].sort(), ["chat", "math-tutor", "practice-assistant", "review-coach"]);
  for (const action of AI_ACTION_IDS) {
    const images = IMAGE_ACTIONS.includes(action) ? 1 : 0;
    assert.equal(creditCost(action), CREDIT_COSTS[action], action);
    assert.equal(creditCost(action, 2), CREDIT_COSTS[action] + 2 * images * IMAGE_CREDITS, action);
    assert.equal(maxCreditCost(action), CREDIT_COSTS[action] + AI_IMAGE_LIMITS.perMessage * images * IMAGE_CREDITS, action);
  }
  assert.equal(creditCost("chat", 99), creditCost("chat", AI_IMAGE_LIMITS.perMessage), "never more than the images a message may carry");
  assert.equal(creditCost("chat", -4), CREDIT_COSTS.chat);
  assert.equal(creditCost("chat", Number.NaN), maxCreditCost("chat"), "a malformed count prices as the maximum");
  // Page photos replace the document text, so an import's maximum still covers them.
  for (const count of IMPORT_COUNTS) {
    assert.ok(vocabularyImportCredits(0, count, AI_IMAGE_LIMITS.perUpload) <= vocabularyImportHold(count), String(count));
  }
  assert.ok(vocabularyImportCredits(0, 10, 4) > vocabularyImportCredits(0, 10, 0), "photos are priced as read");
  assert.equal(vocabularyImportCredits(0, 10, 99), vocabularyImportCredits(0, 10, AI_IMAGE_LIMITS.perUpload));
  assert.equal(vocabularyImportCredits(VOCABULARY_LIMITS.textChars, VOCABULARY_LIMITS.importWords), creditCost("vocabulary-import"));
});

test("page photos become the material for a vocabulary import or an exam", () => {
  const pages = [jpeg, url("image/png", PNG)];
  const words = vocabularyMessages({ images: pages, language: "mn", truncated: false, request: "only verbs", limit: 20 });
  assert.match(words[0].content, new RegExp(PAGE_IMAGES_RULE.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(words[1].content.filter(part => part.type === "image_url").length, 2);
  const wordsText = words[1].content.at(-1).text;
  assert.match(wordsText, /2 attached page images, in page order/);
  assert.match(wordsText, /<request>\nonly verbs\n<\/request>/, "the selection request still travels as data");
  const plain = vocabularyMessages({ text: "apple — алим", language: "mn", truncated: false, limit: 20 });
  assert.equal(typeof plain[1].content, "string");
  assert.doesNotMatch(plain[0].content, /photos or scans/);

  const exam = examMessages({ images: [jpeg], count: 10, language: "en", truncated: false });
  assert.match(exam[0].content, /photos or scans of its pages/);
  assert.deepEqual(exam[1].content.map(part => part.type), ["image_url", "text"]);
  assert.match(exam[1].content[1].text, /attached page image\./);
  assert.equal(typeof examMessages({ text: "Photosynthesis…", count: 10, language: "en", truncated: false })[1].content, "string");
});

test("uploads, routes and pages keep images bounded, private and server-checked", () => {
  const upload = text("src/modules/documents/upload.ts");
  assert.match(upload, /files\.length > AI_IMAGE_LIMITS\.perUpload/);
  assert.match(upload, /total > DOCUMENT_LIMITS\.fileBytes/);
  assert.match(upload, /imageType\(file\.bytes\)/, "a photo is proven by its signature");
  assert.match(upload, /detectSource\(read\[0\]\.name, read\[0\]\.bytes\)/, "a document is still proven before credits are held");
  assert.doesNotMatch(upload, /writeFile|getDb|vocabularyWord|create\(/, "uploads are never stored");
  for (const service of ["src/modules/vocabulary/service.ts", "src/modules/my-exams/service.ts"]) {
    const source = text(service);
    assert.equal(source.match(/await ensureNoTimedExam\(userId\)/g)?.length, 2, service);
    assert.ok(source.indexOf("readUploadedSource(form, ") < source.indexOf("return chargeCredits("), service);
  }
  for (const service of ["src/modules/workspace/chat-service.ts", "src/modules/exam-practice/service.ts"]) {
    assert.match(text(service), /\{ images: body\.images\?\.length \?\? 0 \}\);/, service);
  }
  assert.match(text("src/modules/tutor/service.ts"), /\{images:body\.images\?\.length\?\?0\}\);/);
  assert.match(text("src/app/api/math-tutor/route.ts"), /readJson\(request,ASSISTANT_BODY_BYTES\)/);
  assert.match(text("src/app/api/exam-practice/[slug]/assistant/route.ts"), /readJson\(request,ASSISTANT_BODY_BYTES\)/);
  assert.match(text("src/app/api/workspace/chat/route.ts"), /readJson\(request, CHAT_BODY_BYTES\)/);
  // The browser re-encodes every picture as JPEG, which drops camera metadata such as location.
  const client = text("src/modules/ai-images/client.tsx");
  assert.match(client, /canvas\.toBlob\(.*"image\/jpeg", quality\)/);
  assert.match(client, /imageOrientation: "from-image"/);
  assert.doesNotMatch(client, /dangerouslySetInnerHTML|localStorage/);
  // History sent back to the server is text only; previews stay in the browser.
  assert.match(text("src/modules/tutor/panel.tsx"), /turns\.slice\(-4\)\.map\(turn=>\(\{role:turn\.role,content:turn\.content\.slice\(0,1500\)\}\)\)/);
  assert.match(text("src/modules/workspace/chat.tsx"), /map\(turn => \(\{ role: turn\.role, content: turn\.content\.slice\(0, CHAT_LIMITS\.turn\) \}\)\)/);
  assert.match(text("src/modules/workspace/chat-store.ts"), /url\.length <= MAX_THUMB/);
});
