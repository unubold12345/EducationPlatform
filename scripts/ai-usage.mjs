// AI usage log maintenance for the local database (see scripts/lib/ai-call.mjs and /admin?tab=ai).
//
//   npm run ai:usage -- balance   reads the DeepSeek account balance (free, no tokens) and stores it, so the admin page
//                                 can compare money that left the account with the calls the log recorded
//   npm run ai:usage -- flush     moves rows kept in artifacts/ai-usage-unsaved.jsonl (database was down) into the table
//   node scripts/ai-usage.mjs record   one call made by a Python script, as JSON on stdin (scripts/lib/ai_call.py)
//
// Reads DEEPSEEK_API_KEY from the environment or .env.local without printing it.
import { existsSync, readFileSync, renameSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import pg from "pg";
import { aiCallRow, aiEnvironment, isBillable, readBalances } from "../src/modules/ai-usage/core.ts";
import { UNSAVED_FILE, localDatabaseUrl, saveRow } from "./lib/ai-call.mjs";

const command = process.argv[2];

function deepseekKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY.trim();
  if (!existsSync(".env.local")) return "";
  return readFileSync(".env.local", "utf8").match(/^DEEPSEEK_API_KEY=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "") ?? "";
}

if (command === "balance") {
  const key = deepseekKey();
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set (.env.local).");
  const response = await fetch("https://api.deepseek.com/user/balance", { headers: { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("DeepSeek balance HTTP " + response.status);
  const balances = readBalances(await response.json());
  const pick = balances.find(row => row.currency === "USD") ?? balances[0];
  if (!pick) throw new Error("DeepSeek returned no balance.");
  const db = new pg.Client({ connectionString: localDatabaseUrl() });
  await db.connect();
  try {
    await db.query(`INSERT INTO "AiBalance" ("id","createdAt","provider","currency","totalMicros","environment") VALUES ($1,now(),'deepseek',$2,$3,'local')`, [randomUUID(), pick.currency, pick.totalMicros.toString()]);
  } finally { await db.end(); }
  console.log(`DeepSeek balance ${(Number(pick.totalMicros) / 1e6).toFixed(2)} ${pick.currency} stored.`);
} else if (command === "record") {
  // One request made by a non-Node script (scripts/lib/ai_call.py), as JSON on stdin; priced by the same rules.
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const call = JSON.parse(input);
  const row = aiCallRow({ ...call, origin: "script", environment: aiEnvironment(process.env), billable: isBillable(call.provider, call.url), at: new Date(call.at), agent: call.agent ?? process.env.AI_USAGE_AGENT ?? null });
  await saveRow(row);
} else if (command === "flush") {
  if (!existsSync(UNSAVED_FILE)) { console.log("Nothing to flush."); process.exit(0); }
  const moving = UNSAVED_FILE + "." + Date.now();
  renameSync(UNSAVED_FILE, moving);
  const rows = readFileSync(moving, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line));
  let saved = 0;
  for (const row of rows) if (await saveRow({ ...row, createdAt: new Date(row.createdAt) })) saved++;
  console.log(`${saved} of ${rows.length} rows moved into AiCall; ${rows.length - saved} kept in ${path.basename(UNSAVED_FILE)}. Old file: ${path.basename(moving)}.`);
} else {
  console.log("Usage: npm run ai:usage -- balance | flush | record");
  process.exit(1);
}
