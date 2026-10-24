import "server-only";
import { getAuth } from "./auth";
import { verificationAllowed } from "./auth-features";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}
export async function apiUser(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new ApiError(401, "Нэвтэрч орно уу.");
  if (!verificationAllowed(session.user, process.env)) throw new ApiError(403, "Имэйлээ баталгаажуулж орно уу.");
  return session.user;
}
export function checkOrigin(request: Request) {
  const expected = process.env.BETTER_AUTH_URL;
  if (!expected || request.headers.get("origin") !== new URL(expected).origin) throw new ApiError(403, "Хүсэлт зөвшөөрөгдөөгүй.");
}
export async function readJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "JSON хүсэлт шаардлагатай.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Хүсэлт хоосон байна.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, "Хүсэлт хэт том байна."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "Хүсэлтийн бүтэц буруу байна."); }
}
export function apiFailure(error: unknown) {
  if (error instanceof ApiError) return privateJson({ error: error.message }, error.status);
  // Do not log request bodies, cookies, connection strings, or credentials.
  console.error("EducationPlatform request failed", error instanceof Error ? error.name : "UnknownError");
  return privateJson({ error: "Түр алдаа гарлаа. Дахин оролдоно уу." }, 503);
}

