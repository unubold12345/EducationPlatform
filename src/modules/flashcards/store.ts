"use client";
import { useSyncExternalStore } from "react";
import { FLASHCARD_LIMITS, type CardLanguage } from "./contracts";

// Decks live only in this browser, per account, like Workspace chats and Essay Studio drafts.
export type StoredCard = { id: string; front: string; back: string; hint?: string };
export type Deck = {
  id: string;
  title: string;
  sourceName: string;
  sourceKind: string;
  language: CardLanguage;
  createdAt: number;
  updatedAt: number;
  cards: StoredCard[];
  known: string[];
};

const PREFIX = "education-flashcards-v1:";
const EVENT = "education-flashcards";
const EMPTY: Deck[] = [];
const MAX_DECKS = FLASHCARD_LIMITS.decks;
const MAX_CARDS = FLASHCARD_LIMITS.cards;

const cached = { raw: null as string | null, key: "", value: EMPTY };

function validCard(value: unknown): value is StoredCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return typeof card.id === "string" && typeof card.front === "string" && typeof card.back === "string"
    && card.front.length > 0 && card.front.length <= 500 && card.back.length > 0 && card.back.length <= 1500
    && (card.hint === undefined || (typeof card.hint === "string" && card.hint.length <= 400));
}
function validDeck(value: unknown): value is Deck {
  if (!value || typeof value !== "object") return false;
  const deck = value as Record<string, unknown>;
  return typeof deck.id === "string" && deck.id.length > 0 && deck.id.length <= 80
    && typeof deck.title === "string" && deck.title.length > 0 && deck.title.length <= 140
    && typeof deck.sourceName === "string" && deck.sourceName.length <= 160
    && typeof deck.sourceKind === "string" && deck.sourceKind.length <= 20
    && (deck.language === "mn" || deck.language === "en")
    && Number.isFinite(deck.createdAt) && Number.isFinite(deck.updatedAt)
    && Array.isArray(deck.cards) && deck.cards.length > 0 && deck.cards.length <= MAX_CARDS
    && deck.cards.every(validCard)
    && Array.isArray(deck.known) && deck.known.every(id => typeof id === "string");
}
function read(userKey: string): Deck[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(PREFIX + userKey); } catch { /* Storage can be blocked; decks then last for this page only. */ }
  if (raw === cached.raw && userKey === cached.key) return cached.value;
  let value = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    value = Array.isArray(parsed) ? parsed.filter(validDeck).slice(0, MAX_DECKS) : EMPTY;
  } catch { value = EMPTY; }
  Object.assign(cached, { raw, key: userKey, value });
  return value;
}
function subscribe(callback: () => void) {
  addEventListener("storage", callback);
  addEventListener(EVENT, callback);
  return () => { removeEventListener("storage", callback); removeEventListener(EVENT, callback); };
}
function write(userKey: string, decks: Deck[]) {
  try { localStorage.setItem(PREFIX + userKey, JSON.stringify(decks)); }
  catch {
    try { localStorage.setItem(PREFIX + userKey, JSON.stringify(decks.slice(0, Math.ceil(decks.length / 2)))); } catch { /* Nothing more to do. */ }
  }
  dispatchEvent(new Event(EVENT));
}

export function useDecks(userKey: string | null) {
  return useSyncExternalStore(subscribe, () => userKey ? read(userKey) : EMPTY, () => EMPTY);
}
export function saveDeck(userKey: string, deck: Deck) {
  const trimmed: Deck = { ...deck, cards: deck.cards.slice(0, MAX_CARDS), known: deck.known.filter(id => deck.cards.some(card => card.id === id)) };
  write(userKey, [trimmed, ...read(userKey).filter(item => item.id !== deck.id)].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_DECKS));
}
export function deleteDeck(userKey: string, id: string) {
  write(userKey, read(userKey).filter(deck => deck.id !== id));
}
/** Study results persist per card: a card counts as known until the student marks it again. */
export function setCardKnown(userKey: string, deckId: string, cardId: string, known: boolean) {
  const decks = read(userKey);
  const deck = decks.find(item => item.id === deckId);
  if (!deck || !deck.cards.some(card => card.id === cardId)) return;
  const next = known ? [...new Set([...deck.known, cardId])] : deck.known.filter(id => id !== cardId);
  saveDeck(userKey, { ...deck, known: next, updatedAt: Date.now() });
}
export function resetKnown(userKey: string, deckId: string) {
  const deck = read(userKey).find(item => item.id === deckId);
  if (deck) saveDeck(userKey, { ...deck, known: [], updatedAt: Date.now() });
}
export function newDeckId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
}
