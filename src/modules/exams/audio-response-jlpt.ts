import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted JLPT audio-revision-2 recording from assets/jlpt-audio (scripts/generate-jlpt-audio-v2.py).
// Only the `/audio/jlpt` routes import this, so only they bundle that folder; revision 1 stays in assets/exams.
export async function jlptAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "jlpt-audio", filename)), request);
}
