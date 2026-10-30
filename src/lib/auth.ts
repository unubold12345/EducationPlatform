import "server-only";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";
import {localPilotEnabled,hostedPilotEnabled} from "./local-pilot";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { authFeatures, isDemoEmail, verificationAllowed } from "./auth-features";
import { scheduleAuthEmail } from "./auth-email";
import { accountLinkingPolicy, validateGoogleIdentity } from "./auth-account-policy";
import { recordUserEvent } from "./user-events";

function createAuth() {
  const baseURL = process.env.BETTER_AUTH_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!baseURL || !secret || secret.length < 32) throw new Error("EducationPlatform authentication settings are missing or invalid.");
  // Hosted test pilot is an explicit owner-selected mode, not a verified-email launch.
  if (!localPilotEnabled()&&!hostedPilotEnabled()) throw new Error("EducationPlatform pilot authentication is not enabled for this origin.");
  const features = authFeatures(process.env);
  if (process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true" && !features.email) throw new Error("Email verification requires a configured sender.");
  return betterAuth({
    appName: "EducationPlatform",
    baseURL,
    secret,
    trustedOrigins:[new URL(baseURL).origin],
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 128,
      autoSignIn: !features.requireVerification,
      resetPasswordTokenExpiresIn: 15 * 60, revokeSessionsOnPasswordReset: true,
      ...(features.email ? { sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => scheduleAuthEmail("reset", user, url) } : {}),
    },
    ...(features.email ? { emailVerification: {
      sendOnSignUp: true, autoSignInAfterVerification: false, expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => scheduleAuthEmail("verify", user, url),
    } } : {}),
    socialProviders: features.google ? { google: {
      clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account", requireEmailVerification: true,
    } } : {},
    // suspendedAt is set only by admins (input:false) and travels with the session user, so every
    // session check can refuse a suspended account without another query.
    user: { validateUserInfo: validateGoogleIdentity, additionalFields: { suspendedAt: { type: "date", required: false, input: false } } },
    account: { accountLinking: accountLinkingPolicy },
    databaseHooks: {
      user: { create: { after: async (user, ctx) => { await recordUserEvent(user.id, "sign-up", ctx); } } },
      session: { create: {
        before: async session => {
          const user = await getDb().user.findUnique({ where: { id: session.userId }, select: { email: true, emailVerified: true, suspendedAt: true } });
          if (user?.suspendedAt) throw new APIError("FORBIDDEN", { code: "ACCOUNT_SUSPENDED", message: "This account is suspended." });
          if (features.requireVerification && (!user || !verificationAllowed(user, process.env))) throw new APIError("FORBIDDEN", { code: "EMAIL_NOT_VERIFIED", message: "Verify your email before signing in." });
        },
        after: async (session, ctx) => { await recordUserEvent(session.userId, "sign-in", ctx, { ipAddress: session.ipAddress, userAgent: session.userAgent }); },
      } },
    },
    hooks: { after: createAuthMiddleware(async ctx => {
      if (ctx.path !== "/change-password" || !ctx.context.session) return;
      await recordUserEvent(ctx.context.session.user.id, "password-change", ctx);
    }), before: createAuthMiddleware(async ctx => {
      if (!features.hostedDemo) return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (ctx.path === "/sign-up/email" && isDemoEmail(email)) throw new APIError("FORBIDDEN", { message: "Reserved demo account" });
      if (["/request-password-reset", "/send-verification-email"].includes(ctx.path) && isDemoEmail(email)) return ctx.json({ status: true, message: "If this email exists, check your inbox." });
      if (["/update-user", "/change-password", "/set-password", "/change-email", "/delete-user", "/link-social", "/unlink-account"].includes(ctx.path)) {
        const current = await getSessionFromCtx(ctx);
        if (current && isDemoEmail(current.user.email)) throw new APIError("FORBIDDEN", { message: "Shared demo profiles cannot be changed." });
      }
    }) },
    advanced: { cookiePrefix: "education-platform" },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true, storage: "database", window: 60, max: 100,
      customRules: { "/sign-up/email": { window: 60, max: 5 }, "/sign-in/email": { window: 60, max: 10 }, "/request-password-reset": { window: 60, max: 5 }, "/send-verification-email": { window: 60, max: 3 } },
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(); }

