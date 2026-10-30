// Classroom load test: N simulated students sign in at once, open the exam pages, unlock a mock
// with the simulated payment, start it and autosave every 10 seconds like the real exam page.
//
//   node scripts/load-test.mjs --setup  --students 100            create QA accounts (once)
//   node scripts/load-test.mjs --students 100 --minutes 5          run the test
//
// Accounts are reserved qa-load-NNN@example.invalid users kept in ignored artifacts/load-test/.
// Every request leaves this machine from one IP, so this is also the "one school network" case.
// Local-only by default; a remote target needs LOAD_TEST_ALLOW_REMOTE=1 and owner approval.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const flag = name => args.includes("--" + name);
const option = (name, fallback) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : fallback; };
const BASE = (option("base", process.env.TEST_BASE_URL ?? "http://localhost:3001")).replace(/\/$/, "");
const STUDENTS = Number(option("students", 100));
const MINUTES = Number(option("minutes", 5));
const RAMP = Number(option("ramp", 30));
const SLUG = option("slug", "sat-full-01");
const DIR = "artifacts/load-test", ACCOUNTS = DIR + "/accounts.json";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(BASE).hostname) && process.env.LOAD_TEST_ALLOW_REMOTE !== "1") {
  console.error("Refusing a non-local target. Set LOAD_TEST_ALLOW_REMOTE=1 only for an approved staging deployment.");
  process.exit(2);
}
mkdirSync(DIR, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const stats = new Map();
function record(label, status, ms) {
  const row = stats.get(label) ?? { label, count: 0, ok: 0, limited: 0, client: 0, server: 0, failed: 0, times: [] };
  row.count++; row.times.push(ms);
  if (status === 0) row.failed++; else if (status === 429) row.limited++; else if (status >= 500) row.server++; else if (status >= 400) row.client++; else row.ok++;
  stats.set(label, row);
}

// A tiny cookie-keeping client per student.
function client() {
  const jar = new Map();
  return async function call(label, path, { method = "GET", body } = {}) {
    const started = performance.now();
    try {
      const response = await fetch(BASE + path, {
        method, redirect: "manual", signal: AbortSignal.timeout(30000),
        headers: { Origin: BASE, Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "), ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      for (const line of response.headers.getSetCookie()) { const [pair] = line.split(";"); const at = pair.indexOf("="); jar.set(pair.slice(0, at), pair.slice(at + 1)); }
      const text = await response.text();
      record(label, response.status, performance.now() - started);
      let data = null; try { data = JSON.parse(text); } catch {}
      return { status: response.status, data };
    } catch {
      record(label, 0, performance.now() - started);
      return { status: 0, data: null };
    }
  };
}

if (flag("setup")) {
  const existing = existsSync(ACCOUNTS) ? JSON.parse(readFileSync(ACCOUNTS, "utf8")) : { password: "Load-Test-" + randomUUID(), emails: [] };
  for (let i = existing.emails.length; i < STUDENTS; i++) {
    const email = `qa-load-${String(i + 1).padStart(3, "0")}-${randomUUID().slice(0, 6)}@example.invalid`;
    const result = await client()("sign-up", "/api/auth/sign-up/email", { method: "POST", body: { name: `Load Student ${i + 1}`, email, password: existing.password } });
    if (result.status === 429) { i--; await sleep(10000); continue; }
    if (result.status !== 200) { console.error("Sign-up failed with HTTP", result.status); process.exit(1); }
    existing.emails.push(email); writeFileSync(ACCOUNTS, JSON.stringify(existing));
    process.stdout.write(`\rcreated ${existing.emails.length}/${STUDENTS}`);
    await sleep(2100);
  }
  console.log(`\n${existing.emails.length} load-test accounts ready in ${ACCOUNTS}`);
  process.exit(0);
}

if (!existsSync(ACCOUNTS)) { console.error("Run with --setup first."); process.exit(1); }
const { password, emails } = JSON.parse(readFileSync(ACCOUNTS, "utf8"));
if (emails.length < STUDENTS) { console.error(`Only ${emails.length} accounts; run --setup --students ${STUDENTS}.`); process.exit(1); }

const deadline = Date.now() + RAMP * 1000 + MINUTES * 60000;
let saves = 0, conflicts = 0, finishedEarly = 0, blocked = 0;
async function student(index) {
  await sleep(Math.random() * RAMP * 1000);
  const call = client();
  const signIn = await call("sign-in", "/api/auth/sign-in/email", { method: "POST", body: { email: emails[index], password } });
  if (signIn.status !== 200) { blocked++; return; }
  await call("page /exams", "/exams");
  await call("session check", "/api/auth/get-session");
  await call("page briefing", "/exams/" + SLUG);
  const order = await call("mock order", "/api/mock-payments", { method: "POST", body: { slug: SLUG } });
  if (order.data?.id && order.data.status !== "PAID") await call("mock confirm", `/api/mock-payments/${order.data.id}/confirm`, { method: "POST", body: { decision: "success" } });
  const start = await call("mock start", "/api/mock-attempts", { method: "POST", body: { slug: SLUG } });
  if (!start.data?.id) { blocked++; return; }
  const endpoint = "/api/mock-attempts/" + start.data.id;
  let state = (await call("mock load", endpoint)).data;
  for (let tick = 0; Date.now() < deadline; tick++) {
    await sleep(10000);
    if (!state?.stage || state.finishedAt) { finishedEarly++; return; }
    const questions = state.stage.questions ?? [];
    if (tick % 2 === 0 && questions.length) {
      const q = questions[tick % questions.length];
      const responses = { ...Object.fromEntries(Object.entries(state.responses ?? {}).filter(([id]) => questions.some(item => item.id === id))), [q.id]: q.options?.[0] ?? "1" };
      const saved = await call("autosave", endpoint, { method: "PATCH", body: { revision: state.revision, stageId: state.stage.id, responses, flags: [] } });
      if (saved.status === 409) { conflicts++; state = (await call("mock load", endpoint)).data; }
      else if (saved.data) { saves++; state = saved.data; }
    } else {
      const synced = await call("sync", endpoint);
      if (synced.data) state = synced.data;
    }
  }
}

const percentile = (values, p) => { if (!values.length) return 0; const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.ceil(p / 100 * sorted.length) - 1)]; };
console.log(`Load test: ${STUDENTS} students, ${RAMP}s ramp, ${MINUTES} min of exam autosave against ${BASE} (${SLUG})`);
const started = Date.now();
await Promise.all(Array.from({ length: STUDENTS }, (_, i) => student(i)));
const rows = [...stats.values()].map(row => ({ label: row.label, count: row.count, ok: row.ok, "429": row.limited, "4xx": row.client, "5xx": row.server, failed: row.failed, p50: Math.round(percentile(row.times, 50)), p95: Math.round(percentile(row.times, 95)), max: Math.round(Math.max(...row.times)) }));
console.table(rows);
const total = rows.reduce((sum, row) => sum + row.count, 0), bad = rows.reduce((sum, row) => sum + row["429"] + row["5xx"] + row.failed, 0);
const summary = { base: BASE, students: STUDENTS, rampSeconds: RAMP, minutes: MINUTES, slug: SLUG, seconds: Math.round((Date.now() - started) / 1000), requests: total, requestsPerSecond: +(total / ((Date.now() - started) / 1000)).toFixed(1), errorRate: +(bad / Math.max(total, 1) * 100).toFixed(2), studentsBlocked: blocked, saves, conflicts, finishedEarly, rows };
console.log(`requests ${total} · ${summary.requestsPerSecond}/s · errors (429/5xx/failed) ${summary.errorRate}% · students blocked ${blocked}/${STUDENTS} · saves ${saves} · conflicts ${conflicts}`);
const file = `${DIR}/result-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify(summary, null, 2));
console.log("Saved", file);
process.exit(bad / Math.max(total, 1) > 0.01 || blocked ? 1 : 0);
