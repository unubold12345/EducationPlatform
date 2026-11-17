import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted TOEFL recording from assets/toefl-audio (scripts/build-toefl-mocks.mjs copies the pack's MP3s).
// Only the `/audio/toefl` routes import this, so only they bundle that folder.
export async function toeflAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "toefl-audio", filename)), request);
}
