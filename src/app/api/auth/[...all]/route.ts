import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { apiFailure, checkOrigin, readJson } from "@/lib/api";
export async function GET(request: Request) { return toNextJsHandler(getAuth()).GET(request); }
export async function POST(request: Request) {
  try {
    // All browser mutations in this app use same-origin JSON, including unauthenticated email requests.
    checkOrigin(request);
    const body = await readJson(request, 32768);
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    return toNextJsHandler(getAuth()).POST(new Request(request.url, { method: "POST", headers, body: JSON.stringify(body) }));
  } catch (error) { return apiFailure(error); }
}

