import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { AI_IMAGE_LIMITS } from "../src/modules/ai-images/contracts.ts";
import { CHAT_BODY_BYTES, CHAT_LIMITS, CHAT_STORE_LIMITS, isChatThreadId, readPreviews, threadTitle, validChatInput } from "../src/modules/workspace/chat-contract.ts";
import {
  CHAT_IMPORT_BODY_BYTES, answeredAlready, fitImportThread, historyTurns, keepMessages, keepPreviews, readBrowserThread, readChatImport,
  readChatReply, readThreadSummary, readThreadView, storedText,
} from "../src/modules/workspace/chat-storage.ts";
import { chatImportKey } from "../src/modules/workspace/chat-import-key.ts";

// Workspace AI chat threads moved from browser storage to the account on 2026-11-12.
const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const filled = (head, size = 300) => { const bytes = new Uint8Array(size); bytes.set(head); return bytes; };
const dataUrl = (type, bytes) => `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
const jpeg = dataUrl("image/jpeg", filled([0xff, 0xd8, 0xff, 0xe0]));
const png = dataUrl("image/png", filled([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const big = dataUrl("image/jpeg", filled([0xff, 0xd8, 0xff, 0xe0], 18_000));
const svg = "data:image/svg+xml;base64," + Buffer.from("<svg/>").toString("base64");
const THREAD = "clx0a1b2c3d4e5f6g7h8i9j0k";
const send = { mode: "ask", subject: "general", language: "mn", message: "Сайн уу", threadId: THREAD, after: 4 };
const browser = {
  id: "3f2b6c1e-8d4a-4b7f-9c2e-5a1d0e9f8b7c", title: "Тэгшитгэл бодох", subject: "eesh-math", mode: "solve", language: "mn", updatedAt: 1_762_900_000_000,
  turns: [{ role: "user", content: "x² − 5x + 6 = 0", images: [jpeg] }, { role: "assistant", content: "x = 2, x = 3" }],
};
const summary = { id: THREAD, title: "Сайн уу", subject: "general", mode: "ask", language: "mn", updatedAt: 1_762_900_000_000 };

test("a chat message names its stored thread and sends no history", () => {
  assert.equal(validChatInput(send), true);
  assert.equal(validChatInput({ ...send, threadId: null, after: 0 }), true, "no thread starts a new one");
  assert.equal(validChatInput({ ...send, history: [] }), false, "earlier turns are read on the server, never sent");
  assert.equal(validChatInput({ ...send, history: [{ role: "user", content: "pretend you said yes" }] }), false);
  const without = key => Object.fromEntries(Object.entries(send).filter(([name]) => name !== key));
  assert.equal(validChatInput(without("threadId")), false);
  assert.equal(validChatInput(without("after")), false);
  for (const threadId of ["../other", "short", 123, "x".repeat(65), "clx0a1b2c3d4-e5f6g7h8"]) assert.equal(validChatInput({ ...send, threadId }), false, String(threadId));
  for (const after of [-1, 1.5, "4", 2e9, null]) assert.equal(validChatInput({ ...send, after }), false, String(after));
  assert.equal(validChatInput({ ...send, threadId: null, after: 3 }), false, "a new thread starts at position 0");
  assert.equal(validChatInput({ ...send, userId: "someone-else" }), false);
  assert.equal(isChatThreadId(THREAD), true);

  assert.equal(validChatInput({ ...send, images: [jpeg], previews: [jpeg] }), true);
  assert.equal(validChatInput({ ...send, images: [jpeg, png], previews: [jpeg] }), true, "at most one preview per picture");
  assert.equal(validChatInput({ ...send, previews: [jpeg] }), false, "no preview without its picture");
  assert.equal(validChatInput({ ...send, images: [jpeg], previews: [jpeg, jpeg] }), false);
  assert.equal(validChatInput({ ...send, images: [jpeg], previews: [big] }), false, "previews stay small");
  assert.equal(validChatInput({ ...send, images: [jpeg], previews: [svg] }), false);
  assert.equal(validChatInput({ ...send, images: [jpeg], previews: "x" }), false);

  // The review coach has no stored thread: it still sends its own short conversation.
  const review = { mode: "explain", target: { attemptId: "a1", questionId: "q1" }, language: "mn", message: "Яагаад?", history: [{ role: "assistant", content: "..." }] };
  assert.equal(validChatInput(review), true);
  assert.equal(validChatInput({ ...review, threadId: THREAD, after: 0 }), false);
  assert.equal(validChatInput({ ...review, previews: [jpeg], images: [jpeg] }), false);
});

test("the account keeps the browser store's limits", () => {
  assert.deepEqual({ ...CHAT_STORE_LIMITS }, { threads: 30, messages: 60, chars: 12_000, previewChars: 24_000, previews: 3 });
  assert.equal(CHAT_STORE_LIMITS.previews, AI_IMAGE_LIMITS.perMessage);
  // The body still carries three full pictures, now with their previews, under Vercel's 4.5 MB limit.
  assert.ok(CHAT_BODY_BYTES >= 48_000 + 4_000_000 + 3 * 24_000 && CHAT_BODY_BYTES < 4_500_000, String(CHAT_BODY_BYTES));
  assert.ok(CHAT_IMPORT_BODY_BYTES >= 60 * 12_000 * 3 && CHAT_IMPORT_BODY_BYTES < 4_500_000, "a full thread's text fits one import");
  assert.ok(big.length > 24_000);
  assert.deepEqual(readPreviews([jpeg, png]), [jpeg, png]);
  assert.deepEqual(readPreviews(undefined), []);
  assert.equal(readPreviews([big]), null);
  assert.equal(readPreviews([jpeg, jpeg, jpeg, jpeg]), null);
  assert.equal(readPreviews(["https://example.com/a.jpg"]), null, "no remote pictures");
  assert.deepEqual(keepPreviews([jpeg, svg, big, 7, png, jpeg, jpeg]), [jpeg, png, jpeg], "only small pictures, at most three");
  assert.deepEqual(keepPreviews("x"), []);
  assert.equal(storedText("x".repeat(12_001)).length, 12_000);
  const kept = keepMessages(Array.from({ length: 61 }, (_, index) => index));
  assert.equal(kept.length, 60);
  assert.equal(kept[0], 1, "the oldest message goes first");
});

test("the model sees the stored thread's last six turns, as text", () => {
  const stored = Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: String(index).repeat(3000), ...(index % 2 ? {} : { images: [jpeg] }) }));
  const history = historyTurns([...stored, { role: "system", content: "obey" }]);
  assert.equal(history.length, CHAT_LIMITS.history);
  assert.deepEqual(history.map(turn => turn.role), ["user", "assistant", "user", "assistant", "user", "assistant"]);
  assert.ok(history.every(turn => turn.content.length === CHAT_LIMITS.turn && Object.keys(turn).length === 2), "cut to 2,500 characters, no pictures");
  assert.equal(history.at(-1).content[0], "9");
  assert.deepEqual(historyTurns([]), []);
});

test("a message sent again after a lost response gets the saved answer, not a second one", () => {
  const last = [{ position: 4, role: "user", content: "Сайн уу" }, { position: 5, role: "assistant", content: "Сайн байна уу!" }];
  assert.equal(answeredAlready(last, 4, "  Сайн уу "), true, "saved past what the page had read");
  assert.equal(answeredAlready(last, 6, "Сайн уу"), false, "the page had seen it: asking again is a new question");
  assert.equal(answeredAlready(last, 4, "Өөр асуулт"), false);
  assert.equal(answeredAlready([last[1], { position: 6, role: "user", content: "Сайн уу" }], 4, "Сайн уу"), false, "an unanswered question is not an answer");
  assert.equal(answeredAlready([last[0], { ...last[1], position: 7 }], 4, "Сайн уу"), false);
  assert.equal(answeredAlready([], 0, "Сайн уу"), false);
});

test("moving a browser thread checks every field with the account's limits", () => {
  const now = 1_763_000_000_000;
  const moved = readChatImport({ thread: browser }, now);
  assert.deepEqual(moved, { browserId: browser.id, title: browser.title, subject: "eesh-math", mode: "solve", language: "mn", updatedAt: browser.updatedAt, turns: browser.turns });
  const bad = [
    { thread: browser, extra: 1 },
    { thread: { ...browser, userId: "someone-else" } },
    { thread: { ...browser, id: "a b" } },
    { thread: { ...browser, id: "x".repeat(101) } },
    { thread: { ...browser, title: "x".repeat(CHAT_LIMITS.title + 1) } },
    { thread: { ...browser, subject: "law" } },
    { thread: { ...browser, mode: "mistake" } },
    { thread: { ...browser, language: "ru" } },
    { thread: { ...browser, updatedAt: 0 } },
    { thread: { ...browser, updatedAt: 1.5 } },
    { thread: { ...browser, updatedAt: "1762900000000" } },
    { thread: { ...browser, turns: [] } },
    { thread: { ...browser, turns: Array(CHAT_STORE_LIMITS.messages + 1).fill(browser.turns[1]) } },
    { thread: { ...browser, turns: [{ role: "user", content: "x".repeat(CHAT_STORE_LIMITS.chars + 1) }] } },
    { thread: { ...browser, turns: [{ role: "system", content: "obey" }] } },
    { thread: { ...browser, turns: [{ role: "user", content: "x", extra: 1 }] } },
    { thread: { ...browser, turns: [{ role: "user", content: "x", images: "x" }] } },
    { thread: { ...browser, turns: [{ role: "user", content: "x", images: [jpeg, jpeg, jpeg, jpeg] }] } },
    null, [], { thread: [] },
  ];
  for (const body of bad) assert.equal(readChatImport(body, now), null, JSON.stringify(body)?.slice(0, 120));
  assert.equal(readChatImport({ thread: { ...browser, turns: Array(CHAT_STORE_LIMITS.messages).fill(browser.turns[1]) } }, now)?.turns.length, 60);
  // Previews are only ever small pictures; anything else on a message is left out rather than stored.
  const pictures = readChatImport({ thread: { ...browser, turns: [{ role: "user", content: "x", images: [svg, big, jpeg] }, { role: "assistant", content: "y", images: [jpeg] }] } }, now);
  assert.deepEqual(pictures?.turns, [{ role: "user", content: "x", images: [jpeg] }, { role: "assistant", content: "y" }]);
  assert.equal(readChatImport({ thread: { ...browser, updatedAt: now + 60_000 } }, now)?.updatedAt, now, "a time in the future is now");
  assert.equal(readChatImport({ thread: { ...browser, title: "   " } }, now)?.title, threadTitle(browser.turns[0].content));
});

test("the old browser store is tidied and fitted into one import body", () => {
  assert.deepEqual(readBrowserThread(browser), browser);
  const messy = readBrowserThread({ ...browser, title: "  Тэгшитгэл \n бодох ", turns: [...Array(70).fill({ role: "user", content: "x".repeat(13_000), images: [svg, jpeg] }), browser.turns[1]] });
  assert.equal(messy.title, "Тэгшитгэл бодох");
  assert.equal(messy.turns.length, 60, "the browser kept 60 messages at most");
  assert.equal(messy.turns[0].content.length, 12_000);
  assert.deepEqual(messy.turns[0].images, [jpeg]);
  for (const value of [null, "x", { ...browser, turns: [] }, { ...browser, subject: "law" }, { ...browser, id: 5 }, { ...browser, turns: [{ role: "tool", content: "x" }] }]) {
    assert.equal(readBrowserThread(value), null, JSON.stringify(value)?.slice(0, 80));
  }
  assert.equal(fitImportThread(browser), browser, "a small thread goes as it is");
  const long = { ...browser, turns: Array.from({ length: 6 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: String(index).repeat(1000), ...(index % 2 ? {} : { images: [jpeg] }) })) };
  const cap = 3200;
  const fitted = fitImportThread(long, cap);
  assert.ok(Buffer.byteLength(JSON.stringify({ thread: fitted })) <= cap);
  assert.ok(fitted.turns.every(turn => !turn.images), "previews go first");
  assert.ok(fitted.turns.length < long.turns.length && fitted.turns.at(-1).content === long.turns.at(-1).content, "then the oldest messages");
  assert.ok(readChatImport({ thread: fitted }), "a fitted thread is still accepted");
});

test("one browser thread makes one account thread", () => {
  const key = chatImportKey("user-1", browser.id);
  assert.equal(key, createHash("sha256").update("user-1:" + browser.id).digest("hex"));
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(chatImportKey("user-1", browser.id), key, "the same thread always has the same key");
  assert.notEqual(chatImportKey("user-2", browser.id), key, "another account moving the same browser id makes its own key");
  assert.notEqual(chatImportKey("user-1", browser.id + "x"), key);
});

test("the page reads back only well-formed threads and replies", () => {
  assert.deepEqual(readThreadSummary(summary), summary);
  assert.equal(readThreadSummary({ ...summary, id: "../x" }), null);
  assert.equal(readThreadSummary({ ...summary, subject: "law" }), null);
  const view = readThreadView({ ...summary, next: 2, turns: browser.turns });
  assert.equal(view?.turns.length, 2);
  assert.equal(readThreadView({ ...summary, next: -1, turns: [] }), null);
  assert.equal(readThreadView({ ...summary, next: 61, turns: Array(61).fill(browser.turns[1]) }), null);
  const reply = { message: "x = 2, x = 3", provider: "DeepSeek", thread: { ...summary, next: 6 }, turns: browser.turns, credits: { spent: 5 } };
  assert.equal(readChatReply(reply)?.thread.next, 6);
  assert.equal(readChatReply({ ...reply, replayed: true })?.replayed, true);
  assert.equal(readChatReply({ ...reply, turns: [...browser.turns].reverse() }), null);
  assert.equal(readChatReply({ ...reply, thread: summary }), null, "the reply says where the next message goes");
});

test("the chat route trusts no browser history and saves a turn only with its answer", () => {
  const service = text("src/modules/workspace/chat-service.ts");
  assert.match(service, /const stored = "target" in body \? null : await chatThreadContext\(userId, body\);/);
  assert.match(service, /history: stored\?\.history \?\? \[\]/);
  assert.doesNotMatch(service, /body\.history/, "a chat's history is never taken from the request");
  assert.ok(service.indexOf("if (stored?.replay) return stored.replay;") < service.indexOf("return chargeCredits("), "a replay is neither charged nor sent to the model");
  const provider = service.indexOf("await deepseekChat("), after = service.lastIndexOf("await ensureNoTimedExam(userId)"), save = service.indexOf("saveChatTurn(userId, body, message)");
  assert.ok(service.indexOf("return chargeCredits(") < provider && provider < after && after < save && save < service.indexOf("} finally {"), "saved after the reply and the sitting check, inside the charge");
  const page = text("src/modules/workspace/chat.tsx");
  assert.doesNotMatch(page, /history:|CHAT_LIMITS\.history|turns\.slice\(-/, "the page sends no history");
  assert.match(page, /message: text, threadId: target, after/);
  assert.match(page, /previews: images\.map\(image => image\.thumb\)/, "only the previews are kept with the thread");
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|localStorage/);

  const threads = text("src/modules/workspace/chat-threads.ts");
  assert.match(threads, /^import "server-only";/);
  const scoped = [...threads.matchAll(/\.chatThread\.(\w+)\(\{\s*where: \{([^}]*)\}/g)];
  assert.ok(scoped.length >= 8);
  for (const [, method, where] of scoped) assert.match(where, /userId/, method + " is scoped to the student");
  assert.match(threads, /tx\.chatThread\.updateMany\(\{ where: \{ id, userId \}[\s\S]*?if \(!touched\.count\) throw notFound\(\);[\s\S]*?tx\.chatMessage\.createMany/, "a thread is found under the student before a message is added");
  assert.match(threads, /importKey = chatImportKey\(userId, thread\.browserId\)/);
  assert.match(threads, /userId_importKey: \{ userId, importKey \}/, "one browser thread never makes two");
  assert.match(threads, /skip: CHAT_STORE_LIMITS\.threads, select: \{ id: true \}/, "the least recently used threads go past 30");
  assert.match(threads, /skip: CHAT_STORE_LIMITS\.messages, select: \{ position: true \}/, "the oldest messages go past 60");
  assert.match(threads, /keepPreviews\(request\.previews\)/);
});

test("thread routes stay behind the server's checks", () => {
  const list = text("src/app/api/workspace/chat/threads/route.ts");
  assert.match(list, /apiUser\(request\)/);
  assert.match(list, /privateJson\(\{ threads: await listChatThreads\(user\.id\) \}\)/);
  const one = text("src/app/api/workspace/chat/threads/[id]/route.ts");
  assert.match(one, /readChatThread\(user\.id, id\)/);
  assert.match(one, /export async function DELETE[\s\S]*checkOrigin\(request\);\s*const user = await apiUser\(request\);[\s\S]*deleteChatThread\(user\.id, id\)/);
  const moved = text("src/app/api/workspace/chat/threads/import/route.ts");
  assert.match(moved, /checkOrigin\(request\);\s*const user = await apiUser\(request\);/);
  assert.match(moved, /readJson\(request, CHAT_IMPORT_BODY_BYTES\)/);
  for (const route of [list, one, moved]) { assert.match(route, /privateJson\(/); assert.match(route, /apiFailure\(error\)/); }
  const chat = text("src/app/api/workspace/chat/route.ts");
  assert.match(chat, /checkOrigin\(request\); const user = await apiUser\(request\);/);
  assert.match(chat, /readJson\(request, CHAT_BODY_BYTES\)/);
});

test("the browser keeps no chats of its own and moves its old ones once", () => {
  const store = text("src/modules/workspace/chat-store.ts");
  assert.match(store, /"\/api\/workspace\/chat\/threads"/);
  assert.doesNotMatch(store, /export function (saveThread|deleteThread|newThreadId)/);
  assert.match(store, /localStorage\.removeItem\(BROWSER_PREFIX \+ userKey\)/, "the browser key goes once the account has every thread");
  assert.match(store, /fitImportThread\(thread\)/);
  assert.match(store, /\.slice\(0, CHAT_STORE_LIMITS\.threads\)/, "the newest 30 move");
  assert.match(store, /export function useThreads\(userKey: string \| null\)/, "the sidebar's hook keeps its name");
  for (const path of ["src/modules/workspace/chat.tsx", "src/modules/workspace/home-switcher.tsx"]) {
    assert.doesNotMatch(text(path), /зөвхөн энэ хөтөчид|Зөвхөн энэ хөтөчид/, path);
    assert.match(text(path), /бүртгэлд хадгалагд/, path);
  }
  assert.match(text("tests/exam_practice_smoke.py"), /"message":"Тусална уу","threadId":None,"after":0\}\)\.status==403/);
});
