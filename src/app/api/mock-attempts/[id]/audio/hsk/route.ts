import { attemptAudio } from "@/modules/exams/audio-handlers";
import { hskAudioResponse } from "@/modules/exams/audio-response-hsk";
export const runtime="nodejs";
// HSK 1 mocks only; a separate route keeps their recordings in their own function bundle.
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  return attemptAudio(request,(await params).id,"hsk",hskAudioResponse);
}
