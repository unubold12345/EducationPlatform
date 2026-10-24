// Explicit owner-authorized public fixtures. No history, access grants or admin rights are copied.
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parse } from "dotenv";
import { Client } from "pg";
import { hashPassword, verifyPassword } from "better-auth/crypto";

if (!process.argv.includes("--confirm-hosted-demo")) throw new Error("Explicit hosted-demo confirmation is required.");
const env = parse(await readFile(new URL("../.env.vercel.local", import.meta.url), "utf8"));
const database = new URL(env.DATABASE_URL);
if (env.BETTER_AUTH_URL !== "https://education-platform-seven-neon.vercel.app" || database.hostname.replace("-pooler.", ".") !== "ep-wandering-surf-aoura6ip.c-2.ap-southeast-1.aws.neon.tech" || database.pathname !== "/education_app") throw new Error("Unexpected hosted EducationPlatform target.");
const accounts = JSON.parse(await readFile(new URL("../src/data/demo-accounts.json", import.meta.url), "utf8"));
if (accounts.length !== 5 || accounts.some((a, i) => a.email !== `qa-demo-0${i + 1}@example.invalid`)) throw new Error("Unexpected demo fixture list.");
const db = new Client({ connectionString: env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  for (const account of accounts) {
    const existing = (await db.query('SELECT id FROM "User" WHERE email=$1', [account.email])).rows[0];
    if (existing) {
      const admin = await db.query('SELECT 1 FROM "AdminMembership" WHERE "userId"=$1', [existing.id]);
      const credential = (await db.query('SELECT password FROM "Account" WHERE "userId"=$1 AND "providerId"=\'credential\'', [existing.id])).rows[0];
      if (admin.rowCount || !credential?.password || !await verifyPassword({ hash: credential.password, password: account.password })) throw new Error("Existing demo differs from the approved learner fixture; preserved without changes.");
    } else {
      const id = randomUUID();
      await db.query('INSERT INTO "User" (id,name,email,"emailVerified","createdAt","updatedAt") VALUES ($1,$2,$3,false,now(),now())', [id, account.name, account.email]);
      await db.query('INSERT INTO "Account" (id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES ($1,$2,\'credential\',$2,$3,now(),now())', [randomUUID(), id, await hashPassword(account.password)]);
    }
  }
  await db.query("COMMIT");
  console.log("Five hosted learner demos provisioned/preserved; emailVerified remains false; no admin grants or password resets.");
} catch (error) { await db.query("ROLLBACK"); throw error; }
finally { await db.end(); }
