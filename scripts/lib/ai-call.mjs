// The AI usage log for scripts and agent runs (owner rule 2026-11-20: every paid AI request must have a source).
// Any script, scratch file or agent tool that calls DeepSeek, Claude or DeepInfra imports `aiFetch` from here instead of
// calling `fetch` itself, so the request lands in the local `AiCall` table next to the site's own calls and shows on
// /admin?tab=ai. Same pricing rules as the site (`src/modules/ai-usage/core.ts`).
//
//   import { aiFetch } from "../scripts/lib/ai-call.mjs";   // from a scratch file: an absolute file:/// URL
//   const response = await aiFetch("deepseek", "https://api.deepseek.com/chat/completions", init, { source: "script:my-check" });
//
// Name the run with AI_USAGE_AGENT (for example "Claude Code (Opus 5.5)") so the admin page can tell agents apart.
// When the local database is not reachable the row goes to artifacts/ai-usage-unsaved.jsonl; `npm run ai:usage -- flush`
// moves it into the table later. Nothing here prints a key or a prompt.
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { aiCallRow, aiEnvironment, failureStatus, isBillable } from "../../src/modules/ai-usage/core.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const UNSAVED_FILE = path.join(ROOT, "artifacts", "ai-usage-unsaved.jsonl");
const COLUMNS = ["provider", "model", "origin", "source", "environment", "billable", "userId", "chargeId", "status", "httpStatus", "durationMs",
  "promptTokens", "cachedTokens", "completionTokens", "reasoningTokens", "units", "costMicroUsd", "costBasis", "agent", "requestId", "createdAt"];

/** The local database address: the environment's, else the repository's ignored `.env`. */
export function localDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.join(ROOT, ".env");
  if (!existsSync(file)) return "";
  return readFileSync(file, "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "") ?? "";
}

let pool = null;
function database() {
  const url = localDatabaseUrl();
  if (!url) return null;
  // Scripts must not write their usage into the hosted database by accident.
  if (!/^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(url)) return null;
  pool ??= new pg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 1000, allowExitOnIdle: true, connectionTimeoutMillis: 5000 });
  return pool;
}

/** Stores one row; returns true when it reached the table, false when it went to the unsaved file. */
export async function saveRow(row) {
  const db = database();
  if (db) {
    try {
      const values = [randomUUID(), ...COLUMNS.map(column => row[column])];
      await db.query(`INSERT INTO "AiCall" ("id",${COLUMNS.map(column => `"${column}"`).join(",")}) VALUES (${values.map((_, i) => "$" + (i + 1)).join(",")})`, values);
      return true;
    } catch (error) {
      process.stderr.write(`ai-usage: could not write to the local database (${error?.code ?? error?.name ?? "error"}); kept in ${path.relative(ROOT, UNSAVED_FILE)}\n`);
    }
  }
  mkdirSync(path.dirname(UNSAVED_FILE), { recursive: true });
  appendFileSync(UNSAVED_FILE, JSON.stringify(row) + "\n");
  return false;
}

function modelOf(init) {
  try { const model = JSON.parse(typeof init?.body === "string" ? init.body : "{}").model; return typeof model === "string" ? model : ""; } catch { return ""; }
}

/**
 * `fetch` for one provider request, recorded in the AI usage log. `facts.source` names the script ("script:<name>");
 * `facts.units` gives characters or audio milliseconds for speech. The response is returned untouched.
 */
export async function aiFetch(provider, url, init = {}, facts = {}) {
  const at = new Date(), started = Date.now();
  const base = {
    provider, origin: "script", environment: aiEnvironment(process.env), billable: isBillable(provider, String(url)), at,
    source: facts.source ?? "script:" + path.basename(process.argv[1] ?? "unknown"), model: facts.model ?? modelOf(init), units: facts.units,
    agent: facts.agent ?? process.env.AI_USAGE_AGENT ?? null,
  };
  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    await saveRow(aiCallRow({ ...base, status: failureStatus(error), durationMs: Date.now() - started }));
    throw error;
  }
  let body, status = "ok";
  if (!response.ok) status = "http";
  else if ((response.headers.get("content-type") ?? "").includes("json")) {
    try { body = await response.clone().json(); } catch (error) { if (failureStatus(error) === "timeout") status = "timeout"; }
  } else body = {};
  await saveRow(aiCallRow({ ...base, status, httpStatus: response.status, durationMs: Date.now() - started, body }));
  return response;
}
