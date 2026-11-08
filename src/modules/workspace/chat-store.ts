"use client";
import { useSyncExternalStore } from "react";
import { CHAT_MODES, CHAT_SUBJECTS, type ChatMode, type ChatSubject, type ChatTurn } from "./chat-contract";

// Chats live only in this browser, per account, like Essay Studio drafts: nothing is stored on the server.
export type ChatThread = { id: string; title: string; subject: ChatSubject; mode: ChatMode; language: "mn" | "en"; updatedAt: number; turns: ChatTurn[] };
export type PendingPrompt = { text: string; subject: ChatSubject; mode: ChatMode; language: "mn" | "en" };

const PREFIX = "education-workspace-chats-v1:";
const PENDING = "education-workspace-pending";
const EVENT = "education-workspace-chats";
const MAX_THREADS = 30, MAX_TURNS = 60, MAX_CHARS = 12000;
const EMPTY: ChatThread[] = [];

const cached = { raw: null as string | null, key: "", value: EMPTY };
function validThread(value: unknown): value is ChatThread {
  if (!value || typeof value !== "object") return false;
  const thread = value as Record<string, unknown>;
  return typeof thread.id === "string" && typeof thread.title === "string" && typeof thread.updatedAt === "number"
    && (CHAT_SUBJECTS as readonly string[]).includes(String(thread.subject)) && (CHAT_MODES as readonly string[]).includes(String(thread.mode))
    && ["mn", "en"].includes(String(thread.language)) && Array.isArray(thread.turns)
    && thread.turns.every(turn => turn && typeof turn === "object" && ["user", "assistant"].includes(String((turn as ChatTurn).role)) && typeof (turn as ChatTurn).content === "string");
}
function read(userKey: string): ChatThread[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(PREFIX + userKey); } catch { /* Storage can be blocked; chats then last for this page only. */ }
  if (raw === cached.raw && userKey === cached.key) return cached.value;
  let value = EMPTY;
  try { const parsed: unknown = raw ? JSON.parse(raw) : []; value = Array.isArray(parsed) ? parsed.filter(validThread) : EMPTY; } catch { value = EMPTY; }
  Object.assign(cached, { raw, key: userKey, value });
  return value;
}
function subscribe(callback: () => void) {
  addEventListener("storage", callback);
  addEventListener(EVENT, callback);
  return () => { removeEventListener("storage", callback); removeEventListener(EVENT, callback); };
}

export function useThreads(userKey: string | null) {
  return useSyncExternalStore(subscribe, () => userKey ? read(userKey) : EMPTY, () => EMPTY);
}

export function saveThread(userKey: string, thread: ChatThread) {
  const trimmed = { ...thread, turns: thread.turns.slice(-MAX_TURNS).map(turn => ({ ...turn, content: turn.content.slice(0, MAX_CHARS) })) };
  const others = read(userKey).filter(item => item.id !== thread.id);
  write(userKey, [trimmed, ...others].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_THREADS));
}
export function deleteThread(userKey: string, id: string) {
  write(userKey, read(userKey).filter(item => item.id !== id));
}
function write(userKey: string, threads: ChatThread[]) {
  try { localStorage.setItem(PREFIX + userKey, JSON.stringify(threads)); }
  catch {
    // Full storage: keep the newest half rather than losing the current conversation.
    try { localStorage.setItem(PREFIX + userKey, JSON.stringify(threads.slice(0, Math.ceil(threads.length / 2)))); } catch { /* Nothing more to do. */ }
  }
  dispatchEvent(new Event(EVENT));
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
    if (!value || typeof value.text !== "string" || !value.text.trim()) return null;
    if (!(CHAT_SUBJECTS as readonly string[]).includes(value.subject) || !(CHAT_MODES as readonly string[]).includes(value.mode) || !["mn", "en"].includes(value.language)) return null;
    return value;
  } catch { return null; }
}

export function newThreadId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
}
