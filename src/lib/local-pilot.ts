import "server-only";
export function localPilotEnabled() {
  try { return process.env.AUTH_LOCAL_PILOT === "true" && ["localhost","127.0.0.1","[::1]"].includes(new URL(process.env.BETTER_AUTH_URL ?? "").hostname); }
  catch { return false; }
}
