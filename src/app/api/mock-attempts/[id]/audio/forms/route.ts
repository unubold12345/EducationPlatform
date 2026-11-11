import { attemptAudio } from "@/modules/exams/audio-handlers";
import { formsAudioResponse } from "@/modules/exams/audio-response-forms";
export const runtime="nodejs";
// IELTS Mocks 07–12 only; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  return attemptAudio(request,(await params).id,"forms",formsAudioResponse);
}
