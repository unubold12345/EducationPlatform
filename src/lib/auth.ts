import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";
import {localPilotEnabled,hostedPilotEnabled} from "./local-pilot";

function createAuth() {
  const baseURL = process.env.BETTER_AUTH_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!baseURL || !secret || secret.length < 32) throw new Error("EducationPlatform authentication settings are missing or invalid.");
  // Hosted test pilot is an explicit owner-selected mode, not a verified-email launch.
  if (!localPilotEnabled()&&!hostedPilotEnabled()) throw new Error("EducationPlatform pilot authentication is not enabled for this origin.");
  return betterAuth({
    appName: "EducationPlatform",
    baseURL,
    secret,
    trustedOrigins:[new URL(baseURL).origin],
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

