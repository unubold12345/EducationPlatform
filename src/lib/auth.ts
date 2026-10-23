import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";

function createAuth() {
  const baseURL = process.env.BETTER_AUTH_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!baseURL || !secret || secret.length < 32) throw new Error("Run EducationPlatform local environment setup first.");
  const localPilot = process.env.AUTH_LOCAL_PILOT === "true" && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname);
  // Fail closed until a real mail provider, verification and recovery are configured.
  if (!localPilot) throw new Error("Public authentication is not configured; local pilot only.");
  return betterAuth({
    appName: "EducationPlatform",
    baseURL,
    secret,
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    advanced: { cookiePrefix: "education-platform" },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true, storage: "database", window: 60, max: 100,
      customRules: { "/sign-up/email": { window: 60, max: 5 }, "/sign-in/email": { window: 60, max: 10 } },
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(); }

