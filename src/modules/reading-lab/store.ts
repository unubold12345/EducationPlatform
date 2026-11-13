"use client";
import { useSyncExternalStore } from "react";
import { READING_LIMITS } from "./contracts.ts";
import { isSampleId, legacyState, readState, type LegacyState, type PracticeState } from "./state.ts";

// Since 2026-11-12 a signed-in student's Reading Lab practices and sample progress live on the account. This browser
// keeps only a guest's sample progress (the shared "guest" slot; guests have no account) and the text size, a
// per-device display preference. Until 2026-11-12 everything lived here per account, with a generated practice's
// key sealed in a token; `legacyReading` reads what a browser still holds so the page can move it to the account
// once, and the forget functions remove it afterwards. The guest slot is never moved or removed.
const PREFIX = "education-reading-lab-v1:";
const GUEST = "guest";
const TEXT_SIZE = "education-reading-lab-text-v1";
const EVENT = "education-reading-lab";

export type TextSize = 0 | 1 | 2;

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
function readItem(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function parse(raw: string | null): Record<string, unknown> {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    return record(value) ? value : {};
  } catch { return {}; }
}
function samplesOf(value: unknown): Record<string, PracticeState> {
  const samples: Record<string, PracticeState> = {};
  if (record(value)) for (const [id, state] of Object.entries(value).slice(0, 20)) if (isSampleId(id)) samples[id] = readState(state);
  return samples;
}
function subscribe(callback: () => void) {
  addEventListener("storage", callback);
  addEventListener(EVENT, callback);
  return () => { removeEventListener("storage", callback); removeEventListener(EVENT, callback); };
}
function changed() {
  dispatchEvent(new Event(EVENT));
}

// ---------- Guests ----------

const EMPTY: Record<string, PracticeState> = {};
const cached = { raw: null as string | null, value: EMPTY };
function guestSamples() {
  const raw = readItem(PREFIX + GUEST);
  if (raw !== cached.raw) Object.assign(cached, { raw, value: samplesOf(parse(raw).samples) });
  return cached.value;
}
/** A guest's sample progress in this browser. */
export function useGuestSamples() {
  return useSyncExternalStore(subscribe, guestSamples, () => EMPTY);
}
export function setGuestSample(id: string, state: PracticeState) {
  const lab = parse(readItem(PREFIX + GUEST));
  try { localStorage.setItem(PREFIX + GUEST, JSON.stringify({ ...lab, samples: { ...samplesOf(lab.samples), [id]: state } })); }
  catch { /* Storage can be blocked or full; progress then lasts for this page only. */ }
  changed();
}

// ---------- Text size (this device) ----------

function textSize(): TextSize {
  const value = Number(readItem(TEXT_SIZE) ?? 1);
  return value === 0 || value === 2 ? value : 1;
}
export function useTextSize() {
  return useSyncExternalStore(subscribe, textSize, () => 1 as TextSize);
}
export function saveTextSize(size: TextSize) {
  try { localStorage.setItem(TEXT_SIZE, String(size)); } catch { /* A display preference; nothing else to do. */ }
  changed();
}

// ---------- Moving a signed-in student's browser data to the account ----------

/** One practice a browser kept, as the body the import route accepts. The server believes only its token. */
export type LegacyPractice = { id: string; body: { kind: "practice"; token: string; paragraphs: unknown; state: LegacyState } };
type Movable = Record<string, unknown> & { id: string; token: string };
/** A kept practice that can move: one without a usable token could not be checked before the move either. */
const movable = (item: unknown): item is Movable => record(item) && typeof item.id === "string" && typeof item.token === "string"
  && item.token.length >= 40 && item.token.length <= READING_LIMITS.tokenChars;

/** What this browser still keeps for this account, newest practice first. Empty once everything has moved. */
export function legacyReading(userKey: string): { practices: LegacyPractice[]; samples: Record<string, LegacyState> | null } {
  if (userKey === GUEST) return { practices: [], samples: null };
  const lab = parse(readItem(PREFIX + userKey));
  const found = (Array.isArray(lab.own) ? lab.own : []).filter(movable).map(item => ({
    practice: { id: item.id, body: { kind: "practice", token: item.token, paragraphs: item.paragraphs, state: legacyState(readState(item.state)) } } satisfies LegacyPractice,
    createdAt: typeof item.createdAt === "number" && Number.isFinite(item.createdAt) ? item.createdAt : 0,
  }));
  // The account keeps at most 20: when it fills up, the newest practices are the ones that moved.
  found.sort((a, b) => b.createdAt - a.createdAt);
  const kept = Object.entries(samplesOf(lab.samples));
  return {
    practices: found.map(entry => entry.practice),
    samples: kept.length ? Object.fromEntries(kept.map(([id, state]) => [id, legacyState(state)])) : null,
  };
}

/**
 * Remove part of this account's browser data once the account has it. The slot itself goes as soon as nothing
 * that could still move is left in it; the text size chosen before the move stays as this device's preference.
 */
function forget(userKey: string, change: (lab: Record<string, unknown>) => Record<string, unknown>) {
  if (userKey === GUEST) return;
  const key = PREFIX + userKey;
  try {
    const lab = change(parse(localStorage.getItem(key)));
    const own = (Array.isArray(lab.own) ? lab.own : []).filter(movable);
    const samples = samplesOf(lab.samples);
    if (own.length || Object.keys(samples).length) { localStorage.setItem(key, JSON.stringify({ ...lab, own, samples })); return; }
    if (typeof lab.textSize === "number" && localStorage.getItem(TEXT_SIZE) === null) localStorage.setItem(TEXT_SIZE, String(lab.textSize));
    localStorage.removeItem(key);
  } catch { /* Storage can be blocked; the server recognises a practice it has already moved. */ }
}
export function forgetLegacyPractice(userKey: string, id: string) {
  forget(userKey, lab => ({ ...lab, own: (Array.isArray(lab.own) ? lab.own : []).filter(item => !record(item) || item.id !== id) }));
}
export function forgetLegacySamples(userKey: string) {
  forget(userKey, lab => ({ ...lab, samples: {} }));
}
/** A visit with nothing left to move still removes an emptied slot. */
export function tidyLegacyReading(userKey: string) {
  forget(userKey, lab => lab);
}
