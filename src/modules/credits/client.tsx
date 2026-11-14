"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AI_ACTIONS, creditCost, formatCredits, readReceipt, type AiAction } from "./pricing";
import styles from "./credits.module.css";

/**
 * The balance as the page knows it; null for guests or when it could not be read. `balance` is every credit left,
 * `allowance` the meter's size, and `yellow` the purchased ("yellow") credits within them, shown apart.
 */
export type CreditBalance = { balance: number; allowance: number; yellow: number } | null;
type CreditsValue = { balance: CreditBalance; apply: (reply: unknown) => void; spendYellow: (credits: number) => void };

const CreditsContext = createContext<CreditsValue>({ balance: null, apply: () => {}, spendYellow: () => {} });

/** Holds the balance for the Workspace; every AI reply's receipt updates it without a reload. */
export function CreditsProvider({ initial, children }: { initial: CreditBalance; children: ReactNode }) {
  const [balance, setBalance] = useState(initial);
  // A fresh server read (another layout, or a refresh) replaces the figure kept on the page.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) { setSeen(initial); setBalance(initial); }
  const apply = useCallback((reply: unknown) => {
    const receipt = readReceipt(reply);
    if (receipt) setBalance(current => ({ balance: receipt.balance, allowance: receipt.allowance, yellow: receipt.yellow ?? Math.min(current?.yellow ?? 0, receipt.balance) }));
  }, []);
  // Yellow credits spent outside an AI reply (permanent vocabulary space) leave the meter at once.
  const spendYellow = useCallback((credits: number) => {
    if (!Number.isSafeInteger(credits) || credits <= 0) return;
    setBalance(current => current && { balance: Math.max(0, current.balance - credits), allowance: Math.max(0, current.allowance - credits), yellow: Math.max(0, current.yellow - credits) });
  }, []);
  const value = useMemo(() => ({ balance, apply, spendYellow }), [balance, apply, spendYellow]);
  return <CreditsContext value={value}>{children}</CreditsContext>;
}

export function useCredits() { return useContext(CreditsContext); }

/** The credits that are not purchased: this month's free credits, any bonus and the plan terms' credits. */
export function normalCredits(balance: NonNullable<CreditBalance>) {
  return { left: Math.max(0, balance.balance - balance.yellow), size: Math.max(0, balance.allowance - balance.yellow) };
}

function Bolt() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12Z" /></svg>;
}

/**
 * What one AI action costs, shown before the student sends it. The full badge adds the remaining
 * balance (or a warning when it is short); `compact` fits inside a button and inherits its colour.
 * An action priced by its result passes the most it can cost as `cost` with `upTo`.
 */
export function CreditCost({ action, cost: most, images = 0, upTo = false, english = false, compact = false, suffix, className }: {
  action: AiAction; cost?: number; images?: number; upTo?: boolean; english?: boolean; compact?: boolean; suffix?: string; className?: string;
}) {
  const { balance } = useCredits();
  // Attached images raise a conversation reply's price; the badge follows as soon as one is added.
  const cost = most ?? creditCost(action, images);
  const unit = english ? (cost === 1 ? "credit" : "credits") : "кредит";
  const prefix = upTo ? (english ? "up to " : "хамгийн ихдээ ") : "";
  const short = balance !== null && balance.balance < cost;
  const left = balance === null ? "" : short ? (english ? "not enough" : "хүрэлцэхгүй") : english ? `${formatCredits(balance.balance)} left` : `${formatCredits(balance.balance)} үлдсэн`;
  const pictures = images > 0 && most === undefined ? ` (${english ? "incl." : "үүнд"} ${images} ${english ? (images === 1 ? "image" : "images") : "зураг"})` : "";
  const title = `${AI_ACTIONS[action].area} · ${AI_ACTIONS[action].label}: ${prefix}${cost} ${unit}${pictures}`;
  const classes = [styles.cost, compact ? styles.compact : "", short ? styles.short : "", className ?? ""].filter(Boolean).join(" ");
  if (compact) return <span className={classes} title={title} data-credit-cost={cost} data-credit-action={action}><Bolt />{upTo ? "≤" : ""}{cost}<span className={styles.hidden}> {unit}</span></span>;
  return <span className={classes} title={title} data-credit-cost={cost} data-credit-action={action}>
    <Bolt /><span>{prefix}{cost} {unit}{suffix ? " " + suffix : ""}</span>{left ? <span className={styles.left}>· {left}</span> : null}
  </span>;
}
