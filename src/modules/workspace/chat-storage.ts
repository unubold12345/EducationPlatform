// Workspace AI chat threads stored on the account (2026-11-12): what a stored thread looks like to the page, the
// turns the model is given, and the one-time move of the threads an older version kept in the browser. Pure (no
// server or browser APIs), so the rules can be tested without a database.
import {
  CHAT_LIMITS, CHAT_MODES, CHAT_STORE_LIMITS, CHAT_SUBJECTS, isChatThreadId, readPreviews, threadTitle,
  type ChatMode, type ChatSubject, type ChatTurn,
} from "./chat-contract.ts";

/** A message as stored: its text and, on the student's messages, up to three small previews of the pictures sent. */
export type StoredTurn = ChatTurn & { images?: string[] };
export type ChatThreadSummary = { id: string; title: string; subject: ChatSubject; mode: ChatMode; language: "mn" | "en"; updatedAt: number };
/** `next` is the position the thread's next message takes; the page sends it back as `after`. */
export type ChatThreadView = ChatThreadSummary & { next: number; turns: StoredTurn[] };
/** A chat reply: the answer, the thread it was saved in and the two messages saved. `replayed` marks an answer saved earlier. */
export type ChatReply = { message: string; provider: "DeepSeek"; thread: ChatThreadSummary & { next: number }; turns: StoredTurn[]; replayed?: true };
/** One thread as the browser store kept it (`education-workspace-chats-v1:<userId>`, until 2026-11-12). */
export type BrowserThread = { id: string; title: string; subject: ChatSubject; mode: ChatMode; language: "mn" | "en"; updatedAt: number; turns: StoredTurn[] };
/** A browser thread checked for the account; `browserId` only ever feeds the import key. */
export type ImportedThread = Omit<BrowserThread, "id"> & { browserId: string };

/** One moved thread per request: 60 messages of 12,000 characters still fit; previews are dropped first when not. */
export const CHAT_IMPORT_BODY_BYTES = 3 * 1024 * 1024;

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const isSubject = (value: unknown): value is ChatSubject => (CHAT_SUBJECTS as readonly unknown[]).includes(value);
const isMode = (value: unknown): value is ChatMode => (CHAT_MODES as readonly unknown[]).includes(value);
const isLanguage = (value: unknown): value is "mn" | "en" => value === "mn" || value === "en";
const isRole = (value: unknown): value is ChatTurn["role"] => value === "user" || value === "assistant";
const position = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const moment = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
/** Browser thread ids were random UUIDs or a time-and-random string. */
const BROWSER_ID = /^[A-Za-z0-9_-]{1,100}$/;
const encoder = new TextEncoder();
const bytes = (value: unknown) => encoder.encode(JSON.stringify(value)).length;

/** A message's text as the account keeps it. */
export const storedText = (text: string) => text.slice(0, CHAT_STORE_LIMITS.chars);

/** The previews that still read as small pictures, at most three; anything else is left out. */
export function keepPreviews(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => readPreviews([item])?.length === 1).slice(0, CHAT_STORE_LIMITS.previews);
}

/** The turns the model sees before a new message: the last six, each cut to 2,500 characters, text only. */
export function historyTurns(turns: readonly { role: string; content: string }[]): ChatTurn[] {
  return turns.filter((turn): turn is ChatTurn => isRole(turn.role)).slice(-CHAT_LIMITS.history).map(turn => ({ role: turn.role, content: turn.content.slice(0, CHAT_LIMITS.turn) }));
}

/**
 * True when the thread already ends with this exact question and its answer, saved past what the page had read
 * (`after`): the page lost the response and sent the same message again. The saved answer is returned instead
 * of asking the model twice. A question the page had already seen and asks again is a new question.
 */
export function answeredAlready(last: readonly { position: number; role: string; content: string }[], after: number, message: string) {
  const [asked, answer] = last.slice(-2);
  return Boolean(asked && answer && asked.role === "user" && answer.role === "assistant" && answer.position === asked.position + 1
    && asked.position >= after && asked.content === storedText(message.trim()));
}

/** The newest messages a thread keeps; the oldest go first. */
export function keepMessages<T>(turns: readonly T[]): T[] {
  return turns.slice(-CHAT_STORE_LIMITS.messages);
}

function readTurn(value: unknown): StoredTurn | null {
  if (!record(value) || !onlyKeys(value, ["role", "content", "images"]) || !isRole(value.role) || typeof value.content !== "string" || value.content.length > CHAT_STORE_LIMITS.chars) return null;
  const images = value.role === "user" ? keepPreviews(value.images) : [];
  return { role: value.role, content: value.content, ...(images.length ? { images } : {}) };
}

/** One thread in the list, as the server sends it. */
export function readThreadSummary(value: unknown): ChatThreadSummary | null {
  if (!record(value) || !isChatThreadId(value.id) || typeof value.title !== "string" || !isSubject(value.subject) || !isMode(value.mode) || !isLanguage(value.language) || !moment(value.updatedAt)) return null;
  return { id: value.id, title: value.title, subject: value.subject, mode: value.mode, language: value.language, updatedAt: value.updatedAt };
}

/** One thread with its messages, as the server sends it. */
export function readThreadView(value: unknown): ChatThreadView | null {
  const summary = readThreadSummary(value);
  if (!summary || !record(value) || !position(value.next) || !Array.isArray(value.turns) || value.turns.length > CHAT_STORE_LIMITS.messages) return null;
  const turns = value.turns.map(readTurn);
  if (turns.some(turn => !turn)) return null;
  return { ...summary, next: value.next, turns: turns as StoredTurn[] };
}

/** A chat reply from the server: the answer and the question saved with it. */
export function readChatReply(value: unknown): ChatReply | null {
  if (!record(value) || typeof value.message !== "string" || !value.message || !record(value.thread) || !Array.isArray(value.turns) || value.turns.length !== 2) return null;
  const thread = readThreadSummary(value.thread);
  const next = value.thread.next;
  const turns = value.turns.map(readTurn);
  if (!thread || !position(next) || next < 2 || turns[0]?.role !== "user" || turns[1]?.role !== "assistant") return null;
  return { message: value.message, provider: "DeepSeek", thread: { ...thread, next }, turns: turns as StoredTurn[], ...(value.replayed === true ? { replayed: true as const } : {}) };
}

/**
 * One thread from the old browser store, in the import body's shape. The browser only tidies it; the server
 * checks it again. Threads without messages have nothing to move.
 */
export function readBrowserThread(value: unknown): BrowserThread | null {
  if (!record(value) || typeof value.id !== "string" || !BROWSER_ID.test(value.id) || typeof value.title !== "string") return null;
  if (!isSubject(value.subject) || !isMode(value.mode) || !isLanguage(value.language) || typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) || value.updatedAt <= 0) return null;
  if (!Array.isArray(value.turns) || !value.turns.length) return null;
  const turns: StoredTurn[] = [];
  for (const turn of value.turns) {
    if (!record(turn) || !isRole(turn.role) || typeof turn.content !== "string") return null;
    const images = turn.role === "user" ? keepPreviews(turn.images) : [];
    turns.push({ role: turn.role, content: storedText(turn.content), ...(images.length ? { images } : {}) });
  }
  return {
    id: value.id, title: value.title.replace(/\s+/g, " ").trim().slice(0, CHAT_LIMITS.title), subject: value.subject, mode: value.mode,
    language: value.language, updatedAt: Math.round(value.updatedAt), turns: keepMessages(turns),
  };
}

/** A browser thread as one import body under the size cap: previews are dropped first, then the oldest messages. */
export function fitImportThread(thread: BrowserThread, maxBytes: number = CHAT_IMPORT_BODY_BYTES): BrowserThread {
  if (bytes({ thread }) <= maxBytes) return thread;
  const turns = thread.turns.map(turn => ({ role: turn.role, content: turn.content }));
  const sizes = turns.map(turn => bytes(turn) + 1);
  let total = bytes({ thread: { ...thread, turns: [] } }) + sizes.reduce((sum, size) => sum + size, 0);
  let first = 0;
  while (first < turns.length - 1 && total > maxBytes) total -= sizes[first++];
  return { ...thread, turns: turns.slice(first) };
}

/**
 * The import body, checked field by field with the account's limits: exact keys, known subject, mode and
 * language, 1 to 60 messages of at most 12,000 characters. Previews that do not read as small pictures are left
 * out. A time in the future is treated as now; an empty title is made from the first question.
 */
export function readChatImport(value: unknown, now = Date.now()): ImportedThread | null {
  if (!record(value) || !onlyKeys(value, ["thread"]) || !record(value.thread)) return null;
  const thread = value.thread;
  if (!onlyKeys(thread, ["id", "title", "subject", "mode", "language", "updatedAt", "turns"])) return null;
  if (typeof thread.id !== "string" || !BROWSER_ID.test(thread.id)) return null;
  if (typeof thread.title !== "string" || thread.title.length > CHAT_LIMITS.title) return null;
  if (!isSubject(thread.subject) || !isMode(thread.mode) || !isLanguage(thread.language) || !moment(thread.updatedAt)) return null;
  if (!Array.isArray(thread.turns) || !thread.turns.length || thread.turns.length > CHAT_STORE_LIMITS.messages) return null;
  const turns: StoredTurn[] = [];
  for (const turn of thread.turns) {
    if (!record(turn) || !onlyKeys(turn, ["role", "content", "images"]) || !isRole(turn.role) || typeof turn.content !== "string" || turn.content.length > CHAT_STORE_LIMITS.chars) return null;
    if (turn.images !== undefined && (!Array.isArray(turn.images) || turn.images.length > CHAT_STORE_LIMITS.previews)) return null;
    const images = turn.role === "user" ? keepPreviews(turn.images) : [];
    turns.push({ role: turn.role, content: turn.content, ...(images.length ? { images } : {}) });
  }
  const title = thread.title.replace(/\s+/g, " ").trim() || threadTitle(turns.find(turn => turn.role === "user")?.content ?? "");
  return { browserId: thread.id, title, subject: thread.subject, mode: thread.mode, language: thread.language, updatedAt: Math.min(thread.updatedAt, now), turns };
}
