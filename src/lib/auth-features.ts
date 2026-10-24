import { pilotConfig } from "./pilot-config.ts";

type Env = Record<string, string | undefined>;
export function isDemoEmail(email: string) {
  return /^qa-demo-0[1-5]@example\.invalid$/.test(email.toLowerCase());
}
export function isReservedTestEmail(email: string) {
  return email.trim().toLowerCase().endsWith(".invalid");
}
export function authFeatures(env: Env) {
  const pilot = pilotConfig(env);
  const outbox = pilot.local && !env.VERCEL && env.AUTH_EMAIL_TEST_MODE === "true";
  const sender = env.AUTH_EMAIL_FROM?.trim() ?? "";
  const senderValid = /^(?:[^<>\r\n]+ <)?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/.test(sender);
  const gmailUser = env.GMAIL_USER?.trim().toLowerCase() ?? "";
  const appPassword = env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "") ?? "";
  const gmail = !outbox && pilot.local && !env.VERCEL && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmailUser) && /^[a-z0-9]{16}$/i.test(appPassword);
  const resend = (pilot.local || pilot.hosted) && Boolean(senderValid && env.RESEND_API_KEY?.trim());
  const emailTransport = outbox ? "outbox" : gmail ? "gmail" : resend ? "resend" : null;
  const email = emailTransport !== null;
  return {
    email, outbox, emailTransport, gmailUser,
    emailFrom: gmail ? `EducationPlatform <${gmailUser}>` : sender,
    requireVerification: email && (pilot.hosted || env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true"),
    google: Boolean((pilot.local || pilot.hosted) && env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim()),
    hostedDemo: pilot.hosted && env.AUTH_HOSTED_DEMO_ACCOUNTS === "true",
  };
}
export function verificationAllowed(user: { email: string; emailVerified: boolean }, env: Env) {
  const features = authFeatures(env);
  return !features.requireVerification || user.emailVerified || (features.hostedDemo && isDemoEmail(user.email));
}
