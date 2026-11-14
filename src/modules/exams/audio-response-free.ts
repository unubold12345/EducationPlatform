import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted free-mock recording from assets/free-audio (scripts/generate-free-audio.py).
// Only the `/audio/free` routes import this, so only they bundle that folder.
export async function freeAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "free-audio", filename)), request);
}
