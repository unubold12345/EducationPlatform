import { toeflAttemptAudio } from "@/modules/exams/toefl/audio";
import { toeflAudioResponse } from "@/modules/exams/audio-response-toefl";
export const runtime="nodejs";
// TOEFL mocks only; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  return toeflAttemptAudio(request,(await params).id,toeflAudioResponse);
}
