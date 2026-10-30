import "server-only";
import { getDb } from "./db";
import { normalizeIp } from "@/modules/admin/ip";

type Context = { path?: string; request?: Request; headers?: Headers } | null;
const clip = (value: string | null | undefined, max: number) => value ? value.slice(0, max) : null;

// Never let activity logging block sign-in: a failed write is reported without user data.
export async function recordUserEvent(userId: string, type: string, ctx: Context, known: { ipAddress?: string | null; userAgent?: string | null } = {}) {
  const headers = ctx?.headers ?? ctx?.request?.headers;
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || headers?.get("x-real-ip");
  try {
    await getDb().userEvent.create({ data: {
      userId, type,
      ipAddress: clip(normalizeIp(known.ipAddress ?? forwarded), 64),
      userAgent: clip(known.userAgent ?? headers?.get("user-agent"), 400),
      details: ctx?.path ? { path: ctx.path } : undefined,
    } });
  } catch (error) {
    console.error("EducationPlatform activity log failed", error instanceof Error ? error.name : "UnknownError");
  }
}
