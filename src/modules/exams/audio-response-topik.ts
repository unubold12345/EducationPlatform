import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted TOPIK Ⅰ or Ⅱ recording from assets/topik-audio (scripts/generate-topik-audio.py).
// Only the `/audio/topik` routes import this, so only they bundle that folder.
export async function topikAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "topik-audio", filename)), request);
}
