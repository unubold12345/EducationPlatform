// One entry point for local checks. Stops at the first failure and prints timings.
//   npm run check                  lint, typecheck, unit tests
//   npm run check -- admin entrance  the above, then those browser groups
//   npm run check:push             the above, a production build and the core group
//   npm run check:all              the above and every local browser group
// Browser suites run on a private server on CHECK_PORT, so a running preview is left alone.
import { spawn, spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const groups = {
  core: ["browser", "accounts", "exams"],
  vocabulary: ["vocabulary"],
  myexams: ["my_exams"],
  entrance: ["entrance_mocks"],
  mocks: ["additional_exams"],
  jlpt: ["jlpt"],
  practice: ["exam_practice"],
  admin: ["admin", "publishing"],
  billing: ["payments", "subscriptions"],
  account: ["profile", "demo_accounts"],
  ui: ["theme", "homepage_polish"],
  writing: ["writing_lab"],
};
const args = process.argv.slice(2);
const flags = new Set(args.filter(arg => arg.startsWith("--")));
const wanted = args.filter(arg => !arg.startsWith("--"));
for (const flag of flags) if (!["--push", "--all"].includes(flag)) throw new Error("Unknown flag: " + flag);
for (const name of wanted) if (!groups[name]) throw new Error(`Unknown group "${name}". Groups: ${Object.keys(groups).join(", ")}`);
const selected = flags.has("--all") ? Object.keys(groups) : [...new Set([...(flags.has("--push") ? ["core"] : []), ...wanted])];
const suites = selected.flatMap(name => groups[name]);

const port = process.env.CHECK_PORT ?? "3007";
const base = "http://localhost:" + port;
const timings = [];
function step(label, command, commandArgs, options = {}) {
  const started = Date.now();
  console.log(`\n--- ${label}`);
  // npm needs a shell on Windows; join the fixed arguments to avoid Node's shell-argument warning.
  const result = options.shell
    ? spawnSync([command, ...commandArgs].join(" "), { stdio: "inherit", shell: true, env: process.env })
    : spawnSync(command, commandArgs, { stdio: "inherit", env: options.env ?? process.env });
  const seconds = Math.round((Date.now() - started) / 1000);
  timings.push(`${label} ${seconds}s`);
  if (result.status !== 0) {
    console.error(`\nFAILED: ${label}`);
    return false;
  }
  return true;
}
function finish(code) {
  console.log(`\n${code ? "FAILED" : "PASSED"} · ${timings.join(" · ")}`);
  process.exit(code);
}
function newestSource(path) {
  return readdirSync(path, { withFileTypes: true }).reduce((latest, entry) => {
    const full = join(path, entry.name);
    return Math.max(latest, entry.isDirectory() ? newestSource(full) : statSync(full).mtimeMs);
  }, 0);
}
function buildIsStale() {
  try { return newestSource("src") > statSync(".next/BUILD_ID").mtimeMs; } catch { return true; }
}
async function health() {
  try {
    const response = await fetch(base + "/api/health", { signal: AbortSignal.timeout(3000) });
    return await response.json();
  } catch { return null; }
}

for (const [label, script] of [["lint", "lint"], ["typecheck", "typecheck"], ["unit", "test"]]) {
  if (!step(label, "npm", ["run", script], { shell: true })) finish(1);
}
if (!suites.length) finish(0);
if ((flags.size || buildIsStale()) && !step("build", "npm", ["run", "build"], { shell: true })) finish(1);
if (await health()) {
  console.error(`Port ${port} is already in use. Set CHECK_PORT to a free port.`);
  finish(1);
}

// Suites test the real open-sitting block, so the development override is always off here.
const env = { ...process.env, TEST_BASE_URL: base, BETTER_AUTH_URL: base, PYTHONIOENCODING: "utf-8", DEV_PRACTICE_DURING_MOCK: "false" };
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], { env, stdio: "ignore" });
function stopServer() {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill();
}
let code = 0;
try {
  let state = null;
  for (let i = 0; i < 40 && !state; i++) {
    state = await health();
    if (!state) await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!state?.ok) {
    console.error(state ? "The local database is down. Run: npm run db:stop, then npm run db:start." : "The server did not start.");
    code = 1;
  } else {
    for (const suite of suites) {
      if (!step(suite, "python", [`tests/${suite}_smoke.py`], { env })) { code = 1; break; }
    }
  }
} finally {
  stopServer();
}
finish(code);
