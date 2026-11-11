import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordingResponse } from "./audio-range";

// Serves one allowlisted recording from assets/exams (IELTS 01–06 and JLPT). Only the `/audio` routes import
// this, so only they bundle that folder; IELTS 07–12 live in assets/ielts-forms (audio-response-forms.ts).
export async function listeningAudioResponse(filename: string, request: Request) {
  return recordingResponse(await readFile(path.join(process.cwd(), "assets", "exams", filename)), request);
}
