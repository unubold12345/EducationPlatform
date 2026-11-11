// Browser-side calls to the vocabulary API. Every route is same-origin and session-checked on the server.
export const VOCABULARY_API = "/api/workspace/vocabulary";

export type Notice = { tone: "ok" | "bad"; text: string };

export const failure = (reason: unknown, fallback: string) => reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : fallback;

export async function request<T>(url: string, init: RequestInit, timeout = 20_000): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  const data = await response.json().catch(() => ({})) as Record<string, unknown> & { error?: string };
  if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Хүсэлт амжилтгүй боллоо. Дахин оролдоно уу.");
  return data as T;
}

export function sendJson<T>(url: string, body: unknown, method: "POST" | "PATCH" = "POST", timeout = 20_000) {
  return request<T>(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, timeout);
}

/** Browser storage that never throws (private windows, blocked site data). */
export function readStored<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}
export function writeStored(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* The page works without it. */ }
}
