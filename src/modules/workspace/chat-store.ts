"use client";
import { useEffect, useSyncExternalStore } from "react";
import { CHAT_MODES, CHAT_STORE_LIMITS, CHAT_SUBJECTS, isChatThreadId, type ChatMode, type ChatSubject } from "./chat-contract";
import { fitImportThread, readBrowserThread, readThreadSummary, readThreadView, type BrowserThread, type ChatThreadSummary, type ChatThreadView } from "./chat-storage";
import { AI_IMAGE_LIMITS } from "@/modules/ai-images/contracts";
import type { AttachedImage } from "@/modules/ai-images/client";

// Chats live on the account (2026-11-12). This file keeps the page's copy of the student's thread list for the
// sidebar and the chat page, applies a send or a delete to it at once and reads it again when the tab comes back.
// It also moves the threads an older version kept in this browser to the account, once, and then forgets them here.
export type { ChatThreadSummary, ChatThreadView, StoredTurn } from "./chat-storage";
export type PendingPrompt = { text: string; subject: ChatSubject; mode: ChatMode; language: "mn" | "en"; images?: AttachedImage[] };
export type ThreadRead = { kind: "ok"; thread: ChatThreadView } | { kind: "missing" } | { kind: "error"; message: string };

const API = "/api/workspace/chat/threads";
const BROWSER_PREFIX = "education-workspace-chats-v1:";
const PENDING = "education-workspace-pending";
const EVENT = "education-workspace-chats";
/** Coming back to a tab reads the list again when it is older than this: another device may have chatted. */
const STALE_MS = 60_000;
const EMPTY: ChatThreadSummary[] = [];

/** A send or delete the server has confirmed, kept so a list read that was already on its way cannot undo it. */
type Change = { at: number; id: string; thread: ChatThreadSummary | null };
const store = {
  key: "", list: null as ChatThreadSummary[] | null, readAt: 0, loading: null as Promise<void> | null,
  browserChecked: false, changes: [] as Change[], moved: new Map<string, string>(),
};

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const emit = () => dispatchEvent(new Event(EVENT));
const ordered = (list: ChatThreadSummary[]) => [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, CHAT_STORE_LIMITS.threads);
function put(list: ChatThreadSummary[], thread: ChatThreadSummary) {
  const known = list.find(item => item.id === thread.id);
  return known && known.updatedAt > thread.updatedAt ? list : ordered([thread, ...list.filter(item => item.id !== thread.id)]);
}
/** The store follows one account; signing in as someone else starts it afresh. */
function select(userKey: string) {
  if (store.key === userKey) return;
  Object.assign(store, { key: userKey, list: null, readAt: 0, loading: null, browserChecked: false, changes: [], moved: new Map() });
}
function subscribe(callback: () => void) {
  addEventListener(EVENT, callback);
  return () => removeEventListener(EVENT, callback);
}

/** The student's threads, newest first (`id`, `title`, subject, mode, language, `updatedAt`). Empty until read. */
export function useThreads(userKey: string | null) {
  const threads = useSyncExternalStore(subscribe, () => userKey && store.key === userKey && store.list ? store.list : EMPTY, () => EMPTY);
  useEffect(() => {
    if (!userKey) return;
    void loadThreads(userKey);
    const wake = () => { if (document.visibilityState === "visible" && Date.now() - store.readAt > STALE_MS) void loadThreads(userKey, true); };
    document.addEventListener("visibilitychange", wake);
    return () => document.removeEventListener("visibilitychange", wake);
  }, [userKey]);
  return threads;
}

/** The list as this page knows it now. */
export function threadsNow(userKey: string) {
  return store.key === userKey ? store.list ?? EMPTY : EMPTY;
}

/** Read the list from the account, after moving this browser's old threads there (once per page load). */
export function loadThreads(userKey: string, force = false): Promise<void> {
  select(userKey);
  if (store.loading) return store.loading;
  const kept = store.browserChecked ? [] : browserThreads(userKey);
  store.browserChecked = true;
  if (store.readAt && !force && !kept.length) return Promise.resolve();
  const run = (async () => {
    if (kept.length) await moveBrowserThreads(userKey, kept);
    const started = Date.now();
    const response = await fetch(API, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const data: unknown = response.ok ? await response.json() : null;
    const read = record(data) && Array.isArray(data.threads) ? data.threads.flatMap(item => readThreadSummary(item) ?? []) : null;
    if (!read || store.key !== userKey) return;
    let list = ordered(read);
    for (const change of store.changes) if (change.at >= started) list = change.thread ? put(list, change.thread) : list.filter(item => item.id !== change.id);
    store.changes = store.changes.filter(change => change.at >= started);
    Object.assign(store, { list, readAt: Date.now() });
    emit();
  })().catch(() => { /* The list stays as it was; the next visit or a returning tab reads it again. */ }).finally(() => {
    if (store.key === userKey) store.loading = null;
  });
  store.loading = run;
  return run;
}

/** The chat page reads the list on the server, so the sidebar can show it before its own read returns. */
export function seedThreads(userKey: string, list: ChatThreadSummary[]) {
  select(userKey);
  if (store.readAt) return;
  Object.assign(store, { list: ordered(list), readAt: Date.now() });
  emit();
}

function change(userKey: string, id: string, thread: ChatThreadSummary | null) {
  select(userKey);
  store.changes.push({ at: Date.now(), id, thread });
  const list = store.list ?? [];
  store.list = thread ? put(list, thread) : list.filter(item => item.id !== id);
  emit();
}
/** A thread the server just saved a turn in moves to the top of the list. */
export function rememberThread(userKey: string, thread: ChatThreadSummary) { change(userKey, thread.id, thread); }

/** One of the student's threads with its messages, read from the account. */
export async function fetchThread(id: string): Promise<ThreadRead> {
  if (!isChatThreadId(id)) return { kind: "missing" };
  try {
    const response = await fetch(API + "/" + encodeURIComponent(id), { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    if (response.status === 400 || response.status === 404) return { kind: "missing" };
    if (response.status === 401) return { kind: "error", message: "Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү." };
    const data: unknown = response.ok ? await response.json().catch(() => null) : null;
    const thread = record(data) ? readThreadView(data.thread) : null;
    return thread ? { kind: "ok", thread } : { kind: "error", message: "Чатыг ачаалж чадсангүй. Дахин оролдоно уу." };
  } catch {
    return { kind: "error", message: "Чатыг ачаалж чадсангүй. Холболтоо шалгаад дахин оролдоно уу." };
  }
}

/** Delete one of the student's threads on the account. One already gone counts as deleted. */
export async function removeThread(userKey: string, id: string) {
  let response: Response;
  try { response = await fetch(API + "/" + encodeURIComponent(id), { method: "DELETE", signal: AbortSignal.timeout(20_000) }); }
  catch { throw new Error("Чатыг устгаж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."); }
  if (!response.ok && response.status !== 404) {
    const data: unknown = await response.json().catch(() => null);
    throw new Error(record(data) && typeof data.error === "string" ? data.error : "Чатыг устгаж чадсангүй. Дахин оролдоно уу.");
  }
  change(userKey, id, null);
}

/** The account's id for a thread this browser kept before the move, once it has moved on this page. */
export function movedThread(userKey: string, browserId: string) {
  return store.key === userKey ? store.moved.get(browserId) ?? null : null;
}

/** The threads this browser still keeps for this account, newest first; the account takes the newest 30. */
function browserThreads(userKey: string): BrowserThread[] {
  let parsed: unknown;
  try { parsed = JSON.parse(localStorage.getItem(BROWSER_PREFIX + userKey) ?? "null"); } catch { parsed = []; }
  if (parsed === null) return [];
  const threads = (Array.isArray(parsed) ? parsed : []).flatMap(item => readBrowserThread(item) ?? []);
  if (!threads.length) keepBrowserThreads(userKey, new Set());
  return threads.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, CHAT_STORE_LIMITS.threads);
}

/** Keep only these threads in this browser; the key goes once none is left. */
function keepBrowserThreads(userKey: string, ids: Set<string>) {
  let parsed: unknown = [];
  try { parsed = JSON.parse(localStorage.getItem(BROWSER_PREFIX + userKey) ?? "[]"); } catch { /* Unreadable: nothing in it can move. */ }
  const rest = Array.isArray(parsed) ? parsed.filter(item => record(item) && typeof item.id === "string" && ids.has(item.id)) : [];
  try {
    if (rest.length) localStorage.setItem(BROWSER_PREFIX + userKey, JSON.stringify(rest));
    else localStorage.removeItem(BROWSER_PREFIX + userKey);
  } catch { /* Storage can be blocked or unreadable; the account recognises a thread it already has. */ }
}

/**
 * Send each browser thread to the account once. A thread the account has (or keeps out as older than a full
 * account's threads) is forgotten here; one the server can never take is let go; one that could not be sent
 * now stays for the next visit.
 */
async function moveBrowserThreads(userKey: string, threads: BrowserThread[]) {
  const stay = new Set<string>();
  let stop = false;
  for (const thread of threads) {
    if (stop) { stay.add(thread.id); continue; }
    try {
      const response = await fetch(API + "/import", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thread: fitImportThread(thread) }), signal: AbortSignal.timeout(30_000),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok) { if (record(data) && typeof data.id === "string") store.moved.set(thread.id, data.id); continue; }
      if (response.status === 400 || response.status === 413) continue;
      stay.add(thread.id);
      // Signed out, refused or over today's limit: the rest wait for a later visit too.
      if (response.status === 401 || response.status === 403 || response.status === 429) stop = true;
    } catch { stay.add(thread.id); }
  }
  keepBrowserThreads(userKey, stay);
}

/** The home composer hands its first message to the chat page without putting it in the URL. */
export function setPendingPrompt(prompt: PendingPrompt) {
  try { sessionStorage.setItem(PENDING, JSON.stringify(prompt)); return true; } catch { return false; }
}
export function takePendingPrompt(): PendingPrompt | null {
  try {
    const raw = sessionStorage.getItem(PENDING);
    sessionStorage.removeItem(PENDING);
    const value = raw ? JSON.parse(raw) as PendingPrompt : null;
    if (!value || typeof value.text !== "string") return null;
    if (!(CHAT_SUBJECTS as readonly string[]).includes(value.subject) || !(CHAT_MODES as readonly string[]).includes(value.mode) || !["mn", "en"].includes(value.language)) return null;
    const images = Array.isArray(value.images) ? value.images.filter(image => image && typeof image.url === "string" && typeof image.thumb === "string" && typeof image.id === "string").slice(0, AI_IMAGE_LIMITS.perMessage) : [];
    if (!value.text.trim() && !images.length) return null;
    return { ...value, images };
  } catch { return null; }
}
