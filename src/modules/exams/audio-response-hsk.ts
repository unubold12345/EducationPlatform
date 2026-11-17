import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted HSK 1 or HSK 2 recording from assets/hsk-audio (scripts/generate-hsk-audio.py, generate-hsk2-audio.py).
// Only the `/audio/hsk` routes import this, so only they bundle that folder.
export async function hskAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "hsk-audio", filename)), request);
}
