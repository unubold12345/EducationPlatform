import "server-only";
// Byte-range response for one recording, so the browser can seek. No file access here on purpose: each audio
// route imports a reader for its own folder (audio-response.ts or audio-response-forms.ts), and the build bundles
// only the folder that route reads. A shared module that read files would pull every folder into every route.
export function recordingResponse(data: Buffer<ArrayBuffer>, request: Request) {
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
