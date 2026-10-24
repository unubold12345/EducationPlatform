import "server-only";
import { after } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { authFeatures, isDemoEmail, isReservedTestEmail } from "./auth-features";
import { authEmailMessage, deliverAuthEmail, deliverGmailEmail } from "./auth-email-transport";

export function scheduleAuthEmail(kind: "verify" | "reset", user: { email: string }, url: string) {
  const config = authFeatures(process.env);
  // Reserved shared demos have no mailbox. Never claim their email was verified.
  if (config.hostedDemo && isDemoEmail(user.email)) return;
  if (config.emailTransport !== "outbox" && isReservedTestEmail(user.email)) return;
  const message = authEmailMessage({ kind, to: user.email, url }, process.env.BETTER_AUTH_URL!);
  after(async () => {
    try {
      if (config.outbox) {
        const directory = path.join(process.cwd(), "artifacts", "auth-outbox");
        await mkdir(directory, { recursive: true });
        await appendFile(path.join(directory, "messages.jsonl"), JSON.stringify({ ...message, kind, createdAt: new Date().toISOString() }) + "\n");
      } else if (config.emailTransport === "gmail") {
        await deliverGmailEmail(message, { user: config.gmailUser, appPassword: process.env.GMAIL_APP_PASSWORD!, from: config.emailFrom });
      } else {
        await deliverAuthEmail(message, { key: process.env.RESEND_API_KEY!, from: process.env.AUTH_EMAIL_FROM! });
      }
    } catch { console.error("EducationPlatform authentication email could not be delivered"); }
  });
}
