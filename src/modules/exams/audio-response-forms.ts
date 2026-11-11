import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted IELTS 07–12 recording from assets/ielts-forms (scripts/build-ielts-mocks.mjs).
// Only the `/audio/forms` routes import this, so only they bundle that folder.
export async function formsAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "ielts-forms", filename)), request);
}
