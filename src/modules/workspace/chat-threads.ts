import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";
import { tutorDay } from "@/modules/tutor/contracts";
import { CHAT_LIMITS, CHAT_STORE_LIMITS, isChatThreadId, threadTitle, type ChatSend, type ChatTurn } from "./chat-contract";
import {
  answeredAlready, historyTurns, keepPreviews, readChatImport, readThreadSummary, storedText,
  type ChatReply, type ChatThreadSummary, type ChatThreadView, type StoredTurn,
} from "./chat-storage";
import { chatImportKey } from "./chat-import-key";

// Workspace AI chat threads live on the account (2026-11-12), so they follow the student between devices and survive
// cleared site data. Every read and write is scoped by the session's user id; a thread id from the browser is used
// only after the server finds it under that user. A question and its answer are saved together, and only once the
// answer has arrived.

/** Moving browser threads writes up to 3 MB each; a day's moves are bounded like any other write path. */
const IMPORTS_PER_DAY = 100;
const SUMMARY = { id: true, title: true, subject: true, mode: true, language: true, updatedAt: true } as const;
const MESSAGE = { position: true, role: true, content: true, images: true } as const;
type SummaryRow = { id: string; title: string; subject: string; mode: string; language: string; updatedAt: Date };
type MessageRow = { position: number; role: string; content: string; images: unknown };
type Tx = Prisma.TransactionClient;

const notFound = () => new ApiError(404, "Энэ чат олдсонгүй. Устгагдсан байж магадгүй.");
const badId = () => new ApiError(400, "Чатын түлхүүр буруу байна.");
const duplicate = (error: unknown) => (error as { code?: string }).code === "P2002";

const summary = (row: SummaryRow) => readThreadSummary({ ...row, updatedAt: row.updatedAt.getTime() });
function turn(row: MessageRow): StoredTurn | null {
  if (row.role !== "user" && row.role !== "assistant") return null;
  const images = row.role === "user" ? keepPreviews(row.images) : [];
  return { role: row.role, content: row.content, ...(images.length ? { images } : {}) };
}
/** A message row's data; previews are stored as a JSON array, or not at all. */
function messageData(position: number, value: StoredTurn) {
  return { position, role: value.role, content: value.content, ...(value.images?.length ? { images: value.images } : {}) };
}
/** The position after a thread's last message; 0 for a thread without messages. */
const nextAfter = (messages: readonly { position: number }[]) => (messages.at(-1)?.position ?? -1) + 1;

/** An account keeps 30 threads: the least recently used go first. */
async function trimThreads(tx: Tx, userId: string) {
  const extra = await tx.chatThread.findMany({ where: { userId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: CHAT_STORE_LIMITS.threads, select: { id: true } });
  if (extra.length) await tx.chatThread.deleteMany({ where: { userId, id: { in: extra.map(row => row.id) } } });
}

/** The student's own threads, most recently used first. */
export async function listChatThreads(userId: string): Promise<ChatThreadSummary[]> {
  const rows = await getDb().chatThread.findMany({ where: { userId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: CHAT_STORE_LIMITS.threads, select: SUMMARY });
  return rows.flatMap(row => summary(row) ?? []);
}

/** One of the student's threads with its messages, oldest first. */
export async function readChatThread(userId: string, id: string): Promise<ChatThreadView> {
  if (!isChatThreadId(id)) throw badId();
  const row = await getDb().chatThread.findFirst({ where: { id, userId }, select: { ...SUMMARY, messages: { orderBy: { position: "asc" }, select: MESSAGE } } });
  const head = row ? summary(row) : null;
  if (!row || !head) throw notFound();
  return { ...head, next: nextAfter(row.messages), turns: row.messages.flatMap(message => turn(message) ?? []) };
}

/** Delete only the student's own thread, with its messages. */
export async function deleteChatThread(userId: string, id: string) {
  if (!isChatThreadId(id)) throw badId();
  const result = await getDb().chatThread.deleteMany({ where: { id, userId } });
  if (!result.count) throw notFound();
  return { ok: true as const };
}

/**
 * What the model sees before a new message: the last turns of the student's own stored thread (none for a new
 * one). When the thread already ends with this exact question answered past what the page had read, the page lost
 * that response: the saved answer comes back as `replay`, and the caller returns it without a provider call or charge.
 */
export async function chatThreadContext(userId: string, request: ChatSend): Promise<{ history: ChatTurn[]; replay: ChatReply | null }> {
  if (request.threadId === null) return { history: [], replay: null };
  const row = await getDb().chatThread.findFirst({
    where: { id: request.threadId, userId },
    select: { ...SUMMARY, messages: { orderBy: { position: "desc" }, take: CHAT_LIMITS.history, select: MESSAGE } },
  });
  const head = row ? summary(row) : null;
  if (!row || !head) throw notFound();
  const recent = [...row.messages].reverse();
  if (answeredAlready(recent, request.after, request.message)) {
    const turns = recent.slice(-2).flatMap(message => turn(message) ?? []);
    return { history: [], replay: { message: turns[1].content, provider: "DeepSeek", thread: { ...head, next: nextAfter(recent) }, turns, replayed: true } };
  }
  return { history: historyTurns(recent), replay: null };
}

/**
 * Save one question and its answer, called only after the answer has arrived: a failed request leaves nothing
 * behind, so sending it again cannot double the question. Only the previews are kept, never the full pictures.
 * A thread deleted while the model was answering is not brought back; the caller's credits are then refunded.
 */
export async function saveChatTurn(userId: string, request: ChatSend, reply: string): Promise<Pick<ChatReply, "thread" | "turns">> {
  const previews = keepPreviews(request.previews);
  const asked: StoredTurn = { role: "user", content: storedText(request.message.trim()), ...(previews.length ? { images: previews } : {}) };
  const answer: StoredTurn = { role: "assistant", content: storedText(reply) };
  const options = { subject: request.subject, mode: request.mode, language: request.language };
  return getDb().$transaction(async tx => {
    const now = new Date();
    let id = request.threadId, start = 0;
    if (id) {
      // Touching the thread first holds its row, so two sends cannot take the same positions.
      const touched = await tx.chatThread.updateMany({ where: { id, userId }, data: { ...options, updatedAt: now } });
      if (!touched.count) throw notFound();
      const last = await tx.chatMessage.findFirst({ where: { threadId: id }, orderBy: { position: "desc" }, select: { position: true } });
      start = (last?.position ?? -1) + 1;
      await tx.chatMessage.createMany({ data: [{ threadId: id, ...messageData(start, asked) }, { threadId: id, ...messageData(start + 1, answer) }] });
      // A thread keeps its newest 60 messages.
      const cut = await tx.chatMessage.findFirst({ where: { threadId: id }, orderBy: { position: "desc" }, skip: CHAT_STORE_LIMITS.messages, select: { position: true } });
      if (cut) await tx.chatMessage.deleteMany({ where: { threadId: id, position: { lte: cut.position } } });
    } else {
      const created = await tx.chatThread.create({
        data: { userId, title: threadTitle(request.message), ...options, updatedAt: now, messages: { create: [messageData(0, asked), messageData(1, answer)] } },
        select: { id: true },
      });
      id = created.id;
      await trimThreads(tx, userId);
    }
    const row = await tx.chatThread.findFirst({ where: { id, userId }, select: SUMMARY });
    const head = row ? summary(row) : null;
    if (!head) throw new Error("Saved chat thread does not read");
    return { thread: { ...head, next: start + 2 }, turns: [asked, answer] };
  });
}

/** Moving threads is free, but each request writes up to 3 MB: a compare-and-set daily count bounds it. */
async function countImport(userId: string) {
  const db = getDb(), now = Date.now(), key = `education-workspace-chat-import:${userId}:${tutorDay(now)}`;
  await db.rateLimit.upsert({ where: { key }, create: { id: randomUUID(), key, count: 0, lastRequest: BigInt(0) }, update: {} });
  const counted = await db.rateLimit.updateMany({ where: { key, count: { lt: IMPORTS_PER_DAY } }, data: { count: { increment: 1 }, lastRequest: BigInt(now) } });
  if (!counted.count) throw new ApiError(429, "Өнөөдөр чат шилжүүлэх хязгаарт хүрсэн. Маргааш дахин оролдоно уу.");
}

/**
 * Move one thread from a browser to the account. Until 2026-11-12 chats lived only in browser storage; the page
 * sends each one here once and forgets it locally when the account has it. The key is made on the server from the
 * account and the browser's thread id, so one thread never makes two. Like the browser store, an account keeps
 * the newest 30: a thread older than every thread of a full account stays out (`skipped`).
 */
export async function importChatThread(userId: string, body: unknown): Promise<{ id: string; imported: boolean } | { id: null; skipped: "full" }> {
  const thread = readChatImport(body);
  if (!thread) throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна.");
  const db = getDb();
  const importKey = chatImportKey(userId, thread.browserId);
  const known = () => db.chatThread.findUnique({ where: { userId_importKey: { userId, importKey } }, select: { id: true } });
  const existing = await known();
  if (existing) return { id: existing.id, imported: false };
  await countImport(userId);
  try {
    return await db.$transaction(async tx => {
      const newest = await tx.chatThread.findMany({ where: { userId }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: CHAT_STORE_LIMITS.threads - 1, take: 1, select: { updatedAt: true } });
      if (newest[0] && newest[0].updatedAt.getTime() >= thread.updatedAt) return { id: null, skipped: "full" as const };
      const at = new Date(thread.updatedAt);
      const row = await tx.chatThread.create({
        data: {
          userId, importKey, title: thread.title, subject: thread.subject, mode: thread.mode, language: thread.language, createdAt: at, updatedAt: at,
          messages: { create: thread.turns.map((value, position) => messageData(position, value)) },
        },
        select: { id: true },
      });
      await trimThreads(tx, userId);
      return { id: row.id, imported: true };
    });
  } catch (error) {
    // Two tabs moved the same thread at once: the first one's row is the thread.
    const twin = duplicate(error) ? await known() : null;
    if (twin) return { id: twin.id, imported: false };
    throw error;
  }
}
