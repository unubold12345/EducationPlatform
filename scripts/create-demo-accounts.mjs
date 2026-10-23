import "dotenv/config";
import { readFile } from "node:fs/promises";

const base = new URL(process.env.BETTER_AUTH_URL ?? "");
const database = new URL(process.env.DATABASE_URL ?? "");
if (process.env.AUTH_LOCAL_PILOT !== "true" || !["localhost","127.0.0.1","[::1]"].includes(base.hostname) || !["localhost","127.0.0.1"].includes(database.hostname) || database.port !== "51214" || database.pathname !== "/template1") throw new Error("Demo provisioning requires the independent EducationPlatform local pilot.");
const accounts = JSON.parse(await readFile(new URL("../src/data/demo-accounts.json", import.meta.url), "utf8"));
for (const account of accounts) {
  const response = await fetch(new URL("/api/auth/sign-up/email", base), { method:"POST", headers:{"Content-Type":"application/json", Origin:base.origin}, body:JSON.stringify(account), signal:AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok && !["USER_ALREADY_EXISTS","USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"].includes(result.code)) throw new Error(`Demo provisioning failed (${response.status}); retry after the auth rate-limit window if needed.`);
  console.log(`${account.email}: ${response.ok ? "created" : "already exists; preserved"}`);
}
