import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves one allowlisted bundled recording, with byte ranges so the browser can seek.
export async function listeningAudioResponse(filename: string, request: Request) {
  const data = await readFile(path.join(process.cwd(), "assets", "exams", filename));
  const headers = { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store", "Accept-Ranges": "bytes" };
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
    const start = Number(match[1]), end = Math.min(match[2] ? Number(match[2]) : data.length - 1, data.length - 1);
    if (start > end || start >= data.length) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
    return new Response(data.subarray(start, end + 1), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(data, { headers: { ...headers, "Content-Length": String(data.length) } });
}
