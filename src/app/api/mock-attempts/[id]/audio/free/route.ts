import { attemptAudio } from "@/modules/exams/audio-handlers";
import { freeAudioResponse } from "@/modules/exams/audio-response-free";
export const runtime="nodejs";
// The free half-length mocks only (IELTS, JLPT, HSK); a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  return attemptAudio(request,(await params).id,"free",freeAudioResponse);
}
